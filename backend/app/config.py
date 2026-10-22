from pathlib import Path
from typing import Literal

from pydantic import AliasChoices, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env, found relative to this file so the current folder doesn't matter.
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """Configuration from environment variables (or backend/.env)."""

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    database_url: str = "postgresql+psycopg://ala:ala@localhost:5432/ala"
    test_database_url: str = "postgresql+psycopg://ala:ala@localhost:5432/ala_test"
    cors_origins: list[str] = ["http://localhost:5173"]

    # LLM provider: any OpenAI-compatible API. Defaults target OpenRouter.
    llm_provider: str = "openrouter"
    llm_base_url: str = "https://openrouter.ai/api/v1"
    llm_api_key: SecretStr | None = Field(
        default=None, validation_alias=AliasChoices("LLM_API_KEY", "OPENROUTER_API_KEY")
    )
    llm_model: str = "nvidia/nemotron-3.5-super-vl:free"
    # json_schema: strict schema enforced by the provider; json_object: "valid JSON" only;
    # none: rely on the prompt. Our own validation runs in every mode.
    llm_structured_output: Literal["json_schema", "json_object", "none"] = "json_schema"
    llm_timeout_seconds: float = 180  # reasoning models took up to ~85 s for a curriculum
    # Reasoning models think before answering (hidden output tokens = latency). "low" won the
    # Stage 4 card eval (faster and more accurate than the default); None = the model's default.
    llm_reasoning_effort: Literal["off", "minimal", "low", "medium", "high"] | None = "low"
    # A "generating" claim older than this is considered abandoned (e.g. server restarted).
    generation_stale_after_seconds: int = 300
    llm_judge_model: str | None = None  # evals only; defaults to llm_model


settings = Settings()
