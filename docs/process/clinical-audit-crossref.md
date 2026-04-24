# Clinical audit cross-reference

> Companion to [`clinical-audit-checklist.md`](./clinical-audit-checklist.md).
> For every row of the checklist, this file states what the current
> SYSTEM_PROMPT actually says (with line numbers from `apps/api/src/api/agents/runner.py`)
> and pre-classifies whether the claim matches, whether the wording is close
> but different, or whether the checklist item genuinely needs your judgment.
>
> Saves you triage time on Saturday — you only deep-read the rows flagged
> **for human judgment**.
>
> Legend:
> - ✅ **Matches** — prompt says what the checklist asserts. Likely `[x]`.
> - 🔶 **Close, different wording** — prompt covers the substance; check if the phrasing is yours. Likely `[~]` candidate.
> - ⚠️ **Gap** — prompt is silent or incomplete. Decide whether to add it.
> - 👤 **Needs your clinical judgment** — only you can verify (guideline version, factual accuracy, whether a statement matches how you speak).
>
> Source of truth: `runner.py` SYSTEM_PROMPT (version header `2026-04-21`,
> last materially edited 2026-04-23 for Laura-priming purge).

---

## §2 · Hard rules

| Row | Verdict | What prompt says |
|---|---|---|
| Never diagnoses, never prescribes, always refers | ✅ | Rules 1, 2, 4 (runner.py:73-91). Rule 4: *"Every clinical turn ends with a calm, specific referral to the user's doctor."* |
| Urgent values · Glucose > 400 | ✅ | Line 98 verbatim. |
| Urgent values · Potassium > 6.5 | ✅ | Line 99 verbatim. |
| Urgent values · Hemoglobin < 7 | ✅ | Line 100 verbatim. |
| Urgent values · INR > 5 | ✅ | Line 101 verbatim. |
| Urgent values · SpO₂ < 90 | ✅ | Line 102 verbatim. |
| Chest pain on exertion / new chest pain at rest | ✅ | Line 103 verbatim. |
| Stroke signs (hemiparesis, facial droop, aphasia, severe HA, vision loss) | ✅ | Lines 104-105: includes hemiparesis ("weakness on one side"), facial droop, trouble speaking, sudden severe headache, sudden vision loss. Phrasing is plain-language rather than medical jargon — consistent with the sanitary-interpreter commitment. |
| Suicidal ideation | ✅ | Line 106 verbatim. |
| Severe SOB, fainting, severe abdominal pain | ✅ | Line 107 verbatim. |
| Red-flag escalation script wording: *"What you're describing is something I'd want a doctor to see today"* | ✅ | Line 110-112 verbatim — **including** "If you're in the US, 911. If things are getting worse right now, please don't wait." 👤 **For your judgment:** the `911` line is US-specific. For MX demo, you may want to add "En México marca 911 o tu número local de emergencias." |
| *"I'm not a doctor — I'm educating and referring"* as final sentence of every red-flag escalation | ⚠️ | Prompt doesn't mandate this specific closing sentence. Rule 6 (line 114-117) says the model answers "no — a companion, and the doctor is still the doctor" *when asked* whether the app is a doctor. Red-flag scripts (line 110-112) don't require this specific final line. 👤 **For your judgment:** add the required final sentence to §2.5 escalation script, or accept the current posture. |

## §3 · Sanitary interpreter translations

| Row | Verdict | What prompt says |
|---|---|---|
| hypertension → "blood pressure above the healthy range" | ✅ | Line 130. |
| hyperglycemia in fasting → "your fasting glucose is above normal" | 🔶 | Line 131-132: *"your fasting glucose — your blood sugar before eating — is above normal"*. More explicit than the checklist; accept. |
| dyslipidemia → "the fats in your blood are outside the ideal range" | ✅ | Line 133. |
| screening → "a preventive check" | ✅ | Line 134. |
| adherence → "taking your medication the way it was prescribed" | ✅ | Line 135. |
| prediabetes → "higher-than-ideal blood sugar, not yet diabetes..." | 🔶 | Line 136-137: *"your blood sugar is in a range that's higher than ideal but not yet diabetes — it's the window where changes matter most"*. Same substance, different phrasing. Accept or adjust. |
| LDL → "the cholesterol you generally want to keep lower" | ✅ | Line 138. |
| HDL → "the cholesterol you generally want to keep higher" | ✅ | Line 139. |
| HbA1c → "your average blood sugar over the last three months" | ✅ | Line 140. |
| BRCA → "gene variants that can raise breast and ovarian cancer risk" | ✅ | Line 141-142. |
| CAC score → "a scan that looks at how much calcium has built up in the arteries around the heart" | ✅ | Line 143-144. |
| Lp(a) → "a blood fat that's largely inherited and can quietly raise heart risk" | ✅ | Line 145-146. |
| Terms to add | 👤 | **For your judgment.** Likely additions given the demo: "first-degree relative", "biennial", "shared-decision" (for PSA), "co-testing" (for cervical). Also consider: "glucose tolerance", "microalbuminuria", "eGFR" — for any Phase-1 conditions. |

## §4 · Screening knowledge

This is where the checklist calls out that the risk lives. Every row below needs your clinical judgment on guideline version.

| Row | Verdict | What prompt says |
|---|---|---|
| Breast · average-risk baseline — USPSTF 2024 biennial 40-74 | ✅ | Line 164: *"For average risk, USPSTF 2024 recommends biennial mammography from 40 to 74."* 👤 **Confirm**: version is 2024, which was the April 2024 revision lowering age. Still current as of your review date? |
| Breast · elevated-risk adjustment — ACS annual from 40 with first-degree pre-menopausal history | 🔶 | Line 162-166: *"Mammography annually starting at 40 for women with elevated risk (e.g., first-degree relative with pre-menopausal breast cancer) per ACS guidance."* 👤 **Confirm**: ACS framing matches your clinical practice. The prompt says "elevated risk", not specifically "first-degree pre-menopausal"; the parenthetical gives one example. Want tighter language? |
| Breast · NCCN "10 years earlier" | ⚠️ 👤 | **Not in SYSTEM_PROMPT**. The "start 10 years before the first-degree relative's diagnosis, or age 40, whichever is later" rule lives in the **guideline table** (`tools.py:344-350`, `kind: mammography_early_start`, source: *"ACS 2023 / NCCN"*) — surfaced via `fetch_guidelines_for_age_sex`. The prompt doesn't cite NCCN in §4. This is **the claim the demo narration and ReasoningSheet ride on.** 👤 **Critical judgment call:** (a) confirm NCCN's current language matches the "10 years / age 40 whichever is later" phrasing, (b) confirm v.2.2025 is the current NCCN version, (c) decide whether to move this statement into the prompt §4 explicitly so the model cites it even without calling the tool. Recommend: add one line to §4 breast-cancer block. |
| Cervical · Pap / HPV co-testing every 3-5 years 25-65 per ACS 2020 / ACOG | 🔶 | Line 167-169: *"Pap and/or HPV co-testing every 3 to 5 years from 25 to 65, per ACS 2020 and ACOG — exact cadence depends on which test and the user's history."* Age 25-65 (not 21-29/30-65 as in USPSTF 2018). 👤 **Confirm**: does ACS 2020 start at 25, or does your practice use USPSTF 2018 at 21? |
| Colorectal · begin at 45 per USPSTF 2021, colonoscopy q10y or FIT annually | ✅ | Line 170-171. |
| Prostate · PSA shared-decision 50-69, earlier (40-45) if Black or first-degree family history | ✅ | Line 172-174. |
| Diabetes · fasting glucose or HbA1c every 3 years from 35 per USPSTF 2021 | ✅ | Line 175-177: *"from 35 to 70 per USPSTF 2021, sooner and more often if there are risk factors"*. |
| Lipids · every 4-6 years low risk, more often with factors | 🔶 | Line 178-181: also adds statin-discussion framing for 40-75 with risk factors. Slightly more than the checklist asks. Accept. |
| BP · every visit, home monitoring if trending | ✅ | Line 182-183. |
| Lung low-dose CT · annual 50-80 with 20 pack-year | ✅ | Line 184-186: includes "who currently smoke or quit within 15 years" (USPSTF 2021). |
| CAC score | 🔶 | Line 187-190: positioned under "Cardiovascular workup when a first-degree relative had an early MI (men < 55, women < 65)" as one of five conversation starters. 👤 **Confirm**: do you want the companion mentioning CAC in the demo at all? The prompt enables it but won't force it. |
| Lp(a) | ✅ | Mentioned in sanitary interpreter (line 145-146) and in cardiovascular block (line 190). Source not cited in prompt — guideline table doesn't have Lp(a) either at a glance. 👤 **Confirm**: is NLA 2019 / ESC 2019 correct? Would you cite differently? |
| Mental health PHQ-9 / GAD-7 · educational self-screening, always referring | ✅ | Line 191-194: *"educational self-check tools only — never diagnostic from you. Any meaningful score goes to the doctor, and any item that touches self-harm routes to the urgent path in §2.5."* |

## §5 · Tool-use protocol

| Row | Verdict | What prompt says |
|---|---|---|
| Five tools named: save_profile_field, schedule_screening, fetch_guidelines_for_age_sex, log_biomarker, remember | ✅ | Lines 208-237 name all five, in this order. |
| "Call tools naturally during conversation, not in a rush at the start" | ✅ | Line 205-206 + line 239-240 verbatim substance. |
| "Call fetch_guidelines_for_age_sex before asserting a guideline" | ✅ | Lines 218-221: *"call this before you assert a specific guideline or threshold."* |

## §6 · Shape of a clinical turn — six beats

| Row | Verdict | What prompt says |
|---|---|---|
| Reflect → Translate → Contextualize → Educate → Offer → Refer | ✅ | Lines 250-258 exact order and naming. |
| Is this how you'd teach a new PC resident? | 👤 | **For your judgment.** The order is the prompt's commitment — if you teach differently, this is the time to say so. |
| Any beat missing for your style? (checklist mentions "acknowledge emotional register" considered and left implicit) | 👤 | **For your judgment.** Rule 1 ("Reflect") covers emotional register implicitly. If you want it explicit — say so. |

## §7 · Extended-thinking guidance

| Row | Verdict | What prompt says |
|---|---|---|
| "Reasoning reads like a clinical note, not a stream of consciousness" | ✅ | Line 267-269 verbatim substance. |
| Laura-case example walkthrough — verify NCCN "10 years earlier" line matches how you'd narrate it to a colleague | ⚠️ | **The Laura example was removed from §7 on 2026-04-23** to kill priming (see `d07765f` commit). §7 now shows two neutral examples (58 y/o BP, 32 y/o sleep) and explicitly says the reasoning must follow from what the user actually told you. 👤 **Decision:** do you want a cancer-history example added back under a clear "illustrative only — do not copy the specifics" disclaimer, so the model has a shape for hereditary-risk reasoning? Or keep §7 disease-agnostic and rely on the guideline table for NCCN specifics? |

## §8 · Anti-patterns

| Row | Verdict | What prompt says |
|---|---|---|
| "Never normalize a single good day into a recovery milestone" | ✅ | Lines 320-325, full paragraph. |
| "Pass sanitary-interpreter translation even when the user speaks in jargon" | ✅ | Lines 148-149: *"If the user speaks in jargon, match their register out of respect — but still pass the translation through, at least once, so you know they have it."* |
| "No moralizing, no hollow empathy, no bullet walls, no alarmism, no drug names" | ✅ | Lines 309-317 cover all five. |

## §9 · Failure-mode recoveries (scripted)

| Row | Verdict | What prompt says |
|---|---|---|
| Diagnosis pushback script | ⚠️ | **Not in SYSTEM_PROMPT as a scripted line.** The intent is in Rule 1 (line 73-76) and Rule 6 (line 114-117), but the specific phrase *"I can't give you a diagnosis — that's not where I'm useful. What I can do is help you walk into your doctor's office ready, and help you understand what comes back."* is not in the prompt. 👤 **Decision:** add to §9 as a suggested phrase, or leave the model free to author in-voice and audit outputs later? |
| Prescription pushback script | ⚠️ | Same — Rule 2 (line 78-82) states the posture, but the specific line *"That's a conversation for your doctor. I can help you write down the question so it's easy to ask."* is not scripted. |
| Uncertainty script | 🔶 | Lines 62-64 have the substance: *"I'm not certain about the most current recommendation here — it's worth checking with your doctor."* Close to the checklist's version; accept. |

## Demo-script cross-references

| Row | Verdict | Source |
|---|---|---|
| *"USPSTF biennial from 40, NCCN 10 years before the relative's diagnosis"* | 🔶 | USPSTF half is in prompt (line 164). NCCN half is in the guideline table (tools.py:344-350) but not in the prompt. 👤 **See §4 NCCN row above** — recommend moving this into §4 explicitly. |
| *"WHO calls 100-125 prediabetes"* | ⚠️ | **Not in prompt as a specific claim.** The translation of "prediabetes" (line 136-137) describes the category but doesn't cite WHO. The claim "WHO 100-125" is plausible (WHO's IFG criterion is 110-125, not 100-125; ADA uses 100-125). 👤 **Decision:** tighten demo narration to *"ADA 100-125" or "WHO 110-125"* whichever is more accurate for your practice. Alternatively, add to prompt. |
| *"No diagnosis, no prescription, always refers"* | ✅ | Rules 1, 2, 4 verbatim. |
| *"The clinical voice is authored and reviewed by a practicing physician"* | ✅ | Prompt header (line 1-30) references Juan Manuel's role; `/how-this-works` surfaces it to users. |

---

## Pre-flagged items for Saturday AM

If you only have 30 minutes, prioritize these in this order. Everything else is a rubber-stamp.

1. **NCCN "10 years before" claim** (§4 row 3, and demo cross-ref row 1). This is the claim the ReasoningSheet and narration are anchored on. Decide whether to add to prompt §4 or keep in the tool. Confirm NCCN version and wording.
2. **Red-flag escalation script for MX** (§2 row 11). Add "911" MX reference or regional emergency-services text.
3. **"I'm not a doctor — I'm educating and referring"** as final sentence of red-flag escalations (§2 last row). Decide: add or drop.
4. **USPSTF 2024 breast still current?** (§4 row 1). One query to confirm.
5. **Cervical starting age** (§4 row 4). ACS 2020 starts at 25; USPSTF 2018 at 21. Confirm which you want the companion to cite.
6. **WHO vs ADA for prediabetes 100-125** (demo cross-ref row 2). Two-word fix in demo-script.
7. **Scripted pushback phrases** (§9 rows 1-2). Decide: add to §9 or trust the voice.
8. **§7 illustrative example with cancer-history shape?** Left out for priming-safety; revisit if the shape is worth the risk.

Anything not on this list is marked ✅ or 🔶 in the tables above and can be `[x]`'d with a quick scan.

---

*Generated 2026-04-23 night by cross-reading the current SYSTEM_PROMPT
against every checklist row. Re-run this whenever the prompt changes
materially.*
