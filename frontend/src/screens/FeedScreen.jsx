import { ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import * as api from "../api/client.js";
import CardPager from "../components/CardPager.jsx";
import CompletionCard from "../components/CompletionCard.jsx";
import ConceptTabs from "../components/ConceptTabs.jsx";
import LearningCard from "../components/LearningCard.jsx";
import { ErrorState, SkeletonCard } from "../components/StatusViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { feedPath, nextPositionFor } from "../lib/learning.js";
import { useLearner } from "../state/learnerContext.js";

const POLL_INTERVAL_MS = 1000;

export default function FeedScreen() {
  const { nodeId, position: positionParam } = useParams();
  const navigate = useNavigate();
  const { learner, toggleSave, markCardSeen, markConceptCompleted, setResumePosition } = useLearner();
  const feed = useAsync(() => api.getFeed(nodeId), nodeId);

  const concept = feed.data?.concept;
  const cards = feed.data?.cards ?? [];
  const ready = concept?.content_status === "ready";
  const itemCount = cards.length + 1; // cards + completion card
  const position = Number(positionParam);
  const index = position - 1;
  const validPosition = Number.isInteger(position) && position >= 1 && (!ready || position <= itemCount);

  // Lazy generation: start it if needed, then poll until it settles.
  useEffect(() => {
    const status = feed.data?.concept.content_status;
    if (status === "not_generated") {
      api.generateConcept(feed.data.concept.id).then(feed.reload, feed.reload);
    } else if (status === "generating") {
      const timer = setTimeout(feed.reload, POLL_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
  }, [feed.data, feed.reload]);

  // Prefetch: once this concept is ready, quietly start generating the next one.
  useEffect(() => {
    if (feed.data?.concept.content_status !== "ready") return;
    const tabs = feed.data.tabs;
    const next = tabs[tabs.findIndex((t) => t.node_id === feed.data.node.id) + 1];
    if (next?.content_status === "not_generated") api.generateConcept(next.concept_id);
  }, [feed.data]);

  // Progress: record the card being viewed and where to resume.
  const conceptId = concept?.id;
  const curriculumId = feed.data?.curriculum.id;
  useEffect(() => {
    if (!ready || !validPosition) return;
    if (index < cards.length) markCardSeen(conceptId, position);
    else markConceptCompleted(conceptId);
    setResumePosition(curriculumId, nodeId, position);
  }, [ready, validPosition, index, position, cards.length, conceptId, curriculumId, nodeId, markCardSeen, markConceptCompleted, setResumePosition]);

  if (!validPosition) return <Navigate to={feedPath(nodeId, 1)} replace />;

  if (feed.status === "error") {
    return <ErrorState title="Couldn't open this topic" message={feed.error.message} retryable onRetry={feed.reload} />;
  }

  // While switching concepts, keep the previous tab strip if it contains this node.
  const previousTabs = feed.previousData?.tabs ?? [];
  const tabs = feed.data?.tabs ?? (previousTabs.some((t) => t.node_id === nodeId) ? previousTabs : []);
  const tabIndex = tabs.findIndex((t) => t.node_id === nodeId);
  const nextTab = tabs[tabIndex + 1] ?? null;

  const goToPosition = (newIndex) => navigate(feedPath(nodeId, newIndex + 1), { replace: true });
  const openTab = (tab) => navigate(feedPath(tab.node_id, nextPositionFor(learner, tab.concept_id)), { replace: true });

  const retryGeneration = () => api.generateConcept(concept.id).then(feed.reload, feed.reload);

  const renderItem = (i) => {
    if (i === cards.length) {
      const attempts = cards.map((c) => learner?.attempts[c.id]).filter(Boolean);
      return (
        <CompletionCard
          conceptName={concept.name}
          correct={attempts.filter((a) => a.is_correct).length}
          answered={attempts.length}
          total={cards.length}
          next={nextTab}
          onNext={() => openTab(nextTab)}
          onRestart={() => goToPosition(0)}
          curriculumId={curriculumId}
        />
      );
    }
    const card = cards[i];
    return (
      <LearningCard
        card={card}
        total={cards.length}
        saved={Boolean(learner?.saved[card.id])}
        attempt={learner?.attempts[card.id]}
        onToggleSave={() => toggleSave(card.id)}
        onExplore={() => navigate(`${feedPath(nodeId, card.position)}/detail`)}
        onQuickCheck={() => navigate(`${feedPath(nodeId, card.position)}/check`)}
      />
    );
  };

  let body;
  if (!feed.data) {
    body = <SkeletonCard />;
  } else if (concept.content_status === "failed") {
    const error = concept.generation_error;
    body = (
      <ErrorState
        title={`Couldn't write ${concept.name}`}
        message={error?.message}
        retryable={error?.retryable}
        onRetry={retryGeneration}
        retrying={feed.refreshing}
      />
    );
  } else if (!ready) {
    body = <SkeletonCard message={`Writing ${concept.name}… this usually takes 10–30 seconds the first time.`} />;
  } else {
    body = (
      <CardPager
        index={index}
        count={itemCount}
        onIndexChange={goToPosition}
        onSwipePastEnd={nextTab ? () => openTab(nextTab) : undefined}
        renderItem={renderItem}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 pt-[env(safe-area-inset-top)]">
        {feed.data ? (
          <Link
            to={`/explore/${curriculumId}`}
            className="flex min-h-9 items-center gap-1 px-5 pt-2 text-[12.5px] text-muted"
          >
            <span className="truncate">
              {feed.data.curriculum.title}
              {feed.data.parent ? ` › ${feed.data.parent.name}` : ""}
            </span>
            <ChevronRight size={14} aria-hidden="true" />
          </Link>
        ) : (
          <div className="min-h-9" />
        )}
        <ConceptTabs tabs={tabs} activeNodeId={nodeId} completed={learner?.completed ?? {}} onSelect={openTab} />
      </div>
      <div className="min-h-0 flex-1">{body}</div>
    </div>
  );
}
