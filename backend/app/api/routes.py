"""HTTP routes. Each one validates input, calls a service and returns a schema."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_db
from app.errors import ApiError
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
from app.services import content

router = APIRouter(prefix="/api")
Db = Annotated[Session, Depends(get_db)]


@router.get("/health")
def health(db: Db) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}


@router.get("/curricula", tags=["curricula"])
def list_curricula(db: Db) -> list[CurriculumSummary]:
    return content.list_curricula(db)


@router.post("/curricula", tags=["curricula"])
def create_curriculum(request: CurriculumRequest) -> CurriculumOut:
    # Stage 3 implements LLM curriculum generation here.
    raise ApiError(
        501,
        "not_available",
        f'Building a curriculum for "{request.topic}" with AI arrives in a later stage. '
        "For now, explore the Machine Learning curriculum.",
    )


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
