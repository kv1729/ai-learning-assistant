# Stage 4 — Card generation eval (2026-10-21, partial)

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

## Curriculum re-check on the new model (interrupted)

Machine Learning: valid. Remaining topics not run (stopped on request).
