# Demo Script — Health Companion · 3-minute video

> Cronometered narration for the Sunday submission recording.
> Presenter: Juan Manuel Fraga · Length: 3:00 hard cap · Language: English.
> Recording tool: Loom, one take ideal, two as insurance.

---

## Pre-flight checklist (do BEFORE hitting record)

- [ ] `http://100.72.169.113:3000` loads cleanly on a fresh desktop browser window (no DevTools open)
- [ ] Logged in as demo user; chat transcript is empty; profile panel empty; timeline empty
- [ ] Backend and frontend dev servers are running (ports 8000 and 3000)
- [ ] Anonymized lab PDF is in a known path on the desktop
- [ ] Audio check — one short sentence, play back, adjust mic if needed
- [ ] Browser zoom at 100 %, window at ~1400×900
- [ ] Emergency pill visible bottom-left — DO NOT click during the recording

---

## 00:00 — 00:15 · Cold open (15 s)

Opening frame: the empty chat.

> *"The health system today gets paid when you get sick. Every hospital, every clinic, every pharmacy runs on the engine of illness. Nobody is paid to keep you well."*
>
> *"Eric Topol wrote this idea in 2015. Ten years later, the tools to invert it exist. We call this one Health Companion."*

Camera stays on the clean chat, composer visible. No movement.

---

## 00:15 — 01:00 · Act 1 — Meeting Laura (45 s)

Type into the composer, naturally paced:

> **`I'm 44. My mom died of breast cancer at 52.`**

Press send. Narration while the UI animates:

> *"This is Laura. She is new here."*
>
> *"Watch what happens as she talks. The companion reads her words, takes her history down — profile panel, on the right, filling in as the tool calls land — and starts thinking."*

Wait for the companion's prose reply + ScheduleCard to render. Narration:

> *"What comes back is not a list. It is a schedule — three screenings the companion proposes because it already knows what matters here. Mammography next month. Earlier than the typical guideline — because Laura's mother."*

Click **See reasoning** on the ScheduleCard. ReasoningSheet opens.

> *"And because this is health, Laura can see the reasoning. USPSTF, biennial from 40. NCCN, ten years before the first-degree relative's diagnosis, or 40, whichever is later. Fifty-two minus ten is forty-two. Laura is forty-four. She is already inside the window."*
>
> *"No diagnosis. No prescription. Education, contextualization, referral to her doctor. The clinical voice is authored and reviewed by a practicing physician. Who, by the way, is me."*

Close the ReasoningSheet.

---

## 01:00 — 01:55 · Act 2 — Labs and proactivity (55 s)

Drop the anonymized PDF into the drop-zone (or click Upload labs on mobile).

> *"Laura uploads her lab report. Opus 4.7 reads the PDF directly — no OCR library in between — and you can watch it work: opening the PDF, extracting values, cross-referencing against her profile, drafting what to say."*

Reading state animates four steps. WorthAConversationCard surfaces with the glucose finding:

> *"Fasting glucose at 118. WHO calls 100 to 125 prediabetes. Not diabetes, not a verdict — a category that usually responds to how you eat and move. The companion says so. In her language. Without alarm."*

Click the **Simulate: 3 months later** button in the header. MonthsLaterFade runs.

> *"Three months pass."*

ProactiveLetter renders with the greeting and pill-tags:

> *"The companion reaches out. Not because Laura asked. Because it has been keeping count. It references the conversation about her mother from day one. It remembers she turns 45 next month. It recalls the mammography they agreed on, and it shows Laura what it has been holding onto — the tags on the amber card are exactly the things they talked about the first day."*
>
> *"This is the moat every other health product does not have. Not search. Not a symptom checker. A relationship that compounds."*

---

## 01:55 — 02:30 · The meta — how we built it (35 s)

Brief pan to a second browser window showing the repo, or stay on the app.

> *"We built this using the same pattern the product needs. A coordinator agent works with specialists — frontend, backend, clinical voice. I am the fifth agent — the primary-care physician whose practice this is trying to scale. We learned to build health-as-a-team by building it as a team."*
>
> *"Everything is open source. Apache 2.0. The clinical voice, the privacy posture, the reasoning audit layer — all in the repo. The bundle Claude Design delivered is in `docs/references/design`. Every preventive recommendation cites the guideline inline."*

---

## 02:30 — 03:00 · Close — the ambition (30 s)

Return to the chat with the accumulated state visible.

> *"This is version zero-point-one. We built it in five nights. The demo you just saw is two acts of a product whose final shape covers every pillar of wellness, in every language, for every context — high-resource and low. The next surface is the clinician's: same product, a dashboard where doctors see their patients' goals between visits, write notes that the companion translates for the patient, prescribe screenings that land on the patient's phone as the next step they already agreed to."*
>
> *"One product, two surfaces. A warm companion in the patient's pocket. A structured record on the clinician's desk. The companion does the between-visits work the clinician cannot. The clinician does the in-visit work the companion must not."*
>
> *"Built with Opus 4.7."*

Fade to card: logo + tagline + repo URL.

---

## Fallback beats (if something breaks mid-recording)

- Lab upload fails → pivot straight to the Simulate button; the Act 2 proactive still carries the memory moat.
- Simulate button errors → re-run the endpoint manually via a second terminal; narrate through the silence briefly, keep the take.
- Auth drops → sign back in, skip Act 1, go straight to Act 2 if the timeline already has state.

## Voice notes

- Slow down at "One product, two surfaces" — let that line breathe.
- Do not rush the reasoning walkthrough; it is the demo's clinical-integrity proof.
- Smile once, when the proactive card drops — the warmth lands because you feel it.

## Shot list / screenshots to grab during recording

- Empty chat with composer pill — opener still
- ScheduleCard with three screenings rendered — Act 1 close
- ReasoningSheet expanded — proof of craft
- LabDropZone mid-reading with 4 steps animating — Act 2 opening
- ProactiveLetter with pill-tags — the moat moment
- Timeline expanded on a lab_report — for the submission description and the README cover

---

*Draft v1, Apr 23 morning. Revise after first take-through before recording on Saturday.*
