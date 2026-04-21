# Health Companion — Concept v1

> Your personal health companion. It adapts to you, grows with you, and accompanies you when you visit the doctor.

**Status**: Ideation · April 2026
**Author**: Dr. Juan Manuel Fraga Sastrías — General physician, Director of a Cancer Center

---

## The problem

People know they should take care of their health, but they don't have a system that guides them in a personalized, proactive, continuous way. The existing health apps are cold data trackers that get abandoned in 3 months, or reactive symptom checkers that only help once you're already sick.

## The opportunity

Large language models already dominate medical knowledge. Blind evaluations with 480+ clinical cases showed that Claude Sonnet scored 4.48/5 in oncology without any additional scaffolding (RAG, fine-tuning). The models already know medicine — what's missing is the user experience.

## The vision

An app that works like **your digital family doctor**:
- It knows you (history, habits, family, trajectory).
- It guides you (a personalized health program).
- It accompanies you (when you visit the doctor or when you get sick).
- It grows with you (it becomes more valuable over time).

---

## Health pillars

### 1. Prevention and early detection
- **General screenings**: blood pressure, weight / BMI, fasting glucose, lipid panel.
- **Cancer screenings**: breast (mammography), cervical (Pap / HPV), colon (colonoscopy), prostate (PSA), skin (self-examination).
- **Vaccination**: complete schedules by age and country (influenza, pneumococcus, HPV, tetanus, COVID, etc.).
- **Personalized risk factors**: based on family history, age, sex, occupation.

### 2. Body
- **Exercise**: program adapted to physical condition, age, and goals (WHO recommends 150 min / week moderate).
- **Nutrition**: personalized guidance based on metabolic profile, preferences, restrictions.
- **Hydration**: tracking and reminders.
- **Sleep**: sleep hygiene, tracking of hours and quality.
- **Dental health**: biannual appointment reminders, oral hygiene education.
- **Visual health**: check-up reminders, visual ergonomics.

### 3. Mind
- **Mindfulness and meditation**: guided exercises adapted to the user's level.
- **Stress management**: breathing techniques, journaling, trigger identification.
- **Early detection**: validated questionnaires (PHQ-9 for depression, GAD-7 for anxiety) as educational screening, always referring to a professional.
- **Social connection**: isolation is a cardiovascular risk factor — the app recognizes it.

### 4. Risk habits and reduction
- **Tobacco**: evidence-based cessation strategies, tracking days without smoking.
- **Alcohol**: education on responsible consumption, tracking.
- **Sedentarism**: gradual activation, micro-exercises, movement reminders.
- **Chronic stress**: reduction mechanisms, pattern detection.
- **Sun exposure**: education, protection reminders based on local UV.

### 5. Disease management
- **Pre-consultation accompaniment**: "Tell me what you feel" → organizes symptoms, generates a sheet for the doctor.
- **Post-consultation accompaniment**: "What did the doctor tell you?" → integrates into the profile, provides follow-up.
- **Treatment adherence**: medication reminders, education on side effects.
- **Patient education**: how to take care of yourself, how to apply insulin, how to take medication, wound care, rehabilitation.
- **Symptom tracking**: longitudinal log to share with the doctor.

---

## The model: your digital family doctor

A doctor who has treated you for 10 years knows your history, knows your habits, remembers that your father had diabetes, knows that last year you struggled to lose weight. You'd never trade them for a new one who starts from zero.

The app replicates this relationship using LLM + persistent memory. Every interaction makes it more valuable.

---

## Engagement — why it doesn't get abandoned

### Memory as accumulated value
Every interaction enriches the profile. At six months, the app knows more about your health than any other tool. Cancelling means losing the "doctor" who knows you.

### Visible evolution
Visual timeline of your health story: when you started exercising, when you quit smoking, how your numbers have improved. "You've been on your plan for 8 months — look how much you've improved."

### Human adaptation
- 3 days without a check-in: *"Hey, everything okay? Haven't heard from you."* (not 10 notifications).
- Detects patterns: *"The weekend's coming — want options to eat out without breaking your plan?"*
- Learns your preferred tone: direct, motivational, detailed.

### Moments that matter
No daily spam. It reaches out when something is relevant:
- *"You turn 45 next month — it's time for your first colonoscopy."*
- *"You've been sleeping less than 6 hours for 2 weeks — want to talk about it?"*

### Milestones and celebrations
*"Today you complete 1 year with your health plan. Summary: 3 check-ins a day, flu vaccine, lost 4 kilos, you sleep 1 more hour than a year ago."*

### Life moments
The app adapts to major changes:
- Pregnancy → adjusts the whole plan.
- New diagnosis → integrates and reorders priorities.
- Job change → anticipates stress.
- Aging parents → *"Want me to help you coordinate their check-ups?"*

### Retention curve
| Time | User perception | Likelihood to cancel |
|------|-----------------|----------------------|
| Month 1 | "It's an interesting app." | High |
| Month 6 | "It knows my history and my progress." | Low |
| Year 2 | "It's my health companion; it knows me better than I know myself." | Very low |

---

## Integration of hard data

### Data the user can enter
- Vital signs: blood pressure, weight, capillary glucose.
- Labs: fasting glucose, HbA1c, lipid panel, CBC, chem panel.
- Others: imaging study results (text), notes from the doctor.

### Safe interaction formula

**Data → Education → Personal context → Referral to doctor**

> *"Your fasting glucose was 126 mg/dL. The WHO considers normal below 100 and prediabetes 100–125. Since your father has diabetes and you've had two readings above 125, it would be good to discuss this with your doctor at your next visit."*

Never diagnoses. Never prescribes. Educates, contextualizes, refers.

---

## Regulatory framework

### Category: Wellness / Education / Coaching
The app is NOT a medical device. It does not diagnose, does not prescribe, always refers to the health professional.

| Jurisdiction | Framework | Status |
|--------------|-----------|--------|
| **FDA (US)** | General Wellness guidance | Exempt — education + referral |
| **COFEPRIS (Mexico)** | Wellness software | No registration required |
| **MDR (Europe)** | Medical Device Regulation | Exempt as a wellness app |

### Required disclaimers
- Terms of service: *"This app does not replace a professional medical consultation."*
- On data-related responses: *"Consult your health professional."*
- Onboarding: explicit acceptance that it is an educational tool.

### Regulatory competitive advantage
Content developed and supervised by a physician (Dr. Juan Manuel Fraga). Clinical credibility without requiring classification as a medical device.

---

## Differentiators

| Dimension | Trackers (Fitbit, Apple Health) | Symptom checkers (Ada, Babylon) | **Health Companion** |
|-----------|-------------------------------|-----------------------------------|----------------------|
| Focus | Data | Reactive (disease) | Proactive (prevention) |
| Personalization | Minimal | Per session | Accumulative, lifelong |
| Relationship | None | Transactional | A companion who knows you |
| Engagement | Abandoned in 3 months | Single use | More valuable with time |
| Medical accompaniment | No | No | Pre- and post-consultation |
| Continuous education | No | Limited | Personalized to the profile |

---

## Platform (tentative)

### MVP
- **Frontend**: Progressive Web App (PWA) — installable from the browser, works on any phone, no App Store at first.
- **Backend**: FastAPI + PostgreSQL.
- **LLM**: Haiku / Flash for daily interactions (~$0.001 / interaction), Sonnet for complex cases.
- **Languages**: Spanish and English from day one.
- **Push notifications**: for engagement (check-ins, reminders, milestones).

### Post-MVP
- Native apps (iOS / Android) once there is traction.
- Integration with wearables (Apple Health, Google Fit).
- API for physicians (share the patient's profile with their doctor).

---

## Monetization

### B2C — Freemium
| Plan | Price | Includes |
|------|-------|----------|
| Basic (free) | $0 | Check-ins, general reminders, basic education |
| Premium | ~$4–5 USD / month | Full personalized program, consultation companion, health timeline, reports for your doctor, hard data |

### B2B — Insurers
A healthy patient = lower costs for the insurer. Subsidy model or enterprise license where the insurer pays the premium for its insured.

### B2B — Employers
Corporate wellness. The company offers the app as a benefit to its employees.

---

## Team

**Dr. Juan Manuel Fraga Sastrías**
- General physician, Director of a Cancer Center.
- ML / AI skills rare in the medical field.
- Demonstrated with 480+ blind evaluations the capability of LLMs in medicine.
- Own technical infrastructure (servers, local models, evaluation pipelines).

---

## Next step

Keep iterating the concept before writing code:
- [ ] Product name.
- [ ] Design of the conversational onboarding (exact flow).
- [ ] Define minimum MVP (which pillars first?).
- [ ] Wireframes / user flow.
- [ ] Health profile data model.
- [ ] Launch strategy (closed beta with real patients?).
- [ ] Detailed competitive analysis.
- [ ] Estimate of operating costs per user.
