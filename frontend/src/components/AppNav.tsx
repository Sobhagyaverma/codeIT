import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useRegistration } from "../context/RegistrationContext";
import BrandMark from "./BrandMark";

const NAV_LINKS = [
  { to: "/problems", label: "Problems" },
  { to: "/dsa-sheet", label: "DSA Sheet" },
  { to: "/coderoom", label: "CodeRoom" },
  { to: "/competitions", label: "Competitions" },
  { to: "/competitions/quick", label: "Quick Clash" },
] as const;

type AppNavProps = {
  /** Force a nav item active (e.g. workspace under Problems). */
  activeHint?: string;
  workspaceActions?: ReactNode;
};

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Shared top nav for catalog-style Stitch screens. */
export default function AppNav({ activeHint, workspaceActions }: AppNavProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { config } = useRegistration();
  const location = useLocation();
  const navigate = useNavigate();
  const privateBeta = config.privateBeta;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

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
    return location.pathname === to;
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const menuItemClass =
    "flex w-full items-center gap-3 px-3 py-2 text-left font-label-md text-sm text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface";

  return (
    <nav className="fixed top-0 z-50 flex h-14 w-full items-center justify-between border-b border-outline-variant/25 bg-surface/70 px-4 backdrop-blur-xl sm:h-16 sm:px-margin-desktop">
      <div className="flex min-w-0 items-center gap-4 sm:gap-6">
        <Link
          to="/"
          className="font-headline-lg text-headline-lg flex shrink-0 items-center gap-2 font-bold tracking-tighter text-primary"
        >
          <span className="material-symbols-outlined text-2xl sm:text-3xl">
            terminal
          </span>
          <BrandMark />
        </Link>
        {privateBeta && (
          <span className="hidden rounded border border-primary/35 bg-primary/10 px-2 py-0.5 font-code-sm text-[10px] font-bold tracking-wider text-primary uppercase lg:inline">
            Beta
          </span>
        )}
        <div className="ml-1 hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={() =>
                isActivePath(link.to)
                  ? "rounded-md px-3 py-1.5 font-label-md text-sm font-medium text-primary"
                  : "rounded-md px-3 py-1.5 font-label-md text-sm text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
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
              className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                location.pathname === "/inbox"
                  ? "bg-primary/15 text-primary"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={
                  unreadCount > 0
                    ? { fontVariationSettings: '"FILL" 1' }
                    : undefined
                }
              >
                notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-1 font-code-sm text-[9px] font-bold text-on-primary">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                title={`@${user.uniqueUserId}`}
                onClick={() => setMenuOpen((open) => !open)}
                className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-2 transition-all ${
                  menuOpen
                    ? "ring-primary"
                    : "ring-transparent hover:ring-outline-variant"
                }`}
              >
                <span className="flex h-full w-full items-center justify-center bg-primary/25 font-label-md text-xs font-bold text-primary">
                  {initialsFor(user.name)}
                </span>
              </button>

              {menuOpen && (
                <div
                  id={menuId}
                  role="menu"
                  aria-label="Account menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-high shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
                >
                  <Link
                    to="/profile"
                    role="menuitem"
                    className="block border-b border-outline-variant/30 px-3 py-3 transition-colors hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    <p className="truncate font-label-md text-sm font-medium text-on-surface">
                      {user.name}
                    </p>
                    <p className="mono mt-0.5 truncate text-xs text-on-surface-variant">
                      @{user.uniqueUserId}
                    </p>
                  </Link>

                  <div className="py-1.5">
                    <Link
                      to="/friends"
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        group
                      </span>
                      Friends
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          admin_panel_settings
                        </span>
                        Admin panel
                      </Link>
                    )}
                    <Link
                      to="/settings/profile"
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        settings
                      </span>
                      Settings
                    </Link>
                  </div>

                  <div className="border-t border-outline-variant/30 py-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      className={`${menuItemClass} text-error hover:text-error`}
                      onClick={handleLogout}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        logout
                      </span>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="font-label-md rounded-lg px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Login
            </Link>
            {privateBeta ? (
              <Link
                to="/request-access"
                className="font-label-md rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed"
              >
                Request access
              </Link>
            ) : (
              <Link
                to="/register"
                className="font-label-md rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed"
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
