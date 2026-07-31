import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/dsa-sheet", label: "DSA Sheet" },
  { to: "/problems", label: "Problems" },
  { to: "/coderoom", label: "CodeRoom" },
  { to: "/competitions", label: "Competitions" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

type AppNavProps = {
  /** Force a nav item active (e.g. workspace under Problems). */
  activeHint?: string;
  workspaceActions?: ReactNode;
};

/** Shared top nav for catalog-style Stitch screens (locked link set). */
export default function AppNav({ activeHint, workspaceActions }: AppNavProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActivePath = (to: string) => {
    if (activeHint && to === activeHint) return true;
    if (to === "/problems") {
      return (
        location.pathname === "/problems" ||
        location.pathname.startsWith("/problems/")
      );
    }
    return location.pathname === to;
  };

  return (
    <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant/20 bg-surface/60 px-margin-desktop shadow-[0_0_15px_rgba(157,80,187,0.1)] backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="font-headline-lg text-headline-lg flex items-center gap-2 font-bold tracking-tighter text-primary"
        >
          <span className="material-symbols-outlined text-3xl">terminal</span>
          CodeIT
        </Link>
        <div className="ml-2 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={() =>
                isActivePath(link.to)
                  ? "flex items-center gap-2 border-b-2 border-primary px-4 py-2 pb-1 font-label-md text-label-md text-primary transition-colors duration-200"
                  : "flex items-center gap-2 px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors duration-200 hover:text-primary"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {workspaceActions}
        {user ? (
          <>
            <Link
              to="/profile"
              className="font-label-md text-label-md flex items-center gap-2 rounded-DEFAULT border border-outline-variant/40 px-3 py-1.5 text-on-surface transition-colors hover:border-primary/40"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {user.name
                  .split(" ")
                  .map((p: string) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="hidden sm:inline">@{user.uniqueUserId}</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="font-label-md text-label-md rounded-DEFAULT border border-outline-variant/40 px-4 py-2 text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="glow-hover font-label-md text-label-md rounded-DEFAULT border border-primary/50 px-4 py-2 text-primary transition-colors hover:bg-primary/10"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="font-label-md text-label-md rounded-DEFAULT bg-primary px-4 py-2 text-on-primary shadow-[0_0_10px_rgba(221,183,255,0.3)] transition-colors hover:bg-primary-fixed"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
