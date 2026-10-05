// Learner state (saves, quiz answers, progress) stays in the browser until
// Stage 5 moves it to the backend. Content it refers to comes from the API.
import { getCard, getCurricula, getCurriculum, lookupCards } from "./contentApi.js";
import { readLearner, updateLearner } from "./learnerStore.js";

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
  const card = await getCard(cardId);
  const answerIndex = card.quick_check.answer_index;
  const isCorrect = selectedIndex === answerIndex;
  const learner = updateLearner((s) => {
    s.attempts[cardId] = { selected_index: selectedIndex, is_correct: isCorrect, answered_at: new Date().toISOString() };
    return s;
  });
  return { is_correct: isCorrect, answer_index: answerIndex, learner };
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

// Where Home should open: the last position, or the first concept with content.
export async function getResumePosition() {
  const learner = readLearner();
  const curricula = await getCurricula();
  const summary = curricula.find((c) => c.id === learner.last_curriculum_id) ?? curricula[0];
  if (!summary) return null;
  if (learner.resume[summary.id]) return learner.resume[summary.id];

  const curriculum = await getCurriculum(summary.id);
  const leafByConcept = new Map(curriculum.nodes.filter((n) => n.concept_id).map((n) => [n.concept_id, n]));
  const leaves = summary.concept_ids.map((id) => leafByConcept.get(id)).filter(Boolean);
  const first = leaves.find((n) => n.content_status === "ready") ?? leaves[0];
  return first ? { node_id: first.id, card_position: 1 } : null;
}

export async function getProfile() {
  const learner = readLearner();
  const attempts = Object.entries(learner.attempts);
  const [curricula, attemptedCards] = await Promise.all([getCurricula(), lookupCards(attempts.map(([id]) => id))]);

  const inProgress = curricula
    .map((c) => ({
      curriculum_id: c.id,
      title: c.title,
      completed: c.concept_ids.filter((id) => learner.completed[id]).length,
      total: c.concept_ids.length,
      started: c.concept_ids.some((id) => learner.seen[id]?.length),
      resume: learner.resume[c.id] ?? null,
    }))
    .filter((c) => c.started);

  const byConcept = new Map();
  for (const card of attemptedCards) {
    const stats = byConcept.get(card.concept_id) ?? {
      concept_id: card.concept_id,
      name: card.concept_name,
      node_id: card.node_id,
      correct: 0,
      answered: 0,
    };
    stats.answered += 1;
    if (learner.attempts[card.id].is_correct) stats.correct += 1;
    byConcept.set(card.concept_id, stats);
  }
  const needsReview = [...byConcept.values()]
    .filter((s) => s.correct / s.answered < 0.7)
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
  const learner = readLearner();
  const ids = Object.entries(learner.saved)
    .sort(([, a], [, b]) => b.localeCompare(a))
    .map(([id]) => id);
  const cards = await lookupCards(ids);
  return cards.map((card) => ({
    card_id: card.id,
    title: card.title,
    facet: card.facet,
    position: card.position,
    concept_name: card.concept_name,
    node_id: card.node_id,
    saved_at: learner.saved[card.id],
  }));
}
