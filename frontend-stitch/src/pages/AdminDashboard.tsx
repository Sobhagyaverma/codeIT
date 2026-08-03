import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  getAllCompetitions,
  getProblems,
  type Competition,
} from "../lib/api";
import type { ProblemPublicDTO } from "../lib/authStorage";
import { useAuth } from "../context/AuthContext";
import AdminCompetitions from "./AdminCompetitions";
import AdminCompetitionStudio from "./AdminCompetitionStudio";
import AdminProblems from "./AdminProblems";
import AdminProblemStudio from "./AdminProblemStudio";

type View =
  | "overview"
  | "problems"
  | "create-problem"
  | "competitions"
  | "create-competition";

function formatContestWhen(c: Competition): string {
  try {
    return new Date(c.startTime).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return c.startTime;
  }
}

function difficultyKey(diff: string): "easy" | "medium" | "hard" {
  const d = (diff || "").trim().toUpperCase();
  if (d === "HARD" || d.startsWith("HARD")) return "hard";
  if (d === "MEDIUM" || d.startsWith("MED")) return "medium";
  return "easy";
}

function statusBadge(status: Competition["status"]): string {
  if (status === "ACTIVE") return "bg-primary text-on-primary";
  if (status === "UPCOMING") return "bg-secondary/20 text-secondary border border-secondary/30";
  return "bg-surface-container-highest text-on-surface-variant";
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState<View>(() => {
    if (location.pathname.startsWith("/admin/competitions/create"))
      return "create-competition";
    if (location.pathname.startsWith("/admin/competitions"))
      return "competitions";
    return "overview";
  });
  const [repoViewMode, setRepoViewMode] = useState<"grid" | "list">("grid");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [allProblems, setAllProblems] = useState<ProblemPublicDTO[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  useEffect(() => {
    if (location.pathname.startsWith("/admin/competitions/create")) {
      setView("create-competition");
    } else if (location.pathname.startsWith("/admin/competitions")) {
      setView("competitions");
    } else if (location.pathname === "/admin") {
      /* keep in-page views for problems/overview unless we want reset */
    }
  }, [location.pathname]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [problems, comps] = await Promise.all([
        getProblems(),
        getAllCompetitions(),
      ]);
      setAllProblems(problems);
      setCompetitions(comps);
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    void loadDashboard();
  }, [user, loadDashboard]);

  const recentProblems = useMemo(
    () =>
      [...allProblems]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5),
    [allProblems]
  );

  const recentCompetitions = useMemo(() => {
    const rank = (s: Competition["status"]) =>
      s === "ACTIVE" ? 0 : s === "UPCOMING" ? 1 : 2;
    return [...competitions]
      .sort((a, b) => {
        const byStatus = rank(a.status) - rank(b.status);
        if (byStatus !== 0) return byStatus;
        return (
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
      })
      .slice(0, 5);
  }, [competitions]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const goView = (next: View) => {
    setView(next);
    setMessage(null);
    setError(null);
    setMobileNavOpen(false);
    if (next === "competitions") navigate("/admin/competitions");
    else if (next === "create-competition")
      navigate("/admin/competitions/create");
    else if (next === "overview" || next === "problems" || next === "create-problem")
      navigate("/admin");
  };

  const navItemClass = (active: boolean) =>
    active
      ? "flex items-center gap-3 border-r-2 border-primary bg-primary-container/10 px-4 py-3 font-bold text-primary transition-colors duration-200"
      : "flex items-center gap-3 px-4 py-3 font-body-md text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-on-surface";

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-outline-variant bg-surface-container px-4 py-6">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="stitch-glow flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container">
          <span
            className="material-symbols-outlined font-bold text-on-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            terminal
          </span>
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile font-bold tracking-tight text-primary">
            CodeIT
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
            Command Center
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <button
          type="button"
          onClick={() => goView("overview")}
          className={`w-full text-left ${navItemClass(view === "overview")}`}
        >
          <span
            className="material-symbols-outlined"
            style={
              view === "overview"
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
            }
          >
            dashboard
          </span>
          <span className="font-body-md text-body-md">Dashboard</span>
        </button>
        <button
          type="button"
          onClick={() => goView("problems")}
          className={`w-full text-left ${navItemClass(view === "problems")}`}
        >
          <span
            className="material-symbols-outlined"
            style={
              view === "problems"
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
            }
          >
            code
          </span>
          <span className="font-body-md text-body-md">Problems</span>
        </button>
        <button
          type="button"
          onClick={() => goView("competitions")}
          className={`w-full text-left ${navItemClass(
            view === "competitions" || view === "create-competition"
          )}`}
        >
          <span
            className="material-symbols-outlined"
            style={
              view === "competitions" || view === "create-competition"
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
            }
          >
            emoji_events
          </span>
          <span className="font-body-md text-body-md">Competitions</span>
        </button>
        <Link
          to="/dsa-sheet"
          className={navItemClass(false)}
          onClick={() => setMobileNavOpen(false)}
        >
          <span className="material-symbols-outlined">list_alt</span>
          <span className="font-body-md text-body-md">DSA Sheet</span>
        </Link>
        <span
          className="flex cursor-not-allowed items-center gap-3 px-4 py-3 font-body-md text-on-surface-variant/40"
          title="Users admin UI not available yet"
        >
          <span className="material-symbols-outlined">group</span>
          <span className="font-body-md text-body-md">Users</span>
        </span>
        <Link
          to="/settings/profile"
          className={navItemClass(false)}
          onClick={() => setMobileNavOpen(false)}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-body-md text-body-md">Settings</span>
        </Link>
      </nav>

      <div className="stitch-glass mt-auto rounded-xl p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-sm font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-on-surface">
              {user.name}
            </p>
            <p className="font-code-sm text-[10px] text-outline">
              Super User
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="font-label-md w-full rounded py-2 text-sm text-on-surface transition-all bg-surface-container-highest hover:bg-error/10 hover:text-error"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );

  const healthRows: { label: string; status: string; tone: "ok" | "warn" | "off" }[] = [
    { label: "API Gateway", status: "UNKNOWN", tone: "off" },
    { label: "Core DB Cluster", status: "UNKNOWN", tone: "off" },
    { label: "Redis Cache", status: "UNKNOWN", tone: "off" },
    { label: "Judge Engine", status: "UNKNOWN", tone: "off" },
    { label: "WebSocket Node", status: "UNKNOWN", tone: "off" },
    { label: "S3 Storage", status: "N/A", tone: "off" },
  ];

  const healthToneClass = (tone: "ok" | "warn" | "off") => {
    if (tone === "ok")
      return "bg-green-500/10 text-green-400 border-green-500/20";
    if (tone === "warn")
      return "bg-primary/10 text-primary border-primary/20";
    return "bg-surface-container-highest text-on-surface-variant border-outline-variant/40";
  };

  return (
    <div className="admin-command-center min-h-screen bg-[#09040D] text-on-surface">
      {/* Desktop sidebar */}
      <div className="fixed left-0 top-0 z-50 hidden h-screen lg:block">
        {sidebar}
      </div>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full shadow-2xl">{sidebar}</div>
        </div>
      )}

      {/* Top bar — switches for Studio Repository */}
      <header className="fixed right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-outline-variant bg-surface-container/80 px-4 shadow-sm backdrop-blur-xl left-0 lg:left-64 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          {view === "problems" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-on-surface-variant">
                Problems
              </span>
              <span className="text-xs text-outline-variant">/</span>
              <span className="text-sm font-semibold text-on-surface">
                Studio Repository
              </span>
            </div>
          ) : view === "competitions" || view === "create-competition" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-on-surface-variant">
                Admin
              </span>
              <span className="material-symbols-outlined text-[16px] text-outline-variant">
                chevron_right
              </span>
              <span className="text-sm font-semibold text-primary">
                Competitions
              </span>
            </div>
          ) : (
            <div className="hidden w-96 items-center rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary md:flex">
              <span className="material-symbols-outlined text-xl text-on-surface-variant">
                search
              </span>
              <input
                className="w-full border-none bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-0"
                placeholder="Search problems, users, or logs..."
                type="search"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = (e.target as HTMLInputElement).value.trim();
                    window.location.href = q
                      ? `/problems?q=${encodeURIComponent(q)}`
                      : "/problems";
                  }
                }}
              />
              <kbd className="font-code-sm rounded bg-surface-container-highest px-1.5 py-0.5 text-[10px] text-on-surface-variant">
                ⌘K
              </kbd>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {view === "problems" && (
            <div className="flex items-center rounded-md border border-outline-variant bg-surface-container-low p-0.5">
              <button
                type="button"
                onClick={() => setRepoViewMode("grid")}
                className={`rounded-md px-2.5 py-1.5 transition-all ${
                  repoViewMode === "grid"
                    ? "bg-[#a855f7]/20 text-[#a855f7]"
                    : "text-outline hover:text-on-surface"
                }`}
                aria-label="Grid view"
              >
                <span className="material-symbols-outlined text-[18px]">
                  grid_view
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRepoViewMode("list")}
                className={`rounded-md px-2.5 py-1.5 transition-all ${
                  repoViewMode === "list"
                    ? "bg-[#a855f7]/20 text-[#a855f7]"
                    : "text-outline hover:text-on-surface"
                }`}
                aria-label="List view"
              >
                <span className="material-symbols-outlined text-[18px]">
                  list
                </span>
              </button>
            </div>
          )}
          {view === "problems" ? null : view === "competitions" ||
            view === "create-competition" ? (
            view === "competitions" ? (
              <button
                type="button"
                onClick={() => goView("create-competition")}
                className="stitch-glow flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-label-md text-on-primary transition-all hover:brightness-110 active:scale-95 sm:px-4"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span className="hidden sm:inline">Create Competition</span>
              </button>
            ) : null
          ) : (
            <button
              type="button"
              onClick={() => goView("create-problem")}
              className="stitch-glow flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-label-md text-on-primary transition-all hover:brightness-110 active:scale-95 sm:px-4"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span className="hidden sm:inline">Create Problem</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              title="Notifications coming soon"
              className="relative flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full text-on-surface-variant/50"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <Link
              to="/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-all hover:bg-surface-container-highest"
              aria-label="Profile"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-screen px-4 pb-12 pt-24 lg:ml-64 lg:px-6">
        {(message || error) && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-error/40 bg-error/10 text-error"
                : "border-secondary/40 bg-secondary/10 text-secondary"
            }`}
          >
            {error ?? message}
          </div>
        )}

        {view === "overview" && (
          <>
            <section className="relative mb-10 overflow-hidden rounded-3xl border border-outline-variant/30 bg-gradient-to-br from-surface-container to-background p-8">
              <div className="relative z-10">
                <h2 className="font-headline-xl mb-2 text-[32px] font-bold leading-10 tracking-tight text-on-surface md:text-[48px] md:leading-[56px]">
                  Content Studio
                </h2>
                <p className="font-body-lg max-w-2xl text-on-surface-variant md:text-[18px] md:leading-7">
                  Manage the pulse of the CodeIT developer ecosystem. Monitor
                  ingestion rates, judge queue health, and content pipelines in
                  real-time.
                </p>
              </div>
            </section>

            {loading ? (
              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="stitch-glass h-28 animate-pulse rounded-2xl"
                  />
                ))}
              </div>
            ) : loadError ? (
              <div className="stitch-glass rounded-2xl border border-error/30 p-6">
                <p className="mb-3 text-sm text-error">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  className="rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary hover:bg-primary/10"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {/* KPI Grid — Stitch 6-up */}
                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <div className="stitch-glass flex flex-col justify-between rounded-2xl p-5">
                    <span className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                      Total Problems
                    </span>
                    <div className="mt-4 flex items-end justify-between">
                      <span className="font-headline-lg text-3xl text-primary">
                        {allProblems.length.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="stitch-glass flex flex-col justify-between rounded-2xl p-5">
                    <span className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                      Total Competitions
                    </span>
                    <div className="mt-4 flex items-end justify-between">
                      <span className="font-headline-lg text-3xl text-secondary">
                        {competitions.length.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="stitch-glass flex flex-col justify-between rounded-2xl p-5">
                    <span className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                      Draft Problems
                    </span>
                    <div className="mt-4 flex items-end justify-between">
                      <span className="font-headline-lg text-3xl text-on-surface">
                        —
                      </span>
                    </div>
                  </div>
                  <div className="stitch-glass flex flex-col justify-between rounded-2xl p-5">
                    <span className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                      Published Today
                    </span>
                    <div className="mt-4 flex items-end justify-between">
                      <span className="font-headline-lg text-3xl text-primary">
                        —
                      </span>
                    </div>
                  </div>
                  <div className="stitch-glass flex flex-col justify-between rounded-2xl border-primary/20 p-5">
                    <span className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                      Active Users
                    </span>
                    <div className="mt-4 flex items-end justify-between">
                      <span className="font-headline-lg text-3xl text-primary">
                        —
                      </span>
                    </div>
                  </div>
                  <div className="stitch-glass flex flex-col justify-between rounded-2xl p-5">
                    <span className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                      Judge Queue
                    </span>
                    <div className="mt-4 flex items-end justify-between">
                      <span className="font-headline-lg text-3xl text-on-surface">
                        —
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                  {/* Left: Quick Actions + Health */}
                  <div className="space-y-8 lg:col-span-3">
                    <section>
                      <h3 className="font-label-md mb-4 flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-lg">
                          bolt
                        </span>
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {(
                          [
                            {
                              key: "create-problem",
                              label: "Create Problem",
                              icon: "post_add",
                              iconWrap:
                                "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary",
                              onClick: () => goView("create-problem"),
                            },
                            {
                              key: "create-competition",
                              label: "Create Competition",
                              icon: "trophy",
                              iconWrap:
                                "bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-on-secondary",
                              onClick: () => goView("create-competition"),
                            },
                          ] as const
                        ).map((a) => (
                          <button
                            key={a.key}
                            type="button"
                            onClick={a.onClick}
                            className="stitch-glass group flex items-center justify-between p-4 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded transition-all ${a.iconWrap}`}
                              >
                                <span className="material-symbols-outlined">
                                  {a.icon}
                                </span>
                              </div>
                              <span className="font-label-md text-sm">
                                {a.label}
                              </span>
                            </div>
                            <span className="material-symbols-outlined text-on-surface-variant transition-transform group-hover:translate-x-1">
                              chevron_right
                            </span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => goView("problems")}
                          className="stitch-glass group flex items-center justify-between p-4 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-on-surface-variant/10 text-on-surface-variant transition-all group-hover:bg-on-surface group-hover:text-background">
                              <span className="material-symbols-outlined">
                                settings_suggest
                              </span>
                            </div>
                            <span className="font-label-md text-sm">
                              Manage Problems
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-on-surface-variant transition-transform group-hover:translate-x-1">
                            chevron_right
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => goView("competitions")}
                          className="stitch-glass group flex items-center justify-between p-4 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-on-surface-variant/10 text-on-surface-variant transition-all group-hover:bg-on-surface group-hover:text-background">
                              <span className="material-symbols-outlined">
                                visibility
                              </span>
                            </div>
                            <span className="font-label-md text-sm">
                              View Competitions
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-on-surface-variant transition-transform group-hover:translate-x-1">
                            chevron_right
                          </span>
                        </button>
                        {(
                          [
                            {
                              to: "/dsa-sheet",
                              label: "DSA Sheet Editor",
                              icon: "reorder",
                              iconWrap:
                                "bg-primary-container/20 text-primary group-hover:bg-primary-container group-hover:text-on-primary-container",
                            },
                          ] as const
                        ).map((a) => (
                          <Link
                            key={a.to}
                            to={a.to}
                            className="stitch-glass group flex items-center justify-between p-4 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded transition-all ${a.iconWrap}`}
                              >
                                <span className="material-symbols-outlined">
                                  {a.icon}
                                </span>
                              </div>
                              <span className="font-label-md text-sm">
                                {a.label}
                              </span>
                            </div>
                            <span className="material-symbols-outlined text-on-surface-variant transition-transform group-hover:translate-x-1">
                              chevron_right
                            </span>
                          </Link>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-label-md mb-4 flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-lg">
                          dns
                        </span>
                        Platform Health
                      </h3>
                      <div className="stitch-glass space-y-4 rounded-2xl p-6">
                        {healthRows.map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between"
                          >
                            <span className="font-code-sm text-sm text-on-surface-variant">
                              {row.label}
                            </span>
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-bold ${healthToneClass(row.tone)}`}
                            >
                              {row.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Middle: Activity + Recent Problems */}
                  <div className="space-y-8 lg:col-span-5">
                    <section>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-label-md flex items-center gap-2 text-on-surface-variant">
                          <span className="material-symbols-outlined text-lg">
                            history
                          </span>
                          Recent Activity
                        </h3>
                      </div>
                      <div className="stitch-glass relative rounded-2xl p-6">
                        <div className="absolute bottom-8 left-9 top-8 w-px bg-outline-variant/30" />
                        <div className="relative space-y-6 py-2 pl-1">
                          <p className="text-sm text-on-surface-variant">
                            No activity yet.
                          </p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-label-md flex items-center gap-2 text-on-surface-variant">
                          <span className="material-symbols-outlined text-lg">
                            inventory_2
                          </span>
                          Recent Problems
                        </h3>
                        <Link
                          to="/problems"
                          onClick={(e) => {
                            e.preventDefault();
                            goView("problems");
                          }}
                          className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface"
                        >
                          View all
                          <span className="material-symbols-outlined text-sm">
                            chevron_right
                          </span>
                        </Link>
                      </div>
                      {recentProblems.length === 0 ? (
                        <div className="stitch-glass rounded-2xl p-6 text-sm text-on-surface-variant">
                          No problems yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentProblems.map((p) => (
                            <Link
                              key={p.id}
                              to={`/problems/${p.id}`}
                              className={`problem-row flex items-center justify-between rounded-xl p-4 diff-${difficultyKey(p.difficulty)}`}
                            >
                              <div>
                                <h4 className="text-sm font-bold">{p.title}</h4>
                                <div className="mt-1 flex items-center gap-3">
                                  <span
                                    className={`diff-badge diff-${difficultyKey(p.difficulty)}`}
                                  >
                                    {p.difficulty}
                                  </span>
                                  <span className="font-code-sm text-[10px] text-on-surface-variant">
                                    Problem ID: #{p.id}
                                  </span>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-sm text-on-surface-variant">
                                more_vert
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>

                  {/* Right: Drafts + Competitions */}
                  <div className="space-y-8 lg:col-span-4">
                    <section>
                      <h3 className="font-label-md mb-4 flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-lg">
                          drafts
                        </span>
                        Draft Problems
                      </h3>
                      <div className="stitch-glass rounded-2xl p-5">
                        <p className="text-sm text-on-surface-variant">
                          No drafts.
                        </p>
                      </div>
                    </section>

                    <section>
                      <h3 className="font-label-md mb-4 flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-lg">
                          event_available
                        </span>
                        Recent Competitions
                      </h3>
                      {recentCompetitions.length === 0 ? (
                        <div className="stitch-glass rounded-2xl p-6 text-sm text-on-surface-variant">
                          No competitions yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentCompetitions.map((c, idx) =>
                            idx === 0 ? (
                              <Link
                                key={c.id}
                                to={`/competitions/${c.id}`}
                                className="stitch-glass group block overflow-hidden"
                              >
                                <div className="relative h-24 w-full overflow-hidden bg-surface-container-highest">
                                  <div className="h-full w-full bg-gradient-to-br from-primary/30 via-surface-container-highest to-secondary/20 opacity-80 transition-transform duration-500 group-hover:scale-105" />
                                  <div
                                    className={`absolute right-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold ${statusBadge(c.status)}`}
                                  >
                                    {c.status}
                                  </div>
                                </div>
                                <div className="p-4">
                                  <h4 className="text-sm font-bold">
                                    {c.title ?? c.name ?? `Contest #${c.id}`}
                                  </h4>
                                  <div className="mt-3 flex items-center justify-between">
                                    <span className="font-code-sm text-[10px] text-on-surface-variant">
                                      {typeof c.participantCount === "number"
                                        ? `${c.participantCount} participants`
                                        : "—"}
                                    </span>
                                    <span className="font-code-sm text-[10px] text-on-surface-variant">
                                      {formatContestWhen(c)}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            ) : (
                              <Link
                                key={c.id}
                                to={`/competitions/${c.id}`}
                                className="stitch-glass flex items-center gap-4 p-4"
                              >
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant">
                                  <span className="material-symbols-outlined">
                                    data_object
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="truncate text-sm font-bold">
                                    {c.title ?? c.name ?? `Contest #${c.id}`}
                                  </h4>
                                  <p className="mt-0.5 text-[10px] text-on-surface-variant">
                                    {c.status}
                                    {typeof c.participantCount === "number"
                                      ? ` · ${c.participantCount} Participants`
                                      : ""}
                                  </p>
                                </div>
                                <span className="material-symbols-outlined text-sm text-on-surface-variant">
                                  open_in_new
                                </span>
                              </Link>
                            )
                          )}
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </>
            )}

            <div className="pointer-events-none fixed bottom-0 right-0 select-none p-12 opacity-5">
              <span className="material-symbols-outlined text-[200px] text-primary">
                terminal
              </span>
            </div>
          </>
        )}

        {view === "problems" && (
          <AdminProblems
            onCreateProblem={() => goView("create-problem")}
            viewMode={repoViewMode}
          />
        )}

        {view === "create-problem" && (
          <AdminProblemStudio
            onBack={() => goView("problems")}
            onPublished={() => {
              void loadDashboard().then(() => {
                setMessage("Problem published successfully.");
                goView("problems");
              });
            }}
          />
        )}

        {view === "competitions" && (
          <AdminCompetitions
            onCreate={() => goView("create-competition")}
          />
        )}

        {view === "create-competition" && (
          <AdminCompetitionStudio
            onBack={() => goView("competitions")}
            onPublished={() => {
              void loadDashboard().then(() => {
                setMessage("Competition published successfully.");
                goView("competitions");
              });
            }}
          />
        )}

      </main>
    </div>
  );
}
