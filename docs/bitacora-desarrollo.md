# Bitácora — Health Companion

> Working journal of sessions between Juan Manuel Fraga and the team of agents.
> **Purpose**: capture the ideas, decisions, and learnings that surface during the build. Raw material for the Sunday April 26 submission and for the story of the project beyond the hackathon.
> The filename stays *bitácora* — Spanish for captain's log — as a nod to where the project was born. The content is English so judges and future readers can follow.

## Conventions

- One entry per session, in chronological order.
- At the end of each session, `hc-coordinator` drafts: (a) quotable one-liners, (b) decisions made, (c) what shifted since yesterday, (d) what's next.
- Juan Manuel reviews and adds what the agent missed — his voice is the definitive one.
- Entries are cumulative. Never overwritten. When a decision is reversed, the new session documents the reversal without erasing the original.
- Quotables that land verbatim in the pitch or the demo video are marked with ⭐ in the log.

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
