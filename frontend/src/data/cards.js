import sigmoidImage from "../assets/cards/sigmoid.png";

const cards = [
  {
    title: "Definition & Intuition",
    image: sigmoidImage,
    summary:
      "Logistic Regression is a supervised learning algorithm used for classification problems, especially binary classification. Instead of predicting continuous outputs like linear regression, it predicts probabilities. The output tells us how likely an input belongs to a specific class. For example, in spam detection, the model predicts the probability that an email is spam. If the probability exceeds a threshold like 0.5, the model classifies it as spam."
  },
  {
    title: "Why Regression?",
    image: sigmoidImage,
    summary:
      "Despite being used for classification, logistic regression is called regression because it models a mathematical relationship between input features and output probability. The model estimates coefficients for features using regression-style optimization. These coefficients help determine how strongly each feature influences the prediction. So the regression part comes from parameter estimation, not from predicting continuous labels."
  },
  {
    title: "Why Not Linear?",
    image: sigmoidImage,
    summary:
      "Linear regression is unsuitable for classification because its output can go below 0 or above 1, which makes no sense for probabilities. Classification problems need outputs between 0 and 1. Logistic regression solves this by transforming linear outputs using the sigmoid function. This ensures predictions remain valid probabilities while preserving interpretability."
  },
  {
    title: "Sigmoid & Odds",
    image: sigmoidImage,
    summary:
      "The sigmoid function converts any real-valued number into a value between 0 and 1. Logistic regression uses this to interpret predictions as probabilities. Odds represent the ratio of success to failure probability. Log-odds transform this into a linear relationship, allowing the model to use linear combinations of features while predicting classification outcomes."
  }
];

export default cards;