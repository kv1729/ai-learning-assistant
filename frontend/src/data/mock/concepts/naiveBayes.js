import { makeConcept } from "../makeConcept.js";

const r = String.raw;

export default makeConcept({
  id: "concept-naive-bayes",
  concept_key: "naive-bayes",
  name: "Naive Bayes",
  cards: [
    {
      title: "A fast classifier built on probability",
      summary:
        "Naive Bayes classifies by asking which class makes the observed features most likely, using Bayes' rule. It trains in a single pass over the data by counting how often each feature appears with each class, so it handles millions of documents and thousands of words with ease. It was the engine of early spam filters and remains a strong baseline for text classification, sentiment analysis and any problem with many sparse features and limited labelled data. Its probability estimates are often poorly calibrated, but its rankings, and therefore its decisions, are frequently good.",
      key_takeaway: "Naive Bayes is a fast, count-based probabilistic classifier and a strong baseline for text.",
      visual: { type: "icon", content: "percent", caption: null, alt_text: "Percent icon representing probability" },
      quick_check: {
        question: "Why is Naive Bayes so fast to train?",
        options: [
          "It uses a GPU by default",
          "Training is essentially counting feature frequencies per class",
          "It skips the training data entirely",
          "It only uses one feature",
        ],
        answer_index: 1,
        explanation:
          "Parameters are class frequencies and per-class feature frequencies (or means and variances), all computable in one pass with no iterative optimization.",
      },
    },
    {
      title: "Pretending features are independent",
      summary:
        "Bayes' rule says the probability of a class given the features is proportional to the class's prior probability times the likelihood of the features under that class. Estimating the joint likelihood of thousands of features is impossible with real data, so Naive Bayes makes a bold simplification: given the class, every feature is independent of the others. The likelihood then becomes a product of simple one-feature probabilities. The assumption is almost always false, since words like 'New' and 'York' clearly co-occur, yet the classifier still works because it only needs the correct class to score highest.",
      key_takeaway: "The 'naive' independence assumption is usually wrong but makes the model tractable and often still accurate.",
      visual: {
        type: "formula",
        content: r`P(y \mid \mathbf{x}) \propto P(y)\prod_{j=1}^{d} P(x_j \mid y)`,
        caption: "Naive Bayes: prior times the product of per-feature likelihoods.",
        alt_text: "Probability of class given features is proportional to prior times product of per-feature likelihoods",
      },
      quick_check: {
        question: "What does the 'naive' assumption in Naive Bayes state?",
        options: [
          "All classes are equally likely",
          "Features are independent of each other given the class",
          "Features are independent of the class",
          "There is only one feature",
        ],
        answer_index: 1,
        explanation:
          "Conditional independence given the class lets the joint likelihood factor into a product of per-feature terms.",
      },
    },
    {
      title: "Counting, smoothing and logs",
      summary:
        "Different variants model features differently. Multinomial Naive Bayes uses word counts and suits text; Bernoulli uses presence or absence; Gaussian assumes each numeric feature is normally distributed within a class. Training estimates the class priors and the per-class feature distributions from counts or means and variances. Two practical tricks matter. Laplace smoothing adds a small count to every feature, so a word never seen with a class does not force its probability to zero. And because multiplying many small probabilities underflows, implementations add log-probabilities instead of multiplying probabilities.",
      key_takeaway: "Pick the variant that matches your features, smooth the counts, and work in log space.",
      visual: {
        type: "formula",
        content: r`P(w \mid y) = \frac{\text{count}(w, y) + \alpha}{\sum_{w'} \text{count}(w', y) + \alpha \lvert V \rvert}`,
        caption: "Multinomial likelihood with Laplace (additive) smoothing.",
        alt_text: "Probability of word given class equals its count plus alpha over total count plus alpha times vocabulary size",
      },
      quick_check: {
        question: "What problem does Laplace smoothing solve?",
        options: [
          "Features on different scales",
          "A word never seen with a class giving that class zero probability",
          "Too many classes",
          "Slow training",
        ],
        answer_index: 1,
        explanation:
          "Without smoothing, one unseen word makes the whole product zero for that class, no matter how strong the other evidence is. Adding α to every count prevents this.",
      },
    },
    {
      title: "Classifying 'free money now'",
      summary:
        "A tiny spam filter has priors P(spam) = 0.4 and P(ham) = 0.6. From training counts: P(free | spam) = 0.3, P(money | spam) = 0.2, P(now | spam) = 0.1; for ham the same words have probabilities 0.02, 0.05 and 0.08. For the message 'free money now', the spam score is 0.4 × 0.3 × 0.2 × 0.1 = 0.0024 and the ham score is 0.6 × 0.02 × 0.05 × 0.08 = 0.000048. Normalizing gives P(spam) ≈ 0.98. The message goes to the spam folder, driven mostly by the word 'free'.",
      key_takeaway: "Multiply the prior by each word's likelihood per class, compare, and normalize to get probabilities.",
      visual: {
        type: "formula",
        content: r`\frac{0.0024}{0.0024 + 0.000048} \approx 0.98`,
        caption: "Normalized probability that the message is spam.",
        alt_text: "0.0024 over 0.0024 plus 0.000048 is about 0.98",
      },
      quick_check: {
        question: "If P(free | ham) were 0 and no smoothing were used, what would P(ham | 'free money now') be?",
        options: ["Exactly 0", "0.5", "Equal to the prior, 0.6", "Undefined"],
        answer_index: 0,
        explanation:
          "A single zero factor makes the ham product zero, so the message could never be ham. That is exactly why Laplace smoothing is used.",
      },
    },
    {
      title: "Where Naive Bayes goes wrong",
      summary:
        "Because it multiplies evidence as if features were independent, Naive Bayes double-counts correlated features and produces extreme probabilities, often 0.999 or 0.001. Treat those numbers as scores, not calibrated probabilities, unless you calibrate them. Strongly correlated or redundant features can also skew decisions. Gaussian Naive Bayes misbehaves when numeric features are far from normal, such as heavily skewed amounts. Without smoothing, unseen feature values zero out whole classes. And as training data grows, discriminative models like logistic regression usually overtake it in accuracy.",
      key_takeaway: "Expect overconfident probabilities, watch for correlated features, and always smooth.",
      visual: { type: "icon", content: "triangle-alert", caption: null, alt_text: "Warning icon" },
      quick_check: {
        question: "Why are Naive Bayes probabilities often too extreme (close to 0 or 1)?",
        options: [
          "The model uses too few features",
          "Correlated features are counted as independent evidence, compounding confidence",
          "Laplace smoothing pushes probabilities to the extremes",
          "The priors are always 0.5",
        ],
        answer_index: 1,
        explanation:
          "If several features carry the same information, multiplying their likelihoods counts that evidence several times, making the posterior overconfident.",
      },
    },
    {
      title: "Naive Bayes vs. logistic regression",
      summary:
        "Naive Bayes and logistic regression are a classic generative versus discriminative pair. Naive Bayes models how each class generates features, then applies Bayes' rule; logistic regression models the class probability directly. For multinomial text features, both even produce linear decision boundaries. Naive Bayes reaches its best performance with fewer examples and trains in one pass, so it shines on small or streaming text datasets. Logistic regression makes fewer assumptions and usually wins once data is plentiful. Compared with KNN and trees, Naive Bayes is far faster and copes better with very many sparse features.",
      key_takeaway: "Naive Bayes learns faster from little data; logistic regression usually wins with more data.",
      visual: {
        type: "mermaid",
        content: `graph LR
  NB[Naive Bayes] -->|generative vs discriminative| LR[Logistic Regression]
  NB -->|faster on sparse features| KNN[KNN]
  NB -->|one-pass vs greedy splits| DT[Decision Trees]`,
        caption: "Naive Bayes compared with other classifiers.",
        alt_text: "Diagram comparing Naive Bayes with logistic regression, KNN and decision trees",
      },
      quick_check: {
        question: "When is Naive Bayes most likely to beat logistic regression?",
        options: [
          "With very large training sets",
          "With very small training sets of sparse text features",
          "When features are strongly correlated",
          "When calibrated probabilities are essential",
        ],
        answer_index: 1,
        explanation:
          "Generative models like Naive Bayes approach their best accuracy with fewer examples; logistic regression typically overtakes them as data grows.",
      },
    },
  ],
});
