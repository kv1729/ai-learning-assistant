// Seeded "Machine Learning" curriculum, shaped like the Stage 0 contract
// (docs/stage-0/02-domain-model.md). In Stage 3 curricula come from the LLM.

const CURRICULUM_ID = "cur-machine-learning";

// [id, parent_id, name, description, concept_id]
// Leaves have a concept_id; branches have children. depth/position are derived.
const NODE_ROWS = [
  ["node-ml", null, "Machine Learning", "Teaching computers to learn patterns from data.", null],

  ["node-foundations", "node-ml", "Foundations", "Ideas every model relies on.", null],
  ["node-bias-variance", "node-foundations", "Bias–Variance Trade-off", "Why models underfit or overfit.", "concept-bias-variance"],
  ["node-gradient-descent", "node-foundations", "Gradient Descent", "How most models are trained.", "concept-gradient-descent"],

  ["node-supervised", "node-ml", "Supervised Learning", "Learning from labelled examples.", null],
  ["node-regression", "node-supervised", "Regression", "Predicting continuous values.", null],
  ["node-linear-regression", "node-regression", "Linear Regression", "Fitting a line through data.", "concept-linear-regression"],
  ["node-regularization", "node-regression", "Ridge & Lasso", "Penalizing large weights to generalize better.", "concept-regularization"],
  ["node-classification", "node-supervised", "Classification", "Predicting categories.", null],
  ["node-logreg", "node-classification", "Logistic Regression", "Linear model that outputs probabilities.", "concept-logistic-regression"],
  ["node-svm", "node-classification", "SVM", "Maximum-margin classifiers.", "concept-svm"],
  ["node-trees", "node-classification", "Decision Trees", "Learning a flowchart of questions.", "concept-decision-trees"],
  ["node-knn", "node-classification", "KNN", "Classify by the nearest labelled examples.", "concept-knn"],
  ["node-naive-bayes", "node-classification", "Naive Bayes", "Probabilistic classifier built on Bayes' rule.", "concept-naive-bayes"],

  ["node-unsupervised", "node-ml", "Unsupervised Learning", "Finding structure without labels.", null],
  ["node-kmeans", "node-unsupervised", "K-Means Clustering", "Grouping points around centroids.", "concept-kmeans"],
  ["node-pca", "node-unsupervised", "PCA", "Compressing data along directions of variance.", "concept-pca"],

  ["node-evaluation", "node-ml", "Model Evaluation", "Knowing whether a model is any good.", null],
  ["node-cross-validation", "node-evaluation", "Cross-Validation", "Estimating performance on unseen data.", "concept-cross-validation"],
  ["node-precision-recall", "node-evaluation", "Precision & Recall", "Measuring errors that matter.", "concept-precision-recall"],
  ["node-roc-auc", "node-evaluation", "ROC & AUC", "Comparing classifiers across thresholds.", "concept-roc-auc"],
];

function buildNodes(rows) {
  const byId = new Map();
  const childCount = new Map();
  return rows.map(([id, parent_id, name, description, concept_id]) => {
    const parent = parent_id ? byId.get(parent_id) : null;
    const position = childCount.get(parent_id) ?? 0;
    childCount.set(parent_id, position + 1);
    const node = {
      id,
      curriculum_id: CURRICULUM_ID,
      parent_id,
      name,
      description,
      depth: parent ? parent.depth + 1 : 0,
      position,
      concept_id,
    };
    byId.set(id, node);
    return node;
  });
}

export const mlCurriculum = {
  id: CURRICULUM_ID,
  title: "Machine Learning",
  requested_topic: "Machine Learning",
  root_node_id: "node-ml",
  generation: null,
  created_at: "2026-10-05T00:00:00Z",
  nodes: buildNodes(NODE_ROWS),
};
