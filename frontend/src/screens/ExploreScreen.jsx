import { ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import * as api from "../api/client.js";
import ProgressBar from "../components/ProgressBar.jsx";
import { SkeletonText } from "../components/StatusViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { buttonPrimary } from "../lib/ui.js";
import { useLearner } from "../state/learnerContext.js";

const SUGGESTED_TOPICS = ["Deep Learning", "NLP", "Large Language Models", "Reinforcement Learning", "MLOps"];

export default function ExploreScreen() {
  const { learner } = useLearner();
  const curricula = useAsync(() => api.getCurricula(), "curricula");
  const [topic, setTopic] = useState("");
  const [request, setRequest] = useState({ status: "idle", topic: "", error: null });

  const build = async (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setTopic(trimmed);
    setRequest({ status: "building", topic: trimmed, error: null });
    try {
      await api.createCurriculum(trimmed);
      setRequest({ status: "idle", topic: "", error: null });
    } catch (error) {
      setRequest({ status: "error", topic: trimmed, error });
    }
  };

  const building = request.status === "building";

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-8">
      <h1 className="text-[26px] font-semibold">Explore</h1>

      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          build(topic);
        }}
      >
        <label htmlFor="topic" className="text-[15px] text-muted">
          What do you want to learn?
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-accent">
          <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            id="topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. Reinforcement Learning"
            autoComplete="off"
            enterKeyHint="go"
            className="min-h-12 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
          />
        </div>
        <button type="submit" disabled={building || !topic.trim()} className={`${buttonPrimary} mt-3 w-full`}>
          {building ? "Planning…" : "Build curriculum"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_TOPICS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={building}
            onClick={() => build(suggestion)}
            className="inline-flex min-h-9 items-center rounded-full border border-line px-3.5 text-[14px] active:bg-surface-2 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {building ? (
          <div className="mt-6 rounded-lg bg-surface-2 p-4">
            <SkeletonText lines={4} message={`Planning a curriculum for "${request.topic}"…`} />
          </div>
        ) : null}
        {request.status === "error" ? (
          <div role="alert" className="mt-6 rounded-lg bg-surface-2 p-4 text-[15px] leading-relaxed">
            <p className="font-semibold">Couldn't build "{request.topic}"</p>
            <p className="mt-1 text-muted">{request.error.message}</p>
          </div>
        ) : null}
      </div>

      <h2 className="mt-8 text-[17px] font-semibold">Your curricula</h2>
      {curricula.status === "loading" ? (
        <div className="mt-3">
          <SkeletonText lines={2} />
        </div>
      ) : curricula.status === "error" ? (
        <p className="mt-3 text-muted">{curricula.error.message}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {curricula.data.map((curriculum) => {
            const done = curriculum.concept_ids.filter((id) => learner?.completed[id]).length;
            return (
              <li key={curriculum.id}>
                <Link
                  to={`/explore/${curriculum.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line p-4 active:bg-surface-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold">{curriculum.title}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">
                      {done} of {curriculum.concept_ids.length} concepts completed
                    </span>
                    <span className="mt-2 block">
                      <ProgressBar value={done} max={curriculum.concept_ids.length} label={`${curriculum.title} progress`} />
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-muted" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
