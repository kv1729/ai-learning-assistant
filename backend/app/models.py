"""Database tables (see docs/stage-0/02-domain-model.md).

A CurriculumNode is a position in one curriculum's tree; a Concept is the shared,
canonical learning unit (identified by concept_key) that owns the cards. Two
curricula containing the same concept point at the same Concept row, so its cards
are generated and stored once.

Card value objects (visual, quick_check, detail, sources) are stored as JSONB:
they are always read together with their card and validated by Pydantic models in
app/content.py before they are written.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Curriculum(Base):
    __tablename__ = "curricula"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200))
    requested_topic: Mapped[str] = mapped_column(String(200))
    generation: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    nodes: Mapped[list["CurriculumNode"]] = relationship(
        back_populates="curriculum", cascade="all, delete-orphan", order_by="CurriculumNode.position"
    )


class CurriculumNode(Base):
    __tablename__ = "curriculum_nodes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    curriculum_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("curricula.id", ondelete="CASCADE"), index=True
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("curriculum_nodes.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    depth: Mapped[int]
    position: Mapped[int]
    concept_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("concepts.id"), index=True)

    curriculum: Mapped[Curriculum] = relationship(back_populates="nodes")
    concept: Mapped["Concept | None"] = relationship()


class Concept(Base):
    __tablename__ = "concepts"
    __table_args__ = (
        CheckConstraint(
            "content_status IN ('not_generated', 'generating', 'ready', 'failed')",
            name="content_status_valid",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    concept_key: Mapped[str] = mapped_column(String(120), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    content_status: Mapped[str] = mapped_column(String(20), default="not_generated")
    generation: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    generation_error: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    cards: Mapped[list["Card"]] = relationship(
        back_populates="concept", cascade="all, delete-orphan", order_by="Card.position"
    )


class Card(Base):
    __tablename__ = "cards"
    __table_args__ = (UniqueConstraint("concept_id", "position", name="uq_card_concept_position"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    concept_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("concepts.id", ondelete="CASCADE"), index=True)
    position: Mapped[int]
    facet: Mapped[str] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(120))
    summary: Mapped[str] = mapped_column(Text)
    key_takeaway: Mapped[str] = mapped_column(Text)
    visual: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    quick_check: Mapped[dict[str, Any]] = mapped_column(JSONB)
    detail: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    sources: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)

    concept: Mapped[Concept] = relationship(back_populates="cards")
