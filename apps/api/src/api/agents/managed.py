"""Idempotent registry for the Managed Agent used by the proactive engine.

One Claude Managed Agent + one Environment are created once per deployment and
then reused across every proactive session. Their IDs are cached in a small
JSON file (``.managed_agents_cache.json`` at the ``apps/api`` root) so a hot
reload or a fresh process does not burn Create-API calls on each boot.

To force a rebuild (after editing the agent prompt, switching models, etc.):

    rm apps/api/.managed_agents_cache.json

The next call to :func:`get_or_create_proactive_agent` /
:func:`get_or_create_environment` will provision fresh resources and write
their IDs back to the cache.

Notes
-----
- SDK surface (confirmed on ``anthropic==0.96.0``):
    ``client.beta.agents.create / retrieve``
    ``client.beta.environments.create / retrieve``
    ``client.beta.sessions.create``
    ``client.beta.sessions.events.send / stream``
  The SDK injects the ``anthropic-beta: managed-agents-2026-04-01`` header
  automatically when any ``client.beta.*`` method is invoked.
- We deliberately pass ``agent_toolset_20260401`` (the pre-built toolset —
  bash, files, web, etc.) even though the first iteration of the proactive
  engine does not lean on external tools. The state snapshot travels in the
  opening ``user.message``. The toolset is available if the agent decides it
  needs to, say, fetch a guideline page on the web in a later iteration.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

from anthropic import Anthropic

from api.agents.runner import SYSTEM_PROMPT
from api.config import get_settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------


AGENT_NAME = "health-companion-proactive"
ENVIRONMENT_NAME = "health-companion-proactive-env"
MODEL = "claude-opus-4-7"

# The Managed Agents pre-built toolset (bash + file ops + web search/fetch).
# See https://platform.claude.com/docs/en/managed-agents/tools
AGENT_TOOLSET: list[dict[str, Any]] = [{"type": "agent_toolset_20260401"}]

# ``apps/api`` root — the cache file lives next to ``pyproject.toml``.
_API_ROOT = Path(__file__).resolve().parents[3]
CACHE_PATH = _API_ROOT / ".managed_agents_cache.json"


# ---------------------------------------------------------------------------
# Proactive task frame — prepended to the orchestrator system prompt
# ---------------------------------------------------------------------------


PROACTIVE_TASK_FRAME = """\
# Proactive Outreach Mode — Managed Agents Runtime

You are running as a background Managed Agents session, not in a live chat.
The user cannot reply to this turn. Your single job is to compose one
proactive outreach message to them, grounded in the structured state that
will be passed to you in the first user event.

The state event carries:
- ``profile`` — the canonical health profile (age, sex, family history, etc.)
- ``scheduled_screenings`` — preventive checks already on the calendar
- ``biomarkers`` — lab values on file with dates and sources
- ``memory`` — the episodic + semantic memory the companion curated
- ``months_later`` — how many simulated months have passed since the last turn
- ``future_date`` — the in-story date for this message

What to produce
---------------

A single short outreach. Two to four sentences. Warm, grounded, unhurried —
the voice the system prompt already defines. The whole point of this message
is that you remember: reference at least one concrete prior detail (a family
history concern, a pending screening that is now timely, a lab value worth
circling back on, a fact the user told you that still matters).

Then suggest the single most timely next step — usually a screening coming
due, or a follow-up the passage of time makes relevant. End with one calm
line referring them to their doctor. Do not stack disclaimers. Do not
moralize. Do not open with "Just checking in" — that is the empty voice of
a chatbot. Speak like someone who actually knows them.

Do not use their name more than once.

Output contract — strict
------------------------

Emit a single ``agent.message`` whose content is a JSON object wrapped in
a fenced ``json`` code block, with exactly these keys:

```json
{
  "text": "<the 2-4 sentence outreach>",
  "context_refs": ["snake_case_ids", "of_concrete_facts_you_leaned_on"],
  "next_step": "<one-line suggestion for the most timely next action>"
}
```

``context_refs`` must be short snake_case identifiers like
``family_history_breast_cancer_mother``, ``pending_screening_mammography``,
``fasting_glucose_118_trend``. These drive the timeline card.

Do not call any tools. Do not run code, bash, or web search for this turn —
everything you need is in the state event. After you emit the JSON object,
the session will go idle. Your system-prompt hard rules still apply: never
diagnose, never prescribe, always refer.
"""


# Composed system prompt — proactive frame, then the full orchestrator voice.
PROACTIVE_SYSTEM_PROMPT = f"{PROACTIVE_TASK_FRAME}\n\n---\n\n{SYSTEM_PROMPT}"


# ---------------------------------------------------------------------------
# Cache I/O
# ---------------------------------------------------------------------------


def _load_cache() -> dict[str, str]:
    if not CACHE_PATH.exists():
        return {}
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("managed-agents cache unreadable (%s); ignoring", exc)
        return {}


def _save_cache(cache: dict[str, str]) -> None:
    try:
        CACHE_PATH.write_text(json.dumps(cache, indent=2), encoding="utf-8")
    except OSError as exc:
        logger.warning("failed to write managed-agents cache: %s", exc)


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------


def _client() -> Anthropic:
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set — Managed Agents cannot create resources."
        )
    # The SDK injects the ``anthropic-beta: managed-agents-2026-04-01`` header
    # automatically for any ``client.beta.*`` call.
    return Anthropic(api_key=settings.anthropic_api_key)


def _skip_create() -> bool:
    """Dry-run gate.

    Respects two env flags so the caller can keep development cost-free:

    - ``HC_SKIP_MANAGED_AGENTS_CREATE=1`` — skip resource creation entirely.
    - ``DRY_RUN=1`` — same, for convenience.
    """
    return bool(
        os.environ.get("HC_SKIP_MANAGED_AGENTS_CREATE")
        or os.environ.get("DRY_RUN")
    )


# ---------------------------------------------------------------------------
# Public registry
# ---------------------------------------------------------------------------


def get_or_create_proactive_agent() -> str:
    """Return the Managed Agent ID, provisioning it if it does not exist.

    Caches to :data:`CACHE_PATH`. Safe to call on every request.
    """
    cache = _load_cache()
    if "agent_id" in cache:
        return cache["agent_id"]

    if _skip_create():
        raise RuntimeError(
            "HC_SKIP_MANAGED_AGENTS_CREATE is set and no cached agent exists. "
            "Unset the flag and re-run to provision the Managed Agent."
        )

    client = _client()
    agent = client.beta.agents.create(
        name=AGENT_NAME,
        model=MODEL,
        system=PROACTIVE_SYSTEM_PROMPT,
        tools=AGENT_TOOLSET,
    )
    cache["agent_id"] = agent.id
    cache["agent_version"] = str(getattr(agent, "version", ""))
    _save_cache(cache)
    logger.info(
        "managed-agent provisioned: id=%s version=%s", agent.id, cache["agent_version"]
    )
    return agent.id


def get_or_create_environment() -> str:
    """Return the Managed Agents Environment ID, provisioning it if needed."""
    cache = _load_cache()
    if "environment_id" in cache:
        return cache["environment_id"]

    if _skip_create():
        raise RuntimeError(
            "HC_SKIP_MANAGED_AGENTS_CREATE is set and no cached environment exists. "
            "Unset the flag and re-run to provision the environment."
        )

    client = _client()
    environment = client.beta.environments.create(
        name=ENVIRONMENT_NAME,
        config={
            "type": "cloud",
            "networking": {"type": "unrestricted"},
        },
    )
    cache["environment_id"] = environment.id
    _save_cache(cache)
    logger.info("managed-agents environment provisioned: id=%s", environment.id)
    return environment.id


def get_cached_ids() -> dict[str, str]:
    """Read-only view of the cache, for debugging / health checks."""
    return _load_cache()
