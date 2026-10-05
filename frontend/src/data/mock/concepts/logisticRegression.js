import { makeConcept } from "../makeConcept.js";

const r = String.raw;

export default makeConcept({
  id: "concept-logistic-regression",
  concept_key: "logistic-regression",
  name: "Logistic Regression",
  cards: [
    {
      title: "Turning features into yes/no decisions",
      summary:
        "Many real problems are binary: is this email spam, will this customer churn, is this transaction fraudulent? Logistic regression is the standard first model for such questions. It trains in seconds, copes with thousands of features, and outputs a probability you can act on, such as a 73% chance of churn, rather than a bare label. Its coefficients are interpretable: each one says how a feature shifts the odds of the outcome. That mix of speed, probabilities and explainability keeps it in production for credit scoring, medicine and ad click prediction, and makes it the baseline every fancier model has to beat.",
      key_takeaway:
        "Logistic regression is the default baseline for binary classification because it is fast, interpretable and outputs probabilities.",
      visual: { type: "icon", content: "target", caption: null, alt_text: "Target icon representing a yes/no prediction" },
      quick_check: {
        question: "Why is logistic regression a common first model for a new binary classification problem?",
        options: [
          "It always achieves the highest accuracy",
          "It is fast, interpretable and outputs probabilities",
          "It does not need labelled data",
          "It can only use a single feature",
        ],
        answer_index: 1,
        explanation:
          "It rarely wins on raw accuracy, but it is cheap to train, easy to explain and gives probabilities, which makes it the baseline more complex models must beat. It is supervised, so it does need labels.",
      },
      detail: {
        body_markdown: r`## The problem it solves

A huge share of the predictions businesses and scientists care about have two outcomes: spam or not, default or repay, disease or healthy, click or ignore. Logistic regression answers these questions with a **probability** instead of only a label. A bank does not just want "approve / reject"; it wants "this applicant has a 4% chance of default", because the cost of a wrong decision depends on that number.

## Why it is still everywhere

- **Speed.** Training is a convex optimization problem that finishes in seconds even on millions of rows, and prediction is a single dot product.
- **Interpretability.** Each coefficient has a precise meaning: a one-unit increase in a feature multiplies the odds of the positive class by $e^{w}$. Regulators in credit and insurance often require models whose decisions can be explained this way.
- **Probabilities.** Because it is trained by maximum likelihood, its scores tend to be reasonably well calibrated, so a predicted 0.8 really behaves like 80% more often than with many other classifiers.
- **Robust baseline.** With good features and regularization it is surprisingly hard to beat on tabular data, especially with sparse, high-dimensional inputs such as bag-of-words text.

## Where it shows up

Credit scoring, churn prediction, medical risk scores, click-through-rate prediction in advertising, and the final layer of many neural network classifiers (a sigmoid output is logistic regression on learned features).

## When to reach for something else

If the relationship between features and outcome is strongly non-linear, with interactions that you cannot engineer by hand, tree ensembles such as gradient boosting usually win. If you have images, audio or raw text, a neural network that learns its own features will do better. Even then, train logistic regression first: if a complex model cannot clearly beat it, the complexity is not paying for itself.

## Practical checklist

1. Scale numeric features so regularization treats them fairly.
2. Encode categorical features (one-hot) before fitting.
3. Start with L2 regularization and tune its strength with cross-validation.
4. Evaluate with log-loss and precision/recall, not accuracy alone.`,
        misconceptions: [
          "It is not a regression model for continuous targets; 'regression' refers to modelling the log-odds as a linear function.",
          "It is not limited to two classes: softmax (multinomial) and one-vs-rest versions handle many classes.",
        ],
        related_concepts: ["Linear Regression", "SVM", "Naive Bayes", "Precision & Recall"],
        takeaway: "Use logistic regression first: if a complex model cannot clearly beat it, the complexity is not justified.",
      },
    },
    {
      title: "Squashing a score into a probability",
      summary:
        "Start exactly like linear regression: weight each feature and add them up to get a score z = w·x + b. That score can be any number from minus to plus infinity, which is useless as a probability. Logistic regression passes z through the sigmoid function, an S-shaped curve that squashes any real number into the range 0 to 1. Large positive scores map close to 1, large negative scores close to 0, and a score of exactly 0 maps to 0.5. So the model is really learning a straight boundary, where z = 0, and the sigmoid turns distance from that boundary into confidence.",
      key_takeaway:
        "The sigmoid converts an unbounded linear score into a probability; the decision boundary is where the score equals zero.",
      visual: {
        type: "formula",
        content: r`\sigma(z) = \frac{1}{1 + e^{-z}}`,
        caption: "The sigmoid maps any score z to a value between 0 and 1.",
        alt_text: "Sigmoid function: sigma of z equals one over one plus e to the minus z",
      },
      quick_check: {
        question: "What happens to σ(z) as z approaches positive infinity?",
        options: ["It approaches 0", "It approaches 0.5", "It approaches 1", "It grows without bound"],
        answer_index: 2,
        explanation:
          "As z grows, e^(−z) shrinks towards 0, so σ(z) = 1 / (1 + e^(−z)) approaches 1 / (1 + 0) = 1. It gets arbitrarily close to 1 but never exceeds it.",
      },
      detail: {
        body_markdown: r`## From a score to a probability

Logistic regression first computes a **linear score** exactly as linear regression would:

$$
z = w_1x_1 + w_2x_2 + \dots + w_dx_d + b = \mathbf{w}^\top\mathbf{x} + b
$$

The problem is that $z$ is unbounded, while a probability must lie between 0 and 1. The fix is to pass the score through the **sigmoid** (logistic) function:

$$
\hat{p} = \sigma(z) = \frac{1}{1 + e^{-z}}
$$

## Reading the S-curve

- $z = 0 \Rightarrow \sigma(z) = 0.5$: the model is undecided.
- $z = 2 \Rightarrow \sigma(z) \approx 0.88$; $z = 5 \Rightarrow \sigma(z) \approx 0.993$.
- $z = -2 \Rightarrow \sigma(z) \approx 0.12$.
- The curve is steepest around $z = 0$ and flattens at the extremes, so moving a confident prediction changes its probability very little.

## The boundary is still linear

With the usual threshold of 0.5, we predict the positive class whenever $\sigma(z) > 0.5$, which happens exactly when $z > 0$. The set of points where $\mathbf{w}^\top\mathbf{x} + b = 0$ is a straight line in 2-D, a plane in 3-D and a hyperplane in general. Logistic regression is therefore a **linear classifier**; the sigmoid changes how confident the model is, not the shape of the boundary.

## Where the name comes from: log-odds

Invert the sigmoid and you get

$$
\log\frac{\hat{p}}{1 - \hat{p}} = \mathbf{w}^\top\mathbf{x} + b
$$

The left side is the **log-odds** (the logit). So the model assumes the log-odds of the positive class is a linear function of the features. That is the "regression" in the name: it is a linear regression on the log-odds scale.

## Intuition to keep

Think of $\mathbf{w}$ as defining a direction and the boundary as a wall perpendicular to it. The further a point lies from the wall on the positive side, the larger $z$ becomes and the closer its probability gets to 1. Doubling all the weights keeps the same wall but makes the S-curve steeper, which is why unregularized models on separable data drift towards infinitely confident predictions.`,
        misconceptions: [
          "The sigmoid does not make the decision boundary curved; it only maps distance from a linear boundary to a probability.",
          "A probability of 0.5 is not 'no information'; it means the point lies exactly on the boundary.",
        ],
        related_concepts: ["Linear Regression", "SVM"],
        takeaway: "Logistic regression is a linear model of the log-odds; the sigmoid turns that linear score into a probability.",
      },
    },
    {
      title: "Learning the weights with log-loss",
      summary:
        "Training means finding weights that make predicted probabilities match the labels. Instead of squared error, logistic regression minimizes log-loss, also called binary cross-entropy. For a positive example the loss is −log(p̂); for a negative one it is −log(1 − p̂). Confident correct predictions cost almost nothing, while confident wrong ones are punished heavily, because the logarithm plunges as its input approaches zero. For this model log-loss is convex, so gradient descent reliably finds the global minimum. The gradient has a neat form, (p̂ − y)·x per example, so each update moves the weights in proportion to the prediction error.",
      key_takeaway:
        "Logistic regression is fitted by minimizing convex log-loss, which is the same as maximum-likelihood estimation.",
      visual: {
        type: "formula",
        content: r`\mathcal{L} = -\frac{1}{n}\sum_{i=1}^{n}\big[y_i \log \hat{p}_i + (1-y_i)\log(1-\hat{p}_i)\big]`,
        caption: "Binary cross-entropy (log-loss) averaged over n examples.",
        alt_text: "Log-loss formula: negative mean of y log p-hat plus one minus y times log of one minus p-hat",
      },
      quick_check: {
        question: "Why is log-loss used instead of mean squared error to train logistic regression?",
        options: [
          "Mean squared error cannot be computed on probabilities",
          "Log-loss is convex for this model and strongly penalizes confident mistakes",
          "Log-loss makes the decision boundary non-linear",
          "Mean squared error needs more memory",
        ],
        answer_index: 1,
        explanation:
          "Squared error passed through a sigmoid gives a non-convex objective with flat regions where learning stalls. Log-loss is convex, corresponds to maximum likelihood, and punishes confident wrong predictions hard.",
      },
      detail: {
        body_markdown: r`## What "fitting" means here

Each training example has features $\mathbf{x}_i$ and a label $y_i \in \{0, 1\}$. The model predicts $\hat{p}_i = \sigma(\mathbf{w}^\top\mathbf{x}_i + b)$. We want weights that make the observed labels as **likely** as possible.

## Maximum likelihood becomes log-loss

If the model is right, the probability of seeing label $y_i$ is $\hat{p}_i$ when $y_i = 1$ and $1 - \hat{p}_i$ when $y_i = 0$. Multiplying over all examples and taking the negative log gives the **log-loss**:

$$
\mathcal{L}(\mathbf{w}, b) = -\frac{1}{n}\sum_{i=1}^{n}\Big[y_i \log \hat{p}_i + (1 - y_i)\log(1 - \hat{p}_i)\Big]
$$

Minimizing log-loss and maximizing likelihood are the same thing.

## Why it punishes confident mistakes

| True label | Prediction $\hat{p}$ | Loss |
|---|---|---|
| 1 | 0.9 | 0.11 |
| 1 | 0.5 | 0.69 |
| 1 | 0.1 | 2.30 |
| 1 | 0.01 | 4.61 |

Being confidently wrong is far more expensive than being unsure. This pushes the model towards honest probabilities.

## The gradient

A small miracle of algebra: the derivative of the sigmoid cancels neatly with the derivative of the log, so

$$
\frac{\partial \mathcal{L}}{\partial \mathbf{w}} = \frac{1}{n}\sum_{i=1}^{n}(\hat{p}_i - y_i)\,\mathbf{x}_i
$$

Each example pushes the weights in the direction of its features, scaled by its **error** $\hat{p}_i - y_i$. Correct, confident examples contribute almost nothing; mistakes contribute a lot. Gradient descent repeats $\mathbf{w} \leftarrow \mathbf{w} - \eta \nabla_{\mathbf{w}}\mathcal{L}$ until the loss stops improving.

## Why convexity matters

Log-loss for logistic regression is **convex**: it has a single bowl-shaped minimum with no local traps. Any sensible optimizer (gradient descent, L-BFGS, Newton's method) reaches the same answer. That is a big practical advantage over neural networks, where results depend on initialization.

## Regularization

In practice we add a penalty such as $\lambda\lVert\mathbf{w}\rVert^2$ (L2) to keep weights small. It reduces overfitting and, crucially, keeps the weights finite when the classes are perfectly separable.`,
        misconceptions: [
          "Accuracy is not what training optimizes; the model minimizes log-loss, so two models with equal accuracy can have very different log-loss.",
          "There is no closed-form solution like the normal equation in linear regression; the weights are found iteratively.",
        ],
        related_concepts: ["Gradient Descent", "Ridge & Lasso"],
        takeaway: "Log-loss is maximum likelihood in disguise: convex, honest about confidence, and with a simple error-times-feature gradient.",
      },
    },
    {
      title: "Scoring one email for spam",
      summary:
        "Suppose a trained spam model has bias b = −3 and two features: the number of links, with weight 1.2, and an urgent-words score, with weight 0.8. An email with 2 links and an urgency score of 1.5 gets z = −3 + 1.2 × 2 + 0.8 × 1.5 = 0.6. The sigmoid gives σ(0.6) ≈ 0.65, so the model estimates a 65% chance of spam, and with the default 0.5 threshold the email is flagged. Notice what a weight means: each extra link adds 1.2 to the log-odds, which multiplies the odds of spam by e^1.2 ≈ 3.3.",
      key_takeaway:
        "Coefficients act on the log-odds: a weight w multiplies the odds by e^w for each one-unit increase in that feature.",
      visual: {
        type: "formula",
        content: r`z = -3 + 1.2\cdot 2 + 0.8\cdot 1.5 = 0.6 \;\Rightarrow\; \sigma(0.6) \approx 0.65`,
        caption: "One prediction, step by step.",
        alt_text: "z equals minus 3 plus 1.2 times 2 plus 0.8 times 1.5 equals 0.6, sigmoid of 0.6 is about 0.65",
      },
      quick_check: {
        question: "In this model, what does the weight 1.2 on 'number of links' mean?",
        options: [
          "Each extra link adds 1.2 percentage points to the spam probability",
          "Each extra link multiplies the odds of spam by about 3.3",
          "Emails with more than 1.2 links are spam",
          "Spam is 1.2 times more likely overall",
        ],
        answer_index: 1,
        explanation:
          "Weights add to the log-odds. Adding 1.2 to the log-odds multiplies the odds by e^1.2 ≈ 3.3. The change in probability itself depends on where you are on the S-curve, so it is not a fixed number of percentage points.",
      },
      detail: {
        body_markdown: r`## The model

A spam filter has been trained with two features:

- $x_1$: number of links in the email, weight $w_1 = 1.2$
- $x_2$: an "urgent words" score (how often words like *now*, *act*, *winner* appear), weight $w_2 = 0.8$
- bias $b = -3$

## Step 1: the linear score

For an email with 2 links and urgency 1.5:

$$
z = b + w_1x_1 + w_2x_2 = -3 + 1.2(2) + 0.8(1.5) = -3 + 2.4 + 1.2 = 0.6
$$

## Step 2: the probability

$$
\hat{p} = \sigma(0.6) = \frac{1}{1 + e^{-0.6}} = \frac{1}{1 + 0.549} \approx 0.65
$$

The model estimates a **65% chance** the email is spam. With a 0.5 threshold it goes to the spam folder.

## Step 3: interpreting the weights

Rewrite the model on the odds scale:

$$
\frac{\hat{p}}{1-\hat{p}} = e^{b}\,e^{w_1x_1}\,e^{w_2x_2}
$$

Each extra link multiplies the odds of spam by $e^{1.2} \approx 3.3$. Each extra unit of urgency multiplies them by $e^{0.8} \approx 2.2$. These **odds ratios** are how doctors and credit analysts read logistic regression.

Check it: with 3 links instead of 2, $z = 1.8$ and $\hat{p} \approx 0.86$. The odds went from $0.65/0.35 \approx 1.86$ to $0.86/0.14 \approx 6.1$, which is about 3.3 times larger. The probability rose by 21 points, but that number would be different from a different starting point, which is why we interpret weights as odds ratios rather than probability changes.

## Step 4: choosing the threshold

Sending a real email to spam is costly; letting spam through is mildly annoying. A product team might raise the threshold to 0.8, accepting more missed spam in exchange for fewer false alarms. The model stays the same; only the decision rule changes.

## What to try yourself

Work out the probability for an email with no links and no urgent words. You should get $\sigma(-3) \approx 0.047$: the bias alone encodes a low prior belief that a typical email is spam.`,
        misconceptions: [
          "A weight is not a change in probability; the same weight moves the probability a lot near 0.5 and very little near 0 or 1.",
          "Comparing raw weights across features is only fair if the features are on comparable scales.",
        ],
        related_concepts: ["Precision & Recall", "ROC & AUC"],
        takeaway: "Read coefficients as odds ratios, and pick the threshold from the costs of each kind of mistake.",
      },
    },
    {
      title: "Where logistic regression goes wrong",
      summary:
        "Three mistakes are common. First, the decision boundary is linear in the features, so curved patterns are missed unless you add interaction or polynomial features. Second, if the classes are perfectly separable, unregularized weights grow without limit as the optimizer chases ever more confident predictions, which is why scikit-learn applies L2 regularization by default. Third, the 0.5 threshold is not sacred: when only 1% of transactions are fraud, a model can be 99% accurate while catching no fraud at all. Pick thresholds from precision and recall, and scale features so regularization treats them fairly.",
      key_takeaway:
        "Watch for non-linear patterns, separable data without regularization, and misleading accuracy on imbalanced classes.",
      visual: { type: "icon", content: "triangle-alert", caption: null, alt_text: "Warning icon" },
      quick_check: {
        question: "Your fraud model is 99% accurate on data where 1% of transactions are fraud. What should you check first?",
        options: [
          "Nothing, 99% accuracy is excellent",
          "Whether it catches any fraud at all (recall on the fraud class)",
          "Whether the learning rate was too high",
          "Whether the sigmoid was applied twice",
        ],
        answer_index: 1,
        explanation:
          "Predicting 'not fraud' for everything already gives 99% accuracy. Recall on the fraud class shows whether the model finds any fraud, and precision shows how many of its alerts are real.",
      },
      detail: {
        body_markdown: r`## 1. Assuming a straight boundary

The boundary $\mathbf{w}^\top\mathbf{x} + b = 0$ is linear in the inputs. If the positive class forms a ring around the negative class, no straight line separates them and the model performs near chance.

**Fixes:** add polynomial or interaction features (for example $x_1^2$, $x_1x_2$), bin continuous features, or switch to a non-linear model such as gradient-boosted trees.

## 2. Perfect separation and exploding weights

If some line separates the classes perfectly, log-loss keeps decreasing as the weights grow: scaling $\mathbf{w}$ up makes every prediction more confident and more correct. Without a penalty the optimizer never converges, coefficients become huge and their interpretation becomes meaningless.

**Fix:** regularize. scikit-learn's LogisticRegression uses L2 with C = 1.0 by default (C is the *inverse* of regularization strength).

## 3. Accuracy on imbalanced data

With 1% fraud, the constant prediction "legitimate" scores 99% accuracy and is useless. Logistic regression trained naively on such data often produces probabilities that rarely cross 0.5.

**Fixes:**
- Evaluate with precision, recall, F1 and the precision–recall curve.
- Choose the threshold from business costs rather than defaulting to 0.5.
- Consider class weights (class_weight="balanced") so errors on the rare class count more.

## 4. Unscaled features

Regularization penalizes all weights equally. If one feature is measured in millimetres and another in kilometres, the penalty hits them unequally and distorts the model. Optimisers also converge more slowly on badly scaled data.

**Fix:** standardize numeric features (zero mean, unit variance) inside a pipeline so the test set uses the training set's statistics.

## 5. Reading coefficients causally

A large positive weight means the feature is associated with the outcome *given the other features*. It does not mean changing the feature causes the outcome. Correlated features can also share or swap credit, so individual weights become unstable.

## 6. Treating outputs as calibrated without checking

Logistic regression is often reasonably calibrated, but heavy regularization, class weighting or resampling distort probabilities. If decisions depend on the actual numbers, check a calibration curve on held-out data.`,
        misconceptions: [
          "Class weighting improves recall on the rare class but changes the meaning of the output probabilities.",
          "A large coefficient is not proof that a feature causes the outcome.",
        ],
        related_concepts: ["Precision & Recall", "Ridge & Lasso", "Decision Trees"],
        takeaway: "Regularize, scale, evaluate beyond accuracy and choose thresholds deliberately.",
      },
    },
    {
      title: "Logistic regression vs. its neighbors",
      summary:
        "Logistic regression is a single neuron with a sigmoid activation, which makes it the bridge from classical machine learning to deep learning. A linear SVM draws a similar straight boundary but maximizes the margin instead of the likelihood, so it does not output probabilities natively. Naive Bayes is its generative counterpart: it models how each class produces features and often wins with very little data, while logistic regression usually wins as data grows. Decision trees capture non-linear interactions automatically but give coarse, step-like probabilities. Choose logistic regression when you need speed, interpretability and probabilities.",
      key_takeaway:
        "Logistic regression is a one-neuron network: linear like an SVM, discriminative unlike Naive Bayes, smoother but less flexible than trees.",
      visual: {
        type: "mermaid",
        content: `graph LR
  LR[Logistic Regression] -->|max-margin cousin| SVM[Linear SVM]
  LR -->|generative counterpart| NB[Naive Bayes]
  LR -->|non-linear alternative| DT[Decision Trees]
  LR -->|one neuron of| NN[Neural Network]`,
        caption: "How logistic regression relates to other classifiers.",
        alt_text: "Diagram linking logistic regression to linear SVM, Naive Bayes, decision trees and neural networks",
      },
      quick_check: {
        question: "Which deep-learning building block is equivalent to logistic regression?",
        options: [
          "A convolutional layer",
          "A single neuron with a sigmoid activation",
          "A recurrent layer",
          "An attention head",
        ],
        answer_index: 1,
        explanation:
          "A single neuron computes a weighted sum plus bias and applies an activation. With a sigmoid activation and log-loss, that is exactly logistic regression.",
      },
      detail: {
        body_markdown: r`## Side by side

| Model | Boundary | Probabilities | Strength | Weakness |
|---|---|---|---|---|
| Logistic regression | Linear | Native, usually reasonable | Fast, interpretable | Misses non-linear patterns |
| Linear SVM | Linear | Not native | Robust margin, good in high dimensions | No probabilities without calibration |
| Naive Bayes | Linear (for common variants) | Native but often overconfident | Very little data needed | Independence assumption |
| Decision tree | Axis-aligned steps | Coarse | Captures interactions, no scaling needed | Overfits alone |
| Neural network | Any shape | Native | Learns features | Data hungry, less interpretable |

## Logistic regression vs. linear SVM

Both learn $\mathbf{w}^\top\mathbf{x} + b$. Logistic regression minimizes log-loss, so every point influences the solution a little. A linear SVM minimizes hinge loss, so only points near the boundary (the support vectors) matter. In practice their accuracy is often very close; pick logistic regression when you need probabilities.

## Logistic regression vs. Naive Bayes

This is the classic **discriminative vs. generative** pair. Naive Bayes models $P(\mathbf{x} \mid y)$ and $P(y)$ and applies Bayes' rule; logistic regression models $P(y \mid \mathbf{x})$ directly. Ng and Jordan (2002) showed Naive Bayes approaches its best accuracy with fewer examples, while logistic regression reaches a better final accuracy with enough data.

## Logistic regression vs. trees

Trees split the feature space into rectangles and naturally capture interactions such as "high income **and** young age". Logistic regression needs those interactions engineered by hand. Ensembles of trees (random forests, gradient boosting) usually beat logistic regression on tabular data, at the cost of interpretability.

## Logistic regression inside neural networks

A neural network classifier's final layer with a sigmoid (or softmax for many classes) is logistic regression applied to features learned by the earlier layers. Understanding log-loss and the sigmoid here is directly reusable when you study deep learning.

## Rule of thumb

Start with logistic regression. Move to tree ensembles for complex tabular data, and to neural networks for images, audio and text, keeping logistic regression as the baseline to report against.`,
        misconceptions: [
          "SVMs are not always more accurate than logistic regression; with linear kernels the two often perform almost identically.",
          "Naive Bayes is not simply worse; with very small training sets it can outperform logistic regression.",
        ],
        related_concepts: ["SVM", "Naive Bayes", "Decision Trees"],
        takeaway: "Pick between linear models by whether you need probabilities, and move to trees or networks only when non-linearity demands it.",
      },
    },
  ],
});
