import { createContext, useContext } from "react";

export const LearnerContext = createContext(null);

export function useLearner() {
  const value = useContext(LearnerContext);
  if (!value) throw new Error("useLearner must be used inside <LearnerProvider>");
  return value;
}
