"""Persist every LLM attempt to llm_calls (and the application log). Never logs credentials."""

import logging

from sqlalchemy.orm import Session

from app.llm.structured import Attempt
from app.models import LlmCall

logger = logging.getLogger("app.llm")


def log_attempts(db: Session, purpose: str, subject: str, attempts: list[Attempt]) -> None:
    for a in attempts:
        db.add(
            LlmCall(
                purpose=purpose,
                subject=subject[:200],
                attempt=a.attempt,
                provider=a.provider,
                model=a.model,
                prompt_version=a.prompt_ref,
                status=a.status,
                error_code=a.error_code,
                error_detail=a.error_detail,
                response_excerpt=a.response_excerpt,
                input_tokens=a.input_tokens,
                output_tokens=a.output_tokens,
                latency_ms=a.latency_ms,
            )
        )
        logger.info(
            "llm_call purpose=%s attempt=%s model=%s prompt=%s status=%s error=%s tokens=%s/%s latency_ms=%s",
            purpose, a.attempt, a.model, a.prompt_ref, a.status, a.error_code,
            a.input_tokens, a.output_tokens, a.latency_ms,
        )  # fmt: skip
