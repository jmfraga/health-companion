"""Health check endpoint."""

from fastapi import APIRouter

from api import __version__

router = APIRouter(tags=["meta"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "version": __version__}
