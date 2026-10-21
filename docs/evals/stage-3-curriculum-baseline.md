# Stage 3 — Curriculum generation eval baseline (2026-10-05)

Prompt `curriculum/v1`, structured output `json_schema` (strict), one repair attempt.
Raw reports: `backend/evals/reports/curriculum-20261005T*.{json,md}`.

## Model comparison (5 golden topics: 4 in scope + 1 out-of-scope probe)

| Model | Result |
|---|---|
| `nvidia/nemotron-3-super-120b-a12b:free` | 5/5 valid on the first try, scope 100 %, keyword coverage 0.95–1.0, 20–30 leaves, median latency 42–57 s (max 84 s) |
| `qwen/qwen3.8-27b:free` | Not measurable: "temporarily rate-limited upstream" on two attempts |
| `google/gemma-4-31b-it:free` | Strict `json_schema` unsupported (no routable endpoint); in `json_object` mode rate-limited upstream |

**Decision:** keep Nemotron 3 Super as the default. It was the only free model available and it
met every structural target. Re-run the comparison when the others are available
(`--models "qwen/qwen3.8-27b:free,google/gemma-4-31b-it:free@json_object"`).

## Baseline with LLM judge (Nemotron, run 20261005T103626Z)

| Metric | Value |
|---|---|
| Valid / first try / scope accuracy | 100 % / 100 % / 100 % |
| Keyword coverage (must-cover groups) | 1.0 |
| Mean leaves | 27.8 |
| Median latency | 57 s |
| Judge: logical_progression | 100 % |
| Judge: appropriate_granularity | 75 % |
| Judge: coverage | 25 % |
| Judge: no_redundancy | 75 % |
| Judge: technically_accurate | 100 % |

The judge is the same model as the generator (self-judging is lenient), so treat judge
scores as a rough signal.

## Findings and actions

1. **Branch repeating its child's name** (NLP: "Transformer" branch → "Transformer" leaf, also
   Sentiment Analysis, Question Answering, Summarization). Our rules missed it.
   → Added a business rule: node names must be unique (triggers a repair). Test added.
2. **Latency close to the 90 s timeout** (NLP 79–84 s). Nemotron is a reasoning model:
   ~14.7k output tokens for a 26-concept tree, mostly hidden reasoning.
   → Timeout raised to 120 s; UI says "up to two minutes".
   → Follow-up candidate: request low reasoning effort and measure the quality impact.
3. **Judge coverage 25 %.** The judge expects more than a 30-leaf tree can hold (e.g. DDPG/TD3/SAC
   in RL). Partly a strict rubric. → Candidate for prompt v2 / rubric v2, measured against this baseline.
4. Deep Learning (first comparison run) missed Backpropagation; the baseline run included it.
   Single samples vary; compare models and prompts on several topics, not one.

## Live check

"Natural Language Processing" generated through the app: 1 attempt, 26 concepts, 84 s,
logged in `llm_calls` with model and prompt version.
