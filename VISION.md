# Vision — AI Learning Assistant

**"Inshorts for technical learning."** A mobile-first app that turns difficult ML/AI
subjects into short, swipeable, genuinely useful learning cards, with depth on demand.

It is a learning product first and an AI Engineering portfolio second: AI must make
the learning better, and every major feature should add learner value *and* teach a
real AI-engineering practice.

## Who it is for

Engineers (starting with the developer) who want serious, accurate understanding of
ML/AI concepts in short sessions. Domain is ML/AI only at first.

## Core experience

1. **Explore** — "I want to learn X." Search or pick a topic; the app builds a curriculum.
2. **Curriculum** — a generated tree (e.g. Machine Learning › Supervised › Classification).
3. **Feed (Home)** — top tabs are sibling concepts (Logistic Regression | SVM | Trees | KNN).
   Each concept is a set of ~6 cards, one per facet:
   why it matters · intuition · the math · worked example · pitfalls · comparison.
4. **Card** — visual (diagram or formula), `N / 6` indicator, save ribbon, title,
   ~100–120 word summary, *Explore in Depth*, *Quick Check*. Horizontal swipe.
5. **Explore in Depth** — 300–700 words: intuition, explanation, formulas, examples,
   misconceptions, related concepts, takeaway. Not a longer copy of the summary.
6. **Quick Check** — one question, one answer, immediate feedback with explanation, result recorded.
7. **Profile** — progress, saved cards, topics in progress, quiz history. (No Progress tab.)
8. **Tutor (later)** — per-card actions: explain differently, analogy, mathematically, harder question.

The learner never needs to know about the AI architecture.

## UI rules

- Mobile-first web app (PWA). On desktop, one centred mobile viewport — no nested phone frames.
- Bottom navigation: **Explore · Home · Profile**.
- Clean and technical: readable typography, restrained colour, no dashboard layouts,
  no gratuitous gradients, rounded containers or animations.
- Save control: outlined when not saved, red when saved.
- Every async view has a skeleton/loading state and a friendly error state.

## Product principles

- Build the product, not a technology showcase. Technology enters when a requirement needs it.
- Generated content is cached and shared per concept; generation is lazy.
- Accuracy matters more than volume: validate, evaluate, and (later) cite sources.
- Near-zero running cost during development.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the technical design and
[STAGES.md](STAGES.md) for the build plan.
