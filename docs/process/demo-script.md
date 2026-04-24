# Demo Script — Health Companion · 3-minute video

> Cronometered narration for the Sunday submission recording.
> Presenter: Juan Manuel Fraga · Length: 3:00 hard cap · Language: English.
> Recording tool: Loom, one take ideal, two as insurance.
>
> **v2 (Apr 23 night)** — Act 1 is now two turns, not one. A clinician
> does not open a first conversation by prescribing a mammography; the
> product should not either. Turn 1 is rapport and listening; turn 2 is
> where the concrete proposal lands, anchored in what the patient
> actually asked for.

---

## Pre-flight checklist (do BEFORE hitting record)

- [ ] Production URL loads cleanly on a fresh desktop browser window (no DevTools open)
- [ ] `?demo=1` bypass active (or signed in as demo user); chat transcript empty; profile panel empty; timeline empty; biomarker store empty
- [ ] `POST /api/demo/reset` confirmed 200 from a second terminal so there's zero residue
- [ ] Synthetic demo PDF (`fixtures/labs-laura-demo.pdf`) is on the desktop at a known path
- [ ] `POST /api/trends/seed-demo` confirmed 200 so `/trends` has the LDL ups-and-downs arc loaded
- [ ] `/settings` → **Show reasoning** toggle ON (otherwise the "See reasoning" button is hidden)
- [ ] Audio check — one short sentence, play back, adjust mic if needed
- [ ] Browser zoom at 100 %, window at ~1400×900
- [ ] Emergency pill visible bottom-left — DO NOT click during the recording

---

## 00:00 — 00:12 · Cold open (12 s)

Opening frame: the empty chat with the welcome card and the three example chips.

> *"The health system today gets paid when you get sick. Nobody is paid
> to keep you well."*
>
> *"Eric Topol wrote that idea ten years ago. This is our answer —
> Health Companion."*

Camera on the empty chat, chips visible, cursor in composer.

---

## 00:12 — 01:30 · Act 1 — Meeting Laura, in two turns (78 s)

### Turn 1 — rapport and listening (≈ 38 s)

Type into the composer, naturally paced:

> **`Hi, I'm Laura. I'm 44. My mom died of breast cancer at 52.`**

Press send. Narration while the UI animates:

> *"This is Laura. She is new here. She has just shared something heavy.
> Watch what happens."*

Wait for tool-use events to stream. Profile panel fills in live on the right.

> *"The profile panel, on the right, fills in as the companion hears.
> Name. Age. Family history — her words, not a form."*
>
> *"And what comes back is not a schedule. It is what a good doctor does
> first. The companion names her loss. It asks what's on her mind. It
> doesn't prescribe anything — she hasn't asked for anything yet."*

Let the full reply finish streaming. Do NOT click See reasoning here.

### Turn 2 — the proposal, when she asks for it (≈ 40 s)

Type into the composer:

> **`I want to understand my own risk. What should I actually be doing?`**

Press send.

> *"Now she asks. And now — because she asked — the companion answers."*

Wait for the ScheduleCard to render.

> *"What comes back is a schedule — mammography, earlier than the
> typical guideline. Not because the companion jumped to it, but because
> Laura's mother. This is the sequence a practicing physician uses every
> day: establish rapport, understand the fear, then propose."*

Click **See reasoning** on the ScheduleCard. ReasoningSheet opens.

> *"And Laura can see the reasoning. USPSTF, biennial from 40. NCCN, ten
> years before the first-degree relative's diagnosis, or 40, whichever
> is later. Fifty-two minus ten is forty-two. Laura is forty-four. She
> is already inside the window."*
>
> *"No diagnosis. No prescription. Education, contextualization,
> referral to her doctor. The clinical voice is authored and audited by
> a practicing physician. Who, by the way, is me."*

Close the ReasoningSheet.

---

## 01:30 — 02:25 · Act 2 — Labs and proactivity (55 s)

Drop the synthetic demo PDF into the drop-zone
(`fixtures/labs-laura-demo.pdf`).

> *"Laura uploads her lab report. Opus 4.7 reads the PDF directly — no
> OCR layer in between — and you can watch it work: opening the PDF,
> extracting values, cross-referencing against her profile, drafting
> what to say."*

Reading state animates four steps. WorthAConversationCard surfaces with
the worth-a-conversation findings.

> *"Three things worth talking about. Fasting glucose at 118 — right at
> the edge the ADA calls prediabetes, the range that usually responds
> to how you eat and move. LDL cholesterol at 136 — above optimal, not
> alarming. Total cholesterol at 223 — the same story. HDL is
> protective at 70. None of it a verdict. All of it a conversation for
> her doctor. The companion says so. In her language. Without alarm."*

Click the **Simulate: 3 months later** button in the header.
MonthsLaterFade runs.

> *"Three months pass."*

ProactiveLetter renders with the greeting and pill-tags.

> *"The companion reaches out. Not because Laura asked. Because it has
> been keeping count. It references the conversation about her mother
> from day one. It remembers she turns 45 next month. It recalls the
> mammography they agreed on, and it shows Laura exactly what it has
> been holding onto — the pill-tags on the amber card are the things
> they talked about the first day."*
>
> *"This is the moat every other health product does not have. Not
> search. Not a symptom checker. A relationship that compounds."*

Navigate briefly to `/trends`.

> *"And when Laura looks at her own trend line, the story is not a
> straight march downward. LDL went from 136 to 128 to a setback at
> 141 when travel broke the routine, back to 132 at the three-month
> lab, and down to 112 by month six. Real change isn't linear — and
> the companion has a voice for the setbacks, not just the wins."*

---

## 02:25 — 02:45 · The Bridge — what's next (20 s)

Navigate to `/bridge`.

> *"This is the next surface — The Bridge. Same product, different
> view. The clinician sees every patient between visits: goals, trends,
> flags. The note the doctor writes in clinical language gets
> auto-translated into what the patient actually reads. And it is
> white-label — every clinic brands their own."*
>
> *"One product. Two surfaces. The companion does the between-visits
> work the clinician cannot. The clinician does the in-visit work the
> companion must not."*

---

## 02:45 — 03:00 · Close (15 s)

Cut back to the chat or stay on the Bridge.

> *"Version zero-point-one. Built in five nights with Opus 4.7 —
> coordinator and specialists, the same pattern the product uses. Open
> source, Apache 2.0, every guideline cited inline. Health Companion."*

Fade to card: logo + tagline + repo URL.

---

## Fallback beats (if something breaks mid-recording)

- **Turn 2 doesn't produce a ScheduleCard.** Narrate around it: *"the
  companion invited a follow-up conversation — it is being careful
  about what we haven't confirmed yet, which is exactly the point."*
  Then pivot straight to Act 2.
- **Lab upload fails.** Pivot straight to the Simulate button; the Act
  2 proactive still carries the memory moat.
- **Simulate button errors.** Re-run the endpoint manually via a second
  terminal; narrate through the silence briefly, keep the take.
- **Auth drops** (should not happen with the `?demo=1` bypass). Append
  `?demo=1` to the URL and reload; skip Act 1, go to Act 2 if state
  already exists.
- **Bridge doesn't load.** Skip the Bridge segment; extend the close
  with *"the next surface is the clinician's — same product, a Bridge
  dashboard that goes live in Phase 2, white-label for every clinic."*

## Voice notes

- Slow down when the companion asks *"what's on your mind?"* — it's
  the rapport moment. The juez should feel the pause.
- Slow down at *"One product. Two surfaces."* — let that line breathe.
- Do not rush the reasoning walkthrough; it is the demo's clinical-
  integrity proof.
- Smile once, when the proactive card drops — the warmth lands because
  you feel it.

## Shot list / screenshots to grab during recording

- Empty chat with welcome card + 3 example chips — opener still
- Profile panel mid-fill after Turn 1 — "humanized, not JSON"
- ScheduleCard with the mammography entry rendered — Act 1 close
- ReasoningSheet expanded with the guideline citations — proof of craft
- LabDropZone mid-reading with 4 steps animating — Act 2 opening
- ProactiveLetter with pill-tags — the moat moment
- The Bridge patient-list view with a white-label placeholder —
  category-defining shot

---

*Draft v3, Apr 24 morning — Act 2 now narrates multiple findings from
the synthetic demo lab (glucose 118, LDL 136, cholesterol 223, HDL 70
protective), and the Act-2 close visits `/trends` to narrate the
six-month LDL arc with a setback in the middle. Revise after Saturday
AM run-through.*
