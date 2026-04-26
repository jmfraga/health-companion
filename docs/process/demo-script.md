# Demo Script — Health Companion · 3-minute video (v4 · founder narrative)

> Cronometered narration for the Sunday submission recording.
> Presenter: Juan Manuel Fraga · Length: 3:00 hard cap · Language: English.
> Recording tool: Loom or QuickTime, one take ideal, two as insurance.
>
> **v4 (Sun 2026-04-26 morning)** — pivoted from Laura (synthetic patient)
> to the founder's own narrative. JM turned 50 on 2026-04-25, has rich
> family history (father MI at 40 + emphysema, mother lung cancer at 65,
> both parents diabetic), three concrete goals (smoother glucose curve,
> stable cholesterol, more muscle), and real labs in PDF. The product
> exists because *he* needs it. That story trumps any script we could
> invent.
>
> Backup of v3 (Laura) preserved at `demo-script-laura-v3.md.bak`.

---

## Pre-flight checklist (do BEFORE hitting record)

- [ ] Production URL loads cleanly on a fresh desktop browser window (no DevTools)
- [ ] `?demo=1` bypass active — chat empty, profile empty, timeline empty, biomarkers empty
- [ ] `bash scripts/demo-preflight.sh HC_API_URL=https://hc-companion-api.fly.dev` confirmed clean (resets state + seeds the LDL arc on `/trends` so the trends page isn't empty if a judge clicks through)
- [ ] **Real labs ready on desktop:** the year-old PDF + the January 2026 PDF (we'll drop the Jan 2026 one — the recent one). Optional: scale photo as a second-asset moment.
- [ ] Reasoning toggle is ON by default for new visitors — no manual flip needed (if you've ever turned it off on this browser, hit `/settings` and flip back ON)
- [ ] Audio check — one short sentence, play back, adjust mic
- [ ] Browser zoom 100 %, window ~1400×900
- [ ] Emergency pill visible bottom-left — DO NOT click during recording
- [ ] Camera bubble (if Loom): bottom-RIGHT, never bottom-left (covers EmergencyPill)

---

## 00:00 — 00:12 · Cold open (12 s)

Opening frame: empty chat, welcome card, four example chips.

> *"The health system today gets paid when you get sick. Nobody is paid
> to keep you well."*
>
> *"Eric Topol wrote that idea ten years ago. This is our answer —
> Health Companion."*

Camera on the empty chat, chips visible (Sleep · Longevity · Labs · Smartwatch), cursor in composer.

---

## 00:12 — 01:05 · Act 1 — Founder's first conversation (53 s)

### Turn 1 — meeting the companion (≈ 28 s)

Type into the composer (paced, naturally):

> **`Hi, I'm Juan Manuel. I just turned 50 yesterday. I'm watching my parents get older — Dad had a heart attack at 40 and another at 73, has emphysema; both my parents are diabetic; and Mom had lung cancer at 65. I want to age with health — keep traveling, keep building things, see my grandkids one day.`**

Press send. Narration while tools fire and text streams:

> *"This is me. Fifty yesterday, watching my parents age. The picture in
> the back of my mind is a heart attack at forty, a lung cancer at
> sixty-five, two parents I'd like to see for many more years. Watch
> what the companion does with that."*

Profile panel fills in live — name, age, longevity goal, the five family-history fields. Tool-trace card surfaces with all of them.

> *"It captures my family — not as a checklist, in my own words.
> 'First MI at age 40' as a string, not a checkbox. It holds the
> piece that matters most: my father's heart at forty is the line
> that reframes my own next decade."*

Let the response finish — it'll close with two warm questions (last doctor visit + smoking history). Don't answer them on screen; pivot to Turn 2.

### Turn 2 — what should I do? (≈ 25 s, plus model response running into Act 2)

Type into the composer:

> **`What should I do? As a physician I kind of know, but not really — I've been trained to treat sick people, not to help people stay healthy. What I'd love is a glucose curve that's smoother, cholesterol staying where it is, and more muscle as I age, not less.`**

Press send.

> *"And here's the honest piece. I'm a physician. I know how to treat
> sick people. Twenty years of practice didn't teach me how to keep a
> well person well — that's a different discipline. So I ask the
> companion the question I would ask a colleague who knows prevention
> better than I do."*

Wait for the response to start streaming. The model picks up the
register: *"Doctor to doctor — here's how I'd think about it"* and
breaks into three sections that match the three goals.

> *"Look at this — three sections, one per goal I named. Glucose:
> behavioral levers and what to measure, including a CGM trial because
> I literally said 'glucose curve.' Lipids: my dad's heart at forty
> reshapes the calculus, so Lp(a) — a blood fat that's largely
> inherited — and a CAC score, the scan that sees calcium in the heart
> arteries before symptoms do. Muscle: progressive resistance training,
> protein, a DEXA baseline. Cited inline. None of these are a
> prescription. All of them are the conversation."*

The response will end with two questions: *"do you have anything
recent — labs?"* and *"what does your training look like?"*

That cue is the Act 1 → Act 2 hand-off. **Don't answer the training
question yet — answer the labs question by uploading.**

---

## 01:05 — 02:25 · Act 2 — The labs and the proactive (80 s)

### Drop the real labs (≈ 35 s)

Drag the **January 2026 PDF** into the LabDropZone on the right.

> *"I just got asked for labs. So I drop the labs I actually have —
> mine, from January, real numbers, not a fixture."*

LabDropZone animates the four reading phases (opening · extracting ·
cross-referencing · drafting). Wait for the WorthAConversationCard.

> *"Opus reads the PDF directly — no OCR layer in between. It pulls the
> values, cross-references them against the family history I just told
> it about, and surfaces what's worth the next conversation with my
> doctor."*

When the analysis card lands, narrate around what's actually on screen.
**Adapt to the real findings**:

- If the cholesterol panel is fine: *"Cholesterol is in range — but
  with my dad's MI at forty, the standard panel isn't the whole story.
  Watch what it adds."*
- If LDL/cholesterol is borderline or above: *"My LDL is above
  optimal. The companion frames it as a conversation, not a verdict.
  And it doesn't stop there — given my dad, it adds Lp(a) and the CAC
  conversation that the standard panel misses."*
- **Almost certainly** the companion will recommend an HbA1c — your
  labs don't have it, both parents are diabetic. *"And here it surfaces
  the test I haven't ordered for myself — the three-month average blood
  sugar that, given both my parents are diabetic, is the obvious one to
  put on the calendar."*

Click **See reasoning** on the schedule card or analysis. ReasoningSheet opens.

> *"And the reasoning is exposed. Not buried in a Terms of Service —
> visible. NCCN-style: ten years before the relative's diagnosis,
> not before age thirty. ACC/AHA 2018 framing for CAC. NLA 2019 for
> Lp(a). Cited bodies you can look up. The product does its work in
> the open."*

Close the sheet.

### Three months later (≈ 25 s)

Click **Simulate: 3 months later** in the header.

> *"Three months pass."*

MonthsLaterFade runs. ProactiveLetter renders.

> *"And the companion reaches out. Not because I asked — because it's
> been keeping count. It references things I told it on day one: my
> goal of a smoother glucose curve, the cholesterol I wanted to hold,
> the muscle I want to keep building as I get older. It mentions my
> family — my dad, my mom — by what I told it, not by data we don't
> have."*

> *"This is the moat every other health product doesn't have. Not
> search. Not a symptom checker. A relationship that compounds — that
> remembers what you said, in your words, and surfaces it when it
> matters."*

### A quick visit to /trends (≈ 20 s)

Navigate to `/trends`.

> *"And when I look at trends, I see the line. The companion seeds a
> demo arc here so judges aren't staring at an empty page — six points
> over six months, with a setback in the middle when travel broke the
> routine. Real change is not linear. The companion has a voice for
> the setback, not just the win."*

---

## 02:25 — 02:45 · The Bridge — what's next (20 s)

Navigate to `/bridge`.

> *"This is the next surface — The Bridge. Same companion, different
> view. The clinician sees every patient between visits: goals, trends,
> flags. The note the doctor writes in clinical language gets
> auto-translated into what the patient actually reads. White-label —
> every clinic brands their own."*

> *"One product. Two surfaces. The companion does the between-visits
> work the clinician cannot. The clinician does the in-visit work the
> companion must not."*

The amber preview-only banner is visible at the top — you don't need
to narrate it; it's clear at a glance.

---

## 02:45 — 03:00 · Close (15 s)

Cut back to the chat, or stay on the Bridge.

> *"Built in five nights with Opus 4.7 and a coordinated team of Claude
> Code subagents. Open source, Apache 2.0, every guideline cited
> inline. I built it because, sitting in front of fifty, I wanted it
> for myself. Health Companion."*

Fade to card: logo + tagline + repo URL.

---

## Fallback beats (if something breaks mid-recording)

- **Lab upload errors.** *"That's the Fly machine breathing — let me
  show you what the companion already has from earlier conversations."*
  Pivot straight to Simulate; the proactive carries the memory moat
  even without the lab.
- **Simulate button errors.** Refresh; demo-preflight reset; restart
  from Act 2 lab drop. The state survives the refresh.
- **Companion asks a clarifying question instead of recommending.**
  *"And — see — it doesn't jump. It asks where I'm starting from.
  That's the discipline."* Then continue with the lab drop or move on.
- **`/bridge` doesn't load.** Skip Bridge segment; extend close with
  *"the next surface is the clinician's — same companion, white-label
  Bridge dashboard goes live in Phase 2."*
- **Voice falters / visible flub.** Stop, breathe, restart from the
  most recent natural pause (the start of the next Act).

## Voice notes

- Slow down at *"Watching my parents age"* — let the room feel that
  beat. It's the founder's hook.
- Slow down at *"Doctor to doctor — but I still pass the plain-language
  translations through, because that's the discipline."* — the
  product's voice surfacing inside the product itself.
- Do NOT rush the See reasoning walkthrough — it's the demo's
  clinical-integrity proof.
- The close is the most personal moment in the whole take. *"I built
  it because, sitting in front of fifty, I wanted it for myself."*
  Don't read it — say it.

## Shot list / screenshots to grab during recording

- Empty chat with welcome card + four chips — opener still
- Profile panel mid-fill after Turn 1 — five family-history fields visible
- Turn 2 response with "Doctor to doctor" and three goal-aligned sections — physician-level material on screen
- LabDropZone mid-reading with four phases animating — Act 2 opening
- ScheduleCard with HbA1c, Lp(a), CAC discussion — the moment the missing test surfaces
- ReasoningSheet expanded with NCCN / ACC-AHA / NLA citations — proof of craft
- ProactiveLetter — pill-tags referencing day-one goals
- The Bridge patient-list view with white-label placeholder — Phase-2 vision

---

*v4 · 2026-04-26 morning · Founder narrative replaces Laura. Practice
run captured at `expected-takes-jm.md` — read that before recording
to know what the model is most likely to surface.*
