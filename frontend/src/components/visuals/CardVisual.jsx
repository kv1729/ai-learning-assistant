import Formula from "./Formula.jsx";
import MermaidDiagram from "./MermaidDiagram.jsx";
import VisualIcon from "./VisualIcon.jsx";

// Renders a card's visual spec. Any rendering failure falls back to an icon,
// so a bad formula or diagram never breaks the card.
export default function CardVisual({ visual, size = "card" }) {
  const fallback = <VisualIcon name="sparkles" size={size === "card" ? 64 : 80} />;
  if (!visual) return fallback;

  let content = fallback;
  if (visual.type === "formula") content = <Formula tex={visual.content} fallback={fallback} />;
  else if (visual.type === "mermaid") content = <MermaidDiagram code={visual.content} fallback={fallback} />;
  else if (visual.type === "icon") content = <VisualIcon name={visual.content} size={size === "card" ? 64 : 80} />;

  return (
    <figure className="m-0 flex h-full w-full flex-col items-center justify-center gap-2">
      <div role="img" aria-label={visual.alt_text} className="flex min-h-0 w-full flex-1 items-center justify-center">
        {content}
      </div>
      {size === "detail" && visual.caption ? (
        <figcaption className="text-center text-[13px] text-muted">{visual.caption}</figcaption>
      ) : null}
    </figure>
  );
}
