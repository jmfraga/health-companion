"""Multimodal lab ingestion endpoint.

Streams SSE events while Opus 4.7 reads an uploaded lab PDF *or* a photo
directly (no local OCR). The orchestrator may call ``log_biomarker`` and
``save_profile_field`` as it extracts values, and is forced to commit the
final structured ``LabAnalysis`` via a dedicated ``submit_lab_analysis``
tool. Four ``phase`` events fire at real transitions so the frontend's
reading animation (``screen-lab.jsx``) is truthful instead of timer-faked.
"""

from __future__ import annotations

import base64
import json
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any

from anthropic import AsyncAnthropic
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import StreamingResponse

from api.agents.runner import (
    MODEL,
    SYSTEM_PROMPT,
    _serialize_assistant_content,
    _serialize_block,  # noqa: F401 — re-exported for any direct callers
)
from api.agents.tools import (
    append_timeline_event,
    execute_tool,
    get_biomarkers,
    get_profile,
    get_timeline,
)
from api.config import get_settings
from api.schemas.lab import LabAnalysis

router = APIRouter(prefix="/api", tags=["labs"])


MAX_TOKENS = 24576
THINKING_EFFORT = "high"

# Accepted non-PDF uploads — images the user snaps of a lab printout, a
# bathroom scale, a BP monitor, a pulse oximeter, a glucometer, a
# thermometer, or a non-syncing watch face. HEIC lands here because iPhone
# defaults still produce it. Opus 4.7 reads all of these as ``image`` blocks.
_IMAGE_MIME_TYPES = frozenset(
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
    }
)
_PDF_MIME_TYPE = "application/pdf"


# ---------------------------------------------------------------------------
# Tool schemas
# ---------------------------------------------------------------------------

# Only the two tools the model may call mid-stream while reading the PDF.
# We deliberately do NOT expose schedule_screening / remember /
# fetch_guidelines here — Act 2's wow moment is the lab read itself.
_LAB_TOOL_NAMES = {"log_biomarker", "save_profile_field"}


def _lab_analysis_tool() -> dict[str, Any]:
    """Build the ``submit_lab_analysis`` tool from the Pydantic schema."""
    schema = LabAnalysis.model_json_schema()
    # Anthropic's Messages API accepts standard JSON Schema including $defs/$ref.
    return {
        "name": "submit_lab_analysis",
        "description": (
            "Submit the final, structured analysis of the uploaded lab report. "
            "Call this exactly once, at the end, after you have logged every "
            "biomarker via log_biomarker and saved any profile-level facts via "
            "save_profile_field. The panel_summary field must be two or three "
            "short paragraphs in plain English, tuned to the user's profile, "
            "and must end with a calm referral to their doctor. Never use the "
            "word 'diagnosis'."
        ),
        "input_schema": schema,
    }


def _extraction_tools() -> list[dict[str, Any]]:
    """Import live copies of the two global tools we expose for extraction."""
    from api.agents.tools import TOOLS  # local import: avoid circular at load

    return [t for t in TOOLS if t["name"] in _LAB_TOOL_NAMES]


# ---------------------------------------------------------------------------
# Prompt scaffolding
# ---------------------------------------------------------------------------

_TASK_FRAME = """\
You are analyzing a lab report the user just uploaded. Read the attached PDF
directly — you do not need any OCR output, your own vision handles it. Your
job on this turn:

1. Extract every numeric biomarker you can read (fasting glucose, HbA1c,
   lipid panel, CBC, etc.). For each one, call `log_biomarker` with the
   canonical snake_case name, the numeric value, the unit as printed, the
   sample date if visible on the report (ISO 8601, YYYY-MM-DD), and
   `source="lab_report"`. One call per distinct value. Do this before you
   write your narrative.

2. If the report reveals a durable profile fact that the user's profile
   does not yet have (e.g. the report confirms sex, a specific chronic
   condition noted by the lab, a weight), call `save_profile_field` for
   it with `source="lab"`. Do not over-reach.

3. Once every value is logged, write a short plain-English narrative for
   the user — reflect, translate any jargon, contextualize against the
   profile, refer to their doctor. Stream this as normal text. Keep it
   warm, unhurried, not alarmist. This narrative is shown to the user
   verbatim, so speak to them.

4. When the narrative is done, call `submit_lab_analysis` exactly once
   with the full structured analysis. The `panel_summary` field of that
   call should be a fuller two-or-three-paragraph write-up in the same
   voice — the UI may render either that or the streamed narrative.

Hard rules from your system prompt still apply. Never diagnose, never
prescribe, always refer, escalate red flags with calm directness.
"""


# Appended to _TASK_FRAME only when the upload is an image, so the model
# knows it may be reading a device display instead of a PDF report. Equity
# thread per `ROADMAP.md` §5 Modalities: the user should not need a
# $300 connected scale — point the camera at the bathroom scale they
# already own and the value lands in `log_biomarker` with `source="photo"`.
_PHOTO_TASK_FRAME_ADDENDUM = """\

You are reading a photograph the user took with their phone. The image may
show a health device display — a bathroom scale, an upper-arm or wrist
blood-pressure monitor, a pulse oximeter, a glucometer, a thermometer, the
face of a non-syncing fitness watch — or a physical lab-report printout.
Identify the device or the report type. If it is a device, read the value
exactly as shown and log it via `log_biomarker` with `source="photo"`. If
it is a paper lab printout, treat it the same way you would a PDF lab
report. Never guess a value you cannot read clearly in the photo. If the
image is too blurry or cropped to read with confidence, say so and ask the
user for a clearer shot — do not fabricate.
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _format_sse(event: dict[str, Any]) -> str:
    return f"data: {json.dumps(event)}\n\n"


async def _stream_turn(
    client: AsyncAnthropic,
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]],
    *,
    tool_choice: dict[str, Any] | None = None,
    phases_emitted: dict[str, bool] | None = None,
) -> AsyncIterator[dict[str, Any]]:
    """Drive one streamed turn, yielding event dicts.

    Appends the assistant turn to ``messages`` on completion. Terminal events
    yielded by this coroutine:
    - ``{"type": "_turn_complete", "tool_uses": [...], "final": <msg>}``

    All other events match the shapes the frontend already consumes from
    ``/api/chat``.

    ``phases_emitted`` is a shared dict whose keys are the four phase names
    (``opening_pdf``, ``extracting_values``, ``cross_referencing``,
    ``drafting_response``); each is flipped to ``True`` the first time its
    event fires. This lets the outer event loop share state across the free
    turn and the optional forced-submit turn, so phase events never
    double-fire.
    """
    pending_tool_uses: list[dict[str, Any]] = []
    current_tool_use: dict[str, Any] | None = None
    in_thinking_block = False
    phases = phases_emitted if phases_emitted is not None else {}

    kwargs: dict[str, Any] = dict(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        tools=tools,
        messages=messages,
    )
    if tool_choice is not None:
        # Anthropic rejects thinking + forced tool_choice in the same request.
        # The forced turn is a pure structured-output emission — no reasoning
        # needed. The reasoning already streamed during the free turn.
        kwargs["tool_choice"] = tool_choice
    else:
        kwargs["thinking"] = {"type": "adaptive", "display": "summarized"}
        kwargs["output_config"] = {"effort": THINKING_EFFORT}

    # Phase 1/4 — opening_pdf. Fires right before the model is asked to read
    # the document/image, i.e. before any tokens come back from the API. Kept
    # at the very top of the first turn and guarded for the forced second
    # turn. Event name is stable across PDF and image paths so the frontend's
    # step copy ("Opening the PDF multimodally") keeps working without a
    # rewrite; see the contract note in the task brief.
    if not phases.get("opening_pdf"):
        phases["opening_pdf"] = True
        yield {"type": "phase", "phase": "opening_pdf"}

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
                    # Phase 4/4 — drafting_response. First text token is the
                    # honest signal that narrative generation has begun. Fires
                    # BEFORE the message_delta yield so the UI observes the
                    # phase transition before the first prose character.
                    if not phases.get("drafting_response"):
                        phases["drafting_response"] = True
                        yield {"type": "phase", "phase": "drafting_response"}
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
                    tool_name = current_tool_use["name"]

                    # Phase 2/4 — extracting_values fires the first time the
                    # model closes a log_biomarker tool_use block. Phase 3/4 —
                    # cross_referencing fires the first time save_profile_field
                    # closes (source="lab" / "inferred" is the model
                    # acknowledging profile context while reading the labs;
                    # that IS the cross-reference moment). Both are emitted
                    # BEFORE the per-block `tool_use` UI event so the phase
                    # banner updates a tick before the pill flashes.
                    if tool_name == "log_biomarker" and not phases.get("extracting_values"):
                        phases["extracting_values"] = True
                        yield {"type": "phase", "phase": "extracting_values"}
                    elif tool_name == "save_profile_field" and not phases.get(
                        "cross_referencing"
                    ):
                        phases["cross_referencing"] = True
                        yield {"type": "phase", "phase": "cross_referencing"}

                    # Only surface log_biomarker / save_profile_field as tool_use
                    # events to the UI mid-stream. submit_lab_analysis is the
                    # terminal structured payload and is emitted as a dedicated
                    # `lab_analysis` event by the caller.
                    if tool_name in _LAB_TOOL_NAMES:
                        yield {
                            "type": "tool_use",
                            "id": current_tool_use["id"],
                            "name": tool_name,
                            "input": inputs,
                        }
                    current_tool_use = None

        final_message = await stream.get_final_message()

    # Reconcile: every tool_use in final_message must be represented in
    # pending_tool_uses so the caller can emit a tool_result for each. The
    # stream-event parser can miss a block in edge cases; final_message is
    # the authoritative source.
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
    }


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/ingest-pdf")
async def ingest_pdf(
    file: UploadFile = File(...),  # noqa: B008 — FastAPI marker
    note: str | None = Form(default=None),
) -> StreamingResponse:
    raw_bytes = await file.read()
    content_type = (file.content_type or "").lower()

    is_pdf = content_type == _PDF_MIME_TYPE
    is_image = content_type in _IMAGE_MIME_TYPES

    # Unsupported MIME: surface the error through the SSE stream — the
    # endpoint's contract is event-stream-only and the frontend already
    # renders a soft `error` strip. Raising HTTP 400 here would break that.
    if not is_pdf and not is_image:
        async def unsupported_stream() -> AsyncIterator[str]:
            yield _format_sse({"type": "error", "message": "unsupported_file_type"})
            yield _format_sse({"type": "done"})

        return StreamingResponse(
            unsupported_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    encoded = base64.standard_b64encode(raw_bytes).decode("ascii")

    profile_snapshot = get_profile()
    profile_blurb = (
        f"Current profile snapshot:\n```json\n{json.dumps(profile_snapshot, indent=2)}\n```"
        if profile_snapshot
        else "The user's profile is currently empty."
    )
    user_note = (
        f"\n\nThe user attached this note with the upload:\n\"{note.strip()}\"" if note else ""
    )

    # Task frame grows a photo-specific addendum on the image path so the
    # model understands it may be reading a bathroom scale, a BP cuff, an
    # oximeter, a glucometer, a thermometer, a watch face, or a paper lab
    # printout — and logs device readings via log_biomarker source="photo".
    task_frame = _TASK_FRAME
    if is_image:
        task_frame = f"{_TASK_FRAME}{_PHOTO_TASK_FRAME_ADDENDUM}"

    instruction = f"{task_frame}\n\n{profile_blurb}{user_note}"

    if is_pdf:
        media_block: dict[str, Any] = {
            "type": "document",
            "source": {
                "type": "base64",
                "media_type": _PDF_MIME_TYPE,
                "data": encoded,
            },
        }
    else:
        media_block = {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": content_type,
                "data": encoded,
            },
        }

    content_blocks: list[dict[str, Any]] = [
        media_block,
        {"type": "text", "text": instruction},
    ]

    messages: list[dict[str, Any]] = [{"role": "user", "content": content_blocks}]

    settings = get_settings()
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    extraction_tools = _extraction_tools()
    submit_tool = _lab_analysis_tool()
    all_tools = [*extraction_tools, submit_tool]

    async def event_stream() -> AsyncIterator[str]:
        try:
            submitted_analysis: dict[str, Any] | None = None
            forced_follow_up = False
            # Shared phase state across the free turn and the optional
            # forced-submit turn. Each phase fires at most once per request.
            phases_emitted: dict[str, bool] = {}

            # Loop: let the model stream text + call log_biomarker /
            # save_profile_field / submit_lab_analysis freely. If it finishes
            # without submitting the structured analysis, force a final turn
            # with tool_choice pinned to submit_lab_analysis.
            while True:
                tool_uses: list[dict[str, Any]] = []

                # Fallback for phase 3/4 (cross_referencing): if the model
                # never called save_profile_field during the free turn, fire
                # the phase event right before the forced-submit turn begins
                # so the UI still completes the reading animation. Guarded
                # via the shared dict so we never double-fire.
                if forced_follow_up and not phases_emitted.get("cross_referencing"):
                    phases_emitted["cross_referencing"] = True
                    yield _format_sse({"type": "phase", "phase": "cross_referencing"})

                async for event in _stream_turn(
                    client,
                    messages,
                    all_tools,
                    tool_choice=(
                        {"type": "tool", "name": "submit_lab_analysis"}
                        if forced_follow_up
                        else None
                    ),
                    phases_emitted=phases_emitted,
                ):
                    if event["type"] == "_turn_complete":
                        tool_uses = event["tool_uses"]
                    else:
                        yield _format_sse(event)

                # Handle tool calls from this turn.
                tool_results: list[dict[str, Any]] = []
                saw_submit = False
                for tu in tool_uses:
                    if tu["name"] == "submit_lab_analysis":
                        saw_submit = True
                        submitted_analysis = tu["input"]
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tu["id"],
                                "content": json.dumps({"ok": True}),
                            }
                        )
                        continue

                    if tu["name"] in _LAB_TOOL_NAMES:
                        try:
                            output = execute_tool(tu["name"], tu["input"])
                            tool_results.append(
                                {
                                    "type": "tool_result",
                                    "tool_use_id": tu["id"],
                                    "content": json.dumps(output),
                                }
                            )
                            yield _format_sse(
                                {
                                    "type": "tool_result",
                                    "id": tu["id"],
                                    "output": output,
                                }
                            )
                        except Exception as exc:
                            tool_results.append(
                                {
                                    "type": "tool_result",
                                    "tool_use_id": tu["id"],
                                    "content": f"Error: {exc}",
                                    "is_error": True,
                                }
                            )
                            yield _format_sse(
                                {
                                    "type": "tool_result",
                                    "id": tu["id"],
                                    "error": str(exc),
                                }
                            )

                if saw_submit and submitted_analysis is not None:
                    break

                if tool_results:
                    # Feed tool results back, continue the conversation.
                    messages.append({"role": "user", "content": tool_results})
                    continue

                # No tool calls this turn. If we haven't been forced yet, do so.
                if not forced_follow_up:
                    messages.append(
                        {
                            "role": "user",
                            "content": (
                                "Good. Now call submit_lab_analysis with the full "
                                "structured analysis of this report."
                            ),
                        }
                    )
                    forced_follow_up = True
                    continue

                # Forced turn somehow produced no submission — give up cleanly.
                break

            if submitted_analysis is not None:
                yield _format_sse(
                    {"type": "lab_analysis", "analysis": submitted_analysis}
                )

                # Timeline entry — one event per successful lab ingest so the
                # HealthTimeline widget shows lab uploads alongside other beats.
                today = datetime.now(UTC).date().isoformat()
                occurred_on = (
                    submitted_analysis.get("drawn_on")
                    or submitted_analysis.get("sampled_on")
                    or today
                )
                timeline_payload = {
                    "summary": submitted_analysis.get("panel_summary")
                    or "Lab report ingested.",
                    "laboratory": submitted_analysis.get("laboratory"),
                    "biomarker_count": len(get_biomarkers()),
                    "file_name": file.filename,
                    # Store the full structured analysis so that the chat
                    # orchestrator can hydrate its context from the timeline
                    # on later turns (cross-endpoint memory fix).
                    "analysis": submitted_analysis,
                }
                if note:
                    timeline_payload["note"] = note
                timeline_entry = append_timeline_event(
                    "lab_report", timeline_payload, occurred_on
                )
                yield _format_sse({"type": "timeline_event", **timeline_entry})

            yield _format_sse({"type": "biomarkers_snapshot", "biomarkers": get_biomarkers()})
            yield _format_sse({"type": "profile_snapshot", "profile": get_profile()})
            yield _format_sse({"type": "timeline_snapshot", "timeline": get_timeline()})
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
