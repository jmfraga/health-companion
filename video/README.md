# Video production assets

Working folder for the hackathon submission video — the 3-minute Loom
JM recorded on Sunday April 26, 2026, to accompany the Cerebral Valley
*Built with Opus 4.7* hackathon submission.

The final rendered video lives publicly on YouTube:
**https://youtu.be/-q0DTQhQW4g**

## What's in this folder

### Tracked in git (lightweight)

- `Guion.rtf` — JM's original Spanish/English narration outline, written
  Sunday morning while watching last year's hackathon presentations
- `guion grabado.txt` — the same narration tightened to fit each
  Remotion clip's exact duration (per-section word counts + pacing
  notes, ~334 words / 2:20)
- `guion eleven labs.txt` — ElevenLabs TTS prompt for the cloned-voice
  version, with SSML break tags + recommended voice settings
- `recording-cheat-sheet.md` — copy-pasteable Turn 1/Turn 2 +
  narration cues for second-screen reading during the take *(also in
  `docs/process/recording-cheat-sheet.md`)*
- `recording-runbook.md` — operations doc for the recording window
  *(also in `docs/process/recording-runbook.md`)*
- `expected-takes-jm.md` — practice run output captured against
  production with JM's narrative *(also in `docs/process/`)*
- `demo-script.md` — v4 founder narrative *(also in `docs/process/`)*
- `submission-draft.md`, `hans-first-look.md` — submission-day
  references *(also in `docs/process/`)*
- this `README.md`

The duplicates with `docs/process/` are intentional: they are a
snapshot of the recording-day desk so the next iteration of the video
doesn't have to reconstruct the working surface from a tree.

### Not tracked in git (heavy)

The following are gitignored — they live locally next to the working
folder, the YouTube upload is the canonical public artifact:

- `Assets/` — 481 MB of Remotion clip renders + intermediate working
  assets (the source for these is the
  [hackathon-video-remotion](https://github.com/jmfraga/hackathon-video-remotion)
  repo, generated via `remotion render` and exported here as MP4 +
  PNG thumbnails)
- `HC Video.cmproj/` — 445 MB Camtasia project bundle (sources,
  cached renders, project metadata)
- `HC Video final.mp4` — 36 MB rendered final
- `WhatsApp Video 2026-04-26 at 13.07.47.mp4` — 16 MB working
  reference (a draft sent on family chat earlier in the day)

If you need any of these, ask JM directly — they live on the M4
Trabajo and on this M4 cerebro under `~/health-companion/video/`,
out of git but on disk.

## Production stack used

- **Clips**: Remotion (React-based programmatic video) — the
  hackathon-video-remotion repo. Each Stage / Intervention / Closing
  Thesis clip is a separate composition with consistent design tokens
  (colors, easing, typography) so they cut cleanly together.
- **Editor**: Camtasia (`HC Video.cmproj/`).
- **Voice**: ElevenLabs Instant Voice Clone with `eleven_multilingual_v2`,
  stability 0.45 / similarity 0.85 / style 0.20.
- **Music**: Suno V4 — instrumental cinematic ambient score, cued at
  ~72 BPM with strings + piano, ducked beneath the voiceover.
- **Final render**: Camtasia → MP4 1080p → YouTube unlisted.

## Future iterations

If we re-record (Phase 1 launch, marketing site, pilot pitches):

1. Edit the script in `docs/process/demo-script.md` — that is the
   source of truth for narration content
2. Run `python3 /tmp/hc-jm-practice.py` (the helper that captures
   what the model actually says against production) and refresh
   `expected-takes-jm.md` so the narration matches reality
3. Re-render Remotion clips (or new compositions) from the
   sibling `hackathon-video-remotion` repo
4. Bring everything into a fresh Camtasia / Final Cut project,
   preserving the per-section timings documented in `guion grabado.txt`
5. New voice render in ElevenLabs (the instant clone is
   per-account, voice still in JM's library)

The runbook in `docs/process/recording-runbook.md` is the
operational sequence for any future recording window.
