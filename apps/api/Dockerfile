# syntax=docker/dockerfile:1.6
# Health Companion — API (FastAPI) container.
# Designed for Fly.io single-machine deployment. State is in-memory, so
# no persistent volume is required for the hackathon MVP.

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# uv is the package manager this project uses — install via the official
# slim binary so we don't need the whole toolchain image.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

# Install deps first (without building the project itself) so the dep
# layer caches across source changes. Then copy source and install the
# project. pyproject.toml uses uv_build as the backend, which expects
# src/api/__init__.py to exist — that's only true after the src copy.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src
RUN uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:$PATH" \
    PORT=8080

EXPOSE 8080

# Fly.io sends SIGINT on deploy rollovers; uvicorn handles it cleanly.
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
