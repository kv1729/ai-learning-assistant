import sigmoidImage from "../assets/cards/sigmoid.png";

const cards = [
  {
    id: 1,
    topic: "Logistic Regression",
    title: "Why Logistic Regression Matters",
    image: sigmoidImage,

    summary:
      "Logistic Regression is one of the most widely used machine learning algorithms for binary classification problems—situations where the outcome belongs to one of two categories. Examples include detecting spam emails, identifying fraudulent transactions, or predicting whether a patient has a disease. Instead of predicting continuous values like Linear Regression, Logistic Regression predicts probabilities between 0 and 1.",

    detailedExplanation:
      "Many real-world problems involve making binary decisions: Is this email spam? Is this transaction fraudulent? Does this patient have diabetes? Logistic Regression solves these problems by predicting the probability that an input belongs to a class. For example, a model output of 0.91 means high confidence in class 1, while 0.08 suggests high confidence in class 0. A threshold, usually 0.5, converts probability into final prediction. Logistic Regression remains popular because it is simple, fast, interpretable, and highly effective for classification tasks.",

    quickCheck: {
      question: "What type of problem is Logistic Regression primarily used for?",
      options: [
        "Clustering",
        "Classification",
        "Regression",
        "Dimensionality Reduction",
      ],
      answer: "Classification",
    },
  },
];

export default cards;