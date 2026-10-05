function DetailScreen({ card, setCurrentScreen }) {
  if (!card) return null;

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
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300">Explore in Depth</p>
            <h2 className="text-sm font-semibold text-slate-200">Read the full idea</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        <div className="mx-auto flex max-w-3xl flex-col">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-900">
            <img src={card.image} alt={card.title} className="h-60 w-full object-cover sm:h-72" />
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">{card.title}</h1>
            <p className="mt-5 text-[17px] leading-8 text-slate-300 sm:text-lg">
              {card.detailedExplanation || card.summary}
            </p>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Key takeaway</p>
            <p className="mt-3 text-[16px] leading-8 text-slate-200">{card.keyTakeaway || card.summary}</p>
          </div>

          {card.formula ? (
            <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Formula</p>
              <pre className="mt-3 overflow-x-auto rounded-3xl bg-slate-950 p-4 text-sm text-slate-100">
                {card.formula}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default DetailScreen;
