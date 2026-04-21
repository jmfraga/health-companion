"""Application settings loaded from environment."""

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Health Companion API"
    environment: str = Field(default="development")
    debug: bool = Field(default=True)

    database_url: str = Field(default="postgresql+psycopg://localhost/health_companion")

    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")
    supabase_service_role_key: str = Field(default="")
    supabase_jwt_secret: str = Field(default="")

    anthropic_api_key: str = Field(default="")
    anthropic_beta_header: str = Field(default="managed-agents-2026-04-01")

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])


@lru_cache
def get_settings() -> Settings:
    return Settings()
