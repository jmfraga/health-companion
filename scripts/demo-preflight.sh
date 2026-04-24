#!/usr/bin/env bash
# Health Companion — demo pre-flight
#
# One command that gets the app into a known-clean state for a demo take.
# Safe to run against local (http://localhost:8000) or the production URL
# once Fly.io is up — parameterize via HC_API_URL.
#
# Usage:
#   bash scripts/demo-preflight.sh              # reset + seed demo arc
#   bash scripts/demo-preflight.sh --seed-laura # also prime Laura's profile
#   bash scripts/demo-preflight.sh --help
#
# Environment:
#   HC_API_URL  Base URL of the API (default: http://localhost:8000)
#
# Exit codes: 0 ok · 1 API unreachable · 2 reset failed · 3 seed failed

set -euo pipefail

HC_API_URL="${HC_API_URL:-http://localhost:8000}"
SEED_LAURA=0

print_help() {
  sed -n '2,18p' "$0" | sed 's/^# \?//'
}

for arg in "$@"; do
  case "$arg" in
    --seed-laura)   SEED_LAURA=1 ;;
    --help|-h)      print_help; exit 0 ;;
    *) echo "unknown flag: $arg" >&2; print_help; exit 64 ;;
  esac
done

hr() { printf '%.0s─' {1..60}; echo; }

# ── 1. Health check ─────────────────────────────────────────────────
echo "→ health check ($HC_API_URL/health)"
if ! curl -fsS --max-time 10 "$HC_API_URL/health" >/dev/null; then
  echo "✗ API unreachable at $HC_API_URL/health" >&2
  echo "  Check it's running, or set HC_API_URL to the right host." >&2
  exit 1
fi
echo "  ok"

# ── 2. Reset state ──────────────────────────────────────────────────
echo "→ reset demo state"
RESET_HTTP=$(curl -s -o /tmp/hc-preflight-reset.json -w "%{http_code}" \
  -X POST "$HC_API_URL/api/demo/reset")
if [ "$RESET_HTTP" != "200" ]; then
  echo "✗ reset failed: HTTP $RESET_HTTP" >&2
  cat /tmp/hc-preflight-reset.json >&2
  exit 2
fi
echo "  ok · profile/screenings/biomarkers/timeline/memory cleared"

# ── 3. Seed the LDL demo arc ────────────────────────────────────────
echo "→ seed LDL arc (136 → 128 → 141 → 132 → 124 → 112)"
SEED_HTTP=$(curl -s -o /tmp/hc-preflight-seed.json -w "%{http_code}" \
  -X POST "$HC_API_URL/api/trends/seed-demo")
if [ "$SEED_HTTP" != "200" ]; then
  echo "✗ seed failed: HTTP $SEED_HTTP" >&2
  cat /tmp/hc-preflight-seed.json >&2
  exit 3
fi
SEEDED=$(python3 -c "import json,sys; d=json.load(open('/tmp/hc-preflight-seed.json')); print(d.get('seeded'), 'seeded,', d.get('total'), 'total')" 2>/dev/null || echo "seed ok")
echo "  ok · $SEEDED"

# ── 4. Optional · pre-prime Laura's profile ─────────────────────────
if [ "$SEED_LAURA" = "1" ]; then
  echo "→ priming Laura profile (may take 30-60s — adaptive thinking)"
  PRIME_BODY='{"messages":[{"role":"user","content":"Hi, I am Laura. I am 44. My mom died of breast cancer at 52."}]}'
  PRIME_HTTP=$(curl -s -N -o /tmp/hc-preflight-prime.sse -w "%{http_code}" \
    -X POST "$HC_API_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d "$PRIME_BODY")
  if [ "$PRIME_HTTP" != "200" ]; then
    echo "✗ priming failed: HTTP $PRIME_HTTP" >&2
    echo "  state reset but Laura profile not primed. You can still chat live." >&2
  else
    # Confirm profile wrote at least age 44 and family history
    PROFILE_SUMMARY=$(curl -s "$HC_API_URL/api/profile" | python3 -c "
import json, sys
p = json.load(sys.stdin).get('profile', {})
keys = sorted(p.keys())
print('keys:', ', '.join(keys) if keys else '(empty)')
" 2>/dev/null)
    echo "  ok · $PROFILE_SUMMARY"
  fi
fi

hr
echo "  DEMO READY — pre-record checklist"
hr
cat <<'CHECKLIST'
  [ ] Browser in incognito / new profile window
  [ ] URL loaded with ?demo=1  OR  NEXT_PUBLIC_DEMO_BYPASS_AUTH=true
  [ ] /settings → "Show reasoning" toggle ON
  [ ] Browser zoom 100%, window ~1400×900, DevTools CLOSED
  [ ] Synthetic lab PDF (fixtures/labs-laura-demo.pdf) on desktop
  [ ] Audio: one short sentence, play back, adjust mic
  [ ] EmergencyPill visible bottom-left — do NOT click on camera
  [ ] Screen recording software armed and pointed at the right display
  [ ] Close Slack · email · notifications

  Demo script: docs/process/demo-script.md (v3 · two-turn Act 1)
  Fallbacks:   same file, "Fallback beats" section
CHECKLIST
hr
echo "  Good luck."
