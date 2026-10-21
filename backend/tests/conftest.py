"""Tests run against a separate PostgreSQL database (TEST_DATABASE_URL, default
ala_test from docker-compose). The schema is rebuilt and the seed loaded once per
test session. Each test runs inside a transaction that is rolled back afterwards,
so tests that write (e.g. curriculum generation) never affect other tests.

No test calls a real LLM: `fake_llm` replaces the provider with scripted responses.
"""

import json
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.api.routes import provider_factory
from app.config import settings
from app.db import Base, get_db
from app.llm.provider import LLMError, LLMResponse
from app.main import app
from seed.load import load_seed


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    engine = create_engine(settings.test_database_url)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as session, session.begin():
        load_seed(session)
    yield engine
    engine.dispose()


@pytest.fixture()
def db(engine: Engine) -> Iterator[Session]:
    """A session whose commits become savepoints inside an outer, rolled-back transaction."""
    connection = engine.connect()
    outer = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False)
    yield session
    session.close()
    outer.rollback()
    connection.close()


class FakeProvider:
    """Plays back scripted responses (strings, or LLMError instances to raise)."""

    provider = "fake"
    model = "fake-model"

    def __init__(self, responses: list):
        self.responses = list(responses)
        self.calls: list[list[dict[str, str]]] = []

    def complete(self, messages, *, json_schema, schema_name) -> LLMResponse:
        self.calls.append(messages)
        if not self.responses:
            raise AssertionError("FakeProvider ran out of scripted responses")
        response = self.responses.pop(0)
        if isinstance(response, LLMError):
            raise response
        text = response if isinstance(response, str) else json.dumps(response)
        return LLMResponse(text=text, model=self.model, input_tokens=100, output_tokens=200, latency_ms=5)


@pytest.fixture()
def fake_llm() -> Iterator[FakeProvider]:
    fake = FakeProvider([])
    app.dependency_overrides[provider_factory] = lambda: lambda: fake
    yield fake
    app.dependency_overrides.pop(provider_factory, None)


@pytest.fixture()
def client(db: Session) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_db, None)


def find_node(client: TestClient, name: str) -> dict:
    curricula = client.get("/api/curricula").json()
    curriculum_id = next(c["id"] for c in curricula if c["title"] == "Machine Learning")
    nodes = client.get(f"/api/curricula/{curriculum_id}").json()["nodes"]
    return next(node for node in nodes if node["name"] == name)
