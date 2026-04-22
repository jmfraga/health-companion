"""`POST /api/simulate-months-later-managed` — proactive engine on Managed Agents.

Sibling to ``simulate.py``. The Messages-API version is preserved unchanged;
this router is the Option-3 migration Juan Manuel voted for on night 2:

    Messages API for the turn you hear.
    Managed Agents for the check-in you receive.

Same SSE contract as the original so the frontend swap is a one-line change:

- ``reasoning_start`` / ``reasoning_delta`` / ``reasoning_stop``
- ``message_delta`` — streamed proactive message text
- ``proactive_message`` — final structured payload for the card
- ``timeline_event`` — appended entry for the HealthTimeline widget
- ``profile_snapshot`` / ``screenings_snapshot`` / ``biomarkers_snapshot`` /
  ``timeline_snapshot`` / ``memory_snapshot`` — end-of-turn reconciliation
- ``done`` / ``error`` — turn lifecycle
"""

from __future__ import annotations

import json
import logging
import re
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from typing import Any

from anthropic import AsyncAnthropic
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from api.agents.managed import (
    PROACTIVE_TASK_FRAME,
    get_or_create_environment,
    get_or_create_proactive_agent,
)
from api.agents.tools import (
    append_timeline_event,
    get_biomarkers,
    get_memory,
    get_profile,
    get_scheduled_screenings,
    get_timeline,
)
from api.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["simulate"])


# ---------------------------------------------------------------------------
# Request schema — mirrors simulate.py
# ---------------------------------------------------------------------------


class SimulateRequest(BaseModel):
    months: int = Field(default=3, ge=1, le=24)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _format_sse(event: dict[str, Any]) -> str:
    return f"data: {json.dumps(event)}\n\n"


def _future_date(months: int) -> str:
    return (datetime.now(UTC).date() + timedelta(days=30 * months)).isoformat()


def _build_state_event_text(
    *,
    months: int,
    future_date: str,
    profile: dict[str, Any],
    screenings: list[dict[str, Any]],
    biomarkers: list[dict[str, Any]],
    memory: dict[str, list[dict[str, Any]]],
) -> str:
    """Assemble the single user-event body the agent will reason over."""
    state = {
        "months_later": months,
        "future_date": future_date,
        "profile": profile,
        "scheduled_screenings": screenings,
        "biomarkers": biomarkers,
        "memory": memory,
    }
    state_json = json.dumps(state, indent=2, ensure_ascii=False)
    return (
        f"{PROACTIVE_TASK_FRAME}\n\n"
        "State snapshot (everything you know about this user as of "
        f"{future_date}, {months} simulated months after the last "
        "conversation):\n\n"
        f"```json\n{state_json}\n```\n\n"
        "Produce the proactive outreach now, following the output contract "
        "above exactly. Remember: one `agent.message` carrying a fenced "
        "`json` block with `text`, `context_refs`, `next_step`. No tool "
        "calls."
    )


_JSON_BLOCK_RE = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)


def _extract_structured_payload(raw_text: str) -> dict[str, Any]:
    """Pull the ``{text, context_refs, next_step}`` object out of a message.

    The agent was instructed to emit a fenced ``json`` block. We try that
    first, then fall back to the first ``{...}`` substring, and finally to
    a plain-text reading. Always returns a dict with all three keys — empty
    strings / lists when extraction fails — so the frontend contract stays
    stable.
    """
    out = {"text": "", "context_refs": [], "next_step": ""}

    match = _JSON_BLOCK_RE.search(raw_text)
    candidate: str | None = match.group(1) if match else None

    if candidate is None:
        # Fallback: greedy first-to-last brace.
        first = raw_text.find("{")
        last = raw_text.rfind("}")
        if first != -1 and last > first:
            candidate = raw_text[first : last + 1]

    if candidate:
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            parsed = None
        if isinstance(parsed, dict):
            out["text"] = str(parsed.get("text", "")).strip()
            refs = parsed.get("context_refs") or []
            if isinstance(refs, list):
                out["context_refs"] = [str(r) for r in refs]
            out["next_step"] = str(parsed.get("next_step", "")).strip()

    if not out["text"]:
        # Last resort: use everything outside any fenced block as the text.
        stripped = _JSON_BLOCK_RE.sub("", raw_text).strip()
        out["text"] = stripped or raw_text.strip()

    return out


# ---------------------------------------------------------------------------
# Event translation — Managed Agents → existing frontend SSE contract
# ---------------------------------------------------------------------------


def _translate_agent_event(
    event: Any,
    *,
    message_text_buffer: list[str],
    reasoning_open_flag: list[bool],
) -> list[dict[str, Any]]:
    """Translate one Managed Agents event to zero or more frontend events.

    Mutates ``message_text_buffer`` and ``reasoning_open_flag`` (used as
    simple 1-slot mutable references) so callers can observe state across
    the stream.
    """
    etype = getattr(event, "type", None)
    out: list[dict[str, Any]] = []

    if etype == "agent.thinking":
        # The SDK may emit thinking blocks once or as deltas. We bracket with
        # reasoning_start / reasoning_stop and surface the text as
        # reasoning_delta so the existing "See reasoning" disclosure works.
        if not reasoning_open_flag[0]:
            out.append({"type": "reasoning_start"})
            reasoning_open_flag[0] = True

        thinking_text = _coerce_thinking_text(event)
        if thinking_text:
            out.append({"type": "reasoning_delta", "text": thinking_text})

    elif etype == "agent.message":
        # Close any open reasoning bracket before streaming user-visible text.
        if reasoning_open_flag[0]:
            out.append({"type": "reasoning_stop"})
            reasoning_open_flag[0] = False

        text = _coerce_message_text(event)
        if text:
            # Buffer the raw text so we can extract the structured payload
            # once the session goes idle. Stream a sanitized version to the
            # client — stripping fenced json blocks would rob the demo of
            # the moment where the message types itself out, so we stream
            # the raw text and let the frontend's existing renderer handle
            # whatever shows up. If/when the frontend wants clean text only,
            # swap to ``_strip_json_fence(text)`` here.
            message_text_buffer.append(text)
            out.append({"type": "message_delta", "text": text})

    # Tool events are informational during this iteration — we don't forward
    # them because the frontend has no widget for Managed Agents tool chatter
    # yet and we explicitly instructed the agent not to use tools. If the
    # agent does fire one, we log it so we notice.
    elif etype in {"agent.tool_use", "agent.tool_result"}:
        logger.debug("managed-agents unexpected tool event: %s", etype)

    elif etype == "session.error":
        err_msg = "unknown"
        err = getattr(event, "error", None)
        if err is not None:
            err_msg = getattr(err, "message", None) or str(err)
        out.append({"type": "error", "message": f"managed-agents: {err_msg}"})

    return out


def _coerce_thinking_text(event: Any) -> str:
    """Extract a best-effort text string from a thinking event.

    The beta SDK object shape may be one of several things across minor
    versions — we try a few attributes before giving up.
    """
    for attr in ("thinking", "text", "summary"):
        val = getattr(event, attr, None)
        if isinstance(val, str) and val:
            return val
    content = getattr(event, "content", None)
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            btext = getattr(block, "text", None) or getattr(block, "thinking", None)
            if isinstance(btext, str):
                parts.append(btext)
        return "".join(parts)
    return ""


def _coerce_message_text(event: Any) -> str:
    """Extract text from an ``agent.message`` event's content blocks."""
    content = getattr(event, "content", None)
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            btype = getattr(block, "type", None)
            if btype == "text":
                t = getattr(block, "text", None)
                if isinstance(t, str):
                    parts.append(t)
            elif btype is None and isinstance(block, dict) and block.get("type") == "text":
                parts.append(str(block.get("text", "")))
        return "".join(parts)
    if isinstance(content, str):
        return content
    return ""


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/simulate-months-later-managed")
async def simulate_months_later_managed(
    request: SimulateRequest | None = None,
) -> StreamingResponse:
    months = request.months if request is not None else 3

    profile = get_profile()
    screenings = get_scheduled_screenings()
    biomarkers = get_biomarkers()
    memory = get_memory()

    state_is_empty = (
        not profile
        and not screenings
        and not biomarkers
        and not memory["episodic"]
        and not memory["semantic"]
    )

    future_date = _future_date(months)

    async def event_stream() -> AsyncIterator[str]:
        if state_is_empty:
            yield _format_sse(
                {
                    "type": "error",
                    "message": "no state yet — talk to the companion first",
                }
            )
            yield _format_sse({"type": "done"})
            return

        message_text_buffer: list[str] = []
        reasoning_open_flag: list[bool] = [False]

        try:
            agent_id = get_or_create_proactive_agent()
            environment_id = get_or_create_environment()

            settings = get_settings()
            client = AsyncAnthropic(api_key=settings.anthropic_api_key)

            session = await client.beta.sessions.create(
                agent=agent_id,
                environment_id=environment_id,
                title=f"Proactive outreach — {future_date}",
            )
            session_id = session.id

            state_event_text = _build_state_event_text(
                months=months,
                future_date=future_date,
                profile=profile,
                screenings=screenings,
                biomarkers=biomarkers,
                memory=memory,
            )

            # Per the docs: open the stream first, THEN send the user event.
            # Only events after stream attachment are delivered.
            async with client.beta.sessions.events.stream(session_id) as stream:
                await client.beta.sessions.events.send(
                    session_id,
                    events=[
                        {
                            "type": "user.message",
                            "content": [
                                {"type": "text", "text": state_event_text}
                            ],
                        }
                    ],
                )

                async for event in stream:
                    etype = getattr(event, "type", None)

                    for out in _translate_agent_event(
                        event,
                        message_text_buffer=message_text_buffer,
                        reasoning_open_flag=reasoning_open_flag,
                    ):
                        yield _format_sse(out)

                    if etype == "session.status_idle":
                        break
                    if etype == "session.status_terminated":
                        yield _format_sse(
                            {
                                "type": "error",
                                "message": "managed-agents session terminated",
                            }
                        )
                        break

            # Close any reasoning bracket left hanging.
            if reasoning_open_flag[0]:
                yield _format_sse({"type": "reasoning_stop"})
                reasoning_open_flag[0] = False

            raw_text = "".join(message_text_buffer)
            payload = _extract_structured_payload(raw_text)
            final_text = payload["text"]
            context_refs: list[str] = payload["context_refs"]
            next_step: str = payload["next_step"]

            yield _format_sse(
                {
                    "type": "proactive_message",
                    "months_later": months,
                    "text": final_text,
                    "context_refs": context_refs,
                    "next_step": next_step,
                }
            )

            timeline_payload = {
                "text": final_text,
                "context_refs": context_refs,
                "next_step": next_step,
                "months_later": months,
            }
            timeline_entry = append_timeline_event(
                "proactive_message", timeline_payload, future_date
            )
            yield _format_sse({"type": "timeline_event", **timeline_entry})

            yield _format_sse({"type": "profile_snapshot", "profile": get_profile()})
            yield _format_sse(
                {
                    "type": "screenings_snapshot",
                    "screenings": get_scheduled_screenings(),
                }
            )
            yield _format_sse(
                {"type": "biomarkers_snapshot", "biomarkers": get_biomarkers()}
            )
            yield _format_sse({"type": "timeline_snapshot", "timeline": get_timeline()})
            yield _format_sse({"type": "memory_snapshot", "memory": get_memory()})
            yield _format_sse({"type": "done"})

        except Exception as exc:
            logger.exception("simulate-months-later-managed failed")
            if reasoning_open_flag[0]:
                yield _format_sse({"type": "reasoning_stop"})
            yield _format_sse({"type": "error", "message": str(exc)})

            # Best-effort fallback: emit whatever we streamed as a minimal
            # proactive_message so the frontend has something to render.
            fallback_raw = "".join(message_text_buffer).strip()
            if fallback_raw:
                fallback_payload = _extract_structured_payload(fallback_raw)
                yield _format_sse(
                    {
                        "type": "proactive_message",
                        "months_later": months,
                        "text": fallback_payload["text"],
                        "context_refs": fallback_payload["context_refs"],
                        "next_step": fallback_payload["next_step"],
                        "fallback": True,
                    }
                )
            yield _format_sse({"type": "done"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
