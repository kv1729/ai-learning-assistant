import { useEffect, useEffectEvent, useRef, useState } from "react";

const SWIPE_THRESHOLD_PX = 60;

// Horizontal pager with touch/mouse swipe and arrow keys.
// `onSwipePastEnd` runs when the user swipes forward on the last item.
export default function CardPager({ index, count, onIndexChange, onSwipePastEnd, renderItem }) {
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef(null); // { x, y, active }
  const suppressClick = useRef(false);

  const goNext = () => (index < count - 1 ? onIndexChange(index + 1) : onSwipePastEnd?.());
  const goPrev = () => index > 0 && onIndexChange(index - 1);

  const onKey = useEffectEvent((event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest?.("input, textarea, select, [contenteditable]")) return;
    if (event.key === "ArrowRight") goNext();
    if (event.key === "ArrowLeft") goPrev();
  });

  useEffect(() => {
    const handler = (event) => onKey(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    gesture.current = { x: event.clientX, y: event.clientY, active: false };
    suppressClick.current = false;
  };

  const onPointerMove = (event) => {
    const g = gesture.current;
    if (!g) return;
    let dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    if (!g.active) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        gesture.current = null; // vertical scroll, not a swipe
        return;
      }
      if (Math.abs(dx) < 10) return;
      g.active = true;
      suppressClick.current = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const atStart = index === 0 && dx > 0;
    const atEnd = index === count - 1 && dx < 0 && !onSwipePastEnd;
    if (atStart || atEnd) dx /= 3; // rubber-band at the edges
    setDrag(dx);
  };

  const endGesture = (commit) => {
    const wasActive = gesture.current?.active;
    gesture.current = null;
    setDragging(false);
    setDrag(0);
    if (!commit || !wasActive) return;
    if (drag < -SWIPE_THRESHOLD_PX) goNext();
    else if (drag > SWIPE_THRESHOLD_PX) goPrev();
  };

  return (
    <div
      className={`h-full touch-pan-y overflow-hidden ${dragging ? "select-none" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => endGesture(true)}
      onPointerCancel={() => endGesture(false)}
      onClickCapture={(event) => {
        if (suppressClick.current) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}
    >
      <div
        className="flex h-full"
        style={{
          transform: `translateX(calc(${-index * 100}% + ${drag}px))`,
          transition: dragging ? "none" : "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="h-full w-full shrink-0" inert={i !== index} aria-hidden={i !== index}>
            {Math.abs(i - index) <= 1 ? renderItem(i) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
