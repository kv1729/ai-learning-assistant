import { Bookmark, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import * as api from "../api/client.js";
import ProgressBar from "../components/ProgressBar.jsx";
import { ErrorState, SkeletonText } from "../components/StatusViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { feedPath } from "../lib/learning.js";
import { useLearner } from "../state/learnerContext.js";

function Stat({ value, label }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-3">
      <p className="text-[22px] font-semibold">{value}</p>
      <p className="text-[12.5px] leading-tight text-muted">{label}</p>
    </div>
  );
}

export default function ProfileScreen() {
  const { learner } = useLearner();
  // Reload whenever learner state changes (saves, answers, progress).
  const profile = useAsync(() => api.getProfile(), learner?.updated_at ?? "initial");

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-8">
      <h1 className="text-[26px] font-semibold">Profile</h1>
      <p className="mt-1 text-[14px] text-muted">Progress is stored on this device.</p>

      {profile.status === "error" ? (
        <ErrorState title="Couldn't load your profile" message={profile.error.message} retryable onRetry={profile.reload} />
      ) : !profile.data ? (
        <div className="mt-6">
          <SkeletonText lines={8} />
        </div>
      ) : (
        <ProfileBody profile={profile.data} />
      )}
    </div>
  );
}

function ProfileBody({ profile }) {
  const { stats, in_progress: inProgress, needs_review: needsReview } = profile;
  const accuracy = stats.quiz_answered ? `${Math.round((stats.quiz_correct / stats.quiz_answered) * 100)}%` : "–";

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat value={stats.concepts_completed} label="Concepts completed" />
        <Stat value={accuracy} label={`Quiz accuracy (${stats.quiz_answered} answered)`} />
        <Stat value={stats.saved_count} label="Saved cards" />
      </div>

      <h2 className="mt-8 text-[17px] font-semibold">Continue learning</h2>
      {inProgress.length ? (
        <ul className="mt-3 flex flex-col gap-3">
          {inProgress.map((c) => (
            <li key={c.curriculum_id}>
              <Link
                to={c.resume ? feedPath(c.resume.node_id, c.resume.card_position) : `/explore/${c.curriculum_id}`}
                className="flex items-center gap-3 rounded-xl border border-line p-4 active:bg-surface-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold">{c.title}</span>
                  <span className="mt-0.5 block text-[13px] text-muted">
                    {c.completed} of {c.total} concepts · Resume
                  </span>
                  <span className="mt-2 block">
                    <ProgressBar value={c.completed} max={c.total} label={`${c.title} progress`} />
                  </span>
                </span>
                <ChevronRight size={18} className="text-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[15px] text-muted">Nothing started yet. Open Home or Explore to begin.</p>
      )}

      <Link
        to="/profile/saved"
        className="mt-6 flex min-h-14 items-center gap-3 rounded-xl border border-line px-4 active:bg-surface-2"
      >
        <Bookmark size={20} aria-hidden="true" />
        <span className="flex-1 text-[16px] font-semibold">Saved cards</span>
        <span className="text-[15px] text-muted">{stats.saved_count}</span>
        <ChevronRight size={18} className="text-muted" aria-hidden="true" />
      </Link>

      <h2 className="mt-8 text-[17px] font-semibold">Needs review</h2>
      {needsReview.length ? (
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
          {needsReview.map((item) => (
            <li key={item.concept_id}>
              <Link
                to={item.node_id ? feedPath(item.node_id) : "/explore"}
                className="flex min-h-12 items-center gap-3 px-4 active:bg-surface-2"
              >
                <span className="flex-1 text-[15px]">{item.name}</span>
                <span className="text-[14px] text-muted">
                  {item.correct}/{item.answered} correct
                </span>
                <ChevronRight size={18} className="text-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[15px] text-muted">
          {stats.quiz_answered ? "No weak spots so far." : "Answer some quick checks to see what needs review."}
        </p>
      )}
    </>
  );
}
