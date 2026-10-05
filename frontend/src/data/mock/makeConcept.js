// Builds a Concept with its cards in the Stage 0 contract shape, so the
// per-concept mock files only contain the learning content itself.

export const FACETS = [
  "why_it_matters",
  "intuition",
  "how_it_works",
  "worked_example",
  "pitfalls",
  "compare",
];

export function makeConcept({ id, concept_key, name, cards }) {
  return {
    id,
    concept_key,
    name,
    generation: null,
    cards: cards.map((card, index) => ({
      id: `${id}-card-${index + 1}`,
      concept_id: id,
      position: index + 1,
      facet: FACETS[index],
      title: card.title,
      summary: card.summary,
      key_takeaway: card.key_takeaway,
      visual: card.visual ?? null,
      quick_check: card.quick_check,
      detail: card.detail ?? null,
      sources: [],
    })),
  };
}
