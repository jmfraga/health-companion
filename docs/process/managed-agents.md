# Managed Agents — proactive engine runtime

> Status: shipped in the hackathon MVP as a sibling to the Messages-API proactive endpoint. Frontend toggle is a separate decision.
>
> Tagline: *"Messages API for the turn you hear. Managed Agents for the check-in you receive."*

---

## Why the proactive engine is split onto Managed Agents

(Copied, lightly trimmed, from `development-journal.md` — the second late-night decision on April 21.)

The **hot conversational path** (`/api/chat`, `/api/ingest-pdf`) stays on the Messages API because latency wins there, and because the "See reasoning" disclosure depends on extended-thinking tokens streaming directly to the browser.

The **background proactive loop** moves to Claude Managed Agents because the shape fits without shoehorning:

- **Long-running.** A real proactive session can reason over months of state, pull guidelines, draft, revise.
- **Autonomous.** The user is not at the keyboard. Nobody is waiting on a token-per-second stream.
- **Stateful.** Sessions carry their own history, event stream, and (eventually) file system.
- **Scheduled.** At scale, a cron fires a session per active user per evaluation window. That is exactly what the Managed Agents harness is built for.

In production (Phase 1, see `ROADMAP.md`) this is how every proactive check-in will run. The hackathon version is a first, working demonstration of the split — and makes the project eligible for the **$5,000 "Best use of Claude Managed Agents" side prize**.

---

## Architecture

Two endpoints, identical SSE contract, two different engines behind them:

| Endpoint | Engine | When used |
|---|---|---|
| `POST /api/simulate-months-later` | `anthropic.messages.stream` (Opus 4.7 + tool use) | Fallback; original implementation. Preserved. |
| `POST /api/simulate-months-later-managed` | Claude Managed Agents session | New; stretch goal B. |

The frontend consumes the same events from both. Swapping engines is a one-line change in the client fetch URL.

### Event translation

Managed Agents emits a different event vocabulary (`agent.thinking`, `agent.message`, `session.status_idle`, etc.). The router (`apps/api/src/api/routers/simulate_managed.py`) translates on the fly:

| Managed Agents event | Frontend event |
|---|---|
| `agent.thinking` (first occurrence) | `reasoning_start` + `reasoning_delta` |
| `agent.thinking` (subsequent) | `reasoning_delta` |
| First `agent.message` after thinking | closing `reasoning_stop`, then `message_delta` |
| `agent.message` content blocks | `message_delta` (one per block) |
| `session.status_idle` | drives the final `proactive_message` + `timeline_event` + snapshots + `done` |
| `session.error` / `session.status_terminated` | `error` + best-effort fallback `proactive_message` |

### Structured output

The agent is instructed (in the system-prompt proactive frame, in `managed.py`) to end its turn with a fenced `json` block:

```json
{
  "text": "<2-4 sentence outreach>",
  "context_refs": ["snake_case_ids", "of_prior_facts"],
  "next_step": "<one-line suggested action>"
}
```

The router extracts this object once `status_idle` fires and emits it as the final `proactive_message` event. This replaces the Messages-API endpoint's forced `submit_proactive_message` tool call — Managed Agents doesn't need a custom tool for the same outcome, because the agent is already trained to follow a strict output contract embedded in its system prompt.

---

## The agent and the environment

Defined in `apps/api/src/api/agents/managed.py`.

### Agent — `health-companion-proactive`

- **Model**: `claude-opus-4-7`
- **System prompt**: proactive task frame (authored here) concatenated with the full orchestrator `SYSTEM_PROMPT` from `runner.py`. Same clinical voice, same hard rules, same sanitary-interpreter instinct — plus a strict output contract for the background-session shape.
- **Tools**: `agent_toolset_20260401` (the Managed Agents pre-built toolset — bash, files, web). The first iteration deliberately does not exercise these; state rides in the opening user event. The toolset is enabled so a future iteration can, for instance, fetch a specific guideline page without another registry update.

### Environment — `health-companion-proactive-env`

- `type: cloud`
- `networking: { type: unrestricted }`

Unrestricted network is fine for the beta. When we tighten for production we will scope by allowlist.

---

## The cache

Agent IDs and Environment IDs are **stable across runs** — Managed Agents charges on creation of new resources, so reusing IDs is both cheaper and more hygienic. The registry caches both IDs in:

```
apps/api/.managed_agents_cache.json
```

Layout:

```json
{
  "agent_id": "agent_...",
  "agent_version": "1",
  "environment_id": "env_..."
}
```

The file is in `apps/api/.gitignore`. Do not commit it.

### Rebuilding the cache

When you change anything that affects the agent's behavior — the system prompt, the model, the toolset, the environment networking — you must rebuild the cache so the next request provisions fresh resources:

```bash
rm apps/api/.managed_agents_cache.json
```

The next call to `POST /api/simulate-months-later-managed` will create a new agent + environment and write their IDs back to the file.

### Cost-free development (no live creation tonight)

Set either env flag to block accidental Create API calls:

```bash
export HC_SKIP_MANAGED_AGENTS_CREATE=1
# or
export DRY_RUN=1
```

With the flag set **and no cache file**, the registry raises a clear error instead of charging the account. Remove the flag (and optionally the cache) when you are ready to provision.

---

## Cost model at our scale

From the platform docs (April 2026 beta):

- **Session runtime**: $0.08 per session-hour of container time, billed by the second.
- **Tokens**: regular Opus 4.7 input/output pricing through the agent.
- **Creates**: free; they count against a 60-per-minute org rate limit.

A typical proactive check-in for Health Companion (estimate):

| Line item | Quantity | Unit | Per-session cost |
|---|---|---|---|
| Session-hour (container up ~30 s end to end) | 30 s | $0.08/hr | **~$0.0007** |
| Input tokens (system prompt + state snapshot, ~4k tokens, cached on repeat) | 4k | Opus 4.7 input | **~$0.06** |
| Output tokens (2-4 sentence message + thinking, ~800 tokens) | 0.8k | Opus 4.7 output | **~$0.06** |
| **Total (typical)** | | | **~$0.12** |

With prompt caching on the system prompt and a stable proactive frame, steady-state cost per check-in lands closer to **~$0.05**. The session-hour charge is negligible at our durations; the model tokens dominate.

At Phase 1 scale (200 active users, weekly proactive cadence), that is ~$40–$100/month across the entire base for the proactive engine — well inside the Phase 1 margin envelope.

---

## Beta gotchas discovered during implementation

- **Docs URLs that 404'd.** The specific endpoint reference URLs in `platform.claude.com/docs/en/api/beta-agents-create` / `beta-environments-create` / `beta-sessions-create` / `beta-sessions-events` all returned "Not Found" at implementation time (April 21, 2026, ~01:00 CDMX). The working pages were `platform.claude.com/docs/en/managed-agents/overview`, `.../quickstart`, `.../events-and-streaming`. Code contracts inferred from the quickstart examples and from inspecting the SDK.
- **SDK surface (`anthropic==0.96.0`).** Confirmed attributes: `client.beta.agents`, `client.beta.environments`, `client.beta.sessions`, and `client.beta.sessions.events` with `send` / `stream`. Matches the quickstart Python snippets. No rename needed.
- **Beta header is implicit.** The SDK attaches `anthropic-beta: managed-agents-2026-04-01` automatically on any `client.beta.*` call — no explicit `default_headers` wiring required.
- **Open the stream BEFORE sending the first user event.** The docs are explicit: only events emitted after stream attachment are delivered. Our router obeys this ordering; a naive send-then-stream would drop the entire session.
- **`agent.thinking` events are separate from `agent.message`.** The router brackets them with `reasoning_start` / `reasoning_stop` so the existing "See reasoning" disclosure keeps working.
- **No custom tools this iteration.** The structured output contract is embedded in the system prompt (fenced JSON); no `custom_tool_use` / `user.custom_tool_result` dance is needed. If we later want typed outputs with schema validation at the platform level, we can add a custom tool and react to `agent.custom_tool_use` in the event translator.
- **The `submit_proactive_message` tool lives only on the Messages-API path.** Keeping the two code paths behaviorally compatible required extracting the payload from free-form text here; `simulate.py` retains its forced tool call for shape parity inside the Messages API.

---

## Files

- `apps/api/src/api/agents/managed.py` — idempotent registry, cache, composed system prompt.
- `apps/api/src/api/routers/simulate_managed.py` — the new sibling router.
- `apps/api/src/api/routers/simulate.py` — unchanged Messages-API version, preserved as fallback.
- `apps/api/.gitignore` — excludes the ID cache.
- `apps/api/.managed_agents_cache.json` — local-only; never committed.
