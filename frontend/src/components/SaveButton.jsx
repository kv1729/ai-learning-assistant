import { Bookmark } from "lucide-react";

// Bookmark ribbon: outlined when not saved, filled red when saved.
export default function SaveButton({ saved, onToggle, className = "" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save card"}
      className={`inline-flex size-11 items-center justify-center ${className}`}
    >
      <Bookmark
        size={28}
        strokeWidth={1.75}
        className={saved ? "fill-saved text-saved" : "fill-transparent text-fg"}
        aria-hidden="true"
      />
    </button>
  );
}
