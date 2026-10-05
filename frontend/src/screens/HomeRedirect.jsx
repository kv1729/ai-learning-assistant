import { Navigate } from "react-router";
import * as api from "../api/client.js";
import { SkeletonCard } from "../components/StatusViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { feedPath } from "../lib/learning.js";

// Home opens where the learner left off, or at the first concept.
export default function HomeRedirect() {
  const resume = useAsync(() => api.getResumePosition(), "resume");
  if (resume.data) return <Navigate to={feedPath(resume.data.node_id, resume.data.card_position)} replace />;
  return <SkeletonCard />;
}
