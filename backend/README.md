# Backend — AI Learning Assistant

FastAPI + PostgreSQL (SQLAlchemy 2.0, Alembic). Python 3.13, managed with
[uv](https://docs.astral.sh/uv/). Serves learning content and generates curricula with an
LLM (Stage 3); card generation arrives in Stage 4.

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

## LLM configuration

Set `LLM_API_KEY` in `backend/.env` (an OpenRouter key from https://openrouter.ai/keys).
Model, provider URL, structured-output mode and timeout are configurable; see `.env.example`.
Without a key the app still runs; generating a new curriculum returns `llm_not_configured`.

Free OpenRouter models allow 20 requests/minute and 50/day (1,000/day after buying $10 of
credits). A stored curriculum is returned for a repeated topic, so it costs no request.

## Evals

```bash
uv run python -m evals.curriculum --dry-run                      # request budget only
uv run python -m evals.curriculum --models MODEL_A,MODEL_B --topics 5
uv run python -m evals.curriculum --topics 5 --judge             # add the LLM-judge rubric
```

Golden topics: `evals/golden_curricula.json`. Reports (JSON + Markdown summary):
`evals/reports/`. Every LLM attempt made by the app is also logged in the `llm_calls` table.

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
├── content.py         # content models + schema/business validation (seed and LLM output)
├── llm/
│   ├── provider.py    # LLMProvider protocol + OpenAI-compatible implementation, error mapping
│   ├── prompts.py     # loads versioned prompts from prompts/<name>/<version>.md
│   └── structured.py  # call -> parse -> validate -> one repair attempt; records every attempt
├── schemas.py         # API response shapes
├── errors.py          # {error: {code, message, retryable}} for every failure
├── api/routes.py      # thin HTTP layer
└── services/
    ├── content.py     # read queries and response shaping
    └── curricula.py   # curriculum generation: cache, LLM, validation, persistence, call log
prompts/               # versioned prompt files (curriculum, curriculum_judge)
evals/                 # golden topics, eval runner, reports
alembic/               # migrations
seed/                  # seed JSON + idempotent loader
tests/                 # validation, API contract and seed tests
db/init/               # creates the test database on first container start
```

## Endpoints

| Method & path | Notes |
|---|---|
| `GET /api/health` | checks the database connection |
| `GET /api/curricula` | summaries with leaf concept ids in reading order |
| `GET /api/curricula/{id}` | tree with `content_status` per leaf |
| `POST /api/curricula` | `{topic}` → generated (or stored) curriculum; errors: `topic_out_of_scope` 422, `llm_rate_limited` 429, `llm_invalid_output` 502, `llm_unavailable` 503, `llm_timeout` 504, `llm_not_configured` 503 |
| `GET /api/nodes/{id}/feed` | sibling tabs + concept + cards (without detail) |
| `POST /api/concepts/{id}/generate` | `ready` for seeded concepts; `501 generation_unavailable` until Stage 4 |
| `GET /api/cards?ids=…` | card summaries for Profile / Saved |
| `GET /api/cards/{id}` | one card |
| `GET /api/cards/{id}/detail` | `404 detail_not_generated` when not written yet |
