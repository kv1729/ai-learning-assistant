"""Lazy content generation: concept cards and card details.

Concept cards (asynchronous):
    POST /concepts/{id}/generate
      -> claim the concept with one atomic UPDATE (only one worker can win)
      -> return "generating" immediately and run the LLM in a background task
      -> the feed polls until the concept is "ready" (or "failed", with a retryable flag)

Card detail (synchronous, on first open):
    GET /cards/{id}/detail
      -> stored detail? return it
      -> otherwise generate once (single-flight per card), validate, store, return

Both build their prompt context from the database (services/context.py), validate the
LLM output with the shared content rules (app/content.py), get one repair attempt
(app/llm/structured.py) and log every attempt to llm_calls.
"""

import logging
import uuid
from collections.abc import Callable
from contextlib import AbstractContextManager
from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, or_, update
from sqlalchemy.orm import Session

from app.config import settings
from app.content import (
    ConceptCardsDraft,
    ConceptContent,
    DetailDraft,
    cards_draft_to_content,
    detail_draft_to_detail,
)
from app.errors import ApiError, not_found
from app.llm.calls import log_attempts
from app.llm.prompts import render_prompt
from app.llm.provider import LLMError, LLMProvider
from app.llm.singleflight import SingleFlight
from app.llm.structured import GenerationFailed, StructuredResult, generate_structured
from app.models import Card, Concept
from app.services.context import CardContext, ConceptContext, build_card_context, build_concept_context

logger = logging.getLogger("app.generation")

CARDS_PROMPT_VERSION = "v1"
DETAIL_PROMPT_VERSION = "v1"

SessionFactory = Callable[[], AbstractContextManager[Session]]
ProviderFactory = Callable[[], LLMProvider]

_detail_flights = SingleFlight()


# ---------- pure LLM steps (no database; also used by the eval harness) ----------


def generate_cards_draft(
    provider: LLMProvider, context: ConceptContext, concept_key: str
) -> tuple[StructuredResult[ConceptCardsDraft], ConceptContent]:
    prompt = render_prompt("concept_cards", CARDS_PROMPT_VERSION, context=context.render())
    result = generate_structured(
        provider,
        prompt,
        ConceptCardsDraft,
        validate=lambda draft: cards_draft_to_content(draft, concept_key, context.concept_name),
    )
    return result, cards_draft_to_content(result.value, concept_key, context.concept_name)


def generate_detail_draft(provider: LLMProvider, context: CardContext) -> StructuredResult[DetailDraft]:
    prompt = render_prompt("card_detail", DETAIL_PROMPT_VERSION, context=context.render())
    return generate_structured(provider, prompt, DetailDraft, validate=detail_draft_to_detail)


def _provider_or_error(provider_factory: ProviderFactory) -> LLMProvider:
    try:
        return provider_factory()
    except LLMError as exc:
        logger.error("LLM provider unavailable: %s", exc.detail)
        raise ApiError(exc.status_code, exc.code, exc.message, exc.retryable) from exc


# ---------- concept cards ----------


def claim_concept(db: Session, concept_id: uuid.UUID) -> bool:
    """Atomically move a concept to "generating". Returns True if this caller won the claim.

    Claimable: not generated yet, failed, or a "generating" claim older than the stale limit
    (the worker that held it probably died). A single UPDATE ... WHERE makes this safe even
    with several API processes: the database lets exactly one of them change the row.
    """
    stale_before = datetime.now(UTC) - timedelta(seconds=settings.generation_stale_after_seconds)
    claimed = db.execute(
        update(Concept)
        .where(
            Concept.id == concept_id,
            or_(
                Concept.content_status.in_(("not_generated", "failed")),
                and_(Concept.content_status == "generating", Concept.generation_started_at < stale_before),
            ),
        )
        .values(content_status="generating", generation_started_at=datetime.now(UTC), generation_error=None)
        .returning(Concept.id)
    ).scalar_one_or_none()
    db.commit()
    return claimed is not None


def request_concept_generation(
    db: Session,
    provider_factory: ProviderFactory,
    concept_id: uuid.UUID,
    node_id: uuid.UUID | None,
    schedule: Callable[[Callable[[], None]], None],
) -> str:
    """Start generating a concept's cards if needed. Returns the concept's content_status."""
    concept = db.get(Concept, concept_id)
    if concept is None:
        raise not_found("Concept not found.")
    if concept.content_status == "ready":
        return "ready"
    provider = _provider_or_error(provider_factory)  # fail fast, before claiming
    if claim_concept(db, concept_id):
        schedule(lambda: run_concept_generation(provider, concept_id, node_id))
        return "generating"
    db.refresh(concept)
    return concept.content_status


# Replaced in tests so the background task uses the test database session.
def default_session_factory() -> AbstractContextManager[Session]:
    from app.db import SessionLocal

    return SessionLocal()


session_factory: SessionFactory = default_session_factory


def run_concept_generation(provider: LLMProvider, concept_id: uuid.UUID, node_id: uuid.UUID | None) -> None:
    """Background task: generate, validate and store a concept's cards. Never raises."""
    with session_factory() as db:
        concept = db.get(Concept, concept_id)
        if concept is None:
            return
        try:
            context = build_concept_context(db, concept, node_id)
            result, content = generate_cards_draft(provider, context, concept.concept_key)
        except GenerationFailed as exc:
            log_attempts(db, "concept_cards", concept.name, exc.attempts)
            _mark_failed(concept, exc.code, exc.message, exc.retryable)
            db.commit()
            return
        except Exception:
            logger.exception("Card generation crashed for concept %s", concept_id)
            db.rollback()
            concept = db.get(Concept, concept_id)
            _mark_failed(concept, "internal_error", "Something went wrong while writing the cards.", True)
            db.commit()
            return

        log_attempts(db, "concept_cards", concept.name, result.attempts)
        for position, card in enumerate(content.cards, start=1):
            db.add(
                Card(
                    concept_id=concept.id,
                    position=position,
                    facet=card.facet,
                    title=card.title,
                    summary=card.summary,
                    key_takeaway=card.key_takeaway,
                    visual=card.visual.model_dump() if card.visual else None,
                    quick_check=card.quick_check.model_dump(),
                    detail=None,  # written lazily on first open
                    sources=[],
                )
            )
        concept.content_status = "ready"
        concept.generation = {**result.generation_meta(), "generated_at": datetime.now(UTC).isoformat()}
        concept.generation_error = None
        db.commit()


def _mark_failed(concept: Concept, code: str, message: str, retryable: bool) -> None:
    concept.content_status = "failed"
    concept.generation_error = {"code": code, "message": message, "retryable": retryable}


# ---------- card detail ----------


def ensure_card_detail(db: Session, provider_factory: ProviderFactory, card_id: uuid.UUID) -> dict:
    """Return the card's stored detail, generating it once if it doesn't exist yet."""
    card = db.get(Card, card_id)
    if card is None:
        raise not_found("Card not found.")
    if card.detail is not None:
        return card.detail

    def generate() -> dict:
        db.refresh(card)
        if card.detail is not None:  # written by an earlier request that just finished
            return card.detail
        provider = _provider_or_error(provider_factory)
        context = build_card_context(db, card)
        try:
            result = generate_detail_draft(provider, context)
        except GenerationFailed as exc:
            log_attempts(db, "card_detail", f"{context.concept.concept_name}: {card.title}", exc.attempts)
            db.commit()
            raise ApiError(exc.status_code, exc.code, exc.message, exc.retryable) from exc
        log_attempts(db, "card_detail", f"{context.concept.concept_name}: {card.title}", result.attempts)
        detail = detail_draft_to_detail(result.value).model_dump()
        card.detail = detail
        db.commit()
        return detail

    return _detail_flights.do(card_id, generate)
