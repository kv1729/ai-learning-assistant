# Stages

Progress tracker for the rebuild. One stage at a time; each stage ends at a user
approval gate. Decisions made inside a stage go in [docs/DECISIONS.md](docs/DECISIONS.md).

Status values: `Not started` / `In progress` / `Done` / `Blocked (reason)`.

| # | Stage | Status | Started | Finished |
|---|---|---|---|---|
| 0 | Repo review, domain model & UI contract | In progress | 2026-10-05 | |
| 1 | Mobile UI with mock data | Not started | | |
| 2 | FastAPI + PostgreSQL serving mock content | Not started | | |
| 3 | LLM curriculum generation | Not started | | |
| 4 | Lazy card generation | Not started | | |
| 5 | Learning state | Not started | | |
| 6 | Live demo deployment | Not started | | |
| 7a | Semantic layer over own content | Not started | | |
| 7b | Reference-grounded generation (RAG) | Not started | | |
| 8 | AI tutor (fixed actions) | Not started | | |
| 9 | Personalization | Not started | | |
| 10 | Agentic workflows (only if justified) | Not started | | |
| 11 | Production hardening | Not started | | |

---

## Stage 0 — Repo review, domain model & UI contract

**Goal:** Agree on what we are building before writing application code.

**Deliverables**
- Repository review: what to reuse from `prototype-v0`, what to replace, known bugs.
- Domain model: Curriculum → Concept → Cards (facets) → Detail + Quick Check, with field-level card schema (incl. `visual`, `formula`, `sources[]`).
- UI proposal for Home, Detail, Quick Check, Explore, Profile, loading/skeleton and error states.
- Planning docs: `STAGES.md`, `VISION.md`, `ARCHITECTURE.md`, `AGENTS.md`, `docs/DECISIONS.md`.

**Exit criteria**
- User approves the domain model, card schema and UI proposal.
- No application code changed.

## Stage 1 — Mobile UI with mock data

**Goal:** The complete user flow works in the browser with deterministic local data.

**Deliverables**
- Fresh React + Vite + Tailwind frontend on the `rebuild` branch, porting good parts of the prototype.
- Flow: Explore → curriculum → concept → feed (tabs + N/6 cards) → Detail → Quick Check → Profile.
- Save/bookmark, progress shown in Profile, skeleton and error states.
- Mermaid/SVG diagram and KaTeX formula rendering on cards.
- Mock data shaped exactly like the Stage 0 card schema.

**Exit criteria**
- `npm run build` and lint pass.
- Flow demonstrated in a mobile viewport (no nested phone frames).
- User signs off on the UI baseline.

## Stage 2 — FastAPI + PostgreSQL serving mock content

**Goal:** Frontend reads everything from the API; data lives in PostgreSQL.

**Deliverables**
- Clean backend package layout, settings via environment variables.
- PostgreSQL in Docker (`docker compose`), SQLAlchemy models, Alembic migrations.
- Seed script loading the mock content; read endpoints for curricula, concepts, cards.
- Consistent error responses; API tests (pytest).

**Exit criteria**
- `docker compose up` + migrations + seed works from a clean checkout.
- Frontend has no local content source; all API tests pass.

## Stage 3 — LLM curriculum generation

**Goal:** First real AI workflow: topic in, validated curriculum stored and displayed.

**Deliverables**
- Thin provider interface with an OpenAI-compatible implementation; provider, base URL and model set by configuration (default: OpenRouter free model).
- Free-model shortlist evaluated on the golden set; choice recorded in the decision log.
- Native structured output / tool calling where the model supports it; schema + business validation; one repair retry.
- Versioned prompt files; every LLM call logged (model, prompt version, tokens, latency, outcome).
- Golden set (~10 ML/AI topics), structural checks, LLM-as-judge rubric, runnable eval script.
- Graceful UI errors (rate limit, timeout, invalid output).

**Exit criteria**
- Golden-set curricula pass validation at an agreed rate and persist/reload correctly.
- Eval script produces a stored baseline report.
- No credentials reachable from the frontend.

## Stage 4 — Lazy card generation

**Goal:** Opening a concept generates (once) and serves its card set.

**Deliverables**
- Card generator producing ~6 facet cards + detail + quick check + visual spec per concept.
- Context builder (structured retrieval): curriculum path, sibling concepts, related cards.
- Global cache per concept; background prefetch of the next concept (configurable); skeleton while generating.
- Card evals extended to content quality via the judge rubric.

**Exit criteria**
- First open generates and stores; second open is served from the database without an LLM call.
- Card eval baseline recorded.

## Stage 5 — Learning state

**Goal:** Learner progress persists.

**Deliverables:** saves, quiz attempts, completed concepts, resume position, Profile views. Single local user / device ID until authentication exists.

**Exit criteria:** state survives reloads and restarts; API tests cover it.

## Stage 6 — Live demo deployment

**Goal:** A public URL running the app end to end at near-zero cost.

**Exit criteria:** deployed frontend + backend + database reachable; secrets only in host configuration.

## Stage 7a — Semantic layer over own content

**Goal:** Embeddings for Explore search and concept deduplication.

**Deliverables:** pgvector, local embedding model, embeddings of concepts/cards with model version, search endpoint, dedup on curriculum creation.

**Exit criteria:** search/dedup measured on a small labelled set.

## Stage 7b — Reference-grounded generation (RAG)

**Goal:** Cards and tutor answers grounded in and citing trusted references.

**Deliverables:** scikit-learn User Guide ingestion (with licence metadata), full-text + vector + hybrid retrieval, citation validation, retrieval eval set (recall@k, MRR), faithfulness eval vs. the Stage 4 baseline.

**Exit criteria:** measured comparison report; grounded cards cite valid sources.

## Stage 8 — AI tutor (fixed actions)

**Goal:** Per-card actions (explain differently, analogy, mathematically, harder question) using the context builder and references.

## Stage 9 — Personalization

**Goal:** Recommendations and revision suggestions from learning history (SQL + rules first).

## Stage 10 — Agentic workflows

**Goal:** Only where a real workflow needs dynamic tool use; retrieval and context builder become tools.

## Stage 11 — Production hardening

**Goal:** Authentication, rate limiting, observability, background jobs, security review.
