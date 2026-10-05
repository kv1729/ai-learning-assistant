"""Tests run against a separate PostgreSQL database (TEST_DATABASE_URL, default
ala_test from docker-compose). The schema is rebuilt and the seed loaded once per
test session; API tests are read-only, so they share that data.
"""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.db import Base, get_db
from app.main import app
from seed.load import load_seed


@pytest.fixture(scope="session")
def session_factory() -> Iterator[sessionmaker[Session]]:
    engine = create_engine(settings.test_database_url)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with factory() as session, session.begin():
        load_seed(session)
    yield factory
    engine.dispose()


@pytest.fixture()
def db(session_factory: sessionmaker[Session]) -> Iterator[Session]:
    with session_factory() as session:
        yield session


@pytest.fixture()
def client(session_factory: sessionmaker[Session]) -> Iterator[TestClient]:
    def override_get_db() -> Iterator[Session]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def find_node(client: TestClient, name: str) -> dict:
    curriculum_id = client.get("/api/curricula").json()[0]["id"]
    nodes = client.get(f"/api/curricula/{curriculum_id}").json()["nodes"]
    return next(node for node in nodes if node["name"] == name)
