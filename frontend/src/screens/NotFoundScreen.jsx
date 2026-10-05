import { Link, useRouteError } from "react-router";
import { buttonSecondary } from "../lib/ui.js";

export default function NotFoundScreen() {
  const error = useRouteError();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <h1 className="text-[20px] font-semibold">{error ? "Something went wrong" : "Page not found"}</h1>
      <p className="text-[15px] text-muted">
        {error ? "An unexpected error occurred on this screen." : "This page does not exist."}
      </p>
      <Link to="/" className={buttonSecondary}>
        Go to Home
      </Link>
    </div>
  );
}
