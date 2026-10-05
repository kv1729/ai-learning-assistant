# Backend — AI Learning Assistant

FastAPI + PostgreSQL (SQLAlchemy 2.0, Alembic). Python 3.13, managed with
[uv](https://docs.astral.sh/uv/). Stage 2 serves the seeded learning content; AI
generation arrives in Stages 3–4.

## Run locally

Requires Docker Desktop (for PostgreSQL) and uv.

```bash
# from the repository root
docker compose up -d                 # PostgreSQL 17 on localhost:5432 (databases: ala, ala_test)

cd backend
cp .env.example .env                 # first time only
uv sync                              # create .venv and install dependencies
uv run alembic upgrade head          # create/upgrade the schema
uv run python -m seed.load           # load seed content (safe to re-run)
uv run uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs. The frontend dev server proxies `/api` to port 8000.

## Checks

```bash
uv run pytest                        # uses TEST_DATABASE_URL (ala_test); rebuilds its schema each run
uv run ruff check . && uv run ruff format --check .
uv run alembic check                 # models and migrations are in sync
```

## Structure

```text
app/
├── main.py            # app factory: CORS, error handlers, routes
├── config.py          # settings from environment / .env
├── db.py              # engine, session, get_db dependency
├── models.py          # tables: curricula, curriculum_nodes, concepts, cards
├── content.py         # content models + schema/business validation (seed now, LLM output later)
├── schemas.py         # API response shapes
├── errors.py          # {error: {code, message, retryable}} for every failure
├── api/routes.py      # thin HTTP layer
└── services/content.py# queries and response shaping
alembic/               # migrations
seed/                  # seed JSON + idempotent loader
tests/                 # validation, API contract and seed tests
db/init/               # creates the test database on first container start
```

## Endpoints (Stage 2)

| Method & path | Notes |
|---|---|
| `GET /api/health` | checks the database connection |
| `GET /api/curricula` | summaries with leaf concept ids in reading order |
| `GET /api/curricula/{id}` | tree with `content_status` per leaf |
| `POST /api/curricula` | `501 not_available` until Stage 3 |
| `GET /api/nodes/{id}/feed` | sibling tabs + concept + cards (without detail) |
| `POST /api/concepts/{id}/generate` | `ready` for seeded concepts; `501 generation_unavailable` until Stage 4 |
| `GET /api/cards?ids=…` | card summaries for Profile / Saved |
| `GET /api/cards/{id}` | one card |
| `GET /api/cards/{id}/detail` | `404 detail_not_generated` when not written yet |
