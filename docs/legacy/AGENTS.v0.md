# AI Learning Assistant — Agent Instructions

## 1. Project Identity

This repository contains an AI-powered technical learning assistant.

The product vision is:

> "Inshorts for Technical Learning"

The product is not intended to be a traditional flashcard application, course platform, or generic chatbot.

The core UX is a mobile-first learning feed where users consume short but intellectually useful technical learning cards and can go deeper when needed.

The product is also an AI Engineering learning vehicle for the developer maintaining this repository.

Therefore:

- The product must become genuinely AI-powered.
- Architecture should teach and demonstrate real AI engineering practices.
- Prefer simple, explainable architecture over unnecessary frameworks.
- Avoid premature infrastructure.
- Preserve the existing mobile learning experience unless a change is explicitly required.

---

# 2. Development Philosophy

The developer is intentionally using AI coding agents to accelerate implementation.

The goal is:

> AI builds the product → developer studies and reverse-engineers the implementation.

Therefore, agents should:

1. Make meaningful implementation progress.
2. Avoid unnecessary manual work.
3. Prefer clean, conventional architecture.
4. Explain important architectural decisions after implementation.
5. Avoid introducing abstractions that are not currently needed.
6. Make surgical changes rather than rewriting working systems unnecessarily.

Do not optimize for producing the largest possible code change.

Optimize for:

- working software
- maintainability
- learning value
- clear architecture
- incremental evolution

---

# 3. Current Product Vision

The user should eventually be able to:

1. Select a learning domain.
2. Generate or retrieve a learning curriculum.
3. Explore topics within that curriculum.
4. Read an immersive learning feed.
5. Open detailed explanations.
6. Take quick checks.
7. Track learning progress.
8. Ask an AI tutor questions.
9. Receive personalized recommendations.
10. Retrieve knowledge using RAG.
11. Eventually interact with a knowledge graph and external tools.

The final system is expected to evolve toward:

React
    ↓
FastAPI
    ↓
Learning Engine
    ↓
LLM + Retrieval + Knowledge Layer
    ↓
Persistent Learning Data

Do not implement all of these layers at once.

---

# 4. Current Repository Structure

The repository currently contains two major applications.

## Frontend

The frontend is a React/Vite application.

Current important structure:

frontend/
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── main.jsx
│   │
│   ├── components/
│   │   ├── BottomNav.jsx
│   │   ├── LearningCard.jsx
│   │   └── ProgressBar.jsx
│   │
│   ├── screens/
│   │   ├── HomeScreen.jsx
│   │   ├── DetailScreen.jsx
│   │   ├── QuickCheckScreen.jsx
│   │   ├── Explore.jsx
│   │   └── Profile.jsx
│   │
│   ├── data/
│   │   └── cards.js
│   │
│   └── assets/
│
└── package.json

The frontend originally used hardcoded card data.

It has now been moved toward consuming learning-card data from the FastAPI backend.

---

# 5. Current Backend Structure

The backend is a FastAPI application.

Current important structure:

backend/
├── main.py
├── requirements.txt
│
├── api/
│   └── cards.py
│
├── data/
│   └── cards.json
│
├── models/
├── routes/
└── services/

The backend currently exposes a cards API.

The current flow is approximately:

React
    ↓
GET /api/cards
    ↓
FastAPI
    ↓
cards.json
    ↓
JSON response
    ↓
React

This is an important milestone.

Do not remove this working behavior without a reason.

---

# 6. Current API

The backend currently exposes:

GET /api/cards

The response contains learning-card information including:

- topic
- card ID
- title
- image
- summary
- detailed explanation
- quick check
- quick check options
- answer
- explanation where available

The frontend should consume this API rather than maintaining a second independent source of truth.

---

# 7. Existing UI — IMPORTANT

The existing mobile learning UI has already been intentionally designed and validated.

Do NOT redesign the product from scratch.

The current product direction should be preserved.

The desired experience is:

"Inshorts + Duolingo + premium AI learning app"

The feed should feel:

- mobile-first
- immersive
- swipe-oriented
- visually clean
- technical
- useful for serious learners

The main learning screen should contain:

- subtle topic navigation at the top
- learning visual
- approximately 100–120 word summary
- Explore in Depth action
- Quick Check action
- save/bookmark control
- card position indicator such as 1/6
- swipe navigation
- bottom navigation

The top topic navigation represents different technical topics, for example:

Logistic Regression
SVM
Trees
KNN
Naive Bayes

These are separate learning topics, not individual cards within one topic.

Do not replace this concept with generic navigation such as "Learning Feed", "Technical Concepts", or "Progress".

---

# 8. Mobile UI Rules

The app is designed as a mobile application.

When previewing the application on desktop, the application should still visually behave like a single mobile device.

Do not create:

- nested mobile frames
- unnecessary rounded containers around individual screens
- desktop-style dashboards
- large desktop navigation
- unnecessary Progress navigation tabs

Bottom navigation should remain:

- Search / Explore
- Home
- Profile

Progress should eventually be represented inside Profile rather than as a separate bottom-navigation destination.

---

# 9. Detail Screen

Explore in Depth should be a genuine learning experience.

It should not merely repeat the card summary.

It should support:

- substantially deeper explanation
- conceptual intuition
- formulas where appropriate
- examples
- diagrams/visual explanations where appropriate
- connections to related concepts
- useful takeaways

The detail view should be capable of containing several hundred words when the topic requires it.

---

# 10. Quick Check

Quick Check converts passive reading into active learning.

A card should be able to provide:

- question
- multiple-choice options
- correct answer
- explanation

Example:

Question:
What happens to sigmoid(z) as z approaches positive infinity?

Options:
A. 0
B. 0.5
C. 1

The user should receive feedback after answering.

---

# 11. Current Architectural Direction

The architecture is intentionally evolving.

Current:

React
    ↓
FastAPI
    ↓
JSON

Target near-term architecture:

React
    ↓
FastAPI
    ↓
Learning Services
    ↓
LLM
    ↓
Structured JSON
    ↓
Validation
    ↓
Persistent storage
    ↓
React

Longer-term architecture:

React
    ↓
FastAPI
    ↓
Learning Engine
    ├── Curriculum Planner
    ├── Content Generator
    ├── Validator
    ├── Retriever
    ├── Tutor
    └── Recommendation Engine
            ↓
       Knowledge Layer
       ├── PostgreSQL
       ├── Vector Index
       └── Graph relationships

Do not implement the entire target architecture now.

---

# 12. Immediate Development Goal

The next major milestone is:

## LLM-powered curriculum generation

The first genuinely AI-powered workflow should be:

User enters a topic
    ↓
FastAPI
    ↓
LLM
    ↓
Structured curriculum JSON
    ↓
Pydantic validation
    ↓
Persistence
    ↓
React displays curriculum

For example:

Input:

"Machine Learning"

Potential generated structure:

Machine Learning
├── Foundations
├── Supervised Learning
│   ├── Regression
│   └── Classification
│       ├── Logistic Regression
│       ├── SVM
│       └── Decision Trees
├── Unsupervised Learning
├── Reinforcement Learning
└── Model Evaluation

The exact generated curriculum must come from the model and must not be hardcoded into the application.

---

# 13. LLM Integration Requirements

The LLM must not be called directly from React.

Use:

React
    ↓
FastAPI
    ↓
LLM service
    ↓
LLM provider

The backend owns:

- API credentials
- prompt construction
- model configuration
- validation
- error handling
- response normalization

Never expose LLM API keys to the frontend.

Use environment variables for secrets.

Never commit secrets.

---

# 14. Structured Output

LLM responses must not be treated as arbitrary text.

Use Pydantic models to define expected structures.

Conceptually:

LLM
 ↓
Structured response
 ↓
Pydantic validation
 ↓
Application object
 ↓
Database

If the LLM produces invalid data:

- do not silently accept it
- return a meaningful error
- where appropriate, retry or repair the response
- log enough information for debugging without exposing secrets

---

# 15. Lazy Content Generation

Do not generate every learning card when a curriculum is created.

Instead:

User creates curriculum
    ↓
Store curriculum tree
    ↓
User selects a topic
    ↓
Check whether content exists
       ├── YES → retrieve
       └── NO → generate
                    ↓
                 validate
                    ↓
                  store
                    ↓
                 retrieve

This reduces:

- unnecessary LLM calls
- latency
- cost
- duplicated content

---

# 16. Future RAG Architecture

RAG is part of the roadmap but should not be implemented prematurely.

Eventually:

User question
    ↓
Retriever
    ↓
PostgreSQL + vector search + knowledge relationships
    ↓
Relevant context
    ↓
LLM
    ↓
Grounded response

PostgreSQL remains the source of truth.

Vector search is used for semantic retrieval.

Graph relationships are used for explicit conceptual relationships.

Do not introduce a vector database merely because it is an AI application.

Introduce it when semantic retrieval becomes a real requirement.

---

# 17. Future Knowledge Graph

The initial curriculum can use hierarchical relationships:

parent_id

Example:

Machine Learning
    └── Supervised Learning
        └── Classification
            └── Logistic Regression

Later this can evolve into explicit relationships:

Logistic Regression
    ├── prerequisite → Probability
    ├── uses → Sigmoid
    ├── similar_to → SVM
    ├── alternative_to → Naive Bayes
    └── evaluated_by → ROC-AUC

Do not introduce Neo4j or another graph database yet unless a concrete requirement justifies it.

---

# 18. Future AI Tutor

Eventually each card should support interactions such as:

- Explain differently
- Give an analogy
- Explain mathematically
- Explain visually
- Ask a harder question
- Connect this concept to a previous concept

This should build on the existing knowledge/retrieval architecture rather than becoming an isolated chatbot.

---

# 19. Engineering Principles

Always:

1. Inspect the existing implementation before changing it.
2. Reuse working components.
3. Make surgical changes.
4. Avoid unnecessary rewrites.
5. Keep frontend and backend responsibilities separate.
6. Keep API contracts explicit.
7. Validate external/LLM data.
8. Keep secrets out of source control.
9. Run tests/build checks after significant changes.
10. Preserve existing functionality unless the task explicitly changes it.

Do not add a dependency unless there is a clear reason.

Do not introduce LangChain, LangGraph, Neo4j, a vector database, MCP, or multi-agent orchestration simply for the sake of using those technologies.

Use direct Python/FastAPI implementations when they are sufficient.

---

# 20. Agent Workflow

For every substantial task:

### Phase 1 — Inspect

Before modifying code:

- inspect repository structure
- inspect relevant files
- inspect existing API contracts
- identify dependencies
- identify existing tests
- identify risks

### Phase 2 — Plan

Provide a concise implementation plan.

Identify:

- files to change
- files to create
- files that should remain untouched
- architectural decisions
- validation strategy

### Phase 3 — Implement

Make the smallest coherent set of changes required.

### Phase 4 — Validate

Run appropriate:

- frontend build
- backend checks
- tests
- API checks

Fix problems found during validation.

### Phase 5 — Report

At the end report:

1. What changed.
2. Why it changed.
3. Files changed.
4. Tests/checks run.
5. Remaining issues.
6. Important architectural decisions.
7. Suggested next milestone.

Do not claim success without actually validating the implementation.

---

# 21. Learning-Oriented Reporting

This project is also an AI Engineering learning project.

After significant implementation work, explain the important concepts used.

For example:

- Why was this service layer introduced?
- Why is Pydantic used here?
- Why does the LLM call live in the backend?
- Why is the response validated?
- Why is the data persisted?
- Why was this abstraction chosen?
- What would change at 1,000 users?
- What would change at 1 million users?

Do not explain every line of trivial code.

Focus on architectural and AI engineering decisions.

---

# 22. Current Task Priority

Priority order:

1. LLM integration
2. Structured curriculum generation
3. Validation
4. Persistence
5. React integration
6. Lazy topic content generation
7. Learning interaction
8. RAG
9. Knowledge relationships
10. AI Tutor
11. Personalization
12. Production readiness
13. MCP/external tools

Do not jump ahead without a concrete reason.

---

# 23. Definition of Success for the Next Milestone

The next milestone is complete when:

A user can enter a topic such as:

"Machine Learning"

and the system:

1. Sends the topic to FastAPI.
2. FastAPI calls the configured LLM.
3. The LLM generates a structured curriculum.
4. The backend validates the structure.
5. The backend persists the curriculum.
6. React receives the curriculum.
7. React displays it.
8. Errors are handled gracefully.
9. No LLM credentials are exposed to the frontend.
10. Existing learning-feed functionality remains intact.

At that point, we have our first genuine AI-powered end-to-end workflow.

---

# 24. Do Not Do These Things During the Next Task

Do NOT:

- redesign the existing UI
- rebuild the mobile feed
- add authentication
- add payments
- add analytics
- add a vector database
- add a graph database
- add MCP
- build multi-agent orchestration
- rewrite the entire repository
- replace working FastAPI code unnecessarily
- remove the existing learning feed
- hardcode the generated curriculum

The immediate goal is to add the first real LLM-powered capability while preserving the product we already have.