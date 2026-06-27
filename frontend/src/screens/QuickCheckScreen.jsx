import { useState } from "react";

function QuickCheckScreen({ card, setCurrentScreen }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  if (!card || !card.quickCheck) return null;

  const handleAnswerSelect = (option) => {
    if (showResult) return;
    setSelectedAnswer(option);
    setShowResult(true);
  };

  const isCorrect = selectedAnswer === card.quickCheck.answer;

  return (
    <div className="flex h-full flex-col bg-[#050816] text-white">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentScreen("home")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-white/10 bg-slate-900 text-lg text-white transition hover:bg-slate-800"
          >
            ←
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300">Quick Check</p>
            <h2 className="text-sm font-semibold text-slate-200">Answer and learn</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-inner">
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Question</p>
          <p className="mt-3 text-xl font-semibold leading-7 text-white">{card.quickCheck.question}</p>
        </div>

        <div className="mt-5 space-y-3">
          {card.quickCheck.options.map((option, index) => {
            let classes = "w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-4 text-left text-slate-200 transition-all duration-200 hover:border-cyan-400 hover:text-white";

            if (showResult && option === card.quickCheck.answer) {
              classes = "w-full rounded-3xl border border-emerald-500 bg-emerald-500/10 px-4 py-4 text-left text-emerald-100";
            } else if (showResult && option === selectedAnswer) {
              classes = "w-full rounded-3xl border border-red-500 bg-red-500/10 px-4 py-4 text-left text-red-100";
            }

            return (
              <button key={index} type="button" onClick={() => handleAnswerSelect(option)} className={classes}>
                {option}
              </button>
            );
          })}
        </div>

        {showResult ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5 text-[15px] leading-7 text-slate-300">
              <p className="font-semibold text-white">{isCorrect ? "Correct!" : "Not quite."}</p>
              <p className="mt-3">{card.quickCheck.explanation}</p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentScreen("home")}
              className="w-full rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
            >
              Continue
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default QuickCheckScreen;
