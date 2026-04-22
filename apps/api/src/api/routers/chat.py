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
                yield _format_sse(event)
        except Exception as exc:
            yield _format_sse({"type": "error", "message": str(exc)})
            return
        # Full snapshot at turn close so the UI can reconcile regardless of
        # which tool_use events it missed.
        yield _format_sse({"type": "profile_snapshot", "profile": get_profile()})
        yield _format_sse({"type": "screenings_snapshot", "screenings": get_scheduled_screenings()})
        yield _format_sse({"type": "biomarkers_snapshot", "biomarkers": get_biomarkers()})
        yield _format_sse({"type": "memory_snapshot", "memory": get_memory()})

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
