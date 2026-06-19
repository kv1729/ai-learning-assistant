# AI Learning Assistant — AI-Powered Microlearning Platform

## Vision

Build an AI-powered microlearning platform that converts complex topics into swipeable learning cards for fast, engaging, and personalized learning.

Inspired by the UX of short-form content platforms like Inshorts, this product aims to make learning:

* fast
* structured
* engaging
* mobile-friendly
* personalized

The goal is to help users learn meaningful concepts in short 2–5 minute sessions.

---

## Problem Statement

Modern learning suffers from several problems:

* Books are long and difficult to revise
* Courses require large time commitments
* Video content is distracting
* Notes are passive and hard to revisit
* Learning consistency is difficult

People often struggle not because information is unavailable, but because learning systems are poorly designed for modern attention patterns.

---

## Proposed Solution

This platform transforms complex topics into structured, swipeable microlearning cards.

Example learning path:

Machine Learning
→ Supervised Learning
→ Classification
→ Logistic Regression

Each topic is broken into structured learning units.

Each unit becomes a swipeable card containing:

* title
* short explanation
* visual / diagram
* detailed explanation

This enables:

* quick learning
* fast revision
* better retention
* low-friction daily learning

---

## MVP Scope

### Phase 1 Goal

Build a web-based prototype for one topic only.

Selected topic:
**Logistic Regression**

Features:

* Home screen
* Topic selection
* Swipeable learning cards
* Detailed explanation view

Important:

* Static content only
* No AI in product yet
* No backend yet
* No authentication
* No database

Goal:
Validate whether microlearning UX works.

---

## Product Roadmap

### Phase 0 — Product Design

* Product requirements
* Architecture
* Wireframes
* Tech stack selection

### Phase 1 — UX MVP

* Static web prototype
* Swipeable cards
* Learning flow validation

### Phase 2 — Backend & Content System

* FastAPI backend
* APIs
* Content storage
* Topic hierarchy

### Phase 3 — AI-Assisted Content Generation

AI for:

* topic breakdown
* card generation
* summaries

### Phase 4 — Personalization

* progress tracking
* weak topic detection
* revision recommendations

### Phase 5 — Full AI Learning Platform

Possible future features:

* AI tutor
* quizzes
* spaced repetition
* RAG
* knowledge graph

---

## Tech Stack (Current)

### Frontend

* React
* Vite

### Backend

* FastAPI

### Database

* SQLite (initially)

### AI

* OpenRouter

---

## Development Philosophy

Build the smallest useful version first.

Avoid:

* scope explosion
* premature complexity
* unnecessary AI

Prioritize:

* user experience
* product usefulness
* execution discipline
