"""Load seed content into the database.

    uv run python -m seed.load

Everything is validated (app/content.py) before anything is written, so invalid
seed data never reaches the database. IDs are derived deterministically from the
seed keys (uuid5), which makes the load idempotent: running it again updates the
same rows instead of creating duplicates.
"""

import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.content import ConceptContent, CurriculumSpec
from app.db import SessionLocal
from app.models import Card, Concept, Curriculum, CurriculumNode

DATA_DIR = Path(__file__).parent / "data"
NAMESPACE = uuid.UUID("6f1c2a52-6a9b-4f43-9a55-0c3a3c1f7a10")


def seed_id(kind: str, key: str) -> uuid.UUID:
    return uuid.uuid5(NAMESPACE, f"{kind}:{key}")


def read_seed(data_dir: Path = DATA_DIR) -> tuple[list[CurriculumSpec], dict[str, ConceptContent]]:
    """Parse and validate all seed files. Raises on the first invalid file."""
    curricula = [
        CurriculumSpec.model_validate_json(path.read_text(encoding="utf-8"))
        for path in sorted(data_dir.glob("curriculum-*.json"))
    ]
    concepts = {}
    for path in sorted((data_dir / "concepts").glob("*.json")):
        concept = ConceptContent.model_validate_json(path.read_text(encoding="utf-8"))
        if path.stem != concept.concept_key:
            raise ValueError(f"{path.name}: file name must match concept_key '{concept.concept_key}'")
        concepts[concept.concept_key] = concept

    referenced = {n.concept_key for c in curricula for n in c.nodes if n.concept_key}
    unreferenced = set(concepts) - referenced
    if unreferenced:
        raise ValueError(f"concept content not used by any curriculum: {sorted(unreferenced)}")
    return curricula, concepts


def load_seed(session: Session, data_dir: Path = DATA_DIR) -> dict[str, int]:
    curricula, contents = read_seed(data_dir)

    # Concepts: one row per concept_key; those with content get cards and are "ready".
    concept_names = {n.concept_key: n.name for c in curricula for n in c.nodes if n.concept_key}
    card_count = 0
    for key, name in concept_names.items():
        content = contents.get(key)
        concept_id = seed_id("concept", key)
        session.merge(
            Concept(
                id=concept_id,
                concept_key=key,
                name=content.name if content else name,
                content_status="ready" if content else "not_generated",
            )
        )
        for position, card in enumerate(content.cards if content else [], start=1):
            card_count += 1
            session.merge(
                Card(
                    id=seed_id("card", f"{key}/{position}"),
                    concept_id=concept_id,
                    position=position,
                    facet=card.facet,
                    title=card.title,
                    summary=card.summary,
                    key_takeaway=card.key_takeaway,
                    visual=card.visual.model_dump() if card.visual else None,
                    quick_check=card.quick_check.model_dump(),
                    detail=card.detail.model_dump() if card.detail else None,
                    sources=[],
                )
            )
    session.flush()

    node_count = 0
    for spec in curricula:
        curriculum_id = seed_id("curriculum", spec.key)
        session.merge(Curriculum(id=curriculum_id, title=spec.title, requested_topic=spec.requested_topic))
        depths = spec.depths()
        # Parents before children so the self-referencing foreign key is satisfied.
        for node in sorted(spec.nodes, key=lambda n: depths[n.key]):
            node_count += 1
            session.merge(
                CurriculumNode(
                    id=seed_id("node", f"{spec.key}/{node.key}"),
                    curriculum_id=curriculum_id,
                    parent_id=seed_id("node", f"{spec.key}/{node.parent_key}") if node.parent_key else None,
                    name=node.name,
                    description=node.description,
                    depth=depths[node.key],
                    position=node.position,
                    concept_id=seed_id("concept", node.concept_key) if node.concept_key else None,
                )
            )
            session.flush()

    return {
        "curricula": len(curricula),
        "nodes": node_count,
        "concepts": len(concept_names),
        "cards": card_count,
    }


def main() -> None:
    with SessionLocal() as session, session.begin():
        counts = load_seed(session)
    print("Seed loaded:", ", ".join(f"{v} {k}" for k, v in counts.items()))


if __name__ == "__main__":
    main()
