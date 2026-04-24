# Brief for the `video-hackathon` session

> Paste the content below as the opening prompt to a fresh Claude Code
> session whose only job is to produce short Remotion clips for the
> Sunday submission video.
>
> Context assumed on the other side: Remotion is installed on the M4,
> and the agent has write access to a working directory Juan Manuel
> chooses (`~/health-companion-video/` or similar).

---

## Prompt to paste

```
Role: you are the Remotion video specialist for the Health Companion
hackathon submission. Your job is to produce a small set of short,
polished animated clips in Remotion that illustrate the clinical
thesis of the product. The clips will be cut into the 3-minute demo
video recorded in Loom; they will not replace the live app demo, they
will interleave with it as editorial moments.

Source of truth for the thesis: the `Health Companion` repo at
github.com/jmfraga/health-companion. Before you write any Remotion
code, read these in this order to calibrate:

  1. README.md, sections "Three users, one product" and "Where we
     intervene — the three stages of any disease".
  2. docs/process/tesis-del-fundador-v1.md (full — especially §5 "The
     natural history of disease", §7 "the old family doctor, but
     digital", §8 "the sanitary interpreter", §9 "equity").
  3. docs/process/demo-script.md — where each clip is meant to land
     inside the 3-minute narration.
  4. docs/assets/three-users-nanobanana.png + three-users.html —
     the visual voice of the product. Match it.

Visual language (non-negotiable — this is the product's look):

- Paper background (#fdfcf8) with a very subtle dot grid.
- Zinc-900 typography (#18181b) as primary; Geist Sans for prose,
  Geist Mono for numbers and dates.
- Semantic palette — DO NOT mix:
    emerald (#059669 / #047857) = companion, plan, agreement
    amber   (#d97706 / #92400e) = proactive, memory-surfacing,
                                   "let's talk about this"
    blue    (#1d4ed8 / #bfdbfe) = labs, sensors, objective data
    red     (reserved)          = critical/emergency ONLY
- Flat editorial illustration. No 3D. No photorealism. No stock
  faces. No emoji. No "AI" or "robot" imagery — the companion is a
  voice, never a face.
- Motion tokens (from the product's CSS):
    --motion-fast:   150ms cubic-bezier(.4,0,.2,1)
    --motion-base:   240ms cubic-bezier(.4,0,.2,1)
    --motion-slow:   420ms cubic-bezier(.22,.61,.36,1)
    --motion-settle: 720ms cubic-bezier(.22,.61,.36,1)  /* the
                                                         three-months-
                                                         later fade */
- Frame size: 1920x1080 (16:9). Future-proof the components so the
  same compositions can render at 1080x1920 for vertical cuts.
- Frame rate: 30 fps. Keep clips compact (5-12 seconds each) so the
  edit stays tight.

Tone:
- Calm. Unhurried. No flashy sweeps or zooms.
- Type fades in on the beat; lines draw in; dots land deliberately.
- Nothing should feel like a medical device ad or a startup reel.
  Think Apple Health / Things 3 / good New Yorker animated shorts.

Clips to produce (first pass — Juan Manuel may add more later):

CLIP 01 — "The three stages" (≈ 10 s)
The conceptual center of the submission. One composition, animated.
- Frame opens on a calm horizontal line (Stage 1 · Health) drawn at
  roughly 70% of frame height.
- Label appears under it in Geist Mono small caps: "STAGE 1 · HEALTH".
- Line extends flat. Label fades.
- The line then begins to slope gently downward — the preclinical
  window. A secondary label fades in: "STAGE 2 · PRECLINICAL".
  Small caption: "invisible to the person · invisible to the system".
- The line steepens sharply. Third label: "STAGE 3 · CLINICAL".
  Caption: "symptom · finding · the system finally engages".
- Without treatment, the line keeps falling. A thin broken line
  shows what treatment recovers — partial, above the continued
  decline but below the original Stage-1 level.
- Closing frame: the whole curve visible, annotated. Typography
  still. Pause for 0.8 s so the narrator can land the line.

CLIP 02 — "Where we intervene" (≈ 6 s)
Same coordinate system as CLIP 01 so the edit can cross-fade.
- The Stage-1/2/3 curve is already drawn (faded to 40% opacity).
- An emerald vertical guide appears at the left of the curve —
  before Stage 2. Label: "Health Companion meets you here".
- A second emerald line rises ABOVE the original Stage-1 flat line,
  drawn from that guide onward. Label: "not only held — lifted".
- Closing: the lifted line resolves, the curve beneath keeps going
  for comparison.

CLIP 03 — "One product, two surfaces" (≈ 8 s)
Visual of the patient surface and the Bridge surface side by side.
- Left: a phone silhouette (Apple Health-clean) with the companion
  icon and a short chat bubble. Emerald accent.
- A soft emerald connective arc — the bridge — draws from left to
  right.
- Right: a clinician workstation silhouette with a patient list and
  a soft amber flag on one row. White-label placeholder visible at
  the top of the workstation: "YOUR CLINIC HERE".
- Caption typewrites at the bottom: "one product · two surfaces ·
  the companion is the continuity between visits".

CLIP 04 — "The sanitary interpreter" (≈ 7 s)
- Centered, a medical term in Geist Mono, all caps:
  "HYPERTENSION" — zinc-900, bold, prominent.
- Beneath it, slightly delayed, a plain-language translation writes
  itself out in Geist Sans, zinc-700:
  "blood pressure above the healthy range".
- The term above dissolves; the plain-language line remains.
- Repeat quickly for "HbA1c" → "your average blood sugar over the
  last three months", and "screening" → "a preventive check".
- Each pair holds for ~1.8 s. No other motion. The point is rhythm.

CLIP 05 — "Memory, compounding" (≈ 9 s)
The moat shot. Simple, quiet.
- A single sparkline draws itself: a glucose trend across six
  months with a visible mid-arc setback ("141 after travel"),
  ending lower than it began. Real human shape.
- Small labels land at the points: "118", "108", "141", "112".
- Beneath the line, the caption fades in: "a line is memory you
  can see".

Technical rules:

- Write each clip as its own composition in
  `src/compositions/Clip01ThreeStages.tsx` etc. Shared types and
  tokens live in `src/lib/tokens.ts` — replicate the semantic color
  palette above as named exports so no hex literals appear inside
  the composition files.
- Use `@remotion/google-fonts` or a self-hosted Geist pair — never
  rely on system fallbacks for the primary typography; the whole
  aesthetic depends on it.
- Keep interpolations linear-on-time only when the motion is
  literal (a line drawing). Use the project's cubic-bezier curves
  for anything that involves fade or translation.
- Render each clip at 1920x1080 30fps as an MP4 via
  `npx remotion render`; place the outputs under `out/` in the
  working dir.
- Expose a single `compositions.tsx` entry that registers all
  clips so `npm run studio` gives Juan Manuel a live preview to
  flip through.

Deliverables, in this order of priority:

1. Clip 01 (three stages) — this alone carries the thesis and must
   be the most polished.
2. Clip 02 (where we intervene) — must cross-fade from Clip 01
   without visual discontinuity.
3. Clip 05 (sparkline memory) — lands the "memory that compounds"
   line that closes Act 2.
4. Clip 03 (one product, two surfaces) — optional if time is tight;
   the Bridge Preview page in the live app carries this beat.
5. Clip 04 (sanitary interpreter) — nice-to-have. If the edit has
   room, it earns the "new category" framing in the narration.

Anti-patterns to avoid:

- No corporate-blue / tech-gradient look. The product is clinical-
  warm, not SaaS-cold.
- No visible "AI" branding. The product is a companion, not a model.
- No dramatic red flashes or heartbeats. Red is reserved.
- No stock medical b-roll. Everything is drawn in Remotion.
- No music in these clips. The video's music is added in post; the
  clips must work silent.

When you finish a clip, export a 1-second thumbnail PNG alongside
the MP4 so Juan Manuel can review in a folder view before opening
each video.

Start with Clip 01 and ship it end-to-end (composition + render +
thumbnail) before moving to Clip 02. Quality over quantity; this
video has to carry the thesis in three minutes.
```
