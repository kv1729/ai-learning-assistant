import sigmoidImage from "../assets/cards/sigmoid.png";

const cards = [
  {
    title: "Definition & Intuition",
    topic: "Logistic Regression",
    image: sigmoidImage,
    quickCheck: {
      question: "What does logistic regression predict?",
      options: [
        "Continuous values",
        "Probabilities",
        "Clusters",
        "Distances"
      ],
      answer: "Probabilities",
      explanation: "Logistic regression predicts the probability that an input belongs to a particular class, which is why the output is interpreted as probability rather than a raw category."
    },
    detailedExplanation:
      "Logistic regression is a supervised learning algorithm designed for binary classification. It learns a linear combination of input features, then passes the result through a sigmoid function so that predictions fall between 0 and 1. This allows the model to output a probability score reflecting how likely an input belongs to the target class.",
    keyTakeaway:
      "Logistic regression models the probability of an event, making it suitable for classification tasks with binary outcomes.",
    summary:
      "Logistic Regression is a supervised learning algorithm used for classification problems, especially binary classification. Instead of predicting continuous outputs like linear regression, it predicts probabilities. The output tells us how likely an input belongs to a specific class. For example, in spam detection, the model predicts the probability that an email is spam. If the probability exceeds a threshold like 0.5, the model classifies it as spam."
  },
  {
    title: "Why Regression?",
    topic: "Modeling",
    image: sigmoidImage,
    quickCheck: {
      question: "Why is logistic regression still called regression?",
      options: [
        "It predicts continuous values",
        "It uses a regression-style parameter estimation",
        "It clusters data",
        "It uses decision trees"
      ],
      answer: "It uses a regression-style parameter estimation",
      explanation: "The model still estimates feature coefficients like regression does, even though the final result is used for classification."
    },
    detailedExplanation:
      "Logistic regression uses a regression-style equation to learn weights for input features. These weights are optimized to best separate classes, and the final value is transformed through a sigmoid to produce a probability. So the term 'regression' describes the training process, not the type of output.",
    keyTakeaway:
      "Logistic regression is named for its parameter estimation process, not for predicting continuous values.",
    summary:
      "Despite being used for classification, logistic regression is called regression because it models a mathematical relationship between input features and output probability. The model estimates coefficients for features using regression-style optimization. These coefficients help determine how strongly each feature influences the prediction. So the regression part comes from parameter estimation, not from predicting continuous labels."
  },
  {
    title: "Why Not Linear?",
    topic: "Classification",
    image: sigmoidImage,
    quickCheck: {
      question: "Why is linear regression not ideal for classification?",
      options: [
        "It is too fast",
        "It cannot output probabilities between 0 and 1",
        "It uses too much memory",
        "It always overfits"
      ],
      answer: "It cannot output probabilities between 0 and 1",
      explanation: "Linear regression can produce values outside the probability range, so it is not suitable for classification probability estimates."
    },
    detailedExplanation:
      "Linear regression is not ideal for classification because its outputs are unbounded and can fall outside the [0, 1] probability range. Logistic regression resolves this by applying the sigmoid function to the linear output, generating valid probability estimates that can be thresholded for class decisions.",
    keyTakeaway:
      "Classification models need outputs that behave like probabilities, which linear regression does not guarantee.",
    summary:
      "Linear regression is unsuitable for classification because its output can go below 0 or above 1, which makes no sense for probabilities. Classification problems need outputs between 0 and 1. Logistic regression solves this by transforming linear outputs using the sigmoid function. This ensures predictions remain valid probabilities while preserving interpretability."
  },
  {
    title: "Sigmoid & Odds",
    topic: "Probability",
    image: sigmoidImage,
    quickCheck: {
      question: "What does the sigmoid function output?",
      options: [
        "Any real number",
        "A value between 0 and 1",
        "Only 0 or 1",
        "Negative values only"
      ],
      answer: "A value between 0 and 1",
      explanation: "The sigmoid function maps any real input into a bounded range between 0 and 1, which is useful for probability estimates."
    },
    detailedExplanation:
      "The sigmoid function compresses real-valued scores into a smooth curve between 0 and 1. In logistic regression, it turns the linear combination of features into a probability-like output, allowing predictions to be interpreted as confidence in the target class.",
    keyTakeaway:
      "The sigmoid function converts raw model scores into probability-like values.",
    summary:
      "The sigmoid function converts any real-valued number into a value between 0 and 1. Logistic regression uses this to interpret predictions as probabilities. Odds represent the ratio of success to failure probability. Log-odds transform this into a linear relationship, allowing the model to use linear combinations of features while predicting classification outcomes."
  }
];

export default cards;