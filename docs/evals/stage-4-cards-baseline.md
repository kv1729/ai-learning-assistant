# Stage 4 — Card generation eval (2026-10-21)

Prompt `concept_cards/v1`, strict `json_schema`, one repair attempt, 4 golden concepts
(Gradient Descent, K-Means Clustering, Backpropagation, ROC & AUC), judge = generator model.
Raw report: `backend/evals/reports/cards-20261021T112816Z.{json,md}`.

## Model change

`nvidia/nemotron-3-super-120b-a12b:free` stopped working upstream (404 "Function not found"
from NVIDIA on every call). A one-request probe per candidate showed
`nvidia/nemotron-3.5-super-vl:free` responding (strict JSON, 1.2 s); Gemma 4 31B was
rate-limited upstream. With the user's approval the default moved to Nemotron 3.5 Super VL.

## Results (Nemotron 3.5 Super VL)

| | Default reasoning | Low reasoning |
|---|---|---|
| Valid / first try | 3/4 (one NVIDIA 502) | 4/4 |
| Keyword coverage | 0.89 | 1.0 |
| Judge: technically_accurate | 33 % | 100 % (3 judged) |
| Judge: facet_fidelity, worked_example_correct, quick_checks_sound, clear_for_engineers | 100 % | 100 % |
| Judge: no_redundancy | 67 % | 100 % |
| Median latency per concept | 259 s | 129 s |
| Median output tokens | 14.9k | 14.1k |
| Answer-index spread (A/B/C/D) | 3/6/6/3 | 6/7/6/5 |

Judge findings at default reasoning: gradient "points toward improvement" (wrong direction);
K-Means "finds dense regions" (that is density-based clustering); learning-rate effects
repeated across two cards.

**Decision:** `LLM_REASONING_EFFORT=low` by default (faster and more accurate in this sample;
n = 4, self-judged, so treat as a strong signal, not proof).

## Known issues

- Card generation takes ~2 min (up to ~6 min) on the free model; UI now says "a few minutes".
- The 180 s client timeout does not bound total time: OpenRouter keep-alive bytes reset the
  read timer (one call ran 352 s). A total deadline belongs in Stage 11 hardening.

## Curriculum re-check on the new model

Run `curriculum-20261021T113855Z`: Machine Learning valid (30 leaves, coverage 1.0, 185 s).
Deep Learning and French Cooking: NVIDIA returned 502 "Failed to generate completions" (the free
endpoint is flaky under concurrent load); the runner stopped early as designed. Re-run when
convenient: `uv run python -m evals.curriculum --topics 3`.

## Live check through the app (exit criteria)

| Step | Result |
|---|---|
| Open PCA (no cards yet) | Generation started; skeleton shown; cards ready after 196 s (1 LLM call, 221 s, 18.8k output tokens) |
| Card 3 (how_it_works) | Generated LaTeX formula rendered and scaled to fit |
| Explore in Depth on card 3 | Generated on first open (1 LLM call, 173 s, 13.9k tokens), KaTeX and headings rendered |
| Reopen card and detail | Feed 0.32 s, detail 0.26 s, **no new LLM call** (llm_calls 3 → 3) |
