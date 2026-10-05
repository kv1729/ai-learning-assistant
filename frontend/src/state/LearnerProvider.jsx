import { useEffect, useMemo, useState } from "react";
import * as api from "../api/client.js";
import { LearnerContext } from "./learnerContext.js";

// Holds the learner's saves, quiz attempts and progress. Every change goes
// through the API layer, which returns the new snapshot. Actions are stable
// so screens can use them in effect dependencies.
export default function LearnerProvider({ children }) {
  const [learner, setLearner] = useState(null);

  useEffect(() => {
    api.getLearnerState().then(setLearner);
  }, []);

  const actions = useMemo(
    () => ({
      toggleSave: async (cardId) => setLearner(await api.toggleSave(cardId)),
      recordQuizAttempt: async (cardId, selectedIndex) => {
        const result = await api.recordQuizAttempt(cardId, selectedIndex);
        setLearner(result.learner);
        return result;
      },
      markCardSeen: async (conceptId, position) => setLearner(await api.markCardSeen(conceptId, position)),
      markConceptCompleted: async (conceptId) => setLearner(await api.markConceptCompleted(conceptId)),
      setResumePosition: async (curriculumId, nodeId, position) =>
        setLearner(await api.setResumePosition(curriculumId, nodeId, position)),
    }),
    [],
  );

  const value = useMemo(() => ({ learner, ...actions }), [learner, actions]);

  return <LearnerContext value={value}>{children}</LearnerContext>;
}
