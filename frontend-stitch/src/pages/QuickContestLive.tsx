import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  getQuickContest,
  joinQuickContest,
  leaveQuickContest,
  type QuickContest,
} from "../lib/api";

function difficultyTone(d?: string) {
  const x = (d || "").toUpperCase();
  if (x === "EASY") return "border-easy/30 bg-easy/10 text-easy";
  if (x === "MEDIUM") return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  if (x === "HARD") return "border-hard/30 bg-hard/10 text-hard";
  return "border-outline-variant/30 bg-surface-container text-on-surface-variant";
}

function formatClock(totalSeconds: number | null) {
  if (totalSeconds == null) return "--:--";
  const s = Math.max(0, totalSeconds);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function rowNum(row: Record<string, unknown>, key: string) {
  const n = Number(row[key]);
  return Number.isFinite(n) ? n : 0;
}

function rowStr(row: Record<string, unknown>, key: string, fallback = "—") {
  const v = row[key];
  return typeof v === "string" && v ? v : fallback;
}

export default function QuickContestLive() {
  const { id } = useParams();
  const { user } = useAuth();
  const [contest, setContest] = useState<QuickContest | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [leaving, setLeaving] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    setContest(await getQuickContest(id));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    void reload().catch((err) =>
      setError(err instanceof ApiError ? err.message : "Failed to load contest")
    );
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = window.setInterval(() => {
      void reload().catch(() => undefined);
    }, 5000);
    return () => {
      window.clearInterval(t);
      window.clearInterval(poll);
    };
  }, [user, id, reload]);

  const remaining = useMemo(() => {
    if (!contest?.ends_at) return null;
    const ends = new Date(contest.ends_at).getTime();
    if (!Number.isFinite(ends)) return null;
    return Math.max(0, Math.floor((ends - now) / 1000));
  }, [contest?.ends_at, now]);

  const mySolved = useMemo(() => {
    if (!user || !contest?.leaderboard) return 0;
    const me = contest.leaderboard.find(
      (r) => Number(r.user_id) === user.id
    );
    return me ? rowNum(me, "solved") : 0;
  }, [contest?.leaderboard, user]);

  const myParticipant = useMemo(() => {
    if (!user || !contest?.participants) return null;
    return (
      contest.participants.find((p) => Number(p.user_id) === user.id) || null
    );
  }, [contest?.participants, user]);

  const myStatus = String(myParticipant?.status || "");
  const isHost =
    !!user && !!contest && Number(contest.host_user_id) === user.id;

  const onLeave = async () => {
    if (!contest) return;
    setLeaving(true);
    setError("");
    try {
      await leaveQuickContest(contest.id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not leave.");
    } finally {
      setLeaving(false);
    }
  };

  const onRejoin = async () => {
    if (!contest) return;
    setLeaving(true);
    setError("");
    try {
      setContest(await joinQuickContest(contest.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not rejoin.");
    } finally {
      setLeaving(false);
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  const live = contest?.status === "LIVE";
  const ended =
    contest?.status === "ENDED" || (remaining != null && remaining <= 0);

  return (
    <div className="problem-workspace relative min-h-screen overflow-x-hidden text-on-surface">
      <div className="pw-ambient" aria-hidden />
      <AppNav activeHint="/competitions/quick" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-margin-mobile pb-20 pt-24 md:px-margin-desktop md:pt-28">
        {!contest ? (
          <p className="font-body-md text-on-surface-variant">
            {error || "Loading contest…"}
          </p>
        ) : (
          <>
            <header className="pw-contest-header mb-8 flex flex-wrap items-end justify-between gap-4 px-5 py-5">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Link
                    to={`/competitions/quick/${id}`}
                    className="inline-flex items-center gap-1 font-label-md text-[12px] text-on-surface-variant transition-colors hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      arrow_back
                    </span>
                    Lobby
                  </Link>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-label-md text-[11px] uppercase tracking-widest ${
                      live && !ended
                        ? "border-easy/40 bg-easy/10 text-easy"
                        : ended
                          ? "border-outline-variant/40 text-on-surface-variant"
                          : "border-primary/30 bg-primary/10 text-primary"
                    }`}
                  >
                    {live && !ended && (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-easy" />
                    )}
                    {ended ? "ENDED" : contest.status}
                  </span>
                  <span className="rounded-full border border-outline-variant/20 bg-surface-container px-2.5 py-0.5 font-label-md text-[11px] text-on-surface-variant">
                    Private · Unrated
                  </span>
                </div>
                <h1 className="font-headline-xl text-headline-lg text-primary md:text-headline-xl [text-shadow:0_0_24px_rgba(221,183,255,0.2)]">
                  {contest.name}
                </h1>
                <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                  {(contest.problems || []).length} problems · open one to solve
                  in the contest workspace
                  {mySolved > 0 ? ` · you solved ${mySolved}` : ""}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant">
                  Time remaining
                </span>
                <div
                  className={`rounded-xl border px-5 py-2.5 font-mono text-3xl tabular-nums ${
                    remaining != null && remaining < 300
                      ? "border-hard/40 bg-hard/10 text-hard"
                      : "border-primary/40 bg-primary/10 text-primary"
                  }`}
                >
                  {formatClock(remaining)}
                </div>
                {myStatus === "LEFT" && live && !ended && (
                  <button
                    type="button"
                    disabled={leaving}
                    onClick={() => void onRejoin()}
                    className="rounded-full bg-primary px-4 py-2 font-label-md text-[13px] text-on-primary shadow-[0_0_16px_rgba(168,85,247,0.3)] disabled:opacity-60"
                  >
                    {leaving ? "Rejoining…" : "Rejoin contest"}
                  </button>
                )}
                {myStatus === "JOINED" && !isHost && live && !ended && (
                  <button
                    type="button"
                    disabled={leaving}
                    onClick={() => void onLeave()}
                    className="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-label-md text-[12px] text-on-surface-variant hover:border-error/40 hover:text-error disabled:opacity-60"
                  >
                    Leave contest
                  </button>
                )}
              </div>
            </header>

            {myStatus === "LEFT" && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                <p className="font-body-md text-sm text-on-surface">
                  You left this Quick Clash. Rejoin to keep solving and appear on
                  the leaderboard.
                </p>
                <button
                  type="button"
                  disabled={leaving || ended}
                  onClick={() => void onRejoin()}
                  className="rounded-full bg-primary px-4 py-2 font-label-md text-[13px] text-on-primary shadow-[0_0_16px_rgba(168,85,247,0.3)] disabled:opacity-60"
                >
                  {leaving ? "Rejoining…" : "Join current Quick Clash"}
                </button>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="mb-6 rounded-lg border border-error/30 bg-error/10 px-3 py-2 font-body-md text-sm text-error"
              >
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
              {/* Problems */}
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                    Problems
                  </h2>
                  <div className="rule-fade" />
                </div>

                <div className="flex flex-col gap-3">
                  {(contest.problems || []).map((p) => {
                    const letter = String.fromCharCode(64 + p.ordinal);
                    return (
                      <Link
                        key={p.problem_id}
                        to={`/competitions/quick/${id}/problems/${p.problem_id}`}
                        className="glass-panel group picker flex items-center gap-4 rounded-xl border border-outline-variant/20 p-4 transition-all hover:border-primary/40 hover:shadow-[0_0_24px_rgba(221,183,255,0.08)]"
                      >
                        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 font-headline-lg-mobile text-xl font-bold text-primary">
                          {letter}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-label-md text-label-md font-bold text-on-surface group-hover:text-primary">
                              {p.title}
                            </h3>
                            <span
                              className={`rounded-sm border px-2 py-0.5 font-label-md text-[11px] font-bold ${difficultyTone(p.difficulty)}`}
                            >
                              {p.difficulty}
                            </span>
                          </div>
                          <p className="mt-1 font-body-md text-sm text-on-surface-variant">
                            Open statement, sample cases, and Monaco editor
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant transition-colors group-hover:text-primary">
                          chevron_right
                        </span>
                      </Link>
                    );
                  })}
                  {(contest.problems || []).length === 0 && (
                    <p className="rounded-xl border border-dashed border-outline-variant/30 px-4 py-10 text-center text-on-surface-variant">
                      No problems assigned to this contest.
                    </p>
                  )}
                </div>
              </section>

              {/* Leaderboard */}
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="glass-panel overflow-hidden rounded-xl border border-outline-variant/20">
                  <div className="flex items-center justify-between border-b border-outline-variant/15 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-primary">
                        leaderboard
                      </span>
                      <h2 className="font-label-md text-label-md font-bold text-on-surface">
                        Leaderboard
                      </h2>
                    </div>
                    <span className="font-code-sm text-[11px] text-on-surface-variant">
                      live
                    </span>
                  </div>

                  <div className="max-h-[min(28rem,60vh)] overflow-y-auto">
                    {(contest.leaderboard || []).length === 0 ? (
                      <p className="px-4 py-8 text-center font-body-md text-sm text-on-surface-variant">
                        Rankings appear after the first accepted submit.
                      </p>
                    ) : (
                      <ul className="divide-y divide-outline-variant/10">
                        {(contest.leaderboard || []).map((row, idx) => {
                          const uid = Number(row.user_id);
                          const isMe = user && uid === user.id;
                          const placement =
                            rowNum(row, "placement") || idx + 1;
                          return (
                            <li
                              key={String(row.user_id ?? idx)}
                              className={`flex items-center gap-3 px-4 py-3 ${
                                isMe ? "bg-primary/8" : ""
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md font-mono text-sm font-bold ${
                                  placement === 1
                                    ? "bg-primary/20 text-primary"
                                    : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                {placement}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-label-md text-sm font-semibold text-on-surface">
                                  {rowStr(row, "name", "Player")}
                                  {isMe && (
                                    <span className="ml-1.5 font-normal text-primary">
                                      (you)
                                    </span>
                                  )}
                                </p>
                                <p className="font-code-sm text-[11px] text-on-surface-variant">
                                  {rowNum(row, "solved")} solved ·{" "}
                                  {rowNum(row, "penalty")} pen
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
