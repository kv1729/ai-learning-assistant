import { Check, X } from "lucide-react";
import { FACET_LABELS } from "../lib/learning.js";
import { buttonPrimary, buttonSecondary } from "../lib/ui.js";
import SaveButton from "./SaveButton.jsx";
import CardVisual from "./visuals/CardVisual.jsx";

export default function LearningCard({ card, total, saved, attempt, onToggleSave, onExplore, onQuickCheck }) {
  return (
    <article className="flex h-full flex-col" aria-label={`${card.title}, card ${card.position} of ${total}`}>
      <div className="relative flex h-[27%] min-h-32 shrink-0 items-center justify-center bg-surface-2 px-12 py-3">
        <button
          type="button"
          onClick={onExplore}
          aria-label="Open in depth"
          className="flex h-full w-full items-center justify-center"
        >
          <CardVisual visual={card.visual} />
        </button>
        <SaveButton saved={saved} onToggle={onToggleSave} className="absolute top-0 right-3" />
      </div>

      <div className="flex items-center justify-between px-5 pt-3 text-[13px] font-medium text-muted">
        <span>{FACET_LABELS[card.facet]}</span>
        <span aria-hidden="true">
          {card.position} / {total}
        </span>
      </div>

      <h2 className="px-5 pt-1 text-[22px] leading-snug font-semibold text-fg">{card.title}</h2>

      <p className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 text-[16px] leading-[1.55] text-fg/85">
        {card.summary}
      </p>

      <div className="grid grid-cols-2 gap-3 px-5 pt-3 pb-4">
        <button type="button" onClick={onExplore} className={buttonPrimary}>
          Explore in Depth
        </button>
        <button type="button" onClick={onQuickCheck} className={buttonSecondary}>
          {attempt ? (
            <>
              {attempt.is_correct ? (
                <Check size={18} className="text-success" aria-hidden="true" />
              ) : (
                <X size={18} className="text-danger" aria-hidden="true" />
              )}
              Answered
            </>
          ) : (
            "Quick Check"
          )}
        </button>
      </div>
    </article>
  );
}
