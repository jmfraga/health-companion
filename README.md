# Health Companion

> Your personal health companion — preventive, personalized, proactive.

A wellness app that helps anyone stay healthier, adapted to their history, habits, and age. Built on the idea that the best health tool is the one that knows you over time — like a family doctor who's seen you for ten years.

## Status

Work-in-progress submission for the **Built with Opus 4.7** hackathon (April 21–26, 2026). Nothing here is production-ready. No medical advice. Not a medical device.

## The hackathon demo (two acts, 3 minutes)

Laura, 44, whose mother died of breast cancer at 52, is meeting Health Companion for the first time.

1. **Meeting Laura (~45s).** Laura says "I'm 44, my mom died of breast cancer at 52." The profile panel fills in live via visible tool use. Opus 4.7 proposes a screening calendar in plain language — with an optional "See reasoning" disclosure that surfaces the clinical reasoning on demand.

2. **Labs and proactivity (~55s).** Laura drops in a lab PDF. Opus 4.7 reads it multimodally, detects glucose 118 mg/dL, contextualizes it with her profile, and explains without alarm. A ~3-second fade — *three months later* — and the app writes proactively: *"You turn 45 next month. Remember what we talked about? Let's schedule that mammogram."* The timeline shows the memory made visible.

The full product vision covers five health pillars (prevention, body, mind, risk-reduction habits, disease management) with a freemium model. The demo is the first beats of a more ambitious project.

## Three users, one product

![Health Companion — three users, one product: a person starting to care for themselves, a conscious self-monitor, and a clinician on the far side of a bridge connecting to their patients](./docs/assets/three-users-nanobanana.png)

> *The health system gets paid when you get sick. We get paid to keep you well.*

One surface, two adoption paths for patients, one view for their clinician. The clinician-side surface — **The Bridge** — is white-label: every clinic brands their own, same companion underneath.

| | 01 · People who want to start caring | 02 · People who already care, and want to keep going | 03 · Doctors whose daily work becomes keeping people well |
|---|---|---|---|
| **Who** | Busy 40-somethings who aren't sick, don't have a family doctor, and just had a scare — theirs or someone close. | Hans-path users 45–60 — wearables, HRV, ApoB, longevity. They tolerate depth. They want the edges sharper. | A primary-care physician or internist whose 15 minutes is never enough — and whose patients live 8 weeks between visits. |
| **Before** | A lab result they don't understand. A specialist appointment they leave half-remembering. A quiet worry after a family diagnosis. | Four apps that don't talk. A coach, a panel subscription, a supplement stack. Signal scattered across dashboards. | Reconstructing two months of context in five minutes. Phone calls after hours for what can't wait. The wrong people walking in unprepared. |
| **With Health Companion** | The companion greets them: *"Tu mamografía anual viene en 3 semanas — ¿la agendamos?"* They photograph a lab PDF; every jargon term is translated. They walk in prepared, with the right questions written down. Twelve months in, they've quietly become the engaged kind of patient — because the product did the work. | Continuous biometric ingestion — HRV, RHR, sleep, training load — as one stream. Pattern recognition: *"HRV down 3 nights, stress up — is something going on?"* They tap **See reasoning** and read the full chain of thought. A calibrated, cautious voice: *this is a signal, not a verdict.* | A Bridge dashboard: every enrolled patient, current goals, biomarker trends, adherence signals. Soft flags when something trends out of range — surfaced before the next visit, not after. Their clinical note is auto-translated into plain language for the patient. The day shifts from reactive sick-visit management to proactive motivation. They get to be a doctor again. |
| **Quote** | *"I finally understand what my doctor is telling me."* | *"It connects the dots I was already staring at."* | *"I walk in already knowing who needs me this week."* |

The full infographic (vertical 1080×1920 and horizontal 1200×800 renders) lives at [`docs/assets/three-users.html`](./docs/assets/three-users.html).

## Design principles

- **Wellness, not diagnosis.** Educates, contextualizes, refers. Never prescribes.
- **Memory is the product.** Each session teaches the companion more about you.
- **Your data is yours.** End-to-end encryption at rest and in transit. Export or delete everything, anytime. Never sold, never shared.
- **Trust is visible.** Privacy isn't hidden in the Terms of Service — it's on the screen.

## Tech stack (hackathon MVP)

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + lucide-react. PWA.
- **Backend**: FastAPI (Python 3.12) + Pydantic v2 + SQLAlchemy, managed with `uv`.
- **Data**: SQLite, shipped with the repo for a reproducible demo.
- **AI**: a single Claude Opus 4.7 orchestrator with tool use, extended thinking exposed through the "See reasoning" disclosure, and multimodal PDF ingestion.
- **Deploy**: Vercel (web), Fly.io (api).

Supabase + Postgres + Auth are scaffolded in `.env.example` and `config.py` for the post-submission migration path, but the hackathon demo runs on SQLite with no authentication and a single seed profile.

Full architecture notes in [`docs/architecture.md`](./docs/architecture.md). Product vision in [`ROADMAP.md`](./ROADMAP.md); hackathon-week plan in [`docs/hackathon-plan.md`](./docs/hackathon-plan.md). The founder's thesis, product concept, competitive analysis, and the original hackathon brief live in [`docs/`](./docs) alongside the running [`docs/development-journal.md`](./docs/development-journal.md).

## How this was built

Health Companion is being built by a small coordinated team of Claude Code subagents working alongside the founder:

- `hc-coordinator` — product lead and thesis guardian, the founder's direct collaborator.
- `hc-frontend` — Next.js + Tailwind + shadcn/ui specialist.
- `hc-backend` — FastAPI + Opus 4.7 + tool-use specialist.
- `hc-clinical` — author and custodian of the clinical voice, guardrails, and screening schedules.

**Dr. Juan Manuel Fraga Sastrías** — a practicing primary-care physician and director of a cancer center in Querétaro, México — is the fifth agent on the team. His role is to translate the experience he cultivates with his own patients into something replicable in software. *We're building the companion by the same pattern we want the companion to have: a coordinator working with specialists.*

## Disclaimer

Health Companion is **not a medical device** and does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for any medical concerns. If you think you are having a medical emergency, call emergency services immediately.

## License

Apache License 2.0 — see [`LICENSE`](./LICENSE).
