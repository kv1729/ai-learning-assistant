# AI Learning Assistant — Product & Architecture Master Plan

**Status:** Architecture reset / rebuild plan  
**Repository:** `kv1729/ai-learning-assistant`  
**Primary objective:** Build a polished mobile-first AI learning product while using the project as a practical AI Engineering portfolio vehicle.

---

# 1. Product Vision

## The product

**AI Learning Assistant — "Inshorts for Technical Learning"**

The product is a mobile-first learning application that turns difficult technical subjects into short, structured, swipeable learning experiences.

The user should be able to:

1. Choose a learning topic/domain.
2. Generate or retrieve a structured curriculum.
3. Explore concepts as learning cards.
4. Swipe through short explanations.
5. Open a deeper explanation.
6. Take a quick knowledge check.
7. Save concepts.
8. Track progress.
9. Ask an AI tutor for explanations and follow-up questions.
10. Receive personalized learning/revision recommendations.
11. Eventually use grounded retrieval over the application's knowledge base.

The product should feel like a **real mobile learning application**, not a desktop dashboard squeezed into a phone-shaped container.

---

# 2. Strategic Principle

The product is the vehicle.

The destination is becoming a strong AI Engineer and demonstrating that capability through a real system.

Every major feature should therefore answer two questions:

### Product value
What does this feature add for the learner?

### Engineering value
What real AI Engineering concept does implementing it teach or demonstrate?

Prioritize features that provide both.

Avoid adding technologies merely because they are popular.

---

# 3. Current Repository — Observed State

The current GitHub repository contains:

```text
ai-learning-assistant/
│
├── AGENTS.md
├── README.md
├── ROADMAP.md
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   │
│   ├── api/
│   │   └── cards.py
│   │
│   ├── data/
│   │   └── cards.json
│   │
│   ├── models/
│   │   └── note.py
│   │
│   ├── routes/
│   │   ├── note_route.py
│   │   └── curriculum_route.py
│   │
│   ├── services/
│   │   ├── llm_service.py
│   │   └── curriculum_service.py
│   │
│   └── tests/
│       └── test_curriculum_service.py
│
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── BottomNav.jsx
│       │   ├── LearningCard.jsx
│       │   └── ProgressBar.jsx
│       │
│       ├── screens/
│       │   ├── HomeScreen.jsx
│       │   ├── DetailScreen.jsx
│       │   ├── QuickCheckScreen.jsx
│       │   ├── Explore.jsx
│       │   └── Profile.jsx
│       │
│       └── data/
│           └── cards.js
│
└── docs/
```

## What already exists

### Frontend

React + Vite + Tailwind-based UI.

The current app has:

- Home learning feed
- swipe/keyboard navigation
- topic navigation
- learning cards
- detail screen
- quick check screen
- bottom navigation
- Explore screen
- Profile placeholder

### Backend

FastAPI.

Current card flow:

```text
React
  │
  │ GET /api/cards
  ▼
FastAPI
  │
  ▼
cards.json
  │
  ▼
structured JSON
  │
  ▼
React
```

### Initial LLM milestone

The repository also contains an early curriculum-generation implementation:

```text
React
  │
  │ POST /api/curriculum
  ▼
FastAPI
  │
  ▼
LLM service
  │
  ▼
OpenRouter
  │
  ▼
structured JSON
  │
  ▼
Pydantic validation
  │
  ▼
React
```

The implementation currently uses the OpenAI-compatible client against OpenRouter.

The current curriculum schema contains:

- topic
- nodes
- node ID
- node name
- parent ID
- depth

There is also a curriculum parsing/validation service and a backend test.

---

# 4. Important Current-State Issues

The existing repository is a prototype, not the final architecture.

Important observations:

1. `cards.json` currently contains only a very small amount of card content.
2. The frontend still contains legacy/static data structures.
3. The current curriculum endpoint is an early experiment rather than a complete learning engine.
4. Persistence is not yet implemented as a proper database-backed system.
5. LLM configuration is currently embedded too closely with application code and must be made production-safe.
6. LLM errors and provider failures need better handling.
7. The frontend/mobile UX needs to be finalized before substantial AI feature expansion.
8. Explore currently exposes curriculum generation but is not yet the final product experience.
9. Progress and saved-card persistence are not yet implemented end-to-end.
10. There is no mature RAG layer yet.
11. There is no agent orchestration layer yet.
12. There is no production authentication or deployment architecture yet.

Do not assume that existing prototype code must survive unchanged.

Reuse good pieces, but redesign where necessary.

---

# 5. Product UX Direction

## Platform

The application is fundamentally **mobile-first**.

Target mental model:

```text
┌─────────────────────────┐
│ Topic navigation        │
│                         │
│       Learning          │
│       visual            │
│                         │
│  1 / 6                  │
│                         │
│  Concept title          │
│                         │
│  Short explanation      │
│                         │
│ Explore    Quick Check  │
│                         │
│                         │
├─────────────────────────┤
│ Explore  Home  Profile  │
└─────────────────────────┘
```

On desktop during development, the app may be centered as a mobile viewport, but the application itself must not contain nested phone frames.

Avoid:

- mobile screen inside another mobile screen
- desktop dashboards
- unnecessary large rounded containers
- excessive decorative UI
- a separate Progress tab
- unnecessary animations
- excessive gradients
- tiny typography

---

# 6. Navigation

Bottom navigation:

```text
Search / Explore    Home    Profile
```

Home is the central learning experience.

Progress belongs in Profile.

Do not create a separate Progress navigation item.

---

# 7. Home Learning Feed

The Home experience is the core product.

Example topic tabs:

```text
Logistic Regression | SVM | Trees | KNN | Naive Bayes
```

These represent different concepts/topics.

They are not merely cards inside a single topic.

A card should contain:

- visual
- position indicator: `1 / 6`
- save/bookmark ribbon
- title
- ~100–120 word summary
- Explore in Depth
- Quick Check

The Save control:

```text
Not saved:
transparent background + black/dark border

Saved:
red active state
```

Cards should support:

- horizontal swipe navigation
- previous/next
- clear position indicator
- accessible buttons
- touch-friendly controls

---

# 8. Detail / Explore in Depth

The detail experience is not a longer copy of the summary.

It should provide:

- concept intuition
- detailed explanation
- practical examples
- formulas where useful
- visual explanation where useful
- common misconceptions
- relationship to related concepts
- key takeaway
- optional interview perspective

Typical length:

```text
300–700 words
```

depending on topic complexity.

Later, much of this content should be generated by the LLM.

---

# 9. Quick Check

Quick Check turns passive consumption into active learning.

A generated card should eventually contain:

```json
{
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "answer": "...",
  "explanation": "..."
}
```

The UI should:

1. Display the question.
2. Allow one answer.
3. Immediately show correctness.
4. Explain why.
5. Record the result.
6. Update learning progress.
7. Allow the learner to continue.

Later this becomes input to personalization.

---

# 10. Profile

Profile should eventually contain:

```text
Profile
│
├── Current learning streak
├── Concepts completed
├── Saved concepts
├── Topics in progress
├── Weak areas
├── Recommended revision
└── Learning history
```

Progress should not become another top-level navigation destination.

---

# 11. Search / Explore

Explore eventually becomes the entry point for discovering learning subjects.

Possible flow:

```text
Explore
   │
   ├── Search topic
   │
   ├── Select suggested topic
   │
   └── Generate curriculum
              │
              ▼
        Curriculum Tree
              │
              ▼
        Select concept
              │
              ▼
        Generate/retrieve content
              │
              ▼
          Learning Feed
```

The user should not have to understand the AI architecture.

The experience should feel like:

> "I want to learn X."

not:

> "I want to call an LLM."

---

# 12. UI-First Development Strategy

Claude MUST NOT begin by building the entire AI architecture.

The first objective is:

> Finalize the mobile UI using dummy data.

The UI should be reviewed with the user before moving to the AI layer.

## Stage UI-1 — Information architecture

Finalize:

- Home
- Explore
- Profile
- Detail
- Quick Check
- navigation
- save
- progress representation

## Stage UI-2 — Dummy-data experience

Build the complete experience with deterministic local data.

No LLM.

No RAG.

No database requirement beyond what is needed for the prototype.

## Stage UI-3 — User review

STOP.

Show the user the implemented experience.

Ask specifically:

- What feels wrong?
- What feels missing?
- What should change?
- Is the hierarchy intuitive?
- Is typography readable?
- Is the mobile interaction natural?
- Does the card feel like a learning product?

Do not proceed to AI integration until the user explicitly approves the UI baseline.

---

# 13. Overall Architecture

The target architecture should evolve gradually.

## Stage A — UI prototype

```text
React
  │
  ▼
Local dummy data
```

Purpose:

- validate UX
- validate navigation
- validate interactions

---

## Stage B — API-backed product

```text
React
  │
  ▼
FastAPI
  │
  ▼
Database
```

Purpose:

- establish clean API contracts
- separate frontend/backend
- introduce persistence

---

## Stage C — LLM-powered content

```text
React
  │
  ▼
FastAPI
  │
  ▼
Learning Services
  │
  ▼
LLM Provider
  │
  ▼
Structured JSON
  │
  ▼
Pydantic Validation
  │
  ▼
Database
  │
  ▼
React
```

Purpose:

- real LLM integration
- structured generation
- validation
- error handling

---

# 14. LLM Architecture

The application should treat the LLM as an application dependency, not as UI logic.

Never:

```text
React → OpenRouter
```

Always:

```text
React
  ↓
FastAPI
  ↓
LLM service
  ↓
Provider
```

Backend owns:

- credentials
- provider configuration
- model configuration
- prompts
- structured-output handling
- retries
- validation
- logging
- error handling

Secrets:

```text
.env
```

Never commit API keys.

---

# 15. LLM Provider Abstraction

Start simple.

A provider interface should eventually make this possible:

```text
LLMProvider
    │
    ├── OpenRouterProvider
    ├── OpenAIProvider
    └── LocalModelProvider (future)
```

Do not build three providers immediately.

Implement one clean provider first.

The abstraction should be introduced only when it provides actual value.

---

# 16. Structured LLM Outputs

The application should never depend on fragile free-form model output.

Preferred pipeline:

```text
Prompt
  ↓
LLM
  ↓
Structured JSON
  ↓
Schema validation
  ↓
Business validation
  ↓
Persistence
```

There are two different kinds of validation:

### Schema validation

Example:

- required fields
- types
- arrays
- enums

Use Pydantic.

### Semantic/business validation

Example:

- parent node must exist
- curriculum must contain a root
- IDs must be unique
- depth must match hierarchy
- card must contain a valid question
- answer must exist among options

Both are required.

---

# 17. Curriculum Generation

The first important AI workflow:

```text
User enters:

"Machine Learning"

        ↓

FastAPI

        ↓

Curriculum Planner

        ↓

LLM

        ↓

Structured curriculum

        ↓

Pydantic

        ↓

Business validation

        ↓

Database

        ↓

React
```

Example:

```text
Machine Learning
│
├── Foundations
│
├── Supervised Learning
│   ├── Regression
│   └── Classification
│       ├── Logistic Regression
│       ├── SVM
│       └── Decision Trees
│
├── Unsupervised Learning
│
├── Model Evaluation
│
└── Advanced Topics
```

The actual tree must be generated by the model rather than hardcoded.

---

# 18. Lazy Generation

Do not generate an entire content universe at curriculum creation time.

Use:

```text
Curriculum created
       ↓
Store structure
       ↓
User opens concept
       ↓
Content exists?
    /        \
  YES        NO
   ↓          ↓
Retrieve    Generate
              ↓
           Validate
              ↓
            Store
              ↓
           Retrieve
```

Benefits:

- lower cost
- faster initial generation
- less wasted content
- natural product experience
- simpler debugging

---

# 19. Content Generation Pipeline

When a user opens a concept:

```text
Concept
  ↓
Content Generator
  ├── title
  ├── summary
  ├── detailed explanation
  ├── key takeaway
  ├── formula
  ├── visual suggestion
  └── quick check
        ↓
Schema validation
        ↓
Quality validation
        ↓
Database
        ↓
React
```

The generator should eventually use separate prompts or stages when that improves quality.

Do not automatically split every task into multiple LLM calls.

---

# 20. RAG — When and Why

RAG is important, but it should not be added merely because it is a fashionable AI architecture.

RAG becomes useful when the application needs to answer questions using a knowledge corpus.

Examples:

- course notes
- technical documentation
- uploaded study material
- trusted references
- textbook excerpts
- internal learning content

Architecture:

```text
Documents
   ↓
Ingestion
   ↓
Chunking
   ↓
Embedding model
   ↓
Vector index
```

At query time:

```text
User question
      ↓
Query embedding
      ↓
Retriever
      ↓
Relevant chunks
      ↓
Prompt + context
      ↓
LLM
      ↓
Grounded answer
```

---

# 21. Database Strategy

Use a relational database as the system of record.

Initial recommendation:

```text
PostgreSQL
```

For local development, SQLite may be acceptable during the earliest stage.

The long-term system should separate:

### Relational data

- users
- curricula
- topics
- cards
- progress
- saved cards
- quiz attempts
- recommendations

### Semantic retrieval data

- embeddings
- document chunks
- semantic metadata

Prefer PostgreSQL + pgvector before introducing a separate vector database unless scale or operational requirements justify another system.

This keeps the architecture simpler.

---

# 22. Knowledge Graph

Knowledge graphs become useful when relationships between concepts become a first-class product capability.

Example:

```text
Logistic Regression
       │
       ├── prerequisite → Probability
       │
       ├── uses → Sigmoid
       │
       ├── related_to → SVM
       │
       ├── alternative_to → Naive Bayes
       │
       └── evaluated_by → ROC-AUC
```

Initially this can be represented using relational relationships:

```text
topic_relationships
-------------------
source_topic_id
target_topic_id
relationship_type
```

Do not introduce Neo4j immediately.

Move to a graph database only if graph queries become sufficiently important.

---

# 23. RAG + Knowledge Graph

Eventually these systems can complement one another.

```text
                    User Question
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        Semantic Retrieval     Graph Retrieval
              │                     │
              ▼                     ▼
        Relevant Content      Concept Relationships
              │                     │
              └──────────┬──────────┘
                         ▼
                  Context Builder
                         │
                         ▼
                        LLM
                         │
                         ▼
                 Grounded Answer
```

RAG answers:

> "What information is relevant?"

Graph retrieval answers:

> "How are these concepts related?"

They solve different problems.

---

# 24. AI Tutor

The AI Tutor should not initially be a generic chatbot.

It should be context-aware.

Example actions on a card:

```text
Explain differently
Give me an analogy
Explain mathematically
Explain visually
Ask a harder question
Connect this to SVM
```

Flow:

```text
Current Card
     ↓
User request
     ↓
Context Builder
     ├── current concept
     ├── curriculum position
     ├── relevant previous concepts
     └── retrieved knowledge
             ↓
            LLM
             ↓
         response
```

Later:

```text
Tutor
  ↓
Conversation memory
  ↓
RAG
  ↓
Knowledge relationships
```

---

# 25. Agent Orchestration

Agent orchestration is a later phase.

Do not start with a multi-agent architecture.

First implement deterministic services.

For example:

```text
generate_curriculum()
generate_card()
validate_content()
retrieve_context()
```

These should be ordinary backend services.

Only introduce an agent when the application genuinely needs:

- dynamic tool selection
- multi-step reasoning
- planning
- iterative execution
- conditional workflows
- external tools

---

# 26. Future Agent Architecture

A future learning agent might look like:

```text
User Request
     ↓
Learning Agent
     │
     ├── Curriculum Tool
     ├── Retrieval Tool
     ├── Knowledge Graph Tool
     ├── Card Generation Tool
     ├── Progress Tool
     └── Recommendation Tool
             ↓
          Response
```

If workflow complexity becomes significant, evaluate:

### LangGraph

Use when the workflow becomes a stateful graph of steps, decisions, retries, or human approvals.

Example:

```text
START
  ↓
Understand request
  ↓
Need retrieval?
 ┌───────┴───────┐
NO              YES
 │                │
 │          Retrieve context
 │                │
 └───────┬────────┘
         ↓
Generate response
         ↓
Validate
    ┌────┴────┐
 VALID       INVALID
   ↓            ↓
RETURN       Repair/Retry
```

Do not add LangGraph simply to call one LLM.

---

# 27. LangChain

LangChain is optional.

Use it only if it materially reduces complexity around:

- retrieval
- model integrations
- tool interfaces
- prompt pipelines
- structured workflows

Do not use LangChain for functionality that is clearer with normal Python.

A direct FastAPI + OpenAI-compatible client + Pydantic implementation is preferable for the initial LLM milestones.

---

# 28. Recommended Technology Evolution

## Phase 1 — UI

```text
React
Vite
Tailwind
Local dummy data
```

## Phase 2 — Backend

```text
FastAPI
Pydantic
PostgreSQL/SQLite
REST APIs
```

## Phase 3 — LLM

```text
OpenAI-compatible client
OpenRouter initially
Structured outputs
Pydantic validation
Prompt templates
```

## Phase 4 — Content Pipeline

```text
LLM
Prompt chaining where useful
Validation
Quality checks
Persistence
```

## Phase 5 — Retrieval

```text
Embeddings
PostgreSQL + pgvector
RAG
```

## Phase 6 — Knowledge

```text
Concept relationships
Graph-like relational model
Potential graph DB later
```

## Phase 7 — Tutor

```text
Context management
RAG
Knowledge relationships
Conversation state
```

## Phase 8 — Agents

```text
Tool use
Planning
Stateful workflows
LangGraph only if justified
```

## Phase 9 — Production

```text
Authentication
Deployment
Observability
Rate limiting
Caching
Background jobs
Evaluation
Security
```

---

# 29. Persistence Model

A likely future relational model:

```text
users
  │
  ├── learning_progress
  │
  ├── saved_cards
  │
  └── quiz_attempts

curricula
  │
  └── topics
        │
        ├── cards
        │     └── quick_checks
        │
        └── topic_relationships

knowledge_documents
  │
  └── document_chunks
          │
          └── embeddings
```

Do not build every table immediately.

Introduce persistence as each product capability requires it.

---

# 30. API Direction

Expected API evolution:

```text
GET    /api/cards
POST   /api/curriculum
GET    /api/curriculum/{id}
GET    /api/topics/{id}
POST   /api/topics/{id}/generate
GET    /api/cards/{id}
POST   /api/cards/{id}/quick-check
POST   /api/cards/{id}/save
POST   /api/cards/{id}/progress
POST   /api/tutor
POST   /api/search
```

These are directional, not a mandate to implement everything immediately.

---

# 31. Error Handling

LLM systems fail in ways normal CRUD systems do not.

Handle:

- provider unavailable
- invalid API key
- timeout
- rate limit
- malformed model response
- schema validation failure
- semantic validation failure
- empty response
- context retrieval failure

The user should see useful application-level messages.

The backend should log diagnostic information without leaking secrets.

---

# 32. Evaluation

AI output must eventually be evaluated.

Do not assume:

```text
HTTP 200 = good AI output
```

Evaluation should eventually cover:

### Structural

- valid schema
- valid relationships
- no duplicate IDs

### Content

- factual accuracy
- completeness
- relevance
- reading level
- no hallucinated claims where grounding is required

### Product

- useful summary
- useful detail
- meaningful quiz
- appropriate difficulty

Later introduce automated evaluation datasets and regression tests.

---

# 33. Cost and Latency

Every LLM call has:

- latency
- token cost
- failure probability

Therefore:

- cache generated content
- use lazy generation
- avoid duplicate generation
- use smaller models where appropriate
- use stronger models where quality justifies them
- separate generation from user-facing latency when appropriate
- consider background jobs later

Do not optimize prematurely, but design so optimization is possible.

---

# 34. Security

Never expose:

- LLM API keys
- database credentials
- internal service credentials

Frontend:

```text
React → FastAPI
```

Backend:

```text
FastAPI → providers/databases
```

Later add:

- authentication
- authorization
- input validation
- rate limiting
- abuse protection
- secret management
- audit logging where appropriate

---

# 35. Development Phases

## PHASE 0 — Architecture & UI Contract

Goal:

Finalize what the application looks and feels like.

Deliver:

- navigation
- Home
- Explore
- Profile
- Detail
- Quick Check
- save interaction
- progress representation
- responsive mobile behavior

**Checkpoint required.**

STOP and ask the user for approval.

---

## PHASE 1 — UI Implementation With Dummy Data

Goal:

Make the complete app flow work without AI.

Flow:

```text
Explore
   ↓
Choose topic
   ↓
Curriculum
   ↓
Choose concept
   ↓
Home learning feed
   ↓
Explore in Depth
   ↓
Quick Check
   ↓
Progress
   ↓
Profile
```

Use deterministic mock data.

**Checkpoint required.**

---

## PHASE 2 — Backend Contract

Goal:

Move the frontend from local mock data to FastAPI APIs.

Implement:

- clean models
- endpoints
- service layer
- error handling
- API contracts

No sophisticated AI yet.

**Checkpoint required.**

---

## PHASE 3 — First LLM Workflow

Goal:

Make the first real AI-powered feature.

Implement:

```text
Topic
 ↓
FastAPI
 ↓
LLM
 ↓
Structured JSON
 ↓
Pydantic
 ↓
Database
 ↓
React
```

Start with curriculum generation.

**Checkpoint required.**

---

## PHASE 4 — AI Card Generation

Generate:

- title
- summary
- detailed explanation
- key takeaway
- formula when relevant
- quick check
- visual suggestion

Use lazy generation.

**Checkpoint required.**

---

## PHASE 5 — Learning State

Implement:

- progress
- saves
- quiz attempts
- completed concepts
- resume position

**Checkpoint required.**

---

## PHASE 6 — RAG

Introduce:

- document ingestion
- chunking
- embeddings
- vector retrieval
- grounded generation

**Checkpoint required.**

---

## PHASE 7 — AI Tutor

Implement context-aware tutoring.

Start with deterministic actions before open-ended chat.

**Checkpoint required.**

---

## PHASE 8 — Personalization

Use:

- learning history
- quiz performance
- saved content
- weak topics

Generate:

- revision suggestions
- recommended next concepts
- daily feed

**Checkpoint required.**

---

## PHASE 9 — Agentic Workflows

Only now evaluate:

- tools
- agent planning
- LangGraph
- multi-step workflows

Introduce them only where they simplify a real workflow.

**Checkpoint required.**

---

## PHASE 10 — Production Readiness

Implement:

- authentication
- deployment
- observability
- caching
- background jobs
- rate limits
- evaluation
- security
- performance

---

# 36. Claude Operating Protocol

Claude is explicitly allowed to experiment.

However, experimentation must happen inside controlled boundaries.

## Before every stage

Claude must:

1. Inspect the repository.
2. Inspect relevant current implementation.
3. Explain the intended changes briefly.
4. State what will NOT be changed.
5. Define acceptance criteria.

Then implement.

## After every stage

Claude must:

1. Run validation.
2. Summarize changes.
3. Show the resulting user flow.
4. Explain important architectural decisions.
5. Report known limitations.
6. STOP.

Claude must ask the user for approval before beginning the next stage.

Do not silently continue through all phases.

---

# 37. Controlled Experimentation Rules

Claude may:

- refactor code
- create new modules
- propose alternate architecture
- test libraries
- prototype implementations
- improve UI
- experiment with prompts
- compare approaches

But Claude must:

- preserve git checkpoints
- avoid destructive changes without approval
- avoid unnecessary dependencies
- avoid rewriting working functionality without justification
- clearly identify experimental code
- validate before claiming success

Prefer a branch or checkpoint before major architectural changes.

---

# 38. Git Discipline

Recommended workflow:

```text
main
 │
 ├── stable checkpoint
 │
 └── feature branch
       │
       ├── implementation
       ├── tests
       └── review
              │
              ▼
             merge
```

Each major phase should end with a meaningful commit.

Example:

```text
feat: finalize mobile learning UI
feat: add FastAPI learning APIs
feat: add structured curriculum generation
feat: add AI card generation
feat: add learning progress
feat: add RAG retrieval
feat: add AI tutor
```

---

# 39. Definition of the Final Product

The finished product should support:

```text
USER
 │
 ▼
Explore/Search
 │
 ▼
Choose Learning Topic
 │
 ▼
AI Curriculum
 │
 ▼
Concept
 │
 ▼
AI-generated Learning Card
 │
 ├───────────────┐
 ▼               ▼
Read           Explore
 │               │
 ▼               ▼
Swipe         Deep Dive
 │
 ▼
Quick Check
 │
 ▼
Progress
 │
 ▼
Profile
 │
 ├── Weak areas
 ├── Saved cards
 ├── Revision
 └── Recommendations
```

And eventually:

```text
                 ┌───────────────┐
                 │  AI Learning  │
                 │    Engine     │
                 └───────┬───────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   LLM Generation       RAG          Knowledge Graph
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                    AI Tutor
                         │
                         ▼
                 Personalization
                         │
                         ▼
                   Learning Feed
```

---

# 40. Final Architecture Principle

Do not build a "technology showcase."

Build a learning product.

The technology should emerge from real product requirements:

```text
Need structured content
        ↓
LLM

Need reliable structure
        ↓
Pydantic / schemas

Need persistence
        ↓
Database

Need semantic retrieval
        ↓
Embeddings + vector search

Need relationships
        ↓
Knowledge graph / graph-like model

Need contextual tutoring
        ↓
RAG + context management

Need multi-step decisions/tools
        ↓
Agent orchestration / LangGraph

Need production reliability
        ↓
Evaluation + observability + deployment
```

The architecture should remain as simple as possible while still demonstrating serious AI Engineering practices.

---

# 41. Immediate Instruction to Claude

**Do not implement the entire roadmap immediately.**

Start with:

## Stage 0 — Repository review + UI redesign proposal

1. Inspect the entire existing repository.
2. Understand the current implementation.
3. Identify what can be reused.
4. Identify what should be replaced.
5. Produce a concise architecture/UI proposal for the mobile application.
6. Do not modify application code yet unless required for inspection/testing.
7. Ask the user for approval.

After approval:

## Stage 1 — Mobile UI with dummy data

Build and validate the complete UI experience.

Then STOP and ask for feedback.

Only after UI approval:

## Stage 2 — Backend integration

Then:

## Stage 3 — LLM integration

Then continue through the roadmap one stage at a time.

**The user must remain the approval gate between stages.**

---

# 42. Non-Negotiable Product Constraint

The application is a **mobile learning app first** and an AI Engineering demonstration second.

AI must make the learning experience better.

Do not let the architecture overwhelm the product.

The final experience should feel simple to the learner even though the underlying system demonstrates:

- LLM engineering
- structured generation
- API design
- validation
- retrieval
- embeddings
- knowledge representation
- agentic workflows
- personalization
- evaluation
- production engineering
