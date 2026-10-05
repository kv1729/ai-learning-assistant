"""API response shapes (the contract in docs/stage-0/02-domain-model.md)."""

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.content import Facet, QuickCheck, Visual

ContentStatus = Literal["not_generated", "generating", "ready", "failed"]


class CurriculumSummary(BaseModel):
    id: uuid.UUID
    title: str
    concept_ids: list[uuid.UUID]


class NodeOut(BaseModel):
    id: uuid.UUID
    curriculum_id: uuid.UUID
    parent_id: uuid.UUID | None
    name: str
    description: str
    depth: int
    position: int
    concept_id: uuid.UUID | None
    content_status: ContentStatus | None = None


class CurriculumOut(BaseModel):
    id: uuid.UUID
    title: str
    requested_topic: str
    root_node_id: uuid.UUID
    generation: dict[str, Any] | None
    created_at: datetime
    nodes: list[NodeOut]


class CardOut(BaseModel):
    id: uuid.UUID
    concept_id: uuid.UUID
    position: int
    facet: Facet
    title: str
    summary: str
    key_takeaway: str
    visual: Visual | None
    quick_check: QuickCheck
    sources: list[dict[str, Any]]
    has_detail: bool


class CardSummary(BaseModel):
    """A card with where to find it; used by Profile and Saved cards."""

    id: uuid.UUID
    title: str
    facet: Facet
    position: int
    concept_id: uuid.UUID
    concept_name: str
    node_id: uuid.UUID | None
    answer_index: int


class RelatedConcept(BaseModel):
    name: str
    node_id: uuid.UUID | None


class DetailOut(BaseModel):
    body_markdown: str
    misconceptions: list[str]
    related_concepts: list[RelatedConcept]
    takeaway: str


class Ref(BaseModel):
    id: uuid.UUID
    name: str


class CurriculumRef(BaseModel):
    id: uuid.UUID
    title: str


class FeedTab(BaseModel):
    node_id: uuid.UUID
    name: str
    concept_id: uuid.UUID
    content_status: ContentStatus


class FeedConcept(BaseModel):
    id: uuid.UUID
    name: str
    content_status: ContentStatus
    generation_error: dict[str, Any] | None


class FeedOut(BaseModel):
    curriculum: CurriculumRef
    parent: Ref | None
    node: Ref
    tabs: list[FeedTab]
    concept: FeedConcept
    cards: list[CardOut]


class GenerationStatus(BaseModel):
    content_status: ContentStatus


class CurriculumRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=100)
