# Stage 0.1 — Prototype Review (`prototype-v0`)

Reviewed 2026-10-05 at commit `6c4dd0b` (tagged `prototype-v0`).

## Baseline checks

| Check | Result |
|---|---|
| `npm run build` (frontend) | Passes |
| `npm run lint` (frontend) | **2 errors**: unused `nodesById` (`Explore.jsx:44`); `setState` inside effect (`HomeScreen.jsx:18`) |
| Backend start from `backend/` (`import main`) | **Fails**: `No module named 'backend'` |
| Backend start from repo root (`import backend.main`) | **Fails**: `No module named 'api'` |
| `pytest backend/tests` | **Cannot run**: pytest not installed / not in `requirements.txt` |

The backend only starts with a hand-crafted `PYTHONPATH` containing both the repo root and `backend/`.

## Bugs and defects

### Backend
1. **Mixed import roots** — `main.py` imports `api.cards` (relative to `backend/`) and `backend.routes...` (relative to the repo root). See the start failures above.
2. **Double `/api` prefix** — `curriculum_route.py` declares `prefix="/api"` and `main.py` adds `prefix="/api"` again, so the endpoint is `/api/api/curriculum`. The frontend calls `/api/curriculum` and gets 404.
3. **Incomplete `requirements.txt`** — missing `openai`, `python-dotenv`, `pytest`; a fresh install cannot run the curriculum route or tests.
4. **LLM client created at import time** with a hardcoded free model (`nex-agi/nex-n2-pro:free`) and base URL; a missing key surfaces only at request time with an unclear error.
5. **JSON by prompting + regex stripping** instead of native structured output; no business validation (parents exist, unique IDs, depth consistency, single root).
6. **Blocking call in async route** — `async def create_curriculum` calls the synchronous OpenAI client, blocking the event loop.
7. **All LLM failures become HTTP 400** — provider outages, timeouts and rate limits are reported as client errors.
8. **No persistence** — curricula are returned and forgotten.
9. **Dead code** — `analyze_note` unused; `routes/note_route.py` and `models/note.py` are empty; `models/card.py` defined but unused by the cards route.
10. **CORS** allows all origins *with* credentials.

### Frontend
1. **Fixed 430×844 rounded frame** — on a real phone the app is a fixed-size box, not full-screen; on desktop it is the "phone frame" the UI rules warn about.
2. **Crash when the API fails** — the empty-state branch is unreachable (`if (loading) { if (!loading ...) }`), so with zero cards `LearningCard` dereferences `undefined.image`.
3. **Topic tabs are hardcoded** and clicking one changes only the highlight, not the content.
4. **Broken card image** — `cards.json` references `/cards/sigmoid.png`, but the file lives in `src/assets/cards/`, not `public/`.
5. **Hardcoded backend URLs**, inconsistent (`127.0.0.1:8000` vs `localhost:8000`); no env config or Vite proxy.
6. **Save state is not persisted** and resets when the card component remounts; uses an emoji and orange instead of the outlined/red spec.
7. **No browser history** — screens are a `useState` switch, so the phone's Back button leaves the app.
8. **Unused/duplicate files** — `Profile.jsx` (unused, fake stats, light theme), `ProgressBar.jsx` (unused), `src/data/cards.js` (unused), `frontend/ai-learning-assistant/src/data/cards.js` (stray duplicate).
9. **Style drift from `VISION.md`** — gradient buttons, many large rounded containers, emoji icons, 10px uppercase labels.
10. **Debug logging** of every API response.

### Docs
- `docs/api/API.md`, `docs/architecture/Architecture.md`, `docs/learning/LearningLog.md`, `docs/prompts/PromptEngineering.md`, `docs/sprints/Sprint-03-Backend-Foundation.md` are **empty (0 lines)**.
- `README.md` describes an older roadmap and stack.

## Reuse / replace

| Item | Verdict | Notes |
|---|---|---|
| `CurriculumNode` / `CurriculumResponse` Pydantic models | **Reuse** (Stage 3) | Extend with business validation |
| `parse_curriculum_payload` + its 3 tests | **Reuse** (Stage 3) | Keep as fallback path for models without native structured output |
| Curriculum prompt text | **Reuse as a starting point** | Move into a versioned prompt file |
| Explore tree-building logic (`childrenByParent`) | **Reuse idea** | Rebuild as a component |
| Swipe + arrow-key handling | **Reuse idea** | Rebuild with history-aware navigation |
| Quick Check answer/feedback logic | **Reuse idea** | Switch to `answer_index` |
| Card copy in `src/data/cards.js` (Logistic Regression) | **Reuse as mock content** | Reshape to the new schema |
| `sigmoid.png` | Optional | Visuals become diagrams/formulas |
| App shell, screen styling, `Profile.jsx`, `ProgressBar.jsx` | **Replace** | Style drift and layout bugs above |
| `cards.json` + cards route/service | **Replace** | Single card; becomes DB seed data in Stage 2 |
| `llm_service.py` | **Replace** | Provider interface, config, logging, async |
| Notes route/model, `analyze_note` | **Drop** | Not in scope |
| Empty `docs/*` files and `README.md` | Move empty files to `docs/legacy/` (approved); rewrite README in Stage 1 | |

## How the rebuild proceeds

The rebuild happens on the `rebuild` branch in fresh `frontend/` and `backend/` code.
Agreed mechanics: move the current `frontend/` and
`backend/` to `legacy/frontend` and `legacy/backend` (kept for reference, removed
only with approval later), then scaffold new ones and port the items marked *Reuse*.
