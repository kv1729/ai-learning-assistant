import { Check, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import * as api from "../api/client.js";
import ScreenHeader from "../components/ScreenHeader.jsx";
import { ErrorState, SkeletonText } from "../components/StatusViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { feedPath } from "../lib/learning.js";
import { buttonPrimary, buttonSecondary } from "../lib/ui.js";
import { useLearner } from "../state/learnerContext.js";

const LETTERS = ["A", "B", "C", "D"];

function optionStyle({ answered, isAnswer, isChosen }) {
  if (!answered) return "border-line active:bg-surface-2";
  if (isAnswer) return "border-success bg-success-soft";
  if (isChosen) return "border-danger bg-danger-soft";
  return "border-line text-muted";
}

export default function QuickCheckScreen() {
  const { nodeId, position } = useParams();
  const navigate = useNavigate();
  const { learner, recordQuizAttempt } = useLearner();
  const feed = useAsync(() => api.getFeed(nodeId), nodeId);
  const [submitting, setSubmitting] = useState(false);
  const card = feed.data?.cards[Number(position) - 1];
  const backTo = feedPath(nodeId, position);

  if (feed.status === "error" || (feed.data && !card)) {
    return (
      <div className="flex h-full flex-col">
        <ScreenHeader title="Quick Check" fallbackTo={backTo} />
        <ErrorState title="Question not found" message={feed.error?.message ?? "This card is not available yet."} />
      </div>
    );
  }

  const qc = card?.quick_check;
  const attempt = card ? learner?.attempts[card.id] : null;
  const answered = Boolean(attempt);

  const choose = async (index) => {
    if (answered || submitting) return;
    setSubmitting(true);
    try {
      await recordQuizAttempt(card.id, index);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Quick Check" subtitle={card?.title} fallbackTo={backTo} />
      <main className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-8">
        {!qc ? (
          <SkeletonText lines={6} />
        ) : (
          <>
            <h2 className="text-[20px] leading-snug font-semibold">{qc.question}</h2>

            <ul className="mt-6 flex flex-col gap-3">
              {qc.options.map((option, index) => {
                const isAnswer = index === qc.answer_index;
                const isChosen = index === attempt?.selected_index;
                return (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => choose(index)}
                      disabled={answered || submitting}
                      aria-pressed={isChosen}
                      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[16px] leading-snug disabled:cursor-default ${optionStyle({ answered, isAnswer, isChosen })}`}
                    >
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-current text-[13px] font-semibold">
                        {LETTERS[index]}
                      </span>
                      <span className="flex-1">{option}</span>
                      {answered && isAnswer ? <Check size={20} className="text-success" aria-label="Correct answer" /> : null}
                      {answered && isChosen && !isAnswer ? <X size={20} className="text-danger" aria-label="Your answer" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div aria-live="polite">
              {answered ? (
                <section className="mt-6">
                  <p className={`text-[17px] font-semibold ${attempt.is_correct ? "text-success" : "text-danger"}`}>
                    {attempt.is_correct ? "Correct" : "Not quite"}
                  </p>
                  <p className="mt-2 text-[16px] leading-relaxed">{qc.explanation}</p>
                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      type="button"
                      className={buttonPrimary}
                      onClick={() => navigate(feedPath(nodeId, Number(position) + 1), { replace: true })}
                    >
                      Continue to next card
                    </button>
                    <button
                      type="button"
                      className={buttonSecondary}
                      onClick={() => navigate(`${backTo}/detail`, { replace: true })}
                    >
                      Explore in Depth
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
