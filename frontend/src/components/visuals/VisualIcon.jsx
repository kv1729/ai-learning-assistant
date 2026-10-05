import { Brain, CircleDot, GitFork, Percent, Sigma, Sparkles, Split, Target, TriangleAlert, Users } from "lucide-react";

// Icon names the content generator may use. Unknown names fall back to Sparkles.
const ICONS = {
  brain: Brain,
  "circle-dot": CircleDot,
  "git-fork": GitFork,
  percent: Percent,
  sigma: Sigma,
  sparkles: Sparkles,
  split: Split,
  target: Target,
  "triangle-alert": TriangleAlert,
  users: Users,
};

export default function VisualIcon({ name, size = 64 }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.25} className="text-accent" />;
}
