# Health Companion — Architecture

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (PWA, Next.js)                       │
│  Onboarding  │  Labs upload  │  Consult prep  │  Post-consult recap │
└─────────────┬───────────────────────────────────────────────────────┘
              │ HTTPS (JWT from Supabase Auth)
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FastAPI (apps/api)                             │
│  /auth  /profile  /labs  /consultations  /chat                      │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  agents/runner.py  —  Managed Agent invocation + SSE relay    │  │
│  └──────────────┬────────────────────────────────────────────────┘  │
└─────────────────┼───────────────────────────────────────────────────┘
                  │                                           ▲
                  │ Anthropic SDK (beta)                      │
                  ▼                                           │
┌─────────────────────────────────────────────────────────────┴───────┐
│                     Claude Managed Agents                           │
│   LabAnalyzer · ConsultationPrep · PostConsultation · Companion     │
│   (Opus 4.7 · PDF Skill · custom HC Skills · code exec tool)        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           Supabase                                  │
│   Postgres (+pgvector)  │  Auth (Google)  │  Storage (labs, audio)  │
└─────────────────────────────────────────────────────────────────────┘
```

## Repo layout

```
health-companion/
├── apps/
│   ├── web/              # Next.js 15 PWA
│   └── api/              # FastAPI backend
│       └── src/api/
│           ├── main.py
│           ├── config.py
│           ├── db.py
│           ├── models/       # SQLAlchemy
│           ├── schemas/      # Pydantic
│           ├── routers/      # HTTP endpoints
│           ├── services/     # Business logic
│           └── agents/
│               ├── registry.py
│               ├── runner.py
│               └── prompts/  # One file per agent
├── packages/             # Reserved for shared code (TS or Python) when needed
├── skills/               # Custom Claude Skills (hc/lab-patterns, etc.)
├── docs/
│   ├── agents.md
│   └── architecture.md
├── ROADMAP.md
├── README.md
└── LICENSE
```

## Data model (v1 — subject to change)

**users** — mirror of Supabase auth users (`id uuid pk`, `email`, `created_at`).

**health_profiles** — per-user canonical profile. One row per user.
- `user_id` fk
- `age`, `sex`, `language`
- `family_history jsonb` (e.g. `{"diabetes": ["father"], "cancer_colon": ["maternal_grandmother"]}`)
- `active_conditions jsonb` (list of `{name, diagnosed_on, notes}`)
- `medications jsonb` (list of `{name, dose, frequency, started_on, prescribed_by}`)
- `habits jsonb` (sleep, activity, tobacco, alcohol, etc.)
- `preferences jsonb` (tone, notification frequency)
- `updated_at`

**lab_results**
- `id uuid pk`
- `user_id fk`
- `source_file_path` (Supabase Storage URL)
- `analyzed_at`
- `analysis jsonb` (the structured output from LabAnalyzerAgent)
- `agent_run_id fk` → `agent_runs.id`

**consultations**
- `id uuid pk`
- `user_id fk`
- `specialty`, `reason`, `scheduled_for`, `occurred_on`
- `prep_summary jsonb` (from ConsultationPrepAgent)
- `post_summary jsonb` (from PostConsultationAgent)
- `audio_file_path` (nullable)
- `prep_agent_run_id`, `post_agent_run_id`

**agent_runs**
- `id uuid pk`
- `user_id fk`
- `agent_type` (enum)
- `managed_session_id` (nullable — null for non-Managed agents)
- `status` (running / idle / completed / failed)
- `started_at`, `finished_at`, `duration_ms`
- `input_tokens`, `output_tokens`, `session_runtime_seconds`
- `cost_usd`
- `input_hash` (for caching)
- `error` (text, nullable)

**reminders**
- `id uuid pk`
- `user_id fk`
- `kind` (medication / study / follow_up)
- `fires_at`
- `payload jsonb`
- `sent_at` (nullable)

Row-Level Security on every table: `auth.uid() = user_id`.

## Deployment

| Component | Platform |
|-----------|----------|
| `apps/web` | Vercel (PWA, auto-deploys from `main`) |
| `apps/api` | Fly.io or Railway (single region for hackathon; multi-region post-submit) |
| Database + Auth + Storage | Supabase managed |
| DNS | Cloudflare |

## Local dev

```bash
# api
cd apps/api
uv sync
uv run uvicorn api.main:app --reload

# web
cd apps/web
npm install
npm run dev

# Supabase (optional local stack; cloud is fine for hackathon)
supabase start
```

## Secrets & environments

- `.env` at repo root for shared dev secrets (gitignored).
- Each app also supports its own `.env.local` overlay.
- Vercel stores frontend secrets. Fly.io stores backend secrets. Supabase stores DB secrets.
- `.env.example` at repo root is the source of truth for what must be set.

## Open architectural questions

- **Push notifications**: Web Push (VAPID) vs Expo if we go mobile native. Deferred — web push is fine for demo.
- **Search over profile history**: pgvector embeddings of past conversations? Or keep everything structured in jsonb and let Managed Agents search via code execution? Starting with structured jsonb; add vector only if retrieval quality suffers.
- **PII / HIPAA posture**: not targeting HIPAA for hackathon. Disclaimers say "wellness, not medical device." Document the gap clearly for post-hackathon.
