"""Chat endpoint — streams SSE events as the orchestrator runs."""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.agents.runner import run_chat_turn
from api.agents.tools import (
    get_biomarkers,
    get_memory,
    get_profile,
    get_scheduled_screenings,
    get_timeline,
)

router = APIRouter(prefix="/api", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


def _format_sse(event: dict[str, Any]) -> str:
    return f"data: {json.dumps(event)}\n\n"


@router.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    anthropic_messages = [
        {"role": m.role, "content": m.content} for m in request.messages
    ]

    async def event_stream():
        try:
            async for event in run_chat_turn(anthropic_messages):
                # run_chat_turn emits {"type": "done"} as its final event on the
                # happy path. We forward every event including that done, then
                # emit the snapshots, then emit a second done as a safety net so
                # the client always receives done as the last event in the stream
                # regardless of which path the runner took.
                yield _format_sse(event)
        except Exception as exc:
            yield _format_sse({"type": "error", "message": str(exc)})
            yield _format_sse({"type": "done"})
            return
        # Full snapshot at turn close so the UI can reconcile regardless of
        # which tool_use events it missed.
        yield _format_sse({"type": "profile_snapshot", "profile": get_profile()})
        yield _format_sse({"type": "screenings_snapshot", "screenings": get_scheduled_screenings()})
        yield _format_sse({"type": "biomarkers_snapshot", "biomarkers": get_biomarkers()})
        yield _format_sse({"type": "timeline_snapshot", "timeline": get_timeline()})
        yield _format_sse({"type": "memory_snapshot", "memory": get_memory()})
        # Safety-net done: guarantees done is always the last event in the
        # stream. The runner already emits done before returning, but that
        # arrives before the snapshots above. This second done is what the
        # client should treat as the true end-of-stream sentinel.
        yield _format_sse({"type": "done"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/profile")
async def read_profile() -> dict[str, Any]:
    return {"profile": get_profile()}


@router.get("/screenings")
async def read_screenings() -> dict[str, Any]:
    return {"screenings": get_scheduled_screenings()}


@router.get("/memory")
async def read_memory() -> dict[str, Any]:
    return {"memory": get_memory()}


@router.get("/biomarkers")
async def read_biomarkers() -> dict[str, Any]:
    return {"biomarkers": get_biomarkers()}


@router.get("/timeline")
async def read_timeline() -> dict[str, Any]:
    return {"timeline": get_timeline()}
