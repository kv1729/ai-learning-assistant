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

- Logistic Regression, SVM, Decision Trees, KNN, Naive Bayes: cards ready.
- Explore in Depth exists for all Logistic Regression cards and SVM cards 1–3; others show "not written yet".
- Other concepts and new curricula show a clear "arrives in a later stage" message (AI generation: Stages 3–4).
- Learner progress lives in `localStorage` (`ala.learner.v2`).
