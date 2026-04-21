# Health Companion — Hackathon Roadmap

**Hackathon**: Built with Opus 4.7 (April 21–26, 2026)
**Submission deadline**: Sunday April 26, 8:00 PM EST (7:00 PM CDMX)
**Presentation**: 3 minutes total, in English, judged by Anthropic.
**Team**: Juan Manuel Fraga (code + clinical voice) + son (product sparring)
**Internal target**: working MVP by **Saturday April 25** so Sunday is buffer + demo video + submission.

## Demo narrative (3 minutes, English, two acts)

> *Laura, 44. Her mother died of breast cancer at 52.*

### Act 1 — Meeting Laura (~45 seconds)

Laura opens the app for the first time and speaks in natural language:
> *"I'm 44, my mom died of breast cancer at 52."*

The side panel builds her profile in real time via **visible tool use** (age, sex, family history, inferred risks). Opus 4.7 proposes a screening calendar in everyday language, with an optional **"See reasoning"** disclosure that reveals the clinical reasoning on demand — the wow that shows extended thinking as a *clinical* artifact, not just a toy.

The act closes with the non-negotiable formula: **educate → contextualize → refer to your doctor.**

### Act 2 — Labs and proactivity (~55 seconds)

Laura drops in a PDF of lab results. **Opus 4.7 reads it multimodally, directly** — no OCR library, no parser. It detects fasting glucose at 118 mg/dL, cross-references with the profile (diabetic father, family history), and explains in warm, non-alarming language.

A ~3-second fade transition: **"3 months later"**. The app now writes to Laura proactively:
> *"You turn 45 next month. Remember what we talked about? Let's schedule that mammogram."*

A visual **timeline** shows the accumulated milestones. The close on the memory moat lands.

### Why these two acts

They carry the three differentiating axes of the product — longitudinal memory, proactivity, clinical accompaniment — inside the 3-minute presentation window. Two wow moments (visible tool use with see-reasoning; multimodal PDF + proactive timeline) instead of four scattered ones. Tighter, deeper, more defensible under judge questioning.

In the submission, narrate the meta-story: *we built this health companion using the same team pattern we want for the product — a coordinator working with specialists. We learned to build health-as-a-team by building it as a team.*

---

## Runtime architecture (revised April 21)

**One Opus 4.7 orchestrator with tool use. No runtime subagents.**

The earlier brief sketched a fan-out to three runtime subagents (Screening, Lifestyle, Mental Health). That design was cut in favor of a single orchestrator to match the 3-minute window and to keep the demo readable. The reasoning that used to belong to the subagents happens inside the orchestrator, visible through the "See reasoning" disclosure.

### Tools exposed to the orchestrator

- `save_profile_field(field, value, source)` — updates the canonical profile.
- `log_biomarker(name, value, unit, sampled_on, source)` — writes lab values.
- `schedule_screening(kind, recommended_by, due_by)` — seeds the timeline.
- `fetch_guidelines_for_age_sex(age, sex, concern)` — retrieves the relevant preventive guideline.
- `remember(memory_type, content, tags)` — the orchestrator decides what is worth keeping as episodic vs semantic memory.

### What the four development agents own

The four agents in `~/.claude/agents/` are for **development only**. They never appear to the user.

- **hc-coordinator** — partners with Juan Manuel, keeps the thesis alive, delegates to the specialists, owns `ROADMAP.md` and the demo script.
- **hc-frontend** — Next.js + Tailwind + shadcn/ui: chat surface, live profile panel, see-reasoning disclosure, PDF drop-zone, lab table, timeline.
- **hc-backend** — FastAPI + SQLite: orchestrator endpoint with streaming SSE, multimodal PDF ingestion direct to Opus 4.7, tool use, episodic / semantic memory.
- **hc-clinical** — system prompt, guardrails, sanitary-interpreter rules, screening schedules, audited by Juan Manuel.

A fifth agent (`hc-debugger`) may be spun up later when integration edges crack.

---

## Status (live)

| Milestone | Status |
|-----------|--------|
| Repo public with Apache 2.0 | ✅ |
| README + medical disclaimers | ✅ |
| Next.js 15 + TypeScript + Tailwind scaffolded | ✅ |
| FastAPI skeleton with `/health` | ✅ |
| Four development agents (`hc-*`) defined | ✅ |
| Founder thesis + concept + competitive analysis + hackathon brief in English | ✅ |
| Development journal (`bitacora-desarrollo.md`) started | ✅ |
| Single-orchestrator runtime architecture captured in `docs/agents.md` | ⏳ |
| SQLite schema v1 + Alembic migration | ⏳ |
| Laura seed fixture + anonymized lab PDF | ⏳ |
| Orchestrator system prompt (authored by hc-clinical, audited by JM) | ⏳ |
| `POST /api/chat` with streaming SSE and tool use | ⏳ |
| `POST /api/ingest-pdf` with multimodal Opus 4.7 | ⏳ |
| Chat UI with streaming | ⏳ |
| Live profile panel reacting to tool-use events | ⏳ |
| Screening calendar component | ⏳ |
| "See reasoning" disclosure | ⏳ |
| PDF drop-zone with preview | ⏳ |
| Lab table with color-coded values and confidence | ⏳ |
| Health timeline widget | ⏳ |
| "3 months later" simulation toggle | ⏳ |
| Proactive message rendering | ⏳ |
| Demo video (3 min, Loom) | ⏳ |
| Submission package (video + repo + 100–200 word description) | ⏳ |

---

## Parallel workstreams (nights 2–5)

### Workstream A — Act 1 end-to-end (Wed–Thu)

*Owner*: hc-backend + hc-frontend + hc-clinical
*Goal*: Laura can type "I'm 44, my mom died of breast cancer at 52" and see the profile panel fill in, then see a screening calendar with a working "See reasoning" disclosure.

1. hc-clinical drafts the orchestrator system prompt + the screening guideline data (mammography with maternal history, Pap, colonoscopy at 45). Juan Manuel audits.
2. hc-backend migrates config / DATABASE_URL to SQLite, scaffolds Alembic, writes the minimum schema (`profile`, `timeline_events`, `agent_runs`), and implements `POST /api/chat` with streaming SSE + tool use (`save_profile_field`, `schedule_screening`, `fetch_guidelines_for_age_sex`, `remember`).
3. hc-frontend installs shadcn, builds the chat surface, the live profile panel (animated entries on `tool_use` events), the screening calendar component, and the see-reasoning disclosure.
4. First end-to-end slice: Laura's sentence → profile animation → screening calendar rendered → disclosure expands to show the clinical reasoning.

### Workstream B — Act 2 end-to-end (Thu–Fri)

*Owner*: hc-backend + hc-frontend
*Goal*: Laura drops a lab PDF, the values are extracted by Opus 4.7 multimodally, the interpretation is shown, then the "3 months later" fade triggers the proactive message and the timeline updates.

1. hc-backend adds `POST /api/ingest-pdf` with base64 multimodal input to Opus 4.7. Returns a structured `LabAnalysis` via tool call.
2. hc-backend adds `POST /api/simulate-months-later` that advances fixture state (timeline + proactive message payload).
3. hc-frontend builds the drop-zone with preview, the lab table with color-coded status + confidence, the timeline component, and the proactive-message UI.
4. End-to-end: drop PDF → see extraction + interpretation → trigger fade → see proactive message + timeline.

### Workstream C — Polish and record (Sat)

*Owner*: hc-coordinator + hc-frontend
*Goal*: visual polish good enough that judges notice the craft; demo script timed and rehearsed; fallback recorded.

1. Typography and spacing pass with shadcn + lucide-react.
2. Motion polish on the live profile panel entries and the timeline.
3. Demo script written and rehearsed end-to-end several times.
4. Screen recording of the full 3-minute demo as fallback.

### Workstream D — Submission (Sun before 7 PM CDMX)

*Owner*: hc-coordinator + Juan Manuel
*Goal*: submitted, not scrambled.

1. Final pass on README, disclaimers, LICENSE, `.env.example`.
2. 100–200 word submission description grounded in the founder thesis.
3. Upload final demo video (Loom, 3 min).
4. Submit via Cerebral Valley platform before 7 PM CDMX.

### Workstream E — Cut list (defer unless comfortably ahead)

1. Voice input via Web Speech API (P2 per the brief).
2. Push notification UI mocks.
3. Insurance PDF ingestion.
4. Beyond-English subtitles on the video.

---

## Scope freeze (non-negotiable for hackathon)

**In**: English UI for the demo, single seed profile (Laura), SQLite, single Opus 4.7 orchestrator with tool use, two demo acts, regulatory disclaimers visible.

**Out**: real auth, multi-user, multi-language UI, wearable integrations, push notifications, payments, the other health pillars in full, native apps, Postgres / Supabase, runtime subagent fan-out, Whisper post-consultation audio.

**Non-negotiable clinical rules**: never diagnose, never prescribe, always refer. Wellness + education + referral. Matches FDA General Wellness, COFEPRIS wellness software, MDR wellness exemption.

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Live demo breaks on judging day | Pre-recorded fallback video, fixtures local, SQLite shipped with the repo. |
| "Why not ChatGPT Health?" objection | Rehearsed answer: reactive vs proactive, no longitudinal clinical memory, no companion relationship. See `competitive-analysis-v1.md`. |
| "Regulatory?" objection | 20-second answer: wellness category, never diagnoses or prescribes, clinician-led content, FDA / COFEPRIS / MDR exempt. |
| Opus 4.7 hallucinates lab values | Forced structured output with schema; confidence per value; re-ask on ambiguity. |
| Visual polish falls behind engineering | shadcn + tailwind defaults, two hours on typography + spacing beats one extra feature. |
| Saturday is Juan Manuel's 50th birthday | The MVP target is Saturday morning so the evening is the party. Sunday is buffer + video + submit. |

---

## Next session immediate checklist

1. `hc-coordinator` orchestrates.
2. `hc-clinical` drafts the orchestrator system prompt (audited by Juan Manuel before merge).
3. `hc-backend` migrates to SQLite, scaffolds Alembic + minimal schema, implements `POST /api/chat` with streaming + tool use.
4. `hc-frontend` installs shadcn, builds chat surface + live profile panel stub.
5. First E2E slice lands: Laura's sentence → profile fills in → screening calendar renders.
6. Commit, push, update ROADMAP.md.

---

## Fixtures needed from Juan Manuel

1. **Anonymized lab PDF** with fasting glucose 118 mg/dL visible. Ideally with additional panels (CBC, lipids, HbA1c optional) so the extraction looks rich. If none at hand, one can be fabricated and audited clinically.
2. **Laura seed profile** — clinical confirmation of: 44 y, female, mother died of breast cancer at 52, diabetic father, any active conditions, medications, habits, country of residence for screening guidelines.
3. **"3 months later" proactive message** — draft in English, Juan Manuel refines for clinical voice.
4. **"See reasoning" tone calibration** — should the expanded reasoning read like a concise clinical note, bullet points of a differential, or a short educational paragraph? Juan Manuel to choose.

---

## Pitch seed (from the founder thesis)

> *"The health system today gets paid when you get sick. We're building the first companion whose only job is to keep you well — in the language you actually speak."*
