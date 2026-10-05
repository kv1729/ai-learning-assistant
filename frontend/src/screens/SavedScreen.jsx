import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import * as api from "../api/client.js";
import ScreenHeader from "../components/ScreenHeader.jsx";
import { ErrorState, SkeletonText } from "../components/StatusViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { FACET_LABELS, feedPath } from "../lib/learning.js";
import { useLearner } from "../state/learnerContext.js";

export default function SavedScreen() {
  const { learner } = useLearner();
  const saved = useAsync(() => api.getSavedCards(), learner?.updated_at ?? "initial");

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Saved cards" fallbackTo="/profile" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {saved.status === "error" ? (
          <ErrorState title="Couldn't load saved cards" message={saved.error.message} retryable onRetry={saved.reload} />
        ) : !saved.data ? (
          <div className="p-5">
            <SkeletonText lines={6} />
          </div>
        ) : saved.data.length === 0 ? (
          <p className="px-5 pt-6 text-[15px] text-muted">
            Nothing saved yet. Tap the bookmark on any card to keep it here.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {saved.data.map((item) => (
              <li key={item.card_id}>
                <Link
                  to={item.node_id ? feedPath(item.node_id, item.position) : "/"}
                  className="flex min-h-16 items-center gap-3 px-5 py-3 active:bg-surface-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15.5px] font-medium">{item.title}</span>
                    <span className="block text-[13px] text-muted">
                      {item.concept_name} · {FACET_LABELS[item.facet]}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
