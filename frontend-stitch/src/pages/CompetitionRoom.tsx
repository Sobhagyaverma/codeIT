import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { IoPre } from "../components/IoPre";
import { useAuth } from "../context/AuthContext";
import {
  formatDuration,
  formatSecondsClock,
  toContestCard,
} from "../features/competitions/adapters";
import type { ContestCardModel } from "../features/competitions/types";
import {
  ApiError,
  endCompetition,
  getCompetition,
  getCompetitionProblems,
  getCompetitionSession,
  getLanguages,
  getLeaderboard,
  getProblem,
  joinCompetition,
  startCompetition,
  submitToCompetition,
  type ContestSession,
  type JudgeVerdictDTO,
  type LanguageDTO,
  type LeaderboardEntry,
  type ProblemPublicDTO,
} from "../lib/api";
import {
  loadContestCodeDraft,
  pickPreferredLanguage,
  saveContestCodeDraft,
  setPreferredLanguage,
} from "../lib/editorPrefs";
import {
  exampleOutputToExpected,
  formatExample,
  parseExamples,
  resolveSampleStdin,
} from "../lib/examples";
import { CODEIT_THEME, defineCodeitTheme } from "../lib/monacoTheme";
import {
  runSampleTests,
  type SampleRunSession,
} from "../lib/runSampleTests";

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

const FALLBACK_LANGUAGES: LanguageDTO[] = [
  { slug: "python", name: "Python 3", languageId: 71 },
  { slug: "java", name: "Java", languageId: 62 },
  { slug: "cpp", name: "C++", languageId: 54 },
  { slug: "javascript", name: "JavaScript", languageId: 63 },
];

const PROBLEM_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type WorkspaceTab = "problem" | "standings";
type BottomTab = "testcase" | "result";

function difficultyClass(d?: string) {
  const x = (d || "").toUpperCase();
  if (x === "EASY") return "border-easy/20 bg-easy/10 text-easy";
  if (x === "MEDIUM") return "border-amber-500/20 bg-amber-500/10 text-amber-500";
  if (x === "HARD") return "border-hard/20 bg-hard/10 text-hard";
  return "border-outline-variant/20 bg-surface-container text-on-surface-variant";
}

function formatPenalty(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CompetitionRoom() {
  const { id } = useParams();
  const competitionId = Number(id);
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const [contest, setContest] = useState<ContestCardModel | null>(null);
  const [problemIds, setProblemIds] = useState<number[]>([]);
  const [problems, setProblems] = useState<Record<number, ProblemPublicDTO>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [session, setSession] = useState<ContestSession | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [languages, setLanguages] = useState<LanguageDTO[]>(FALLBACK_LANGUAGES);
  const [language, setLanguage] = useState<LanguageDTO | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<JudgeVerdictDTO | null>(null);
  const [runSession, setRunSession] = useState<SampleRunSession | null>(null);
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcase");
  const [caseStdins, setCaseStdins] = useState<string[]>([]);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [splitPct, setSplitPct] = useState(48);
  const [editorPct, setEditorPct] = useState(62);

  const runAbortRef = useRef<AbortController | null>(null);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const editorSplitRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const draggingEditorRef = useRef(false);

  const workspaceTab: WorkspaceTab =
    params.get("tab") === "standings" ? "standings" : "problem";
  const setWorkspaceTab = (tab: WorkspaceTab) => {
    const copy = new URLSearchParams(params);
    if (tab === "problem") copy.delete("tab");
    else copy.set("tab", tab);
    setParams(copy, { replace: true });
  };

  const activeProblemId = problemIds[activeIdx] ?? null;
  const problem = activeProblemId != null ? problems[activeProblemId] : null;
  const examples = useMemo(
    () => parseExamples(problem?.examples as string | undefined),
    [problem]
  );

  useEffect(() => {
    if (!Number.isFinite(competitionId) || competitionId <= 0) {
      setError("Invalid competition id.");
      setLoading(false);
      return;
    }
    if (!user) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [comp, ids, langs] = await Promise.all([
          getCompetition(competitionId),
          getCompetitionProblems(competitionId),
          getLanguages().catch(() => FALLBACK_LANGUAGES),
        ]);
        if (cancelled) return;

        const [participants] = await Promise.all([
          // ignore failures
          Promise.resolve(null),
        ]);
        void participants;

        setContest(
          toContestCard(comp, {
            problemCount: ids.length,
            participantCount: null,
          })
        );
        setProblemIds(ids);
        setLanguages(langs.length ? langs : FALLBACK_LANGUAGES);
        setLanguage(pickPreferredLanguage(langs.length ? langs : FALLBACK_LANGUAGES));

        const problemEntries = await Promise.all(
          ids.map(async (pid) => {
            try {
              return [pid, await getProblem(pid)] as const;
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        const map: Record<number, ProblemPublicDTO> = {};
        for (const entry of problemEntries) {
          if (entry) map[entry[0]] = entry[1];
        }
        setProblems(map);

        try {
          const sess = await getCompetitionSession(competitionId, user.id);
          if (!cancelled) {
            setSession(sess);
            if (typeof sess.remainingSeconds === "number") {
              setRemaining(sess.remainingSeconds);
            }
          }
        } catch {
          /* not joined yet */
        }

        try {
          const lb = await getLeaderboard(competitionId);
          if (!cancelled) setBoard(lb);
        } catch {
          /* ignore */
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load competition."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      runAbortRef.current?.abort();
    };
  }, [competitionId, user]);

  useEffect(() => {
    if (!contest) return;
    const tick = () => {
      if (session?.sessionStatus === "IN_PROGRESS" && session.deadlineAt) {
        const left = Math.max(
          0,
          Math.floor((Date.parse(session.deadlineAt) - Date.now()) / 1000)
        );
        setRemaining(left);
        return;
      }
      const end = Date.parse(contest.endTime);
      if (Number.isFinite(end)) {
        setRemaining(Math.max(0, Math.floor((end - Date.now()) / 1000)));
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [contest, session]);

  useEffect(() => {
    if (!language || activeProblemId == null || !Number.isFinite(competitionId))
      return;
    const draft = loadContestCodeDraft(
      competitionId,
      activeProblemId,
      language.slug
    );
    setCode(draft ?? STARTER[language.slug] ?? "");
    const p = problems[activeProblemId];
    const exs = parseExamples(p?.examples as string | undefined);
    setCaseStdins(exs.map((ex) => resolveSampleStdin(undefined, ex.input)));
    setActiveCaseIdx(0);
    setVerdict(null);
    setRunSession(null);
    setBottomTab("testcase");
  }, [activeProblemId, language?.slug, competitionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!language || activeProblemId == null || loading) return;
    const t = window.setTimeout(() => {
      saveContestCodeDraft(
        competitionId,
        activeProblemId,
        language.slug,
        code
      );
    }, 400);
    return () => window.clearTimeout(t);
  }, [code, language, activeProblemId, competitionId, loading]);

  useEffect(() => {
    const onMove = (clientX: number, clientY: number) => {
      if (draggingRef.current && splitRef.current) {
        const rect = splitRef.current.getBoundingClientRect();
        const pct = ((clientX - rect.left) / rect.width) * 100;
        setSplitPct(Math.min(70, Math.max(30, pct)));
      }
      if (draggingEditorRef.current && editorSplitRef.current) {
        const rect = editorSplitRef.current.getBoundingClientRect();
        const pct = ((clientY - rect.top) / rect.height) * 100;
        setEditorPct(Math.min(80, Math.max(35, pct)));
      }
    };
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const stop = () => {
      draggingRef.current = false;
      draggingEditorRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stop);
    };
  }, []);

  const handleLanguageChange = (slug: string) => {
    if (language && activeProblemId != null) {
      saveContestCodeDraft(competitionId, activeProblemId, language.slug, code);
    }
    const lang = languages.find((l) => l.slug === slug) || null;
    setLanguage(lang);
    setLangOpen(false);
    if (lang) setPreferredLanguage(lang.slug);
  };

  const ensureSession = async () => {
    if (!user) throw new Error("Log in to compete.");
    if (session?.sessionStatus === "IN_PROGRESS") return session;
    setBusy(true);
    try {
      await joinCompetition(competitionId, user.id).catch(() => undefined);
      const started = await startCompetition(competitionId, user.id);
      setSession(started);
      if (typeof started.remainingSeconds === "number") {
        setRemaining(started.remainingSeconds);
      }
      return started;
    } finally {
      setBusy(false);
    }
  };

  const handleEndSession = async () => {
    if (!user) return;
    setBusy(true);
    setActionError(null);
    try {
      const ended = await endCompetition(competitionId);
      setSession(ended);
      setRemaining(0);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to end session."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRun = async () => {
    if (!language || !user) {
      setActionError("Log in to run code.");
      return;
    }
    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;
    setRunning(true);
    setActionError(null);
    setRunSession(null);
    setVerdict(null);
    setBottomTab("result");
    try {
      const samples =
        examples.length > 0
          ? examples.map((ex, i) => {
              const stdin = resolveSampleStdin(caseStdins[i], ex.input);
              return {
                stdin,
                expectedOutput: exampleOutputToExpected(ex.output),
                inputDisplay: stdin || "(empty)",
              };
            })
          : undefined;
      const customStdin =
        examples.length === 0
          ? caseStdins[0] || ""
          : undefined;
      const result = await runSampleTests({
        sourceCode: code,
        languageId: language.languageId,
        samples,
        customStdin,
        signal: controller.signal,
      });
      setRunSession(result);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setActionError(err instanceof Error ? err.message : "Run failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!language || !user || activeProblemId == null) {
      setActionError("Log in to submit.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    setVerdict(null);
    setRunSession(null);
    setBottomTab("result");
    try {
      await ensureSession();
      const res = await submitToCompetition(competitionId, {
        userId: user.id,
        problemId: activeProblemId,
        languageId: language.languageId,
        language: language.slug,
        code,
      });
      setVerdict(res);
      const ok =
        res.passed === true ||
        /ac|accepted/i.test(res.verdict || "");
      if (ok) {
        setSolvedIds((prev) => new Set(prev).add(activeProblemId));
      }
      try {
        setBoard(await getLeaderboard(competitionId));
      } catch {
        /* ignore */
      }
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Submit failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-on-surface">
        <AppNav activeHint="/competitions" />
        <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 pt-16 text-center">
          <p className="font-headline-lg-mobile text-headline-lg-mobile">
            Sign in to enter the contest room
          </p>
          <Link to="/login" className="text-primary hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-on-surface">
        <AppNav activeHint="/competitions" />
        <div className="flex flex-1 items-center justify-center pt-16">
          <p className="text-on-surface-variant">Loading contest…</p>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-on-surface">
        <AppNav activeHint="/competitions" />
        <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 pt-16 text-center">
          <p className="text-hard">{error || "Contest not found"}</p>
          <Link to="/competitions" className="text-primary hover:underline">
            Back to Competitions
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel =
    contest.status === "ACTIVE"
      ? "LIVE"
      : contest.status === "UPCOMING"
        ? "UPCOMING"
        : "ENDED";

  return (
    <div className="font-body-md flex h-screen flex-col overflow-hidden bg-background text-on-background antialiased">
      <AppNav activeHint="/competitions" />

      <main className="mx-auto flex h-screen w-full max-w-container-max flex-1 flex-col overflow-hidden pt-16">
        {/* Contest header */}
        <header className="glass-panel relative z-40 flex flex-shrink-0 items-center justify-between px-gutter py-4">
          <div className="flex flex-col gap-2">
            <Link
              to="/competitions"
              className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              Competitions
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                {contest.title}
              </h1>
              <div
                className={`flex items-center gap-1.5 rounded-sm border px-2 py-0.5 ${
                  contest.status === "ACTIVE"
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-outline-variant/20 bg-surface-container"
                }`}
              >
                {contest.status === "ACTIVE" && (
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                )}
                <span
                  className={`font-label-md text-xs font-bold tracking-wider ${
                    contest.status === "ACTIVE"
                      ? "text-emerald-400"
                      : "text-on-surface-variant"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {contest.problemCount != null && (
                <span className="rounded-sm border border-outline-variant/20 bg-surface-container-highest px-2 py-0.5 font-code-sm text-xs text-on-surface-variant">
                  {contest.problemCount} problems
                </span>
              )}
              <span className="rounded-sm border border-outline-variant/20 bg-surface-container-highest px-2 py-0.5 font-code-sm text-xs text-on-surface-variant">
                {formatDuration(contest.durationMinutes)}
              </span>
              {contest.contestType && (
                <span className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-0.5 font-code-sm text-xs text-primary">
                  {contest.contestType}
                </span>
              )}
              {contest.difficulty && (
                <span className="rounded-sm border border-outline-variant/20 bg-surface-container-highest px-2 py-0.5 font-code-sm text-xs text-on-surface-variant">
                  {contest.difficulty}
                </span>
              )}
            </div>
          </div>

          <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center justify-center">
            <div className="rounded-sm border border-primary/20 bg-surface-container-low px-6 py-2 font-code-sm text-3xl font-bold tracking-widest text-primary [text-shadow:0_0_8px_rgba(183,109,255,0.4)] shadow-[0_0_10px_rgba(183,109,255,0.3)]">
              {remaining != null ? formatSecondsClock(remaining) : "--:--:--"}
            </div>
            <span className="mt-1 font-label-md text-xs tracking-widest text-on-surface-variant uppercase">
              Time Remaining
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={busy || session?.sessionStatus === "ENDED"}
              onClick={() => void handleEndSession()}
              className="flex items-center gap-2 rounded-sm border border-error/50 px-4 py-2 font-label-md text-label-md text-error transition-all hover:border-error hover:bg-error/10 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">
                power_settings_new
              </span>
              End session
            </button>
          </div>
        </header>

        {/* Controls strip */}
        <div className="z-30 flex flex-shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest px-gutter py-2">
          <div className="flex items-center gap-1">
            {problemIds.map((pid, idx) => {
              const letter = PROBLEM_LETTERS[idx] || String(idx + 1);
              const active = idx === activeIdx;
              const solved = solvedIds.has(pid);
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => {
                    setActiveIdx(idx);
                    setWorkspaceTab("problem");
                  }}
                  className={`group relative flex h-10 w-10 flex-col items-center justify-center rounded-sm transition-colors ${
                    active
                      ? "border-b-2 border-primary bg-surface-container"
                      : "hover:bg-surface-container"
                  }`}
                >
                  <span
                    className={`font-code-sm font-bold ${
                      active
                        ? "text-primary"
                        : "text-on-surface-variant group-hover:text-on-surface"
                    }`}
                  >
                    {letter}
                  </span>
                  {solved && (
                    <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 rounded-sm border border-outline-variant/20 bg-surface-container p-1">
            <button
              type="button"
              onClick={() => setWorkspaceTab("problem")}
              className={`flex items-center gap-2 rounded-sm px-3 py-1.5 font-label-md text-label-md transition-colors ${
                workspaceTab === "problem"
                  ? "border border-primary/20 bg-primary/20 text-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                description
              </span>
              Problem
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("standings")}
              className={`flex items-center gap-2 rounded-sm px-3 py-1.5 font-label-md text-label-md transition-colors ${
                workspaceTab === "standings"
                  ? "border border-primary/20 bg-primary/20 text-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                leaderboard
              </span>
              Standings ({board.length})
            </button>
          </div>
        </div>

        {actionError && (
          <p className="border-b border-hard/20 bg-hard/5 px-gutter py-2 text-sm text-hard">
            {actionError}
          </p>
        )}

        {workspaceTab === "standings" ? (
          <div className="flex-1 overflow-auto p-6 md:p-8">
            <div className="glass-panel overflow-hidden rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-outline-variant/20 bg-surface-container-low text-xs tracking-wider text-on-surface-variant uppercase">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Solved</th>
                    <th className="px-4 py-3">Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {board.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-on-surface-variant"
                      >
                        No standings yet.
                      </td>
                    </tr>
                  ) : (
                    board.map((row) => (
                      <tr
                        key={row.userId}
                        className="border-b border-outline-variant/10 hover:bg-surface-container/40"
                      >
                        <td className="mono px-4 py-3 text-primary">
                          #{row.rank}
                        </td>
                        <td className="px-4 py-3 text-on-surface">
                          {row.userName}
                          {user && row.userId === user.id && (
                            <span className="ml-2 text-xs text-primary">
                              (you)
                            </span>
                          )}
                        </td>
                        <td className="mono px-4 py-3">{row.solved}</td>
                        <td className="mono px-4 py-3 text-on-surface-variant">
                          {formatPenalty(row.totalTime)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div ref={splitRef} className="relative flex min-h-0 flex-1">
            <div
              className="flex min-h-0 flex-col border-r border-outline-variant/20 bg-surface"
              style={{ width: `${splitPct}%` }}
            >
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {!problem ? (
                  <p className="text-on-surface-variant">
                    Select a problem to begin.
                  </p>
                ) : (
                  <>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="font-label-md text-xs tracking-widest text-on-surface-variant uppercase">
                        Problem Statement
                      </span>
                    </div>
                    <div className="mb-8 flex items-start justify-between gap-4">
                      <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
                        {PROBLEM_LETTERS[activeIdx] || activeIdx + 1}.{" "}
                        {problem.title}
                      </h2>
                      <span
                        className={`rounded-sm border px-2 py-1 font-label-md text-xs font-bold ${difficultyClass(problem.difficulty)}`}
                      >
                        {problem.difficulty}
                      </span>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <p className="mb-6 whitespace-pre-wrap font-body-md leading-relaxed text-on-surface-variant">
                        {problem.description}
                      </p>
                      {examples.map((ex, i) => (
                        <div key={i} className="mb-8">
                          <h3 className="mb-3 border-b border-outline-variant/20 pb-2 font-label-md text-label-md font-bold text-on-surface">
                            Example {i + 1}
                          </h3>
                          <div className="rounded-sm border border-outline-variant/10 bg-surface-container-low p-4 font-code-sm text-code-sm">
                            <div className="mb-2">
                              <span className="font-bold text-on-surface-variant">
                                Input:
                              </span>{" "}
                              <IoPre className="mt-1 text-primary-fixed">
                                {formatExample(ex.input) || "(empty)"}
                              </IoPre>
                            </div>
                            <div>
                              <span className="font-bold text-on-surface-variant">
                                Output:
                              </span>{" "}
                              <IoPre className="mt-1 text-primary-fixed">
                                {formatExample(ex.output) || "(empty)"}
                              </IoPre>
                            </div>
                          </div>
                        </div>
                      ))}
                      {problem.constraints && (
                        <div className="mb-8">
                          <h3 className="mb-3 border-b border-outline-variant/20 pb-2 font-label-md text-label-md font-bold text-on-surface">
                            Constraints
                          </h3>
                          <pre className="whitespace-pre-wrap font-code-sm text-code-sm text-on-surface-variant">
                            {problem.constraints}
                          </pre>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={() => {
                draggingRef.current = true;
                document.body.style.cursor = "col-resize";
                document.body.style.userSelect = "none";
              }}
              className="absolute top-0 bottom-0 z-20 flex w-1 -translate-x-1/2 cursor-col-resize items-center justify-center bg-outline-variant/20 hover:bg-primary/50"
              style={{ left: `${splitPct}%` }}
            >
              <div className="h-8 w-1 rounded-full bg-outline-variant/50" />
            </div>

            <div
              ref={editorSplitRef}
              className="flex min-h-0 flex-1 flex-col bg-surface-container-lowest"
            >
              <div className="flex flex-shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface-container-low px-4 py-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setLangOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-sm border border-outline-variant/20 bg-surface px-3 py-1.5 transition-colors hover:bg-surface-container-high"
                  >
                    <span className="font-code-sm text-code-sm text-on-surface">
                      {language?.name || "Language"}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      expand_more
                    </span>
                  </button>
                  {langOpen && (
                    <div className="absolute top-full left-0 z-30 mt-1 max-h-56 w-48 overflow-auto rounded-sm border border-outline-variant/30 bg-surface-container shadow-xl">
                      {languages.map((l) => (
                        <button
                          key={l.slug}
                          type="button"
                          onClick={() => handleLanguageChange(l.slug)}
                          className="block w-full px-3 py-2 text-left font-code-sm text-sm hover:bg-primary/10"
                        >
                          {l.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={running || !problem}
                    onClick={() => void handleRun()}
                    className="flex items-center gap-2 rounded-sm border border-outline-variant/50 px-4 py-1.5 font-label-md text-label-md text-on-surface-variant transition-all hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      play_arrow
                    </span>
                    {running ? "Running…" : "Run"}
                  </button>
                  <button
                    type="button"
                    disabled={submitting || busy || !problem}
                    onClick={() => void handleSubmit()}
                    className="flex items-center gap-2 rounded-sm border border-transparent bg-primary px-4 py-1.5 font-label-md text-label-md font-bold text-on-primary transition-all hover:bg-primary-fixed disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      cloud_upload
                    </span>
                    {submitting ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </div>

              <div
                className="relative min-h-0 overflow-hidden border-b border-outline-variant/20 bg-[#09040D]"
                style={{ height: `${editorPct}%` }}
              >
                <Editor
                  height="100%"
                  theme={CODEIT_THEME}
                  language={
                    language ? MONACO_LANG[language.slug] || "plaintext" : "plaintext"
                  }
                  value={code}
                  onChange={(v) => setCode(v ?? "")}
                  beforeMount={defineCodeitTheme}
                  options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                    automaticLayout: true,
                  }}
                />
              </div>

              <div
                role="separator"
                onMouseDown={() => {
                  draggingEditorRef.current = true;
                  document.body.style.cursor = "row-resize";
                  document.body.style.userSelect = "none";
                }}
                className="h-1 cursor-row-resize bg-outline-variant/20 hover:bg-primary/40"
              />

              <div className="flex min-h-0 flex-1 flex-col bg-surface-container-low">
                <div className="flex items-center border-b border-outline-variant/20 bg-surface px-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBottomTab("testcase")}
                    className={`rounded-t-sm px-4 py-2 font-label-md text-label-md ${
                      bottomTab === "testcase"
                        ? "border-b-2 border-primary bg-primary/5 text-primary"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    Testcase
                  </button>
                  <button
                    type="button"
                    onClick={() => setBottomTab("result")}
                    className={`rounded-t-sm px-4 py-2 font-label-md text-label-md ${
                      bottomTab === "result"
                        ? "border-b-2 border-primary bg-primary/5 text-primary"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    Test Result
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-4">
                  {bottomTab === "testcase" && (
                    <>
                      <div className="mb-4 flex gap-2">
                        {(examples.length
                          ? examples
                          : [{ input: "", output: "" }]
                        ).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveCaseIdx(i)}
                            className={`rounded-sm px-3 py-1 font-code-sm text-xs transition-colors ${
                              activeCaseIdx === i
                                ? "border border-outline-variant/30 bg-surface-container text-on-surface"
                                : "border border-transparent text-on-surface-variant hover:bg-surface-container/50"
                            }`}
                          >
                            Case {i + 1}
                          </button>
                        ))}
                      </div>
                      <label className="mb-1 block font-code-sm text-xs text-on-surface-variant">
                        stdin
                      </label>
                      <textarea
                        value={caseStdins[activeCaseIdx] ?? ""}
                        onChange={(e) => {
                          const next = [...caseStdins];
                          next[activeCaseIdx] = e.target.value;
                          setCaseStdins(next);
                        }}
                        className="min-h-[100px] w-full rounded-sm border border-outline-variant/30 bg-surface-container px-3 py-2 font-code-sm text-sm text-primary-fixed outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                      />
                    </>
                  )}
                  {bottomTab === "result" && (
                    <div className="space-y-3 font-code-sm text-sm">
                      {verdict && (
                        <div className="rounded-sm border border-outline-variant/20 bg-surface-container p-4">
                          <p
                            className={`font-bold ${
                              /ac|accepted/i.test(verdict.verdict) ||
                              verdict.passed
                                ? "text-easy"
                                : "text-hard"
                            }`}
                          >
                            {verdict.verdict}
                          </p>
                          {verdict.passedCount != null &&
                            verdict.totalCount != null && (
                              <p className="mt-1 text-on-surface-variant">
                                {verdict.passedCount}/{verdict.totalCount}{" "}
                                tests
                              </p>
                            )}
                        </div>
                      )}
                      {runSession && (
                        <div className="space-y-2">
                          <p className="font-bold text-on-surface">
                            Overall: {runSession.overall}
                          </p>
                          {runSession.cases.map((r) => (
                            <div
                              key={r.index}
                              className="rounded-sm border border-outline-variant/20 bg-surface-container p-3"
                            >
                              <p className="font-bold text-on-surface">
                                Case {r.index + 1}: {r.status}
                              </p>
                              {r.userOutput != null && (
                                <IoPre className="mt-2 text-xs text-on-surface-variant">
                                  {r.userOutput || "(empty)"}
                                </IoPre>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {!verdict && !runSession && (
                        <p className="text-on-surface-variant">
                          Run or submit to see results.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
