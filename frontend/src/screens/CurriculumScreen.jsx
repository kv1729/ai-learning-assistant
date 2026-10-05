import { useParams } from "react-router";
import * as api from "../api/client.js";
import CurriculumTree from "../components/CurriculumTree.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import ScreenHeader from "../components/ScreenHeader.jsx";
import { ErrorState, SkeletonText } from "../components/StatusViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { useLearner } from "../state/learnerContext.js";

export default function CurriculumScreen() {
  const { curriculumId } = useParams();
  const { learner } = useLearner();
  const curriculum = useAsync(() => api.getCurriculum(curriculumId), curriculumId);

  const leaves = curriculum.data?.nodes.filter((n) => n.concept_id) ?? [];
  const done = leaves.filter((n) => learner?.completed[n.concept_id]).length;

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={curriculum.data?.title ?? "Curriculum"} subtitle="Curriculum" fallbackTo="/explore" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {curriculum.status === "loading" ? (
          <div className="p-5">
            <SkeletonText lines={10} />
          </div>
        ) : curriculum.status === "error" ? (
          <ErrorState title="Couldn't load the curriculum" message={curriculum.error.message} retryable onRetry={curriculum.reload} />
        ) : (
          <>
            <div className="px-5 pt-4 pb-2">
              <p className="text-[13px] text-muted">
                {done} of {leaves.length} concepts completed
              </p>
              <div className="mt-2">
                <ProgressBar value={done} max={leaves.length} label="Curriculum progress" />
              </div>
            </div>
            <CurriculumTree curriculum={curriculum.data} learner={learner} />
          </>
        )}
      </div>
    </div>
  );
}
