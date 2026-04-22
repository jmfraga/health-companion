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
- **Wearables — continuous biometrics** (first-class, not an afterthought): Garmin (Enduro, Forerunner, Fenix), Apple Watch + HealthKit, Google Fit / Health Connect, Oura, Fitbit. Stream HRV, resting heart rate, nocturnal heart rate, respiratory rate, sleep stages, stress, body battery, SpO₂ into the companion as ambient context. **The case that ships this thread** lives in [`docs/references/caso_estudio_garmin_claude.docx`](./docs/references/caso_estudio_garmin_claude.docx): a six-day real-world collaboration between a Garmin Enduro 2 and Claude that managed an acute viral infection and staged a return-to-exercise plan for a 51-year-old competitive amateur. This exact loop — continuous wearable data + conversational clinical reasoning with explicit uncertainty + staged protocols with objective daily criteria — is what we productize. *Anticipation is the game*: the wearable sees the dip before the user feels it, and the companion surfaces the conversation at the right time.
- **Documents**: lab PDFs, insurance policies, imaging reports, consultation notes.

### 6. Clinical transparency
Every clinical response can be opened to reveal the reasoning behind it. Extended thinking, exposed as a clinical artifact ("See reasoning"). Over time this becomes the trust layer: the user can look over the companion's shoulder any time they want, and doctors can verify the logic that was shown to their patient.

### 7. Privacy as a visible feature
The user should never have to dig through the Terms of Service to understand what happens to their health data. An "About your privacy" surface is a first-class section of the app from early in Phase 1, explaining in plain language: what is stored, what is encrypted, who can access it (only the user), how export and delete work, whether the conversation is ever used for model training (it is not), and how the clinician-audit process works. Privacy is worth the square pixels.

### 8. Explicability — "how this works"
A second first-class surface of the app. Not a dev blog, not a whitepaper. A short, plain-language section that answers the questions a thoughtful user asks when they are trusting a health tool: which model is doing the reasoning, what clinical sources it cites (USPSTF / ACS / NICE / Secretaría de Salud / NCCN / ACC-AHA), how "See reasoning" lets them audit any specific turn, what the product will never do (diagnose, prescribe, replace the doctor), and how updates to the clinical content are reviewed by a physician. Explicability is a competitive moat: nobody else in the space is doing it well.

### 9. Emergency & red-flag safety
Beyond the orchestrator's hard rule of calm escalation on urgent values and red flags (chest pain with exertion, stroke signs, severe SOB, suicidal ideation, fainting, severe abdominal pain, glucose > 400, potassium > 6.5, SpO₂ < 90%, hemoglobin < 7, INR > 5), the product surfaces a persistent, low-friction emergency affordance:
- A dedicated, always-visible "Emergency?" control that opens a region-specific list of numbers (911 US, 066 / 911 México, 112 EU, local equivalents).
- Mental-health crisis explicit routing: 988 US Suicide and Crisis Lifeline, SAPTEL 55-5259-8121 México, and local equivalents.
- These are not buried in menus. Any health-forward product has to assume someone will open it in a bad moment.

### 10. Real-world evidence & outcomes (for responsibility, not only for marketing)
If Health Companion is going to sit between a user and their doctor, we owe it to both sides to measure whether the product actually improves care outcomes — and to act on the answer whether it is flattering or not.
- An analytics layer captures (consented, aggregated) signals of engagement, clinical activities completed (screenings booked, labs uploaded, follow-ups kept), and outcomes the user is willing to share back.
- Peer-reviewed publication pipeline: anonymized, consented cohort analyses feed academic publication on what works, what does not, and where the product is still short. This is the "act with responsibility" commitment embedded in the product.
- If the data says we are not helping, we say so publicly and course-correct.

### 11. Equity & reach
The product works in both high- and low-resource contexts. In low-resource contexts — LatAm, the Global South — the relative value is higher because it fills a real gap. This is a first-class design concern:
- Multilingual from early on (Spanish + English initially; progressively more).
- Low-bandwidth and offline-capable modes.
- Pricing tiers that remain accessible.
- Content grounded in local health systems (Secretaría de Salud México, MINSA, etc.) alongside USPSTF/ACS/NICE.

### 12. Regulatory posture
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
- In-memory state + fixtures. Supabase Auth with Google OAuth (the demo's trust signal). Single seed profile.
- **About-your-privacy** static surface explaining what we store, what we never use for training, how export / delete work. Visible from the header.
- **How-this-works** static surface explaining the model, the clinical sources cited, the "See reasoning" audit path, and what the product will never do.
- **Emergency affordance**: a persistent, low-friction control that opens region-specific emergency numbers + mental-health crisis lines. Never buried.

Operational plan: [`docs/hackathon-plan.md`](./docs/hackathon-plan.md).

### Phase 1 · Private beta (May – August 2026)

Harden the core, onboard the first 50–200 users, learn.

- **Persistence**: Supabase Postgres (already wired), Row-Level Security, pgvector for semantic-memory retrieval.
- **Auth**: Supabase Auth (Google, Apple) with biometric unlock for the mobile app.
- **Smart model routing — Haiku-classifies-Opus-thinks**: a fast Haiku 4.5 classifier runs on every user turn and chooses the Opus 4.7 `effort` level for that turn (`low` / `medium` / `high` / `max`). Greetings, confirmations, and routine profile updates are served cheaply; clinically loaded turns (labs, symptoms, family history, risk discussion) get `max` effort with visible extended thinking. Target impact: ~10× reduction in steady-state cost per user per month with zero quality regression on clinical turns. A stretch-goal version of this shipped in the hackathon MVP is acceptable; the production version adds per-category budgets and audit logs.
- **Proactivity v1 — on Claude Managed Agents**: each proactive check-in runs as an autonomous Managed Agents session. A scheduled trigger kicks off a session per active user per evaluation window; the session pulls state (profile + biomarkers + memory + scheduled screenings), reasons over trigger conditions (age milestones, lab trends, cadence, life events), and composes a personalized outreach. The hot conversational path stays on the Messages API for latency; the background loop moves to Managed Agents because the shape fits: long-running, autonomous, stateful, streamed-to-completion. This matches the Managed Agents hackathon-prize brief ("meaningful long-running tasks you'd actually ship"). A demonstration of this split ships in the hackathon MVP via a Managed-Agents-backed `/api/simulate-months-later` endpoint.
- **Pillar coverage**: deepen pillar 1 (prevention) and pillar 5 (disease management); open pillar 2 (body) lightly.
- **Wearable pilot — Garmin + Apple Health + Google Fit / Health Connect**: first real ingestion of continuous biometrics. Start with HRV, resting / nocturnal HR, respiratory rate, sleep score / stages, stress / body battery, SpO₂. The [Garmin case study in docs/references](./docs/references/caso_estudio_garmin_claude.docx) is the canonical example of the loop we productize — wearable data + conversation + probabilistic clinical reasoning with explicit uncertainty. *Anticipation unlock*: the wearable sees the dip before the user feels it, and the companion opens the right conversation at the right moment.
- **Clinical content**: expand the sanitary-interpreter table, add more guideline sources (NICE, NCCN, Secretaría de Salud).
- **Accessibility pass**: WCAG AA, screen-reader flows, font-size controls, dyslexia-friendly mode.
- **Observability**: per-turn agent_runs logging, cost per user per month tracking, clinical-quality spot-checks.
- **Closed beta onboarding**: invite-only, feedback loop wired into weekly product reviews.
- **Privacy + explicability surfaces deepen**: become living documents — update cadence, audit log of clinical-content changes, explicit consent for any new data category.
- **Admin-lite**: single-operator dashboard over Supabase — user health, event log, clinical-quality spot-check queue, cost per user. Internal only, not public.

### Phase 2 · Public launch (Q4 2026)

Product is real, in users' pockets, earning trust.

- **PWA → native wrappers**: iOS + Android via Capacitor, with push notifications and Health Kit / Google Fit / Garmin Connect IQ integration full access.
- **Voice I/O**: STT on-device (WebSpeech / native), TTS via managed voice.
- **Image ingestion**: meds, skin photos, wound-care progress.
- **Proactivity v2 — wearable-driven anticipation**: lab-trend triggers, life-event detection, celebration triggers, *plus* wearable-derived triggers — HRV trending low, nocturnal HR elevated, sleep score tanking for three nights, stress score persistently high. The Garmin case study becomes a playbook: acute-infection monitoring + staged return-to-exercise as a fully templated protocol.
- **Pillar coverage**: open pillar 3 (mind) — guided breathing, PHQ-9/GAD-7 self-screening as educational tools.
- **Freemium**: basic free tier, premium (~$4–5/month) for full proactive engine, timeline, insurance ingestion, wearable sync.
- **Insurance integration**: parse user's policy PDF, answer "does my policy cover X?" in plain English, renewal alerts.
- **Multilingual**: Spanish (Mexican register) + English, both first-class; UI strings + prompt layers fully localized.
- **Admin dashboard v1 — ops + product analytics**: a proper internal dashboard for the operator. Two axes: (1) **usage analytics** — DAU / MAU, retention curves, funnel by pillar, cost per user per month, tool-use mix, extended-thinking effort distribution. (2) **clinical / outcome signals** — screenings scheduled vs completed, follow-up visits kept, proactive messages sent vs acted-on, self-reported subjective improvements, satisfaction signals, adverse events. These signals are the raw material for the research-responsibility story: we measure whether we help, and we say so.

### Phase 3 · Scale in LatAm (2027)

The equity dimension becomes the growth engine.

- **LatAm first-class**: country-specific guideline content, local pricing, WhatsApp channel for users without reliable app-store access.
- **Low-bandwidth mode**: text-only, periodic sync, offline memory cache.
- **Wearables breadth**: Oura, Fitbit, Garmin, Apple Watch, Whoop — every meaningful source of continuous biometrics gets a first-class connector.
- **Pillar coverage**: open pillar 4 (risk-habit reduction) with evidence-based cessation programs.
- **Proactivity v3**: contextual + seasonal triggers (flu season, UV exposure), family-scoped modes ("coordinate my mom's check-ups").
- **B2B channel**: insurer partnerships where the insurer subsidizes premium for their insured (healthy patient = lower claims).
- **Real-world-evidence pipeline**: anonymized, consented cohort analyses → peer-reviewed publication on outcomes. We commit in writing to publish even unfavorable results. This is the responsibility clause. The admin dashboard's outcome signals feed this pipeline; partnerships with academic groups validate the methodology.

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
