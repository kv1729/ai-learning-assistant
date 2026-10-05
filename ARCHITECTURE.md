# Architecture

Target design and the principles behind it. The system grows into this one stage at a
time (see [STAGES.md](STAGES.md)); nothing here is built before a stage requires it.
Rationale for each choice lives in [docs/DECISIONS.md](docs/DECISIONS.md).

## Overview

```text
React (Vite, mobile web / PWA)
        │  REST / JSON
        ▼
FastAPI  ── routes: thin, validate requests, map errors
        │
        ▼
Learning services
  ├── Curriculum planner     (Stage 3)
  ├── Card generator         (Stage 4)
  ├── Validator              (schema + business rules)
  ├── Context builder        (Stage 4 → 7b)
  ├── Tutor                  (Stage 8)
  └── Recommender            (Stage 9)
        │                         │
        ▼                         ▼
LLM provider interface      PostgreSQL (+ pgvector from 7a)
  └── OpenAI-compatible       system of record for everything
      impl (OpenRouter)
```

The frontend never talks to an LLM provider. The backend owns credentials, prompts,
model configuration, validation, retries, logging and error mapping.

## Domain model

```text
Curriculum ── Concept (tree via parent_id)
                 └── Card × ~6 (facet: why | intuition | math | example | pitfalls | comparison)
                        ├── summary (~100–120 words)
                        ├── detail (300–700 words, markdown + LaTeX)
                        ├── visual  (mermaid | svg | formula | icon)
                        ├── quick_check { question, options[], answer, explanation }
                        └── sources[] (empty until Stage 7b)
ConceptRelationship (source, target, type: prerequisite | uses | alternative_to | ...)
User state: saves, quiz_attempts, concept_progress (single local user until auth)
```

Exact field-level schema is a Stage 0 deliverable.

## LLM layer

- **Provider interface:** one small interface (`generate_structured(prompt, schema) -> model`)
  with an OpenAI-compatible implementation. Provider, base URL, model and key come from
  environment configuration. Default: an OpenRouter free model chosen by eval results.
- **Structured output:** use native JSON-schema / tool calling when the model supports it;
  otherwise strict JSON prompting. Output is never trusted as free text.
- **Validation pipeline:** parse → Pydantic schema validation → business validation
  (unique IDs, valid parents, answer ∈ options, …) → one repair retry → meaningful error.
- **Prompts** are versioned files. Every generated row records `model` and `prompt_version`.
- **Call log:** model, prompt version, tokens, latency, outcome, error class. No secrets.
- **Errors mapped to user-facing messages:** rate limit, timeout, provider down,
  invalid output, empty output.

## Generation strategy

- Curriculum generated on request; concept content generated lazily on first open.
- One shared cached copy per concept; second open never calls the LLM.
- Background prefetch of the next concept (configurable — free-tier quotas are tight).
- Concept deduplication via embeddings from Stage 7a.

## Retrieval (three kinds, one context builder)

| Kind | Mechanism | Used for | Stage |
|---|---|---|---|
| Structured | SQL by ID | curriculum path, siblings, prior cards, user progress | 4 |
| Semantic (own content) | pgvector + local embedding model | Explore search, concept dedup, related cards | 7a |
| Reference grounding (RAG) | Postgres full-text + pgvector, hybrid | cited, grounded cards and tutor answers | 7b |

- Corpus starts with the scikit-learn User Guide; every document records source, URL,
  licence and version. Chunks keep their section path.
- Generated output cites chunk IDs; the validator rejects citations that were not retrieved.
- Evaluated with a retrieval set (recall@k, MRR) and faithfulness scoring vs. the
  ungrounded baseline.
- User learning state is never put in the vector store; personalization uses SQL.
- No separate vector DB, no graph DB, no LangChain/LangGraph unless a later stage proves the need.

## Evaluation

From Stage 3: golden set of ~10 ML/AI topics/concepts, structural checks, and an
LLM-as-judge rubric (pass/fail per criterion, spot-checked by hand). Run on every
prompt or model change; reports stored so quality is tracked over time.

## Data & infrastructure

- PostgreSQL in Docker for development; SQLAlchemy + Alembic migrations.
- Secrets in `.env` (never committed); `.env.example` documents required variables.
- Live demo deployed in Stage 6 on free tiers.
- Authentication, rate limiting, background job queue and observability tooling: Stage 11.
