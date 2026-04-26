# Recording cheat-sheet — copy-paste during the take

> One-page reference for the Loom. Read demo-script.md once before;
> open this on a second monitor or print, glance at it during the
> take. Two turns to type, key narration cues, lab + simulate
> moments — that's it.

---

## Turn 1 (type into composer, paced):

```
Hi, I'm Juan Manuel. I just turned 50 yesterday. I'm watching my parents get older — Dad had a heart attack at 40 and another at 73, has emphysema; both my parents are diabetic; and Mom had lung cancer at 65. I want to age with health — keep traveling, keep building things, see my grandkids one day.
```

**While the model thinks / streams:**
- *"This is me. Fifty yesterday, watching my parents age."*
- *"It captures my family — not as a checklist, in my own words. 'First MI at age 40' as a string, not a checkbox."*
- *"It holds the piece that matters most: my father's heart at forty is the line that reframes my own next decade."*

The model will close with two questions (last doctor visit + smoking). Don't answer on screen — pivot to Turn 2.

---

## Turn 2 (type into composer):

```
What should I do? As a physician I kind of know, but not really — I've been trained to treat sick people, not to help people stay healthy. What I'd love is a glucose curve that's smoother, cholesterol staying where it is, and more muscle as I age, not less.
```

**While the model thinks / streams:**
- *"And here's the honest piece. I'm a physician. I know how to treat sick people. Twenty years of practice didn't teach me how to keep a well person well."*
- Wait for *"Doctor to doctor"* opening to land.
- *"Three sections, one per goal. Glucose: behavioral levers and what to measure, including a CGM trial because I literally said 'glucose curve.'"*
- *"Lipids: my dad's heart at forty reshapes the calculus. Lp(a) — a blood fat that's largely inherited. CAC score, the scan that sees calcium in the heart arteries before symptoms do."*
- *"Muscle: progressive resistance training, protein, a DEXA baseline."*
- *"Cited inline. None of these are a prescription. All of them are the conversation."*

The model will end asking for labs + training history. **That's the cue → drag your January 2026 lab PDF into the LabDropZone.**

---

## Lab upload moment

After dropping the PDF:

- *"I just got asked for labs. So I drop the labs I actually have — mine, from January, real numbers, not a fixture."*
- *"Opus reads the PDF directly — no OCR layer in between. It pulls the values, cross-references them against the family history I just told it about, and surfaces what's worth the next conversation with my doctor."*

**Adapt narration to what the card shows:**

If LDL is borderline/above:
- *"My LDL is above optimal. The companion frames it as a conversation, not a verdict. And given my dad, it adds Lp(a) and the CAC conversation that the standard panel misses."*

**Almost certainly the companion will recommend HbA1c (it's not in your labs):**
- *"And here it surfaces the test I haven't ordered for myself — the three-month average blood sugar that, given both my parents are diabetic, is the obvious one to put on the calendar."*

Click **"See reasoning"** on the schedule card. Sheet opens:
- *"And the reasoning is exposed. Not buried in a Terms of Service — visible. NCCN-style. ACC/AHA 2018 for CAC. NLA 2019 for Lp(a). Cited bodies you can look up."*

Close the sheet.

---

## Three months later

Click **Simulate: 3 months later** in the header.

- *"Three months pass."*

ProactiveLetter renders:

- *"The companion reaches out. Not because I asked — because it's been keeping count."*
- *"It references things I told it on day one: my goal of a smoother glucose curve, the cholesterol I wanted to hold, the muscle I want to keep building as I get older. It mentions my family — my dad, my mom — by what I told it, not by data we don't have."*
- *"This is the moat every other health product doesn't have. Not search. Not a symptom checker. A relationship that compounds."*

---

## Trends visit

Navigate to `/trends`:

- *"And when I look at trends, I see the line. Six points over six months, with a setback in the middle when travel broke the routine. Real change is not linear. The companion has a voice for the setback, not just the win."*

---

## Bridge visit (≤ 20 s)

Navigate to `/bridge`:

- *"This is the next surface — The Bridge. Same companion, different view. The clinician sees every patient between visits. The note in clinical language gets auto-translated into what the patient actually reads. White-label — every clinic brands their own."*
- *"One product. Two surfaces. The companion does the between-visits work the clinician cannot. The clinician does the in-visit work the companion must not."*

---

## Close (15 s)

Cut back to chat, or stay on Bridge:

- *"Most health products live around the visit — before it, after it, instead of it. This one lives between visits, in the years when nothing is happening yet — the years that decide everything. Built in five nights with Opus 4.7. Open source, Apache 2.0. I built it because, sitting in front of fifty, I wanted it for myself. Health Companion."*

Fade to repo URL card.

---

## If something breaks

- **Lab upload error:** *"That's the Fly machine breathing — let me show you what the companion already has."* → Skip to Simulate.
- **Simulate error:** Refresh, demo-preflight reset, restart from Act 2.
- **Companion asks question instead of scheduling:** *"And — see — it doesn't jump. It asks where I'm starting from. That's the discipline."*
- **Bridge doesn't load:** Skip; extend close with *"the next surface is the clinician's — Bridge dashboard goes live in Phase 2."*

---

## What you keep in mind

- Slow down at *"watching my parents age"* — that's your hook.
- Slow down at *"sitting in front of fifty, I wanted it for myself."*
- Don't rush See reasoning — it's the proof.
- This is YOUR story. Speak it like it is. The product exists because you wanted it.
