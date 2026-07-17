import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/login");
  }

  const initial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <header className="border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          CodeIT
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/problems" className="text-[var(--text-dim)] hover:text-[var(--text)]">
            Problems
          </Link>

          <Link to="/competitions" className="text-[var(--text-dim)] hover:text-[var(--text)]">
            Competitions
          </Link>

          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>

          {!user ? (
            <>
              <Link to="/login" className="text-[var(--text-dim)] hover:text-[var(--text)]">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#0a0d12] hover:brightness-110"
              >
                Register
              </Link>
            </>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2 hover:border-[var(--accent)]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-[#0a0d12]">
                  {initial}
                </div>
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-[var(--text-dim)]">{user.role}</div>
                </div>
                <span className="text-xs text-[var(--text-dim)]">▼</span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-2 shadow-xl z-50">
                  <div className="border-b border-[var(--line)] px-3 py-3">
                    <div className="text-sm font-semibold">{user.name}</div>
                    <div className="text-xs text-[var(--text-dim)]">@{user.uniqueUserId}</div>
                    <div className="text-xs text-[var(--text-dim)]">{user.email}</div>
                    <div className="mt-1 text-xs text-[var(--accent)]">{user.role}</div>
                  </div>

                  <div className="py-2">
                    <Link
                      to="/submissions"
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-[var(--text-dim)] hover:bg-[var(--bg-inset)] hover:text-[var(--text)]"
                    >
                      Submission History
                    </Link>

                    {user.role === "ADMIN" && (
                      <Link
                        to="/admin"
                        onClick={() => setOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm text-[var(--text-dim)] hover:bg-[var(--bg-inset)] hover:text-[var(--text)]"
                      >
                        Admin Panel
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-[var(--line)] pt-2">
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--bg-inset)]"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}