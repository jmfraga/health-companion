# Hans — first look at Health Companion

> One-pager to send to Hans once the production URL is live. Designed
> to prime his observation without telling him what to find. Can be
> pasted directly into WhatsApp / Telegram / email.

---

Hans — this is the thing I've been building this week with Claude Opus 4.7. Public URL here: **[TODO · paste Fly/Vercel URL when deploy lands]** · add `?demo=1` so you skip the login.

It's a demo. The state is in-memory (resets when the server restarts), there's no real per-user data layer yet, and we haven't signed a BAA with Anthropic — so don't paste anything you wouldn't say out loud in a café. But the product shape is real, and I want your eyes on it before Sunday's submission.

## What I'd love you to try (10–15 min · do these in order, stop whenever)

1. **Cold entry.** Open the URL. Don't read the welcome card carefully — just notice how it feels. Click one of the three example chips (or ignore them and write your own opener). Send.

2. **Tell it something real about you.** Not Hans-from-the-app-demo — real you. A goal, a worry, a number you've been tracking. Let the profile panel fill in on the right as you type. See if the keys it captures match how you'd actually describe yourself.

3. **Upload a lab.** Either your own anonymized panel, or grab `fixtures/labs-laura-demo.pdf` from the repo — doesn't matter. Watch the four reading phases animate and then read what the companion says back. Pay attention to which findings it names and how it frames them.

4. **"See reasoning."** First, flip the toggle at `/settings` → "Show reasoning in conversations." Then scroll up to any companion response that has clinical content and click the "See reasoning" link. Tell me whether what you read feels like a clinical note from a friend who knows health, or like something else.

5. **Jump forward three months.** There's a "Simulate: 3 months later" button in the header. Click it. Read what lands. It references things you told it earlier — let me know if the references feel real or stitched.

6. **Optional — visit `/trends` and `/bridge`.** `/trends` is where biomarkers land over time (with a demo arc button if you want to see what six months of a real intervention looks like). `/bridge` is the clinician-side surface — white-label preview, Phase 2 vision, not functional.

## Questions I'd love your honest read on

- **Warmth vs. mechanical.** Where did it feel like a person, and where did it feel like a chatbot?
- **Heard vs. interrogated.** Did it ask the right things in the right order, or did it push?
- **Trust.** At what point did you stop scanning and start trusting? (Or: never — and why?)
- **Product vs. chrome.** What felt like real product behavior and what felt like demo staging?
- **The longevity question.** If it worked the way we're pitching, would you use it for three months? What's the one thing that would make that true — and the one thing that would stop you?

## What it won't do yet (so you don't wait for it)

- Remember you across sessions. State is in-process memory.
- Produce a diagnosis, a prescription, or anything that could be mistaken for clinical advice.
- Talk in voice. Voice I/O is a post-hackathon thread.
- Cover the full range of conditions — preventive screening and labs are where the depth lives today; chronic-disease management and mental-health surfaces are in the roadmap.
- Guarantee privacy or data portability. The Phase-1 architecture is scoped in `docs/product-horizon.md`, but today it's a demo.

## How to report back

Text me however you want — voice notes are perfect, no need to write a formal review. What stuck, what grated, what you'd change if it were yours. If a specific turn surprised you in a good or bad way, a screenshot of the thread helps me reconstruct what the model did.

If you feel like going deeper, the thesis and roadmap live in the repo: **github.com/jmfraga/health-companion** — start with the README, then `docs/process/tesis-del-fundador-v1.md` §5 (the natural history of disease) if you want the clinical spine of what we're trying to do.

Thanks for this. Your read matters more than any judge's.

— Juanma
