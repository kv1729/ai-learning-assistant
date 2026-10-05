# Stage 0.2 — Domain Model, Card Schema & API Contract

This is the contract the mock data (Stage 1), database (Stage 2) and LLM output
(Stages 3–4) must all follow. Field names are `snake_case` end to end (JSON, Python, SQL).

## 1. Entities

```text
Curriculum ──< CurriculumNode >── Concept ──< Card
  (one per      (a position in      (canonical,     (~6 facet cards)
   topic)        a tree)             shared)
```

The key design choice is separating **where a concept sits in a curriculum** from
**the concept's content**:

- `CurriculumNode` is a node in one curriculum's tree (`parent_id`, order, depth).
- `Concept` is the canonical, shared learning unit, identified by `concept_key`
  (e.g. `logistic-regression`). Cards belong to the concept, not the node.
- Two curricula that both contain "Logistic Regression" point to the same `Concept`,
  so its cards are generated once and reused — this is the global cache.
- Until Stage 7a, `concept_key` is a normalised slug of the name; Stage 7a adds
  embedding-based deduplication ("Logistic regression (classifier)" → same key).

### Curriculum
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `title` | str | e.g. "Machine Learning" |
| `requested_topic` | str | what the user typed |
| `root_node_id` | UUID | |
| `generation` | GenerationMeta | null for seeded/mock data |
| `created_at` | datetime | |

### CurriculumNode
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `curriculum_id` | UUID | |
| `parent_id` | UUID \| null | null only for the root |
| `name` | str | display name |
| `description` | str | one sentence, shown in Explore |
| `depth` | int | root = 0 |
| `position` | int | order among siblings |
| `concept_id` | UUID \| null | set only on **leaf** nodes (learnable concepts) |

Business rules: exactly one root; every `parent_id` exists; `depth = parent.depth + 1`;
no cycles; branch nodes have children, leaf nodes have a `concept_id`; max depth 4.

### Concept
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `concept_key` | str, unique | normalised slug |
| `name` | str | |
| `content_status` | enum | `not_generated` · `generating` · `ready` · `failed` |
| `generation` | GenerationMeta | how the cards were produced |

### Card
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `concept_id` | UUID | |
| `position` | int 1..N | drives the `N / 6` indicator |
| `facet` | enum | see facets below |
| `title` | str ≤ 60 chars | |
| `summary` | str, 80–130 words | the card body |
| `key_takeaway` | str, one sentence | |
| `visual` | Visual \| null | |
| `quick_check` | QuickCheck | |
| `detail` | Detail \| null | null until first opened, then generated lazily per card (decision D1) |
| `sources` | Source[] | empty until Stage 7b |

### Facets (fixed vocabulary, default order)
| # | `facet` | Card purpose |
|---|---|---|
| 1 | `why_it_matters` | the problem it solves, where it is used |
| 2 | `intuition` | the core idea without heavy math |
| 3 | `how_it_works` | the mechanism / the math (formula visual) |
| 4 | `worked_example` | a small concrete example with numbers |
| 5 | `pitfalls` | misconceptions, failure modes, assumptions |
| 6 | `compare` | vs. related/alternative concepts |

The generator always produces these six in order. A fixed vocabulary keeps the
feed consistent across concepts and makes evals simple ("is the pitfalls card
actually about pitfalls?").

### Visual
| Field | Type | Notes |
|---|---|---|
| `type` | enum | `formula` · `mermaid` · `icon` (decision D2; no raw SVG from the LLM) |
| `content` | str | LaTeX for `formula`, Mermaid source for `mermaid`, icon name for `icon` |
| `caption` | str \| null | |
| `alt_text` | str | accessibility; also helps evals |

Rendering failures (bad LaTeX/Mermaid) fall back to the `icon` visual — the card never breaks.

### QuickCheck
| Field | Type | Notes |
|---|---|---|
| `question` | str | |
| `options` | str[3..4] | unique |
| `answer_index` | int | index into `options` |
| `explanation` | str | why the answer is right (and the trap in the distractors) |

`answer_index` instead of repeating the answer text removes a whole class of
"answer not found among options" LLM errors.

### Detail (Explore in Depth)
| Field | Type | Notes |
|---|---|---|
| `body_markdown` | str, 300–700 words | Markdown with `$…$` / `$$…$$` LaTeX |
| `misconceptions` | str[] | |
| `related_concepts` | str[] | names; linked when they exist in the curriculum |
| `takeaway` | str | |

### Source (Stage 7b)
`{ chunk_id, document_title, section_path, url }`

### GenerationMeta
`{ model, provider, prompt_version, generated_at, input_tokens, output_tokens, latency_ms }`

### Learner state (Stage 5; single local user until authentication)
- `saved_card (user_id, card_id, saved_at)`
- `quiz_attempt (id, user_id, card_id, selected_index, is_correct, answered_at)`
- `concept_progress (user_id, concept_id, cards_seen[], completed_at)`
- `resume_position (user_id, curriculum_id, node_id, card_position)`

`user_id` is a random device ID stored in the browser until auth exists.

## 2. API contract (directional; built across Stages 2–5)

| Method & path | Purpose | Stage |
|---|---|---|
| `GET /api/curricula` | list curricula | 2 |
| `POST /api/curricula` `{topic}` | generate + store a curriculum | 3 |
| `GET /api/curricula/{id}` | curriculum with its node tree and concept statuses | 2 |
| `GET /api/nodes/{node_id}/feed` | sibling leaf tabs + this concept's cards (or `content_status`) | 2/4 |
| `POST /api/concepts/{id}/generate` | start generation if `not_generated`; idempotent; returns status | 4 |
| `GET /api/cards/{id}/detail` | detail (generated on first request if lazy) | 4 |
| `POST /api/cards/{id}/quiz-attempts` `{selected_index}` | record answer | 5 |
| `PUT` / `DELETE /api/cards/{id}/save` | save / unsave | 5 |
| `GET /api/me/profile` | progress, saved cards, quiz stats | 5 |

Generation is asynchronous from the client's view: the feed returns
`content_status: "generating"`, the client shows a skeleton and polls the feed
every ~2 s. (Server-sent events can replace polling later.)

**Error shape** for every non-2xx response:

```json
{ "error": { "code": "llm_rate_limited", "message": "The AI is busy, try again in a minute.", "retryable": true } }
```

Codes include `validation_error`, `not_found`, `llm_timeout`, `llm_rate_limited`,
`llm_unavailable`, `llm_invalid_output`, `internal_error`.
