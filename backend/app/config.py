from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env, found relative to this file so the current folder doesn't matter.
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """Configuration from environment variables (or backend/.env)."""

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    database_url: str = "postgresql+psycopg://ala:ala@localhost:5432/ala"
    test_database_url: str = "postgresql+psycopg://ala:ala@localhost:5432/ala_test"
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
