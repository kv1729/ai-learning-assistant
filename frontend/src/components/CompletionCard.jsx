import { ArrowRight, CircleCheck } from "lucide-react";
import { Link } from "react-router";
import { buttonPrimary, buttonSecondary } from "../lib/ui.js";

// Shown after the last card of a concept.
export default function CompletionCard({ conceptName, correct, answered, total, next, onNext, onRestart, curriculumId }) {
  return (
    <section className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <CircleCheck size={56} strokeWidth={1.5} className="text-success" aria-hidden="true" />
      <div>
        <h2 className="text-[22px] font-semibold">{conceptName} complete</h2>
        <p className="mt-2 text-[15px] text-muted">
          {answered === 0
            ? "No quick checks taken yet. They help it stick."
            : `Quick checks: ${correct} of ${answered} correct${answered < total ? ` (${total - answered} not taken)` : ""}.`}
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        {next ? (
          <button type="button" onClick={onNext} className={buttonPrimary}>
            Next: {next.name} <ArrowRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <Link to={`/explore/${curriculumId}`} className={buttonPrimary}>
            Back to curriculum
          </Link>
        )}
        <button type="button" onClick={onRestart} className={buttonSecondary}>
          Review from card 1
        </button>
      </div>
    </section>
  );
}
