export const FACET_LABELS = {
  why_it_matters: "Why it matters",
  intuition: "Intuition",
  how_it_works: "How it works",
  worked_example: "Worked example",
  pitfalls: "Pitfalls",
  compare: "Compare",
};

export const CARDS_PER_CONCEPT = 6;

// Card position to open for a concept: the first unseen card, or 1 once completed.
export function nextPositionFor(learner, conceptId) {
  if (!learner || learner.completed[conceptId]) return 1;
  const seen = learner.seen[conceptId] ?? [];
  for (let position = 1; position <= CARDS_PER_CONCEPT; position += 1) {
    if (!seen.includes(position)) return position;
  }
  return 1;
}

export const feedPath = (nodeId, position = 1) => `/learn/${nodeId}/${position}`;
