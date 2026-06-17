from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    DATABASE_URL: str = (
        "postgresql+psycopg://editmentor:editmentor@db:5432/editmentor"
    )

    @field_validator("DATABASE_URL")
    @classmethod
    def _use_psycopg_driver(cls, v: str) -> str:
        """Managed Postgres (Render/Supabase/Heroku) hands out a
        `postgres://` or `postgresql://` URL. SQLAlchemy + psycopg 3 needs the
        explicit `postgresql+psycopg://` driver prefix, so normalize it here."""
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://"):]
        if v.startswith("postgresql://"):
            v = "postgresql+psycopg://" + v[len("postgresql://"):]
        return v

    # Auth
    JWT_SECRET: str = "dev-secret-change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    AUTH_PROVIDER: str = "local"  # local | clerk
    CLERK_SECRET_KEY: str = ""

    # AI
    AI_PROVIDER: str = "mock"  # mock | openai | claude | gemini
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    ANTHROPIC_MODEL: str = "claude-fable-5"
    GEMINI_MODEL: str = "gemini-2.0-flash"
    VEO_MODEL: str = "veo-3.0-generate-preview"  # text-to-video (paid tier)

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
