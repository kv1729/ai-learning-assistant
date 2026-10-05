import { CloudOff, RotateCw } from "lucide-react";
import { buttonSecondary } from "../lib/ui.js";

// Card-shaped placeholder shown while content loads or is being generated.
export function SkeletonCard({ message }) {
  return (
    <div className="flex h-full flex-col" aria-busy="true">
      <div className="skeleton h-[27%] min-h-32 shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col gap-3 px-5 pt-5">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-6 w-4/5" />
        <div className="skeleton mt-2 h-4 w-full" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-4 w-3/4" />
        {message ? (
          <p role="status" className="mt-4 text-center text-[14px] text-muted">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// Lines of placeholder text for long-form content.
export function SkeletonText({ lines = 8, message }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {message ? (
        <p role="status" className="text-[14px] text-muted">
          {message}
        </p>
      ) : null}
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={`skeleton h-4 ${i % 4 === 3 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, retryable, onRetry, retrying = false }) {
  return (
    <div role="alert" className="flex h-full flex-col items-center justify-center gap-4 px-8 py-10 text-center">
      <CloudOff size={40} strokeWidth={1.5} className="text-muted" aria-hidden="true" />
      <div>
        <h2 className="text-[18px] font-semibold">{title}</h2>
        {message ? <p className="mt-2 text-[15px] leading-relaxed text-muted">{message}</p> : null}
      </div>
      {retryable && onRetry ? (
        <button type="button" onClick={onRetry} disabled={retrying} className={buttonSecondary}>
          <RotateCw size={16} className={retrying ? "animate-spin" : ""} aria-hidden="true" />
          {retrying ? "Retrying…" : "Try again"}
        </button>
      ) : null}
    </div>
  );
}
