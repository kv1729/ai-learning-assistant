import { Link, useNavigate, useParams } from "react-router";
import * as api from "../api/client.js";
import Markdown from "../components/Markdown.jsx";
import SaveButton from "../components/SaveButton.jsx";
import ScreenHeader from "../components/ScreenHeader.jsx";
import { ErrorState, SkeletonText } from "../components/StatusViews.jsx";
import CardVisual from "../components/visuals/CardVisual.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { FACET_LABELS, feedPath } from "../lib/learning.js";
import { buttonPrimary } from "../lib/ui.js";
import { useLearner } from "../state/learnerContext.js";

export default function DetailScreen() {
  const { nodeId, position } = useParams();
  const navigate = useNavigate();
  const { learner, toggleSave } = useLearner();
  const feed = useAsync(() => api.getFeed(nodeId), nodeId);
  const card = feed.data?.cards[Number(position) - 1];
  const detail = useAsync(() => (card ? api.getCardDetail(card.id) : new Promise(() => {})), card?.id ?? "pending");
  const backTo = feedPath(nodeId, position);

  if (feed.status === "error" || (feed.data && !card)) {
    return (
      <div className="flex h-full flex-col">
        <ScreenHeader title="Explore in Depth" fallbackTo={backTo} />
        <ErrorState title="Card not found" message={feed.error?.message ?? "This card is not available yet."} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={feed.data?.concept.name ?? "Explore in Depth"}
        subtitle={card ? FACET_LABELS[card.facet] : null}
        fallbackTo={backTo}
      >
        {card ? <SaveButton saved={Boolean(learner?.saved[card.id])} onToggle={() => toggleSave(card.id)} /> : null}
      </ScreenHeader>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {card ? (
          <>
            <div
              className={`flex items-center justify-center bg-surface-2 px-5 py-4 ${card.visual?.type === "mermaid" ? "h-72" : "h-48"}`}
            >
              <CardVisual visual={card.visual} size="detail" />
            </div>
            <div className="px-5 pt-5 pb-10">
              <h2 className="text-[24px] leading-tight font-semibold">{card.title}</h2>

              <div className="mt-4">
                {detail.status === "loading" ? (
                  <SkeletonText lines={10} message="Writing an in-depth explanation… (only the first time)" />
                ) : detail.status === "error" ? (
                  <div className="rounded-lg bg-surface-2">
                    <ErrorState
                      title="In-depth explanation unavailable"
                      message={detail.error.message}
                      retryable={detail.error.retryable}
                      onRetry={detail.reload}
                      retrying={detail.refreshing}
                    />
                  </div>
                ) : (
                  <DetailBody detail={detail.data} />
                )}
              </div>

              <button
                type="button"
                className={`${buttonPrimary} mt-8 w-full`}
                onClick={() => navigate(`${backTo}/check`, { replace: true })}
              >
                Take the Quick Check
              </button>
            </div>
          </>
        ) : (
          <div className="px-5 pt-5">
            <SkeletonText lines={12} />
          </div>
        )}
      </main>
    </div>
  );
}

function DetailBody({ detail }) {
  return (
    <>
      <Markdown>{detail.body_markdown}</Markdown>

      {detail.misconceptions.length ? (
        <section className="mt-8 rounded-lg bg-surface-2 p-4">
          <h3 className="text-[15px] font-semibold">Common misconceptions</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-[15px] leading-relaxed">
            {detail.misconceptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {detail.related_concepts.length ? (
        <section className="mt-6">
          <h3 className="text-[15px] font-semibold">Related concepts</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.related_concepts.map((related) =>
              related.node_id ? (
                <Link
                  key={related.name}
                  to={feedPath(related.node_id)}
                  className="inline-flex min-h-9 items-center rounded-full border border-line px-3.5 text-[14px] active:bg-surface-2"
                >
                  {related.name}
                </Link>
              ) : (
                <span key={related.name} className="inline-flex min-h-9 items-center rounded-full bg-surface-2 px-3.5 text-[14px] text-muted">
                  {related.name}
                </span>
              ),
            )}
          </div>
        </section>
      ) : null}

      <p className="mt-8 border-l-4 border-accent pl-4 text-[16px] leading-relaxed font-medium">{detail.takeaway}</p>
    </>
  );
}
