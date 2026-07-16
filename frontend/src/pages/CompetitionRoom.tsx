import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getCompetition,
  getCompetitionProblems,
  getCompetitionSession,
  getLeaderboard,
  joinCompetition,
  startCompetition,
  submitToCompetition,
  getLanguages,

} from "../lib/api";
import {
  leaderboardTopic,
  sessionTopic,
  statusTopic,
  subscribeTopic,
} from "../lib/ws";
import type {
  Competition,
  ContestSession,
  JudgeVerdictDTO,
  LanguageDTO,
  LeaderboardEntry,
} from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { Loading, ErrorState, EmptyState } from "../components/Loading";

function formatSeconds(total: number) {
  const s = Math.max(0, Math.floor(total));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export default function CompetitionRoom() {
  const { id } = useParams();
  const competitionId = Number(id);
  const { user } = useAuth();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [problemIds, setProblemIds] = useState<number[]>([]);
  const [session, setSession] = useState<ContestSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [languages, setLanguages] = useState<LanguageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [remaining, setRemaining] = useState(0);
  const tickRef = useRef<number | null>(null);

  const [selectedProblem, setSelectedProblem] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<LanguageDTO | null>(null);
  const [verdict, setVerdict] = useState<JudgeVerdictDTO | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [comp, ids, board, langs] = await Promise.all([
        getCompetition(competitionId),
        getCompetitionProblems(competitionId),
        getLeaderboard(competitionId).catch(() => []),
        getLanguages(),
      ]);

      setCompetition(comp);
      setProblemIds(ids);
      setLeaderboard(board);
      setLanguages(langs);
      setLanguage(langs[0] || null);

      try {
        const s = await getCompetitionSession(competitionId, user.id);
        setSession(s);
        setRemaining(s.remainingSeconds ?? 0);
      } catch {
        setSession(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load competition."
      );
    } finally {
      setLoading(false);
    }
  }, [competitionId, user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Local countdown ticking between server updates.
  useEffect(() => {
    if (tickRef.current) window.clearInterval(tickRef.current);

    if (session?.status === "IN_PROGRESS") {
      tickRef.current = window.setInterval(() => {
        setRemaining((r) => Math.max(0, r - 1));
      }, 1000);
    }

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [session?.status]);

  // Live subscriptions: leaderboard, contest status, personal session.
  useEffect(() => {
    if (!user || !competitionId ) return;

    const unsubs = [
      subscribeTopic<LeaderboardEntry[]>(
        leaderboardTopic(competitionId),
        setLeaderboard
      ),
      subscribeTopic<Competition>(statusTopic(competitionId), (c) =>
        setCompetition((prev) => ({ ...prev, ...c }))
      ),
      subscribeTopic<ContestSession>(
        sessionTopic(competitionId, user.id),
        (s) => {
          setSession(s);
          setRemaining(s.remainingSeconds ?? 0);
        }
      ),
    ];

    return () => unsubs.forEach((u) => u());
  }, [competitionId, user]);

  // Auto-submit when the personal timer hits zero.
  useEffect(() => {
    if (
      session?.status === "IN_PROGRESS" &&
      remaining <= 0 &&
      code &&
      language &&
      user
    ) {
      handleContestSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const handleJoin = async () => {
    if (!user) return;

    setBusy(true);
    try {
      await joinCompetition(competitionId, user.id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join.");
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    if (!user) return;

    setBusy(true);
    try {
      await startCompetition(competitionId, user.id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start.");
    } finally {
      setBusy(false);
    }
  };

  const handleContestSubmit = async () => {
    if (!user || !language || !selectedProblem) return;

    setBusy(true);
    try {
      const res = await submitToCompetition(competitionId, {
        userId: user.id,
        problemId: selectedProblem,
        languageId: language.languageId,
        language: language.slug,
        code,
      });
      setVerdict(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Contest submit failed."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <ErrorState message="Log in to join this competition." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Loading label="Loading competition" />
      </div>
    );
  }

  if (error && !competition) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <ErrorState message={error} />
      </div>
    );
  }

  if (competition?.status === "UPCOMING") {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <h2 className="text-lg font-semibold">{competition.title}</h2>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          This contest hasn't started yet. It begins at{" "}
          {new Date(competition.startTime).toLocaleString()}.
        </p>
        <Link
          to="/competitions"
          className="mt-4 inline-block text-[var(--accent)] underline"
        >
          Back to competitions
        </Link>
      </div>
    );
  }

  const ended =
    session?.status === "ENDED" || competition?.status === "ENDED";

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="display text-2xl font-semibold">
          {competition?.title ||
            competition?.name ||
            `Competition #${competitionId}`}
        </h1>

        <span className="verdict-strip rounded border border-[var(--line)] px-2 py-1 text-[var(--text-dim)]">
          {competition?.status}
        </span>
      </div>

      {!session && (
        <button
          onClick={handleJoin}
          disabled={busy}
          className="mb-6 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#0a0d12] hover:brightness-110 disabled:opacity-40"
        >
          Join competition
        </button>
      )}

      {session?.status === "JOINED" && (
        <button
          onClick={handleStart}
          disabled={busy}
          className="mb-6 rounded-md bg-[var(--ok)] px-4 py-2 text-sm font-medium text-[#0a0d12] hover:brightness-110 disabled:opacity-40"
        >
          Start my timer
        </button>
      )}

      {session?.status === "IN_PROGRESS" && (
        <div
          className="mono mb-6 inline-block rounded-lg border border-[var(--accent)] px-4 py-2 text-xl"
          style={{ color: "var(--accent)" }}
        >
          {formatSeconds(remaining)}
        </div>
      )}

      {ended && (
        <div className="mb-6 rounded-lg border border-[var(--line)] p-3 text-sm text-[var(--text-dim)]">
          This session has ended. Submissions are disabled.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <h2 className="verdict-strip mb-2 text-[var(--text-dim)]">
              Problem set
            </h2>

            {problemIds.length === 0 ? (
              <EmptyState message="No problems added to this competition yet." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {problemIds.map((pid) => (
                  <button
                    key={pid}
                    onClick={() => setSelectedProblem(pid)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      selectedProblem === pid
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--line)] text-[var(--text-dim)] hover:text-[var(--text)]"
                    }`}
                  >
                    <Link
                      to={`/problems/${pid}`}
                      className="mr-2 underline decoration-dotted"
                      onClick={(e) => e.stopPropagation()}
                    >
                      #{pid}
                    </Link>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProblem && session?.status === "IN_PROGRESS" && (
            <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Submit for problem #{selectedProblem}
                </h3>

                <select
                  value={language?.slug || ""}
                  onChange={(e) =>
                    setLanguage(
                      languages.find((l) => l.slug === e.target.value) || null
                    )
                  }
                  className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-2 py-1 text-xs"
                >
                  {languages.map((l) => (
                    <option key={l.slug} value={l.slug}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={10}
                placeholder="Paste or write your full stdin/stdout program here..."
                className="mono w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] p-3 text-xs focus:border-[var(--info)] focus:outline-none"
              />

              <button
                onClick={handleContestSubmit}
                disabled={busy || !code}
                className="mt-3 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#0a0d12] hover:brightness-110 disabled:opacity-40"
              >
                Submit
              </button>

              {verdict && (
                <div className="mt-3 text-sm">
                  <span
                    style={{
                      color:
                        verdict.verdict === "Accepted"
                          ? "var(--ok)"
                          : "var(--err)",
                    }}
                  >
                    {verdict.verdict}
                  </span>{" "}
                  —{" "}
                  {verdict.hiddenSummary
                    ? `${verdict.hiddenSummary.passed}/${verdict.hiddenSummary.total} passed`
                    : "Result available"}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h2 className="verdict-strip mb-2 text-[var(--text-dim)]">
            Leaderboard
          </h2>

          <div className="divide-y divide-[var(--line)] rounded-lg border border-[var(--line)]">
            {leaderboard.length === 0 ? (
              <EmptyState message="No submissions yet." />
            ) : (
              leaderboard
                .sort((a, b) => a.rank - b.rank)
                .map((e) => (
                  <div
                    key={e.userId}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-[var(--text-dim)]">#{e.rank}</span>
                    <span className="text-[var(--text)]">{e.userName}</span>
                    <span className="mono text-xs text-[var(--text-dim)]">
                      {e.solved} solved
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}