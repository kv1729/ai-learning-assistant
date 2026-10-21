"""Context builder: structured retrieval for generation prompts.

Before writing content, the model needs to know where a concept sits: which curriculum,
which branch, which neighbouring concepts. That information is already in PostgreSQL,
so it is looked up by ID (no embeddings, no vector search). This is the first of the
three retrieval kinds in ARCHITECTURE.md; semantic search (7a) and reference grounding
(7b) will plug into the same place later.
"""

import uuid
from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Card, Concept, Curriculum, CurriculumNode


@dataclass(frozen=True)
class ConceptContext:
    concept_name: str
    curriculum_title: str
    path: list[str] = field(default_factory=list)  # ancestors, root first (excluding the concept)
    parent_description: str = ""
    description: str = ""
    siblings: list[str] = field(default_factory=list)  # other concepts under the same parent

    def render(self) -> str:
        lines = [
            f"Concept: {self.concept_name}",
            f"Curriculum: {self.curriculum_title}",
            f"Position: {' › '.join([*self.path, self.concept_name])}",
        ]
        if self.description:
            lines.append(f"Concept summary in the curriculum: {self.description}")
        if self.parent_description:
            lines.append(f"Parent topic: {self.path[-1]} — {self.parent_description}")
        if self.siblings:
            lines.append(f"Neighbouring concepts (learners study these nearby): {', '.join(self.siblings)}")
        return "\n".join(lines)


@dataclass(frozen=True)
class CardContext:
    concept: ConceptContext
    facet: str
    title: str
    summary: str
    other_cards: list[str]  # titles of the concept's other cards
    curriculum_concepts: list[str]  # concept names in the same curriculum, for related links

    def render(self) -> str:
        return "\n".join(
            [
                self.concept.render(),
                f"Card type: {self.facet}",
                f"Card title: {self.title}",
                f"Card summary: {self.summary}",
                f"The concept's other cards: {'; '.join(self.other_cards)}",
                f"Other concepts in this curriculum: {', '.join(self.curriculum_concepts)}",
            ]
        )


def _node_for(db: Session, concept: Concept, node_id: uuid.UUID | None) -> CurriculumNode | None:
    """The node the learner opened, or the shallowest node that uses this concept."""
    if node_id is not None:
        node = db.get(CurriculumNode, node_id)
        if node is not None and node.concept_id == concept.id:
            return node
    return db.scalar(
        select(CurriculumNode)
        .where(CurriculumNode.concept_id == concept.id)
        .order_by(CurriculumNode.depth, CurriculumNode.position)
        .limit(1)
    )


def build_concept_context(db: Session, concept: Concept, node_id: uuid.UUID | None = None) -> ConceptContext:
    node = _node_for(db, concept, node_id)
    if node is None:
        return ConceptContext(concept_name=concept.name, curriculum_title="")

    curriculum = db.get(Curriculum, node.curriculum_id)
    nodes = {
        n.id: n
        for n in db.scalars(select(CurriculumNode).where(CurriculumNode.curriculum_id == node.curriculum_id))
    }
    path: list[str] = []
    current = nodes.get(node.parent_id) if node.parent_id else None
    parent = current
    while current is not None:
        path.insert(0, current.name)
        current = nodes.get(current.parent_id) if current.parent_id else None

    siblings = sorted(
        (n for n in nodes.values() if n.parent_id == node.parent_id and n.id != node.id and n.concept_id),
        key=lambda n: n.position,
    )
    return ConceptContext(
        concept_name=node.name,
        curriculum_title=curriculum.title if curriculum else "",
        path=path,
        parent_description=parent.description if parent else "",
        description=node.description,
        siblings=[n.name for n in siblings],
    )


def build_card_context(db: Session, card: Card) -> CardContext:
    concept = db.get(Concept, card.concept_id)
    concept_context = build_concept_context(db, concept)
    other_cards = db.scalars(
        select(Card.title)
        .where(Card.concept_id == card.concept_id, Card.id != card.id)
        .order_by(Card.position)
    ).all()
    node = _node_for(db, concept, None)
    curriculum_concepts = (
        db.scalars(
            select(CurriculumNode.name)
            .where(
                CurriculumNode.curriculum_id == node.curriculum_id,
                CurriculumNode.concept_id.is_not(None),
                CurriculumNode.concept_id != concept.id,
            )
            .order_by(CurriculumNode.depth, CurriculumNode.position)
        ).all()
        if node
        else []
    )
    return CardContext(
        concept=concept_context,
        facet=card.facet,
        title=card.title,
        summary=card.summary,
        other_cards=list(other_cards),
        curriculum_concepts=list(curriculum_concepts),
    )
