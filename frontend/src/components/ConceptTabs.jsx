import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

// Sibling concepts as a scrollable tab strip; the active tab stays in view.
export default function ConceptTabs({ tabs, activeNodeId, completed, onSelect }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeNodeId, tabs]);

  return (
    <nav aria-label="Concepts" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-3">
      {tabs.map((tab) => {
        const active = tab.node_id === activeNodeId;
        return (
          <button
            key={tab.node_id}
            ref={active ? activeRef : null}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect(tab)}
            className={`-mb-px inline-flex min-h-11 shrink-0 items-center gap-1 border-b-2 px-2.5 text-[15px] whitespace-nowrap ${
              active ? "border-accent font-semibold text-fg" : "border-transparent text-muted"
            }`}
          >
            {tab.name}
            {completed[tab.concept_id] ? (
              <Check size={14} className="text-success" aria-label="completed" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
