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
