# Health Companion — Product Horizon

> *A map of where we are and what it takes to become Health Companion for real.*
>
> This document complements [`../ROADMAP.md`](../ROADMAP.md). The ROADMAP is
> a catalog of capability threads; this is the strategic trajectory —
> phases, dependencies, decisions that shape everything. Written the night
> of April 23, 2026, as the hackathon sprint nears submission and the
> founder is starting to think about what comes next.

---

## Part 1 · Where we are today (ground truth)

### What runs in code

**Patient surface — a working prototype of the conversational health companion:**

- Cold-open chat with welcome card and three clickable example chips
  (sleep · longevity · lab anxiety), none of them pinned to a specific
  user story.
- Streaming chat with visible tool-use trace, companion prose
  asymmetric from user bubbles (by design).
- Humanized profile panel — no JSON leaks; dotted-key paths mapped to
  human labels ("Mother had breast cancer" rather than
  `family_history.breast_cancer_mother`), booleans hidden when
  redundant, units appended to numeric fields.
- Biomarker tracking list in the sidebar with inline sparklines, auto-
  refreshing when the biomarker count changes.
- Recommended-screenings calendar with guideline citations.
- Timeline rail with source-semantic dots (blue objective, emerald
  companion, amber self-reported), inline expansion for lab reports,
  filter to the `/trends` surface in the legend.
- Multimodal lab ingestion — PDF, JPEG, PNG, WEBP, HEIC — directly
  into Opus 4.7, no OCR layer. Phase events (opening, extracting,
  cross-referencing, drafting) surface in the drop-zone.
- Three-months-later proactive simulation with a full-height letter
  layout, context-refs rendered as amber pill-tags, one honest CTA,
  inline toast instead of `alert()` for unfinished integrations.
- "See reasoning" opt-in disclosure — off by default, toggled from
  Settings, showing companion thinking with sources extracted from the
  conversation (never hardcoded defaults).
- `/trends` page with full time-series charts, reference-range bands,
  source-colored dots, a demo-arc seeder for the empty state.
- `/settings` with the reasoning-visibility toggle + placeholders for
  Phase-1 toggles.
- `/privacy` and `/how-this-works` static surfaces.
- Emergency pill — persistent, region-specific crisis numbers.
- Supabase Auth wired on the web app with `?demo=1` bypass and
  `NEXT_PUBLIC_DEMO_BYPASS_AUTH` for a zero-friction judge URL.
- `Start fresh` header button + `POST /api/demo/reset` that clears
  every in-memory store so anyone can try their own life.

**Clinician surface — preview only (`/bridge`):**

- White-label header with a dashed "Your clinic here" placeholder +
  "powered by Health Companion."
- Patient panel rail of four entries — the first reads real state
  from `/api/profile`, `/api/screenings`, `/api/timeline`,
  `/api/trends`; the other three are illustrative (Carlos 58 w/ BP
  trending, Ana 42 post-endo, Miguel 64 overdue colorectal).
- Selected-patient detail pane: goals, "prepared for next visit"
  amber bullets derived from real state, between-visit trends
  (reusing `TrendChart` + `Sparkline`), clinician note and the
  same note auto-translated to plain language for the patient.
- Read-only. No actual clinician workflow, no authentication, no
  note persistence. Phase-2 preview tagged in the footer.

**Orchestrator — the Opus 4.7 runtime:**

- Single agent with 5 typed tools: `save_profile_field`,
  `schedule_screening`, `fetch_guidelines_for_age_sex`,
  `log_biomarker`, `remember`.
- Adaptive extended thinking exposed through the disclosure surface.
- Prompt caching on the static system block (`cache_control:
  ephemeral`, 5-min TTL).
- Per-turn state snapshot injected as a fresh second block so every
  endpoint sees the same cross-endpoint memory without caching the
  snapshot itself.
- Guardrails: clinically-audited SYSTEM_PROMPT (purged of
  Laura-specific priming), sanitary-interpreter glossary,
  anti-patterns (no "as an AI," no false reassurance, no diagnosis,
  no prescription).
- Separate Managed-Agents path at
  `/api/simulate-months-later-managed` for the proactive beat —
  exercises the Managed-Agents side-prize narrative without
  committing the whole product to it.

**Governance and safety expressed in code:**

- Semantic palette discipline: emerald for companion, amber for
  proactive, blue for objective data. Red reserved for critical
  states only.
- Never-diagnose / never-prescribe / always-refer baked into the
  orchestrator prompt with citation expectations.
- False-reassurance guard documented and enforced in the prompt.
- Authorship disclosed — the clinical voice is written and reviewed
  by a practicing physician, and that is visible in
  `/how-this-works`.

### What exists as prose but not code

- [`../ROADMAP.md`](../ROADMAP.md) — 18 capability threads across
  Phase 0–4, with §18 (accessibility/cost architecture) added the
  same night as this doc.
- Founder's thesis · competitive analysis · original hackathon brief
  · hackathon week plan · demo script v2 · submission drafts (three
  lengths) · clinical audit checklist · run-through findings ·
  development journal — all in [`./process/`](./process/).
- Three-users infographic — Nano-Banana render in
  `docs/assets/three-users-nanobanana.png`, full HTML poster in
  `docs/assets/three-users.html`.

### What is honestly missing

- **Persistence.** Every state store is a Python module-level
  collection. Process restart = data loss. No per-user scoping.
- **Observability.** No cost tracking, no per-turn audit rows. The
  `agent_runs` table is aspirational, not real.
- **Tests.** Zero. No pytest suite, no Playwright, no smoke
  coverage.
- **Production deployment.** Runs on an M4 via Tailscale only.
  Vercel and Fly.io are scoped in docs, unbuilt in practice.
- **Real-PDF validation.** Act 2's multimodal path has never been
  end-to-end tested with a real anonymized lab PDF.
- **Clinical audit run.** The checklist is written; the row-by-row
  review by a practicing MD has not yet happened.
- **Team.** One founder plus Claude Code subagents. No co-founder,
  engineer, or designer on staff.
- **Legal.** No entity, no IP assignment, no partnership
  agreements, no BAA with Anthropic or any data processor.
- **Pilot.** No clinic, no patient. Hypothetical users only.

---

## Part 2 · Phases toward real

### Phase 0 · Hackathon MVP (April 21–26, 2026) — ending

The first breath. The product's soul demonstrated in a 3-minute
recorded walk-through and a public repo. Already in progress; a
submission lands Sunday April 26, 7 PM CDMX.

**What Phase 0 proves:** the shape of the product — tool use,
multimodal, memory that compounds across endpoints, opt-in reasoning
disclosure, clinically-audited voice, white-label Bridge preview,
accessibility as a design constraint.

**What Phase 0 does not prove:** scale, cost discipline at volume,
multi-user reality, clinical durability under a real panel.

### Phase 1 · Production-ready single user (Q2 2026 · ~8–12 weeks)

**Goal:** anyone can sign up, their state persists, and a heavy
daily user costs the company under $3/month in inference.

**1.1 Persistence and per-user scoping (4–6 weeks).** Migrate the
five in-memory stores to Supabase Postgres with Row-Level Security.
Every row keyed to `user_id`. pgvector on `semantic_memory` once
tag-based retrieval is insufficient. Supabase Storage for uploaded
lab PDFs and images. A background job runs the episodic →
semantic distillation pass at end of session or on idle.

**1.2 Cost architecture (4–6 weeks).** The three levers that matter
most, in order: (a) prompt caching with 1-hour TTL and a split
state snapshot — a semi-stable half (profile + semantic memory)
that caches, a fresh half (recent biomarkers, last few turns) that
doesn't; (b) turn classifier routing — rapport and memory-writes
to Haiku 4.5, everyday turns to Sonnet 4.6, reserve Opus 4.7 for
multimodal ingestion, screening reasoning, proactive letters, and
anything audit-bearing; (c) extended thinking on demand rather
than by default. Local classifier on the existing MLX / Ollama
infrastructure so the decision itself doesn't add a paid call.
Target: per-turn cost from $0.17 to $0.04.

**1.3 Observability and billing readiness (2 weeks).** The
`agent_runs` audit table Phase 0 skipped. Per-user, per-turn
input/output tokens, cost, tool-call digest, error field. A
lightweight ops dashboard. Cost alerts.

**1.4 Clinical voice refinement (ongoing).** Monthly audit cadence
against the checklist. Guideline versions tracked in code, not
prose. A first Spanish-first pass of the clinical voice — Mexican
register — so the product ships in the language most of its
hypothetical users speak first.

**1.5 Production deployment (1 week).** Vercel + Fly.io, a custom
domain, monitoring (Sentry), alerts, a CI pipeline from `main`.
Documentation that a non-author can deploy from.

**1.6 Closed beta (ongoing).** Waitlist → 20–50 real users.
Weekly blinded audit of real transcripts by the clinical author.
NPS and qualitative interviews at week 4 and week 8.

**What Phase 1 proves:** the product is durable under real use,
the economics work, the clinical voice holds up, a physician-
author can keep drift under control.

### Phase 2 · The Bridge (Q3–Q4 2026 · ~16–20 weeks)

**Goal:** clinicians use this in practice with their own panel.

**2.1 Real clinician workflow.** Clinician authentication, panel
of enrolled patients, clinician note editor with LLM-assisted
plain-language translation, patient-facing surface of notes,
soft flags derived from real state (overdue screenings, trending
biomarkers), shared calendar awareness.

**2.2 White-label configuration.** Clinic branding (logo, colors,
name). Clinic-specific guideline overlays on top of the global
USPSTF / NCCN baselines. Panel-level reporting (aggregate
engagement, screening completion rates, flags raised per month).

**2.3 First pilot.** One Querétaro primary-care or cancer-center
partner. 50–200 enrolled patients. A 6-month intervention vs.
matched control. Primary outcomes: adherence to recommended
screenings, appointment show-rate, unplanned visits, self-reported
preparedness ("I knew what to ask my doctor"). Secondary:
clinician-reported time saved on between-visit work.

**2.4 Regulatory.** Business Associate Agreement with Anthropic
for US paths. Formal COFEPRIS wellness classification. HIPAA
posture documented for US expansion readiness. MDR / CE mark
scoping conversation for EU readiness (not engaged yet).

**What Phase 2 proves:** the Bridge thesis — one product, one
surface for the patient, one for the clinician — isn't a pitch
slide. Clinicians actually pay for this; patients actually feel
the continuity.

### Phase 3 · Evidence and scale (2027)

**Goal:** evidence that moves policy and commercial validity.

**3.1 Multi-language.** Spanish (MX register default) plus
English. Portuguese (Brazil). French / Arabic / Mandarin as
partnerships dictate.

**3.2 Wearable integrations.** Apple Health and Google Fit first.
Garmin, Whoop, Oura, Dexcom. Home BP monitors (Omron, iHealth).
CGM (Dexcom G7, Libre 3). The signal is continuous ingestion, not
button-pressing.

**3.3 Full pillars.** Prevention (shipping). Body (training load,
sleep, VO2max context for those who tolerate depth). Mind (PHQ-9
and GAD-7 screening with clinical referral path). Risk-reduction
habits (smoking, alcohol, diet interventions with evidence-based
escalation). Disease management (chronic-condition care plans
with clinical partner oversight).

**3.4 Outcomes study.** Pragmatic trial or formal RCT in
partnership with an academic medical center. Screening uptake,
HbA1c trends, BP control, NPS, cost offsets. Publish in a
general-medicine journal.

**3.5 Commercial scale.** 100 clinics, 10K+ enrolled patients,
monthly revenue covering infrastructure + small team. First
external hires: clinical operations, engineering.

**What Phase 3 proves:** evidence you can show an insurer, a
ministry of health, or an academic partner without apologizing.

### Phase 4 · Policy infrastructure (2028+)

**Goal:** what clinics pay for becomes what insurers pay for
becomes what governments pay for.

**4.1 Insurer pilots.** Medicare Advantage and Medicaid MCOs in
the US (preventive-care codes). IMSS, ISSSTE, and Mexican private
insurers. Preventive-care reimbursement claims flowing.

**4.2 Policy partnerships.** Secretaría de Salud México. Ministry
of Health partnerships in target LatAm countries. WHO
noncommunicable-disease prevention frameworks.

**4.3 Open standards.** FHIR compatibility. EMR exports.
Bidirectional data flow with clinical systems in the US and MX.

**What Phase 4 proves:** the thesis — a health system paid to
keep people well — stops being a startup pitch and becomes policy
infrastructure.

---

## Part 3 · Concrete next 60 days

Assumes the hackathon submission lands Sunday, April 26.

### Week 1 · April 28 – May 4

- Submission retrospective: what the judges said, what was missed,
  what was confirmed.
- Decide: stay closed-list or open a waitlist.
- First engineering-hire conversation (if going the co-founder
  route) or consulting agreement (if hiring help).
- Legal: first draft of incorporation documents (México SAPI, or
  Delaware C-corp, or LLC — depends on funding path).

### Weeks 2–4 · May

- Supabase Postgres migration underway.
- Per-user auth wiring completed; demo bypass gated off in prod.
- Waitlist landing page live.
- First 20 real users in closed beta with the founder reviewing
  transcripts weekly.
- First draft of the cost-architecture work — caching config + a
  prototype turn classifier.

### Weeks 5–8 · June

- Cost architecture shipped — caching, routing, thinking on demand,
  observable in the dashboard.
- First Spanish pass of the clinical voice reviewed by a second
  practicing physician.
- Conversations with one or two Querétaro clinics to pick the
  first Bridge pilot site.
- Outcome metrics defined and instrumented ahead of pilot launch.

### By end of June

- 100 real users in the patient beta.
- Cost per active user visible and trending toward target.
- Bridge pilot scoped with a real clinical partner.
- Quarterly board / advisor update drafted.

---

## Part 4 · Decisions that shape everything

These are the decisions the code cannot make for you.

### Geographic focus

**México-first** — your network is here, the need is deeply felt,
the regulatory environment is workable, and the language the
product speaks most naturally is Mexican Spanish. The thesis of
equity lands most strongly where the health system is most
visibly paid-to-fix-the-sick.

**US-first** — larger payer dollars, higher-stakes BAA, faster
commercial scale, but a more crowded field and a higher
regulatory floor for anything that looks like clinical decision
support.

Most likely answer: **México-first with an early US signal** — a
pilot in Querétaro, a waitlist in the US that captures the
diaspora and the longevity / wellness audience that tolerates
depth (the Hans-path users).

### Commercial structure

- **(a) Bootstrapped.** You control the pace and direction.
  Everything takes longer. Team stays small.
- **(b) Angel / pre-seed raise.** $250K–$750K. 12–18 months of
  runway. Small team (one engineer, one clinical ops, part-time
  designer). Board / advisors. More accountability, faster
  timeline.
- **(c) Grant-funded or clinical-partner-funded.** Slowest, most
  aligned with the public-health framing, least dilution. The
  right partners (México Secretaría, a foundation, a hospital
  network) can move this a year faster than a bootstrapped path.

The answer depends on your appetite for pace and dilution, and on
whether the first Bridge pilot clinic is willing to pay.

### Co-founder

Today the team is you plus Claude Code subagents. The current
rhythm works because you can hold the whole product in your head.
That stops being true around the 10th real user. A technical
co-founder who owns the frontend/backend lets you stay on
clinical voice and product. The decision is whether you want to
share equity now or hire later. The answer is usually "earlier
than you think."

### First clinic pilot site

Your own cancer center? A general-practice colleague's clinic?
The Bridge pilot has to run somewhere clinical authors with
real patient panels are willing to audit transcripts and hold
the companion's voice accountable. The wrong pilot site
surfaces noise; the right one surfaces product truth.

### Regulatory posture

Current stance: **wellness product** — never diagnoses, never
prescribes, always refers. The safest posture for shipping,
lowest liability, most flexible distribution. Sticking with this
through Phase 2 is likely the right call.

The question is when (and whether) to pursue the adjacent
clinical-decision-support classification that opens reimbursement
doors that wellness cannot. In the US that is a 510(k) path; in
México it is a COFEPRIS medical-device classification. The
decision is Phase 3+, but the evidence work begins in Phase 2.

### Open-source posture

Apache 2.0 today. Options for the future: stay fully open,
split the patient surface (open) from the Bridge (SaaS / closed),
or move to AGPL for the Bridge to prevent commercial fork-and-run.

The open-source posture is a marketing moat and a trust signal;
it is also a revenue ceiling if the Bridge becomes the commercial
product. The decision is not urgent, but it should not be drifted
into either.

### The team story

Today the "team" is you + Claude Code subagents, and the
narrative is honest: coordinator agent + specialist agents +
the practicing physician. When a human joins, the story
changes. Do you add a co-founder and re-introduce Health
Companion as a two-person team? Do you frame subsequent hires as
"augmenting" the founder? The narrative is part of the product
— especially for the judges, investors, and clinical partners
who will meet you over the next 12 months.

---

## Part 5 · What you have going for you

A list that is worth holding onto when the work gets hard.

- **A practicing-physician voice that other founders have to
  hire for or do without.** This is unique. It shows in every
  prompt, every guardrail, every copy decision.
- **A working prototype with real clinical depth, not a
  wrapper.** Investors and clinical partners feel the
  difference in the first five minutes of demo.
- **A thesis that scales across segments without contortions.**
  The same companion serves the first-timer, the longevity
  enthusiast, the clinician, and the payer. Most health-
  technology products pick one and hope to graduate.
- **The Bridge as a structural moat.** A white-label clinician
  surface that inherits the companion's memory is something
  nobody else has architecturally positioned. When the Phase-2
  work ships, the moat becomes a category.
- **Infrastructure already in place.** MLX, Tailscale, multiple
  machines, OpenClaw. The cost-architecture work has a head
  start other founders don't.
- **A founder's thesis document that is quotable.** Judges,
  investors, and partners respond to prose that says something.
  The thesis-of-the-founder doc does.

---

## Part 6 · What's at risk if the momentum stalls

- The hackathon submission is a timebox. The sprint creates
  urgency that decays fast after Sunday if the next step is not
  concrete.
- Clinical voice rot. Without monthly audit cycles, the prompt
  drifts. The current version was audited once; that becomes
  outdated.
- Cost architecture debt. Every feature added without the
  Phase-1 cost work multiplies the bill at scale.
- Single point of failure. The project currently lives on one
  M4 in your house. Hardware, power, personal time.
- Competitive pressure. Large-language-model health products
  are being founded at a high rate. The thesis is strong enough
  to survive, but momentum matters.

---

*Last updated: April 23, 2026 — the night before the hackathon
submission weekend. Written by Claude (Opus 4.7) in a live
session with Juan Manuel Fraga Sastrías, as the product was
already beginning to feel real.*
