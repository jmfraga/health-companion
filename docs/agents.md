# Health Companion — Agent Design

Health Companion ships with **one runtime agent**: an Opus 4.7 orchestrator with tool use. The product the user experiences is a single companion. The four `hc-*` agents in `~/.claude/agents/` are **for development only** — they are how the team builds the product, not what the patient sees.

This document describes both layers.

---

## Runtime architecture — one orchestrator, several tools

Everything Laura interacts with runs through a single Claude Opus 4.7 agent. That agent:

- Streams responses to the UI over Server-Sent Events.
- Calls typed tools that write to SQLite.
- Exposes its clinical reasoning on demand via a "See reasoning" disclosure powered by extended thinking.
- Reads and writes a curated memory (episodic and semantic) via a `remember` tool it controls.

This is a deliberate simplification from the earlier `concept-v1` sketch that envisioned a fan-out to three runtime subagents (Screening, Lifestyle, Mental Health). That fan-out was removed so the 3-minute demo stays readable and so the clinical voice stays consistent from one turn to the next. The specialist reasoning still happens — it happens inside the orchestrator, shaped by a system prompt that covers screening, lifestyle, and mental-health framings, and visible through the disclosure.

### Model and parameters

- **Model**: `claude-opus-4-7`
- **Max output tokens**: 4096 for chat turns, 8192 for PDF analysis (structured output can grow).
- **Tools**: see below.
- **Extended thinking**: enabled; streamed as its own event channel so the UI can reveal it in the disclosure.

### Tools exposed to the orchestrator

| Tool | Purpose | Writes to |
|------|---------|-----------|
| `save_profile_field(field, value, source)` | Update a field in the canonical health profile. Validated against the `HealthProfile` schema. | `profile` |
| `log_biomarker(name, value, unit, sampled_on, source)` | Insert a biomarker reading. | `biomarkers` |
| `schedule_screening(kind, recommended_by, due_by)` | Queue a recommended screening. Drives the timeline. | `timeline_events` |
| `fetch_guidelines_for_age_sex(age, sex, concern)` | Read-only retrieval of relevant preventive guidelines, returned as structured text for the model to cite. | (none) |
| `remember(memory_type, content, tags)` | The model decides what is worth keeping. `memory_type` is `episodic` (something the user said on date X) or `semantic` (a durable fact). | `episodic_memory`, `semantic_memory` |

Tool names and signatures are locked. Changing them requires `hc-coordinator` approval so the frontend contract stays stable.

### SSE event contract (frontend ↔ backend)

| Event | Payload | Meaning |
|-------|---------|---------|
| `message_delta` | text chunk | Streamed assistant text for the chat surface. |
| `reasoning_delta` | text chunk | Streamed extended thinking, rendered inside the "See reasoning" disclosure. |
| `tool_use` | `{ name, id, input }` | The model is about to call a tool. Frontend uses this to animate the profile panel, the timeline, etc. |
| `tool_result` | `{ id, output }` | Tool finished; frontend confirms the write. |
| `lab_analysis` | structured `LabAnalysis` | Emitted by `POST /api/ingest-pdf` when the PDF extraction completes. |
| `proactive_message` | `{ text, context_refs }` | Emitted by the "3 months later" simulation to trigger the Act 2 close. |
| `done` | — | Turn finished. |

### Memory: episodic vs semantic

The orchestrator calls `remember` when something is worth keeping — it is not a mechanical write-on-every-turn. Entries start as **episodic** (*"Laura told me on April 21 that her mom died of breast cancer at 52"*). A background pass (end of session or on idle) asks the orchestrator to review recent episodic entries and promote distilled facts to **semantic** memory (*"Laura's maternal family history includes breast cancer"*). Semantic memory feeds back into the system prompt as user-specific context.

### Safety boundary

Every clinical response flows through the guardrail authored by `hc-clinical`:
- Never diagnoses. Never prescribes. Always refers.
- Urgent values (glucose > 400, potassium > 6.5, hemoglobin < 7, INR > 5, SpO₂ < 90%, chest pain on exertion, stroke signs, suicidal ideation) trigger a calm escalation to emergency services — that is duty of care, not a guardrail violation.
- Disclaimers are visible in the UI, not buried.

---

## Development team — four Claude Code subagents

These are in `~/.claude/agents/` on the builder's machine. Definitions for each are in `*.md` files with scope, read-first documents, responsibilities, and boundaries. They are invoked through Claude Code's agent tool, not through the app.

| Agent | Role | Model | Color |
|-------|------|-------|-------|
| `hc-coordinator` | Product lead, thesis guardian, delegates to specialists, owns `ROADMAP.md` and the demo script. Juan Manuel's copilot. | opus | cyan |
| `hc-frontend` | Next.js 15 + Tailwind + shadcn/ui. Chat surface, live profile panel, see-reasoning disclosure, PDF drop-zone, lab table, timeline. | sonnet | purple |
| `hc-backend` | FastAPI + SQLite. Orchestrator endpoint with streaming SSE, multimodal PDF ingestion direct to Opus 4.7, tools, memory. | sonnet | blue |
| `hc-clinical` | System prompt, guardrails, sanitary-interpreter rules, screening schedules. Juan Manuel audits every output. | opus | red |

A fifth agent, `hc-debugger`, may be added late in the week when integration edges start cracking.

### Juan Manuel is the fifth agent

The founder — a practicing primary-care physician — sits on the team not as "the user" but as **the fifth agent**. His role is to translate the clinical experience he cultivates with his own patients into something replicable in software. The submission narrates this as the meta-move: *we built this health companion using the same team pattern we want for the product — a coordinator plus specialists. We learned to build health-as-a-team by building it as a team.*

---

## Observability (minimum for hackathon)

Every orchestrator invocation is persisted as an `agent_runs` row in SQLite:

- `id`, `agent_name`, `session_id`
- `status` (running / completed / failed)
- `started_at`, `finished_at`, `duration_ms`
- `input_tokens`, `output_tokens`
- `cost_usd` (computed at Opus 4.7 rates)
- `tool_calls` (JSON)
- `error` (nullable)

Enough for honest cost tracking and a debug trail during the demo.

---

## Cost model (hackathon demo)

Opus 4.7 at $5 / MTok input, $25 / MTok output (April 2026). Extended thinking counts as output tokens.

| Scenario | Typical cost per run |
|----------|---------------------|
| Onboarding turn with tool use | ~$0.02 |
| Full Act 1 (3–4 turns + screening render) | ~$0.05 |
| PDF ingestion with multimodal Opus 4.7 | ~$0.10 |
| Proactive message generation | ~$0.02 |
| Full demo end-to-end | < $0.25 |

Prompt caching (1-hour write) on the shared orchestrator system prompt cuts the input cost on every turn after the first.

---

## Open questions

- **Skills authoring pipeline**: the guideline data that feeds `fetch_guidelines_for_age_sex` could be authored as a Claude Agent Skill if time allows. For the hackathon, it lives as structured JSON in `apps/api/src/api/agents/guidelines/` and is served by the tool. Revisit post-submit.
- **STT**: not in the 2-act demo. If voice lands as a P2 polish, use Web Speech API client-side, not a server-side Whisper call.
- **Prompt caching**: the orchestrator system prompt is expected to be long (~4–6K tokens with guardrails + sanitary interpreter rules + screening context). Turning on 1-hour cache writes is worth the premium even in a single demo session.
