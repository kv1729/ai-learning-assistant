import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { iconButton } from "../lib/ui.js";

// Top bar for pushed screens. Back returns to the previous screen, or to
// `fallbackTo` when the page was opened directly (no in-app history).
export default function ScreenHeader({ title, subtitle, fallbackTo, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate(fallbackTo, { replace: true });
  };

  return (
    <header className="flex shrink-0 items-center gap-1 border-b border-line px-1 pt-[env(safe-area-inset-top)]">
      <button type="button" onClick={goBack} aria-label="Back" className={iconButton}>
        <ArrowLeft size={22} aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1 py-2">
        {subtitle ? <p className="truncate text-[12.5px] text-muted">{subtitle}</p> : null}
        <h1 className="truncate text-[16px] font-semibold">{title}</h1>
      </div>
      {children}
    </header>
  );
}
