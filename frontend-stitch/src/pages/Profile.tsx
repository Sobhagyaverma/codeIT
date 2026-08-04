import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import {
  ApiError,
  getMyProfile,
  getMyProfileSubmissions,
  getPublicProfile,
  type ProfileContestHistory,
  type ProfileProblemSummary,
  type ProfileResponse,
  type ProfileSubmissionRow,
} from "../lib/api";

type ProfileTab = "overview" | "submissions" | "contests" | "saved";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "submissions", label: "Submissions" },
  { id: "contests", label: "Contests" },
  { id: "saved", label: "Saved" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatJoined(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string | null) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

function heatmapLevel(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function dateKey(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function difficultyClass(d: string) {
  const x = d.toUpperCase();
  if (x === "EASY") return "text-easy";
  if (x === "MEDIUM") return "text-medium";
  if (x === "HARD") return "text-hard";
  return "text-on-surface-variant";
}

function difficultyBadge(d: string) {
  const x = d.toUpperCase();
  if (x === "EASY")
    return "border-[#22c55e]/30 bg-[#22c55e]/10 text-easy";
  if (x === "MEDIUM")
    return "border-[#eab308]/30 bg-[#eab308]/10 text-medium";
  if (x === "HARD")
    return "border-[#ef4444]/30 bg-[#ef4444]/10 text-hard";
  return "border-outline-variant text-on-surface-variant";
}

function verdictStyle(verdict: string) {
  const v = verdict.toUpperCase();
  const ok =
    v === "AC" ||
    v === "ACCEPTED" ||
    v.includes("ACCEPTED") ||
    v === "OK";
  if (ok)
    return {
      label: "Accepted",
      className: "border-easy/20 bg-easy/10 text-easy",
    };
  return {
    label: verdict.replace(/_/g, " "),
    className: "border-hard/20 bg-hard/10 text-hard",
  };
}

function pct(n: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((n / total) * 1000) / 10);
}

function ContributionHeatmap({
  days,
  totalSubmissions,
}: {
  days: Array<{ date: string; count: number }>;
  totalSubmissions: number;
}) {
  const cells = useMemo(() => {
    const counts = new Map(days.map((d) => [d.date, d.count]));
    const today = new Date();
    const end = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    const start = new Date(end.getTime() - 51 * 7 * DAY_MS);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());

    const out: Array<{ key: string; count: number; level: number }> = [];
    for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
      const d = new Date(t);
      const key = dateKey(d);
      const count = counts.get(key) ?? 0;
      out.push({ key, count, level: heatmapLevel(count) });
    }
    return out;
  }, [days]);

  const yearTotal = useMemo(
    () => days.reduce((sum, d) => sum + d.count, 0),
    [days]
  );

  return (
    <div className="glass-panel overflow-x-auto rounded-xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="font-label-md text-label-md text-xs uppercase tracking-widest text-on-surface-variant">
          Contribution Heatmap
        </h3>
        <span className="mono text-xs text-on-surface-variant">
          {yearTotal || totalSubmissions} Submissions in past year
        </span>
      </div>
      <div className="grid min-w-[700px] grid-flow-col grid-rows-7 gap-1.5">
        {cells.map((cell) => (
          <div
            key={cell.key}
            title={`${cell.count} on ${cell.key}`}
            className={`heatmap-cell heatmap-level-${cell.level}`}
          />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-end gap-3 text-xs uppercase tracking-wider text-on-surface-variant">
        <span>Less</span>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`heatmap-cell heatmap-level-${level}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

function ProblemRow({ problem }: { problem: ProfileProblemSummary }) {
  return (
    <Link
      to={`/problems/${problem.id}`}
      className="glass-panel-subtle flex items-center justify-between rounded-lg p-3 transition-colors hover:border-primary/30"
    >
      <span className="truncate text-sm text-white">{problem.title}</span>
      <span
        className={`shrink-0 text-xs font-bold uppercase ${difficultyClass(problem.difficulty)}`}
      >
        {problem.difficulty}
      </span>
    </Link>
  );
}

function SubmissionRow({ row }: { row: ProfileSubmissionRow }) {
  const style = verdictStyle(row.verdict);
  return (
    <div className="glass-panel-subtle flex items-center justify-between rounded-lg p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <Link
          to={`/problems/${row.problemId}`}
          className="truncate text-sm text-white hover:text-primary"
        >
          {row.problemTitle}
        </Link>
        <span className="mono text-[11px] text-on-surface-variant">
          {row.language} • {formatRelative(row.submittedAt)}
        </span>
      </div>
      <span
        className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${style.className}`}
      >
        {style.label}
      </span>
    </div>
  );
}

function ContestRow({ row }: { row: ProfileContestHistory }) {
  return (
    <div className="glass-panel-subtle flex items-center justify-between rounded-lg p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm text-white">{row.title}</span>
        <span className="mono text-[11px] text-on-surface-variant">
          {row.date ? formatRelative(row.date) : "—"} • {row.solved} solved
        </span>
      </div>
      <span className="mono shrink-0 text-sm font-bold text-primary">
        {row.rank != null ? `#${row.rank}` : "—"}
      </span>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { friendsVersion } = useNotifications();
  const { username } = useParams();
  const [params, setParams] = useSearchParams();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ProfileSubmissionRow[]>([]);
  const [subCursor, setSubCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const isPublicRoute = Boolean(username);
  const tabParam = (params.get("tab") as ProfileTab) || "overview";
  const active = TABS.some((t) => t.id === tabParam) ? tabParam : "overview";

  const setTab = (next: ProfileTab) => {
    const copy = new URLSearchParams(params);
    if (next === "overview") copy.delete("tab");
    else copy.set("tab", next);
    setParams(copy, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isPublicRoute && !user) {
        setProfile(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let data: ProfileResponse;
        let owner = false;
        if (isPublicRoute && username) {
          data = await getPublicProfile(username);
          owner =
            !!user &&
            user.uniqueUserId.toLowerCase() === username.toLowerCase();
        } else {
          data = await getMyProfile();
          owner = true;
        }
        if (!cancelled) {
          setProfile(data);
          setIsOwner(owner);
          setSubmissions(data.recentSubmissions);
          setSubCursor(null);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Failed to load profile.";
          setError(msg);
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user, isPublicRoute, username, friendsVersion]);

  const loadMoreSubmissions = async () => {
    if (!isOwner || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getMyProfileSubmissions(20, subCursor ?? undefined);
      setSubmissions((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        return [...prev, ...page.items.filter((r) => !ids.has(r.id))];
      });
      setSubCursor(page.nextCursor);
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  };

  const identity = profile?.identity;
  const stats = profile?.stats;
  const topTopics = (profile?.topics ?? []).slice(0, 5);
  const languages = (profile?.languages ?? []).slice(0, 3);
  const languageTotal = languages.reduce((s, l) => s + l.percent, 0) || 1;

  if (!isPublicRoute && !user) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background pt-16 text-on-surface antialiased">
        <AppNav />
        <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col items-start gap-4 px-margin-mobile py-12 md:px-margin-desktop">
          <p className="text-on-surface-variant">Log in to view your profile.</p>
          <Link to="/login" className="text-primary hover:underline">
            Go to login
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background pt-16 text-on-surface antialiased">
      <div className="bg-glow" />
      <AppNav />

      <main className="relative z-10 mx-auto flex w-full max-w-container-max flex-grow flex-col gap-12 px-margin-mobile py-12 md:px-margin-desktop">
        {loading && (
          <p className="text-sm text-on-surface-variant">Loading profile…</p>
        )}

        {!loading && (error || !profile || !identity || !stats) && (
          <p className="text-sm text-hard">{error || "Profile unavailable."}</p>
        )}

        {!loading && profile && identity && stats && (
          <>
            {/* Hero */}
            <section className="glass-panel relative flex flex-col items-start justify-between gap-8 overflow-hidden rounded-xl p-10 md:flex-row md:items-center">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
              <div className="z-10 flex items-center gap-8">
                <div className="relative flex h-32 w-32 cursor-default items-center justify-center rounded-2xl border border-primary/40 bg-surface-container-low font-headline-lg text-5xl text-primary shadow-[0_0_30px_rgba(132,43,210,0.3)]">
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/10" />
                  {identity.avatarUrl ? (
                    <img
                      src={identity.avatarUrl}
                      alt=""
                      className="relative z-10 h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="relative z-10">
                      {initials(identity.name)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <h1 className="font-headline-xl text-headline-xl bg-gradient-to-r from-white to-primary-fixed-dim bg-clip-text text-transparent">
                      {identity.name}
                    </h1>
                    <span className="rounded border border-outline-variant bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {identity.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-5 text-sm text-on-surface-variant">
                    <span className="mono rounded bg-primary/10 px-2 py-1 text-primary">
                      @{identity.username}
                    </span>
                    {identity.location && (
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">
                          location_on
                        </span>
                        {identity.location}
                      </span>
                    )}
                    {formatJoined(identity.joinedAt) && (
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">
                          calendar_today
                        </span>
                        Joined {formatJoined(identity.joinedAt)}
                      </span>
                    )}
                  </div>
                  {identity.bio && (
                    <p className="mt-2 font-body-lg text-body-lg italic text-white opacity-90">
                      &ldquo;{identity.bio}&rdquo;
                    </p>
                  )}
                </div>
              </div>
              {isOwner && (
                <Link
                  to="/settings/profile"
                  className="z-10 rounded-full border border-primary px-8 py-3 font-label-md text-label-md text-white shadow-[0_0_15px_rgba(132,43,210,0.2)] backdrop-blur-md transition-all hover:bg-primary/20 hover:shadow-[0_0_25px_rgba(132,43,210,0.4)]"
                >
                  Edit Profile
                </Link>
              )}
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 gap-6 md:grid-cols-4 xl:grid-cols-7">
              {[
                {
                  label: "Total Solved",
                  value: String(stats.totalSolved),
                  glow: true,
                },
                {
                  label: "Friends",
                  value: String(stats.friendCount ?? 0),
                },
                {
                  label: "Submissions",
                  value: String(stats.totalSubmissions),
                },
                {
                  label: "Acceptance",
                  value: `${Math.round(stats.acceptanceRate)}%`,
                },
                {
                  label: "Current Streak",
                  value: String(stats.currentStreak),
                  fire: true,
                  glow: true,
                },
                {
                  label: "Longest Streak",
                  value: String(stats.longestStreak),
                },
                {
                  label: "Contest Rank",
                  value:
                    stats.contestBestRank != null
                      ? `#${stats.contestBestRank}`
                      : "—",
                  accent: true,
                  glow: true,
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="glass-panel group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl p-8 transition-colors hover:border-primary/50"
                >
                  <div
                    className={`absolute -right-4 -bottom-4 h-16 w-16 rounded-full blur-xl transition-all ${
                      card.glow
                        ? "bg-primary/10 group-hover:bg-primary/20"
                        : "bg-white/5 group-hover:bg-white/10"
                    }`}
                  />
                  <span className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                    {card.label}
                  </span>
                  {card.fire ? (
                    <div className="flex items-center gap-2 text-white">
                      <span className="material-symbols-outlined text-[24px] text-primary">
                        local_fire_department
                      </span>
                      <span className="mono font-headline-xl text-headline-xl font-bold">
                        {card.value}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`mono font-headline-xl text-headline-xl font-bold ${
                        card.accent ? "text-primary" : "text-white"
                      }`}
                    >
                      {card.value}
                    </span>
                  )}
                </div>
              ))}
            </section>

            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Left */}
              <aside className="flex w-full flex-col gap-6 lg:w-1/3">
                <div className="glass-panel flex flex-col gap-6 rounded-xl p-8">
                  <h3 className="border-b border-outline-variant pb-4 font-label-md text-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                    Problem Solving
                  </h3>
                  <div className="flex flex-col gap-5 pt-2">
                    {(
                      [
                        {
                          label: "Easy",
                          solved: stats.difficulty.easy,
                          total: stats.difficulty.totalAvailable.easy,
                          bar: "bg-easy shadow-[0_0_10px_rgba(34,197,94,0.5)]",
                          text: "text-easy",
                        },
                        {
                          label: "Medium",
                          solved: stats.difficulty.medium,
                          total: stats.difficulty.totalAvailable.medium,
                          bar: "bg-medium shadow-[0_0_10px_rgba(234,179,8,0.5)]",
                          text: "text-medium",
                        },
                        {
                          label: "Hard",
                          solved: stats.difficulty.hard,
                          total: stats.difficulty.totalAvailable.hard,
                          bar: "bg-hard shadow-[0_0_10px_rgba(239,68,68,0.5)]",
                          text: "text-hard",
                        },
                      ] as const
                    ).map((row) => (
                      <div key={row.label}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className={row.text}>{row.label}</span>
                          <span className="mono text-xs text-on-surface-variant">
                            <span className={`font-bold ${row.text}`}>
                              {row.solved}
                            </span>{" "}
                            / {row.total}
                          </span>
                        </div>
                        <div className="glass-panel-subtle h-2 w-full overflow-hidden rounded-full">
                          <div
                            className={`h-full rounded-full ${row.bar}`}
                            style={{
                              width: `${pct(row.solved, row.total)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel flex flex-col gap-4 rounded-xl p-8">
                  <h3 className="mb-2 border-b border-outline-variant pb-4 font-label-md text-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                    Top Topics
                  </h3>
                  <div className="flex flex-col gap-4">
                    {topTopics.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">
                        Solve problems to build topic progress.
                      </p>
                    ) : (
                      topTopics.map((t) => (
                        <div
                          key={t.topic}
                          className="glass-panel-subtle flex items-center justify-between rounded-lg p-3 transition-colors hover:border-primary/30"
                        >
                          <span className="text-sm text-white">{t.topic}</span>
                          <span className="mono text-xs text-primary">
                            {t.solved} / {t.total}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="glass-panel flex flex-col gap-5 rounded-xl p-8">
                  <h3 className="mb-2 border-b border-outline-variant pb-4 font-label-md text-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                    Languages
                  </h3>
                  {languages.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      No submissions yet.
                    </p>
                  ) : (
                    <>
                      <div className="glass-panel-subtle mb-2 flex h-2 items-center gap-0.5 overflow-hidden rounded-full p-0.5">
                        {languages.map((lang, i) => (
                          <div
                            key={lang.language}
                            className={`h-full ${
                              i === 0
                                ? "rounded-l-full bg-primary shadow-[0_0_10px_rgba(132,43,210,0.8)]"
                                : i === languages.length - 1
                                  ? "rounded-r-full bg-white/30"
                                  : "bg-white/60"
                            }`}
                            style={{
                              width: `${(lang.percent / languageTotal) * 100}%`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex flex-col gap-4">
                        {languages.map((lang, i) => (
                          <div
                            key={lang.language}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`h-3 w-3 rounded-full ${
                                  i === 0
                                    ? "bg-primary shadow-[0_0_8px_rgba(132,43,210,0.8)]"
                                    : i === 1
                                      ? "bg-white/60"
                                      : "bg-white/30"
                                }`}
                              />
                              <span className="text-white">{lang.language}</span>
                            </div>
                            <span className="mono text-xs text-white">
                              {Math.round(lang.percent)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </aside>

              {/* Right */}
              <div className="flex w-full flex-col gap-8 lg:w-2/3">
                <div
                  role="tablist"
                  aria-label="Profile sections"
                  className="flex gap-8 border-b border-outline-variant px-2"
                >
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={active === t.id}
                      onClick={() => setTab(t.id)}
                      className={`pb-4 font-label-md text-sm uppercase tracking-widest transition-colors ${
                        active === t.id
                          ? "border-b-2 border-primary text-white"
                          : "text-on-surface-variant hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {active === "overview" && (
                  <>
                    <ContributionHeatmap
                      days={profile.heatmap}
                      totalSubmissions={stats.totalSubmissions}
                    />

                    {profile.continueProblem && (
                      <Link
                        to={`/problems/${profile.continueProblem.id}`}
                        className="glass-panel group cursor-pointer rounded-xl border-l-4 border-l-primary p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all hover:bg-white/5 hover:shadow-[0_4px_25px_rgba(132,43,210,0.15)]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-2">
                            <span className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                              Continue Working
                            </span>
                            <div className="flex flex-wrap items-center gap-4">
                              <h4 className="font-headline-lg text-xl text-white transition-colors group-hover:text-primary">
                                {profile.continueProblem.title}
                              </h4>
                              <span
                                className={`rounded border px-2 py-1 text-xs font-bold ${difficultyBadge(profile.continueProblem.difficulty)}`}
                              >
                                {profile.continueProblem.difficulty}
                              </span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-3xl text-white transition-all group-hover:translate-x-2 group-hover:text-primary">
                            arrow_forward
                          </span>
                        </div>
                      </Link>
                    )}

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="glass-panel flex flex-col gap-5 rounded-xl p-8">
                        <h3 className="mb-2 border-b border-outline-variant pb-4 font-label-md text-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                          Recent Submissions
                        </h3>
                        {profile.recentSubmissions.length === 0 ? (
                          <p className="text-sm text-on-surface-variant">
                            No submissions yet.
                          </p>
                        ) : (
                          profile.recentSubmissions
                            .slice(0, 5)
                            .map((row) => (
                              <SubmissionRow key={row.id} row={row} />
                            ))
                        )}
                      </div>

                      <div className="glass-panel flex flex-col gap-5 rounded-xl p-8">
                        <h3 className="mb-2 border-b border-outline-variant pb-4 font-label-md text-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                          Personal Bests
                        </h3>
                        <div className="glass-panel-subtle flex flex-col gap-2 rounded-xl p-5">
                          <span className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                            Fastest Execution
                          </span>
                          {profile.personalBests.fastestAccepted ? (
                            <div className="mt-1 flex items-end justify-between gap-3">
                              <span className="text-white">
                                {profile.personalBests.fastestAccepted.problemTitle}
                              </span>
                              <span className="mono text-xl font-bold text-white">
                                {profile.personalBests.fastestAccepted.runtime}
                                ms
                              </span>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-on-surface-variant">
                              —
                            </p>
                          )}
                        </div>
                        <div className="glass-panel-subtle flex flex-col gap-2 rounded-xl p-5">
                          <span className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                            Hardest Solved
                          </span>
                          {profile.personalBests.hardestSolved ? (
                            <div className="mt-1 flex items-center justify-between gap-3">
                              <span className="text-sm text-white">
                                {profile.personalBests.hardestSolved.problemTitle}
                              </span>
                              <span
                                className={`rounded border px-2 py-1 text-xs font-bold ${difficultyBadge(profile.personalBests.hardestSolved.difficulty)}`}
                              >
                                {profile.personalBests.hardestSolved.difficulty}
                              </span>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-on-surface-variant">
                              —
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {active === "submissions" && (
                  <div className="glass-panel flex flex-col gap-4 rounded-xl p-8">
                    <h3 className="mb-2 border-b border-outline-variant pb-4 font-label-md text-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                      Submissions
                    </h3>
                    {submissions.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">
                        No submissions yet.
                      </p>
                    ) : (
                      submissions.map((row) => (
                        <SubmissionRow key={row.id} row={row} />
                      ))
                    )}
                    {isOwner && subCursor != null && (
                      <button
                        type="button"
                        onClick={loadMoreSubmissions}
                        disabled={loadingMore}
                        className="mt-2 self-start text-sm text-primary hover:underline disabled:opacity-50"
                      >
                        {loadingMore ? "Loading…" : "Load more"}
                      </button>
                    )}
                  </div>
                )}

                {active === "contests" && (
                  <div className="glass-panel flex flex-col gap-4 rounded-xl p-8">
                    <h3 className="mb-2 border-b border-outline-variant pb-4 font-label-md text-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                      Contest History
                    </h3>
                    {profile.contestHistory.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">
                        No contests yet.
                      </p>
                    ) : (
                      profile.contestHistory.map((row) => (
                        <ContestRow
                          key={`${row.competitionId}-${row.date}`}
                          row={row}
                        />
                      ))
                    )}
                  </div>
                )}

                {active === "saved" && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="glass-panel flex flex-col gap-4 rounded-xl p-8">
                      <h3 className="mb-2 border-b border-outline-variant pb-4 font-label-md text-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                        Bookmarked
                      </h3>
                      {profile.bookmarked.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">
                          Bookmark problems from the problem page.
                        </p>
                      ) : (
                        profile.bookmarked.map((p) => (
                          <ProblemRow key={p.id} problem={p} />
                        ))
                      )}
                    </div>
                    <div className="glass-panel flex flex-col gap-4 rounded-xl p-8">
                      <h3 className="mb-2 border-b border-outline-variant pb-4 font-label-md text-label-md text-xs uppercase tracking-widest text-on-surface-variant">
                        Recently Viewed
                      </h3>
                      {profile.recentlyViewed.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">
                          Open a problem to start your trail.
                        </p>
                      ) : (
                        profile.recentlyViewed.map((p) => (
                          <ProblemRow key={p.id} problem={p} />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="relative z-10 mt-auto border-t border-outline-variant bg-background/80 py-8 backdrop-blur-md">
        <div className="mx-auto flex max-w-container-max justify-center gap-12 px-margin-mobile md:px-margin-desktop">
          <Link
            to="/privacy"
            className="font-label-md text-label-md text-sm uppercase tracking-widest text-on-surface-variant transition-colors hover:text-white"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="font-label-md text-label-md text-sm uppercase tracking-widest text-on-surface-variant transition-colors hover:text-white"
          >
            Terms
          </Link>
          <Link
            to="/help"
            className="font-label-md text-label-md text-sm uppercase tracking-widest text-on-surface-variant transition-colors hover:text-white"
          >
            Help
          </Link>
        </div>
      </footer>
    </div>
  );
}
