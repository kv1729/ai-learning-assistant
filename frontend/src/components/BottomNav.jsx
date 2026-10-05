import { Compass, House, User } from "lucide-react";
import { Link, useLocation } from "react-router";

const ITEMS = [
  { to: "/explore", label: "Explore", Icon: Compass, match: (path) => path.startsWith("/explore") },
  { to: "/", label: "Home", Icon: House, match: (path) => path === "/" || path.startsWith("/learn") },
  { to: "/profile", label: "Profile", Icon: User, match: (path) => path.startsWith("/profile") },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Main" className="shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-3">
        {ITEMS.map(({ to, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11.5px] font-medium ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
