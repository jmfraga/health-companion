# Health Companion — Roadmap

> *"The health system today gets paid when you get sick. We're building the first companion whose only job is to keep you well — in the language you actually speak."*

**Last updated:** 2026-04-24 (Friday night, deploy day)
**Hackathon submission deadline:** Sunday, 2026-04-26 at 7:00 PM CDMX (8:00 PM EST)
**Live URLs (production, just landed):**
- Frontend (Vercel): https://health-companion-five.vercel.app
- Backend (Fly.io): https://hc-companion-api.fly.dev
- Repo: https://github.com/jmfraga/health-companion

This document is the operational roadmap of Health Companion: what we already built, what's left to ship before the submit window closes, and what comes after the hackathon. The capability vision (18 threads × 5 phases) lives separately under `## Capability vision` at the bottom — that part doesn't move week-to-week. The week-of-hackathon plan lives in [`docs/process/hackathon-plan.md`](./docs/process/hackathon-plan.md). Strategic trajectory beyond submission lives in [`docs/product-horizon.md`](./docs/product-horizon.md).

---

## (A) Sprints already shipped

### Sprint 0 · Repo and scaffolding — DONE (Apr 21)
**Owner:** Juan Manuel + hc-coordinator.
- Public repo `jmfraga/health-companion` under Apache 2.0.
- Monorepo: `apps/web` (Next.js 15 + App Router + Tailwind v4 + shadcn/ui), `apps/api` (FastAPI + Python 3.12, managed with `uv`).
- Founder docs: [`tesis-del-fundador-v1.md`](./docs/process/tesis-del-fundador-v1.md), [`concept-v1.md`](./docs/process/concept-v1.md), [`competitive-analysis-v1.md`](./docs/process/competitive-analysis-v1.md), [`hackathon-brief-for-claude-code-v1.md`](./docs/process/hackathon-brief-for-claude-code-v1.md).
- Four Claude Code subagents created (`hc-coordinator`, `hc-frontend`, `hc-backend`, `hc-clinical`).
- Anthropic API key + Opus 4.7 model verified.
- Dev server reachable over Tailscale from Juan Manuel's laptop.

### Sprint 1 · Act 1 plumbing — DONE (Apr 21–22)
**Owner:** hc-backend + hc-frontend.
- `POST /api/chat` with streaming SSE and full agentic loop (text → tool_use → tool_result → continuation).
- Single Opus 4.7 orchestrator with tool use; **no runtime subagents** (decision documented).
- Five typed tools shipped: `save_profile_field`, `schedule_screening`, `fetch_guidelines_for_age_sex`, `log_biomarker`, `remember`.
- Adaptive extended thinking via `output_config.effort=max`, `display=summarized`, piped through dedicated `reasoning_delta` SSE channel.
- Live profile panel with animated tool-use; emerald flash on update.
- **"See reasoning" disclosure** shipped as Act 1 wow #1 — collapsed by default, pulses while thinking, expands into clinical-note view.
- Orchestrator system prompt v2026-04-21 by hc-clinical, audited by Juan Manuel: 13.7K chars covering identity, hard rules, sanitary interpreter, screening knowledge, six-beat clinical turn, anti-patterns, failure-mode recoveries.
- Guideline library: 14 rows spanning USPSTF, ACS/NCCN, ACOG, ACC/AHA, NLA, ESC, ADA, Secretaría de Salud México.

### Sprint 2 · Act 1 polish — DONE (Apr 22–23)
**Owner:** hc-frontend + hc-clinical.
- ScreeningCalendar component rendering from `schedule_screening` events.
- Mobile-responsive pass: profile as collapsible bottom sheet; safe-area-inset; thumb-reach composer.
- Privacy + explicability + emergency surfaces shipped (`/privacy`, `/how-this-works`, persistent emergency pill with region-specific numbers).
- Photo-of-device ingestion path in the ingest endpoint (any device with a display becomes input).
- Clinical voice anti-patterns extended (false-reassurance guard, never normalize a single good day).
- Welcome card + 3 example chips for cold-judge entry.
- `Start fresh` header button + `POST /api/demo/reset`.

### Sprint 3 · Act 2 backend — DONE (Apr 23)
**Owner:** hc-backend.
- `POST /api/ingest-pdf` with multimodal Opus 4.7 input (PDF, JPEG, PNG, WEBP, HEIC) — no OCR layer.
- `submit_lab_analysis` and `submit_proactive_message` typed-output tools.
- `POST /api/simulate-months-later` (Messages API path) and **`POST /api/simulate-months-later-managed`** (Claude Managed Agents path) — sibling endpoints to compete for the $5K Managed Agents side prize without putting the demo at risk.
- Cross-endpoint memory: live state snapshot injected as second `system=` block on every chat turn, with prompt caching on the static prompt block.
- Token budget bug caught and fixed in `labs.py` (raised MAX_TOKENS to 24576, effort=high) — full 55-biomarker payloads now extract clean.

### Sprint 4 · Act 2 UI — DONE (Apr 23)
**Owner:** hc-frontend.
- LabDropZone with four-phase reading-state animation (opening → extracting → cross-referencing → drafting).
- LabExpanded inline rendering with WorthAConversationCard.
- MonthsLaterFade + ProactiveLetter (full-height, amber pill-tags, one honest CTA, inline toast — no `alert()`).
- HealthTimeline with source-semantic dots (blue objective, emerald companion, amber self-reported), inline drill-down per entry type.
- ToolTraceCard, ScheduleCard, ReasoningSheet shipped per the Claude Design handoff.
- Companion prose asymmetric from user bubbles by design.
- Humanized profile panel: dotted-key paths mapped to human labels, no JSON leaks, units appended.

### Sprint 5 · Trends + the Bridge preview — DONE (Apr 23)
**Owner:** hc-frontend + hc-backend.
- `/trends` route: `GET /api/trends` groups biomarkers by name; SVG charts (no lib) with shaded reference band, emerald series line, source-coded dots, drill-down to timeline entry.
- Sparklines on the profile panel for tracked parameters.
- `/bridge` clinician-side preview: white-label header ("Your clinic here · powered by Health Companion"), patient panel rail, real state for the selected patient (profile + screenings + timeline + trends), illustrative copy for the other three. Read-only, Phase-2 preview only.

### Sprint 6 · Auth + cold-judge polish — DONE (Apr 22–23)
**Owner:** hc-frontend + hc-coordinator.
- Supabase Auth (Google OAuth) wired with `?demo=1` bypass and `NEXT_PUBLIC_DEMO_BYPASS_AUTH` for friction-free judge URL.
- Welcome / honesty / reset pass; demo state visibly resettable.
- Founder bio on `/how-this-works` rounded out (educator + tech enthusiast).
- Three-users hero illustration (Nano-Banana render) on the README + full HTML poster.
- README "natural history of disease" section + thesis §5 + video brief.

### Sprint 7 · Pre-deploy hardening — DONE (Apr 24 morning + afternoon)
**Owner:** hc-backend + hc-coordinator.
- `DEPLOY.md` playbook authored (Fly.io + Vercel + CORS + custom domain notes).
- Synthetic Laura demo lab fixture (`fixtures/labs-laura-demo.pdf`) with glucose 118, LDL 136, total chol 223, HDL 70.
- LDL six-point arc (136 → 128 → 141 → 132 → 124 → 112) seeded via `POST /api/trends/seed-demo` for the `/trends` segment of Act 2.
- `scripts/demo-preflight.sh` — single-command reset + seed, parameterized by `HC_API_URL`, with explicit exit codes.
- Token-budget audit across `chat.py` and `simulate.py` (both hold; only `labs.py` needed the bump).
- Clinical-audit cross-reference (`docs/process/clinical-audit-crossref.md`) refreshed to current line numbers in the SYSTEM_PROMPT.
- Hans first-look brief drafted (`docs/process/hans-first-look.md`) with the URL slot pending.
- Bridge "Preview only — clinical version" advisory banner added.
- `.gitignore` protects `.deploy-*.sh` plaintext-secret helpers.

### Sprint 8 · Production deploy — DONE (Apr 24 evening, today)
**Owner:** Juan Manuel + hc-coordinator.
- **Backend live**: https://hc-companion-api.fly.dev — `/health`, `/api/demo/reset`, `/api/trends/seed-demo` all returning 200; CORS wired for the Vercel frontend; `auto_stop_machines=suspend`, `min_machines_running=1` so the demo never cold-starts on a judge.
- **Frontend live**: https://health-companion-five.vercel.app — 5 production env vars set (Supabase URL + anon key, JWKS URL, API URL, demo bypass flag); deploy READY.
- `/bridge` "Preview only — clinical version" banner deployed.
- `docs/process/hans-first-look.md` updated with the live URL and pasted to Hans for an outside read before submission.

---

## (B) What's left before the Sunday 7 PM submit

Three calendar windows, each with one must-ship and a small set of nice-to-haves. **The must-ships are non-negotiable. Nice-to-haves are explicitly cut if they put the must-ship at risk.**

### Sprint 9 · Saturday 2026-04-25 morning · Clinical audit — MUST SHIP
**Owner:** Juan Manuel (audit) + hc-clinical (apply edits) + hc-coordinator (commits).
**Time budget:** ~30 minutes review + ~30 minutes edits.
**File:** [`docs/process/clinical-audit-checklist.md`](./docs/process/clinical-audit-checklist.md) (cross-referenced to current SYSTEM_PROMPT line numbers).

**Must do:**
- Juan Manuel works the row-by-row checklist: §2 hard rules (10 min), §3 sanitary interpreter (with new BRCA, LDL/HDL, HbA1c, mammography terms), §4 screening knowledge (USPSTF 2024 mammography, NCCN "10 years before", ACS cervical, USPSTF 2021 colorectal, USPSTF 2021 lung LDCT, ADA glucose, ACC/AHA lipids), §5–§9 voice/anti-patterns/failure-mode recoveries.
- Apply any `[!]` flags as a separate commit (`prompt: clinical audit Apr 25 by JMF`) so the history shows the audit as its own step.
- Restart the dev server (auto-reload should suffice), run a single Laura turn end-to-end to confirm the prompt still lands.

**Then immediately after:**
- Run `bash scripts/demo-preflight.sh --seed-laura` against production to confirm everything works end-to-end after the prompt change.
- Two scratch run-throughs of the demo script (no recording yet) — feel-test the new voice.

**Nice-to-have (only if audit lands by 11 AM):**
- Tighten `/how-this-works` copy if Juan Manuel feels something is missing after the audit.
- Trim the welcome card copy if a chip feels off in light of the audit voice.

**Cut criterion:** if the audit isn't done by Saturday noon, hc-clinical applies obvious edits without waiting; record gets priority.

---

### Sprint 10 · Saturday 2026-04-25 afternoon · Demo recording — MUST SHIP
**Owner:** Juan Manuel (presenter) + hc-coordinator (timer + checklist).
**Time budget:** start at ~2 PM. Soft target: take in the can by 5 PM. Saturday night is the 50th-birthday party — the take has to be done before then.
**File:** [`docs/process/demo-script.md`](./docs/process/demo-script.md) (v3, two-turn Act 1, six-month LDL arc).

**Must do:**
1. Run `bash scripts/demo-preflight.sh` → state clean, LDL arc seeded, checklist printed.
2. Browser in incognito · `?demo=1` · `/settings` reasoning toggle ON · zoom 100% · 1400×900 · DevTools closed · audio one-take check · `fixtures/labs-laura-demo.pdf` on desktop · screen recorder armed · Slack/email/notifications closed.
3. Record **3-minute Loom** following the script:
   - 0:00–0:12 cold open (Topol seed + thesis line).
   - 0:12–1:30 Act 1 — two turns (rapport → schedule). Click See reasoning on the ScheduleCard.
   - 1:30–2:25 Act 2 — labs upload, 4-phase reading state, WorthAConversationCard, Simulate 3 months later, ProactiveLetter, navigate to `/trends`.
   - 2:25–2:45 Bridge preview ("one product, two surfaces").
   - 2:45–3:00 close (v0.1, 5 nights, Apache 2.0, every guideline cited).
4. Two takes minimum. Pick the better one. Caption critical lines if Loom autocaps wobble.

**Nice-to-have:**
- Editorial Remotion clips interleaved (5 micro-clips per [`docs/process/video-hackathon-brief.md`](./docs/process/video-hackathon-brief.md)) — only if a clean Remotion render is already produced from the parallel Claude Code session. **Do not let Remotion block the take.**
- Captions polished beyond Loom autocaps.

**Cut criterion:** if Remotion clips aren't ready by 4 PM, ship the plain Loom take. The narrative is the asset; the chrome is decoration.

**Fallback:** if a take breaks mid-recording, the demo-script.md "Fallback beats" section is rehearsed verbatim.

---

### Sprint 11 · Sunday 2026-04-26 morning · Buffer — MUST KEEP EMPTY
**Owner:** Juan Manuel.
**Time budget:** wake-up through ~12 PM CDMX.

**Must do:**
- **Nothing planned.** This window is the buffer for whatever exploded — re-record a take, fix a bug a judge will hit, patch CORS if Fly's overnight churn ate it, push a doc edit.
- Single sanity check: open the live URL on a phone in airplane mode + reconnect, confirm the chat completes end-to-end and the proactive flow renders.
- Optional: send Hans the live URL one more time if his first read produced a fixable signal.

**Cut criterion:** anything not directly improving the submit goes to Phase 1.

---

### Sprint 12 · Sunday 2026-04-26 afternoon · Submission — MUST SHIP
**Owner:** Juan Manuel + hc-coordinator (proofread).
**Submit URL:** https://cerebralvalley.ai/e/built-with-4-7-hackathon/hackathon/submit
**Hard deadline:** 7:00 PM CDMX (8:00 PM EST). Aim to submit by **5 PM CDMX** for breathing room.

**Must ship in this order:**
1. **Final README pass** (if not already clean from Friday): live URLs visible above the fold, status section, Apache 2.0 license, three-users illustration, design principles, what runs today, disclaimer.
2. **Submission description** (100–200 words). Source: [`docs/process/submission-draft.md`](./docs/process/submission-draft.md) — three drafts already written; pick the one closest to the final voice and trim.
3. **Submission form fields**:
   - Project name: Health Companion.
   - Tagline: *"The first companion whose only job is to keep you well."*
   - Live URL: https://health-companion-five.vercel.app (with `?demo=1` for friction-free entry).
   - Repo URL: https://github.com/jmfraga/health-companion.
   - Demo video: the Loom from Sprint 10.
   - Description: from step 2.
   - Side-prize tag: **Best use of Claude Managed Agents** ($5K) — narrate the `/api/simulate-months-later-managed` sibling endpoint.
4. **Submit**. Screenshot the confirmation. Post to Telegram for the family record.

**Nice-to-have (after submit, before the 7 PM hard cap):**
- Pin a tweet / LinkedIn post with the submit confirmation.
- Drop a link into the hackathon Discord.

---

## (C) Phase 1 · Post-hackathon (Apr 28 onward)

These are the things we explicitly cut from the hackathon scope. The order roughly follows the [`docs/product-horizon.md`](./docs/product-horizon.md) Phase-1 plan (~8–12 weeks, target: a heavy daily user costs the company under $3/month in inference).

### Week 1 · Submission retrospective + planning (Apr 28 – May 4)
- Read every judge note carefully; capture what was confirmed, what was missed.
- Decide closed-list vs waitlist for the patient beta.
- First conversation about engineering co-founder vs consulting help.
- Legal kick-off: México SAPI vs Delaware C-corp vs LLC; first draft of incorporation docs.

### Weeks 2–4 · Persistence and per-user reality (May)
- **Supabase Postgres migration**: every in-memory store (profile, screenings, biomarkers, timeline, memory) becomes a Postgres table with Row-Level Security keyed to `user_id`.
- **pgvector** on `semantic_memory` for retrieval-based recall (replaces tag-based filtering).
- **Supabase Storage** for uploaded lab PDFs and images.
- **Auth in production**: demo bypass gated off; Google + Apple OAuth; biometric unlock on the mobile PWA.
- **Background episodic → semantic distillation pass** at end of session or on idle.
- Waitlist landing page live; first 20 real users in closed beta with weekly transcript review.

### Weeks 5–8 · Cost architecture (June)
The three levers from [`ROADMAP.md`](./ROADMAP.md) §18, in order:
1. **Prompt caching with 1-hour TTL** + split state snapshot (semi-stable half caches; fresh half doesn't). Target: 40–60% input-cost reduction on cache hits.
2. **Turn-classifier routing** — Haiku 4.5 for rapport / memory writes, Sonnet 4.6 for everyday turns, Opus 4.7 reserved for multimodal lab ingestion + screening reasoning visible to the user + proactive letters + audit-bearing turns. Target: 60–80% total cost reduction. Local classifier on existing MLX/Ollama.
3. **Extended thinking on demand** rather than `effort=max` always. Target: 30–50% output-cost reduction.
- **Result target:** per-turn cost from $0.17 to ~$0.04. At 2–3 turns/day → $2.40–$3.60 active user / month.
- **Observability** via `agent_runs` audit table (the one we skipped in Phase 0): per-user, per-turn input/output tokens, cost, tool-call digest, error field. Lightweight ops dashboard. Cost alerts.

### Weeks 9–12 · Clinical voice + production hardening
- **Monthly clinical audit cadence** against the checklist; guideline versions tracked in code, not prose.
- **First Spanish-MX pass** of the clinical voice — language follows the device (`navigator.language`); override persists in `preferences.language`.
- **Production deployment** properly: Vercel + Fly.io with custom domain, monitoring (Sentry), alerts, CI from `main`, deploy docs a non-author can follow.
- **Tests**: pytest for the orchestrator + tool runtime; Playwright for the demo flow; smoke coverage on every endpoint.
- **Living state document hardening**: timeline drill-down on every event type, Next Steps / Commitments layer (Phase-1 first sprint).

### Phase 1 capability adds (in priority order)
1. **One-line "why" tag** above every clinical assistant turn (always-on explicability) — three-layer reasoning visibility model from §6.
2. **Always-written audit log** of full reasoning per turn (not user-visible by default; available on transcript request, to the treating physician with consent, and to us for clinical-quality review).
3. **Settings surface lands**: language override, section-hide toggles (Vaccines optional), reasoning-visibility toggle, privacy export/delete, profile photo.
4. **Screening cards grow a "Set a date" affordance** → reminder against `reminders` → surfaces in Next Steps.
5. **Vaccines section** as a first-class layer (past + future, cited CDC ACIP / SSA México, hideable).
6. **Behavioral follow-through layer** — contextual reminders with emotional register, active verification, real celebration on follow-through.
7. **Wearable pilot**: Garmin + Apple Health + Google Fit / Health Connect. Start with HRV, RHR, nocturnal HR, respiratory rate, sleep, stress, body battery, SpO₂.
8. **Proactivity v1 on Claude Managed Agents** in production (we already have the endpoint shape from the hackathon).

### Phase 2 · The Bridge (Q3–Q4 2026)
- Real clinician workflow: clinician auth, panel of enrolled patients, clinician note editor with LLM-assisted plain-language translation, soft flags from real state, shared calendar awareness.
- White-label configuration: clinic branding, clinic-specific guideline overlays, panel-level reporting.
- **First pilot site**: Querétaro primary-care or cancer-center partner. 50–200 enrolled patients. 6-month intervention vs matched control. Adherence to recommended screenings, appointment show-rate, unplanned visits, self-reported preparedness as primary outcomes.
- **Regulatory**: BAA with Anthropic; formal COFEPRIS wellness classification; HIPAA posture documented; MDR/CE scoping started.

### Phase 3+ · Evidence, scale, policy infrastructure (2027+)
See [`docs/product-horizon.md`](./docs/product-horizon.md) for the full trajectory. Multi-language, full pillar coverage, outcome studies, insurer pilots, policy partnerships, FHIR / EMR exchange.

---

## Capability vision (the long-horizon catalog)

The 18 capability threads — sanitary interpreter, proactive engine, longitudinal memory, clinical accompaniment, modalities, three-layer reasoning visibility, privacy as a feature, explicability, emergency safety, real-world-evidence, equity, regulatory posture, four-timeline state document, behavioral follow-through, adoption paths, longitudinal trend charts, false-reassurance guard, accessibility-as-cost-architecture, cross-endpoint memory — and their phasing across Phase 0 through Phase 4 lived previously in this file. They have been preserved verbatim in [`docs/product-horizon.md`](./docs/product-horizon.md) Parts 1–6 to keep this roadmap focused on sprints, dates, and ownership.

---

## Risk register (for the submit window only)

| Risk | Mitigation |
|---|---|
| Production URL goes down on judging day | Loom take in hand by Saturday night; in-memory state ships with the repo so a judge can run `npm run dev` if needed. |
| Fly machine cold-starts on first judge load | `min_machines_running=1` already set; manual ping before each promo blast. |
| Anthropic key leaks via the Vercel build log | Key is Fly-only; Vercel only carries `NEXT_PUBLIC_*` (publishable) values. |
| Loom take has a flaw and we notice it Sunday morning | Sprint 11 buffer is for exactly this. Re-record allowed. |
| Demo script asks for the schedule turn but the model hedges | Fallback narration in `demo-script.md` covers the case without breaking the take. |
| Submission window is missed | Aim for 5 PM CDMX. Two-hour buffer to the 7 PM hard cap. |
| Judge tries the live URL with a real lab PDF and a quirk hits | The product is in-memory + demo; the README and the Hans-look brief both say so explicitly. Honesty is the buffer. |

---

## Team

The product is being built by **Juan Manuel Fraga Sastrías** — primary-care physician, director of a cancer center in Querétaro — as the fifth agent in a coordinated team of Claude Code subagents:

- `hc-coordinator` — product lead, thesis guardian, owns this file.
- `hc-frontend` — Next.js 15 + Tailwind + shadcn/ui specialist.
- `hc-backend` — FastAPI + Opus 4.7 + tool-use specialist.
- `hc-clinical` — author and custodian of the clinical voice (audited by Juan Manuel).

This pattern is itself part of the product's story: **we are building health-as-a-team by building the product as a team.**

---

## Non-goals (what Health Companion will never become)

- A symptom checker.
- A diagnostic tool.
- A prescription engine.
- A replacement for the user's doctor.
- A data broker.
- A surveillance app. Memory is opt-in, exportable, deletable.

The product exists to help people stay well and to be heard when they are not.
