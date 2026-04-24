# Health Companion

> Your personal health companion — preventive, personalized, proactive.

A wellness companion that helps anyone stay healthier over time, adapted to
their history, habits, and age. Built on the idea that the best health tool
is the one that knows you — like a family doctor who's seen you for ten
years, available to everyone.

## Status

Work-in-progress submission for the **Built with Opus 4.7** hackathon
(April 21–26, 2026). Not production-ready. Not a medical device. Does not
provide medical advice, diagnosis, or treatment. The recorded walk-
through uses a synthetic patient throughout; judges are welcome to
interact with their own information knowing this is a demo environment,
not a clinical-grade tool — the Phase-1 work to reach that bar (BAA,
per-user encryption, consent flows, audit controls) is scoped in
[`docs/product-horizon.md`](./docs/product-horizon.md).

## Three users, one product

![Health Companion — three users, one product: a person starting to care for themselves, a conscious self-monitor, and a clinician on the far side of a bridge connecting to their patients](./docs/assets/three-users-nanobanana.png)

> *The health system gets paid when you get sick. We get paid to keep you well.*

One surface, two adoption paths for patients, one view for their clinician.
The clinician-side surface — **The Bridge** — is white-label: every clinic
brands their own, same companion underneath.

| | 01 · People who want to start caring | 02 · People who already care, and want to keep going | 03 · Doctors whose daily work becomes keeping people well |
|---|---|---|---|
| **Who** | Busy 40-somethings who aren't sick, don't have a family doctor, and just had a scare — theirs or someone close. | Hans-path users 45–60 — wearables, HRV, ApoB, longevity. They tolerate depth. They want the edges sharper. | A primary-care physician or internist whose 15 minutes is never enough — and whose patients live 8 weeks between visits. |
| **Before** | A lab result they don't understand. A specialist appointment they leave half-remembering. A quiet worry after a family diagnosis. | Four apps that don't talk. A coach, a panel subscription, a supplement stack. Signal scattered across dashboards. | Reconstructing two months of context in five minutes. Phone calls after hours for what can't wait. The wrong people walking in unprepared. |
| **With Health Companion** | The companion greets them: *"Tu mamografía anual viene en 3 semanas — ¿la agendamos?"* They photograph a lab PDF; every jargon term is translated. They walk in prepared, with the right questions written down. Twelve months in, they've quietly become the engaged kind of patient — because the product did the work. | Continuous biometric ingestion — HRV, RHR, sleep, training load — as one stream. Pattern recognition: *"HRV down 3 nights, stress up — is something going on?"* They tap **See reasoning** and read the full chain of thought. A calibrated, cautious voice: *this is a signal, not a verdict.* | A Bridge dashboard: every enrolled patient, current goals, biomarker trends, adherence signals. Soft flags when something trends out of range — surfaced before the next visit, not after. Their clinical note is auto-translated into plain language for the patient. The day shifts from reactive sick-visit management to proactive motivation. They get to be a doctor again. |
| **Quote** | *"I finally understand what my doctor is telling me."* | *"It connects the dots I was already staring at."* | *"I walk in already knowing who needs me this week."* |

The full infographic (vertical 1080×1920 and horizontal 1200×800 renders)
lives at [`docs/assets/three-users.html`](./docs/assets/three-users.html).

## Try it

Open the app, say hello, and tell it something about you — your age, a
health goal, a lab result you don't fully understand. The profile panel
fills in as you talk; the timeline builds as facts accumulate; every
screening recommendation cites the guideline it comes from and can be
audited via the opt-in **See reasoning** disclosure. Three example prompts
are one click away on the empty state for a faster first-touch.

If you want to see what three months of data looks like on a real arc,
`/trends` ships a one-click fixture (the "demo arc") so the longitudinal
surface isn't empty on a cold open.

## Recorded walk-through (hackathon demo video)

For the three-minute submission video we follow a single scripted user —
Laura, 44, whose mother died of breast cancer at 52 — through two acts:
meeting the companion, uploading a lab report, and receiving a proactive
check-in three months later that references what she shared on day one.
The script is at [`docs/process/demo-script.md`](./docs/process/demo-script.md).
That narrative is illustrative, not prescriptive — the product behaves the
same for any user who opens it with any life.

## Design principles

- **Wellness, not diagnosis.** Educates, contextualizes, refers. Never
  prescribes.
- **Memory is the product.** Each session teaches the companion more about
  you. The longer you use it, the more load-bearing it becomes.
- **Your data is yours.** Export or delete everything, anytime. Never sold,
  never shared.
- **Trust is visible.** Privacy isn't hidden in the Terms of Service — it's
  on the screen. So is the reasoning behind every recommendation, for the
  users who want to see it.
- **Calibrated caution over automatic validation.** One in-range lab value
  is not a disease resolved; one good sleep score is not a recovery. The
  companion prefers honest restraint over celebration copy.
- **Accessibility is an architectural constraint.** Inference cost has to
  fit the populations the thesis commits to serving — it's not a margin
  problem, it's a design problem. The Phase-1 cost architecture is
  specified in
  [`ROADMAP.md`](./ROADMAP.md) §18; three levers (prompt caching, model
  routing by turn type, extended thinking on demand) target a $15/user-
  month figure down to under $3 without changing the clinical voice.

## What runs today

- **Frontend** — Next.js 15 (App Router) + TypeScript + Tailwind v4 +
  shadcn/ui + lucide-react.
- **Backend** — FastAPI on Python 3.12, managed with `uv`. State is kept
  in process memory for the MVP (one set of dicts for profile, screenings,
  biomarkers, memory, and timeline); see
  [`docs/architecture.md`](./docs/architecture.md) for the
  post-submission persistence plan.
- **AI** — a single Claude Opus 4.7 orchestrator with tool use, adaptive
  extended thinking exposed through the opt-in "See reasoning" disclosure,
  and multimodal PDF ingestion direct into the model (no OCR layer).
- **Auth** — Supabase Auth wired on the web app with a `?demo=1` bypass
  for cold-open exploration; no session is required for the demo-only
  endpoints, but per-user data scoping is the Phase-1 work.
- **Deploy** — Vercel (web), Fly.io (api) when the production URL goes
  live for the submission.

Full architecture notes in [`docs/architecture.md`](./docs/architecture.md).
How the runtime uses Opus 4.7, the tool surface, and the extended-thinking
contract are in [`docs/agents.md`](./docs/agents.md). The capability
catalog across phases lives in [`ROADMAP.md`](./ROADMAP.md); the strategic
trajectory — phases, dependencies, open decisions, what *becoming Health
Companion for real* looks like — is in
[`docs/product-horizon.md`](./docs/product-horizon.md). The founder's
thesis, the original hackathon brief, the iterative planning docs, the
clinical audit checklist, and the running development journal are archived
under [`docs/process/`](./docs/process/).

## How this was built

Health Companion is being built by a small coordinated team of Claude Code
subagents working alongside the founder:

- `hc-coordinator` — product lead and thesis guardian, the founder's direct
  collaborator.
- `hc-frontend` — Next.js + Tailwind + shadcn/ui specialist.
- `hc-backend` — FastAPI + Opus 4.7 + tool-use specialist.
- `hc-clinical` — author and custodian of the clinical voice, guardrails,
  and screening schedules.

**Dr. Juan Manuel Fraga Sastrías** — a practicing primary-care physician
and director of a cancer center in Querétaro, México, also an educator and
tech enthusiast — is the fifth agent on the team. His role is to translate
the experience he cultivates with his own patients into something
replicable in software. *We're building the companion by the same pattern
we want the companion to have: a coordinator working with specialists.*

## Disclaimer

Health Companion is **not a medical device** and does not provide medical
advice, diagnosis, or treatment. Always consult a qualified healthcare
professional for any medical concerns. If you think you are having a
medical emergency, call your local emergency services immediately.

## License

Apache License 2.0 — see [`LICENSE`](./LICENSE).
