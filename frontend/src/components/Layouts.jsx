import { Outlet } from "react-router";
import BottomNav from "./BottomNav.jsx";

// One mobile-width column: full screen on phones, centred on desktop.
export function RootLayout() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-surface text-fg">
      <Outlet />
    </div>
  );
}

// Top-level destinations share the bottom navigation.
export function NavLayout() {
  return (
    <>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
