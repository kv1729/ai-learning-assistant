# Agent Instructions

Operating rules for AI coding agents working in this repository.

## Read first

1. [STAGES.md](STAGES.md) — which stage is active and its exit criteria. **Work only on the active stage.**
2. [VISION.md](VISION.md) — what the product is and the UI rules.
3. [ARCHITECTURE.md](ARCHITECTURE.md) — target design.
4. [docs/DECISIONS.md](docs/DECISIONS.md) — decisions already made. Do not re-litigate them; propose changes explicitly.

`docs/legacy/` holds superseded plans and the old agent file. Treat it as history, not instructions.

## Purpose of the project

A mobile-first ML/AI learning app *and* the developer's AI-engineering learning vehicle:
the agent builds, the developer studies the implementation. So:

- Prefer simple, conventional, explainable code over frameworks and abstractions.
- Add a dependency only with a clear reason; state it.
- No LangChain, LangGraph, vector DB, graph DB, MCP or multi-agent orchestration unless a stage explicitly calls for it.

## Workflow for every stage

1. **Inspect** the relevant code and contracts before changing anything.
2. **Plan** briefly: files to create/change, what will *not* change, acceptance criteria.
3. **Implement** the smallest coherent change set.
4. **Validate:** frontend build + lint, backend tests, API checks, evals where relevant. Never claim success without running them.
5. **Report:** what changed and why, files, checks run (with results), known issues,
   key architectural/AI-engineering concepts explained for learning, suggested next step.
6. **Update `STAGES.md`** (status/dates) and `docs/DECISIONS.md` (any decisions made).
7. **Stop** at the stage gate and wait for user approval before starting the next stage.

## Hard rules

- Never delete or overwrite data, files, tables or git history without explicit user approval; prefer moving/copying.
- Never call an LLM from the frontend. Never expose or commit secrets; use environment variables and keep `.env.example` current.
- LLM output is untrusted: schema-validate and business-validate; return meaningful errors; log without secrets.
- Do not hardcode generated content (curricula, cards) in application code; mock data is allowed only in Stage 1 and seeds.
- Default LLM is an OpenRouter free model selected via configuration. If it proves unreliable, propose a specific alternative before switching.
- Keep the mobile UI rules in `VISION.md`: one mobile viewport, bottom nav Explore · Home · Profile, no Progress tab, no nested phone frames.
- Work on a feature branch; commit only when the user asks.

## Repository layout

```text
frontend/        Stage 1 rebuild: React + Vite mobile app on mock data (see frontend/README.md)
backend/         prototype FastAPI backend (to be replaced in Stage 2)
legacy/frontend  prototype UI, kept for reference
docs/stage-0/    review, domain model/API contract, UI proposal
docs/legacy/     superseded plans
```

The previous prototype is also tagged `prototype-v0`.
