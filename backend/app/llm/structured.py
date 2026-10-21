"""Turn an LLM call into a validated Pydantic object.

    prompt -> provider -> raw text -> JSON -> schema validation -> business validation
                                   \\__________ on failure: one repair attempt __________/

LLM output is never trusted as free text. Every attempt is recorded (model, prompt
version, tokens, latency, outcome) so the caller can log it, and failures surface
as an application error code rather than a stack trace.
"""

import json
import re
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel, ValidationError

from app.llm.prompts import RenderedPrompt
from app.llm.provider import LLMError, LLMProvider

MAX_ERROR_DETAIL = 1500
MAX_EXCERPT = 2000


@dataclass
class Attempt:
    attempt: int
    provider: str
    model: str
    prompt_ref: str
    status: str  # "ok" | "invalid_output" | "provider_error"
    error_code: str | None = None
    error_detail: str | None = None
    response_excerpt: str | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    latency_ms: int | None = None


@dataclass
class StructuredResult[T: BaseModel]:
    value: T
    attempts: list[Attempt]

    def generation_meta(self) -> dict[str, Any]:
        last = self.attempts[-1]
        return {
            "provider": last.provider,
            "model": last.model,
            "prompt_version": last.prompt_ref,
            "attempts": len(self.attempts),
            "input_tokens": sum(a.input_tokens or 0 for a in self.attempts),
            "output_tokens": sum(a.output_tokens or 0 for a in self.attempts),
            "latency_ms": sum(a.latency_ms or 0 for a in self.attempts),
        }


@dataclass
class GenerationFailed(Exception):
    code: str
    message: str
    retryable: bool
    status_code: int
    attempts: list[Attempt] = field(default_factory=list)


def extract_json(text: str) -> Any:
    """Parse JSON, tolerating a markdown code fence or text around one object."""
    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL | re.IGNORECASE)
    if fenced:
        cleaned = fenced.group(1)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start != -1 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise


def describe_error(exc: Exception) -> str:
    if isinstance(exc, ValidationError):
        lines = [
            f"- {'.'.join(str(p) for p in err['loc']) or '(root)'}: {err['msg']}" for err in exc.errors()[:15]
        ]
        return "\n".join(lines)
    if isinstance(exc, json.JSONDecodeError):
        return f"- not valid JSON: {exc.msg} (line {exc.lineno}, column {exc.colno})"
    return f"- {exc}"


REPAIR_INSTRUCTION = (
    "Your previous answer was rejected by the validator:\n{errors}\n\n"
    "Return the complete corrected JSON object only, following every rule in the instructions."
)


def generate_structured[T: BaseModel](
    provider: LLMProvider,
    prompt: RenderedPrompt,
    output_model: type[T],
    *,
    validate: Callable[[T], object] | None = None,
    max_attempts: int = 2,
) -> StructuredResult[T]:
    """Call the provider until the output passes schema and business validation.

    `validate` runs business rules and raises ValueError (or ValidationError) on failure.
    Provider errors are not retried here: rate limits and outages need the user to retry later.
    """
    schema = output_model.model_json_schema()
    messages = list(prompt.messages)
    attempts: list[Attempt] = []

    for number in range(1, max_attempts + 1):
        try:
            response = provider.complete(messages, json_schema=schema, schema_name=output_model.__name__)
        except LLMError as exc:
            attempts.append(
                Attempt(
                    number,
                    provider.provider,
                    provider.model,
                    prompt.ref,
                    "provider_error",
                    exc.code,
                    exc.detail[:MAX_ERROR_DETAIL],
                )
            )
            raise GenerationFailed(exc.code, exc.message, exc.retryable, exc.status_code, attempts) from exc

        record = Attempt(
            number,
            provider.provider,
            response.model,
            prompt.ref,
            "ok",
            input_tokens=response.input_tokens,
            output_tokens=response.output_tokens,
            latency_ms=response.latency_ms,
        )
        attempts.append(record)
        try:
            if not response.text.strip():
                raise ValueError("the response was empty")
            value = output_model.model_validate(extract_json(response.text))
            if validate is not None:
                validate(value)
            return StructuredResult(value=value, attempts=attempts)
        except (ValueError, ValidationError) as exc:  # JSONDecodeError is a ValueError
            errors = describe_error(exc)
            record.status = "invalid_output"
            record.error_code = "llm_invalid_output"
            record.error_detail = errors[:MAX_ERROR_DETAIL]
            record.response_excerpt = response.text[:MAX_EXCERPT]
            messages = [
                *messages,
                {"role": "assistant", "content": response.text},
                {"role": "user", "content": REPAIR_INSTRUCTION.format(errors=errors)},
            ]

    raise GenerationFailed(
        "llm_invalid_output",
        "The AI produced an answer we couldn't use. Try again.",
        True,
        502,
        attempts,
    )
