import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useRegistration } from "../context/RegistrationContext";

const NAV_LINKS = [
  { to: "/dsa-sheet", label: "DSA Sheet" },
  { to: "/problems", label: "Problems" },
  { to: "/coderoom", label: "CodeRoom" },
  { to: "/competitions", label: "Competitions" },
  { to: "/competitions/quick", label: "Quick Clash" },
  { to: "/friends", label: "Friends" },
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
  const { unreadCount } = useNotifications();
  const { config } = useRegistration();
  const location = useLocation();
  const privateBeta = config.privateBeta;

  const isActivePath = (to: string) => {
    if (activeHint && to === activeHint) return true;
    if (to === "/problems") {
      return (
        location.pathname === "/problems" ||
        location.pathname.startsWith("/problems/")
      );
    }
    if (to === "/competitions") {
      return (
        location.pathname === "/competitions" ||
        (location.pathname.startsWith("/competitions/") &&
          !location.pathname.startsWith("/competitions/quick"))
      );
    }
    if (to === "/competitions/quick") {
      return location.pathname.startsWith("/competitions/quick");
    }
    if (to === "/coderoom") {
      return (
        location.pathname === "/coderoom" ||
        location.pathname.startsWith("/coderoom/")
      );
    }
    if (to === "/friends") {
      return (
        location.pathname === "/friends" ||
        location.pathname.startsWith("/friends/")
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
        {privateBeta && (
          <span className="hidden rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-code-sm text-[10px] font-bold tracking-wider text-primary uppercase sm:inline">
            Private Beta
          </span>
        )}
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
              to="/inbox"
              title={
                unreadCount > 0 ? `Inbox — ${unreadCount} unread` : "Inbox"
              }
              aria-label={
                unreadCount > 0 ? `Inbox, ${unreadCount} unread` : "Inbox"
              }
              className={`relative inline-flex items-center justify-center rounded-DEFAULT border p-2 transition-colors ${
                location.pathname === "/inbox"
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary"
              }`}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={
                  unreadCount > 0
                    ? { fontVariationSettings: '"FILL" 1' }
                    : undefined
                }
              >
                notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-code-sm text-[10px] font-bold text-on-primary shadow-[0_0_8px_rgba(221,183,255,0.8)]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            {user.role === "ADMIN" && (
              <Link
                to="/admin"
                title="Admin Panel"
                aria-label="Admin Panel"
                className={`inline-flex items-center gap-1.5 rounded-DEFAULT border px-2.5 py-2 font-label-md text-label-md transition-colors sm:px-3 ${
                  location.pathname === "/admin" ||
                  location.pathname.startsWith("/admin/")
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  admin_panel_settings
                </span>
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <Link
              to="/profile"
              className="flex cursor-pointer items-center gap-3 rounded-full border border-outline-variant bg-surface-container-low px-2 py-1 transition-colors hover:bg-white/5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-label-md text-sm font-bold text-primary">
                {user.name
                  .split(" ")
                  .map((p: string) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="mono mr-2 hidden text-xs text-white sm:inline">
                @{user.uniqueUserId}
              </span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="font-label-md text-label-md rounded-DEFAULT border border-outline-variant/40 px-4 py-2 text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Log out
            </button>
            <Link
              to="/settings/profile"
              title="Edit profile"
              aria-label="Edit profile"
              className={`inline-flex items-center justify-center rounded-DEFAULT border p-2 font-label-md text-label-md transition-colors ${
                location.pathname.startsWith("/settings")
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-lg">settings</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="glow-hover font-label-md text-label-md rounded-DEFAULT border border-primary/50 px-4 py-2 text-primary transition-colors hover:bg-primary/10"
            >
              Login
            </Link>
            {privateBeta ? (
              <Link
                to="/request-access"
                className="font-label-md text-label-md rounded-DEFAULT bg-primary px-4 py-2 text-on-primary shadow-[0_0_10px_rgba(221,183,255,0.3)] transition-colors hover:bg-primary-fixed"
              >
                Request Beta Access
              </Link>
            ) : (
              <Link
                to="/register"
                className="font-label-md text-label-md rounded-DEFAULT bg-primary px-4 py-2 text-on-primary shadow-[0_0_10px_rgba(221,183,255,0.3)] transition-colors hover:bg-primary-fixed"
              >
                Register
              </Link>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
