import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../context/AuthContext";
import {
  buildContestDashboard,
  formatContestWhen,
  formatCountdown,
  formatDuration,
} from "../features/competitions/adapters";
import type {
  ContestCardModel,
  ContestDashboardData,
} from "../features/competitions/types";
import {
  ApiError,
  getAllCompetitions,
  getCompetitionParticipants,
  getCompetitionProblems,
  getMyContestHistory,
  joinCompetition,
} from "../lib/api";

type StatusFilter = "ALL" | "LIVE" | "UPCOMING" | "PAST";

const ENRICH_CONCURRENCY = 4;

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run())
  );
  return results;
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-outline-variant/30 bg-surface-container px-3 py-1 font-code-sm text-code-sm text-on-surface-variant">
      {children}
    </span>
  );
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function Competitions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = useNow(1000);
  const [data, setData] = useState<ContestDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const [pastLimit, setPastLimit] = useState(4);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [competitions, history] = await Promise.all([
        getAllCompetitions(),
        user ? getMyContestHistory().catch(() => []) : Promise.resolve([]),
      ]);

      const countsEntries = await mapPool(
        competitions,
        ENRICH_CONCURRENCY,
        async (competition) => {
          const [problems, participants] = await Promise.all([
            getCompetitionProblems(competition.id).catch(() => null),
            getCompetitionParticipants(competition.id).catch(() => null),
          ]);
          return [
            competition.id,
            {
              problemCount: problems?.length ?? null,
              participantCount: participants?.length ?? null,
            },
          ] as const;
        }
      );

      setData(
        buildContestDashboard(
          competitions,
          Object.fromEntries(countsEntries),
          history
        )
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load competitions."
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const live = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.live ?? []).filter((c) => {
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.contestType?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data, query]);

  const upcoming = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.upcoming ?? []).filter((c) => {
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.contestType?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data, query]);

  const past = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.past ?? []).filter((c) => {
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.contestType?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data, query]);

  const showLive = filter === "ALL" || filter === "LIVE";
  const showUpcoming = filter === "ALL" || filter === "UPCOMING";
  const showPast = filter === "ALL" || filter === "PAST";

  const handleJoin = async (contest: ContestCardModel) => {
    if (!user) {
      setActionMsg("Log in to join contests.");
      return;
    }
    setJoiningId(contest.id);
    setActionMsg(null);
    try {
      const result = await joinCompetition(contest.id, user.id);
      const msg = typeof result === "string" ? result.toLowerCase() : "";
      if (msg && !msg.includes("joined") && !msg.includes("already")) {
        throw new Error(result);
      }
      setActionMsg(`Joined ${contest.title}. Opening room…`);
      navigate(`/competitions/${contest.id}`);
    } catch (err) {
      setActionMsg(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to join contest."
      );
    } finally {
      setJoiningId(null);
    }
  };

  const stats = data?.stats;

  return (
    <div className="problem-workspace relative flex min-h-screen flex-col overflow-x-hidden text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container">
      <div className="pw-ambient" aria-hidden />
      <AppNav activeHint="/competitions" />

      <main className="relative z-10 mx-auto w-full max-w-container-max flex-1 space-y-12 px-margin-mobile py-8 pt-24 md:px-margin-desktop md:py-12">
        <section className="space-y-4">
          <p className="font-label-md text-label-md tracking-widest text-primary uppercase">
            Competitions
          </p>
          <h1 className="font-headline-xl text-headline-xl text-on-surface [text-shadow:0_0_10px_rgba(221,183,255,0.3)]">
            Weekly coding challenges
          </h1>
          <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
            Improve under real contest conditions — timed rounds, live
            standings.
          </p>
          <Link
            to="/competitions/quick"
            className="font-label-md inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-5 py-2.5 text-primary shadow-[0_0_16px_rgba(168,85,247,0.2)] transition-all hover:border-primary/55 hover:bg-primary/15 hover:shadow-[0_0_24px_rgba(168,85,247,0.35)]"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            Quick Clash
          </Link>
        </section>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Active", value: stats?.active ?? "—" },
            { label: "Upcoming", value: stats?.upcoming ?? "—" },
            { label: "Total", value: stats?.total ?? "—" },
            {
              label: "Participants",
              value: stats?.totalParticipants ?? "—",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="glass-panel flex flex-col gap-2 rounded-2xl border border-white/8 p-6 transition-all hover:border-primary/30 hover:shadow-[0_0_24px_rgba(168,85,247,0.12)]"
            >
              <span className="font-label-md text-label-md text-on-surface-variant">
                {card.label}
              </span>
              <span className="font-headline-lg text-headline-lg text-primary">
                {card.value}
              </span>
            </div>
          ))}
        </section>

        <section className="glass-panel relative z-20 flex flex-col items-center justify-between gap-4 rounded-lg p-4 md:flex-row">
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
            {(
              [
                ["ALL", "All"],
                ["LIVE", "Live"],
                ["UPCOMING", "Upcoming"],
                ["PAST", "Past"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 font-label-md text-label-md transition-colors ${
                  filter === id
                    ? "bg-primary text-on-primary"
                    : "border border-outline-variant/30 bg-surface-container text-on-surface hover:bg-surface-variant"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-xl text-on-surface-variant">
              search
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-outline-variant/50 bg-surface-container py-2 pr-4 pl-10 font-body-md text-on-surface outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Search contests..."
              type="text"
            />
          </div>
        </section>

        {actionMsg && (
          <p className="text-sm text-primary">{actionMsg}</p>
        )}
        {loading && (
          <p className="text-sm text-on-surface-variant">
            Loading competitions…
          </p>
        )}
        {!loading && error && (
          <div className="space-y-2">
            <p className="text-sm text-hard">{error}</p>
            {!user && (
              <Link to="/login" className="text-sm text-primary hover:underline">
                Sign in to view competitions
              </Link>
            )}
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="space-y-12 lg:col-span-3">
              {showLive && (
                <section className="space-y-6">
                  <h3 className="flex items-center gap-3 font-headline-lg-mobile text-headline-lg-mobile">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    Live now
                  </h3>
                  {live.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      No live contests right now.
                    </p>
                  ) : (
                    live.map((contest) => {
                      const remaining = Date.parse(contest.endTime) - now;
                      return (
                        <div
                          key={contest.id}
                          className="glass-panel group relative overflow-hidden rounded-xl border border-primary/30 p-8"
                        >
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                          <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                            <div className="flex-1 space-y-4">
                              <span className="flex items-center gap-1 rounded border border-primary/30 bg-primary/20 px-2 py-1 text-[12px] font-bold tracking-wide text-primary">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />{" "}
                                LIVE
                              </span>
                              <h2 className="font-headline-xl text-headline-xl text-on-surface">
                                {contest.title}
                              </h2>
                              <div className="flex flex-wrap gap-2">
                                {contest.participantCount != null && (
                                  <Chip>
                                    {contest.participantCount} participants
                                  </Chip>
                                )}
                                {contest.problemCount != null && (
                                  <Chip>{contest.problemCount} problems</Chip>
                                )}
                                <Chip>
                                  {formatDuration(contest.durationMinutes)}{" "}
                                  duration
                                </Chip>
                                {contest.contestType && (
                                  <Chip>{contest.contestType}</Chip>
                                )}
                                {contest.difficulty && (
                                  <Chip>{contest.difficulty}</Chip>
                                )}
                              </div>
                            </div>
                            <div className="flex min-w-[280px] w-full flex-col items-end gap-6 rounded-lg border border-outline-variant/20 bg-surface-container/50 p-6 md:w-auto">
                              <div className="w-full text-right">
                                <p className="mb-1 font-label-md text-label-md text-on-surface-variant">
                                  Ends in
                                </p>
                                <p className="font-code-sm text-headline-lg tabular-nums text-primary [text-shadow:0_0_10px_rgba(221,183,255,0.3)]">
                                  {formatCountdown(remaining)}
                                </p>
                              </div>
                              <div className="flex w-full flex-col gap-3">
                                <button
                                  type="button"
                                  disabled={joiningId === contest.id}
                                  onClick={() => void handleJoin(contest)}
                                  className="w-full rounded-full bg-primary px-6 py-3 text-center font-label-md text-label-md font-bold text-on-primary shadow-[0_0_15px_rgba(221,183,255,0.2)] transition-all hover:bg-primary-container disabled:opacity-50"
                                >
                                  {joiningId === contest.id
                                    ? "Joining…"
                                    : "Join contest"}
                                </button>
                                <Link
                                  to={`/competitions/${contest.id}`}
                                  className="w-full rounded-full border border-outline-variant px-6 py-3 text-center font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-variant/30"
                                >
                                  View details
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </section>
              )}

              {showUpcoming && (
                <section className="space-y-6">
                  <h3 className="flex items-center gap-3 font-headline-lg-mobile text-headline-lg-mobile">
                    <span className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    Starting soon
                  </h3>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      No upcoming contests.
                    </p>
                  ) : (
                    upcoming.map((contest) => {
                      const startsIn = Date.parse(contest.startTime) - now;
                      return (
                        <div
                          key={contest.id}
                          className="glass-panel glow-hover rounded-xl p-6 transition-all"
                        >
                          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                            <div className="flex-1 space-y-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[12px] font-bold tracking-wide text-amber-300">
                                  UPCOMING
                                </span>
                                {contest.contestType && (
                                  <span className="font-label-md text-label-md text-on-surface-variant">
                                    {contest.contestType.replace("_", " ")}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                                {contest.title}
                              </h4>
                              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div>
                                  <p className="mb-1 font-label-md text-[12px] tracking-wider text-on-surface-variant uppercase">
                                    Starts In
                                  </p>
                                  <p className="font-code-sm text-on-surface">
                                    {formatCountdown(startsIn)}
                                  </p>
                                </div>
                                <div>
                                  <p className="mb-1 font-label-md text-[12px] tracking-wider text-on-surface-variant uppercase">
                                    Duration
                                  </p>
                                  <p className="font-code-sm text-on-surface">
                                    {formatDuration(contest.durationMinutes)}
                                  </p>
                                </div>
                                <div>
                                  <p className="mb-1 font-label-md text-[12px] tracking-wider text-on-surface-variant uppercase">
                                    Problems
                                  </p>
                                  <p className="font-code-sm text-on-surface">
                                    {contest.problemCount ?? "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="mb-1 font-label-md text-[12px] tracking-wider text-on-surface-variant uppercase">
                                    Registered
                                  </p>
                                  <p className="font-code-sm text-on-surface">
                                    {contest.participantCount ?? "—"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex w-full min-w-[140px] flex-col gap-2 md:w-auto">
                              <button
                                type="button"
                                disabled={joiningId === contest.id}
                                onClick={() => void handleJoin(contest)}
                                className="rounded border border-outline-variant/50 bg-surface-variant px-4 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-bright disabled:opacity-50"
                              >
                                {joiningId === contest.id
                                  ? "Registering…"
                                  : "Register"}
                              </button>
                              <Link
                                to={`/competitions/${contest.id}`}
                                className="rounded px-4 py-2 text-center font-label-md text-label-md text-primary transition-colors hover:bg-primary/10"
                              >
                                View details
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </section>
              )}

              {showPast && (
                <section className="space-y-6">
                  <h3 className="flex items-center gap-3 font-headline-lg-mobile text-headline-lg-mobile">
                    <span className="h-3 w-3 rounded-full bg-outline-variant" />
                    Past competitions
                  </h3>
                  <div className="space-y-4">
                    {past.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">
                        No past contests yet.
                      </p>
                    ) : (
                      past.slice(0, pastLimit).map((contest) => (
                        <div
                          key={contest.id}
                          className="glass-panel rounded-xl p-6 transition-colors hover:bg-surface-container/50"
                        >
                          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                            <div className="flex-1 space-y-3">
                              <span className="rounded border border-outline-variant/30 bg-surface-variant px-2 py-0.5 text-[12px] font-bold tracking-wide text-on-surface-variant">
                                ENDED
                              </span>
                              <h4 className="font-headline-lg-mobile text-[20px] text-on-surface opacity-80">
                                {contest.title}
                              </h4>
                              <div className="flex flex-wrap gap-4 font-code-sm text-[13px] text-on-surface-variant">
                                <span>
                                  Ended: {formatContestWhen(contest.endTime)}
                                </span>
                                {contest.participantCount != null && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      {contest.participantCount} participants
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex w-full flex-col gap-2 md:w-auto">
                              <Link
                                to={`/competitions/${contest.id}`}
                                className="rounded border border-outline-variant/50 px-4 py-2 text-center font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-variant/30"
                              >
                                Practice mode
                              </Link>
                              <Link
                                to={`/competitions/${contest.id}?tab=standings`}
                                className="rounded px-4 py-2 text-center font-label-md text-label-md text-primary transition-colors hover:bg-primary/10"
                              >
                                View standings
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {past.length > pastLimit && (
                    <button
                      type="button"
                      onClick={() => setPastLimit((n) => n + 4)}
                      className="w-full rounded-lg border border-dashed border-primary/20 py-4 text-center font-label-md text-label-md text-primary transition-colors hover:bg-primary/5"
                    >
                      Load more past contests
                    </button>
                  )}
                </section>
              )}
            </div>

            <aside className="space-y-8 lg:col-span-1">
              <div className="glass-panel sticky top-24 rounded-xl p-6">
                <h3 className="mb-4 font-headline-lg-mobile text-[20px] text-on-surface">
                  Your contest stats
                </h3>
                {user && data.history.length > 0 ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-outline-variant/20 bg-surface-container/30 p-4">
                      <p className="text-xs tracking-wider text-on-surface-variant uppercase">
                        Contests played
                      </p>
                      <p className="mono mt-1 text-2xl font-bold text-primary">
                        {data.userStats.contestsPlayed}
                      </p>
                    </div>
                    <div className="rounded-lg border border-outline-variant/20 bg-surface-container/30 p-4">
                      <p className="text-xs tracking-wider text-on-surface-variant uppercase">
                        Best rank
                      </p>
                      <p className="mono mt-1 text-2xl font-bold text-primary">
                        {data.userStats.bestRank != null
                          ? `#${data.userStats.bestRank}`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-outline-variant/20 bg-surface-container/30 p-4">
                      <p className="text-xs tracking-wider text-on-surface-variant uppercase">
                        Recent rank
                      </p>
                      <p className="mono mt-1 text-2xl font-bold text-primary">
                        {data.userStats.recentRank != null
                          ? `#${data.userStats.recentRank}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-outline-variant/20 bg-surface-container/30 p-6 text-center">
                    <span className="material-symbols-outlined mb-2 text-4xl text-outline">
                      bar_chart
                    </span>
                    <p className="font-body-md text-on-surface-variant">
                      Sign in to track contest stats, ratings, and history.
                    </p>
                    {!user && (
                      <Link
                        to="/login"
                        className="mt-2 w-full rounded border border-outline-variant/50 bg-surface-variant px-6 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-bright"
                      >
                        Sign In
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-outline-variant/20 bg-surface-container-lowest py-12">
        <div className="mx-auto grid max-w-container-max grid-cols-1 gap-gutter px-margin-desktop md:grid-cols-4">
          <div>
            <p className="mb-4 font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
              CodeIT
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant opacity-80">
              © {new Date().getFullYear()} CodeIT. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-8 font-label-md text-label-md md:col-span-3 md:justify-end">
            <Link
              to="/privacy"
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              Terms of Service
            </Link>
            <Link
              to="/help"
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              Help Center
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
