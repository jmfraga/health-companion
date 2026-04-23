# Development Journal — Health Companion

> A running log of design decisions, build sessions, and the story behind the code.
> **Purpose**: raw material for the Sunday April 26 hackathon submission, and the story of the project beyond the hackathon.
> Kept in English so judges and future readers can follow. Discussions between Juan Manuel and the agents happen in Spanish; the journal captures them in English.

---

## Agent architecture — two layers, same pattern

Health Companion uses agents in two distinct places. The judges need to see the distinction, and the code reflects it strictly.

### Layer 1 — Product runtime (one agent, visible to the user)

The user ever interacts with **one** agent: a single **Claude Opus 4.7 orchestrator** with tool use and extended thinking. It:

- Talks to the user in a warm, clinical voice (system prompt authored by `hc-clinical`, audited by Juan Manuel).
- Calls typed tools as it learns things: `save_profile_field`, `schedule_screening`, `fetch_guidelines_for_age_sex`, `log_biomarker`, `remember`, `submit_lab_analysis` (ingest-pdf only), `submit_proactive_message` (simulate-months-later only).
- Streams its reasoning on a dedicated SSE channel so the "See reasoning" disclosure can surface Opus 4.7's extended thinking as a clinical artifact.
- Reads PDFs directly via Opus 4.7's multimodal input — no OCR library in between.
- Curates memory (episodic vs semantic) by calling `remember`, not by dumping every turn to storage.

There are **no runtime subagents**. Earlier design iterations considered a fan-out to three specialist subagents (Screening / Lifestyle / Mental Health); that shape was cut on day one in favor of a single orchestrator whose reasoning is legible through extended thinking. The specialists' knowledge lives inside the orchestrator's system prompt and is visible when the user expands "See reasoning".

### Layer 2 — Development team (four agents, never visible to the user)

The product is built by a coordinated team of **Claude Code subagents**, each with a role brief in `~/.claude/agents/hc-*.md`. They never appear inside the product — they are how the product is made.

| Agent | Role | Model | Invocation |
|-------|------|-------|------------|
| `hc-coordinator` | Product lead, thesis guardian, delegates to specialists, owns `ROADMAP.md` and the demo script. Juan Manuel's copilot. | opus | Used for every design decision, every scope call. |
| `hc-frontend` | Next.js 15 + Tailwind + shadcn/ui. Chat UI, live profile panel, see-reasoning disclosure, PDF drop-zone, lab table, timeline, auth UI. Mobile-first. | sonnet | Invoked for each UI slice. |
| `hc-backend` | FastAPI + Python. Orchestrator wiring, streaming SSE, tool runtime, multimodal PDF endpoint, JWT middleware, simulate-months-later. | sonnet | Invoked for each API slice. |
| `hc-clinical` | Clinical voice, guardrails, sanitary-interpreter rules, screening schedules, proactive-message wording. Every clinical string passes through here; **Juan Manuel audits**. | opus | Invoked whenever user-facing clinical language changes. |

A fifth development agent, `hc-debugger`, remains provisional — spun up only when the first real integration crack appears.

### The fifth agent — Juan Manuel

Juan Manuel Fraga — primary-care physician, director of a cancer center in Querétaro — is the **fifth agent** on the development team. He is not "the user". He is the clinician translating the experience he cultivates with his real patients into something digital and replicable. The four Claude Code agents draft; he audits. Every clinical decision carries his voice.

### The meta-move that the submission narrates

> *We built this health companion using the same coordinator-plus-specialists pattern we think the eventual product team will need. We learned to build health-as-a-team by building it as a team.*

The product's single-agent runtime (Layer 1) and the development team's multi-agent pattern (Layer 2) share a common shape: a coordinator working with specialists. In Layer 2 the specialists are humans and subagents; in Layer 1 they are the orchestrator's own system prompt + extended thinking. Over time, as the product grows, some of Layer 2's specialists will migrate into Layer 1 as Managed Agents or additional runtime agents. For the hackathon MVP, the runtime stays intentionally simple.

---

## Conventions for this journal

- One entry per session, chronological.
- At the end of each session, `hc-coordinator` drafts: (a) quotable one-liners, (b) decisions made, (c) what shifted since yesterday, (d) what's next.
- Juan Manuel reviews and adds what the agent missed — his voice is definitive.
- Entries are cumulative. Never overwritten. When a decision is reversed, the new session documents the reversal without erasing the original. The evolution of thinking is itself part of the story.
- Quotables that land verbatim in the pitch or the demo video are marked with ⭐.

> Filename history: originally `bitacora.md`, then `bitacora-desarrollo.md`, now `development-journal.md`. The name drift mirrors the scope drift of the first 24 hours; the content is continuous.

---

## Session 1 — Tuesday, April 21, 2026 · Kickoff

**Location**: Querétaro, Mexico (CDMX / UTC-6).
**Duration**: afternoon and evening of April 21.
**Milestones**: hackathon acceptance confirmed, public repo created, scaffolding in place, alignment with the founder's thesis, design of the development agent team.

### Quotables for the pitch

- ⭐ *"The health system today gets paid when you get sick. We're building the first companion whose only job is to keep you well — in the language you actually speak."* (Pitch seed — straight from the founder's thesis.)
- *Juan Manuel is not only the user: he is the fifth agent on the team.* The primary-care physician who wants to translate the experience he loves creating with his patients into something digital and replicable.
- ⭐ *"We learned to build health-as-a-team by building it as a team."* — the hackathon meta-story: the coordinator-plus-specialists pattern we want for the product is the same pattern we used to build it.
- *The sanitary interpreter.* A new category — a product whose only job is to translate medicine into the language you actually speak at home.
- *The system is inverted: today no one gets paid to keep you well.* Eric Topol anticipated this in 2015 (*The Patient Will See You Now*) and deepened it in 2019 (*Deep Medicine*). Ten years later, the technology to invert it exists — we call it Opus 4.7.
- *In low-resource contexts, the relative value is higher.* Someone without a family doctor suddenly has a digital one. Health Companion is a clear case of **AI for beneficial outcomes** — directly aligned with Anthropic's mission.
- *Three educational goals, in order: empower, motivate, comprehend without jargon.* These aren't features; they're the product's purpose.
- *We aren't building another health app. We're building the relationship most patients no longer have with anyone.*
- *The $25B+ market is saturated with reactive tools. Nobody reaches out. We do.* (From the competitive analysis — central differentiator.)

### Decisions made

- **Repo**: `jmfraga/health-companion`, public, Apache 2.0 license. Medical disclaimers in the README from day one.
- **Hackathon stack**: Next.js 15 + App Router + Tailwind + shadcn/ui (frontend), FastAPI + SQLite (backend). Supabase is staged in `.env.example` and `config.py` for post-submission migration, but the MVP runs on SQLite per the brief's zero-overhead argument.
- **AI runtime**: Opus 4.7 as orchestrator + three runtime subagents via Claude Agent SDK (Screening, Lifestyle, Mental Health). Based on the brief, which prioritizes official-tools craft over the Managed Agents side-prize. Reversible.
- **Hero demo**: *"Laura's first visit"* — Laura, 44, whose mother died of breast cancer at 52. Four choreographed wow moments (3–5 min): conversational onboarding with a live profile panel, multimodal PDF lab ingestion, parallel fan-out to three subagents, simulated jump to "six months later" that demonstrates longitudinal memory.
- **Development team** (the story we tell judges): a coordinator (`hc-coordinator`) + three specialists (`hc-frontend`, `hc-backend`, `hc-clinical`) + Juan Manuel as the fifth agent (the physician). Claude Code subagents, defined in `~/.claude/agents/`, collaborating through the Agent SDK pattern.
- **Demo language**: Spanish (Mexican register). English subtitles in the video if time allows.
- **Hackathon scope freeze**: no auth, no multi-user, no real push notifications, no multi-language UI, no wearable integrations, no native apps, no payments. Only the hero flow, polished until it shines.
- **Deadline**: Sunday April 26, 8 PM EST = Sunday April 26 **7 PM CDMX** (Juan Manuel is in Querétaro).
- **Strategy docs and bitácora commit to the public repo.** Bitácora lives in English; discussions between Juan Manuel and `hc-coordinator` stay in Spanish.

### What shifted today

- **From 5 runtime agents → 3 runtime subagents plus an orchestrator.** The brief forced a rethink. The originally scoped runtime agents (Onboarding, LabAnalyzer, ConsPrep, PostCons, Companion) collapse: onboarding and lab analysis become capabilities of the orchestrator; the subagents are thematic (Screening, Lifestyle, Mental Health). Cleaner and more aligned with the pillars.
- **From Managed Agents everywhere → Claude Agent SDK for runtime subagents.** The brief prioritizes craft. Managed Agents remain available as a fallback if we decide to pursue the $5K side-prize.
- **From Postgres/Supabase → SQLite** for the MVP. Supabase stays in `.env.example` and `config.py` for the post-submit migration path.
- **From persona "María the prediabetic" → Laura, 44, maternal history of breast cancer.** Laura's case is clinically weightier, emotionally stronger, and showcases screening logic based on family history (earlier mammography, colonoscopy at 45, Pap).
- **From reactive demo → demo with proactive opening and closing.** The competitive analysis made it clear: proactivity is the differentiator Big Tech lacks. The demo has to show it in the first and last beat.
- **Key discovery**: Juan Manuel is not "the user" — he is the fifth agent. That framing turns the hackathon into a credible meta-story: a physician using an AI team to package his practice into software.

### What was built today

- Public repo `jmfraga/health-companion` with Apache 2.0 license.
- Monorepo: `apps/web` (Next.js 15 building cleanly), `apps/api` (FastAPI exposing `/health`).
- Docs: `ROADMAP.md`, `docs/agents.md` (v1 with the original five agents — slated for rewrite), `docs/architecture.md`.
- Pydantic schemas: `HealthProfile`, `LabAnalysis`, `ConsultationPrep`, `ConsultationSummary` (slated for rewrite under the new architecture).
- Five draft runtime agent prompts (slated to be replaced by the orchestrator + three subagents design).
- `hc-coordinator` agent created in `~/.claude/agents/`.
- The remaining three development agents (`hc-frontend`, `hc-backend`, `hc-clinical`) created.
- Bitácora initiated (this file).

### Open for next session

1. **Rework** `docs/agents.md` and `ROADMAP.md` to match the new architecture (orchestrator + 3 runtime subagents + scope freeze).
2. **Replace** the five draft prompts with prompts aligned to the new design, audited by Juan Manuel as physician.
3. **Migrate** `DATABASE_URL` and `config.py` to SQLite for the MVP.
4. **Build** the first end-to-end slice of the hero flow: conversational onboarding with the live profile panel, up through PDF upload.
5. **Prepare** fixtures: anonymized lab PDF, Laura seed profile, "six months later" state.
6. **Discord**: confirm Juan Manuel's son is registered and that both of them hold the hackathon role.
7. **Fifth agent (later)**: consider adding `hc-debugger` once the integration edges start cracking. Not needed yet — create when the first real bug bites.

### Target for this week

Juan Manuel turns 50 on **Saturday April 25**. There is a party that night. The plan is to have a **working, demo-able MVP by Saturday** so Sunday is buffer + demo video + submission. Deadline Sunday 7 PM CDMX.

### Pitch notes

Section §10 of the thesis holds the pitch's seed phrase. Start there. Then Topol, then equity as the hook into Anthropic's mission, then the sanitary interpreter as a category, then Laura's demo, then the meta-story of the agent team. Close: *"this is v0.1. We built it in five nights. Imagine what it is when it covers every pillar, in every language, for every context."*

---

### Evening addendum — scope pivot from claude-cowork (presentation prep)

Late in the day, while Juan Manuel was working with another Claude instance (`claude-cowork`, dedicated to pitch and slide prep for Sunday), that instance fed back a tighter scope that supersedes part of the morning plan. The reasoning is clean — the judges' presentation window is **3 minutes total**, in **English**, not a 3-to-5-minute demo. A four-act story does not fit three minutes without rushing the moments that matter most. Simpler and more defensible.

**What the pivot changes**:

- **Four acts → two acts.** Dropped: the standalone onboarding act and the parallel-subagents plan act. Kept and refocused:
  - **Act 1 — Meeting Laura (~45s)**: Laura speaks in natural language ("I'm 44, my mom died of breast cancer at 52"). The profile panel fills in live via visible tool use. Opus 4.7 proposes a screening calendar in everyday language, with an optional **"See reasoning"** disclosure that surfaces the clinical reasoning. Close with the formula educate → contextualize → refer.
  - **Act 2 — Labs and proactivity (~55s)**: Laura drops a lab PDF; Opus reads it multimodally; detects glucose 118 mg/dL and cross-references with the profile; explains without alarm. ~3-second fade → "3 months later" → the app writes proactively: *"You turn 45 next month. Remember what we talked about? Let's schedule that mammogram."* Timeline shows the accumulated milestones.
- **No runtime subagents.** The user sees a single Opus 4.7 orchestrator with tool use. The earlier three-subagent fan-out (Screening, Lifestyle, Mental Health) is cut from the product. The reasoning those specialists would have done happens inside the orchestrator and is surfaced via the "See reasoning" disclosure — that is the new wow moment replacing the visible fan-out.
- **Demo language switches to English.** The presentation is in English; Laura speaks English; the UI speaks English for the demo. Spanish (Mexican register) remains the long-term product default but is out of the hackathon MVP.
- **Development subagents stay exactly as they are.** `hc-coordinator`, `hc-frontend`, `hc-backend`, `hc-clinical` are for development only. They never surface to the user. A fifth agent (`hc-debugger`) may be spun up later.
- **"See reasoning" rises to headline feature.** Extended thinking exposed as a clinical artifact (not a toy). This replaces the visible subagent fan-out as the "creative Opus 4.7 use" differentiator — arguably more defensible because it is genuinely clinical transparency.
- **Bitácora renamed** to `bitacora-desarrollo.md` to distinguish from any future `bitacora-pitch.md` owned by claude-cowork.

**Why this is stronger for the 3-minute window**:

- Two acts, two wow moments, instead of four scattered moments that would each get cheated.
- Narrower surface area to polish, record, and defend.
- Clinical transparency ("See reasoning") is harder to dismiss than a multi-agent visualization that could be read as gimmick.
- Proactivity is the competitive differentiator per the analysis — Act 2 now lands it as the closing beat instead of saving it for a fourth act that might never happen.

**Acceptance criteria confirmed for the first code session**:

- Act 1 end-to-end first (not parallel with Act 2).
- Then Act 2.
- Visual polish with shadcn + lucide before any additional features.
- Juan Manuel will provide: (1) the anonymized lab PDF with glucose 118 mg/dL visible, (2) clinical confirmation of Laura's seed profile, (3) the tone calibration for "See reasoning" (concise clinical note vs educational differential vs short paragraph), (4) the final wording for the proactive message.

**New quotables from the pivot**:

- ⭐ *"We traded breadth for transparency. 'See reasoning' is not a toy — it is the first time a patient can look over the shoulder of the model that just read their labs."*
- *"The market has plenty of reactive chat. We built the first beat of proactivity into the 55 seconds the judges remember."*
- *"A three-minute demo is a gift: it forces us to commit to the two moments we believe in the most."*

---

### Late-night sprint — plumbing + wow #1 landed (April 21, same day)

After the evening pivot, we pushed straight through into implementation. By ~midnight CDMX we had:

**Shipped end-to-end and verified over Tailscale from Juan Manuel's laptop:**

- Anthropic API key verified; Opus 4.7 responding.
- Supabase Postgres 17 connected via session pooler (`aws-1-us-east-2`) — held warm for post-hackathon persistence, not wired into the app runtime yet.
- `POST /api/chat` with streaming SSE, the full agentic loop (text → tool_use → tool_result → continuation), and a curated `save_profile_field` tool.
- Chat UI with a live profile panel that animates as `tool_use` events arrive. Fields flash emerald for ~1.8 s on update.
- Extended thinking enabled on Opus 4.7 via the adaptive API (`thinking.type = "adaptive"`, `output_config.effort = "max"`, `display = "summarized"`), with `thinking_delta` events piped through a dedicated `reasoning_delta` SSE channel.
- A **"See reasoning" disclosure** in the chat UI: collapsed by default, pulses "thinking…" while the model reasons, expands into a zinc-50 panel with pre-wrapped clinical reasoning.
- Orchestrator **system prompt v2026-04-21** authored by `hc-clinical` and committed — 13.7K characters covering identity, hard rules, sanitary interpreter, screening knowledge, tool-use protocol, clinical-note reasoning style, anti-patterns, failure-mode recoveries.
- Three more tools added by `hc-backend` — `schedule_screening`, `fetch_guidelines_for_age_sex` (with 14 guideline rows spanning USPSTF, ACS/NCCN, ACOG, ACC/AHA, NLA, ESC, ADA, Secretaría de Salud México), `remember` (episodic + semantic) — plus accessors and reset helpers.
- `GET /api/screenings`, `GET /api/memory`, and `screenings_snapshot` / `memory_snapshot` SSE events at turn close.

**Debugging we survived:**

- Next.js 15 silently blocks HMR and hydration from non-localhost origins — the button on the laptop's browser stayed disabled. The fix was a single line in `next.config.ts`: `allowedDevOrigins: ["100.72.169.113"]`. Revisiting Next.js hydration on new hosts is now a ritual, not a one-off.
- Supabase deprecated IPv4 on the direct connection string; the M4 could not route IPv6 to their pool. Switched to the Session Pooler at `aws-1-us-east-2.pooler.supabase.com:5432`. The region had to come from the Supabase dashboard Connect modal — several regions we tried silently returned "tenant or user not found".
- Opus 4.7 rejected the legacy `thinking.type = "enabled"` shape ("not supported for this model"). The new shape is `thinking.type = "adaptive"` with an `output_config.effort` knob. Below `"max"`, thinking frequently does not emit any visible `thinking_delta` tokens — the model decides whether it's worth reasoning publicly. For a demo where reasoning is the wow, we hold `effort = "max"` as the default.

**Meta-move that landed:**

First two real delegations to `hc-frontend` and `hc-clinical` via Claude Code's Agent tool. Both agents read their role brief (`~/.claude/agents/hc-*.md`) and the canonical docs before acting. `hc-frontend` shipped the "See reasoning" disclosure inside one session and reported back under 150 words. `hc-clinical` authored the orchestrator system prompt from the `docs/tesis-del-fundador-v1.md` thesis. This is the pattern we narrate in the submission: the product's own coordinator-plus-specialists architecture, used to build the product.

**Scope note from Juan Manuel:**

> *"Me enfoco en funcionalidad. El ejemplo de Laura lo vemos al final; buscaré datos de un paciente real y lo anonimizamos."*

Capability-first. Demo-narrative-last. All fixture work (the specific seed profile, the specific lab PDF, the specific proactive-message wording) defers to the Saturday morning window when Juan Manuel brings the anonymized real-patient data. Until then, every feature has to stand on its own with any input.

**ROADMAP split:**

The old all-in-one `ROADMAP.md` was too narrow for what the judges should see. Split into two:

- [`ROADMAP.md`](../ROADMAP.md) at repo root — the **product vision**, multi-phase, capability-focused, proactivity engine + longitudinal memory + clinical accompaniment + equity dimension made explicit. What the judges and future readers see first.
- [`docs/hackathon-plan.md`](./hackathon-plan.md) — the **operational plan** for the hackathon week, night by night, with the demo-specific hooks.

**Quotables added:**

- *"The product gets paid when you stay well. The system doesn't. That gap is our whole reason to exist."*
- *"Proactivity is not a feature — it is a budget. Never more messages than value; never bombardment."*
- *"Memory curated by the model, not dumped. The model decides what is worth keeping."*
- *"The sanitary interpreter is not a translation table — it is a way of respecting that medicine is somebody else's language."*

**Open items handed to the next session:**

- `hc-frontend` is mid-flight building the `ScreeningCalendar` component and a mobile-responsive pass (profile as a bottom sheet, screenings as a second pill, composer pinned, safe-area-inset handled). Report expected shortly.
- Juan Manuel to review the orchestrator system prompt at `apps/api/src/api/agents/runner.py`, especially: USPSTF 2024 breast-screening cadence, cervical cadence wording, urgent-value thresholds, §9 failure-mode recovery scripts.
- Night 3 work (Act 2: multimodal PDF ingest + lab table) begins when a real anonymized lab PDF lands.
- Night 4 work (fade transition + proactive message card + timeline) begins after Act 2 plumbing is green.

---

### Late-night design decision — Haiku for budget, Opus for thought (April 21, before bed)

Juan Manuel's last reflection of the day, before leaving for dinner:

> *"Maybe the conversation can be Haiku, and behind it classification, reflection and so on with Opus 4.7 — what do you think?"*

The answer we agreed on:

**For the MVP demo (3 minutes):** keep Opus 4.7 as the single visible orchestrator. If Haiku held the mic, there would be no live extended-thinking tokens to surface in the "See reasoning" disclosure, and that disclosure is the entire Layer-1 wow. The judging rubric rewards creative **use of Opus 4.7**, not cost-optimization around Opus. Cost in a 3-minute demo is not the bottleneck; visibility is.

**For production (Phase 1):** Juan Manuel's instinct is exactly right. At 10K active users, running Opus on "good morning" is burning money. The shape we'll ship is:

> **Haiku classifies → Opus thinks.** A fast Haiku 4.5 classifier runs on every user turn and picks Opus's `output_config.effort` — `low` for greetings and trivial profile updates, `high` / `max` for clinically loaded turns (labs, symptoms, family-history discussion, risk assessments). Target: roughly 10× cost reduction per active user per month, with zero quality regression on the clinical moments.

**Pitch line the routing enables (even if we don't ship it before Sunday):**

- ⭐ *"We use Haiku to budget Opus's thinking. At scale that turns a $0.25-per-turn product into $0.03-per-turn without giving up a single clinical moment."*

**Where this lives in the repo going forward:**

- `ROADMAP.md` Phase 1 — "Smart model routing" bullet added tonight.
- `docs/hackathon-plan.md` Night 4 — Friday stretch goal: if the Act 2 UI is done and time remains, implement the classifier. If it ships, it earns points under Opus 4.7 Use + Depth & Execution. If it doesn't, the demo is unchanged.

**Why the "effort classifier" framing (and not "two-model conversation"):**

Splitting the conversation between two models introduces:
1. A second model's quality floor on turns that matter.
2. UX latency if Opus post-hoc "corrects" Haiku (the user already saw Haiku's reply).
3. A second prompt to audit clinically.

The effort-classifier keeps Opus as the single voice; Haiku only decides whether Opus should think hard. One model speaks, one model budgets. Safer, cheaper, and still Opus-forward.

---

### Second late-night decision — Managed Agents for the proactive engine (April 21, before bed pt. II)

Juan Manuel asked a question that turned out to be very on the nose:

> *"Cuando hablan de agentes en el hackathon, ¿es de estos agentes [Claude Managed Agents] o de subagentes de Claude Code? ¿Nos serviría considerarlo?"*

The answer matters for judging.

**The three kinds of "agents" in this project**:

| Kind | What it is | Where we use it |
|---|---|---|
| **Claude Managed Agents** | Anthropic platform product: cloud containers with SSE streaming, session state, `client.beta.agents/environments/sessions`. $0.08/session-hour + tokens. Beta. | Not yet. Target: the proactive engine. |
| **Claude Code subagents** | Personas inside the Claude Code CLI, defined in `~/.claude/agents/*.md`. Invoked via the Agent tool. | Our development team: `hc-coordinator`, `hc-frontend`, `hc-backend`, `hc-clinical`. |
| **Messages API directly** | Standard API: tool use, streaming, multimodal, extended thinking. | Today's product runtime. |

The hackathon's main rubric rewards **creative Opus 4.7 use** in any form; we're strong there already with multimodal PDF ingestion, extended thinking surfaced through "See reasoning", and typed tool use animating the UI.

But there is a **side prize worth $5,000 USD in API credits** named "Best use of Claude Managed Agents," defined literally as: *"the project that best uses Managed Agents to hand off meaningful, long-running tasks — not just a demo, but something you'd actually ship."*

**The natural fit we found**:

The **proactive engine** — the part of Health Companion that reaches out to the user when something becomes relevant (a screening is due, a lab is trending, a life event happened, a birthday lands on a screening threshold). In production that engine runs as a scheduled background loop across the active user base. It is stateful, autonomous, long-running, and the work it does per user is a well-bounded evaluation of trigger conditions plus the composition of a personalized outreach. That is the Managed Agents shape without shoehorning.

Our current `POST /api/simulate-months-later` endpoint is a tiny version of exactly that engine.

**Decision (Option 3 in the reflection)**:

1. Keep the hot conversational path on Messages API. Latency and extended-thinking visibility win there.
2. Migrate `/api/simulate-months-later` to run on a real Managed Agents session. Same SSE contract to the frontend (reasoning_* + message_delta + proactive_message + timeline_event), but the engine behind it is an autonomous cloud agent instead of a direct Messages call.
3. Narrate both in the pitch: *"Messages API for the turn you hear; Managed Agents for the check-in you receive."* The architecture is real production design, not a demo toy. We compete for the $5K side prize and strengthen the Depth & Execution score.

**What stays unchanged**:

- The conversational chat surface (`/api/chat`), the multimodal PDF endpoint (`/api/ingest-pdf`), the orchestrator system prompt, the "See reasoning" disclosure, the screening calendar, the live profile panel, the mobile-first layout, the Supabase Auth UI. All of the main-rubric wow moments stay on Messages API where they earn their points.

**What changes**:

- `/api/simulate-months-later` becomes a Managed Agents session. The existing Messages-API version is kept as fallback — if Managed Agents has any hiccup during judging, we flip a feature flag and the demo runs unchanged.
- A new `docs/managed-agents.md` (to be authored during the migration) captures the session-creation flow, the agent + environment definitions, the idempotent registry, and the cost accounting, so a reader can see we know what we're shipping.

**Pitch-ready quotable from this decision**:

- ⭐ *"Messages API for the turn you hear. Managed Agents for the check-in you receive. Two surfaces, one product, honest production economics."*

**Open overnight (Wed→Thu)**:

`hc-backend` is queued to author the Managed Agents migration in the background. The main safety net is that the previous Messages-API version of `/api/simulate-months-later` is preserved; the Managed Agents version lands as a sibling endpoint until Juan Manuel flips the switch.

---

## Session 2 — Wednesday morning, April 22, 2026 · Founder feedback from the commute

Juan Manuel opened the morning with rich, specific feedback before leaving for work — three concrete product signals and a set of longer-horizon reflections. Captured here as context for the next build sessions.

### A real-world wearable case study joins the repo

The last file Juan Manuel downloaded to his laptop before leaving was a six-day case study titled *"Colaboración Garmin + Claude — Gestión asistida por IA de una infección viral aguda y reingreso al ejercicio competitivo"* by Hans Laut (51, competitive amateur athlete). We pulled it into [`docs/references/caso_estudio_garmin_claude.docx`](./references/caso_estudio_garmin_claude.docx).

Why it matters: it is a fully lived-through example of exactly the loop Health Companion productizes. A Garmin Enduro 2 provided continuous HRV / resting HR / respiratory rate / sleep score / stress / body battery. Claude interpreted the stream and conversation, inferred probabilities (not diagnoses), adjusted protocols daily, and staged a return-to-exercise plan with objective criteria — all with explicit uncertainty and explicit referral-to-physician boundaries. This is the playbook.

**Decision**: wearable integration (Garmin, Apple Health, Google Fit / Health Connect) becomes a **Phase 1 priority** rather than Phase 2, and the roadmap's modalities thread now leans on "the wearable sees the dip before the user feels it" as the anticipation unlock.

### Signal from a prospective user (audio message)

A woman sent Juan Manuel a voice note reacting to the concept. Two asks landed clearly enough to become MVP bullets:

1. **Privacy surface** — *"make a place in the app that tells me how you protect my privacy."*
2. **Explicability surface** — *"at least basic: how does it work? how do I know it's grounded in recent evidence?"*

Both become **Phase 0 (MVP) sections**, routable from the header:
- `/about-your-privacy` — plain-language: what we store, what we encrypt, what never gets used for training, how export and delete work.
- `/how-this-works` — plain-language: the model, the clinical sources cited (USPSTF / ACS / NICE / NCCN / ACC-AHA / ADA / Secretaría de Salud México), the "See reasoning" audit path, what we will never do.

The same user commented that a hypochondriac might be calmed by the app's tone. Juan Manuel's counter: *"but we also need alarm data — suicide risk and medical emergencies — that suggest calling emergency services or an ambulance."* Already enforced by the orchestrator's hard rule 5, but **we add a visible emergency affordance** so the UI layer matches the prompt's safety posture. A persistent "Emergency?" control that opens region-specific numbers: 911 / 066 / 112 + mental-health crisis lines (988 US, SAPTEL 55-5259-8121 México). Not buried in a menu. This lands in Phase 0.

### Founder reflections — the admin + research layer

Juan Manuel's own reflection for the medium term: a **proper admin dashboard** that is *not only operations*. Two intertwined analytics axes:
1. **Usage** — DAU / MAU, retention, cost per user, funnel by pillar.
2. **Outcomes** — screenings scheduled vs completed, follow-ups kept, proactive messages sent vs acted-on, self-reported improvements, adverse events.

And the part that turns this from a dashboard into an ethical commitment: **we use the outcome data to publish peer-reviewed analyses** — including unfavorable results. *"If the data says we are not helping, we say so publicly and course-correct."* That is the responsibility clause and it belongs in the product's DNA, not as marketing. Added to ROADMAP Phase 2 (admin-lite + outcome signals) and Phase 3 (real-world-evidence pipeline with academic partners).

### MVP additions accepted

Without stealing too much time from Act 1 + Act 2 polish, we accept three small but high-signal additions into Phase 0:

1. **About-your-privacy** static surface — ~45 min.
2. **How-this-works** static surface — ~45 min.
3. **Emergency affordance** (persistent header control + modal with region-specific numbers) — ~60 min.

Target: land during Thursday afternoon session once Night 4 P0 is green.

### Photos of non-connected devices — the equity unlock

One more signal from the morning that becomes a capability thread:

> *"Photos should also work for the scale, the watch, the BP monitor — anything that isn't integrated with the phone."*

That one sentence turns our PDF-ingest path into the backbone of a much broader idea: **any health device with a legible display becomes an input** to Health Companion, whether it is connected or not. A bathroom scale. An upper-arm blood-pressure cuff. A wrist oximeter. A glucometer. A thermometer. The face of a non-syncing fitness watch. The user snaps a photo (gallery or direct camera capture), Opus 4.7 reads the display multimodally, the value lands in `log_biomarker` with `source = "photo"`.

Why this matters at the strategy level:
- **Radical equity.** A family that owns a $15 bathroom scale gets the same feature richness as a family that owns a $300 connected scale. This is Phase 1 LatAm positioning made real at the product-interaction layer.
- **Universality across devices and brands.** We don't need a partnership with every device maker. The display is the contract.
- **Composable with the wearable thread.** Connected APIs give us continuity (every night of HRV). Photos give us coverage (grandma's Omron that the user photographs when visiting). Most users will use both.

Implementation-wise it is an additive pass on the existing multimodal pipeline:
- Backend: accept images in the ingest endpoint alongside PDFs; the same Opus 4.7 multimodal call handles both with a small prompt tweak.
- Frontend: mobile camera capture (`<input type="file" accept="image/*" capture="environment">`) + gallery picker in the same upload affordance.
- Prompt: a short extension for `hc-clinical` — "if the image shows a device display, identify the device type, extract the reading(s), and log via `log_biomarker`".

**Added to Phase 0 MVP** as a stretch if Thursday afternoon has room after the privacy + explicability + emergency affordances land; otherwise **Phase 1 day-one** item.

### Quotables from the morning

- *"Anticipation is the game. The watch sees the dip before the user feels it."*
- *"Privacy has to be a place in the app, not a paragraph in the Terms of Service."*
- *"Explicability is a competitive moat. Nobody else in the space is doing it well."*
- ⭐ *"If the data says we are not helping, we say so publicly and course-correct."* (The responsibility clause — pitch-ready.)
- ⭐ *"You don't need a $300 connected scale. Your bathroom scale works. Your aunt's blood-pressure monitor works. Take a photo."* (Equity framed as a product feature — pitch-ready.)

---

## Session 3 — Wednesday late afternoon, April 22, 2026 · User feedback from Hans Laut, two angles

Two feedback documents landed during the day, both written by **Hans Laut** (the same Hans whose Garmin case study lives in `docs/references/`). They read as two different angles on the same lived experience — one from his sophisticated-user / longevity-monitoring perspective, one from his rehabilitation process (medial epicondylitis). Both are in [`docs/references/user-feedback/`](./references/user-feedback/).

Capturing real potential-user iteration during the hackathon week itself is part of the story we tell the judges on Sunday.

### What Hans's feedback confirmed

- **Longitudinal memory is not *a* feature — it is *the* feature.** His direct experience has already produced inferences no cold tracker would: eosinophilia over three years linked to post-COVID immune sequelae; low free testosterone explored against body composition and possible aromatization; the absence of a digestive change after an intentional dietary shift that reoriented the causal hypothesis. This is exactly the loop we claim and he can verify it.
- **"Educate → contextualize → refer" holds up.** The clinical framing is regulatorily defensible in practice, not just on paper.
- **Structured memory beats conversation history.** The element of highest value in his rehabilitation process was a document kept up-to-date session by session (pain indicators, decisions, reasoning, clinical evolution) — not a scrollable chat. Health Companion should generate and maintain exactly this kind of **living state document**, consultable at any moment by the user and by the treating physician.
- **Semantic precision has clinical value.** "Tired elbow" versus "injured elbow"; "post-session sensitivity" versus "residual pain". A companion that helps the patient name themselves accurately produces better data for the clinical team and reduces the risk of normalizing alarm signals.
- **Proxy indicators anchor follow-up.** The "handshake on a 0–10 scale" was simple, reproducible, daily, no equipment required. Designing condition-specific proxy indicators is a product thread, not just biomarkers from labs.
- **Executable rules, not vague recommendations.** "If tomorrow the pain worsens, halve the volume" — a rule — beats "listen to your body" — a cliché. The product must translate clinical criteria into executable decision rules where possible.

### What the feedback surfaced as gaps

1. **The gap is behavioral, not cognitive.** Laura understands she needs the mammography — and still does not book it. "The most expensive gap in preventive health is not cognitive, it is behavioral." Health Companion needs a **follow-through layer** (contextual reminders with emotional register, active verification that pending studies were performed, real celebration of follow-through — not generic notifications), not just an education layer.

2. **Longitudinal-memory architecture is the most under-appreciated technical challenge.** What happens when the user changes device, changes plan, or doesn't open the app for three months? Manual context-reloading at session start (Hans's current workaround) is not scalable. Persistent memory with a smart reactivation protocol is critical infrastructure.

3. **The "never diagnose" model needs an explicit escalation protocol.** The formula works 90% of the time. The other 10% — the signal that needs urgent attention — is where the wellness classification is most vulnerable, regulatorily and ethically. We need visible, calibrated criteria distinguishing "handle with your doctor at your next visit" from "go to urgent care today". Our existing emergency affordance Phase-0 commitment gets sharper: it carries not only phone numbers but the **traffic-light criteria** so the user can read themselves into one of the three tiers on their own.

4. **Longitudinal data is a privacy risk with existential scale.** A system accumulating clinical history, behavioral patterns, family history, and lab results over years is one of the most sensitive data assets that exists. The product must answer — in the app, not in the Terms — who owns the memory, what happens if the company is acquired, and what the data cannot be used for even by us. "Privacy as a first-class in-app surface" is already in Phase 0; the architecture behind it gets a dedicated commitment.

5. **False-reassurance risk.** LLMs tend to validate. In rehabilitation — and by extension in any longitudinal preventive process — that bias can be dangerous: treating one good day as a recovery milestone when it is a preliminary data point can push a user to increase load prematurely. The clinical voice must prefer **calibrated caution over automatic positive reinforcement**. This becomes a new anti-pattern in the hc-clinical prompt, beside the existing "no moralizing" rule.

6. **Pitch reframing — structured memory as the actual product.** *"The value is not in simulating the doctor. It is in being the system of record and reasoning that the doctor doesn't have time to maintain. The doctor sees the patient 15 minutes every two months. The companion has the complete context of the last eight weeks: which exercises were done, which load was tolerated, which variables shifted, which decisions were made and with what outcome. That asymmetry of information — well designed — is the product."* This is a pitch-line candidate for Sunday.

### Founder framing clarification (Juan Manuel's note)

On Hans's suggestion that there are "two segments" — the Laura-like mass market and a sophisticated-longevity premium tier — Juan Manuel reframed before we took that into the ROADMAP:

> *"Tier premium: athletes, longevity, people more engaged in controlling their health. Mass market: meta is to turn them into people with the habits of the tier premium. So it is the same tier, different moment of adoption. Different sales speech, same objective: improve health."*

This is **not** a two-product strategy. It is **one product, two adoption paths, one thesis**. The three educational goals of the founder thesis (empower → motivate → comprehend without jargon) apply to both paths: the Hans-path user already lives in *comprehend*; the Laura-path user starts at *empower* and the product moves them toward the same depth of engagement over time. The ROADMAP will describe this as an adoption thread, not as a market segmentation.

### Adjustments accepted into the MVP/Phase-0 envelope

- **Reinforce hc-clinical** with the false-reassurance guard — "never normalize a single good day into a recovery milestone; calibrated caution over automatic positive reinforcement."
- **Emergency affordance, now with visible criteria** — beyond the phone numbers already queued, the affordance carries a short traffic-light readout: green = discuss at next visit, amber = call your doctor this week, red = go to urgent care / emergency services today. The thresholds come from the hc-clinical system prompt's §2.5 urgent-value list so the UI and the reasoning agree.
- **Living state document framing** — our current profile + screenings + biomarkers + timeline is *already* a living state document. We make that legible to the judges and to users: the submission description and the in-product Explicability page both call out "this is not a chat log — it is a structured health record that the user and their doctor can consult at any moment."

### Adjustments accepted into the ROADMAP (Phase 1 and later)

- **Behavioral follow-through layer** — not just "reminder on date", but "did you actually do it, and how did it go?" with emotional register and celebration when it happens.
- **Proxy indicators per condition** — a curated, ever-growing library of simple daily metrics the user can apply without equipment.
- **Executable decision rules** — translate clinical criteria into if-then rules the user can act on autonomously.
- **Contextual-variable capture** — peripheral, non-clinical variables (equipment changes, routine shifts, life events) get a lightweight logging path because causality is rarely linear in prevention and rehab.
- **Longitudinal-memory resilience** — persistence architecture (Supabase already wired) plus a smart reactivation protocol for users who disappear and come back. "Welcome back. Here is what we were working on eight weeks ago."
- **Privacy architecture in writing** — an in-app "What we cannot do with your data, even with your permission" section alongside the "About your privacy" page.
- **Passive capture mechanisms** — for users with lower tech adherence, the product must work without expecting heroic daily self-report. Photo-of-device ingestion, wearable sync, and a calendar-aware cadence layer all feed this.

### Deferred on purpose (per Juan Manuel)

- **Dual-protagonist demo (Laura + Hans-like user)** — we keep the demo single-patient for now. Revisit when more of Act 2 polish has landed.
- **Business-model decision** — we know the shape (freemium B2C + premium depth tier + long-term B2B2C insurer subsidy), but we do not lock it in until later in the week. The thesis ("the same product, two adoption paths, one objective") is the constraint the business model has to serve, not the other way around.

### Quotables from this iteration

- ⭐ *"The value is not in simulating the doctor — it is in being the structured memory and reasoning the doctor doesn't have time to maintain."* (Pitch-line candidate — Hans, via Jhana-voice.)
- ⭐ *"The most expensive gap in preventive health is not cognitive, it is behavioral."*
- *"One product, two adoption paths, one objective: improve health."* (Juan Manuel's reframe.)
- *"Semantic precision has clinical value. Help the user name themselves accurately — it makes the doctor's 15 minutes count for more."*
- *"Prefer calibrated caution to automatic positive reinforcement."* (New anti-pattern for hc-clinical.)
- *"Privacy has to be a clause in the product, not a paragraph in the Terms."*

### Design decision — reasoning visibility (April 22, afternoon)

Question that surfaced while testing: does the end user *need* to see extended-thinking output as a live disclosure?

The answer we settled on is nuanced and reshapes the Phase 0 UX slightly:

**Three layers of visibility, with defaults tuned to the adoption path:**

1. **Always-on: a one-line "why" tag above the assistant bubble.** A short natural-language rationale for the turn ("Because of your maternal family history of breast cancer, I lean toward earlier screening"). This is the user-facing explicability layer that lands for *every* user, regardless of sophistication. Non-threatening, calibrated, and honest about the single driver of the answer.
2. **Opt-in: the full "See reasoning" disclosure (today's feature).** Off by default. A toggle lives in Settings / Privacy — "Show reasoning in conversations". Hans-path users flip it on and see the clinical note streaming live. Laura-path users never see it unless they go looking.
3. **Always written: permanent audit log.** Every turn's full reasoning is persisted — never shown to the user unless they explicitly request a transcript, but available to their treating physician (with user consent) and to us for clinical-quality review, outcome research, and regulatory response.

**Why this balance**:

- Hans's feedback valued clinical transparency, which the log + the opt-in disclosure satisfy.
- Hans's *other* feedback cautioned against LLM validation bias. Raw reasoning often hedges ("possibly X", "consider Y") in ways an anxious user can latch onto above the final calibrated answer. Default-off reasoning protects Laura-path users from that failure mode without removing it from the adoption ladder.
- The one-line "why" gives *every* user something real to stand on without overwhelming them.
- The permanent log is the responsibility clause for publication, audit, and clinician verification — without burdening the user-facing surface.

**For the hackathon MVP**: the "See reasoning" disclosure stays visible as shipped (it is the wow moment). The user-facing framing in `/how-this-works` and in the submission description explains the three-layer model so a judge asking "what about anxious patients?" has an answer. Implementing the toggle + the one-line "why" lands in Phase 1 — neither fits the remaining hackathon budget without stealing polish.

**For Phase 1** (ROADMAP §6 clinical-transparency thread now reads):
- Default-off full reasoning disclosure with a Settings toggle.
- Always-on one-line "why" tag above every clinical turn.
- Always-written permanent audit log, shareable with the treating physician.

Quotable ⭐:
> *"Three layers of reasoning visibility: a one-line why for everyone, the full note for those who want it, an audit log for the doctor."*

### Cross-endpoint memory — bug caught during live testing

While Juan Manuel was live-testing the chat + lab upload flow, he asked the companion (in Spanish) to re-explain a lab analysis it had just produced. The companion answered like it had never seen the lab. This was not a prompt problem; it was an architectural one.

**Root cause**: the state the companion accumulates is divided by endpoint — `/api/chat` receives the conversation messages from the frontend; `/api/ingest-pdf` produces a `LabAnalysis` that streams to the frontend as a structured SSE event but never lands in the messages array. Biomarkers and timeline entries were persisted server-side but the chat orchestrator had no reference to them when the next user turn arrived. The companion was cegato de su propia salida.

**Fix** (shipped during the same session): inject a live state snapshot at the start of every `/api/chat` turn as the second block of the `system=` array, with prompt caching enabled so cost does not blow up. The snapshot carries the current profile, scheduled screenings, biomarkers, recent timeline (including the full `LabAnalysis` payloads for past lab uploads), and memory (episodic + semantic). The `labs.py` ingest endpoint was also updated to store the full `submitted_analysis` inside the timeline entry's payload — so the chat orchestrator reads it naturally from the shared state.

**Why this matters beyond the demo**: cross-endpoint memory is the product's core value, not a nice-to-have. The companion's claim — "I remember what you told me, I remember what we did together" — has to hold even when "we" spans multiple backend flows. The fix is the architecture that earns that claim.

Quotable ⭐:
> *"Memory is not one endpoint's problem. It is the product."*

### Product taxonomy — four timelines, not one

Juan Manuel's live-testing feedback crystallized a cleaner product taxonomy. The app is not just a conversation log; it is four complementary timelines:

| Layer | Time direction | Contents |
|---|---|---|
| **Timeline** | Past | What the companion observed and logged: consults, labs uploaded, proactive messages received, screenings scheduled, conversations worth keeping. |
| **Next Steps / Commitments** | Future | What the user is scheduled or has committed to do: next doctor's appointment, pending study, medication refill, follow-up call, clarifying question they want to ask at the next visit. |
| **Screenings** | Future (preventive) | A curated subset of Next Steps — preventive checkups driven by age, sex, family history, local-guideline cadence. Lives visually alongside Next Steps but has its own logic (guideline source + due cadence + rationale). |
| **Habits** | Recurring | Behavioral commitments with daily or weekly tracking — hydration, sleep hours, walking minutes, days without tobacco, medication adherence, mood check-in. Includes Hans's proxy indicators pattern ("handshake 0–10" scaled per condition). |

This is **not** a UI segmentation exercise. It is the frame that makes the *living state document* legible: past + future + preventive + recurring.

**Phase 0 (this week) implements only Timeline** — with expand-on-click per-entry detail rendering so the past is consultable. The other three are articulated in the roadmap and the submission narrative but not built. The pitch line:

⭐ *"We built Timeline in v0.1 because the past is what you cannot fix later. Next Steps, Screenings, and Habits land as the companion's memory extends into the future with you."*

### MVP additions articulated (some landing now, some Phase 1)

- **Cross-endpoint memory fix** — shipped during this session. Quiet but load-bearing.
- **Timeline expand-on-click** with per-event-type detail rendering — delegated to `hc-frontend` in parallel right now. Lab entries re-render the `LabTable`; proactive entries re-render the `ProactiveMessageCard`; screenings show their rationale; unknown types fall back to a JSON card. Lands in this session.
- **Screening "why" tag** (one-line rationale per card) — deferred to Phase 1 first sprint.
- **User photo + Settings surface** — deferred to Friday polish if budget allows; Phase 1 otherwise.
- **Unified multimodal input ("+" in composer like Claude.ai)** — this is the correct UX and Juan Manuel flagged it explicitly. Deferred to Phase 1 day-one (~2 hours of rework). For Phase 0 the drop-zone stays separate but the intent is captured.
- **Next Steps / Commitments section** — articulated in ROADMAP capability thread, not built Phase 0.
- **Habits tracking with proxy indicators** — articulated in ROADMAP as own thread, not built Phase 0.

### The re-upload bug Juan Manuel noticed

Juan Manuel tried to upload the same lab PDF a second time after the first 400 bug and the drop zone would not respond. Likely the browser `<input type="file">` does not fire `change` when the selected filename matches the prior one. Quick fix when we revisit the drop zone: clear `inputRef.current.value = ""` after each upload attempt so the same file can be picked again. Captured here; will apply when we next touch `LabDropZone`.
