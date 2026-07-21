import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/problems", label: "Problems" },
  { to: "/competitions", label: "Competitions" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `group relative px-3 py-2 text-sm font-medium transition-all duration-200 ${
    isActive
      ? "text-[var(--text)]"
      : "text-[var(--text-dim)] hover:-translate-y-0.5 hover:text-[var(--text)]"
  }`;
}

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setAccountOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    setAccountOpen(false);
    setMobileOpen(false);
    navigate("/login");
  }

  const initial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-xl">
      <div className="grid h-14 w-full grid-cols-[1fr_auto] items-center px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-10">
        <Link
          to="/"
          className="group flex w-fit items-center gap-2 justify-self-start transition-transform duration-200 hover:-translate-y-0.5"
          aria-label="CodeIT home"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--accent)]/40 bg-[var(--accent)]/10 font-mono text-xs font-bold text-[var(--accent)] transition duration-200 group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)]/15">
            &lt;/&gt;
          </span>
          <span className="display text-lg font-semibold tracking-tight">
            Code<span className="text-[var(--accent)]">IT</span>
          </span>
        </Link>

        <nav
          className="hidden items-center justify-center gap-1 md:flex"
          aria-label="Primary navigation"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    className={`absolute inset-x-3 -bottom-[6px] h-0.5 origin-left rounded-full bg-[var(--accent)] transition-transform duration-200 ${
                      isActive
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 justify-self-end md:flex">
          {!user ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "text-[var(--text)]"
                      : "text-[var(--text-dim)] hover:text-[var(--text)]"
                  }`
                }
              >
                Log in
              </NavLink>
              <Link
                to="/register"
                className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#0a0d12] shadow-[0_4px_18px_rgba(245,166,35,0.16)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
              >
                Create account
              </Link>
            </>
          ) : (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-transparent bg-[var(--bg-raised)] px-1.5 py-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60 hover:shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-xs font-bold text-[#0a0d12]">
                  {initial}
                </div>
                <div className="text-left">
                  <div className="max-w-32 truncate text-sm font-medium">
                    {user.name}
                  </div>
                  <div className="max-w-32 truncate text-[11px] text-[var(--text-dim)]">
                    @{user.uniqueUserId}
                  </div>
                </div>
                <ChevronDown open={accountOpen} />
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
                >
                  <div className="bg-[var(--bg-inset)]/55 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-base font-bold text-[#0a0d12]">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {user.name}
                        </div>
                        <div className="truncate text-xs text-[var(--text-dim)]">
                          @{user.uniqueUserId}
                        </div>
                      </div>
                      <span className="verdict-strip ml-auto rounded border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-1.5 py-0.5 text-[9px] text-[var(--accent)]">
                        {user.role}
                      </span>
                    </div>
                    <div className="mt-3 truncate text-xs text-[var(--text-dim)]">
                      {user.email}
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/profile"
                      role="menuitem"
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-[var(--text-dim)] transition hover:bg-[var(--bg-inset)] hover:text-[var(--text)]"
                    >
                      View profile
                      <span aria-hidden>→</span>
                    </Link>
                    <Link
                      to="/settings/profile"
                      role="menuitem"
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-[var(--text-dim)] transition hover:bg-[var(--bg-inset)] hover:text-[var(--text)]"
                    >
                      Profile settings
                      <span aria-hidden>→</span>
                    </Link>
                    <Link
                      to="/submissions"
                      role="menuitem"
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-[var(--text-dim)] transition hover:bg-[var(--bg-inset)] hover:text-[var(--text)]"
                    >
                      Submission History
                      <span aria-hidden>→</span>
                    </Link>

                    {user.role === "ADMIN" && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-[var(--text-dim)] transition hover:bg-[var(--bg-inset)] hover:text-[var(--text)]"
                      >
                        Admin Panel
                        <span aria-hidden>→</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-[var(--line)] p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-[var(--err)] transition hover:bg-[var(--err)]/10"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center justify-self-end rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] text-[var(--text)] transition hover:border-[var(--accent)] md:hidden"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          <MenuIcon open={mobileOpen} />
        </button>
      </div>

      {mobileOpen && (
        <nav
          className="border-t border-[var(--line)] bg-[var(--bg)] px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto max-w-7xl space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}

            <div className="my-3 h-px bg-[var(--line)]" />

            {user ? (
              <>
                <div className="mb-2 flex items-center gap-3 rounded-lg bg-[var(--bg-raised)] p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent)] text-sm font-bold text-[#0a0d12]">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{user.name}</div>
                    <div className="truncate text-xs text-[var(--text-dim)]">
                      @{user.uniqueUserId}
                    </div>
                  </div>
                </div>
                <NavLink to="/profile" className={navLinkClass}>
                  Profile
                </NavLink>
                <NavLink to="/settings/profile" className={navLinkClass}>
                  Settings
                </NavLink>
                <NavLink to="/submissions" className={navLinkClass}>
                  Submissions
                </NavLink>
                {user.role === "ADMIN" && (
                  <NavLink to="/admin" className={navLinkClass}>
                    Admin
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-[var(--err)] hover:bg-[var(--err)]/10"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="rounded-md border border-[var(--line)] px-3 py-2.5 text-center text-sm font-medium text-[var(--text)]"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-[var(--accent)] px-3 py-2.5 text-center text-sm font-semibold text-[#0a0d12]"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`text-[var(--text-dim)] transition-transform ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {open ? (
        <path
          d="M6 6l12 12M18 6 6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}