// Learning content from the FastAPI backend (docs/stage-0/02-domain-model.md).
import { request } from "./http.js";

export const getCurricula = () => request("/curricula");

export const getCurriculum = (curriculumId) => request(`/curricula/${curriculumId}`);

export const createCurriculum = (topic) => request("/curricula", { method: "POST", body: { topic } });

export const getFeed = (nodeId) => request(`/nodes/${nodeId}/feed`);

// Idempotent: starts generation if needed and returns { content_status }.
export const generateConcept = (conceptId) => request(`/concepts/${conceptId}/generate`, { method: "POST" });

export const getCard = (cardId) => request(`/cards/${cardId}`);

export const getCardDetail = (cardId) => request(`/cards/${cardId}/detail`);

// Card summaries (title, concept, node) for a list of ids, in the same order.
export function lookupCards(cardIds) {
  if (!cardIds.length) return Promise.resolve([]);
  const query = cardIds.map((id) => `ids=${encodeURIComponent(id)}`).join("&");
  return request(`/cards?${query}`);
}
