# Demo run-through findings — Apr 23 evening

Solo run-through against a fresh in-memory state. Curl-only; no browser
involved (Chrome MCP was disconnected from the laptop). Notes for the
clinical-audit + polish block tomorrow / Saturday.

## Beat 1 — Meeting Laura

**Prompt tested**: `"I am 44. My mom died of breast cancer at 52."` (verbatim from demo script).

**Result**: 53 s. Profile fills correctly (age=44, `family_history.breast_cancer_mother=true`, age-at-death=52). Semantic memory created.
The companion's response is warm and in-voice: *"I'm sorry about your mom.
Fifty-two is young, and losing her that way stays with a person. What
should I call you?"*

**Problem**: the companion **does not schedule any screening on this turn**. It defers to asking for Laura's name first. The demo's wow-moment is the ScheduleCard — without a schedule_screening call, the card never renders.

### Fix — option A (recommended, lowest-risk)

Change the demo prompt to include her name:

> **Before**: `I'm 44. My mom died of breast cancer at 52.`
>
> **After**: `I'm Laura. I'm 44. My mom died of breast cancer at 52.`

With this variant the run looks like (66 s, tested):

- ✅ 5 `save_profile_field` calls (name, age, sex inferred female, family history, mother's age)
- ✅ `fetch_guidelines_for_age_sex` for breast_cancer
- ✅ `schedule_screening(kind="mammography", recommended_by="ACS 2023 / NCCN — annual from 40 with first-degree family history")`
- ✅ `remember(memory_type="semantic")` with `family_history / breast_cancer / screening` tags
- ✅ 32 message_delta tokens streamed (rich prose)
- ✅ 42 reasoning deltas → See-reasoning sheet will feel dense and real

### Remaining fidelity gap

Even with the name included, the companion currently schedules **1 screening (mammography)** on first contact — not the "three screenings" the narration promises. Two options:

- **(a)** Rewrite the narration to match reality: *"One screening, early, because your mother."* Honest, punchy, shorter. My vote.
- **(b)** Update SYSTEM_PROMPT §5 so the companion, on first contact with a new profile, offers a **starter preventive calendar** of 2–4 age/sex-appropriate screenings plus the family-history-driven one. Product-truer, but a prompt change requires Juan Manuel's clinical approval and a re-read of §4.

Either option needs his call — noted, not changed.

## Beat 2 — Labs

**Not run** — no lab PDF fixture in the repo. Juan Manuel brings his own anonymized one to the recording; Beat 2 should be verified with that PDF before the take on Saturday. If it fails during recording, Beat 3 still lands on its own because it re-reads whatever state exists.

## Beat 3 — +3 months proactive

**Tested against a state with profile + 1 screening (no labs)**. 28 s.

- ✅ Message is warm, specific, references the mother + the cadence logic + the pending mammography.
- ✅ `context_refs` has 4 entries (`family_history_breast_cancer_mother`, `mother_age_at_death_52_premenopausal`, `pending_screening_mammography_queued_april_2026`, `first_degree_maternal_history_annual_cadence`) — renders as the 4 amber pill-tags on ProactiveLetter.
- ✅ `next_step` populated → CTA button ("Book the annual mammogram this month…") will render.
- ⚠️ Message doesn't mention glucose / weight / other biomarkers because labs were never uploaded in this run. In the real demo, Beat 2 must happen for the proactive to close the "memory is the moat" arc by referencing the glucose 118 → 108 improvement.

## Timing budget for the demo

| Beat | Elapsed | Dead air for narrator |
|---|---|---|
| Beat 1 (Meeting Laura) | ~60 s | ~30 s (reasoning_start → first message_delta) |
| Beat 2 (Labs) | TBD | Reading-state animation covers most of it |
| Beat 3 (+3 months) | ~28 s | ~18 s before message appears |

The dead-air windows are where the narration in `demo-script.md` lands. The current script fits; no rewrite needed on timing.

## Other observations

- Profile panel is populated via `profile_snapshot` SSE event (at the end of the turn) and by individual `tool_use` events as they stream. The live filling-in works correctly both ways.
- Timeline stays empty through Beats 1 and 3. Events only land when labs ingest OR when the proactive endpoint itself calls `append_timeline_event`. For Beat 1, the profile panel is the visible change, not the timeline. The demo narration is accurate.
- Turn latency is dominated by the adaptive-thinking loop, not by tool round-trips. Both observed turns had 2+ `reasoning_start` / `reasoning_stop` cycles (pre-tool thought, post-tool thought). Nothing to optimize here without sacrificing depth.

## Recommended changes before Saturday

1. **(Juan Manuel)** Pick option (a) or (b) above for the single-screening narration gap.
2. **(Juan Manuel)** Update the demo-script prompt to the "I'm Laura. I'm 44…" variant.
3. **(Me, if (b) is chosen)** Tweak SYSTEM_PROMPT §5 and verify on Friday.
4. **(Me)** Next run-through once a lab PDF is available — confirm Beat 2 reads glucose correctly and the proactive message Beat 3 closes the glucose-improvement arc.
5. **(Both, Saturday)** One full end-to-end take with all three beats in sequence, using real state (no resets between beats).
