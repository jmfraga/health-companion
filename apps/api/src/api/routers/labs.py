"""Multimodal lab-PDF ingestion endpoint.

Streams SSE events while Opus 4.7 reads the uploaded PDF directly (no local
OCR). The orchestrator may call ``log_biomarker`` and ``save_profile_field``
as it extracts values, and is forced to commit the final structured
``LabAnalysis`` via a dedicated ``submit_lab_analysis`` tool.
"""

from __future__ import annotations

import base64
import json
from collections.abc import AsyncIterator
from typing import Any

from anthropic import AsyncAnthropic
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import StreamingResponse

from api.agents.runner import MODEL, SYSTEM_PROMPT, _serialize_block
from api.agents.tools import execute_tool, get_biomarkers, get_profile
from api.config import get_settings
from api.schemas.lab import LabAnalysis

router = APIRouter(prefix="/api", tags=["labs"])


MAX_TOKENS = 8192
THINKING_EFFORT = "max"


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
) -> AsyncIterator[dict[str, Any]]:
    """Drive one streamed turn, yielding event dicts.

    Appends the assistant turn to ``messages`` on completion. Terminal events
    yielded by this coroutine:
    - ``{"type": "_turn_complete", "tool_uses": [...], "final": <msg>}``

    All other events match the shapes the frontend already consumes from
    ``/api/chat``.
    """
    pending_tool_uses: list[dict[str, Any]] = []
    current_tool_use: dict[str, Any] | None = None
    in_thinking_block = False

    kwargs: dict[str, Any] = dict(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        thinking={"type": "adaptive", "display": "summarized"},
        output_config={"effort": THINKING_EFFORT},
        system=SYSTEM_PROMPT,
        tools=tools,
        messages=messages,
    )
    if tool_choice is not None:
        kwargs["tool_choice"] = tool_choice

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
                    # Only surface log_biomarker / save_profile_field as tool_use
                    # events to the UI mid-stream. submit_lab_analysis is the
                    # terminal structured payload and is emitted as a dedicated
                    # `lab_analysis` event by the caller.
                    if current_tool_use["name"] in _LAB_TOOL_NAMES:
                        yield {
                            "type": "tool_use",
                            "id": current_tool_use["id"],
                            "name": current_tool_use["name"],
                            "input": inputs,
                        }
                    current_tool_use = None

        final_message = await stream.get_final_message()

    messages.append(
        {"role": "assistant", "content": [_serialize_block(b) for b in final_message.content]}
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
    pdf_bytes = await file.read()
    pdf_b64 = base64.standard_b64encode(pdf_bytes).decode("ascii")

    profile_snapshot = get_profile()
    profile_blurb = (
        f"Current profile snapshot:\n```json\n{json.dumps(profile_snapshot, indent=2)}\n```"
        if profile_snapshot
        else "The user's profile is currently empty."
    )
    user_note = (
        f"\n\nThe user attached this note with the upload:\n\"{note.strip()}\"" if note else ""
    )

    instruction = f"{_TASK_FRAME}\n\n{profile_blurb}{user_note}"

    content_blocks: list[dict[str, Any]] = [
        {
            "type": "document",
            "source": {
                "type": "base64",
                "media_type": "application/pdf",
                "data": pdf_b64,
            },
        },
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

            # Loop: let the model stream text + call log_biomarker /
            # save_profile_field / submit_lab_analysis freely. If it finishes
            # without submitting the structured analysis, force a final turn
            # with tool_choice pinned to submit_lab_analysis.
            while True:
                tool_uses: list[dict[str, Any]] = []

                async for event in _stream_turn(
                    client,
                    messages,
                    all_tools,
                    tool_choice=(
                        {"type": "tool", "name": "submit_lab_analysis"}
                        if forced_follow_up
                        else None
                    ),
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

            yield _format_sse({"type": "biomarkers_snapshot", "biomarkers": get_biomarkers()})
            yield _format_sse({"type": "profile_snapshot", "profile": get_profile()})
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
