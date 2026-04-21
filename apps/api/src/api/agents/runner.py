"""Opus 4.7 orchestrator runner.

Async generator that drives a chat turn end-to-end: streams text deltas,
captures tool-use blocks, executes them, and loops until the model stops
calling tools. Yields small JSON-serializable dicts that the HTTP layer
formats as Server-Sent Events.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

from anthropic import AsyncAnthropic

from api.agents.tools import TOOLS, execute_tool
from api.config import get_settings


SYSTEM_PROMPT = """\
You are Health Companion — a warm, knowledgeable friend who helps the user \
stay healthy. Not a chatbot, not a doctor. A companion.

Rules:
- Never diagnose. Never prescribe. Always refer the user to their doctor for \
anything clinical.
- Ask one thing at a time. Keep replies short and warm.
- As you learn about the user (age, sex, family history, habits, concerns), \
call the save_profile_field tool to record it. Do it naturally as it comes up. \
Never make the conversation feel like a form.
- Default language: English for now.
"""


MODEL = "claude-opus-4-7"
MAX_TOKENS = 2048


def _serialize_block(block: Any) -> dict[str, Any]:
    """Round-trip a streamed content block into the shape the API accepts as input.

    The SDK's ``model_dump`` leaks fields (``parsed_output``, etc.) that the
    Messages API rejects when replayed as the assistant turn. We keep only the
    fields needed for each known block type.
    """
    btype = block.type
    if btype == "text":
        return {"type": "text", "text": block.text}
    if btype == "tool_use":
        return {
            "type": "tool_use",
            "id": block.id,
            "name": block.name,
            "input": block.input,
        }
    if btype == "thinking":
        out = {"type": "thinking", "thinking": block.thinking}
        signature = getattr(block, "signature", None)
        if signature is not None:
            out["signature"] = signature
        return out
    raise ValueError(f"Unexpected content block type on assistant turn: {btype}")


async def run_chat_turn(messages: list[dict[str, Any]]) -> AsyncIterator[dict[str, Any]]:
    """Yield event dicts describing a full chat turn.

    The event shapes:
    - ``{"type": "message_delta", "text": "..."}`` — streamed assistant text.
    - ``{"type": "tool_use", "id": "...", "name": "...", "input": {...}}`` — tool call.
    - ``{"type": "tool_result", "id": "...", "output": {...}}`` — tool result.
    - ``{"type": "done"}`` — end of turn.
    - ``{"type": "error", "message": "..."}`` — surfaced errors.

    ``messages`` is mutated as the loop runs (assistant + user tool_result turns appended).
    """
    settings = get_settings()
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    while True:
        pending_tool_uses: list[dict[str, Any]] = []
        current_tool_use: dict[str, Any] | None = None
        text_buffer: list[str] = []

        async with client.messages.stream(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        ) as stream:
            async for event in stream:
                etype = event.type

                if etype == "content_block_start":
                    block = event.content_block
                    if block.type == "tool_use":
                        current_tool_use = {
                            "id": block.id,
                            "name": block.name,
                            "input_json": "",
                        }
                    else:
                        current_tool_use = None

                elif etype == "content_block_delta":
                    delta = event.delta
                    if delta.type == "text_delta":
                        text_buffer.append(delta.text)
                        yield {"type": "message_delta", "text": delta.text}
                    elif delta.type == "input_json_delta" and current_tool_use:
                        current_tool_use["input_json"] += delta.partial_json

                elif etype == "content_block_stop":
                    if current_tool_use:
                        raw = current_tool_use.pop("input_json") or ""
                        try:
                            inputs = json.loads(raw) if raw else {}
                        except json.JSONDecodeError:
                            inputs = {}
                        current_tool_use["input"] = inputs
                        pending_tool_uses.append(current_tool_use)
                        yield {
                            "type": "tool_use",
                            "id": current_tool_use["id"],
                            "name": current_tool_use["name"],
                            "input": inputs,
                        }
                        current_tool_use = None

            final_message = await stream.get_final_message()

        if not pending_tool_uses:
            yield {"type": "done"}
            return

        messages.append(
            {"role": "assistant", "content": [_serialize_block(b) for b in final_message.content]}
        )

        tool_results: list[dict[str, Any]] = []
        for tu in pending_tool_uses:
            try:
                output = execute_tool(tu["name"], tu["input"])
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tu["id"],
                        "content": json.dumps(output),
                    }
                )
                yield {"type": "tool_result", "id": tu["id"], "output": output}
            except Exception as exc:
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tu["id"],
                        "content": f"Error: {exc}",
                        "is_error": True,
                    }
                )
                yield {"type": "tool_result", "id": tu["id"], "error": str(exc)}

        messages.append({"role": "user", "content": tool_results})
