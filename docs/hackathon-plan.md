# Health Companion — Hackathon Roadmap

**Hackathon**: Built with Opus 4.7 (April 21–26, 2026)
**Submission deadline**: Sunday April 26, 8:00 PM EST (7:00 PM CDMX)
**Presentation**: 3 minutes total, in English, judged by Anthropic.
**Team**: Juan Manuel Fraga (code + clinical voice) + son (product sparring) + four Claude Code subagents.
**Internal target**: working MVP by **Saturday April 25 morning** so Saturday night is the 50th-birthday party, Sunday is buffer + demo video + submission.

## Product form factor

- **Primary target**: **mobile (phone)** Progressive Web App. The companion lives in the user's pocket.
- **Secondary target**: desktop browser (for dev and for clinician demos). Everything that works on mobile must also work on desktop; the layout is responsive rather than two codebases.
- Design decisions that collide with that constraint (e.g. fixed-width sidebars, hover-only interactions, non-thumb-reachable buttons) get the short end of the stick.

## Demo narrative (3 minutes, English, two acts)

> *Laura, 44. Her mother died of breast cancer at 52.*

### Act 1 — Meeting Laura (~45 seconds)
Laura opens the app and speaks in natural language:
> *"I'm 44, my mom died of breast cancer at 52."*

The side panel builds her profile in real time via **visible tool use** (age, sex, family history, inferred risks). Opus 4.7 proposes a screening calendar in everyday English, with an optional **"See reasoning"** disclosure that reveals the clinical reasoning on demand. Close with: educate → contextualize → refer to your doctor.

### Act 2 — Labs and proactivity (~55 seconds)
Laura drops in a lab PDF. Opus 4.7 reads it multimodally, detects glucose 118 mg/dL, cross-references with the profile, explains without alarm. A ~3-second fade — *three months later* — and the app writes proactively:
> *"You turn 45 next month. Remember what we talked about? Let's schedule that mammogram."*

The timeline shows the memory moat.

---

## Runtime architecture

One Opus 4.7 orchestrator with tool use. No runtime subagent fan-out (that's for the development team).

Tools: `save_profile_field`, `log_biomarker`, `schedule_screening`, `fetch_guidelines_for_age_sex`, `remember`.

SSE event channels:
- `message_delta` → chat text
- `reasoning_delta` (bracketed by `reasoning_start` / `reasoning_stop`) → "See reasoning" disclosure
- `tool_use` / `tool_result` → live profile panel, screening calendar, lab table, timeline
- `lab_analysis` → lab table + interpretation (Act 2)
- `proactive_message` → proactive message card (Act 2 close)
- `done` / `error` → turn lifecycle

---

## Status (live at end of night 1 — April 21)

| Milestone | Status |
|-----------|--------|
| Repo public with Apache 2.0 | ✅ |
| Monorepo Next.js 15 + FastAPI scaffolded | ✅ |
| Docs (thesis, concept, competitive, brief) in English | ✅ |
| `development-journal.md` started | ✅ |
| Four development agents (`hc-*`) defined | ✅ |
| Anthropic API key + Opus 4.7 verified | ✅ |
| Supabase Postgres connected (session pooler `aws-1-us-east-2`) | ✅ (held for post-hackathon) |
| Dev servers reachable via Tailscale (M4: 100.72.169.113) | ✅ |
| `POST /api/chat` with streaming SSE + tool use | ✅ |
| `save_profile_field` tool | ✅ |
| Extended thinking (`effort: max`, adaptive, summarized) | ✅ |
| "See reasoning" disclosure in chat UI (Act 1 wow #1) | ✅ |
| Live profile panel with animated tool use | ✅ |
| First delegation to `hc-frontend` completed | ✅ |
| Orchestrator system prompt (final, clinician-audited) | ⏳ hc-clinical |
| `schedule_screening` + `fetch_guidelines_for_age_sex` + `remember` tools | ⏳ hc-backend |
| `ScreeningCalendar` component | ⏳ |
| Mobile-responsive pass (PWA manifest, thumb-reach, viewport) | ⏳ |
| `POST /api/ingest-pdf` (multimodal Opus 4.7) | ⏳ |
| `log_biomarker` tool | ⏳ |
| `LabDropZone` + `LabTable` + `ConfidenceBadge` | ⏳ |
| `POST /api/simulate-months-later` + fixture | ⏳ |
| `MonthsLaterFade` + `ProactiveMessageCard` + `HealthTimeline` | ⏳ |
| Shadcn + lucide-react polish pass | ⏳ |
| Demo video (3 min, Loom) | ⏳ |
| Submission description (100–200 words) | ⏳ |

---

## Nights 2–5 plan

### Night 2 — Wednesday Apr 22 · Close Act 1
Target: Laura speaks, screening calendar appears, "See reasoning" expands into real clinical reasoning.

1. `hc-clinical` drafts orchestrator system prompt (sanitary interpreter rules + screening logic); JM audits and merges. *~30 min.*
2. `hc-backend` adds `schedule_screening`, `fetch_guidelines_for_age_sex`, `remember` tools. *~40 min.*
3. `hc-frontend` builds `ScreeningCalendar` component that renders from `schedule_screening` tool-use events. *~30 min.*
4. End-to-end verify: "I'm 44, my mom had breast cancer at 52" → profile + 3–4 screenings with rationale + "See reasoning" expands. *~15 min.*

### Night 3 — Thursday Apr 23 · Arrancar Acto 2 (multimodal + tabla)
Target: PDF drop produces multimodal extraction + color-coded lab table.

1. Fixtures: synthesize a realistic anonymized lab PDF with glucose 118 mg/dL + supporting panels. JM validates clinically.
2. `hc-backend` adds `POST /api/ingest-pdf` with base64 multimodal input to Opus 4.7, returning structured `LabAnalysis` via tool call.
3. `hc-backend` adds `log_biomarker` tool (completes the 5).
4. `hc-frontend` builds `LabDropZone` + `LabTable` + `ConfidenceBadge`.

### Night 4 — Friday Apr 24 · Close Act 2 (proactivity + memory)
Target: "3 months later" fade triggers the proactive message; timeline shows the arc.

1. `hc-backend` adds `POST /api/simulate-months-later` + 3-months-later fixture state (timeline entries, proactive payload).
2. `hc-frontend` builds `MonthsLaterFade` + `ProactiveMessageCard` + `HealthTimeline`.
3. `hc-clinical` drafts the proactive message wording; JM pulls for voice.
4. JM records a scratch 5-minute warm-up walkthrough for feel.

### Saturday morning Apr 25 · Polish + fixtures + record demo
Target: MVP demoable end-to-end, demo video grabado, fiesta al atardecer.

1. shadcn/ui primitives (Button, Card, Dialog if needed) + lucide-react icons in the places they earn weight.
2. Typography + spacing pass.
3. **Mobile-responsive pass**: the primary surface must shine on a phone. Test in iOS Safari and Android Chrome at 390×844. Profile panel becomes a collapsible sheet on narrow viewports; chat fills the screen; timeline scrolls horizontally if needed.
4. Swap fixture PDF + seed profile for JM's clinically-validated versions.
5. Record **3-minute Loom demo**, two takes, edit, caption.
6. Rehearse cronometrado ≥ 3 times.

### Sunday Apr 26 · Submit before 7 PM CDMX
1. Buffer for whatever explodes (something always does).
2. Re-record if the take doesn't hold up.
3. README polish; 100–200 word submission description grounded in the founder thesis.
4. Submit via https://cerebralvalley.ai/e/built-with-4-7-hackathon/hackathon/submit.

---

## Scope freeze (non-negotiable for hackathon)

**In MVP**: English UI, single seed profile (real anonymized patient on Saturday), **in-memory state + fixtures**, single Opus 4.7 orchestrator with tool use, two demo acts, mobile-first PWA, regulatory disclaimers visible, **Supabase Auth with Google OAuth** (promoted from deferred after Juan Manuel's night-2 vote — signals clinical-grade seriousness to the judges).

**Held for post-submission**: Supabase Postgres persistence of clinical state (schema + migrations + RLS), multi-user, multi-language UI, wearable integrations, push notifications, payments, the other health pillars in full, native apps, Whisper post-consultation audio.

**Non-negotiable clinical rules**: never diagnose, never prescribe, always refer. Wellness + education + referral. Matches FDA General Wellness, COFEPRIS wellness software, MDR wellness exemption.

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Live demo breaks on judging day | Pre-recorded fallback video on Loom; fixtures local; in-memory state ships with the repo. |
| "Why not ChatGPT Health?" objection | Rehearsed answer: reactive vs proactive, no longitudinal clinical memory, no companion relationship. See `competitive-analysis-v1.md`. |
| "Regulatory?" objection | 20-second answer: wellness category, never diagnoses or prescribes, clinician-led content, FDA / COFEPRIS / MDR exempt. |
| Opus 4.7 hallucinates lab values | Forced structured output with schema; confidence per value; re-ask on ambiguity. |
| Mobile layout breaks under pressure | Mobile is a separate rehearsal pass on Saturday; don't trust that desktop-Chrome work translates. |
| Visual polish falls behind engineering | shadcn + tailwind defaults; two hours on typography + spacing beats one extra feature. |
| Saturday is JM's 50th birthday | The MVP target is Saturday morning so the evening is the party. Sunday is buffer + video + submit. |

---

## Fixtures needed from Juan Manuel

1. **Anonymized lab PDF** with fasting glucose 118 mg/dL visible. Additional panels (CBC, lipids, HbA1c optional) make the extraction look rich. Can be fabricated and audited.
2. **Laura seed profile** — clinical confirmation: 44 y, female, mother died of breast cancer at 52, diabetic father, any active conditions, medications, habits, country of residence.
3. **"3 months later" proactive message** — draft in English, JM refines for voice.
4. **"See reasoning" tone calibration** — concise clinical note vs educational differential vs short paragraph. Default in current implementation: concise clinical note (confirm).

---

## Pitch seed (from the founder thesis)

> *"The health system today gets paid when you get sick. We're building the first companion whose only job is to keep you well — in the language you actually speak."*
