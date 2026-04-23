# Health Companion — design handoff for Claude Code

> Forward this bundle to Claude Code as the spec for a PR against `jmfraga/health-companion`.
> Prototype file: `Health Companion.html`. Tokens in `tokens.js`. Screens in `screen-*.jsx`.

## What's in this bundle

| File | Purpose |
|---|---|
| `Health Companion.html` | Live prototype. 5 screens × iOS/Android + design-system page on one canvas. |
| `tokens.js` | Design tokens — palette (per theme), accent hues, type, spacing, radius, motion. |
| `ui.jsx` | Shared primitives: `Button`, `Card`, `Chip`, `AppBar`, `TabBar`, icons, `useHC()`. |
| `screen-chat.jsx` | Hybrid chat surface (bubbles + structured cards + tool-use trace). |
| `screen-lab.jsx` | Lab upload moment with Opus reading the PDF multimodally. |
| `screen-timeline.jsx` | Clinical-journal timeline with `lab_report` expanded inline. |
| `screen-proactive.jsx` | Three-months-later letter + `ScreenReasoning` disclosure. |
| `screen-ds.jsx` | One-pager design system tile. |

## The decisions worth defending in code review

1. **Semantic palette is a contract, not decoration.**
   - accent (emerald/teal/moss) → companion, plan, agreement
   - amber → proactive / memory-surfacing / "let's talk about this"
   - blue → labs, sensors, objective data
   - red → **reserved for critical/emergency only** — never for mild warnings
2. **Geist Sans for prose, Geist Mono for data.** Lab values, timestamps, dates, tool-call args are all mono. This is how the user learns to spot what's objective.
3. **The companion writes in prose, Laura writes in bubbles.** Asymmetric by design — the companion is not a peer chatting back, it's a voice keeping a record.
4. **Memory is visible.** Tool-use trace stays in-thread (not hidden behind a panel). Timeline pill-tags carry the same language the companion used when it first heard the fact.
5. **"See reasoning" is an FDA-wellness safety mechanism**, not a flourish. Keep it. Sources must be named.

## Four screens → components to build

### 1. Chat / meeting Laura (`apps/web/src/components/chat/`)
- `ChatPane` wraps the scrollable thread + composer
- `CompanionProse` (left-aligned prose + heart-avatar + name label)
- `LauraBubble` (right-aligned, accent-filled)
- `ToolTrace` (mono-styled list of `save_profile_field` / `fetch_*` calls with active/done states — streams in via SSE)
- `ScheduleCard` (structured card: 3 screening rows + "See reasoning" link + Later/Add-to-plan actions)
- Composer with paperclip + send — send-button uses accent/600

### 2. Lab upload (`apps/web/src/components/labs/`)
- Extend existing `LabDropZone.tsx` with a `ReadingState` phase that animates the four steps below
- Steps (streamed from backend as SSE events):
  1. `opening_pdf` — "Opening the PDF multimodally · Opus 4.7 · vision"
  2. `extracting_values` — "Extracting values · 14 biomarkers · high confidence"
  3. `cross_referencing` — "Cross-referencing your profile · maternal breast cancer · age 44"
  4. `drafting_response` — "Drafting what to say · writing…"
- `WorthAConversationCard` (amber tone) — surfaced before the full table when any biomarker is borderline

### 3. Timeline with lab_report expanded (`apps/web/src/components/timeline/HealthTimeline.tsx`)
- Existing file is correct in structure; replace the inline-accordion lab render with the **full inline expansion** shown in the prototype (panel summary → biomarker list with mono values → "For your next doctor visit" amber block at the bottom)
- Keep the source-semantic dot colors already in the component (blue/emerald/amber/zinc)
- The **"What I remember" legend** at the top of the timeline is new — add it above the rail

### 4. Proactive landing (`apps/web/src/components/proactive/`)
- `ProactiveLetter` — replaces the current card when `months_later >= 3`. Full-height letter layout with:
  - display/34/600 greeting ("Good morning, Laura.")
  - 2–3 body paragraphs in 16/1.6 with muted third paragraph
  - "What I'm holding onto" card (amber) — pill-tags rendered via existing `humanizeContextRef`
  - primary action ("Hold a mammography slot") at lg size, full-width
  - secondary + ghost actions stacked
  - "While we were quiet" recap block at the bottom — 3 mini-rows with colored dots
- Keep `ProactiveMessageCard` for the shorter in-timeline form

### 5. See-reasoning disclosure (new: `apps/web/src/components/common/ReasoningSheet.tsx`)
- Opens as an iOS-style sheet from any card with a "See reasoning" link
- Four blocks: `Thinking` (mono), `What I'm proposing` (prose), `Sources` (blue tone), `I'm not a doctor` (amber disclaimer)

## Tokens — lift into `globals.css`

The prototype extends (not replaces) the existing shadcn zinc palette. Add these semantic tokens to `@theme`:

```css
--color-amber-bg: <see tokens.js light.amberBg>
--color-amber-border: ...
--color-amber-fg: ...
--color-blue-bg: ...  /* for lab tone */
--color-blue-border: ...
--color-blue-fg: ...
```

Accent is theme-switchable. Expose an `--accent-*` scale and let the user pick emerald/teal/moss in Settings. Default is emerald.

Motion tokens:
```
--motion-fast:   150ms cubic-bezier(.4,0,.2,1)
--motion-base:   240ms cubic-bezier(.4,0,.2,1)
--motion-slow:   420ms cubic-bezier(.22,.61,.36,1)
--motion-settle: 720ms cubic-bezier(.22,.61,.36,1)   /* the three-months-later fade */
```

## Voice rules (copy these into `prompts/main.md`)

**Do**
- Name what Laura said, in her words, before moving on.
- Use her name early.
- Educate → contextualize → refer. Always in that order.
- Make memory visible ("Remember what we talked about…").
- Say "I" and "we." The companion is a voice, not a system.

**Don't**
- Diagnose or prescribe. Ever.
- Use bare numbers without framing.
- Gamify ("Great job! 🎉"). No emoji.
- Break the companion voice ("As an AI…"). If unsure, refer to the doctor.
- Use red except for critical/emergency states.

## Open questions for Dr. Fraga

1. Is the **NCCN "10-years-earlier" reasoning** in the See-reasoning disclosure phrased correctly for the demo? We cite it explicitly — verify the exact guideline version before shipping.
2. The lab screen surfaces one amber finding (fasting glucose 118) before the full table. Do you want **trend** context from the demo fixture here, or is April 22 the first lab on record?
3. Three-months-later moment shows glucose dropping 118 → 108. Is that realistic for a 3-month walking-plan intervention, or do we soften to 118 → 112?

## What to ignore

- The `Tweaks` UI in the prototype is for design review only. Don't port it — the real app settings live in the "You" tab.
- The side-by-side iOS/Android rendering is a review affordance. Both frames render the same React tree; no platform forking is needed.
- The `design-canvas` is just the presentation shell.
