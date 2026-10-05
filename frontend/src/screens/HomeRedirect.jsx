import { Navigate } from "react-router";
import * as api from "../api/client.js";
import { ErrorState, SkeletonCard } from "../components/StatusViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { feedPath } from "../lib/learning.js";

// Home opens where the learner left off, or at the first concept with content.
export default function HomeRedirect() {
  const resume = useAsync(() => api.getResumePosition(), "resume");
  if (resume.status === "error") {
    return <ErrorState title="Couldn't load your feed" message={resume.error.message} retryable onRetry={resume.reload} />;
  }
  if (resume.status === "success" && !resume.data) {
    return <ErrorState title="Nothing to learn yet" message="No curricula exist yet. Open Explore to start one." />;
  }
  if (resume.data) return <Navigate to={feedPath(resume.data.node_id, resume.data.card_position)} replace />;
  return <SkeletonCard />;
}
