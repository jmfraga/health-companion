# Health Companion — Architecture

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (PWA, Next.js)                        │
│  Chat surface · Live profile panel · Drop-zone · Lab table · Timeline│
└─────────────┬───────────────────────────────────────────────────────┘
              │ HTTPS + SSE
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FastAPI (apps/api)                             │
│  /api/chat   /api/ingest-pdf   /api/simulate-months-later           │
│  /api/profile   /api/timeline   /health                             │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  agents/runner.py — orchestrator invocation + SSE relay       │  │
│  │  agents/tools.py   — save_profile_field, log_biomarker,       │  │
│  │                      schedule_screening, fetch_guidelines,    │  │
│  │                      remember                                 │  │
│  └──────────────┬────────────────────────────────────────────────┘  │
└─────────────────┼───────────────────────────────────────────────────┘
                  │ Anthropic SDK (messages.create, multimodal, tools)
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│             Claude Opus 4.7 — single orchestrator agent             │
│   Extended thinking · Tool use · Multimodal PDF · Streaming SSE     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           SQLite (local)                            │
│  profile · biomarkers · lab_reports · episodic_memory ·             │
│  semantic_memory · timeline_events · agent_runs                     │
└─────────────────────────────────────────────────────────────────────┘
```

For the hackathon the app runs on a single machine with SQLite shipped alongside the repo fixtures. Supabase + Postgres are staged in `.env.example` and `config.py` for the post-submission migration path but are not used at demo time.

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
│           ├── models/       # SQLAlchemy models (minimal)
│           ├── schemas/      # Pydantic: HealthProfile, LabAnalysis, etc.
│           ├── routers/      # HTTP endpoints
│           ├── services/     # Business logic
│           └── agents/
│               ├── runner.py     # Invoke orchestrator, relay SSE
│               ├── tools.py      # Typed tool definitions
│               ├── guidelines/   # Static guideline data served by fetch_guidelines
│               └── prompts/      # Single orchestrator prompt (authored by hc-clinical)
├── packages/             # Reserved for shared code (TS or Python) when needed
├── docs/
│   ├── agents.md
│   ├── architecture.md
│   ├── bitacora-desarrollo.md
│   ├── concept-v1.md
│   ├── competitive-analysis-v1.md
│   ├── hackathon-brief-for-claude-code-v1.md
│   └── tesis-del-fundador-v1.md
├── fixtures/             # Laura seed profile + anonymized lab PDF + "3 months later" state
├── ROADMAP.md
├── README.md
└── LICENSE
```

## Data model (v1 — SQLite for hackathon, migrates to Postgres post-submit)

No authentication for the demo. Laura is the only profile. A later `user_id` column drops in cleanly for multi-user.

**profile** — one row.
- `id` (primary key, single seed value)
- `age`, `sex`, `language`, `country`
- `family_history` (JSON)
- `active_conditions` (JSON)
- `medications` (JSON)
- `habits` (JSON)
- `preferences` (JSON)
- `created_at`, `updated_at`

**biomarkers**
- `id`, `name`, `value`, `unit`, `sampled_on`, `source`, `logged_at`

**lab_reports**
- `id`, `file_path`, `analyzed_at`
- `analysis` (JSON — structured `LabAnalysis` output)
- `confidence` (JSON — per-value confidence)

**episodic_memory**
- `id`, `content`, `tags` (JSON), `created_at`

**semantic_memory**
- `id`, `fact`, `tags` (JSON), `confidence`, `last_referenced_at`

**timeline_events**
- `id`, `event_type` (onboarding / screening_scheduled / lab_taken / proactive_message), `payload` (JSON), `occurred_on`

**agent_runs**
- `id`, `agent_name`, `session_id`, `status`
- `started_at`, `finished_at`, `duration_ms`
- `input_tokens`, `output_tokens`, `cost_usd`
- `tool_calls` (JSON), `error` (nullable)

## Event contract (SSE)

| Event | Payload | Consumed by |
|-------|---------|-------------|
| `message_delta` | text chunk | Chat surface |
| `reasoning_delta` | text chunk | "See reasoning" disclosure |
| `tool_use` | `{ name, id, input }` | Live profile panel, timeline, lab table |
| `tool_result` | `{ id, output }` | UI confirmation of write |
| `lab_analysis` | structured `LabAnalysis` | Lab table + interpretation |
| `proactive_message` | `{ text, context_refs }` | Proactive message card (Act 2 close) |
| `done` | — | End of turn |

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| `apps/web` | Vercel (auto-deploy from `main`) | Hackathon demo |
| `apps/api` | Fly.io (single region, persistent volume for SQLite) | Hackathon demo |
| Database | SQLite file in `apps/api/` | Hackathon demo |
| DNS | Cloudflare if a custom domain is used | Optional |

Post-submit migration path (documented but not executed for the hackathon): swap SQLite for Supabase Postgres via the existing `DATABASE_URL`, add Supabase Auth, add Storage buckets for labs and audio, enable Row-Level Security.

## Local dev

```bash
# api
cd apps/api
uv sync
uv run uvicorn api.main:app --reload --port 8000

# web
cd apps/web
npm install
npm run dev
```

## Secrets and environments

- `.env` at repo root holds shared dev secrets (gitignored).
- Each app supports its own `.env.local` overlay.
- Vercel stores frontend secrets. Fly.io stores backend secrets.
- `.env.example` at repo root is the source of truth for what must be set.

## Open architectural questions

- **Vector memory**: pgvector on the semantic-memory table is a natural fit once we migrate off SQLite. For the hackathon, structured JSON retrieval is enough.
- **Web push**: mocked in the UI for the demo; real VAPID setup is a post-submit concern.
- **PII / HIPAA**: not targeting HIPAA or any other clinical-grade framework for the hackathon. The wellness classification (never diagnose, never prescribe, always refer) is the explicit boundary. Documented clearly in the README and in `concept-v1.md`.
