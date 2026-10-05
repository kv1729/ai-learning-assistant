from sqlalchemy import func, select

from app.models import Card, Concept, CurriculumNode
from seed.load import load_seed


def test_seed_load_is_idempotent(db):
    def counts():
        return [
            db.scalar(select(func.count()).select_from(model)) for model in (CurriculumNode, Concept, Card)
        ]

    before = counts()
    load_seed(db)
    db.commit()
    assert counts() == before == [21, 14, 30]
