# Frontend — AI Learning Assistant

Mobile-first React app (Vite, Tailwind v4, React Router). Learning content comes
from the FastAPI backend (see backend/README.md); learner progress is kept in the
browser until Stage 5.

## Run

```bash
npm install
npm run dev          # http://localhost:5173 — proxies /api to the backend on :8000
npm run build        # production build
npm run lint
```

Optional `frontend/.env.local`: `VITE_PREFETCH_NEXT=false` stops the feed from generating the
next concept in the background (saves free LLM quota).

## Structure

```text
src/
├── api/
│   ├── client.js        # the only data entry point for screens
│   ├── http.js          # fetch wrapper; turns error responses into ApiError
│   ├── contentApi.js    # content endpoints (curricula, feed, cards)
│   ├── learnerApi.js    # saves, answers, progress, profile (browser-side until Stage 5)
│   ├── learnerStore.js  # localStorage persistence for learner state
│   └── errors.js        # ApiError { code, message, retryable }
├── components/          # cards, pager, tabs, visuals (KaTeX / Mermaid / icon), nav
├── screens/             # Feed, Detail, Quick Check, Explore, Curriculum, Profile, Saved
├── state/               # LearnerProvider + useLearner
├── hooks/               # useAsync, usePrefersDark
├── lib/                 # facet labels, paths, Mermaid loader, shared button styles
└── router.jsx           # URL routes (Back button works)
```

## Routes

| Path | Screen |
|---|---|
| `/` | Redirects to the resume position (or the first concept with content) |
| `/learn/:nodeId/:position` | Feed; position 1–6 are cards, 7 is the completion card |
| `/learn/:nodeId/:position/detail` | Explore in Depth (lazy-loaded) |
| `/learn/:nodeId/:position/check` | Quick Check |
| `/explore`, `/explore/:curriculumId` | Topic search, curricula, curriculum tree |
| `/profile`, `/profile/saved` | Progress, saved cards, needs review |

## Content states you can see today

- Seeded concepts (Logistic Regression, SVM, Decision Trees, KNN, Naive Bayes) have cards.
- Any other concept: opening it generates its six cards with the LLM (about one to two minutes,
  once), then they are served from the database.
- Explore in Depth is generated the first time a card's page is opened, then stored.
- Learner progress lives in `localStorage` (`ala.learner.v2`).
