# Brief for the `video-hackathon` session — micro-clip catalog

> Paste the contents below as the opening prompt to a fresh Claude Code
> session dedicated to producing Remotion clips for the Health Companion
> submission video.
>
> Philosophy revised from the earlier draft: **many small self-contained
> clips rather than a few long composite ones.** Juan Manuel edits the
> 3-minute Loom recording and decides which micro-clips to interleave.
> Each clip is a single idea, 2–5 seconds, silent, renders cleanly on
> its own, and can be reordered freely in the edit.

---

## Prompt to paste

```
Role: you are the Remotion video specialist for the Health Companion
hackathon submission. Your job is to produce a catalog of short
atomic animated clips — one visual idea per clip, 2-5 seconds long,
silent, self-contained — that Juan Manuel will pick from and
interleave with the live-app Loom recording.

Priority is BREADTH first: get as many clips rendered as possible so
he has options in the edit. Polish comes on the ones he selects.

────────────────────────────────────────────────────────────────────
PREREQUISITE READING (do this first, then calibrate)
────────────────────────────────────────────────────────────────────

From the Health Companion repo at github.com/jmfraga/health-companion:

  1. docs/process/tesis-del-fundador-v1.md
     — especially §5 "The natural history of disease"
     — §7 "The old family doctor, but digital"
     — §8 "The sanitary interpreter"
  2. README.md
     — "Three users, one product"
     — "Where we intervene — the three stages of any disease"
     — "Design principles"
  3. ROADMAP.md §16b (trend charts) and §18 (cost architecture).
  4. docs/process/demo-script.md — where in the 3-minute arc each
     clip is meant to land.
  5. docs/assets/three-users-nanobanana.png + three-users.html —
     this is the visual voice. Match its restraint.

────────────────────────────────────────────────────────────────────
VISUAL LANGUAGE (non-negotiable)
────────────────────────────────────────────────────────────────────

- Paper background #fdfcf8 with a subtle dot grid (radial gradient,
  opacity 0.035, 24px spacing).
- Primary type: Geist Sans, zinc-900 #18181b. Data / mono / axis
  labels: Geist Mono. Load via @remotion/google-fonts — never rely
  on system fallbacks.
- Semantic palette, do not mix:
    emerald #059669 / #047857 = companion, built life, the lifted line
    amber   #d97706 / #92400e = preclinical deterioration, memory
    blue    #1d4ed8 / #bfdbfe = labs, sensors, objective data
    red     #b91c1c           = Stage 3 clinical descent ONLY —
                                 the one place red is earned
    zinc    #71717a / #a1a1aa = axes, neutral guides
- Flat editorial illustration. No 3D. No glow effects. No particles.
  No sweeping camera moves. No zoom-ins.
- Motion curves:
    fast   150ms cubic-bezier(.4,0,.2,1)
    base   240ms cubic-bezier(.4,0,.2,1)
    slow   420ms cubic-bezier(.22,.61,.36,1)
    settle 720ms cubic-bezier(.22,.61,.36,1)
  Line-drawing uses linear stroke-dashoffset interpolation. Fades
  and translations use the cubic curves.
- Frame: 1920x1080, 30fps, MP4 via `npx remotion render`. Design
  components so the same compositions can render at 1080x1920 for
  vertical cuts (composition width/height parameterized).
- Each clip exports a 1-second still thumbnail PNG alongside so
  Juan Manuel can review in a folder view before opening each MP4.

Tone:
- Calm. Unhurried. Give text time to be read.
- Labels appear in prose beats, not all at once.
- Nothing should feel like a pharma ad, a SaaS reel, or a YC demo.
  Think Apple Health · The Pudding · good New Yorker animated
  shorts · paper-on-paper.

────────────────────────────────────────────────────────────────────
MICRO-CLIP CATALOG (build in this order — A, then B, then the rest)
────────────────────────────────────────────────────────────────────

Naming convention:
  clip-<group><number>-<slug>.mp4 and -thumb.png
  e.g.: clip-a3-stage2-declines.mp4

All clips share the same coordinate origin so Juan Manuel can
cross-fade A/B clips if he wants. Group A + B together tell the
natural-history-of-disease story in sequence; if he renders a
continuous version it is the composite of A1→B6.

─── Group A — Natural history of disease (the thesis spine) ───

  A1 — Stage 1 line draws in.                             (3.0s)
       Coordinate system appears (no ticks, just the dot grid).
       A flat emerald line draws itself from the left-margin to
       about 35% of the usable width at y=70%. Linear draw. Label
       under it, Geist Mono uppercase letter-spaced .08em,
       zinc-700: "STAGE 1 · HEALTH". Small caps.

  A2 — Stage 1 caption reveal.                            (3.5s)
       Starts with the A1 final frame. A caption fades in under
       the STAGE 1 label, Geist Sans 18px zinc-700 italic:
       "you are building your future health every day · or
       eroding it." Holds for 2 seconds after fade-in completes.

  A3 — Stage 2 declines.                                  (3.0s)
       A1 final frame present (the flat emerald line). The line
       continues rightward and slopes down gently — ~15° below
       horizontal — into the preclinical window. Stroke color
       transitions through emerald-800 into amber-600 as it
       descends. Label above the sloped section, mono small-caps,
       amber-800: "STAGE 2 · PRECLINICAL".

  A4 — Stage 2 caption reveal.                            (3.5s)
       Starts with A3 final frame. Caption fades in below the
       sloped section, Geist Sans 17px italic, amber-800:
       "invisible to the person · invisible to the system."

  A5 — Stage 3 steepens.                                  (3.0s)
       Starts with A4 final frame. Line steepens to ~45° below
       horizontal. Stroke transitions to deep red #b91c1c. Label
       above, mono small-caps, red-800: "STAGE 3 · CLINICAL".

  A6 — Stage 3 caption reveal.                            (3.5s)
       Starts with A5 final frame. Caption below: "symptom ·
       finding · the system finally engages." Red-900, italic.

  A7 — The fork · untreated and partial recovery.         (5.0s)
       Starts with A6 final frame. Two paths diverge from the
       Stage-3 endpoint:
         (a) SOLID red line continues descending down-right,
             thin 1.5px, labeled "UNTREATED" in mono.
         (b) DASHED zinc-700 line (stroke-dasharray 6,4) rises
             partially and plateaus below the original Stage-1
             level, labeled "WITH TREATMENT · partial recovery".
       A zinc-300 dotted horizontal guide extends at the original
       Stage-1 height across the full width (0.5 opacity) to make
       the gap between the treated line and baseline visible.

  A8 — Closing line of the thesis.                        (3.5s)
       Whole A-group curve present at 100%. Bottom of frame, a
       quiet caption fades in, Geist Sans 20px zinc-900:
       "the later we arrive, the less we can restore."

─── Group B — Where Health Companion intervenes ────────────────

  B1 — Intervention point marker.                         (2.5s)
       Starts with A8 final frame at 40% opacity. A dashed
       vertical emerald guide (#047857, 2px, stroke-dasharray 4,4,
       70% opacity) fades in at x=20% of the usable width — BEFORE
       Stage 2 began. No label yet.

  B2 — Intervention label.                                (3.5s)
       Starts with B1 final frame. Label fades in above the
       vertical guide, mono small-caps, emerald-700:
       "HEALTH COMPANION MEETS YOU HERE". Holds for 2 seconds.

  B3 — The lifted line draws.                             (4.5s)
       Starts with B2 final frame. From the intervention point
       onward, a NEW emerald line draws to the right. Starts at
       the same y-level as the original Stage-1 line, rises
       gently, and ends at a y-level clearly ABOVE the original
       Stage-1 baseline (say 15% higher on the Y-axis). Stroke:
       emerald-600, 3px (thicker than the underlying faded curve
       so it visually dominates).

  B4 — New baseline dotted guide.                         (3.0s)
       Starts with B3 final frame. A horizontal emerald-600
       dotted guide (stroke-dasharray 3,3) draws in at the new
       higher y-level, extending back to the intervention point.
       Label at the right edge, mono small-caps, emerald-700:
       "NEW BASELINE".

  B5 — "Not only held — lifted" label.                    (3.5s)
       Starts with B4 final frame. Inline label near the tail of
       the lifted emerald line, Geist Sans 19px semibold,
       emerald-800: "not only held — lifted."

  B6 — Closing couplet.                                   (4.0s)
       Starts with B5 final frame. Bottom caption fades in,
       two lines:
         Geist Sans 20px zinc-900:
           "a level of health actively built."
         Geist Sans 14px italic zinc-600:
           "measured not by a diagnosis avoided, but by years of
           real health added."

─── Group C — Sanitary interpreter (plain-language translations) ──

  C1 — "HYPERTENSION" → plain language.                   (3.5s)
       Centered, on the paper. First, the medical term in Geist
       Mono 44px uppercase zinc-900 bold: "HYPERTENSION". Holds
       0.6s. Then typewrites beneath it, Geist Sans 22px
       zinc-700: "blood pressure above the healthy range". The
       term above dissolves. The translation remains.

  C2 — "HbA1c" → plain language.                          (3.5s)
       Same composition as C1. "HbA1c" → "your average blood
       sugar over the last three months."

  C3 — "BRCA" → plain language.                           (3.5s)
       "BRCA" → "gene variants that can raise breast and ovarian
       cancer risk in some families."

  C4 — "screening" → plain language.                      (3.5s)
       "SCREENING" → "a preventive check."

  C5 — "LDL" → plain language.                            (3.5s)
       "LDL" → "the cholesterol you generally want to keep lower."

─── Group D — Memory & trends (the moat) ───────────────────────

  D1 — Glucose sparkline 118 → 108.                       (4.0s)
       Minimalist sparkline, emerald line, four data points:
       118 → 115 → 112 → 108. Points appear one at a time left
       to right with the line connecting. Last point gets a
       subtle emerald circle. Y-axis not drawn — just the curve
       on paper. Under it, mono 13px zinc-500: "FASTING GLUCOSE
       · 3 MONTHS · mg/dL".

  D2 — LDL sparkline with mid-arc setback.                (5.0s)
       Six data points across 6 months: 136 → 128 → 141 → 132
       → 124 → 112. Points appear one at a time. The 141 point
       visibly rises above the previous — the setback — with a
       small amber dotted annotation from the 128 point to the
       141 point labeled "travel broke the routine". Final point
       at 112 gets the emerald circle. Caption below: "real
       change isn't linear."

  D3 — "Memory is the product."                           (3.0s)
       Typography-only clip. Centered Geist Sans 48px zinc-900.
       Text fades in, holds 2s, fades out. No decoration.

  D4 — Timeline rail with source-coded dots.              (4.5s)
       Vertical timeline rail, zinc-200. Five events fade in
       from top to bottom, each with a colored dot and a short
       label:
         emerald · "Mother's history · April 21"
         amber   · "Mammography scheduled · Next week"
         blue    · "Lab values · May 3"
         emerald · "Walking habit · June 8"
         amber   · "3-month check-in · July 21"
       Final frame holds the full rail.

─── Group E — The three users / the Bridge ─────────────────────

  E1 — Three-user wordmark reveal.                        (3.5s)
       Three short labels fade in left-to-right across the frame,
       Geist Sans 20px zinc-900:
         "People who want to start caring."
         "People who already care, and want to keep going."
         "Doctors whose daily work becomes keeping people well."
       Each ~700ms delay from the previous. Holds 0.8s at the
       end.

  E2 — One product, two surfaces (typography-only).       (3.0s)
       Centered, two-line reveal:
         "ONE PRODUCT" (mono small-caps zinc-900)
         "two surfaces" (Geist Sans italic 32px emerald-700)

  E3 — Bridge arc (patient ↔ clinician).                  (4.5s)
       Left: a minimalist phone silhouette (rounded rectangle,
       zinc-300 stroke, small emerald heart icon inside).
       Right: a workstation silhouette (rounded rectangle,
       zinc-300 stroke, three short horizontal lines inside
       representing a patient list, one of them amber-flagged).
       An emerald arc draws from the phone to the workstation,
       left to right, as a continuous curve (not a straight
       line). Label beneath arc: "THE BRIDGE".

  E4 — White-label placeholder.                           (3.0s)
       Centered, dashed rectangle (zinc-300 stroke, 2px,
       dasharray 6,4) at roughly 200x60px containing mono
       uppercase letter-spaced zinc-400: "YOUR CLINIC HERE".
       Below it, smaller, zinc-500: "powered by Health
       Companion". The dashed border pulses gently once
       (scale 1.0 → 1.02 → 1.0 over 1.4s).

  E5 — Clinician note → patient translation.              (5.0s)
       Left column: a short clinician note in Geist Mono 13px
       zinc-700: "58M, stage-1 HTN, BP avg 134/86, continue
       DASH + exercise, reassess in 2 wk."
       An emerald arrow animates from left to right.
       Right column: the auto-translated version in Geist Sans
       16px zinc-900: "Your blood pressure has been running a
       little high lately. Let's keep walking, watch the salty
       food, and check again in two weeks."
       Both columns present throughout; the arrow animates
       between them.

─── Group F — Atmosphere / closing ─────────────────────────────

  F1 — Heart-line wordmark.                               (2.5s)
       Centered emerald heart (#047857, outline 2px, no fill)
       with the wordmark "Health Companion" in Geist Sans 24px
       zinc-900 to its right. Both fade in together. Heart has
       a gentle scale animation (1.0 → 1.03 → 1.0 over 1.2s)
       once, then holds.

  F2 — "Built with Opus 4.7".                             (2.5s)
       Bottom-right corner placement, mono small-caps letter-
       spaced .1em, zinc-500, 14px. Fades in, holds, fades out.

  F3 — Thesis close · full-frame typography.              (4.0s)
       Centered, three-line reveal with slight stagger:
         Geist Sans 32px zinc-900:
           "The health system gets paid"
         Geist Sans 32px zinc-900:
           "when you get sick."
         Geist Sans 32px emerald-700 semibold:
           "We get paid to keep you well."
       Each line appears 500ms after the previous. Holds 2s
       on the final frame.

  F4 — Paper-wipe transition.                             (1.5s)
       An empty paper transition — a subtle emerald horizontal
       sweep moves left-to-right across the paper, leaving
       nothing behind. Useful as a punctuation between live-app
       segments in the edit.

─── OPTIONAL composite clips (build ONLY if everything above renders clean) ──

  Z1 — Full natural-history arc.                          (≈12s)
       Sequential playback of A1→A8 as one continuous clip, no
       pauses between, for users who don't want to stitch.

  Z2 — Full intervention reversal.                        (≈9s)
       Sequential playback of B1→B6 as one continuous clip.

  Z3 — Stage-1 through lifted line.                       (≈21s)
       A1→A8 + B1→B6 as one continuous clip — the full thesis
       in one file.

────────────────────────────────────────────────────────────────────
ARCHITECTURE
────────────────────────────────────────────────────────────────────

  src/
    Root.tsx                    registers every composition
    lib/
      tokens.ts                 colors, motion curves, spacing
      fonts.ts                  Geist Sans + Mono loaders
      curves.ts                 the thesis curve shape functions
      paper.tsx                 the paper + dot-grid background
                                component, reused everywhere
    compositions/
      clip-a1-stage1-line.tsx
      clip-a2-stage1-caption.tsx
      ...
      clip-f4-paper-wipe.tsx
      composite-z1-natural-history.tsx
      composite-z2-intervention.tsx
      composite-z3-full-thesis.tsx

Keep hex literals OUT of the composition files — reference them from
`tokens.ts`. When the palette evolves (and it will), one edit
propagates.

Run `npm run studio` for live preview. Render all clips with a
single script `scripts/render-all.sh` that iterates over the Root
compositions and writes to `out/`:

  npx remotion render src/index.ts <compositionId> out/<compositionId>.mp4
  npx remotion still   src/index.ts <compositionId> out/<compositionId>-thumb.png --frame=30

────────────────────────────────────────────────────────────────────
DELIVERY PRIORITY
────────────────────────────────────────────────────────────────────

Ship in this order. Juan Manuel reviews after each batch and tells
you what to polish vs skip:

  Batch 1 (thesis spine — most important):
    A1, A2, A3, A4, A5, A6, A7, A8

  Batch 2 (intervention reversal):
    B1, B2, B3, B4, B5, B6

  Batch 3 (sanitary interpreter — pick 3, not all):
    C1, C2, C3

  Batch 4 (memory and trends):
    D1, D2, D3, D4

  Batch 5 (Bridge and three users):
    E1, E2, E3, E4, E5

  Batch 6 (atmosphere + close):
    F1, F2, F3, F4

  Composites ONLY if everything above is rendered:
    Z1, Z2, Z3

Stop after each batch, report file paths + any choreography change
you judged necessary, and wait for Juan Manuel's pick before
starting the next batch.

────────────────────────────────────────────────────────────────────
ANTI-PATTERNS
────────────────────────────────────────────────────────────────────

- No particle effects, glows, shimmers, lens flares.
- No zoom-ins on the curve. The composition is static; only the
  drawing moves.
- No labels appearing and disappearing in under 800ms — give text
  time.
- No music embedded in any MP4. Music is added in Loom post.
- No red anywhere except Stage 3 descent. Red is reserved.
- No stock medical b-roll. Everything is drawn in Remotion.
- No "AI" or "robot" iconography. The companion is a voice, not a
  face.
- No emoji.
- No corporate-blue / tech-gradient look. The product is clinical-
  warm, not SaaS-cold.

When everything renders cleanly, produce `out/INDEX.md` — one line
per clip with path, duration, and a one-sentence description, so
Juan Manuel can scan and pick for the edit without opening each MP4.
```

---

## Where this lives

`docs/process/video-hackathon-brief.md` in the Health Companion
repo. The `video-hackathon` session reads it from there, either by
Juan Manuel pasting the contents above or by that session running
`cat docs/process/video-hackathon-brief.md` after cloning the repo.

When this brief evolves (more clips, choreography changes), the
change lives here and the video session re-reads.
