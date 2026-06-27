import sigmoidImage from "../assets/cards/sigmoid.png";

const cards = [
  {
    id: 1,
    topic: "Logistic Regression",
    title: "Introduction",
    image: sigmoidImage,
    summary:
      "Logistic Regression is a supervised machine learning algorithm used for classification tasks. Unlike linear regression, it predicts probabilities rather than continuous values. It helps determine the likelihood that an input belongs to a specific category, making it useful for spam detection, fraud detection, and medical diagnosis.",
  },
  {
    id: 2,
    topic: "Logistic Regression",
    title: "Sigmoid Function",
    image: sigmoidImage,
    summary:
      "The sigmoid function maps any real-valued number into a value between 0 and 1. This transformation enables logistic regression to interpret outputs as probabilities. Higher values indicate stronger confidence toward class 1, while lower values indicate stronger confidence toward class 0.",
  },
  {
    id: 3,
    topic: "Logistic Regression",
    title: "Decision Boundary",
    image: sigmoidImage,
    summary:
      "The decision boundary separates classes in feature space. Logistic regression uses a linear boundary for binary classification. Inputs on one side are classified as class 0, while inputs on the other side belong to class 1.",
  },
];

export default cards;