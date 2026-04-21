# Health Companion — Hackathon Roadmap

**Hackathon**: Built with Opus 4.7 (April 21–26, 2026)
**Submission deadline**: Sunday April 26, 8:00 PM EST (7:00 PM CDMX)
**Team**: Juan Manuel Fraga (code) + son (product rebound)

## Demo narrative (the 3-minute story)

> "María, 47 years old, mother of two. Her doctor told her to 'watch her sugar' six months ago. She doesn't know what that means."

1. **Lab explainer** — María uploads her blood work. The app extracts values, compares them against references, and explains what matters in plain language given her age, sex, and her father's diabetes.
2. **Consultation prep** — María tells the app she has a follow-up with her doctor Thursday. The app hands her five pointed questions, a comparison against her labs from six months ago, and a checklist.
3. **Post-consultation memory** — María comes back after the visit and reads what the doctor said to the app. The app organizes it into meds, pending studies, and reminders — and the next time she opens it, it already knows her.

Close on a beat that shows the app now *knows her*: something only the composite of those three interactions makes possible.

---

## Status (live)

| Milestone | Status |
|-----------|--------|
| Repo created (public, Apache 2.0) | ✅ |
| README with product description | ✅ |
| Next.js 15 + TypeScript + Tailwind scaffolded (`apps/web`) | ✅ |
| FastAPI skeleton scaffolded (`apps/api`) with `/health` | ✅ |
| Agent design doc (`docs/agents.md`) | ✅ |
| Supabase project created | ⏳ blocked on user |
| Postgres schema v1 | ⏳ |
| OnboardingAgent v0 | ⏳ |
| Auth (Google) end-to-end | ⏳ |
| LabAnalyzerAgent v0 | ⏳ |
| UI: landing + onboarding flow | ⏳ |
| UI: labs upload + view | ⏳ |
| ConsultationPrepAgent v0 | ⏳ |
| PostConsultationAgent v0 | ⏳ |
| UI: consultation prep + summary | ⏳ |
| Demo video (3 min, Loom) | ⏳ |
| Submission package (video + repo + 100-200w description) | ⏳ |

---

## Parallel workstreams (nights 2–5)

These can proceed independently. On any given night, run 2–3 in parallel (one per person, or via subagents for the more mechanical streams).

### Workstream A — Data & Auth
**Owner**: Juan Manuel (decisions), Claude Code (code)
**Depends on**: Supabase account creation (user action)

1. Create Supabase project `health-companion`.
2. Schema v1 (`users`, `health_profiles`, `lab_results`, `consultations`, `agent_runs`, `reminders`) with migrations in `apps/api/alembic/`.
3. Row-Level Security policies so each user only sees their own rows.
4. Wire Supabase Auth (Google provider) into both Next.js and FastAPI (JWT verification).
5. Storage buckets: `labs/` and `consultations/` with per-user prefixing.

### Workstream B — Agents SDK plumbing
**Owner**: Claude Code (code), Juan Manuel (domain prompts)
**Depends on**: Anthropic API key with Managed Agents access

1. `apps/api/src/api/agents/registry.py` — helpers to create/fetch agent IDs and environment IDs (idempotent, cached).
2. `apps/api/src/api/agents/runner.py` — send events + stream SSE back to the client, persist `AgentRun` rows.
3. Custom Skills authoring scaffold at `skills/` (one folder per skill with `SKILL.md`).
4. One working end-to-end agent invocation from the API (start with OnboardingAgent since it's cheapest to iterate).

### Workstream C — Frontend shell
**Owner**: Claude Code (code)
**Depends on**: nothing, can go first

1. App Router layout with Tailwind + shadcn/ui base.
2. Auth pages (Google sign-in via Supabase).
3. Onboarding chat UI (streaming messages, typing indicator).
4. Labs upload UI (drag-drop + PDF/image preview).
5. Lab results view (structured table + narrative).
6. Consultation prep view (printable checklist).
7. Post-consultation audio recorder or text input + summary display.
8. PWA manifest + basic service worker.

### Workstream D — Agent implementations
**Owner**: Claude Code (code), Juan Manuel (domain review)
**Depends on**: Workstream B complete

1. **OnboardingAgent** (plain chat, not Managed) — prompt + JSON-diff output parser.
2. **LabAnalyzerAgent** (Managed, with PDF Skill) — prompt, Skill scaffolding, structured output schema.
3. **ConsultationPrepAgent** (Managed) — prompt, template per specialty.
4. **PostConsultationAgent** (Managed) — prompt, Whisper integration for audio.
5. **HealthCompanionAgent** (Managed, long-lived) — prompt, delegation logic.

### Workstream E — Deploy + demo
**Owner**: Claude Code (config), Juan Manuel (record)
**Depends on**: enough UI to demo (Workstreams A, C, D partial)

1. Deploy `apps/web` to Vercel.
2. Deploy `apps/api` to Fly.io (or Railway).
3. Custom domain (`hc.jmfraga.dev` or similar).
4. Record demo video (3 min max, Loom).
5. Write submission description (100–200 words).
6. Final pass: README polish, LICENSE verified, .env.example complete, repo is clean.

### Workstream F — Nice-to-have (only if time)

1. Reminder engine (cron + push notifications).
2. Dashboard page showing trends over time.
3. Seguro médico ingestion (PDF → structured coverage).
4. Mobile-native feel tweaks (iOS PWA polish).

---

## Decisions still open

- [ ] App public name (not repo name). Current placeholder: "Health Companion."
- [ ] Primary language at launch. Default: Spanish with English toggle.
- [ ] Demo patient story — is "María" the right archetype, or do we go with something closer to JM's clinical experience?
- [ ] Whether to author custom Skills during hackathon or defer (adds scope).
- [ ] Whether to demo HealthCompanionAgent (the long-lived one) or keep the demo focused on the three specialist agents.

---

## Next session immediate checklist

When we pick up:
1. Confirm Supabase account + project creation (user step).
2. Create Anthropic API key with Managed Agents beta access + add to local `.env`.
3. Build Workstream A.1–A.2 (schema + migrations).
4. Build Workstream B.1–B.2 (agents plumbing).
5. Wire OnboardingAgent end-to-end (happy path only).
6. Commit after each milestone.

---

## Risk register

- **Discord role not assigned** → can't reach mods or office hours. *Mitigation*: ping `#general` Anthropic Discord, reply to acceptance email.
- **Son not registered** → only 1 team member counted. *Mitigation*: register tonight; if blocked, submit as solo.
- **Managed Agents beta access** → hackathon API key may need explicit beta flag enablement. *Mitigation*: verify on first call; have a fallback path using plain `messages.create` if Managed is unavailable.
- **Scope creep** → 5 agents + 3 UI flows + auth + deploy in 5 nights is tight. *Mitigation*: Workstream F is cut-list first. If slipping, drop HealthCompanionAgent from demo, keep the three specialists.
- **Time zone fatigue** → JM works nights in CDMX, deadline is Sunday 7 PM CDMX. *Mitigation*: aim to have submittable version by Saturday night; Sunday is buffer + demo video.
