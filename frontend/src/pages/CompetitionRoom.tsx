import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  getCompetition,
  getCompetitionProblems,
  getCompetitionSession,
  getLeaderboard,
  getProblem,
  joinCompetition,
  startCompetition,
  endCompetition,
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
  ProblemPublicDTO,
} from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { Loading, ErrorState, EmptyState } from "../components/Loading";
import DifficultyBadge from "../components/DifficultyBadge";
import VerdictPanel from "../components/VerdictPanel";

const MONACO_LANG: Record<string, string> = {
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  go: "go",
  java: "java",
  javascript: "javascript",
  php: "php",
  python: "python",
  ruby: "ruby",
  rust: "rust",
  typescript: "typescript",
};

const STARTER: Record<string, string> = {
  python:
    "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # your solution here\n\nif __name__ == '__main__':\n    main()\n",
  java:
    "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your solution here\n    }\n}\n",
  cpp:
    "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your solution here\n    return 0;\n}\n",
  javascript:
    "const lines = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n');\n// your solution here\n",
};

const PROBLEM_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Example = {
  input: unknown;
  output: unknown;
  explanation?: string;
};

type WorkspaceTab = "problem" | "standings";

function formatSeconds(total: number) {
  const s = Math.max(0, Math.floor(total));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function formatPenalty(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseExamples(examples?: string | Example[]): Example[] {
  if (!examples) return [];
  if (Array.isArray(examples)) return examples;
  try {
    return JSON.parse(examples) as Example[];
  } catch {
    return [];
  }
}

function parseConstraints(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* plain text */
  }
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatExample(value: unknown): string {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return String(value);
    }
  }
  if (Array.isArray(value)) return `[${value.join(", ")}]`;
  if (typeof value === "object" && value !== null) {
    return Object.entries(value)
      .map(([key, val]) => {
        if (Array.isArray(val)) return `${key} = [${val.join(", ")}]`;
        if (typeof val === "object" && val !== null) {
          return `${key} = ${JSON.stringify(val)}`;
        }
        return `${key} = ${val}`;
      })
      .join(", ");
  }
  return String(value);
}

function statusBadgeClass(status?: string) {
  switch (status) {
    case "ACTIVE":
      return "border-[var(--ok)] text-[var(--ok)]";
    case "ENDED":
      return "border-[var(--err)] text-[var(--err)]";
    default:
      return "border-[var(--line)] text-[var(--text-dim)]";
  }
}

export default function CompetitionRoom() {
  const { id } = useParams();
  const competitionId = Number(id);
  const { user } = useAuth();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [problemIds, setProblemIds] = useState<number[]>([]);
  const [problemMeta, setProblemMeta] = useState<
    Record<number, ProblemPublicDTO>
  >({});
  const [session, setSession] = useState<ContestSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [languages, setLanguages] = useState<LanguageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problemLoading, setProblemLoading] = useState(false);

  const [remaining, setRemaining] = useState(0);
  const tickRef = useRef<number | null>(null);

  const [selectedProblem, setSelectedProblem] = useState<number | null>(null);
  const [codeByProblem, setCodeByProblem] = useState<Record<number, string>>(
    {}
  );
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [language, setLanguage] = useState<LanguageDTO | null>(null);
  const [verdict, setVerdict] = useState<JudgeVerdictDTO | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("problem");
  const [splitPct, setSplitPct] = useState(48);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

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

      const preferred =
        langs.find((l) => l.slug === "python") || langs[0] || null;
      setLanguage((prev) => prev || preferred);

      if (ids.length > 0) {
        setSelectedProblem((prev) => prev ?? ids[0]);
      }

      // Prefetch titles for problem tabs (best-effort).
      const metas = await Promise.all(
        ids.map((pid) =>
          getProblem(pid)
            .then((p) => [pid, p] as const)
            .catch(() => null)
        )
      );
      const nextMeta: Record<number, ProblemPublicDTO> = {};
      for (const row of metas) {
        if (row) nextMeta[row[0]] = row[1];
      }
      setProblemMeta(nextMeta);

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

  // Load full statement when selection changes.
  useEffect(() => {
    if (!selectedProblem) return;
    if (problemMeta[selectedProblem]?.description) return;

    let cancelled = false;
    setProblemLoading(true);

    getProblem(selectedProblem)
      .then((p) => {
        if (cancelled) return;
        setProblemMeta((prev) => ({ ...prev, [selectedProblem]: p }));
      })
      .catch(() => {
        /* keep empty */
      })
      .finally(() => {
        if (!cancelled) setProblemLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProblem, problemMeta]);

  // Seed starter code per problem when language is known.
  useEffect(() => {
    if (!selectedProblem || !language) return;
    setCodeByProblem((prev) => {
      if (prev[selectedProblem]) return prev;
      return {
        ...prev,
        [selectedProblem]: STARTER[language.slug] || "",
      };
    });
  }, [selectedProblem, language]);

  useEffect(() => {
    if (tickRef.current) window.clearInterval(tickRef.current);

    if (session?.sessionStatus === "IN_PROGRESS") {
      tickRef.current = window.setInterval(() => {
        setRemaining((r) => Math.max(0, r - 1));
      }, 1000);
    }

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [session?.sessionStatus]);

  useEffect(() => {
    if (!user || !competitionId) return;

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

  useEffect(() => {
    if (
      session?.sessionStatus === "IN_PROGRESS" &&
      remaining <= 0 &&
      selectedProblem &&
      codeByProblem[selectedProblem] &&
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

  const handleEnd = async () => {
    if (!user || session?.sessionStatus !== "IN_PROGRESS") return;
    const ok = window.confirm(
      "End your contest session now? You will not be able to submit again."
    );
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      const s = await endCompetition(competitionId);
      setSession(s);
      setRemaining(s.remainingSeconds ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end session.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onMove = (clientX: number, clientY: number) => {
      if (!draggingRef.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const horizontal = window.matchMedia("(min-width: 1024px)").matches;
      let pct: number;
      if (horizontal) {
        pct = ((clientX - rect.left) / rect.width) * 100;
      } else {
        pct = ((clientY - rect.top) / rect.height) * 100;
      }
      setSplitPct(Math.min(72, Math.max(28, pct)));
    };

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const stop = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  const startResize = () => {
    draggingRef.current = true;
    document.body.style.cursor = window.matchMedia("(min-width: 1024px)").matches
      ? "col-resize"
      : "row-resize";
    document.body.style.userSelect = "none";
  };

  const handleContestSubmit = async () => {
    if (!user || !language || !selectedProblem) return;
    const code = codeByProblem[selectedProblem];
    if (!code?.trim()) return;

    setBusy(true);
    setVerdict(null);
    try {
      const res = await submitToCompetition(competitionId, {
        userId: user.id,
        problemId: selectedProblem,
        languageId: language.languageId,
        language: language.slug,
        code,
      });
      setVerdict(res);
      if (res.verdict === "Accepted") {
        setSolvedIds((prev) => new Set(prev).add(selectedProblem));
        setLeaderboard(await getLeaderboard(competitionId));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Contest submit failed."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleLanguageChange = (slug: string) => {
    const lang = languages.find((l) => l.slug === slug) || null;
    setLanguage(lang);
    if (!lang || !selectedProblem) return;
    setCodeByProblem((prev) => {
      const current = prev[selectedProblem];
      const isStarter =
        !current ||
        Object.values(STARTER).some((s) => s.trim() === current.trim());
      if (!isStarter) return prev;
      return { ...prev, [selectedProblem]: STARTER[lang.slug] || "" };
    });
  };

  const activeProblem = selectedProblem
    ? problemMeta[selectedProblem]
    : null;
  const examples = useMemo(
    () => parseExamples(activeProblem?.examples),
    [activeProblem?.examples]
  );
  const constraints = useMemo(
    () => parseConstraints(activeProblem?.constraintsData),
    [activeProblem?.constraintsData]
  );

  const code = selectedProblem ? codeByProblem[selectedProblem] || "" : "";
  const inProgress = session?.sessionStatus === "IN_PROGRESS";
  const ended =
    session?.sessionStatus === "ENDED" || competition?.status === "ENDED";
  const canSubmit = inProgress && !ended && !!selectedProblem && !!code.trim();

  const sortedBoard = useMemo(
    () => [...leaderboard].sort((a, b) => a.rank - b.rank),
    [leaderboard]
  );

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
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <p className="verdict-strip text-[var(--text-dim)]">Upcoming contest</p>
        <h2 className="display mt-2 text-2xl font-semibold">
          {competition.title || competition.name}
        </h2>
        <p className="mt-3 text-sm text-[var(--text-dim)]">
          Starts at {new Date(competition.startTime).toLocaleString()}
        </p>
        <Link
          to="/competitions"
          className="mt-6 inline-block text-sm text-[var(--info)] hover:underline"
        >
          ← Back to competitions
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col overflow-hidden">
      {/* Contest header */}
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/competitions"
                className="text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
              >
                Contests
              </Link>
              <span className="text-[var(--text-dim)]">/</span>
              <h1 className="display truncate text-lg font-semibold sm:text-xl">
                {competition?.title ||
                  competition?.name ||
                  `Competition #${competitionId}`}
              </h1>
              <span
                className={`verdict-strip rounded border px-2 py-0.5 ${statusBadgeClass(competition?.status)}`}
              >
                {competition?.status}
              </span>
            </div>
            {error && (
              <p className="mt-1 text-xs text-[var(--err)]">{error}</p>
            )}
          </div>

          {inProgress && (
            <div
              className="mono rounded-md border border-[var(--accent)] bg-[var(--bg-raised)] px-4 py-2 text-xl font-semibold tracking-wider"
              style={{ color: remaining <= 300 ? "var(--err)" : "var(--accent)" }}
              title="Time remaining"
            >
              {formatSeconds(remaining)}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!session && (
              <button
                onClick={handleJoin}
                disabled={busy || ended}
                className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#0a0d12] hover:brightness-110 disabled:opacity-40"
              >
                Join contest
              </button>
            )}
            {session?.sessionStatus === "JOINED" && (
              <button
                onClick={handleStart}
                disabled={busy || ended}
                className="rounded-md bg-[var(--ok)] px-4 py-2 text-sm font-medium text-[#0a0d12] hover:brightness-110 disabled:opacity-40"
              >
                Start timer
              </button>
            )}
            {inProgress && (
              <button
                onClick={handleEnd}
                disabled={busy}
                className="rounded-md border border-[var(--err)] px-4 py-2 text-sm font-medium text-[var(--err)] hover:bg-[var(--err)]/10 disabled:opacity-40"
              >
                End competition
              </button>
            )}
            {ended && (
              <span className="verdict-strip rounded border border-[var(--line)] px-2 py-1 text-[var(--text-dim)]">
                Session ended
              </span>
            )}
          </div>
        </div>

        {/* Problem tabs */}
        <div className="mx-auto flex max-w-[1600px] items-end gap-1 overflow-x-auto px-4 sm:px-5">
          {problemIds.length === 0 ? (
            <p className="pb-3 text-sm text-[var(--text-dim)]">
              No problems in this contest yet.
            </p>
          ) : (
            problemIds.map((pid, index) => {
              const letter = PROBLEM_LETTERS[index] || String(index + 1);
              const meta = problemMeta[pid];
              const active = selectedProblem === pid;
              const solved = solvedIds.has(pid);
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => {
                    setSelectedProblem(pid);
                    setVerdict(null);
                    setWorkspaceTab("problem");
                  }}
                  className={`group flex min-w-[7.5rem] flex-col border-b-2 px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-[var(--accent)] bg-[var(--bg-raised)]"
                      : "border-transparent hover:bg-[var(--bg-raised)]/60"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`mono text-sm font-semibold ${
                        solved
                          ? "text-[var(--ok)]"
                          : active
                            ? "text-[var(--accent)]"
                            : "text-[var(--text-dim)]"
                      }`}
                    >
                      {letter}
                    </span>
                    {solved && (
                      <span className="text-[10px] text-[var(--ok)]">●</span>
                    )}
                  </span>
                  <span
                    className={`max-w-[10rem] truncate text-xs ${
                      active ? "text-[var(--text)]" : "text-[var(--text-dim)]"
                    }`}
                  >
                    {meta?.title || `Problem ${pid}`}
                  </span>
                </button>
              );
            })
          )}

          <div className="ml-auto flex shrink-0 gap-1 pb-1">
            <button
              type="button"
              onClick={() => setWorkspaceTab("problem")}
              className={`verdict-strip rounded px-2 py-1 ${
                workspaceTab === "problem"
                  ? "bg-[var(--bg-raised)] text-[var(--accent)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text)]"
              }`}
            >
              Problem
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("standings")}
              className={`verdict-strip rounded px-2 py-1 ${
                workspaceTab === "standings"
                  ? "bg-[var(--bg-raised)] text-[var(--accent)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text)]"
              }`}
            >
              Standings ({sortedBoard.length})
            </button>
          </div>
        </div>
      </header>

      {workspaceTab === "standings" ? (
        <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-5">
          <div className="overflow-hidden rounded-lg border border-[var(--line)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--bg-raised)]">
                <tr className="verdict-strip text-[var(--text-dim)]">
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">Participant</th>
                  <th className="px-4 py-3 font-medium">Solved</th>
                  <th className="px-4 py-3 font-medium">Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {sortedBoard.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10">
                      <EmptyState message="No submissions yet. Be the first on the board." />
                    </td>
                  </tr>
                ) : (
                  sortedBoard.map((e) => {
                    const isMe = e.userId === user.id;
                    return (
                      <tr
                        key={e.userId}
                        className={
                          isMe ? "bg-[var(--accent)]/5" : "hover:bg-[var(--bg-raised)]/50"
                        }
                      >
                        <td className="mono px-4 py-3 text-[var(--text-dim)]">
                          #{e.rank}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {e.userName}
                          {isMe && (
                            <span className="ml-2 text-xs text-[var(--accent)]">
                              you
                            </span>
                          )}
                        </td>
                        <td className="mono px-4 py-3 text-[var(--ok)]">
                          {e.solved}
                        </td>
                        <td className="mono px-4 py-3 text-[var(--text-dim)]">
                          {formatPenalty(e.totalTime)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          ref={splitRef}
          className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col lg:flex-row"
        >
          {/* Statement */}
          <section
            className="flex min-h-0 flex-col overflow-hidden border-[var(--line)] lg:border-r"
            style={{
              flexBasis: `${splitPct}%`,
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--bg-raised)] px-4 py-2.5">
              <div className="min-w-0">
                {activeProblem ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="display truncate text-base font-semibold">
                      {PROBLEM_LETTERS[problemIds.indexOf(selectedProblem!)] ||
                        "#"}
                      . {activeProblem.title}
                    </h2>
                    <DifficultyBadge difficulty={activeProblem.difficulty} />
                  </div>
                ) : (
                  <span className="text-sm text-[var(--text-dim)]">
                    Select a problem
                  </span>
                )}
              </div>
              {selectedProblem && (
                <Link
                  to={`/problems/${selectedProblem}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs text-[var(--info)] hover:underline"
                >
                  Open full page ↗
                </Link>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              {!selectedProblem ? (
                <EmptyState message="Pick a problem from the tabs above." />
              ) : problemLoading && !activeProblem ? (
                <Loading label="Loading statement" />
              ) : !activeProblem ? (
                <EmptyState message="Could not load this problem." />
              ) : (
                <div className="space-y-6">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
                    {activeProblem.description}
                  </div>

                  {examples.length > 0 && (
                    <div>
                      <h3 className="verdict-strip mb-3 text-[var(--text-dim)]">
                        Examples
                      </h3>
                      <div className="space-y-3">
                        {examples.map((ex, i) => (
                          <div
                            key={i}
                            className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] p-3"
                          >
                            <p className="verdict-strip mb-2 text-[var(--text-dim)]">
                              Example {i + 1}
                            </p>
                            <div className="mono space-y-2 text-xs">
                              <div>
                                <span className="text-[var(--text-dim)]">
                                  Input:{" "}
                                </span>
                                <span className="text-[var(--text)]">
                                  {formatExample(ex.input)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[var(--text-dim)]">
                                  Output:{" "}
                                </span>
                                <span className="text-[var(--ok)]">
                                  {formatExample(ex.output)}
                                </span>
                              </div>
                              {ex.explanation && (
                                <p className="font-sans text-[var(--text-dim)]">
                                  {ex.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {constraints.length > 0 && (
                    <div>
                      <h3 className="verdict-strip mb-3 text-[var(--text-dim)]">
                        Constraints
                      </h3>
                      <ul className="list-inside list-disc space-y-1 text-sm text-[var(--text-dim)]">
                        {constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Resize handle */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize editor"
            onMouseDown={(e) => {
              e.preventDefault();
              startResize();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              startResize();
            }}
            className="group relative z-10 flex h-3 shrink-0 cursor-row-resize items-center justify-center border-y border-[var(--line)] bg-[var(--bg-raised)] hover:bg-[var(--accent)]/15 lg:h-auto lg:w-2 lg:cursor-col-resize lg:border-x lg:border-y-0"
          >
            <div className="h-1 w-10 rounded-full bg-[var(--line)] group-hover:bg-[var(--accent)] lg:h-10 lg:w-1" />
          </div>

          {/* Editor */}
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2">
              <select
                value={language?.slug || ""}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={!inProgress}
                className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs disabled:opacity-50"
              >
                {languages.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name}
                  </option>
                ))}
              </select>

              <div className="ml-auto flex items-center gap-2">
                {!inProgress && !ended && (
                  <span className="text-xs text-[var(--text-dim)]">
                    {session
                      ? "Start your timer to submit"
                      : "Join the contest to submit"}
                  </span>
                )}
                <button
                  onClick={handleContestSubmit}
                  disabled={busy || !canSubmit}
                  className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-[#0a0d12] hover:brightness-110 disabled:opacity-40"
                >
                  {busy ? "Submitting…" : "Submit"}
                </button>
              </div>
            </div>

            <div className="min-h-[220px] flex-1 bg-[var(--bg-inset)]">
              <Editor
                height="100%"
                theme="vs-dark"
                language={
                  language
                    ? MONACO_LANG[language.slug] || language.slug
                    : "plaintext"
                }
                value={code}
                onChange={(value) => {
                  if (!selectedProblem) return;
                  setCodeByProblem((prev) => ({
                    ...prev,
                    [selectedProblem]: value ?? "",
                  }));
                }}
                options={{
                  fontSize: 13,
                  fontFamily: "JetBrains Mono, monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 12 },
                  readOnly: !inProgress || ended,
                  automaticLayout: true,
                  tabSize: 2,
                }}
              />
            </div>

            {verdict && (
              <div className="border-t border-[var(--line)] p-3">
                <VerdictPanel verdict={verdict} />
              </div>
            )}

            {!verdict && inProgress && (
              <div className="border-t border-[var(--line)] px-4 py-2 text-xs text-[var(--text-dim)]">
                Submissions count toward the live leaderboard. Programs must read
                stdin and write stdout.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
