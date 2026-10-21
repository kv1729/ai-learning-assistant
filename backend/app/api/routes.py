"""HTTP routes. Each one validates input, calls a service and returns a schema."""

import uuid
from collections.abc import Callable
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_db
from app.llm.provider import LLMProvider, get_llm_provider
from app.schemas import (
    CardOut,
    CardSummary,
    CurriculumOut,
    CurriculumRequest,
    CurriculumSummary,
    DetailOut,
    FeedOut,
    GenerationStatus,
)
from app.services import content, curricula

router = APIRouter(prefix="/api")
Db = Annotated[Session, Depends(get_db)]


def provider_factory() -> Callable[[], LLMProvider]:
    """The provider is created lazily, so cached answers work even without an API key."""
    return get_llm_provider


ProviderFactory = Annotated[Callable[[], LLMProvider], Depends(provider_factory)]


@router.get("/health")
def health(db: Db) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}


@router.get("/curricula", tags=["curricula"])
def list_curricula(db: Db) -> list[CurriculumSummary]:
    return content.list_curricula(db)


@router.post("/curricula", tags=["curricula"])
def create_curriculum(request: CurriculumRequest, db: Db, providers: ProviderFactory) -> CurriculumOut:
    """Generate a curriculum with the LLM (or return the stored one for the same topic)."""
    return curricula.create_curriculum(db, providers, request.topic)


@router.get("/curricula/{curriculum_id}", tags=["curricula"])
def get_curriculum(curriculum_id: uuid.UUID, db: Db) -> CurriculumOut:
    return content.get_curriculum(db, curriculum_id)


@router.get("/nodes/{node_id}/feed", tags=["feed"])
def get_feed(node_id: uuid.UUID, db: Db) -> FeedOut:
    return content.get_feed(db, node_id)


@router.post("/concepts/{concept_id}/generate", tags=["feed"])
def generate_concept(concept_id: uuid.UUID, db: Db) -> GenerationStatus:
    return GenerationStatus(content_status=content.request_generation(db, concept_id))


@router.get("/cards", tags=["cards"])
def lookup_cards(db: Db, ids: Annotated[list[uuid.UUID], Query(max_length=200)] = ()) -> list[CardSummary]:
    return content.lookup_cards(db, list(ids))


@router.get("/cards/{card_id}", tags=["cards"])
def get_card(card_id: uuid.UUID, db: Db) -> CardOut:
    return content.get_card(db, card_id)


@router.get("/cards/{card_id}/detail", tags=["cards"])
def get_card_detail(card_id: uuid.UUID, db: Db) -> DetailOut:
    return content.get_card_detail(db, card_id)
