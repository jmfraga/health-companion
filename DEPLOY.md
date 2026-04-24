# Deploy — Health Companion

> Step-by-step playbook for the first production deployment of the
> hackathon submission. Designed to be mechanical: open a terminal,
> work top-to-bottom, no improvisation needed.
>
> Goal: a public URL a hackathon judge can reach without Tailscale.
> **Approximate wall-clock time: 60-90 minutes end-to-end.**

---

## What's shipping

- **API** → Fly.io, single region (`sjc`), one always-warm machine.
  State stays in-memory (no Postgres yet), so multi-region would lose
  cross-endpoint memory. One machine is correct for the MVP.
- **Web** → Vercel, a Next.js 15 App Router app. Reaches the API over
  HTTPS + SSE.
- **Secrets** → Anthropic key on Fly only; Supabase publishable +
  anthropic-read-only exposed to the browser as `NEXT_PUBLIC_*` env
  vars on Vercel.

## Before you start

Check the checklist once before opening any account UI:

- [ ] You're logged into the Fly.io account that will own the app
      (`fly auth login` succeeds).
- [ ] You're logged into the Vercel account (`vercel login` works).
- [ ] You have the Anthropic API key handy
      (`ANTHROPIC_API_KEY=sk-ant-...`).
- [ ] You have the Supabase project URL + publishable key + JWKS URL
      (from the project dashboard).
- [ ] The repo is on `main` with every local change committed and
      pushed.
- [ ] `npm run build` and `uv run python -c "from api.main import app"` both
      succeed locally (sanity check before spending deploy minutes on
      a broken tree).

## Part 1 · Deploy the API to Fly.io (~20 min)

### 1.1 · First-time launch

From the repo root:

```bash
cd apps/api

# Fly picks the app name from fly.toml. If the name is taken, edit the
# `app = "..."` line before running launch.
fly launch --copy-config --name health-companion-api --region sjc --now=false
```

`--copy-config` preserves the `fly.toml` you already have. `--now=false`
stops Fly from deploying immediately so you can set secrets first.

If Fly asks about setting up Postgres or Redis — **no** to both. The MVP
doesn't need them.

### 1.2 · Secrets

```bash
fly secrets set \
  ANTHROPIC_API_KEY=sk-ant-... \
  ANTHROPIC_BETA_HEADER=managed-agents-2026-04-01 \
  SUPABASE_URL=https://YOUR-PROJECT.supabase.co \
  SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
  SUPABASE_SECRET_KEY=sb_secret_... \
  SUPABASE_JWKS_URL=https://YOUR-PROJECT.supabase.co/auth/v1/.well-known/jwks.json
```

`CORS_ORIGINS` comes in Part 3 once you know the Vercel URL.

### 1.3 · First deploy

```bash
fly deploy
```

On success Fly prints the app URL, something like
`https://health-companion-api.fly.dev`. Note it — the web app will point
here.

### 1.4 · Smoke test

```bash
curl -sf https://health-companion-api.fly.dev/health
# expected: {"status":"ok"}

curl -sX POST https://health-companion-api.fly.dev/api/demo/reset
# expected: {"ok":true,"profile":{},"screenings":[],...}

curl -sX POST https://health-companion-api.fly.dev/api/trends/seed-demo
# expected: {"ok":true,"seeded":4,"total":4}

curl -sf https://health-companion-api.fly.dev/api/trends | head -20
# expected: JSON with series.fasting_glucose points
```

All four return 200 before moving on.

## Part 2 · Deploy the web to Vercel (~15 min)

### 2.1 · First-time project

From the repo root:

```bash
cd apps/web

# This walks you through linking to a Vercel project. Pick "Other"
# monorepo layout when asked — or let Vercel auto-detect Next.js.
# Root directory: leave blank (we're already in apps/web).
vercel link
```

If this is a brand-new Vercel project, `vercel link` will create it. The
project name ends up in `vercel.json` metadata.

### 2.2 · Environment variables

Vercel reads env vars from its dashboard, not from local `.env` files.
Add these in the **Production** scope (and **Preview** if you want
Vercel preview URLs to work against the same API):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://health-companion-api.fly.dev` (from Part 1.3) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
| `NEXT_PUBLIC_PROACTIVE_ENDPOINT` | `/api/simulate-months-later` *(or `/api/simulate-months-later-managed` if you decide the flip is safe)* |
| `NEXT_PUBLIC_DEMO_BYPASS_AUTH` | `true` *(so `/?demo=1` isn't required on the production URL; judges land clean)* |

You can set these from the CLI in one line per var:

```bash
vercel env add NEXT_PUBLIC_API_URL production
# paste the value when prompted
```

Or use the dashboard — either works. The CLI is faster when you know
the values.

### 2.3 · First deploy

```bash
vercel --prod
```

Vercel will build, print a deployed URL, and return. The URL is usually
something like `https://health-companion.vercel.app` or a branded
domain if you've attached one.

### 2.4 · Smoke test (browser)

Open the Vercel URL. You should see:

- [ ] Welcome card with three example chips
- [ ] `?demo=1` not required (because `NEXT_PUBLIC_DEMO_BYPASS_AUTH=true`)
- [ ] Clicking a chip fills the composer (not sent)
- [ ] Sending the message starts a stream; profile panel fills; chat reply arrives
- [ ] `/trends` loads with the demo arc (if you seeded it in Part 1.4)
- [ ] `/bridge` loads with the 4-patient panel
- [ ] `/privacy`, `/how-this-works`, `/settings` all render

If the chat doesn't stream — check the Vercel deployment logs and the
Fly logs (`fly logs -a health-companion-api`). Most first-deploy
failures are CORS.

## Part 3 · Wire CORS (~5 min)

Now that Vercel is live, the API must accept its origin. Grab the
production Vercel URL (you may also want to include the preview
pattern).

```bash
cd apps/api
fly secrets set \
  CORS_ORIGINS='["https://health-companion.vercel.app","https://*.vercel.app"]'
```

Fly restarts the machine when secrets change. Re-smoke Part 2.4 after
~30 seconds.

## Part 4 · Domain polish (optional, ~15 min)

If you have a domain:

- Vercel → Settings → Domains → add `companion.yourdomain.com` (or
  `health-companion.mx`). Vercel walks you through the DNS records.
- Fly → `fly certs create api.yourdomain.com` and follow the CNAME
  instructions.
- After the custom domains land, update the CORS secret again with the
  new web origin and redeploy.

## Part 5 · Production checklist before sharing the URL

- [ ] Open the URL in an incognito window. Welcome card loads in under 3 seconds.
- [ ] Example chip click drops text into composer, nothing auto-sends.
- [ ] A real chat turn (e.g., *"I'm 50 and want to stick around for a lot longer"*) completes in under 60 seconds.
- [ ] `/trends` loads with the demo arc seeded.
- [ ] `/bridge` loads; the white-label placeholder reads "Your clinic here".
- [ ] "See reasoning" button appears after enabling the toggle in `/settings`.
- [ ] `/settings` toggle persists across page reloads.
- [ ] `Start fresh` button clears state and shows the toast.
- [ ] Emergency pill visible at the bottom of the chat.
- [ ] No console errors in DevTools.
- [ ] Lighthouse Accessibility score ≥ 90 on the home page (optional but nice).

## Rollback

If anything looks wrong on Vercel:

```bash
vercel list
# find the previous deployment URL; promote it:
vercel promote <previous-deployment-url>
```

If the API is broken:

```bash
fly releases -a health-companion-api
# find the previous release:
fly deploy --image <previous-release-image>
```

Both platforms keep the last ~10 releases so you can hop backwards
without risk.

## Known limitations the judge might hit

- **Latency.** First turn on a fresh Fly machine is cold — cache not
  warm. Subsequent turns benefit from the 5-minute prompt cache.
- **In-memory state.** If the machine restarts (Fly rolls deploys),
  state is lost. The `Start fresh` button exists precisely for the
  judge to reset without a support ticket.
- **No per-user scoping yet.** Every judge hitting the production URL
  shares the same in-memory state. Two judges at the same time will
  see each other's profile. Documented in the
  `docs/product-horizon.md` Phase-1 plan; for the demo window this is
  an acceptable compromise.
- **PDF size.** Fly machine is 1 GB RAM. A 10 MB+ lab PDF could strain
  it. Keep the demo PDF under 2 MB.

## If something breaks during recording

1. Do not restart the Fly machine. You lose state and the cache.
2. Use the `Start fresh` button rather than reloading the page.
3. If a turn hangs > 90 s, open a second terminal and run
   `fly logs -a health-companion-api` to see where it stuck. Usually a
   cold cache or a hiccup from Anthropic.
4. Worst case: re-record with the backup local M4 dev URL and edit
   the video later.

---

*Last updated: 2026-04-23 night. Revise after the first end-to-end
deploy if any step surprises you.*
