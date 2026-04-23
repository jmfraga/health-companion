"""`POST /api/simulate-months-later` — the Act 2 close.

The companion reaches out proactively, referencing specific things it learned
about the user across Act 1 (onboarding, family history, screenings) and Act 2
(labs, biomarkers). This endpoint is the "memory moat made visible" beat of
the demo: the whole point is that the model cites concrete prior detail, not
generic wellness advice.

Streaming contract matches ``/api/chat`` and ``/api/ingest-pdf``:

- ``reasoning_start`` / ``reasoning_delta`` / ``reasoning_stop``
- ``message_delta`` — proactive message text, token by token
- ``proactive_message`` — final structured payload for the card
- ``timeline_event`` — one event to append to the HealthTimeline
- ``profile_snapshot`` / ``screenings_snapshot`` / ``biomarkers_snapshot`` /
  ``timeline_snapshot`` / ``memory_snapshot`` — end-of-turn reconciliation
- ``done`` — turn lifecycle close
- ``error`` — surfaced soft errors (e.g. empty state)
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from typing import Any

from anthropic import AsyncAnthropic
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from api.agents.runner import (
    MODEL,
    SYSTEM_PROMPT,
    _serialize_assistant_content,
    _serialize_block,  # noqa: F401
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

router = APIRouter(prefix="/api", tags=["simulate"])


MAX_TOKENS = 4096
THINKING_EFFORT = "max"


# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------


class SimulateRequest(BaseModel):
    months: int = Field(default=3, ge=1, le=24)


# ---------------------------------------------------------------------------
# Tool schema — force a structured proactive message
# ---------------------------------------------------------------------------


SUBMIT_PROACTIVE_TOOL: dict[str, Any] = {
    "name": "submit_proactive_message",
    "description": (
        "Submit the final proactive message you want the user to receive. "
        "Call this exactly once, at the end of the turn, after you have "
        "streamed the message body as plain text. The ``text`` field must be "
        "the exact same message body you streamed (2-4 sentences, warm, "
        "clinical voice, referencing at least one specific prior detail). "
        "``context_refs`` must list the concrete prior facts this message "
        "leans on — use short snake_case identifiers like "
        "'family_history_breast_cancer_mother', "
        "'pending_screening_mammography', 'fasting_glucose_118_trend'. "
        "``next_step`` is a one-line suggestion for the most timely action "
        "(a screening, a follow-up, a doctor visit)."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "text": {
                "type": "string",
                "description": (
                    "The 2-4 sentence proactive message, in the clinical "
                    "voice, referencing at least one concrete prior detail."
                ),
            },
            "context_refs": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "snake_case identifiers for the concrete prior facts this "
                    "message leans on."
                ),
            },
            "next_step": {
                "type": "string",
                "description": (
                    "One-line suggestion for the most timely next action."
                ),
            },
        },
        "required": ["text", "context_refs", "next_step"],
    },
}


# ---------------------------------------------------------------------------
# Prompt scaffolding
# ---------------------------------------------------------------------------


def _build_task_frame(
    months: int,
    future_date: str,
    profile: dict[str, Any],
    screenings: list[dict[str, Any]],
    biomarkers: list[dict[str, Any]],
    memory: dict[str, list[dict[str, Any]]],
) -> str:
    """Build the user-turn prompt that triggers the proactive message.

    The frame intentionally does not dictate specific phrasing — the clinical
    voice already lives in ``SYSTEM_PROMPT``. It does ask for reference to
    concrete prior detail, because that is the demo's wow moment.
    """
    profile_json = json.dumps(profile, indent=2, ensure_ascii=False)
    screenings_json = json.dumps(screenings, indent=2, ensure_ascii=False)
    biomarkers_json = json.dumps(biomarkers, indent=2, ensure_ascii=False)
    memory_json = json.dumps(memory, indent=2, ensure_ascii=False)

    return f"""\
Simulated context: it is {months} months after your last conversation with this
user. The date today, in-story, is {future_date}. You have not spoken since.

Here is everything you know about them, as structured state:

Profile:
```json
{profile_json}
```

Scheduled / pending screenings:
```json
{screenings_json}
```

Biomarkers on file:
```json
{biomarkers_json}
```

Episodic and semantic memory:
```json
{memory_json}
```

Your task this turn — a single proactive outreach, not a conversation:

1. Write a short message reaching out to them on your own initiative. Two to
   four sentences. Warm, grounded, unhurried — the voice you already hold. The
   point of this message is that you remember. Reference at least one specific
   thing from the prior conversation (the family-history concern, a pending
   screening that is now timely, a lab value worth circling back on, something
   they told you that still matters).

2. Suggest the single most timely next step — usually a screening coming due,
   or a follow-up that the passage of {months} months makes relevant.

3. End with a gentle referral to their doctor, in one line. Do not stack
   disclaimers. Do not moralize. Do not say "checking in" or "just wanted to
   see how you're doing" — that's the empty voice of a chatbot. Speak like
   someone who actually knows them.

4. Do not use their name more than once in the message.

Stream the message body as plain text first. When the message is complete,
call `submit_proactive_message` exactly once with the same text, the
`context_refs` list (snake_case identifiers for the concrete prior facts you
leaned on), and a one-line `next_step`. Your system-prompt rules still apply:
never diagnose, never prescribe, always refer.
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _format_sse(event: dict[str, Any]) -> str:
    return f"data: {json.dumps(event)}\n\n"


def _future_date(months: int) -> str:
    """Return a simulated future ISO date ``months`` months from today."""
    # 30 days * months is close enough for a demo — don't pull in dateutil.
    future = datetime.now(UTC).date() + timedelta(days=30 * months)
    return future.isoformat()


async def _stream_turn(
    client: AsyncAnthropic,
    messages: list[dict[str, Any]],
    *,
    tool_choice: dict[str, Any] | None = None,
) -> AsyncIterator[dict[str, Any]]:
    """Drive one streamed turn, yielding event dicts.

    Mirrors the helper in ``labs.py`` — kept local so this router doesn't
    reach into another router's private API. Terminal event:
    ``{"type": "_turn_complete", "tool_uses": [...], "text": "...",}``.
    """
    pending_tool_uses: list[dict[str, Any]] = []
    current_tool_use: dict[str, Any] | None = None
    in_thinking_block = False
    text_buffer: list[str] = []

    kwargs: dict[str, Any] = dict(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        tools=[SUBMIT_PROACTIVE_TOOL],
        messages=messages,
    )
    if tool_choice is not None:
        # Anthropic rejects thinking + forced tool_choice in the same request.
        kwargs["tool_choice"] = tool_choice
    else:
        kwargs["thinking"] = {"type": "adaptive", "display": "summarized"}
        kwargs["output_config"] = {"effort": THINKING_EFFORT}

    async with client.messages.stream(**kwargs) as stream:
        async for event in stream:
            etype = event.type

            if etype == "content_block_start":
                block = event.content_block
                in_thinking_block = block.type == "thinking"
                if block.type == "tool_use":
                    current_tool_use = {
                        "id": block.id,
                        "name": block.name,
                        "input_json": "",
                    }
                else:
                    current_tool_use = None
                if in_thinking_block:
                    yield {"type": "reasoning_start"}

            elif etype == "content_block_delta":
                delta = event.delta
                dtype = getattr(delta, "type", None)
                if dtype == "text_delta":
                    text_buffer.append(delta.text)
                    yield {"type": "message_delta", "text": delta.text}
                elif dtype == "thinking_delta":
                    yield {"type": "reasoning_delta", "text": delta.thinking}
                elif dtype == "input_json_delta" and current_tool_use:
                    current_tool_use["input_json"] += delta.partial_json
                elif in_thinking_block:
                    text_val = getattr(delta, "text", None) or getattr(delta, "summary", None)
                    if text_val:
                        yield {"type": "reasoning_delta", "text": text_val}

            elif etype == "content_block_stop":
                if in_thinking_block:
                    yield {"type": "reasoning_stop"}
                    in_thinking_block = False
                if current_tool_use:
                    raw = current_tool_use.pop("input_json") or ""
                    try:
                        inputs = json.loads(raw) if raw else {}
                    except json.JSONDecodeError:
                        inputs = {}
                    current_tool_use["input"] = inputs
                    pending_tool_uses.append(current_tool_use)
                    current_tool_use = None

        final_message = await stream.get_final_message()

    # Reconcile tool_use blocks — stream parser can miss one in edge cases.
    pending_ids = {tu["id"] for tu in pending_tool_uses}
    for block in final_message.content:
        if getattr(block, "type", None) == "tool_use" and block.id not in pending_ids:
            pending_tool_uses.append(
                {
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                }
            )
            pending_ids.add(block.id)

    messages.append(
        {"role": "assistant", "content": _serialize_assistant_content(final_message)}
    )
    yield {
        "type": "_turn_complete",
        "tool_uses": pending_tool_uses,
        "text": "".join(text_buffer),
    }


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/simulate-months-later")
async def simulate_months_later(
    request: SimulateRequest | None = None,
) -> StreamingResponse:
    months = request.months if request is not None else 3

    profile = get_profile()
    screenings = get_scheduled_screenings()
    biomarkers = get_biomarkers()
    memory = get_memory()

    # Always 200; empty state is a soft error.
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

        try:
            instruction = _build_task_frame(
                months=months,
                future_date=future_date,
                profile=profile,
                screenings=screenings,
                biomarkers=biomarkers,
                memory=memory,
            )

            messages: list[dict[str, Any]] = [
                {"role": "user", "content": instruction}
            ]

            settings = get_settings()
            client = AsyncAnthropic(api_key=settings.anthropic_api_key)

            submitted: dict[str, Any] | None = None
            streamed_text = ""
            forced_follow_up = False

            while True:
                tool_uses: list[dict[str, Any]] = []
                turn_text = ""

                async for event in _stream_turn(
                    client,
                    messages,
                    tool_choice=(
                        {"type": "tool", "name": "submit_proactive_message"}
                        if forced_follow_up
                        else None
                    ),
                ):
                    if event["type"] == "_turn_complete":
                        tool_uses = event["tool_uses"]
                        turn_text = event["text"]
                    else:
                        yield _format_sse(event)

                if turn_text:
                    streamed_text += turn_text

                # Collect the submit call if present.
                tool_results: list[dict[str, Any]] = []
                saw_submit = False
                for tu in tool_uses:
                    if tu["name"] == "submit_proactive_message":
                        saw_submit = True
                        submitted = tu["input"]
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tu["id"],
                                "content": json.dumps({"ok": True}),
                            }
                        )

                if saw_submit and submitted is not None:
                    break

                if tool_results:
                    messages.append({"role": "user", "content": tool_results})
                    continue

                # Model finished without submitting — one retry with forced tool.
                if not forced_follow_up:
                    messages.append(
                        {
                            "role": "user",
                            "content": (
                                "Good. Now call submit_proactive_message with "
                                "the exact message text you just wrote, the "
                                "context_refs list, and the next_step."
                            ),
                        }
                    )
                    forced_follow_up = True
                    continue

                break

            # Assemble the final payload. Prefer the streamed text when it's
            # non-empty (that's what the user saw); fall back to the tool's
            # ``text`` when the model forced-called the tool without streaming.
            final_text = streamed_text.strip() or (
                submitted.get("text", "") if submitted else ""
            )
            context_refs: list[str] = (
                list(submitted.get("context_refs", [])) if submitted else []
            )
            next_step: str = (
                submitted.get("next_step", "") if submitted else ""
            )

            proactive_payload = {
                "type": "proactive_message",
                "months_later": months,
                "text": final_text,
                "context_refs": context_refs,
                "next_step": next_step,
            }
            yield _format_sse(proactive_payload)

            # Persist into the timeline so the HealthTimeline widget shows it.
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

            # End-of-turn reconciliation, matching /api/chat and /api/ingest-pdf.
            yield _format_sse({"type": "profile_snapshot", "profile": get_profile()})
            yield _format_sse(
                {"type": "screenings_snapshot", "screenings": get_scheduled_screenings()}
            )
            yield _format_sse(
                {"type": "biomarkers_snapshot", "biomarkers": get_biomarkers()}
            )
            yield _format_sse({"type": "timeline_snapshot", "timeline": get_timeline()})
            yield _format_sse({"type": "memory_snapshot", "memory": get_memory()})
            yield _format_sse({"type": "done"})
        except Exception as exc:
            yield _format_sse({"type": "error", "message": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
