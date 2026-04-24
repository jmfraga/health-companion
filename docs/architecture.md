# Health Companion — Architecture

A ground-truth reading of what is actually running for the hackathon
submission. Anything still on the wish list lives in
[`../ROADMAP.md`](../ROADMAP.md) or in
[`process/hackathon-plan.md`](./process/hackathon-plan.md), not here.

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (PWA, Next.js 15)                    │
│  Chat · Live profile panel · Drop-zone · Lab table · Timeline ·     │
│  Trends · Recommended screenings · Privacy · How this works         │
└─────────────┬───────────────────────────────────────────────────────┘
              │ HTTPS + SSE
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FastAPI (apps/api)                             │
│  /api/chat    /api/ingest-pdf    /api/simulate-months-later         │
│  /api/simulate-months-later-managed                                 │
│  /api/profile /api/screenings /api/biomarkers /api/timeline         │
│  /api/memory  /api/trends     /api/trends/seed-demo                 │
│  /api/demo/reset                                                    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  agents/runner.py  — orchestrator loop, SSE relay,            │  │
│  │                      state-snapshot injection + caching       │  │
│  │  agents/tools.py   — save_profile_field, schedule_screening,  │  │
│  │                      fetch_guidelines_for_age_sex,            │  │
│  │                      log_biomarker, remember                  │  │
│  │  agents/managed.py — Managed-Agents adapter for the proactive │  │
│  │                      path (experimental)                      │  │
│  └──────────────┬────────────────────────────────────────────────┘  │
└─────────────────┼───────────────────────────────────────────────────┘
                  │ Anthropic SDK (messages.create, multimodal, tools,
                  │                 adaptive extended thinking)
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│             Claude Opus 4.7 — single orchestrator agent             │
│   Extended thinking · Tool use · Multimodal PDF · Streaming SSE     │
│   Static system prompt cached; per-turn state snapshot ephemeral.   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        In-memory state (apps/api)                   │
│    profile · scheduled_screenings · biomarkers ·                    │
│    episodic_memory · semantic_memory · timeline                     │
│    (Python module-level dicts, reset on process restart)            │
└─────────────────────────────────────────────────────────────────────┘
```

For the hackathon the app keeps every piece of clinical state in process
memory. Supabase Auth is wired on the frontend (with a `?demo=1` bypass
for cold-open exploration); per-user data scoping, persistence, and Row-
Level Security land in Phase 1 on Supabase Postgres. Connection strings
and OAuth config are staged in `.env.example` so the migration is a
wiring exercise, not a redesign.

## Repo layout

```
health-companion/
├── apps/
│   ├── web/              # Next.js 15 PWA
│   └── api/              # FastAPI backend
│       └── src/api/
│           ├── main.py
│           ├── config.py
│           ├── routers/      # chat, labs, simulate, simulate_managed,
│           │                 #   trends, demo, health
│           ├── agents/       # runner.py · tools.py · managed.py
│           ├── schemas/      # Pydantic: HealthProfile, LabAnalysis, etc.
│           ├── services/     # Auxiliary logic
│           └── models/       # Reserved for SQLAlchemy when persistence lands
├── packages/             # Reserved for shared code
├── docs/
│   ├── agents.md             # How Opus 4.7 is used
│   ├── architecture.md       # (this file)
│   ├── assets/               # Three-users poster + renders
│   ├── references/           # External source material
│   └── process/              # Thesis, plans, journals, audit checklists
├── ROADMAP.md
├── README.md
└── LICENSE
```

## State model (MVP — in-memory)

There is no database in the MVP. Every store is a Python module-level
collection in `apps/api/src/api/agents/tools.py`:

| Store | Shape | What lives here |
|-------|-------|-----------------|
| `_profile` | `dict[str, Any]` | Dotted-key profile fields the orchestrator saves via `save_profile_field` (age, sex, concerns.*, family_history.*, lifestyle.*). |
| `_scheduled_screenings` | `list[dict]` | `{kind, recommended_by, due_by, queued_at}` rows populated by `schedule_screening`. |
| `_biomarkers` | `list[dict]` | `{name, value, unit, sampled_on, source, logged_at}` per measurement; feeds `/api/trends`. |
| `_episodic_memory` / `_semantic_memory` | `list[dict]` | `{content, tags, created_at}`; `remember(memory_type=…)` writes into the right half. |
| `_timeline` | `list[dict]` | `{event_type, payload, occurred_on, created_at}`; onboarding, lab reports, scheduled screenings, proactive messages. |

All stores are cleared by `POST /api/demo/reset` and lost on process
restart. That is deliberate: the hackathon proves the **shape** of the
product (tools, memory, orchestrator, multimodal) without committing to
a persistence model that has to be re-done under pressure.

### Persistence plan (Phase 1, post-submission)

- **Supabase Postgres** for every store above, with a `user_id` column
  keyed to the Supabase Auth JWT. Row-Level Security enforced.
- **pgvector** on `semantic_memory` once retrieval beyond tag-based
  filtering is needed.
- **Supabase Storage** for uploaded lab PDFs and images, so multimodal
  ingestion stops being per-request only.
- **Per-user reset** replacing `POST /api/demo/reset`; judge-mode demo
  bypass gated off in production builds.

Cost and token observability (`agent_runs` audit table, per-turn
input/output tokens, `cost_usd`) is a Phase-1 concern — it is not
implemented today and any document that says otherwise is out of date.

## SSE event contract

| Event | Payload | Consumed by |
|-------|---------|-------------|
| `reasoning_start` / `reasoning_delta` / `reasoning_stop` | text chunk | Opt-in "See reasoning" disclosure |
| `message_delta` | text chunk | Chat surface |
| `tool_use` | `{ id, name, input }` | Live profile panel, timeline, lab table, tool-trace card |
| `tool_result` | `{ id, output? , error? }` | UI confirmation of write |
| `lab_analysis` | structured `LabAnalysis` | Lab table + summary |
| `timeline_event` | one event | Timeline append on proactive |
| `proactive_message` | `{ text, context_refs, next_step, months_later }` | ProactiveLetter / ProactiveMessageCard |
| `profile_snapshot` · `screenings_snapshot` · `biomarkers_snapshot` · `timeline_snapshot` · `memory_snapshot` | snapshot payload | End-of-turn reconciliation |
| `done` | — | Turn lifecycle close |
| `error` | `{ message }` | Soft errors surfaced in the chat |

## Cross-endpoint memory

Each orchestrator turn gets a **state snapshot** injected as the second
block of `system=` with `cache_control: ephemeral`. The static system
prompt is cached on the first block; only the snapshot re-reads fresh
each turn. The snapshot carries profile, biomarkers, scheduled
screenings, the last ~10 timeline entries, and both memory stores so
`/api/chat`, `/api/ingest-pdf`, and `/api/simulate-months-later` see the
same user state regardless of which endpoint produced a given fact.

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| `apps/web` | Vercel (auto-deploy from `main`) | Hackathon demo |
| `apps/api` | Fly.io (single region) | Hackathon demo |
| DNS | Cloudflare | Optional, used only if a custom domain is attached |
| Persistence | None in process memory | Phase 1 migrates to Supabase Postgres |

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

Point the web app at a non-localhost API by setting
`NEXT_PUBLIC_API_URL` in `apps/web/.env.local`. For a judge-mode URL
without Supabase, add `NEXT_PUBLIC_DEMO_BYPASS_AUTH=true` or append
`?demo=1` to the URL at load time.

## Secrets and environments

- `.env` at repo root holds shared dev secrets (gitignored).
- Each app supports its own `.env.local` overlay.
- Vercel stores frontend secrets. Fly.io stores backend secrets.
- `.env.example` at repo root is the source of truth for what must be set.

## Open architectural questions

- **Managed Agents vs Messages API for the orchestrator.** The current
  chat + labs paths use the Messages API directly. A single Managed
  Agents path exists at `/api/simulate-months-later-managed` to keep the
  side-prize narrative honest. The product-wide migration is a Phase-1
  decision contingent on (a) BAA and Zero-Data-Retention coverage for
  Managed Agents on clinical workloads, and (b) whether the MCP tool
  surface buys us enough to justify the hand-off.
- **Vector memory.** pgvector on `semantic_memory` is the natural fit
  once structured JSON retrieval isn't enough.
- **Web push.** Mocked in the UI for the demo; real VAPID setup is a
  post-submit concern.
- **Regulatory posture.** The product is wellness, not a medical
  device. Never diagnoses, never prescribes, always refers. HIPAA /
  COFEPRIS / MDR frameworks are pre-condition work for any
  clinician-facing surface ("The Bridge") and are not engaged today.
