"""Demo-only helpers — lets a judge land cold and start fresh.

The only endpoint right now is ``POST /api/demo/reset`` which clears every
piece of in-memory state so the next chat turn begins with a blank profile,
empty timeline, no screenings, no biomarkers, no memory. Tied to the
"Start fresh" button in the header. Not meant for production — once the
Supabase persistence lands in Phase 1 the semantics change per-user.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from api.agents.tools import (
    get_biomarkers,
    get_memory,
    get_profile,
    get_scheduled_screenings,
    get_timeline,
    reset_biomarkers,
    reset_memory,
    reset_profile,
    reset_screenings,
    reset_timeline,
)

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post("/reset")
async def reset_all() -> dict[str, Any]:
    """Clear every in-memory store so the next turn is blank-slate."""
    reset_profile()
    reset_screenings()
    reset_memory()
    reset_biomarkers()
    reset_timeline()

    return {
        "ok": True,
        "profile": get_profile(),
        "screenings": get_scheduled_screenings(),
        "biomarkers": get_biomarkers(),
        "timeline": get_timeline(),
        "memory": get_memory(),
    }
