import { ChevronDown, ChevronRight, Circle, CircleCheck, CircleDashed } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { feedPath, nextPositionFor } from "../lib/learning.js";

function LeafStatus({ learner, conceptId }) {
  if (learner?.completed[conceptId]) return <CircleCheck size={18} className="text-success" aria-label="Completed" />;
  if (learner?.seen[conceptId]?.length) return <CircleDashed size={18} className="text-accent" aria-label="In progress" />;
  return <Circle size={18} className="text-muted" aria-label="Not started" />;
}

// Collapsible curriculum tree. Leaves link to the concept's feed.
export default function CurriculumTree({ curriculum, learner }) {
  const children = (parentId) =>
    curriculum.nodes.filter((n) => n.parent_id === parentId).sort((a, b) => a.position - b.position);
  const [collapsed, setCollapsed] = useState(() => new Set());

  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderNode = (node) => {
    const indent = { paddingLeft: `${(node.depth - 1) * 16 + 12}px` };

    if (node.concept_id) {
      return (
        <li key={node.id}>
          <Link
            to={feedPath(node.id, nextPositionFor(learner, node.concept_id))}
            style={indent}
            className="flex min-h-12 items-center gap-3 pr-3 active:bg-surface-2"
          >
            <LeafStatus learner={learner} conceptId={node.concept_id} />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px]">{node.name}</span>
              <span className="block truncate text-[13px] text-muted">{node.description}</span>
            </span>
            <ChevronRight size={18} className="text-muted" aria-hidden="true" />
          </Link>
        </li>
      );
    }

    const open = !collapsed.has(node.id);
    return (
      <li key={node.id}>
        <button
          type="button"
          onClick={() => toggle(node.id)}
          aria-expanded={open}
          style={indent}
          className="flex min-h-11 w-full items-center gap-2 pr-3 text-left text-[15px] font-semibold"
        >
          {open ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
          {node.name}
        </button>
        {open ? <ul>{children(node.id).map(renderNode)}</ul> : null}
      </li>
    );
  };

  return <ul className="py-2">{children(curriculum.root_node_id).map(renderNode)}</ul>;
}
