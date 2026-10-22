"""The single place that talks to an LLM provider.

Application code depends on the small `LLMProvider` protocol, not on a vendor SDK.
`OpenAICompatibleProvider` covers OpenRouter, OpenAI and most local servers, so
switching model or provider is a configuration change. Provider failures are
translated into `LLMError` with an application-level code.
"""

import time
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Literal, Protocol

import openai

from app.config import settings

StructuredMode = Literal["json_schema", "json_object", "none"]


@dataclass(frozen=True)
class LLMResponse:
    text: str
    model: str
    input_tokens: int | None
    output_tokens: int | None
    latency_ms: int


class LLMError(Exception):
    """A provider failure, already mapped to an API error code."""

    def __init__(self, code: str, message: str, retryable: bool, status_code: int, detail: str = ""):
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable
        self.status_code = status_code
        self.detail = detail  # for logs only; never shown to users


class LLMProvider(Protocol):
    provider: str
    model: str

    def complete(
        self, messages: list[dict[str, str]], *, json_schema: dict[str, Any] | None, schema_name: str
    ) -> LLMResponse: ...


class OpenAICompatibleProvider:
    def __init__(
        self,
        *,
        provider: str,
        base_url: str,
        api_key: str,
        model: str,
        structured_mode: StructuredMode = "json_schema",
        timeout_seconds: float = 90,
        reasoning_effort: str | None = None,
    ):
        self.provider = provider
        self.model = model
        self.structured_mode = structured_mode
        self.reasoning_effort = reasoning_effort
        # Retries are handled by the caller (repair attempts), not hidden in the SDK.
        self._client = openai.OpenAI(
            base_url=base_url, api_key=api_key, timeout=timeout_seconds, max_retries=0
        )

    def _request_options(self, json_schema: dict[str, Any] | None, schema_name: str) -> dict[str, Any]:
        options: dict[str, Any] = {}
        extra_body: dict[str, Any] = {}
        if json_schema is not None and self.structured_mode == "json_object":
            options["response_format"] = {"type": "json_object"}
        elif json_schema is not None and self.structured_mode == "json_schema":
            options["response_format"] = {
                "type": "json_schema",
                "json_schema": {"name": schema_name, "strict": True, "schema": json_schema},
            }
            if self.provider == "openrouter":
                # Only route to upstream providers that actually honour response_format.
                extra_body["provider"] = {"require_parameters": True}
        if self.reasoning_effort and self.provider == "openrouter":
            extra_body["reasoning"] = (
                {"enabled": False} if self.reasoning_effort == "off" else {"effort": self.reasoning_effort}
            )
        if extra_body:
            options["extra_body"] = extra_body
        return options

    def complete(
        self, messages: list[dict[str, str]], *, json_schema: dict[str, Any] | None, schema_name: str
    ) -> LLMResponse:
        started = time.perf_counter()
        try:
            completion = self._client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.2,
                **self._request_options(json_schema, schema_name),
            )
        except openai.RateLimitError as exc:
            raise LLMError(
                "llm_rate_limited", "The AI is busy right now. Try again in a minute.", True, 429, str(exc)
            ) from exc
        except openai.APITimeoutError as exc:
            raise LLMError(
                "llm_timeout", "The AI took too long to answer. Try again.", True, 504, str(exc)
            ) from exc
        except openai.AuthenticationError as exc:
            raise LLMError(
                "llm_misconfigured", "AI generation is misconfigured on the server.", False, 500, str(exc)
            ) from exc
        except (openai.APIConnectionError, openai.InternalServerError) as exc:
            raise LLMError(
                "llm_unavailable", "The AI service is unavailable. Try again shortly.", True, 503, str(exc)
            ) from exc
        except openai.APIStatusError as exc:
            raise LLMError(
                "llm_unavailable",
                "The AI service rejected the request.",
                exc.status_code >= 500,
                502,
                str(exc),
            ) from exc

        latency_ms = int((time.perf_counter() - started) * 1000)
        choice = completion.choices[0] if completion.choices else None
        usage = completion.usage
        return LLMResponse(
            text=(choice.message.content or "") if choice else "",
            model=completion.model or self.model,
            input_tokens=usage.prompt_tokens if usage else None,
            output_tokens=usage.completion_tokens if usage else None,
            latency_ms=latency_ms,
        )


def build_provider(
    model: str | None = None,
    structured_mode: StructuredMode | None = None,
    reasoning_effort: str | None = None,
) -> OpenAICompatibleProvider:
    if settings.llm_api_key is None:
        raise LLMError(
            "llm_not_configured",
            "AI generation isn't configured on the server yet.",
            False,
            503,
            "LLM_API_KEY / OPENROUTER_API_KEY is not set",
        )
    return OpenAICompatibleProvider(
        provider=settings.llm_provider,
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key.get_secret_value(),
        model=model or settings.llm_model,
        structured_mode=structured_mode or settings.llm_structured_output,
        timeout_seconds=settings.llm_timeout_seconds,
        reasoning_effort=reasoning_effort or settings.llm_reasoning_effort,
    )


@lru_cache
def get_llm_provider() -> LLMProvider:
    """FastAPI dependency (overridden in tests with a fake provider)."""
    return build_provider()
