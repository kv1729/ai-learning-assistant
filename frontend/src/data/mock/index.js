// Stage 1 mock content. Everything the UI shows comes from here through
// src/api/mockApi.js; Stage 2 moves this content into PostgreSQL as seed data.

import { mlCurriculum } from "./curriculum.js";
import logisticRegression from "./concepts/logisticRegression.js";
import svm from "./concepts/svm.js";
import decisionTrees from "./concepts/decisionTrees.js";
import knn from "./concepts/knn.js";
import naiveBayes from "./concepts/naiveBayes.js";

export const curricula = [mlCurriculum];

// Concepts that have written mock content.
export const conceptContent = Object.fromEntries(
  [logisticRegression, svm, decisionTrees, knn, naiveBayes].map((concept) => [concept.id, concept]),
);

// How each concept behaves in the mock, so every UI state can be reviewed:
// - "ready":       content exists from the start
// - "generate":    starts as not_generated; "generation" succeeds after a delay
// - "rate_limit":  starts as not_generated; the first attempt fails as rate-limited, a retry succeeds
// Concepts not listed have no mock content; generating them fails with a clear message.
export const mockBehavior = {
  "concept-logistic-regression": "ready",
  "concept-svm": "ready",
  "concept-decision-trees": "ready",
  "concept-knn": "generate",
  "concept-naive-bayes": "rate_limit",
};
