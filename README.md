# Health Companion

> Your personal health companion — preventive, personalized, proactive.

A wellness app that helps anyone stay healthier, adapted to their history, habits, and age. Built on the idea that the best health tool is the one that knows you over time — like a family doctor who's seen you for ten years.

## Status

Work-in-progress submission for the **Built with Opus 4.7** hackathon (April 21–26, 2026). Nothing here is production-ready. No medical advice. Not a medical device.

## The three things it does

1. **Explains your labs.** Upload a PDF or photo of your blood work. Get a plain-language explanation that considers your age, sex, family history, and previous results. Flags what matters. Tells you when to talk to your doctor. Never diagnoses.

2. **Prepares you for your consultation.** Tell it about your upcoming visit. It generates a personalized summary, a list of smart questions to ask, and a comparison with previous studies so you walk in ready.

3. **Remembers what your doctor said.** Patients forget 40–80% of what's said in a consultation. Record it (with permission) or tell the app afterward — it organizes instructions, medications, pending studies, and follow-ups into something you can actually act on.

The value compounds: every interaction makes it more useful. Its job is to know you well, not to replace your doctor.

## Design principles

- **Wellness, not diagnosis.** Educates, contextualizes, refers. Never prescribes.
- **Memory is the product.** Each session teaches the companion more about you.
- **Your data is yours.** End-to-end encryption at rest and in transit. Export or delete everything, anytime. Never sold, never shared.
- **Trust is visible.** Privacy isn't hidden in the Terms of Service — it's on the screen.

## Tech stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui. PWA from day one.
- **Backend:** FastAPI (Python 3.12) + Pydantic v2 + SQLAlchemy.
- **Data:** Supabase (Postgres + pgvector + Auth + Storage).
- **AI:** Claude Opus 4.7 via Claude Managed Agents, with Haiku 4.5 for lightweight tasks. Whisper API for speech-to-text.
- **Deploy:** Vercel (web), Fly.io (api).

Full architecture notes will live in [`docs/architecture.md`](./docs/architecture.md) once scaffolded.

## Disclaimer

Health Companion is **not a medical device** and does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for any medical concerns. If you think you are having a medical emergency, call emergency services immediately.

## License

Apache License 2.0 — see [`LICENSE`](./LICENSE).
