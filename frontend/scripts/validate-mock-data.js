// Checks that the mock content follows the Stage 0 contract
// (docs/stage-0/02-domain-model.md). Run with: npm run check:mock
// The same rules become Pydantic + business validation for LLM output in Stages 3–4.

import { curricula, conceptContent } from "../src/data/mock/index.js";
import { FACETS } from "../src/data/mock/makeConcept.js";

const VISUAL_TYPES = new Set(["formula", "mermaid", "icon"]);
const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);
const words = (text) => text.trim().split(/\s+/).length;

function checkCurriculum(curriculum) {
  const where = `curriculum ${curriculum.id}`;
  const byId = new Map(curriculum.nodes.map((node) => [node.id, node]));
  if (byId.size !== curriculum.nodes.length) fail(where, "duplicate node ids");

  const roots = curriculum.nodes.filter((node) => node.parent_id === null);
  if (roots.length !== 1) fail(where, `expected exactly one root, found ${roots.length}`);
  if (roots[0]?.id !== curriculum.root_node_id) fail(where, "root_node_id does not match the root node");

  for (const node of curriculum.nodes) {
    const nodeWhere = `${where} > ${node.id}`;
    const children = curriculum.nodes.filter((child) => child.parent_id === node.id);
    if (node.parent_id !== null) {
      const parent = byId.get(node.parent_id);
      if (!parent) fail(nodeWhere, `parent ${node.parent_id} does not exist`);
      else if (node.depth !== parent.depth + 1) fail(nodeWhere, "depth is not parent depth + 1");
    }
    if (node.depth > 4) fail(nodeWhere, "depth exceeds 4");
    if (node.concept_id && children.length) fail(nodeWhere, "leaf with a concept must not have children");
    if (!node.concept_id && !children.length) fail(nodeWhere, "branch without children");
  }
}

function checkCard(card, where) {
  if (card.title.length > 60) fail(where, `title longer than 60 chars (${card.title.length})`);
  const summaryWords = words(card.summary);
  if (summaryWords < 80 || summaryWords > 130) fail(where, `summary has ${summaryWords} words (80–130)`);
  if (!card.key_takeaway) fail(where, "missing key_takeaway");

  if (card.visual) {
    if (!VISUAL_TYPES.has(card.visual.type)) fail(where, `unknown visual type ${card.visual.type}`);
    if (!card.visual.content) fail(where, "visual without content");
    if (!card.visual.alt_text) fail(where, "visual without alt_text");
  }

  const qc = card.quick_check;
  if (!qc?.question) fail(where, "missing quick_check.question");
  if (!Array.isArray(qc?.options) || qc.options.length < 3 || qc.options.length > 4) {
    fail(where, "quick_check needs 3–4 options");
  } else {
    if (new Set(qc.options).size !== qc.options.length) fail(where, "quick_check options are not unique");
    if (!Number.isInteger(qc.answer_index) || qc.answer_index < 0 || qc.answer_index >= qc.options.length) {
      fail(where, "quick_check.answer_index out of range");
    }
  }
  if (!qc?.explanation) fail(where, "missing quick_check.explanation");

  if (card.detail) {
    const detailWords = words(card.detail.body_markdown);
    if (detailWords < 300 || detailWords > 700) fail(where, `detail has ${detailWords} words (300–700)`);
    if (!card.detail.takeaway) fail(where, "detail without takeaway");
  }
  if (!Array.isArray(card.sources)) fail(where, "sources must be an array");
}

function checkConcept(concept) {
  const where = `concept ${concept.id}`;
  if (concept.cards.length !== FACETS.length) fail(where, `expected ${FACETS.length} cards, found ${concept.cards.length}`);
  concept.cards.forEach((card, index) => {
    const cardWhere = `${where} > card ${index + 1}`;
    if (card.position !== index + 1) fail(cardWhere, "position out of order");
    if (card.facet !== FACETS[index]) fail(cardWhere, `facet ${card.facet} should be ${FACETS[index]}`);
    checkCard(card, cardWhere);
  });
}

curricula.forEach(checkCurriculum);

const keys = new Set();
for (const concept of Object.values(conceptContent)) {
  if (keys.has(concept.concept_key)) fail(concept.id, `duplicate concept_key ${concept.concept_key}`);
  keys.add(concept.concept_key);
  checkConcept(concept);
}

const conceptIds = new Set(curricula.flatMap((c) => c.nodes.map((n) => n.concept_id).filter(Boolean)));
for (const id of Object.keys(conceptContent)) {
  if (!conceptIds.has(id)) fail(id, "concept content is not referenced by any curriculum node");
}

const cardCount = Object.values(conceptContent).reduce((sum, c) => sum + c.cards.length, 0);
if (errors.length) {
  console.error(`Mock data invalid (${errors.length} problems):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Mock data valid: ${curricula.length} curriculum, ${Object.keys(conceptContent).length} concepts, ${cardCount} cards.`);
