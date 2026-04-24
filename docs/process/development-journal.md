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

### Language follows the device, not the configuration

Juan Manuel's observation during the live test:

> *"La app debe tomar el idioma del dispositivo en que se está corriendo y usar ese por default, y solo cambiarlo a otro idioma si en el chat o interactuando el paciente lo solicita."*

This is the correct default. Forcing the demo into English during the hackathon is a local decision for pitch purposes; the product itself should read `navigator.language` (or the OS locale on a native wrapper) and start there. The orchestrator's system prompt already says "match the user's language" — the missing piece is that the UI shell (chat placeholder, labels, pills, settings text) should also localize.

Implementation path:
- **Phase 0 (hackathon)**: keep the demo in English for judging; no code change tonight.
- **Phase 1**: read `navigator.language` on first load, route strings through a thin i18n layer (Spanish + English at launch, both first-class), and only override when the user explicitly asks *"tell me in Spanish / in English"* in conversation. The orchestrator already honors mid-conversation switches via the clinical system prompt; the surrounding UI needs to match.
- The user's **preferred language** lives in the canonical profile (`preferences.language`) — once explicitly changed, persist and keep it across sessions regardless of device locale.

Added as an ROADMAP capability clarification under the equity / reach thread.

### UX copy pass — Screenings section renamed + commitment/vaccines ideas

Juan Manuel, while interacting: likes the flow, but the screening section copy is thin. Three concrete signals:

1. **Screenings label** — promote "Recommended screenings" as the primary label with a secondary line "Talk to your doctor about them" and the existing "Preventive checks your companion is tracking" demoted to tertiary text. Landed this session (desktop aside, mobile pill, bottom sheet title).

2. **Commitment date button per screening card** — next to each screening, a small affordance: *"Set a date"* → user picks a calendar date → companion asks *"Want a reminder?"* (Y/N) → reminder is persisted. This is the Next Steps / Commitments layer made visible at the screening card. Phase 1 (tied to the Next Steps thread).

3. **Vaccines section** — a new first-class section alongside Screenings. Two views:
   - **Immunization history**: user logs received vaccines with name + date. Reusable from parsed lab/consultation summaries too.
   - **Recommended vaccines**: surfaced per age / region / condition (influenza annually, pneumococcus at 65, shingles at 50, HPV catch-up in adults 27–45 with shared decision, COVID updates, Tdap booster every 10 years, Hep B if exposed). Cited against CDC ACIP / SSA México.
   Sits cleanly between past (timeline) and future (next steps) since immunizations have both dimensions. Becomes the fifth named layer of the living state document.

4. **Settings: hide sections** — the user should be able to hide sections they don't want in their surface. Vaccines is the tempting case (for users who won't engage with them). Juan Manuel's position is noted and sharp: *"si es sensata y quiere cuidar su salud, no lo hará"* — but the freedom to hide exists regardless of our opinion, and respecting it is the product's moral commitment ("your data, your choices"). Settings toggles land in Phase 1 alongside privacy surface, explicability surface, and language override.

All three Phase-1 items captured in the ROADMAP as additions to the Next Steps / Screenings / Vaccines threads plus the Settings surface.

### The Bridge — Health Companion as a clinician-patient connective layer (Apr 23)

Juan Manuel, walking out the door to work, dropped a pitch-scale idea:

> *"Qué tal una versión de Health Companion como 'puente' entre el profesional de la salud y sus pacientes. Sus pacientes se registran y pagan la suscripción y el profesional tiene un tablero donde mira las metas de cada paciente y tiene llamadas o citas con ellos si algo sale de rango, establece nuevas metas con ellos, los orienta, les da las prescripciones para los checkups, alimenta desde su lado con notas médicas disponibles para el paciente."*

This is not a side feature. It is the shape of the sustainable business model and it closes the loop Hans drew around the product's value:

> *"The value is not in simulating the doctor — it is in being the structured memory and reasoning the doctor doesn't have time to maintain."*

**The bridge version of Health Companion operationalizes that value on both sides**:

- **Patient surface** (what we are already building): chat, labs, timeline, screenings, proactive messages, living state document.
- **Clinician surface (new)**: a per-clinician dashboard with a row per enrolled patient. Each row surfaces current goals, biomarker trends, adherence signals, and — critically — alerts when a value trends out of range. The clinician can schedule a call, co-set new goals, prescribe screenings (which flow into the patient's Next Steps), and write medical notes that the patient reads in their timeline with the companion's calibrated voice translating any jargon.
- **Payment flow**: the patient subscribes through the clinician's practice. The clinician's subscription pricing includes a per-active-patient component and a base platform fee. Some practices charge the patient directly; others fold it into a concierge fee; insurers subsidize in Phase 3.

Why this shape is strong:
1. **It answers "who pays" with a clean enterprise line** — clinicians and small practices have budget for tools that make the 15-minute visit productive. Patients individually pay less readily for preventive tools.
2. **It resolves the regulatory posture sharply.** The patient-facing product stays strictly wellness-education-referral. The clinician-facing product is a clinical workflow tool used by a licensed professional — a category with its own regulatory path (not a medical device, but a clinical-decision-support adjunct).
3. **It lands the equity dimension in practice, not slogan.** In LatAm and underserved US regions, the primary-care shortage is not about whether patients want care — it is about whether their clinician has the time and the context. This gives the clinician both.
4. **It makes the memory visible on both sides.** The same living state document lives in the patient's phone and on the clinician's dashboard. Nothing is hidden, nothing is duplicated. The patient can read their own medical note translated into plain language. The clinician can see what the companion has been doing between visits.
5. **It is what MedAssistant was pointing at** (ROADMAP Phase 4) but reframed as the same product with a clinician view, not a sister app. Simpler to build, simpler to sell, simpler to explain.

**Pitch-line candidate** ⭐:
> *"One product, two surfaces: a warm companion in the patient's pocket, and a structured record on the clinician's desk. The companion does the between-visits work the clinician cannot. The clinician does the in-visit work the companion must not."*

**Roadmap impact**: the "MedAssistant (sister product)" bullet in Phase 4 is replaced with **"Health Companion Bridge — the clinician surface"** promoted to **Phase 2** (public launch). The business-model decision we have been deferring lands cleanly here: B2B2C through clinicians as the primary channel, B2C freemium as the entry path for patients who do not yet have a participating clinician, B2B insurer partnerships in Phase 3 as a scale multiplier.

The rest of the ROADMAP threads align — Next Steps, Vaccines, Habits, proxy indicators, reminder engine — all of them gain a second consumer (the clinician) without needing to be rebuilt. The patient's medical notes flowing into their timeline become the fifth category alongside Companion-generated, Lab, You-said, and Future entries.

This is the strongest shape the business has had so far. Continuing the day's planned blocks while this marinates.

---

### Longitudinal trend charts for tracked parameters (Apr 23 afternoon)

Juan Manuel, quick addition between meetings:

> *"Los laboratorios y parámetros vitales deberían poder graficarse en el tiempo (aquellos definidos como aspectos en los que trabajar) — por ejemplo glucosa en ayunas, peso, masa muscular, presión arterial."*

This is the natural next step for the biomarker layer and it lands squarely on the product thesis: the companion's memory compounding in value only matters if the user can **see** it compound. A sparkline next to "fasting glucose" that shows 118 → 112 → 108 across three months is the "memory made visible" moment the Hans case study described from his own experience.

**Scope** (Phase 1 thread, under §13 Living state document or as its own §18):

- Each tracked parameter — `fasting_glucose`, `hba1c`, `weight`, `muscle_mass`, `systolic_bp` / `diastolic_bp`, `resting_hr`, `sleep_hours`, etc. — gets a small time-series chart when there are ≥ 2 data points on file.
- Only parameters flagged as "aspects to work on" (user-chosen or companion-suggested as part of the care plan) render prominently. Everything else is logged but not surfaced unless the user opens the biomarker detail view.
- X-axis = time, Y-axis = value. Reference range shaded in zinc-100. Color coded per source (objective/blue, chat-reported/amber) — same semantic as the timeline dots, for consistency.
- Tap/click a data point → opens the timeline entry where that value landed, closing the loop between "I see my trend" and "I remember the day this reading came in."
- On the patient surface: simple mobile-friendly sparklines (dense, glanceable). On the Bridge clinician surface (Phase 2): the same data in a larger, interactive chart the clinician can zoom/annotate.

**Where this fits**:

- Short-term (Phase 1 day-one): sparkline under each biomarker in the profile panel and on the `/settings` "Data" tab when we add it.
- Medium-term (Phase 1 late): a dedicated `/trends` view with all tracked parameters, filtering by "aspects to work on" vs. full log.
- Long-term (Phase 2 Bridge): the same charts mirrored on the clinician dashboard, with annotations the doctor writes that the companion translates for the patient ("your doctor noted that the trend over the last month is promising").

**Why this is load-bearing for the pitch**, even if not shipped Sunday:

The three-minute demo will claim that the product's value is memory that compounds. A judge asking *"what does that look like visually?"* deserves a one-sentence answer with a visual in mind. Even without the chart shipping, a line like *"each biomarker you log earns a place on your trend line — glucose over three months, weight over a year"* in the closing monologue makes the abstract claim concrete.

Captured to ROADMAP as a new capability thread. No code tonight — articulation only.

Quotable ⭐:
> *"A trend line is memory you can see."*

---

### Trends v0.1 shipped (Apr 23 afternoon, solo)

Juan Manuel went out to shop for the birthday lunch and asked for a plan
for the next three hours. The highest-leverage, non-clinical item on the
backlog was §16b — the trend charts he articulated this morning. Full
session scoped in `~/.claude/plans/radiant-riding-orbit.md`.

**What landed:**

- **Backend**
  - `apps/api/src/api/routers/trends.py` — `GET /api/trends` groups the
    in-memory biomarker log by canonical name, sorts each series by
    `sampled_on`, attaches a generic-adult `reference_range` when we have
    one (fasting glucose, HbA1c, LDL/HDL, triglycerides, BP, RHR,
    total cholesterol, BMI; weight left personal).
  - `POST /api/trends/seed-demo` — idempotent seeder that plants the Laura
    3-month glucose arc (2026-01-22=118, -02-22=115, -03-22=112,
    -04-22=108). Two `lab_report` endpoints, two `user_said` middles, so
    the source-dot story reads correctly.
  - `seed_biomarker()` added as a public helper in `agents/tools.py` so
    fixtures don't have to reach into module-private state.
- **Frontend**
  - `components/trends/TrendChart.tsx` — no chart library, pure SVG.
    Reference band in zinc-100. Emerald polyline. Source-coded dots
    (blue for `lab_report`/`wearable`, amber for `user_said`/`photo`)
    matching the timeline dot semantics. First and last date labels in
    Geist Mono. Min/max y-axis ticks in mono. Title-tooltip on each dot
    with value, date, and source. `onPointClick` callback in place for
    the future timeline drill-down.
  - `components/trends/TrendCard.tsx` — wraps the chart with label,
    latest value in Geist Mono 3xl, tiny delta-from-prior line, an
    in-range / above-range / below-range pill, and a blue/amber legend
    footer.
  - `/trends` page — grid (1 → 2 → 3 columns responsively), priority
    ordering so fasting glucose lands first, empty state that offers a
    "Load Laura demo arc" button, disclaimer footer calling out that
    ranges are generic adult values pending clinical audit.
  - Nav link added to the main header next to *Settings* / *How this
    works*; small "See trends →" link added to the right side of the
    timeline legend inside `HealthTimeline.tsx`.
  - Everything typechecks clean with `tsc --noEmit`.

**Not shipped (intentional, left for Juan Manuel):**

- **Sparklines in the profile panel.** Wanted to stay inside the 3-hour
  budget without touching the profile-panel layout; defer to follow-up.
- **Drill-down from chart point to timeline entry.** Scaffolded through
  `onPointClick` but no wiring yet — depends on which timeline surface
  is on screen.
- **Managed Agents live path** — still gated by `HC_SKIP_MANAGED_AGENTS_CREATE`.
- **Clinical audit of reference ranges** — generic adult values only.
  Disclaimer on the page makes that explicit.

**Question for Juan Manuel on return:**

> The ranges are generic adult values (e.g. fasting glucose 70-99 mg/dL,
> systolic BP 90-120 mmHg). Good enough for the demo, or do you want me
> to add age/sex/history personalization before Saturday?

---

### Cold-judge polish + first run-through findings (Apr 23 evening)

First end-to-end test surfaced a clinical-shaped bug: Act 1's scripted
opening prompt *"I'm 44. My mom died of breast cancer at 52."* does
not trigger `schedule_screening`. The model chooses to ask for her
name first. Initially read as a demo-killer; Juan Manuel reframed it
as a **feature** — *"cuando estudié medicina no me enseñaron a decir
'te tienes que hacer mamografía' antes de establecer rapport. Esto es
SPIKES aplicado fuera de bad-news."* The companion IS behaving like
a doctor. The demo script is what's wrong. Logged and later rewritten
as two-turn Act 1.

Cold-judge polish shipped (`e004e42`):

- Welcome card with three clickable example chips (sleep · longevity ·
  lab anxiety) — none of them Laura.
- Profile panel humanizer — `family_history.breast_cancer_mother` →
  *"Mother had breast cancer"*. Booleans hidden when redundant.
- `ProactiveLetter` lost the hardcoded *"While we were quiet"* walking
  / glucose / check-in rows (literal lies inside the wow-card); the
  `alert()` became an inline toast; two dead secondary buttons
  removed.
- New `POST /api/demo/reset` + *"Start fresh"* header button.
- `?demo=1` / `NEXT_PUBLIC_DEMO_BYPASS_AUTH` short-circuit on the
  Supabase session guard so a cold judge never hangs on ChatSkeleton.

---

### Laura priming purge (Apr 23 night)

Juan Manuel typed *"I'm 50 and want to stick around longer"* and saw
the reasoning trace running NCCN breast-cancer logic. He had not
mentioned sex or family history. The prompt was priming the model.

Three fixes (`d07765f`, `16386a4`):

- `runner.py` §5 `remember()` examples — Laura replaced with neutral
  scenarios (caregiver for aging parent · four years since the last
  doctor visit).
- `runner.py` §7 reasoning-shape example — the *"44 y/o female,
  maternal breast cancer at 52"* case was pinning the model. Replaced
  with two different profiles (58 asking about a first-time borderline
  BP · 32 asking about sleep after a tough quarter) and an explicit
  rule: **reasoning must follow from what the user has told you;
  never import assumptions from the examples above.**
- `tools.py` descriptions rewritten with broad examples across
  domains; `fetch_guidelines_for_age_sex` description hardens the
  "never infer sex" guardrail.

But the bigger culprit lived in the frontend.
`ReasoningSheet.extractSources()` had **hardcoded defaults** that
surfaced *"USPSTF 2024 — breast cancer screening"*, *"NCCN v.2.2025 —
high-risk assessment"*, and *"Dr. Fraga's clinical voice guide
(internal)"* on every reasoning trace whose keywords didn't match the
narrow allowlist. A 50-year-old asking about longevity was seeing
NCCN breast-cancer high-risk assessment as a source. Rewrote with a
topic→source pattern table, narrow matches only, and the honest
fallback: *"Your conversation so far — nothing else looked up yet."*

Also killed the `ProactiveLetter` fallback copy *"Hold a mammography
slot"* when `next_step` was empty — replaced with neutral *"Put this
on your calendar."*

Retest on the same prompt: reasoning now reads *"So they're 50 and
concerned about living longer, but I don't have their name or sex
yet — I shouldn't make assumptions. I'll skip looking up guidelines
until I know more about them."* Turn time dropped from ~60 s to
~16 s because the model stopped chasing a phantom screening decision.

Lesson logged: **defaults that fire "when nothing matches" are a
leak vector.** Audit every `fallback` / `default` in the UI against
the product's priming discipline.

---

### Repo honesty pass (Apr 23 night)

Juan Manuel's directive: *"revisa el repo, tambien debe haber muchos
falsos mensajes por ahi que limpiar, empezando por el readme."*

Findings: README pinned the product to Laura's story, claimed
*"SQLAlchemy"* (unused), *"Data: SQLite, shipped with the repo"*
(doesn't exist), *"no authentication and a single seed profile"*
(Supabase Auth is wired). `architecture.md` had a SQLite diagram
that didn't match reality, an `agent_runs` table that was pure
aspiration, and *"No authentication for the demo. Laura is the only
profile."* `agents.md` promised per-turn cost tracking that isn't
implemented.

Shipped (`4639c09`):

- README rewritten — Laura reframed from *product description* to
  *recorded walk-through* used in the submission video. Tech stack
  honest about in-memory state, Supabase Auth wired with demo
  bypass, persistence deferred to Phase 1.
- `architecture.md` rewritten against ground truth — in-memory
  state stores documented with shapes, SQLite diagram and
  fabricated `agent_runs` removed, persistence plan moved to the
  Phase 1 section where it belongs.
- `agents.md` observability section now reads *"Not implemented in
  the MVP"* — replaced the cost-tracking claim the pre-judge audit
  flagged (B11).
- 11 process docs moved via `git mv` to `docs/process/` (history
  preserved): thesis, concept, competitive analysis, hackathon
  brief and plan, demo script, clinical audit checklist,
  run-through findings, managed-agents notes, submission draft,
  development-journal itself. New `docs/process/README.md` index.
  Keeps `docs/` as reference docs, `docs/process/` as archive.
- `/trends` empty-state CTA + `trends.py` seed docstring no longer
  say "Laura".

---

### Product horizon — thinking beyond the hackathon (Apr 23 night)

Juan Manuel, as the submission deadline approached:
*"dame el roadmap completo y detallado con lo hecho y lo que falta
como si no fuera para el hackathon. Me estoy entusiasmando con este
proyecto y quiero que se convierta en realidad."*

New artifact: `docs/product-horizon.md` (~477 lines, 6 parts).

1. Ground-truth state — what code actually runs, what is prose, what
   is honestly missing (no persistence, no observability, no tests,
   no production deploy, no team, no legal, no pilot).
2. Five phases — Phase 0 (hackathon MVP, ending) · Phase 1
   (production-ready single user, Q2) · Phase 2 (the Bridge, real
   clinician workflow, Q3–Q4) · Phase 3 (evidence + scale, 2027) ·
   Phase 4 (policy infrastructure — insurers + ministries of health,
   2028+).
3. Concrete next 60 days.
4. Decisions that shape everything — geographic focus (MX-first
   likely · US-first possible), commercial structure (bootstrap vs.
   angel vs. grant), co-founder, first pilot site, regulatory
   posture, OSS posture, team narrative.
5. Assets to hold onto when the work gets hard.
6. Risks if momentum stalls.

The moment Juan Manuel asked for this, Health Companion stopped
being a hackathon artifact in his head.

---

### Demo-script v2 (two-turn Act 1) + Bridge Preview (Apr 23 night)

The clinical insight from the first run-through collapsed into demo
structure. Act 1 rewritten as two turns:

- Turn 1 · *Hi, I'm Laura. I'm 44. My mom died of breast cancer at
  52.* → companion names her loss, asks what's on her mind. Profile
  panel fills in live.
- Turn 2 · *I want to understand my own risk.* → companion proposes
  mammography with full NCCN reasoning available in the See
  reasoning disclosure.

3:00 budget still holds: cold open trimmed to 12s, Act 1 grows to
~78s, Act 2 to 55s, new Bridge segment at 20s, close at 15s.

Bridge Preview shipped (`caab404`):

- `/bridge` — white-label header with dashed "Your clinic here"
  placeholder + *"powered by Health Companion"*.
- Left rail: four enrolled patients. The first reads real backend
  state (`/api/profile`, `/api/screenings`, `/api/trends`) so if the
  judge has been chatting, their own thread lives there. The other
  three are illustrative (Carlos 58 BP creeping, Ana 42 post-endo
  TSH 3.2 normalizing, Miguel 64 overdue colorectal with a plateaued
  weight loss).
- Selected patient detail: goals, amber *"Prepared for next visit"*
  bullets derived from state, between-visit trend cards reusing
  `TrendChart` + `Sparkline`, and the key beat: clinician note in
  clinical language alongside its auto-translated plain-language
  version the patient actually reads.
- Phase-2 preview tagged in the footer. Not clinical use.

Voice I/O explicitly deferred — latency risk against a judge's
three-minute patience is not worth the reward until we have time to
build it properly.

---

### Accessibility as a cost-architecture constraint — ROADMAP §18 (Apr 23 night)

Juan Manuel, after checking the Anthropic console: *"cada llamada hace
20,000-30,000 tokens de entrada y unos 300 a 3000 de salida. Si una
persona lo usa diario 2-3 veces el costo puede llegar a ser de miles
de dólares al mes..."*

He overestimated per-user (math is $12–20/month), but at scale the
concern is real: 10K users → $120–200K/month, 100K → $1–2M/month. At
those numbers, **the product reinforces the inequity it claims to
invert.**

ROADMAP §18 added (`5814983`) — honest per-turn cost breakdown of
~$0.17 today (system prompt ~5K tokens, growing state snapshot, full
conversation replay, adaptive-thinking-at-max consuming output
budget), seven levers in priority order, and the target:

  prompt caching with 1-hour TTL, turn-type routing (Haiku for
  rapport, Sonnet for everyday, reserve Opus for labs / screenings /
  proactive), extended thinking on demand rather than by default,
  conversation history compression, embedding-retrieved memory,
  local classifier on the existing MLX infrastructure, sectioned
  system prompt.

First three alone take per-turn cost from $0.17 to ~$0.04 without
touching the clinical surface. Per-heavy-user monthly cost falls
from $12–20 to under $3 — the threshold where primary-care
economies in México can absorb it.

Mapped onto four tiers: free (first-timer, funded by the tiers
below) · patient ($3–5/mo subscription) · Bridge B2B2C
($10–20/patient/mo paid by the clinic) · public-health tier priced
against IMSS / CMS preventive-care reimbursement codes.

README design-principles section gets a new bullet so the
commitment is visible above the fold: *"Accessibility is an
architectural constraint."*

---

### Friday prep — deploy playbook + clinical-audit cross-reference (Apr 23 night)

Two artifacts so Friday is mechanical, not investigative (`51929cd`):

- `DEPLOY.md` at repo root — Fly.io + Vercel + CORS + custom domain
  + rollback + known limitations, top-to-bottom, commands quoted
  verbatim. `apps/api/Dockerfile` + `fly.toml` + `.dockerignore` +
  `apps/web/vercel.json` all scaffolded alongside.
- `docs/process/clinical-audit-crossref.md` — every row of the
  clinical-audit checklist mapped against the current SYSTEM_PROMPT
  with line numbers and a four-level verdict (✅ matches ·
  🔶 close-different-wording · ⚠️ gap · 👤 needs-judgment). Eight
  rows pre-flagged as the items that actually need Juan Manuel's
  30 minutes Saturday; the rest are rubber-stamps with the quoted
  prompt line already next to them. Critical flags:
  - NCCN "10 years earlier" is in the guideline table but not in
    the prompt §4 — the demo narration and ReasoningSheet both
    ride on this claim. Move into §4?
  - Red-flag escalation script references "911" (US only); add MX
    regional phrasing for the recorded walk-through.
  - Scripted pushback phrases for *"can you diagnose me"* / *"can
    you prescribe"* aren't explicit in §9; rely on voice or script?

---

### PHI/PII clarification from the hackathon Q&A (Apr 24 morning)

Anthropic's response to the Managed-Agents-vs-patient-privacy question
Juan Manuel filed: *"I would suggest not putting real PHI/PII in your
project. Your business needs an enterprise subscription and a BAA
with Claude/Anthropic in order to have your managed agents
HIPAA-ready."*

Two implications, both load-bearing:

- **For the submission**: synthetic data throughout the scripted
  walk-through. If a judge interacts with their own information,
  `/privacy` says so honestly — demo environment, not clinical-
  grade. The sample lab PDF must be fully PHI-free.
- **For the product**: Managed Agents is not BAA-covered by default.
  The migration from Messages API to MA for real clinical workloads
  waits on enterprise + BAA. **The patient surface stays on
  Messages API through Phase 2.** For México specifically, HIPAA
  doesn't apply but LFPDPPP + NOM-004-SSA3-2012 do — Aviso de
  Privacidad + informed consent become pre-conditions for the
  Bridge pilot.

`/privacy` and README rewritten (`ab2c9d7`): scripted patient is
synthetic, judges welcome to try with their own info knowing this is
a demo environment (not clinical-grade yet), Phase-1 work to reach
the bar is scoped explicitly in `docs/product-horizon.md`. Old
claims about encryption *"at rest and in transit"* reframed as
Phase-1 promises alongside the demo reality (in-memory, Start fresh
clears server-side instantly).

---

### Synthetic lab fixture + LDL arc with a setback (Apr 24 morning)

Juan Manuel: *"Lo que vamos a hacer es que te daré un laboratorio mío
y lo vas a modificar para que cumpla lo necesario para la demo."*
Pulled his January lab via Tailscale scp. Anonymization plan
documented row-by-row, approved, then executed.

Regenerated from scratch via `reportlab` rather than editing the
original — cleanest PHI removal (no hidden metadata, no incomplete
redaction risk). Synthetic patient **Laura Fernández Herrera**,
44 y/o female, fake MRN, DOB 15/03/1982. Hemoglobin 14.2 /
hematocrit 42 adjusted into adult-female reference band. PSA
removed entirely (male-only test). Fasting glucose anchored at
**118** per Juan Manuel's call to preserve the demo narrative
beat. Third-party identifiers removed: Dra. Adriana Mendoza Noguez
(lab technician), Hospital H+ / HOSPITALES MAC branding, contact
info in the footer. Visible *"DEMO · SYNTHETIC DATA"* band on every
page — self-documenting if the file ever leaves the demo context.
`fixtures/labs-laura-demo.pdf` + `fixtures/make_lab_pdf.py` +
`fixtures/README.md` (`ab2c9d7`).

Juan Manuel's directive for the /trends seed: *"quizá no mostrar
una curva descendente sino con ups and downs aunque al final, mejor
y quizá de 6 meses."* Replaced the 3-month glucose linear descent
(118 → 115 → 112 → 108) with a 6-month LDL arc:
**136 → 128 → 141 (setback · travel broke the routine) → 132 →
124 → 112.** Three `lab_report` + three `user_said` sources,
interleaved so the source-dot story reads correctly. Ends better
than it started — real change is not linear, and the companion
gets a voice for the setbacks, not just the wins.

Demo-script v3 rewrites Act 2 narration to name multiple findings
(glucose 118, LDL 136, cholesterol 223, HDL 70 protective) instead
of the single glucose anchor, and adds an Act-2 close visit to
`/trends` to narrate the LDL setback-and-recovery arc.

Quotable ⭐:
> *"Real change isn't linear — and the companion has a voice for
> the setbacks, not just the wins."*

---

### Labs ingest bug caught in pre-deploy testing (Apr 24)

Juan Manuel left for work; Task A of the morning was to verify the
new synthetic PDF ingests cleanly through `/api/ingest-pdf` before
Friday's deploy.

First run (`MAX_TOKENS=8192`, `effort=max`): HTTP 200, but
`lab_analysis={}` empty and **zero biomarkers stored**. The
reasoning trace showed the model's intent — *"I'll batch the
biomarker logging calls and the profile update together, then
write out the narrative summary, and finally submit the full
analysis"* — but the stream ended without emitting any `tool_use`
blocks. Adaptive thinking at max effort consumed the entire 8K
token budget on reasoning; when the model tried to pivot to tool
use, there were no tokens left. The forced follow-up turn then
emitted `submit_lab_analysis` with an empty payload because nothing
had been extracted yet.

This would have been demo-killing during Saturday's recording —
silently, without an error. Caught it Friday morning instead.

Fix (`67b42dd`): `MAX_TOKENS=24576`, `THINKING_EFFORT=high`. Retest:

- 4 phases animate fully (opening_pdf → extracting_values →
  cross_referencing → drafting_response).
- 60 `log_biomarker` calls, 55 unique values stored.
- `save_profile_field` infers `sex=female` from the report.
- 55 structured values, 6 tiered flags
  (`talk_to_doctor` · `watch` · `info`), 6 `doctor_questions`.
- `panel_summary` opens *"Laura, the overall shape of this panel
  is mostly reassuring, with a few specific threads worth following
  up..."* — the clinical voice landing exactly as authored.
- Turn time went from 1:57 to 2:32 — acceptable because the
  four-phase reading-state animation covers the wait.

Lesson: **any endpoint that ends with tool calls needs token
headroom beyond the thinking budget.** Worth auditing `chat.py` and
`simulate.py` for the same pattern — not this session, on the
Phase-1 list.

---

### The natural history of disease — thesis §5 (Apr 24)

Juan Manuel, while installing Remotion to make editorial clips for
the submission video: *"cuando estudié medicina me explicaron que
en la historia natural de cualquier enfermedad existen tres
etapas..."*

He articulated what med school teaches (Stage 1 Health · Stage 2
Preclinical · Stage 3 Clinical) and — more importantly — **what it
does not teach explicitly**: that Stage 1 is not a passive state.
*"En la etapa de salud el individuo construye su salud presente y
futura (O NO)."* The difference between arriving strong at sixty
and arriving fragile is not made by the diagnosis at 52 — it is
made across the two decades when nobody was watching.

Health Companion's intention reframed: **meet the person before
Stage 2, or at worst inside it; not only hold the line, but lift it
above the original Stage-1 level.** The measurement reframes with
it — the product succeeds not by diagnoses caught (consequence) but
by years of real health actively built before the system had reason
to call the person a patient (purpose).

Shipped (`2624211`):

- Thesis §5 — in the founder voice, positioned between *"three
  educational goals"* and *"two levels of prevention"* so the
  clinical framing sets up why prevention is tiered in the first
  place. Sections 6–11 renumbered.
- README "Where we intervene — the three stages of any disease"
  section before Design principles. Pitch-voiced.
- `docs/process/video-hackathon-brief.md` — a prompt-ready brief
  for a dedicated Claude Code session running Remotion to produce
  five editorial clips that interleave with the Loom recording:
  01 the three stages (thesis carrier) · 02 where we intervene
  (cross-fades with 01, shows the lifted line above original
  Stage-1 level) · 03 one product two surfaces (phone + Bridge
  connected by emerald arc) · 04 the sanitary interpreter
  (medical term → plain language) · 05 memory compounding
  (sparkline with mid-arc setback — the LDL arc the /trends seed
  now produces). Visual language locked to the product's palette
  (paper + zinc + semantic emerald / amber / blue).

Quotables ⭐:
> *"Stage 1 is not a passive state. In the health stage, the
> person is either building their future health every day or
> eroding it every day."*

> *"Leave the person measurably better than when we met. A life
> measured not by a diagnosis avoided, but by a level of health
> actively built."*

---

### Token-budget audit of chat + simulate (Apr 24 afternoon, solo)

Juan Manuel left for work with the video-hackathon session running.
Logged into the plan: take a second pass at the MAX_TOKENS /
thinking-effort pattern across the other two endpoints to catch
silent demo-killers before Saturday.

**Chat (`runner.py`, `MAX_TOKENS=6144`, `effort=max`).** Reproduced
the two-turn Act 1 end-to-end:

- Turn 1 *"Hi, I'm Laura. I'm 44. My mom died of breast cancer at
  52."* — 47 s, 3 `save_profile_field` + 1 `remember`, in-voice
  prose response, 28 reasoning deltas.
- Turn 2 *"I want to understand my own risk. What should I actually
  be doing?"* — 91 s, 3 tool_use blocks (2 `schedule_screening`
  with full guideline citations + 1 `save_profile_field` for the
  concern), 44 reasoning deltas, 41 message deltas. All tool_use
  JSON parsed cleanly.

No truncation. No change to budget. The 6144 limit holds for even
the densest chat turn in the demo. Keep it.

**Simulate (`simulate.py`, `MAX_TOKENS=4096`, `effort=max`).**
Reproduced the +3 months proactive flow against the full Turn-2
state (profile + 2 screenings + LDL seed):

- 44 s total. Single reasoning_start/reasoning_stop cycle — the
  model emitted `submit_proactive_message` in the free turn, no
  forced follow-up needed.
- `proactive_message` payload complete: 481 chars of text, 4
  concrete `context_refs`, detailed `next_step`.
- `timeline_event` written correctly.

Also no truncation. 4096 with effort=max holds because the output
is short by design (2–4 sentences), even with adaptive thinking.

**Finding**: the labs.py bug was special — multimodal ingestion
with ~55 biomarkers needed a huge tool-call volume, and 8K was
hungry. Chat and simulate have a small tool surface per turn and
fit comfortably inside their budgets. The audit pattern stands
(*"any endpoint that ends with tool calls needs token headroom
beyond the thinking budget"*) but does not force changes here.

---

### Pre-flight script for the demo (Apr 24 afternoon)

`scripts/demo-preflight.sh` added. One command that:

1. `curl /health` — fails fast with a specific error if the API is
   unreachable (exit 1).
2. `POST /api/demo/reset` — clears the five in-memory stores.
3. `POST /api/trends/seed-demo` — plants the six-point LDL arc.
4. `--seed-laura` (optional) — primes the profile with a single
   `/api/chat` call so a second take doesn't start from zero.
5. Prints the pre-record checklist (incognito · `?demo=1` ·
   reasoning toggle · zoom 100% · PDF on desktop · audio check ·
   screen recorder armed · notifications off).

Parameterized by `HC_API_URL` env var so the same script runs
against localhost today and the Fly.io URL when it goes live.
Exit codes specified (0 ok · 1 API unreachable · 2 reset failed ·
3 seed failed · 64 unknown flag). `--help` prints the header
docstring.

---

### Clinical audit cross-ref line-number refresh (Apr 24 afternoon)

Re-verified every line number in
`docs/process/clinical-audit-crossref.md` against the current
SYSTEM_PROMPT after the priming purge (`d07765f`). Only one row
needed an update: §7 "Extended-thinking guidance" — the two neutral
illustrative examples now live at lines 283-293 (previous cross-ref
had them unspecified), and the new hard guardrail ("reasoning must
follow from what the user has actually told you") lives at
297-303. Header note added to the cross-ref documenting the refresh
date so Juan Manuel knows it is still trustworthy when he opens it
Saturday.

All other line citations (Rules 1-6, sanitary-interpreter table,
screening knowledge block, tool-use protocol, six beats, anti-
patterns, false-reassurance paragraph) checked out unchanged.

---

### RESOLVED — Claude Design render (was OPEN Apr 22 night)

The hypothesis list from that night (AuthSkeleton stuck · hydration
mismatch · session-guard flicker · stale service worker) was
superseded by a simpler fix. The `?demo=1` +
`NEXT_PUBLIC_DEMO_BYPASS_AUTH` short-circuit in `ChatPage`
(`e004e42`) means the session guard never holds the cold user on
the skeleton, regardless of whether Supabase resolves. Juan Manuel
confirmed the new visual surfaces (welcome card, humanized profile
panel, Start fresh, Bridge page, /trends with sparklines) render
cleanly from multiple browsers after the cold-judge pass landed.

The same night's `<input type="file">` re-upload issue (can't pick
the same filename twice) is resolved implicitly — the drop zone
re-mounts when Start fresh fires — though a proper
`inputRef.current.value = ""` reset remains the right fix when we
next touch `LabDropZone`.

---

### OPEN — Claude Design render not visible (Apr 22 night · RESOLVED above)

Implemented the full Claude Design handoff (commits `1bec7c0` and prior). The new visual (companion prose + heart avatar, Laura emerald bubbles, ToolTraceCard, ScheduleCard, inline LabExpanded, pill composer, reading-state animation, ProactiveLetter, ReasoningSheet) does not appear in Juan Manuel's browser.

Confirmed on his side:
- Two browsers on the laptop render the same old look.
- Phone renders the same old look.
- Not a cache issue (multiple independent caches can't all be stale identically).

Confirmed on the server side:
- `npm run build` green, 6 routes static.
- Fresh `.next` dir, dev server bound to `0.0.0.0:3000`, single next-server process.
- Compiled client chunk `src_0d_f.le._.js` contains the string "Your companion" 4 times — new code IS in the bundle.
- Initial HTML response is a skeleton (expected; auth loads client-side).

Hypotheses for tomorrow morning:
1. `AuthSkeleton` never unmounts — the `loading` from `useAuth()` never flips false on his client, so `ChatExperience` never mounts. Check the AuthProvider state on hydration; may be Supabase client init failing silently in production mode vs dev.
2. React hydration mismatch between server skeleton and client ChatExperience; the browser quietly keeps the server tree. Would show as a warning in the console.
3. The `ChatPage` session guard redirects on every render because `session` becomes `null` briefly. Would show as /login URL.
4. Service worker from earlier overnight install (none registered that I know of, but worth verifying `navigator.serviceWorker.getRegistrations()` in DevTools).

First morning check: open `http://100.72.169.113:3000` in a **new incognito window**, sign in as demo user, open DevTools Console — look for hydration errors / Supabase auth errors. If there are none and the UI still renders old, read the page DOM to confirm which component branch actually rendered.

If hydration is silently swallowed, temporary unblock: move the page content to a Server Component wrapper that shows the new UI unconditionally while debugging the auth guard.

Juan Manuel tried to upload the same lab PDF a second time after the first 400 bug and the drop zone would not respond. Likely the browser `<input type="file">` does not fire `change` when the selected filename matches the prior one. Quick fix when we revisit the drop zone: clear `inputRef.current.value = ""` after each upload attempt so the same file can be picked again. Captured here; will apply when we next touch `LabDropZone`.
