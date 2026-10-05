# Frontend — AI Learning Assistant

Mobile-first React app (Vite, Tailwind v4, React Router). In Stage 1 all data
comes from an in-browser mock API; there is no backend or AI yet.

## Run

```bash
npm install
npm run dev          # http://localhost:5173 — use a phone-sized window or device emulation
npm run build        # production build
npm run lint
npm run check:mock   # validate mock content against the Stage 0 contract
```

## Structure

```text
src/
├── api/
│   ├── client.js        # the only data entry point for screens (re-exports the mock)
│   ├── mockApi.js       # mock of the backend endpoints, with simulated latency/generation
│   ├── learnerStore.js  # learner state (saves, answers, progress) in localStorage
│   └── errors.js        # ApiError { code, message, retryable }
├── data/mock/           # seeded curriculum + concept content in the contract shape
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

## Mock behaviour (for reviewing UI states)

- Logistic Regression, SVM, Decision Trees: content ready.
- KNN: "generates" for ~2.5 s on first open (skeleton state). Opening Decision Trees prefetches it.
- Naive Bayes: first generation fails as rate-limited; **Try again** succeeds.
- Other concepts: generation fails with "no mock content" (non-retryable error state).
- Explore in Depth exists for all Logistic Regression cards and SVM cards 1–3; others show the unavailable state.
- Building a new curriculum in Explore shows the planning state, then a "not available yet" message.
- Learner progress persists in `localStorage` (`ala.learner.v1`); clear it to start fresh.
