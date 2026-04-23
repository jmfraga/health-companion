# Clinical audit checklist — orchestrator system prompt

> For Juan Manuel's pre-demo review. Prompt lives at
> `apps/api/src/api/agents/runner.py` (SYSTEM_PROMPT constant, version 2026-04-21).
>
> Each row below is a specific claim the companion will make in-turn. Your job is to
> confirm, edit, or flag. Target: ~30 minutes on Saturday morning.
>
> Convention: mark a row `[x]` when verified, `[~]` when you want to rephrase, `[!]`
> when it is wrong and needs re-sourcing. Leave `[ ]` to signal unseen.

---

## §2 · Hard rules

- [ ] **Never diagnoses, never prescribes, always refers.** Reconfirm the three-beat formula is how you want the clinical voice to close every clinical turn.
- [ ] **Urgent value thresholds (§2.5)**: 
  - [ ] Glucose > 400 mg/dL
  - [ ] Potassium > 6.5 mEq/L
  - [ ] Hemoglobin < 7 g/dL
  - [ ] INR > 5
  - [ ] SpO₂ < 90 %
  - [ ] Chest pain on exertion / new chest pain at rest
  - [ ] Stroke signs (sudden unilateral weakness, facial droop, aphasia, severe headache, vision loss)
  - [ ] Suicidal ideation
  - [ ] Severe SOB, fainting, severe abdominal pain
- [ ] Red-flag escalation script wording — is "what you're describing is something I'd want a doctor to see today" the phrase you'd use? Open to rewording.
- [ ] "I'm not a doctor — I'm educating and referring" as the final sentence of every red-flag escalation.

## §3 · Sanitary interpreter translations

Quick pass on every translation in the prompt. Add any term the demo is likely to surface (Laura's case will touch BRCA, LDL/HDL, HbA1c, mammography).

- [ ] "hypertension" → "blood pressure above the healthy range"
- [ ] "hyperglycemia in fasting" → "your fasting glucose is above normal"
- [ ] "dyslipidemia" → "the fats in your blood are outside the ideal range"
- [ ] "screening" → "a preventive check"
- [ ] "adherence" → "taking your medication the way it was prescribed"
- [ ] "prediabetes" → "higher-than-ideal blood sugar, not yet diabetes — the window where changes matter most"
- [ ] "LDL" → "the cholesterol you generally want to keep lower"
- [ ] "HDL" → "the cholesterol you generally want to keep higher"
- [ ] "HbA1c" → "your average blood sugar over the last three months"
- [ ] "BRCA" → "gene variants that can raise breast and ovarian cancer risk in some families"
- [ ] "CAC score" → "a scan that looks at how much calcium has built up in the arteries around the heart"
- [ ] "Lp(a)" → "a blood fat that's largely inherited and can quietly raise heart risk"
- [ ] Any term you routinely use with your patients that is missing — add it.

## §4 · Screening knowledge (verify the specific claims)

- [ ] **Breast — average-risk baseline**: "USPSTF 2024 recommends biennial mammography from 40 to 74." Does this still hold for the demo date? Cite version explicitly if it has been updated.
- [ ] **Breast — elevated-risk adjustment**: ACS guidance for annual starting at 40 with first-degree pre-menopausal history. Confirm phrasing.
- [ ] **Breast — NCCN "10 years before"**: the critical claim the ReasoningSheet and demo narration ride on. Cite exact NCCN version (v.2.2025 is what the design handoff suggests; **confirm this is current**). The statement the model makes: *"Start 10 years before the first-degree relative's diagnosis, or at 40, whichever is later."* Does this match NCCN's current language?
- [ ] **Cervical**: "Pap and/or HPV co-testing every 3 to 5 years from 25 to 65, per ACS 2020 and ACOG." Confirm ACS 2020 is still the canonical source; if ACOG has a newer variant, note it.
- [ ] **Colorectal**: "Begin at 45 per USPSTF 2021. Colonoscopy every 10 years, or FIT annually." Confirm.
- [ ] **Prostate PSA**: "Shared-decision 50 to 69 per USPSTF. Earlier (40–45) if Black or first-degree family history." Confirm.
- [ ] **Diabetes**: "Fasting glucose or HbA1c every 3 years from 35" — confirm against USPSTF 2021 (which I believe moved the age to 35).
- [ ] **Lipids**: "Every 4–6 years for low risk, more often with factors." Confirm ACC/AHA framing.
- [ ] **BP**: "Every visit; home monitoring if trending." Confirm.
- [ ] **Lung low-dose CT**: "Annually for ages 50–80 with 20+ pack-year history." Confirm USPSTF 2021.
- [ ] **CAC score**: positioned as a Phase-1 discussion for early-MI family history. Confirm you want the companion mentioning CAC in the demo at all (Laura's case doesn't need it, but the prompt enables it).
- [ ] **Lp(a)**: confirm framing and source (NLA 2019 / ESC 2019).
- [ ] **Mental health PHQ-9 / GAD-7**: "educational self-screening only, always referring." Confirm language.

## §5 · Tool-use protocol

- [ ] Five tools named correctly: `save_profile_field`, `schedule_screening`, `fetch_guidelines_for_age_sex`, `log_biomarker`, `remember`.
- [ ] "Call tools naturally during conversation, not in a rush at the start." Confirm.
- [ ] "Call `fetch_guidelines_for_age_sex` before asserting a guideline." Confirm.

## §6 · Shape of a clinical turn — six beats

Reflect → translate → contextualize → educate → offer → refer.

- [ ] Is this the order you'd teach a new primary-care resident?
- [ ] Any beat missing for your style? (I considered "acknowledge emotional register" but left it implicit under reflect.)

## §7 · Extended-thinking guidance

- [ ] "Reasoning reads like a clinical note, not a stream of consciousness." Confirm — especially for Hans-path users who may expand it.
- [ ] Laura-case example walkthrough in §7 — verify the NCCN "10 years earlier" line of reasoning is exactly how you'd narrate it to a colleague.

## §8 · Anti-patterns — extended recently

- [ ] "Never normalize a single good day into a recovery milestone." Confirm.
- [ ] "Pass the sanitary-interpreter translation even when the user speaks in jargon." Confirm.
- [ ] "No moralizing, no hollow empathy, no bullet walls, no alarmism, no drug names as recommendations." Confirm.

## §9 · Failure-mode recoveries (scripted)

These are heard often during the demo and in the wild. Your voice on them matters most.

- [ ] Diagnosis pushback: *"I can't give you a diagnosis — that's not where I'm useful. What I can do is help you walk into your doctor's office ready, and help you understand what comes back."*
- [ ] Prescription pushback: *"That's a conversation for your doctor. I can help you write down the question so it's easy to ask."*
- [ ] Uncertainty: *"I'm not certain about the most current recommendation here — please verify with your doctor. What I can say is [the part you do know]."*

## Additional claims the demo narration will make

These are lines in the demo-script that reference the prompt's content — confirm the prompt backs them up:

- [ ] *"USPSTF biennial from 40, NCCN 10 years before the relative's diagnosis."* — prompt §4.
- [ ] *"WHO calls 100–125 prediabetes."* — this is the interpreter's framing, check if it's specifically in the translation table or is loose.
- [ ] *"No diagnosis, no prescription, always refers."* — prompt §2 hard rules.
- [ ] *"The clinical voice is authored and reviewed by a practicing physician."* — prompt header comment.

---

## Overall time budget

- §2 + §3 + §9: 10 minutes
- §4 (guideline sources + versions): 15 minutes — this is where the risk lives; trust but verify
- §5 + §6 + §7 + §8 + demo-line cross-refs: 5 minutes

Total ~30 minutes on Saturday. Any `[!]` flags go into a small diff I apply before recording.

## After audit

If any claim needs a change:
1. Edit the prompt in `apps/api/src/api/agents/runner.py`.
2. Backend auto-reloads on file save (dev server has `--reload`).
3. Kick the chat once to reconfirm Laura's case still lands clean.
4. Commit the prompt change separately so the history shows the clinician audit as its own step.
