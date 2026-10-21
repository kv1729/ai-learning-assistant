"""Curriculum generation: topic -> LLM -> validated tree -> database.

1. Return a stored curriculum for the same topic (no LLM call, no quota used).
2. Render the versioned prompt and call the LLM with a strict JSON schema.
3. Validate: schema (CurriculumDraft) and business rules (draft_to_spec), with one
   repair attempt that feeds the validator's errors back to the model.
4. Persist the tree. Leaves map to shared Concepts by concept_key, so a concept
   that already has cards (e.g. "Logistic Regression") is reused, not regenerated.
5. Log every LLM attempt to llm_calls, whether it succeeded or not.
"""

import logging
import uuid
from collections.abc import Callable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.content import CurriculumDraft, CurriculumSpec, draft_to_spec
from app.errors import ApiError
from app.llm.calls import log_attempts
from app.llm.prompts import render_prompt
from app.llm.provider import LLMError, LLMProvider
from app.llm.structured import GenerationFailed, generate_structured
from app.models import Concept, Curriculum, CurriculumNode
from app.schemas import CurriculumOut
from app.services.content import get_curriculum

logger = logging.getLogger("app.curricula")

CURRICULUM_PROMPT_VERSION = "v1"


def normalize_topic(topic: str) -> str:
    return " ".join(topic.split()).strip()


def generate_curriculum_draft(provider: LLMProvider, topic: str):
    """LLM call + validation only (no database). Also used by the eval harness."""
    prompt = render_prompt("curriculum", CURRICULUM_PROMPT_VERSION, topic=topic)

    def validate(draft: CurriculumDraft) -> None:
        if draft.in_scope:
            draft_to_spec(draft, topic)

    return generate_structured(provider, prompt, CurriculumDraft, validate=validate)


def _persist(db: Session, spec: CurriculumSpec, generation: dict) -> uuid.UUID:
    curriculum = Curriculum(title=spec.title, requested_topic=spec.requested_topic, generation=generation)
    db.add(curriculum)
    db.flush()

    concept_ids: dict[str, uuid.UUID] = {}
    names = {n.concept_key: n.name for n in spec.nodes if n.concept_key}
    existing = db.scalars(select(Concept).where(Concept.concept_key.in_(names))).all()
    concept_ids.update({c.concept_key: c.id for c in existing})
    for key, name in names.items():
        if key not in concept_ids:
            concept = Concept(concept_key=key, name=name, content_status="not_generated")
            db.add(concept)
            db.flush()
            concept_ids[key] = concept.id

    node_ids = {n.key: uuid.uuid4() for n in spec.nodes}
    depths = spec.depths()
    for node in sorted(spec.nodes, key=lambda n: depths[n.key]):
        db.add(
            CurriculumNode(
                id=node_ids[node.key],
                curriculum_id=curriculum.id,
                parent_id=node_ids[node.parent_key] if node.parent_key else None,
                name=node.name,
                description=node.description,
                depth=depths[node.key],
                position=node.position,
                concept_id=concept_ids[node.concept_key] if node.concept_key else None,
            )
        )
        db.flush()
    return curriculum.id


def create_curriculum(db: Session, provider_factory: Callable[[], LLMProvider], topic: str) -> CurriculumOut:
    topic = normalize_topic(topic)
    existing_id = db.scalar(
        select(Curriculum.id)
        .where(func.lower(Curriculum.requested_topic) == topic.lower())
        .order_by(Curriculum.created_at.desc())
    )
    if existing_id is not None:
        return get_curriculum(db, existing_id)

    try:
        provider = provider_factory()
    except LLMError as exc:
        logger.error("LLM provider unavailable: %s", exc.detail)
        raise ApiError(exc.status_code, exc.code, exc.message, exc.retryable) from exc

    try:
        result = generate_curriculum_draft(provider, topic)
    except GenerationFailed as exc:
        log_attempts(db, "curriculum", topic, exc.attempts)
        db.commit()
        raise ApiError(exc.status_code, exc.code, exc.message, exc.retryable) from exc

    log_attempts(db, "curriculum", topic, result.attempts)
    draft = result.value
    if not draft.in_scope:
        db.commit()
        raise ApiError(
            422,
            "topic_out_of_scope",
            f'"{topic}" is outside what this app teaches (machine learning and AI). {draft.reason}'.strip(),
        )

    spec = draft_to_spec(draft, topic)
    curriculum_id = _persist(db, spec, result.generation_meta())
    db.commit()
    return get_curriculum(db, curriculum_id)
