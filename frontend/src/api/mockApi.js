// In-browser mock of the backend API from docs/stage-0/02-domain-model.md.
// Each function matches a future endpoint, so Stage 2 can swap this module for
// real HTTP calls without touching the screens. Latency and generation are
// simulated so loading, skeleton and error states can be reviewed.

import { curricula, conceptContent, mockBehavior } from "../data/mock/index.js";
import { ApiError } from "./errors.js";
import { readLearner, updateLearner } from "./learnerStore.js";

const LATENCY_MS = 200;
const CURRICULUM_GENERATION_MS = 1800;
const CONCEPT_GENERATION_MS = 2500;
const DETAIL_GENERATION_MS = 1200;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulated server-side state (resets on page reload).
const contentStatus = new Map(); // concept_id -> content_status
const generationErrors = new Map(); // concept_id -> { code, message, retryable }
const generationAttempts = new Map(); // concept_id -> number
const generatedDetails = new Set(); // card_id

// ---------- lookups ----------

const cardIndex = new Map(
  Object.values(conceptContent).flatMap((concept) => concept.cards.map((card) => [card.id, { card, concept }])),
);

function statusOf(conceptId) {
  return contentStatus.get(conceptId) ?? (mockBehavior[conceptId] === "ready" ? "ready" : "not_generated");
}

function findCurriculum(curriculumId) {
  const curriculum = curricula.find((c) => c.id === curriculumId);
  if (!curriculum) throw new ApiError("not_found", "Curriculum not found.");
  return curriculum;
}

function findNode(nodeId) {
  for (const curriculum of curricula) {
    const node = curriculum.nodes.find((n) => n.id === nodeId);
    if (node) return { curriculum, node };
  }
  throw new ApiError("not_found", "This topic does not exist.");
}

function nodeForConcept(conceptId) {
  for (const curriculum of curricula) {
    const node = curriculum.nodes.find((n) => n.concept_id === conceptId);
    if (node) return { curriculum, node };
  }
  return null;
}

function nodeByName(name) {
  for (const curriculum of curricula) {
    const node = curriculum.nodes.find((n) => n.concept_id && n.name.toLowerCase() === name.toLowerCase());
    if (node) return node;
  }
  return null;
}

function conceptName(conceptId) {
  return conceptContent[conceptId]?.name ?? nodeForConcept(conceptId)?.node.name ?? conceptId;
}

// Leaf nodes in reading order (depth-first by position).
function leavesInOrder(curriculum) {
  const children = (parentId) =>
    curriculum.nodes.filter((n) => n.parent_id === parentId).sort((a, b) => a.position - b.position);
  const walk = (node) => (node.concept_id ? [node] : children(node.id).flatMap(walk));
  return walk(curriculum.nodes.find((n) => n.id === curriculum.root_node_id));
}

// Cards in the feed omit `detail`: it is fetched (and lazily generated) on demand.
const withoutDetail = ({ detail, ...card }) => ({ ...card, has_detail: Boolean(detail) });

// ---------- curricula ----------

export async function getCurricula() {
  await delay(LATENCY_MS);
  return curricula.map((c) => ({
    id: c.id,
    title: c.title,
    concept_ids: leavesInOrder(c).map((n) => n.concept_id),
  }));
}

export async function getCurriculum(curriculumId) {
  await delay(LATENCY_MS);
  const curriculum = findCurriculum(curriculumId);
  return {
    ...curriculum,
    nodes: curriculum.nodes.map((n) => (n.concept_id ? { ...n, content_status: statusOf(n.concept_id) } : n)),
  };
}

export async function createCurriculum(topic) {
  if (!topic.trim()) throw new ApiError("validation_error", "Enter a topic to learn.");
  await delay(CURRICULUM_GENERATION_MS);
  throw new ApiError(
    "not_available",
    "Building new curricula with AI arrives in a later stage. For now, explore the Machine Learning curriculum.",
    false,
  );
}

// ---------- feed & generation ----------

export async function getFeed(nodeId) {
  await delay(LATENCY_MS);
  const { curriculum, node } = findNode(nodeId);
  if (!node.concept_id) throw new ApiError("not_found", "Pick a concept to start learning.");

  const parent = curriculum.nodes.find((n) => n.id === node.parent_id);
  const tabs = curriculum.nodes
    .filter((n) => n.parent_id === node.parent_id && n.concept_id)
    .sort((a, b) => a.position - b.position)
    .map((n) => ({ node_id: n.id, name: n.name, concept_id: n.concept_id, content_status: statusOf(n.concept_id) }));

  const status = statusOf(node.concept_id);
  const content = conceptContent[node.concept_id];
  return {
    curriculum: { id: curriculum.id, title: curriculum.title },
    parent: parent ? { id: parent.id, name: parent.name } : null,
    node: { id: node.id, name: node.name },
    tabs,
    concept: {
      id: node.concept_id,
      name: node.name,
      content_status: status,
      generation_error: status === "failed" ? generationErrors.get(node.concept_id) : null,
    },
    cards: status === "ready" ? content.cards.map(withoutDetail) : [],
  };
}

// POST /api/concepts/{id}/generate — idempotent; returns immediately.
export async function generateConcept(conceptId) {
  await delay(LATENCY_MS);
  const status = statusOf(conceptId);
  if (status === "ready" || status === "generating") return { content_status: status };

  contentStatus.set(conceptId, "generating");
  generationErrors.delete(conceptId);
  const attempt = (generationAttempts.get(conceptId) ?? 0) + 1;
  generationAttempts.set(conceptId, attempt);

  delay(CONCEPT_GENERATION_MS).then(() => {
    const behavior = mockBehavior[conceptId];
    if (!behavior) {
      contentStatus.set(conceptId, "failed");
      generationErrors.set(conceptId, {
        code: "mock_content_missing",
        message: "There is no mock content for this concept yet. From Stage 4 the AI writes it on demand.",
        retryable: false,
      });
    } else if (behavior === "rate_limit" && attempt === 1) {
      contentStatus.set(conceptId, "failed");
      generationErrors.set(conceptId, {
        code: "llm_rate_limited",
        message: "The AI is busy right now. Try again in a moment.",
        retryable: true,
      });
    } else {
      contentStatus.set(conceptId, "ready");
    }
  });
  return { content_status: "generating" };
}

// GET /api/cards/{id}/detail — generated on first request.
export async function getCardDetail(cardId) {
  const entry = cardIndex.get(cardId);
  if (!entry) throw new ApiError("not_found", "Card not found.");
  const firstOpen = !generatedDetails.has(cardId);
  await delay(firstOpen ? DETAIL_GENERATION_MS : LATENCY_MS);

  const { detail } = entry.card;
  if (!detail) {
    throw new ApiError(
      "mock_content_missing",
      "The in-depth explanation for this card isn't in the mock data. From Stage 4 the AI writes it the first time you open it.",
      false,
    );
  }
  generatedDetails.add(cardId);
  return {
    ...detail,
    related_concepts: detail.related_concepts.map((name) => ({ name, node_id: nodeByName(name)?.id ?? null })),
  };
}

// ---------- learner state (Stage 5 endpoints) ----------

export async function getLearnerState() {
  return readLearner();
}

export async function toggleSave(cardId) {
  return updateLearner((s) => {
    if (s.saved[cardId]) delete s.saved[cardId];
    else s.saved[cardId] = new Date().toISOString();
    return s;
  });
}

export async function recordQuizAttempt(cardId, selectedIndex) {
  const entry = cardIndex.get(cardId);
  if (!entry) throw new ApiError("not_found", "Card not found.");
  const { answer_index } = entry.card.quick_check;
  const isCorrect = selectedIndex === answer_index;
  const learner = updateLearner((s) => {
    s.attempts[cardId] = { selected_index: selectedIndex, is_correct: isCorrect, answered_at: new Date().toISOString() };
    return s;
  });
  return { is_correct: isCorrect, answer_index, learner };
}

export async function markCardSeen(conceptId, position) {
  const current = readLearner();
  if (current.seen[conceptId]?.includes(position)) return current;
  return updateLearner((s) => {
    s.seen[conceptId] = [...(s.seen[conceptId] ?? []), position].sort((a, b) => a - b);
    return s;
  });
}

export async function markConceptCompleted(conceptId) {
  const current = readLearner();
  if (current.completed[conceptId]) return current;
  return updateLearner((s) => {
    s.completed[conceptId] = new Date().toISOString();
    return s;
  });
}

export async function setResumePosition(curriculumId, nodeId, cardPosition) {
  return updateLearner((s) => {
    s.resume[curriculumId] = { node_id: nodeId, card_position: cardPosition };
    s.last_curriculum_id = curriculumId;
    return s;
  });
}

// Where Home should open: the last position, or the first concept of the default curriculum.
export async function getResumePosition() {
  await delay(LATENCY_MS);
  const learner = readLearner();
  const curriculum = curricula.find((c) => c.id === learner.last_curriculum_id) ?? curricula[0];
  const resume = learner.resume[curriculum.id];
  if (resume) return resume;
  const leaves = leavesInOrder(curriculum);
  const firstReady = leaves.find((n) => statusOf(n.concept_id) === "ready") ?? leaves[0];
  return { node_id: firstReady.id, card_position: 1 };
}

export async function getProfile() {
  await delay(LATENCY_MS);
  const learner = readLearner();
  const attempts = Object.entries(learner.attempts);

  const inProgress = curricula
    .map((c) => {
      const leaves = leavesInOrder(c);
      const completed = leaves.filter((n) => learner.completed[n.concept_id]).length;
      const started = leaves.some((n) => learner.seen[n.concept_id]?.length);
      return { curriculum_id: c.id, title: c.title, completed, total: leaves.length, started, resume: learner.resume[c.id] ?? null };
    })
    .filter((c) => c.started);

  const byConcept = new Map();
  for (const [cardId, attempt] of attempts) {
    const entry = cardIndex.get(cardId);
    if (!entry) continue;
    const stats = byConcept.get(entry.concept.id) ?? { correct: 0, answered: 0 };
    stats.answered += 1;
    if (attempt.is_correct) stats.correct += 1;
    byConcept.set(entry.concept.id, stats);
  }
  const needsReview = [...byConcept.entries()]
    .filter(([, s]) => s.correct / s.answered < 0.7)
    .map(([conceptId, s]) => ({
      concept_id: conceptId,
      name: conceptName(conceptId),
      node_id: nodeForConcept(conceptId)?.node.id ?? null,
      ...s,
    }))
    .sort((a, b) => a.correct / a.answered - b.correct / b.answered);

  return {
    stats: {
      concepts_completed: Object.keys(learner.completed).length,
      quiz_answered: attempts.length,
      quiz_correct: attempts.filter(([, a]) => a.is_correct).length,
      saved_count: Object.keys(learner.saved).length,
    },
    in_progress: inProgress,
    needs_review: needsReview,
  };
}

export async function getSavedCards() {
  await delay(LATENCY_MS);
  const learner = readLearner();
  return Object.entries(learner.saved)
    .sort(([, a], [, b]) => b.localeCompare(a))
    .map(([cardId, savedAt]) => {
      const entry = cardIndex.get(cardId);
      if (!entry) return null;
      return {
        card_id: cardId,
        title: entry.card.title,
        facet: entry.card.facet,
        position: entry.card.position,
        concept_name: entry.concept.name,
        node_id: nodeForConcept(entry.concept.id)?.node.id ?? null,
        saved_at: savedAt,
      };
    })
    .filter(Boolean);
}
