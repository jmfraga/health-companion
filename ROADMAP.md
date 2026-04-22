# Health Companion — Product Roadmap

> *"The health system today gets paid when you get sick. We're building the first companion whose only job is to keep you well — in the language you actually speak."*

This roadmap describes the capabilities Health Companion will cover over time. The hackathon MVP is v0.1 — the first breath of a multi-year product. The operational week-of-hackathon plan lives separately in [`docs/hackathon-plan.md`](./docs/hackathon-plan.md).

For the "why", see [`docs/tesis-del-fundador-v1.md`](./docs/tesis-del-fundador-v1.md).
For the "against whom", see [`docs/competitive-analysis-v1.md`](./docs/competitive-analysis-v1.md).

---

## Form factor

- **Primary**: mobile Progressive Web App. The companion lives in the user's pocket.
- **Secondary**: desktop browser (for clinician demos, for dev). Responsive, not two codebases.
- **Post-launch**: native iOS + Android wrappers once there is traction.
- **Accessibility & low-bandwidth modes**: first-class, not afterthoughts — the product works in a small town as well as in a city apartment.

---

## Capability pillars

Health Companion covers six pillars of wellbeing. Coverage deepens phase by phase; the hackathon MVP opens pillars 1 and 5 partially.

| # | Pillar | What it covers |
|---|--------|----------------|
| 1 | **Prevention & early detection** | Preventive screenings, vaccination schedules, family-history-driven risk assessment |
| 2 | **Body** | Exercise, nutrition, hydration, sleep, dental, visual health |
| 3 | **Mind** | Mindfulness, stress management, early mental-health screening, social connection |
| 4 | **Risk-habit reduction** | Tobacco, alcohol, sedentarism, chronic stress, sun exposure |
| 5 | **Disease management** | Pre- and post-consultation accompaniment, adherence, patient education, symptom tracking |
| 6 | **Health finance (light)** | Insurance coverage parsing, renewal alerts, budget guidance — never becomes a finance app |

---

## Core capability threads (horizontal)

These threads run through every pillar. Each deepens as the product matures.

### 1. The sanitary interpreter
Translate medicine into the user's everyday language. Per-term translation, plain-language contextualization, honest uncertainty. Category-defining value. Deepens with broader medical vocabulary, multilingual coverage, and culturally adapted phrasing.

### 2. Proactive outreach engine
The product reaches out — it is not a chatbot waiting to be asked. Multiple trigger families:

- **Age-gated milestones**: the user turns 40, 45, 50, 65 — the companion surfaces the preventive actions that pair with that age.
- **Lab-trend triggers**: a biomarker crosses a threshold, trends worsening, or trends improving enough to celebrate.
- **Cadence triggers**: annual screenings coming due, vaccine boosters, medication refills, follow-up visits.
- **Life-event triggers**: pregnancy, new diagnosis, caring for an aging parent, job change (stress), bereavement.
- **Contextual triggers**: weekend eating patterns, seasonal (flu season, UV in summer), local outbreaks.
- **Celebration triggers**: first month without tobacco, one-year plan anniversary, weight-loss milestone.

Proactivity obeys a budget — never more messages than value, never moralizing, never bombardment. The user trusts the cadence because it is earned.

### 3. Longitudinal memory
The product gets more valuable the longer you use it. Two layers:
- **Episodic memory**: timestamped utterances ("user said on date X that…").
- **Semantic memory**: durable, distilled facts ("user has first-degree family history of breast cancer").

Memory is curated by the model, not dumped. Over time it supports: lab trend graphs, timeline-of-care, "what we talked about last time", and differential context in every reply.

### 4. Clinical accompaniment
Surface area with the clinical system:
- **Pre-consultation**: organize symptoms, prepare questions, print-ready summary for the doctor.
- **Post-consultation**: understand what the doctor said, capture medication regimen, set follow-ups and reminders, flag what was unclear.
- **Inter-consultation**: symptom diaries, medication adherence, side-effect education.
- **Cross-provider**: act as the connective tissue between specialists so the patient stops being the messenger.

### 5. Modalities
- **v0.x**: text-first chat.
- **Voice**: conversational voice input and TTS output, especially for older users and during consultations.
- **Image**: photos of labs, medication labels, skin lesions (for "worth showing your doctor" framing, never for diagnosis).
- **Wearables**: Apple Health, Google Fit, Oura, Fitbit — ambient data making the picture more complete.
- **Documents**: lab PDFs, insurance policies, imaging reports, consultation notes.

### 6. Clinical transparency
Every clinical response can be opened to reveal the reasoning behind it. Extended thinking, exposed as a clinical artifact ("See reasoning"). Over time this becomes the trust layer: the user can look over the companion's shoulder any time they want, and doctors can verify the logic that was shown to their patient.

### 7. Equity & reach
The product works in both high- and low-resource contexts. In low-resource contexts — LatAm, the Global South — the relative value is higher because it fills a real gap. This is a first-class design concern:
- Multilingual from early on (Spanish + English initially; progressively more).
- Low-bandwidth and offline-capable modes.
- Pricing tiers that remain accessible.
- Content grounded in local health systems (Secretaría de Salud México, MINSA, etc.) alongside USPSTF/ACS/NICE.

### 8. Regulatory posture
Wellness + education + referral. Never a medical device. Documented compliance with FDA General Wellness, COFEPRIS wellness classification, MDR wellness exemption. Clinician-led content review is part of every release.

---

## Phases

### Phase 0 · Hackathon MVP (April 21–26, 2026) — in progress

The first breath. Demonstrates the product's soul inside a 3-minute presentation.

- One Opus 4.7 orchestrator with tool use, streaming SSE.
- Conversational onboarding with live profile extraction visible via tool-use events.
- Preventive screening recommendations with cited sources.
- Extended thinking exposed as "See reasoning" disclosure.
- Multimodal ingestion of a lab report directly by Opus 4.7 (no OCR layer).
- Longitudinal memory simulation ("months later") demonstrating the moat.
- Proactive message triggered by context (age + family history + prior lab).
- PWA, mobile-responsive.
- In-memory state + fixtures. No auth. Single seed profile.

Operational plan: [`docs/hackathon-plan.md`](./docs/hackathon-plan.md).

### Phase 1 · Private beta (May – August 2026)

Harden the core, onboard the first 50–200 users, learn.

- **Persistence**: Supabase Postgres (already wired), Row-Level Security, pgvector for semantic-memory retrieval.
- **Auth**: Supabase Auth (Google, Apple) with biometric unlock for the mobile app.
- **Proactivity v1**: scheduled nudge engine (cron + push) for age-gated and cadence triggers; opt-in per category.
- **Pillar coverage**: deepen pillar 1 (prevention) and pillar 5 (disease management); open pillar 2 (body) lightly.
- **Clinical content**: expand the sanitary-interpreter table, add more guideline sources (NICE, NCCN, Secretaría de Salud).
- **Accessibility pass**: WCAG AA, screen-reader flows, font-size controls, dyslexia-friendly mode.
- **Observability**: per-turn agent_runs logging, cost per user per month tracking, clinical-quality spot-checks.
- **Closed beta onboarding**: invite-only, feedback loop wired into weekly product reviews.

### Phase 2 · Public launch (Q4 2026)

Product is real, in users' pockets, earning trust.

- **PWA → native wrappers**: iOS + Android via Capacitor, with push notifications and Health Kit / Google Fit integration.
- **Voice I/O**: STT on-device (WebSpeech / native), TTS via managed voice.
- **Image ingestion**: meds, skin photos, wound-care progress.
- **Proactivity v2**: lab-trend triggers, life-event detection, celebration triggers.
- **Pillar coverage**: open pillar 3 (mind) — guided breathing, PHQ-9/GAD-7 self-screening as educational tools.
- **Freemium**: basic free tier, premium (~$4–5/month) for full proactive engine, timeline, insurance ingestion.
- **Insurance integration**: parse user's policy PDF, answer "does my policy cover X?" in plain English, renewal alerts.
- **Multilingual**: Spanish (Mexican register) + English, both first-class; UI strings + prompt layers fully localized.

### Phase 3 · Scale in LatAm (2027)

The equity dimension becomes the growth engine.

- **LatAm first-class**: country-specific guideline content, local pricing, WhatsApp channel for users without reliable app-store access.
- **Low-bandwidth mode**: text-only, periodic sync, offline memory cache.
- **Wearables**: Oura, Fitbit, Garmin, Apple Watch — ambient data feeding the companion.
- **Pillar coverage**: open pillar 4 (risk-habit reduction) with evidence-based cessation programs.
- **Proactivity v3**: contextual + seasonal triggers (flu season, UV exposure), family-scoped modes ("coordinate my mom's check-ups").
- **B2B channel**: insurer partnerships where the insurer subsidizes premium for their insured (healthy patient = lower claims).

### Phase 4 · Ecosystem (2028+)

Health Companion is the patient-side half of a two-sided product.

- **MedAssistant (sister product)**: for doctors. Complements Health Companion by receiving the patient-side structured summary at visit time and feeding back what was said. Closes the loop that currently makes the patient the involuntary messenger.
- **Employer channel**: corporate wellness benefit, aggregated-but-private insights to HR.
- **Research partnerships**: anonymized, consented cohort data for public-health research in underserved regions.
- **Pillar coverage**: open pillar 6 (health finance) fully — policy comparison, HSA/FSA guidance, medical debt education.
- **Cross-provider integration**: FHIR-based exchange with EMRs where jurisdictional rules allow.

---

## Team

The product is being built by Juan Manuel Fraga (primary-care physician and ML/AI engineer) as the fifth agent in a coordinated team of Claude Code subagents:

- `hc-coordinator` — product lead, thesis guardian, delegates to specialists.
- `hc-frontend` — mobile PWA + desktop responsive.
- `hc-backend` — FastAPI orchestrator + tool runtime.
- `hc-clinical` — clinical voice, guardrails, screening knowledge (audited by Juan Manuel).

This pattern is itself part of the product's story: we are building health-as-a-team by building the product as a team.

---

## Non-goals (what Health Companion will never become)

- A symptom checker.
- A diagnostic tool.
- A prescription engine.
- A replacement for the user's doctor.
- A data-broker selling user data.
- A surveillance app. Memory is opt-in, exportable, deletable.

The product exists to help people stay well and to be heard when they are not.
