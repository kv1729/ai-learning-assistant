# Decision Log

Decisions that shape the product or architecture. Newest at the bottom.
Each entry: date, stage, decision, reason.

## 2026-10-05 — Stage 0 — Rebuild scope

| Area | Decision | Reason |
|---|---|---|
| Audience | The developer and similar engineers | User #1 can judge quality; keeps scope tight |
| Domain | ML/AI only at first | Bounded content universe makes evals, caching and grounding feasible |
| Platform | Mobile web / PWA (React + Vite) | Reuses existing stack; no app-store friction |
| Codebase | Fresh rebuild on `rebuild` branch; old state tagged `prototype-v0` | Prototype is small and has structural issues; good pieces get ported |
| Content hierarchy | Top tabs = sibling leaf concepts; each concept has ~6 facet cards (why it matters, intuition, math, example, pitfalls, comparison); `N / 6` = card within concept | Matches the feed UX and gives the generator a clear structure |
| Visuals | LLM emits Mermaid/SVG diagram specs and LaTeX (KaTeX); fallback topic icon | Fully generated, cheap, technically accurate |
| Caching | One shared stored copy per concept | Lowest cost; content evaluated once |
| Latency | Background prefetch of next concept + skeleton card | Hides 5–20 s generation time |
| Progress | Simple progress only (saves, quiz scores, completed concepts); no spaced repetition yet | User choice; revisit in Personalization |
| Evals | Golden set (~10 concepts) + structural checks + LLM-as-judge rubric from Stage 3 | Evaluation is core AI-engineering practice; needs a baseline before RAG |
| Tutor v1 | Fixed per-card actions | Predictable and evaluable |
| LLM provider | OpenRouter, free model by default; thin provider interface so model/provider are configuration; prefer models with reliable structured output / tool calling; propose a specific alternative before switching | Near-zero budget; swappable without touching application logic |
| Database | PostgreSQL in Docker from Stage 2, Alembic migrations | Same DB dev→prod; pgvector ready for Stage 7a |
| Budget | Near-zero LLM spend | Drives caching, configurable prefetch, local embeddings, small eval sets |

## 2026-10-05 — Stage 0 — Retrieval / RAG design

- Retrieval is split into three kinds behind one **context builder**:
  1. **Structured retrieval** (SQL by IDs: curriculum path, sibling concepts, previous cards, user progress) — Stage 4.
  2. **Semantic layer** over our own concepts/cards (pgvector + local embedding model) for Explore search and concept deduplication — Stage 7a.
  3. **Reference grounding (RAG)** over a licensed, curated corpus with required citations — Stage 7b, starting with the scikit-learn User Guide.
- No separate vector database; PostgreSQL + pgvector.
- Personalization uses SQL and rules, not vector search.
- No graph database and no "semantic + graph fusion"; concept relationships are a relational table.
- Try full-text search and whole-section context before tuning chunking; compare lexical vs. vector vs. hybrid with a retrieval eval set.
- Card schema includes `sources[]` from Stage 0 (empty until 7b) to keep the API contract stable.
- Reason: frontier models already know ML fundamentals; RAG's real value here is citations, freshness for fast-moving AI topics, library-specific accuracy, and measurable faithfulness.

## 2026-10-05 — Stage 0 — Process and documents

- Stage list consolidated into one numbering in `STAGES.md` (0–11, with 7a/7b); deployment moved early (Stage 6) for a live demo.
- Previous planning docs moved, not deleted, to `docs/legacy/`: `AGENTS.v0.md`, `ROADMAP.v0.md`, `Roadmap.docs.v0.md`, `Master_Plan.v1.md`.
- Provider abstraction is introduced in Stage 3 at the user's request (reverses the earlier "introduce later" guidance); kept to a thin interface, not a framework.

## 2026-10-05 — Stage 0 — Domain model and UI

Details in `docs/stage-0/`.

| ID | Decision | Reason |
|---|---|---|
| — | `CurriculumNode` (position in a tree) is separate from `Concept` (canonical, shared by `concept_key`); cards belong to the concept | Makes the global per-concept cache structural |
| — | Six fixed facets per concept: why_it_matters, intuition, how_it_works, worked_example, pitfalls, compare | Consistent feed; simple evals |
| — | Quick check uses `answer_index`, not repeated answer text | Removes a common class of invalid LLM output |
| — | `snake_case` across JSON, Python and SQL; one error shape `{error: {code, message, retryable}}` | Explicit, uniform API contract |
| — | Generation is async from the client's view: `content_status` + polling | Free-model calls take 10–30 s |
| U1 | Theme follows the system, light + dark via design tokens, one accent colour, no gradients | User choice |
| D1 | Explore-in-Depth detail generated lazily per card on first open | Smaller calls suit free models; no wasted tokens |
| D2 | Visual types: KaTeX formula, Mermaid (lazy-loaded), icon fallback; no raw LLM SVG | Avoids injecting untrusted markup |
| — | Old `frontend/` and `backend/` move to `legacy/`; the five empty `docs/*` files move to `docs/legacy/` | Side-by-side reference; nothing deleted |
| — | Proposed Stage 1 frontend dependencies: `react-router` (Back button/URLs), `katex`, `mermaid`, `react-markdown` + `remark-math` + `rehype-katex` (detail body), `lucide-react` (icons) | Each replaces a hand-rolled or broken piece of the prototype |

## 2026-10-05 — Stage 1 — Mobile UI with mock data

| Decision | Reason |
|---|---|
| Screens get data only through `src/api/client.js`, which re-exports an in-browser mock (`mockApi.js`) with the same function names/shapes as the planned endpoints | Stage 2 swaps the mock for HTTP without touching screens |
| Mock simulates latency, lazy generation, prefetch, a rate-limit failure + retry and missing content | Every loading/error state is reviewable before any AI exists |
| Learner state (saves, answers, seen cards, resume) lives in `localStorage` behind the mock API | Survives reloads during review; replaced by DB endpoints in Stage 5 |
| URL routes per screen (`/learn/:nodeId/:position[/detail|/check]`); card swipes replace history, pushed screens push | Phone Back button and refresh behave |
| Detail and Quick Check are full-screen (no bottom nav) | Focused reading/answering |
| Completion card after card 6; swiping past it opens the next concept | Clear end of a concept and natural flow |
| Home opens at the resume position, else the first concept with content | Never lands on an empty/failed state |
| Tapping a card's visual opens Explore in Depth, where diagrams get more room | Tall diagrams are small inside the card |
| KaTeX pinned to 0.16 to dedupe with `rehype-katex`/`mermaid`; Detail screen and Mermaid lazy-loaded | Main bundle 1.12 MB → 689 kB (215 kB gzip) |
| Added `remark-gfm` | Markdown tables in detail content |
| `npm run check:mock` validates mock content against the Stage 0 contract (facets, word counts, answer_index, tree rules) | Same rules become backend validation in Stages 3–4 |
| Backend not moved yet; `legacy/frontend` holds the prototype UI | Stage 1 is frontend-only; moving `backend/` would break its virtualenv — do it in Stage 2 |

## 2026-10-05 — Stage 2 — FastAPI + PostgreSQL

| Decision | Reason |
|---|---|
| uv + `pyproject.toml` + `uv.lock`, Python 3.13 | User choice; reproducible installs, mature wheels on Windows |
| Sync SQLAlchemy 2.0 with psycopg 3; plain `def` routes | User choice; simplest to read and test; FastAPI runs them in a threadpool |
| Card value objects (`visual`, `quick_check`, `detail`, `sources`) stored as JSONB on `cards` | Always read with the card; validated by Pydantic before writing; no join tables needed |
| `content_status` is a string column with a CHECK constraint | Readable, and easy to extend without a Postgres enum migration |
| Content validation lives in `app/content.py` (Pydantic field constraints = schema, validators = business rules) and replaces the frontend `check:mock` script | One validator for seed data now and LLM output in Stages 3–4 |
| Seed IDs are `uuid5(namespace, key)`; `seed.load` uses merge, so it is idempotent | Stable IDs across reloads; safe to re-run |
| `concept_key` is the single concept identifier in seed data | Curriculum and content files reference concepts the same way |
| Generation and curriculum creation return `501` with codes `generation_unavailable` / `not_available` until Stages 3–4 | Explicit contract instead of fake behavior; the UI shows the message |
| Feed remembers a rejected generation request per concept instead of retrying | Prevents request loops; retry is user-initiated |
| Learner state stays in `localStorage` (key bumped to `ala.learner.v2` for UUIDs; v1 left untouched) | Learner endpoints are Stage 5 |
| Vite dev proxy `/api` → `:8000`; CORS origins configurable | One origin in development |
| Tests use a separate `ala_test` database, created by the compose init script | Tests never touch development data |
| `httpx2` instead of `httpx` for the test client | Starlette deprecates `httpx` for `TestClient` |
| Prototype backend moved to `legacy/backend`; its ignored virtualenv `.ai_learning_env` left in `backend/`, unused | Nothing deleted without approval |
| Backend is an installable package (hatchling, editable install via `uv sync`); `.env` located relative to `app/config.py` | `uvicorn app.main:app` failed with `No module named 'app'` when started outside `backend/` |

## 2026-10-05 — Stage 3 — LLM curriculum generation

| Decision | Reason |
|---|---|
| `LLMProvider` protocol + `OpenAICompatibleProvider` (openai SDK, `max_retries=0`); provider, base URL, model, structured-output mode, timeout from env | Swap model/provider by configuration; retries are explicit in our code |
| Free-model shortlist from OpenRouter's model list (structured-output support): `nvidia/nemotron-3-super-120b-a12b:free` (default), `qwen/qwen3.8-27b:free`, `google/gemma-4-31b-it:free` (JSON mode only) | Final choice made from eval results, not reputation |
| Strict `json_schema` response format, plus OpenRouter `require_parameters` so requests only route to upstreams that honour it; LLM-facing models have no length/pattern keywords | Few schema keywords are supported in strict mode; limits are enforced by our validator instead |
| Pipeline: prompt → JSON → Pydantic schema → business rules (`draft_to_spec` + shared tree rules) → one repair attempt with the validator's messages | Never trust LLM text; repairs are cheaper than failing |
| Provider errors (rate limit, timeout, outage, auth) are not retried; mapped to 429/504/503/500 codes with `retryable` | The user decides when to retry; protects the 50/day free quota |
| Prompts are versioned files (`prompts/<name>/<version>.md`, `$placeholders`); the version is stored on every curriculum and LLM call | Changes to prompts are traceable and comparable in evals |
| Every attempt logged to `llm_calls` (model, prompt version, status, tokens, latency; response excerpt only for invalid output; never keys) | Debugging, cost and quality tracking |
| Same topic (case/space-insensitive) returns the stored curriculum without an LLM call | Saves quota and latency; regeneration can be added later |
| Leaves map to concepts by `concept_key = slugify(name)`; existing concepts are reused | Generated curricula share already-written cards (e.g. Logistic Regression) |
| Out-of-scope topics: the model returns `in_scope: false`; API answers `422 topic_out_of_scope` | ML/AI-only scope decided in Stage 0 |
| Generation rules: 6–40 leaves, ≤ 80 nodes, names ≤ 60 chars, no generic placeholders, no duplicate concepts | Leaves must be six-card-sized concepts |
| Evals: 12 golden topics (10 in scope, 2 out-of-scope probes), keyword-group coverage, validity, first-try rate, scope accuracy, latency; optional LLM-judge rubric (5 pass/fail criteria); throttled to 20/min with a request budget guard | Measurable baseline within the free tier |
| Tests run each test in a rolled-back transaction (`join_transaction_mode="create_savepoint"`) and use a scripted `FakeProvider` | Tests that write don't leak; no network or quota in CI |
| Default model stays `nvidia/nemotron-3-super-120b-a12b:free` after evals: 100 % valid/first-try/scope; Qwen and Gemma were rate-limited upstream and Gemma lacks strict schema support | Only available free model, met all structural targets (see `docs/evals/stage-3-curriculum-baseline.md`) |
| Node names must be unique within a generated curriculum | Eval found branches repeating their child's name |
| LLM timeout 120 s; UI wait message "up to two minutes" | Reasoning model took up to 84 s |
| Eval runner: per-model structured mode (`model@json_object`); stops a model after repeated identical provider errors | Fair comparison; protects the free quota |

