import { useState } from "react";

function LearningCard({ card, currentIndex, totalCards, onExplore, onQuickCheck }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[16px] border border-white/10 bg-slate-950 shadow-2xl">
      <div className="mt-2 relative h-[38%] min-h-[190px] bg-slate-900">
        <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
        <div className="absolute right-3 top-3 rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-lg">
          {currentIndex + 1} / {totalCards}
        </div>
      </div>

      <button
        type="button"
        aria-label="Save card"
        onClick={() => setSaved((value) => !value)}
        className={`absolute right-3 top-[calc(38%-1.5rem)] text-3xl transition ${
          saved ? "text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.45)]" : "text-white shadow-[0_0_12px_rgba(15,23,42,0.8)]"
        }`}
      >
        🔖
      </button>

      <div className="flex flex-1 flex-col px-3 py-3 text-white">
        <h2 className="text-2xl font-bold leading-tight">{card.title}</h2>

        <p className="mt-2 flex-1 text-lg leading-relaxed text-slate-300">{card.summary}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onExplore}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
          >
            Explore
          </button>

          <button
            type="button"
            onClick={onQuickCheck}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-2.5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:opacity-90"
          >
            Quick Check
          </button>
        </div>
      </div>
    </div>
  );
}

export default LearningCard;