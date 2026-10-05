"""Read-side learning services: curricula, feeds and cards.

Routes stay thin; the queries and the shaping of responses live here so the same
logic can be reused by the tutor and generators in later stages.
"""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.errors import ApiError, not_found
from app.models import Card, Concept, Curriculum, CurriculumNode
from app.schemas import (
    CardOut,
    CardSummary,
    CurriculumOut,
    CurriculumRef,
    CurriculumSummary,
    DetailOut,
    FeedConcept,
    FeedOut,
    FeedTab,
    NodeOut,
    Ref,
    RelatedConcept,
)


def card_out(card: Card) -> CardOut:
    return CardOut(
        id=card.id,
        concept_id=card.concept_id,
        position=card.position,
        facet=card.facet,
        title=card.title,
        summary=card.summary,
        key_takeaway=card.key_takeaway,
        visual=card.visual,
        quick_check=card.quick_check,
        sources=card.sources,
        has_detail=card.detail is not None,
    )


def _leaves_in_order(nodes: list[CurriculumNode]) -> list[CurriculumNode]:
    children: dict[uuid.UUID | None, list[CurriculumNode]] = {}
    for node in nodes:
        children.setdefault(node.parent_id, []).append(node)
    for siblings in children.values():
        siblings.sort(key=lambda n: n.position)

    def walk(node: CurriculumNode) -> list[CurriculumNode]:
        if node.concept_id:
            return [node]
        return [leaf for child in children.get(node.id, []) for leaf in walk(child)]

    return [leaf for root in children.get(None, []) for leaf in walk(root)]


def list_curricula(db: Session) -> list[CurriculumSummary]:
    curricula = db.scalars(
        select(Curriculum).options(selectinload(Curriculum.nodes)).order_by(Curriculum.title)
    )
    return [
        CurriculumSummary(
            id=c.id, title=c.title, concept_ids=[n.concept_id for n in _leaves_in_order(c.nodes)]
        )
        for c in curricula
    ]


def get_curriculum(db: Session, curriculum_id: uuid.UUID) -> CurriculumOut:
    curriculum = db.scalar(
        select(Curriculum)
        .where(Curriculum.id == curriculum_id)
        .options(selectinload(Curriculum.nodes).selectinload(CurriculumNode.concept))
    )
    if curriculum is None:
        raise not_found("Curriculum not found.")
    root = next(n for n in curriculum.nodes if n.parent_id is None)
    return CurriculumOut(
        id=curriculum.id,
        title=curriculum.title,
        requested_topic=curriculum.requested_topic,
        root_node_id=root.id,
        generation=curriculum.generation,
        created_at=curriculum.created_at,
        nodes=[
            NodeOut(
                id=n.id,
                curriculum_id=n.curriculum_id,
                parent_id=n.parent_id,
                name=n.name,
                description=n.description,
                depth=n.depth,
                position=n.position,
                concept_id=n.concept_id,
                content_status=n.concept.content_status if n.concept else None,
            )
            for n in curriculum.nodes
        ],
    )


def get_feed(db: Session, node_id: uuid.UUID) -> FeedOut:
    node = db.scalar(
        select(CurriculumNode)
        .where(CurriculumNode.id == node_id)
        .options(selectinload(CurriculumNode.curriculum), selectinload(CurriculumNode.concept))
    )
    if node is None:
        raise not_found("This topic does not exist.")
    if node.concept is None:
        raise not_found("Pick a concept to start learning.")

    siblings = db.scalars(
        select(CurriculumNode)
        .where(
            CurriculumNode.curriculum_id == node.curriculum_id,
            CurriculumNode.parent_id == node.parent_id,
            CurriculumNode.concept_id.is_not(None),
        )
        .options(selectinload(CurriculumNode.concept))
        .order_by(CurriculumNode.position)
    ).all()
    parent = db.get(CurriculumNode, node.parent_id) if node.parent_id else None

    concept = node.concept
    cards = (
        db.scalars(select(Card).where(Card.concept_id == concept.id).order_by(Card.position)).all()
        if concept.content_status == "ready"
        else []
    )
    return FeedOut(
        curriculum=CurriculumRef(id=node.curriculum.id, title=node.curriculum.title),
        parent=Ref(id=parent.id, name=parent.name) if parent else None,
        node=Ref(id=node.id, name=node.name),
        tabs=[
            FeedTab(
                node_id=s.id, name=s.name, concept_id=s.concept.id, content_status=s.concept.content_status
            )
            for s in siblings
        ],
        concept=FeedConcept(
            id=concept.id,
            name=node.name,
            content_status=concept.content_status,
            generation_error=concept.generation_error if concept.content_status == "failed" else None,
        ),
        cards=[card_out(card) for card in cards],
    )


def _get_card(db: Session, card_id: uuid.UUID) -> Card:
    card = db.get(Card, card_id)
    if card is None:
        raise not_found("Card not found.")
    return card


def get_card(db: Session, card_id: uuid.UUID) -> CardOut:
    return card_out(_get_card(db, card_id))


def _first_node_by_concept(db: Session, concept_ids: set[uuid.UUID]) -> dict[uuid.UUID, uuid.UUID]:
    rows = db.execute(
        select(CurriculumNode.concept_id, CurriculumNode.id)
        .where(CurriculumNode.concept_id.in_(concept_ids))
        .order_by(CurriculumNode.depth, CurriculumNode.position)
    ).all()
    first: dict[uuid.UUID, uuid.UUID] = {}
    for concept_id, node_id in rows:
        first.setdefault(concept_id, node_id)
    return first


def lookup_cards(db: Session, card_ids: list[uuid.UUID]) -> list[CardSummary]:
    if not card_ids:
        return []
    cards = db.scalars(select(Card).where(Card.id.in_(card_ids)).options(selectinload(Card.concept))).all()
    nodes = _first_node_by_concept(db, {card.concept_id for card in cards})
    by_id = {card.id: card for card in cards}
    return [
        CardSummary(
            id=card.id,
            title=card.title,
            facet=card.facet,
            position=card.position,
            concept_id=card.concept_id,
            concept_name=card.concept.name,
            node_id=nodes.get(card.concept_id),
            answer_index=card.quick_check["answer_index"],
        )
        for card_id in card_ids
        if (card := by_id.get(card_id)) is not None
    ]


def get_card_detail(db: Session, card_id: uuid.UUID) -> DetailOut:
    card = _get_card(db, card_id)
    if card.detail is None:
        # Stage 4 generates missing details on first request.
        raise ApiError(
            404,
            "detail_not_generated",
            "The in-depth explanation for this card hasn't been written yet. "
            "AI generation of explanations arrives in a later stage.",
        )
    names = card.detail.get("related_concepts", [])
    rows = db.execute(
        select(func.lower(CurriculumNode.name), CurriculumNode.id)
        .where(
            func.lower(CurriculumNode.name).in_([n.lower() for n in names]),
            CurriculumNode.concept_id.is_not(None),
        )
        .order_by(CurriculumNode.depth)
    ).all()
    node_by_name: dict[str, uuid.UUID] = {}
    for name, node_id in rows:
        node_by_name.setdefault(name, node_id)
    return DetailOut(
        body_markdown=card.detail["body_markdown"],
        misconceptions=card.detail.get("misconceptions", []),
        related_concepts=[RelatedConcept(name=n, node_id=node_by_name.get(n.lower())) for n in names],
        takeaway=card.detail["takeaway"],
    )


def request_generation(db: Session, concept_id: uuid.UUID) -> str:
    concept = db.get(Concept, concept_id)
    if concept is None:
        raise not_found("Concept not found.")
    if concept.content_status in ("ready", "generating"):
        return concept.content_status
    # Stage 4 replaces this with lazy LLM generation.
    raise ApiError(
        501,
        "generation_unavailable",
        f"Cards for {concept.name} haven't been written yet. AI generation arrives in a later stage.",
    )
