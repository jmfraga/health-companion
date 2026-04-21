# Health Companion — API

FastAPI backend for Health Companion. See the repo root [`README.md`](../../README.md) for product context and [`ROADMAP.md`](../../ROADMAP.md) for current state.

## Run locally

```bash
# From apps/api/
uv sync
uv run uvicorn api.main:app --reload --port 8000
```

`http://localhost:8000/docs` for the OpenAPI UI. `http://localhost:8000/health` for a liveness check.

## Layout

```
src/api/
├── main.py           # FastAPI app factory
├── config.py         # Pydantic settings (env-driven)
├── routers/          # HTTP endpoints
├── models/           # SQLAlchemy models
├── schemas/          # Pydantic request/response
├── services/         # Business logic
└── agents/
    ├── registry.py   # Managed Agent ID cache (TBD)
    ├── runner.py     # Session invocation + SSE relay (TBD)
    └── prompts/      # One module per agent
```

## Environment

Copy `.env.example` at the repo root to `.env` and fill in at minimum:

- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- `DATABASE_URL`
