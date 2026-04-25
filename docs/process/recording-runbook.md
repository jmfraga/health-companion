# Recording runbook — Saturday April 25, 2026

> Operations doc for the demo recording. Pair this with
> [`demo-script.md`](./demo-script.md) (the words you say) and
> [`scripts/demo-preflight.sh`](../../scripts/demo-preflight.sh)
> (the state reset). This file is the **physical sequence** —
> what to click, in what order, and how to recover when something
> blinks.
>
> Target: take in the can by **17:00 CDMX** so the 50th-birthday
> party isn't compromised. Hard cap: take exists by **20:00**, even
> if it's a B-take we'll re-cut in the morning.

---

## Window plan (CDMX time)

| Time      | Block                          | Duration |
|-----------|--------------------------------|----------|
| 13:30     | Sit down · close everything else | 5 min  |
| 13:35     | Pre-flight (terminal + state)    | 10 min |
| 13:45     | Browser + recording rig          | 10 min |
| 13:55     | Audio + dry voice run            | 10 min |
| 14:05     | **Take 1**                       | 5 min  |
| 14:15     | Review, breathe, sip water       | 10 min |
| 14:25     | **Take 2** (or take 1 confirm)   | 5 min  |
| 14:35     | Review takes, pick the keeper    | 15 min |
| 14:50     | Upload + title + description     | 15 min |
| 15:05     | Post-recording journal + commit  | 15 min |
| 15:20     | **DONE.** Buffer until party.    | —      |

Two takes minimum. Three if the first feels off but never four —
fatigue starts winning at four.

---

## Block 1 · Pre-flight (13:35, ~10 min)

Open one terminal pane. Run **in this order**:

```bash
# 1. Confirm both surfaces alive
curl -sf https://hc-companion-api.fly.dev/health
curl -sI https://health-companion-five.vercel.app/ | head -1

# 2. Reset + seed in one shot
HC_API_URL=https://hc-companion-api.fly.dev \
  bash ~/health-companion/scripts/demo-preflight.sh
```

The preflight script will:

- Health-check the API (must return `{"status":"ok"}`)
- POST `/api/demo/reset` → clears profile · screenings · biomarkers · timeline · memory
- POST `/api/trends/seed-demo` → seeds the **LDL 6-point arc**
  (136 → 128 → 141 → 132 → 124 → 112) so `/trends` has something
  honest to show
- Print a checklist reminder at the end

Any failure in the script = stop. Diagnose before continuing. The
takes only work if state is clean.

**Optional but recommended:**

```bash
# 3. Pre-prime Laura's profile (saves you 30s in Act 1 turn 1)
HC_API_URL=https://hc-companion-api.fly.dev \
  bash ~/health-companion/scripts/demo-preflight.sh --seed-laura
```

This one calls `/api/chat` with Laura's first message and waits for the
turn to complete (~30–60s — adaptive thinking takes a moment). When it
finishes, the profile already has `name`, `age`, family history, and
the relevant memory entries. Then you start the recording at **turn
2** (Laura's "what tests should I ask my doctor for?") — much tighter
demo, less waiting on screen.

The demo-script v3 (two-turn Act 1) was written for both modes —
seeded or live. Choose one and stick with it.

---

## Block 2 · Browser + recording rig (13:45, ~10 min)

Open a **fresh incognito window** in Chrome (Loom and Cmd+Shift+N play
better with incognito). Then:

```
URL: https://health-companion-five.vercel.app/?demo=1
```

Important toggles:

- [ ] Window size: ~1400 × 900 (don't full-screen — the chrome looks
      cramped at 1920+; 1400 is the sweet spot for the recording frame)
- [ ] Browser zoom: **100 %** (Cmd+0 to reset)
- [ ] DevTools: **closed** (F12 to confirm; if you see the panel, hit
      Cmd+Opt+I)
- [ ] Reasoning toggle is ON by default for first-time visitors —
      no manual flip needed. (If you've explicitly turned it OFF on
      this browser before, open `/settings` and flip it back ON.)
- [ ] Bookmarks bar: **hidden** (View → Hide Bookmarks Bar)
- [ ] Notifications: macOS **Do Not Disturb** ON (Control Center →
      Focus → Do Not Disturb)
- [ ] Slack / Mail / Telegram desktop: **quit** (not minimize —
      desktop notifications still surface from minimized apps)
- [ ] Loom or QuickTime: armed, pointed at the right display
- [ ] Synthetic lab PDF on the desktop: `~/Desktop/labs-laura-demo.pdf`
      (copy from `fixtures/labs-laura-demo.pdf` once)

If you're using Loom: make sure the **camera bubble** is positioned
**bottom-right**, not bottom-left (the EmergencyPill lives bottom-left
and a camera over it makes the regulatory disclosure unreadable).

---

## Block 3 · Audio + dry voice (13:55, ~10 min)

Mic check:

- Read one sentence aloud: *"This is Health Companion, take 1."*
- Play back. If it pops or breathes, adjust mic distance / gain.
- Set Loom mic to your USB / external mic, NOT laptop built-in
  unless you've tested it.

Dry voice run (no recording):

- Read the demo-script aloud once, slow.
- Watch the actual app respond as you click. The `Simulate: 3 months
  later` button has its own pace; the lab drop-zone has 4 phases that
  take ~10 s to animate. Get a feel for the timing now, not while
  rolling.

---

## Block 4 · Takes (14:05+)

**Hit record. Then:**

1. Voice the cold-open line (12 s). Don't click anything yet.
2. Click an example chip OR type Laura's first message verbatim
   (per the script).
3. Wait for the response. **Do not narrate over the streaming.**
   Let the room breathe.
4. Click `Simulate: 3 months later` when it lands in the script
   (~01:30 mark).
5. Drag the lab PDF into the drop-zone when the script reaches
   "and we can do labs."
6. Click "See reasoning" once — this is the hero moment for the
   audit layer.
7. Navigate to `/trends`, then `/bridge`, then close on the empty
   chat window and the line *"Wellness, not a medical device."*

**Stop the recording. Don't review yet — take a sip of water.**

### Take recovery (something blinks mid-take)

- **Network hiccup mid-stream**: stop, restart from the last clean
  beat. Don't try to recover live.
- **Wrong response from Opus**: stop, accept the take is dead, run
  `/api/demo/reset` from the terminal, start fresh.
- **Profile panel glitches**: ignore — the right panel is decoration,
  the chat is the demo.
- **`/trends` empty**: re-run the preflight seed (`POST
  /api/trends/seed-demo`), refresh, retake from the `/trends` beat.

---

## Block 5 · Pick the keeper (14:35, ~15 min)

Watch each take **once**, full speed, no pausing. Make a single note
per take: a number from 1-10 and a one-line reason.

Pick the take with the highest number. Don't second-guess.

If two are tied, pick the one where **your voice sounds more like
you** and less like a presentation. Judges read warmth.

---

## Block 6 · Upload (14:50, ~15 min)

Loom: **rename** the take. The default name is awful. Use:

```
Health Companion · Built with Opus 4.7 (April 2026)
```

Loom description:

```
A wellness companion whose only job is to keep you well, in the
language you actually speak. Built in five nights with Opus 4.7
and a coordinated team of Claude Code subagents.

Live: https://health-companion-five.vercel.app/?demo=1
Repo: https://github.com/jmfraga/health-companion
```

Make the video **public** (or unlisted with link-shareable). Confirm
the URL plays in an incognito window before you call it done.

Copy the share URL. Save it in a sticky note on your desktop labeled
`SUBMIT URL — VIDEO`.

---

## Block 7 · Post-recording wrap (15:05, ~15 min)

```bash
# Mark today in the journal
$EDITOR ~/health-companion/docs/process/development-journal.md
# Add an "### Recording (Apr 25 afternoon)" subsection — three lines:
# - which take you picked, why, and the Loom URL
# - what surprised you in the take (whether for or against)
# - what's left for Sunday submit
```

Commit the runbook + journal as one:

```bash
cd ~/health-companion
git add docs/process/development-journal.md
git commit -m "Recording landed Apr 25 — Loom URL + take notes"
git push
```

You're done. Go to the party.

---

## Sunday morning (April 26)

This window stays empty unless something bites. The only checks:

- [ ] Open the Loom URL in incognito, watch from start to end. If
      anything jumps, decide whether it's worth a re-record.
- [ ] Open the live URL in incognito on your phone. Confirm it loads,
      `?demo=1` works, no auth gate.
- [ ] Read [`submission-draft.md`](./submission-draft.md) v4 once.
      Trim a phrase if it bothers you. **Don't rewrite.**

---

## Sunday afternoon (April 26 · submit)

Submit URL: https://cerebralvalley.ai/e/built-with-4-7-hackathon/hackathon/submit

Hard deadline: **19:00 CDMX** (8 PM EDT). Target: **17:00 CDMX**.

Form fields you'll need:

- **Project name**: Health Companion
- **Tagline** (one line): *"A wellness companion whose only job is to
  keep you well, in the language you actually speak."*
- **Live demo URL**: https://health-companion-five.vercel.app/?demo=1
- **Source code URL**: https://github.com/jmfraga/health-companion
- **Video URL**: [the Loom URL from yesterday's sticky note]
- **Description** (100–200 words): paste v4 from
  [`submission-draft.md`](./submission-draft.md), one final read-through
- **Side prize tag**: ✅ "Best use of Claude Managed Agents" — narrate
  the sibling endpoint at `/api/simulate-months-later-managed`

Submit. Screenshot. Post a celebratory message wherever feels right.

The work is done.
