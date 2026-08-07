import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const u = (d || "").trim().toUpperCase();
  if (u === "EASY") return "bg-[#1A3F33] text-easy border-[#235343]";
  if (u === "MEDIUM") return "bg-[#3F351A] text-medium border-[#534723]";
  if (u === "HARD") return "bg-[#3F1A1A] text-hard border-[#532323]";
  return "bg-surface-container-high text-on-surface-variant border-outline-variant/30";
}

function formatPenalty(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
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
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
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
  const constraints = useMemo(
    () => parseConstraints(problem?.constraintsData),
    [problem]
  );

  const loadProblemDetails = useCallback(async (ids: number[]) => {
    const problemEntries = await Promise.all(
      ids.map(async (pid) => {
        try {
          return [pid, await getProblem(pid)] as const;
        } catch {
          return null;
        }
      })
    );
    const map: Record<number, ProblemPublicDTO> = {};
    for (const entry of problemEntries) {
      if (entry) map[entry[0]] = entry[1];
    }
    setProblems(map);
  }, []);

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
      setJoined(false);
      setProblems({});
      try {
        const [comp, ids, langs] = await Promise.all([
          getCompetition(competitionId),
          getCompetitionProblems(competitionId),
          getLanguages().catch(() => FALLBACK_LANGUAGES),
        ]);
        if (cancelled) return;

        setContest(
          toContestCard(comp, {
            problemCount: ids.length,
            participantCount: null,
          })
        );
        setProblemIds(ids);
        setLanguages(langs.length ? langs : FALLBACK_LANGUAGES);
        setLanguage(
          pickPreferredLanguage(langs.length ? langs : FALLBACK_LANGUAGES)
        );

        let alreadyIn = false;
        try {
          let sess = await getCompetitionSession(competitionId, user.id);
          if (
            sess.sessionStatus === "JOINED" &&
            toContestCard(comp, {}).status === "ACTIVE"
          ) {
            try {
              sess = await startCompetition(competitionId, user.id);
            } catch {
              /* stay JOINED — Start button available */
            }
          }
          if (!cancelled) {
            setSession(sess);
            setJoined(true);
            alreadyIn = true;
            if (typeof sess.remainingSeconds === "number") {
              setRemaining(sess.remainingSeconds);
            }
          }
        } catch {
          if (!cancelled) {
            setSession(null);
            setJoined(false);
          }
        }

        if (alreadyIn && !cancelled) {
          await loadProblemDetails(ids);
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
  }, [competitionId, user, loadProblemDetails]);

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
    if (!joined) {
      throw new Error("Join the contest before submitting.");
    }
    setBusy(true);
    try {
      const started = await startCompetition(competitionId, user.id);
      setSession(started);
      setActionError(null);
      if (typeof started.remainingSeconds === "number") {
        setRemaining(started.remainingSeconds);
      }
      return started;
    } finally {
      setBusy(false);
    }
  };

  const handleStartSession = async () => {
    if (!user) return;
    setBusy(true);
    setActionError(null);
    try {
      const started = await startCompetition(competitionId, user.id);
      setSession(started);
      if (typeof started.remainingSeconds === "number") {
        setRemaining(started.remainingSeconds);
      }
    } catch (err) {
      // Already in progress — refresh session
      if (
        err instanceof Error &&
        /already started/i.test(err.message)
      ) {
        try {
          const sess = await getCompetitionSession(competitionId, user.id);
          setSession(sess);
          if (typeof sess.remainingSeconds === "number") {
            setRemaining(sess.remainingSeconds);
          }
          return;
        } catch {
          /* fall through */
        }
      }
      setActionError(
        err instanceof ApiError ? err.message : "Failed to start session."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleJoinContest = async () => {
    if (!user) {
      setActionError("Log in to join this contest.");
      return;
    }
    if (contest?.status === "ENDED") {
      setActionError("This competition has ended.");
      return;
    }
    setJoining(true);
    setActionError(null);
    try {
      const joinResult = await joinCompetition(competitionId, user.id);
      const joinMsg =
        typeof joinResult === "string" ? joinResult.toLowerCase() : "";
      if (
        joinMsg &&
        !joinMsg.includes("joined") &&
        !joinMsg.includes("already")
      ) {
        throw new Error(joinResult);
      }

      let nextSession: ContestSession | null = null;
      try {
        nextSession = await startCompetition(competitionId, user.id);
      } catch (startErr) {
        nextSession = await getCompetitionSession(competitionId, user.id);
        // Live contest but still JOINED — try start once more after refresh
        if (
          nextSession.sessionStatus === "JOINED" &&
          contest?.status === "ACTIVE"
        ) {
          try {
            nextSession = await startCompetition(competitionId, user.id);
          } catch {
            /* keep JOINED; user can click Start */
            void startErr;
          }
        }
      }
      setSession(nextSession);
      setJoined(true);
      if (typeof nextSession.remainingSeconds === "number") {
        setRemaining(nextSession.remainingSeconds);
      }
      await loadProblemDetails(problemIds);
      try {
        setBoard(await getLeaderboard(competitionId));
      } catch {
        /* ignore */
      }
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to join contest."
      );
    } finally {
      setJoining(false);
    }
  };

  const handleEndSession = async () => {
    if (!user) return;
    if (session?.sessionStatus !== "IN_PROGRESS") {
      setActionError("Start the contest before ending your session.");
      return;
    }
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
      <div className="problem-workspace font-body-md relative flex min-h-screen flex-col text-on-background antialiased">
        <div className="pw-ambient" aria-hidden />
        <AppNav activeHint="/competitions" />
        <div className="relative z-10 mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 pt-16 text-center">
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
      <div className="problem-workspace font-body-md relative flex min-h-screen flex-col text-on-background antialiased">
        <div className="pw-ambient" aria-hidden />
        <AppNav activeHint="/competitions" />
        <div className="relative z-10 flex flex-1 items-center justify-center pt-16">
          <p className="text-on-surface-variant">Loading contest…</p>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="problem-workspace font-body-md relative flex min-h-screen flex-col text-on-background antialiased">
        <div className="pw-ambient" aria-hidden />
        <AppNav activeHint="/competitions" />
        <div className="relative z-10 mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 pt-16 text-center">
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
    <div className="problem-workspace font-body-md relative flex h-screen flex-col overflow-hidden text-on-background antialiased">
      <div className="pw-ambient" aria-hidden />
      <AppNav activeHint="/competitions" />

      <main className="relative z-10 mt-16 flex h-[calc(100vh-64px)] min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
        {/* Contest header */}
        <header className="pw-contest-header relative z-40 flex flex-shrink-0 flex-wrap items-center justify-between gap-3 px-gutter py-3">
          <div className="flex min-w-0 flex-col gap-2">
            <Link
              to="/competitions"
              className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              Competitions
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                {contest.title}
              </h1>
              <div
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${
                  contest.status === "ACTIVE"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-outline-variant/20 bg-white/5"
                }`}
              >
                {contest.status === "ACTIVE" && (
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                )}
                <span
                  className={`font-label-md text-[10px] font-bold tracking-wider uppercase ${
                    contest.status === "ACTIVE"
                      ? "text-emerald-400"
                      : "text-on-surface-variant"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {contest.problemCount != null && (
                <span className="rounded-full border border-outline-variant/20 bg-white/5 px-2.5 py-0.5 font-code-sm text-[11px] text-on-surface-variant">
                  {contest.problemCount} problems
                </span>
              )}
              <span className="rounded-full border border-outline-variant/20 bg-white/5 px-2.5 py-0.5 font-code-sm text-[11px] text-on-surface-variant">
                {formatDuration(contest.durationMinutes)}
              </span>
              {contest.contestType && (
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-code-sm text-[11px] text-primary">
                  {contest.contestType}
                </span>
              )}
              {contest.difficulty && (
                <span className="rounded-full border border-outline-variant/20 bg-white/5 px-2.5 py-0.5 font-code-sm text-[11px] text-on-surface-variant">
                  {contest.difficulty}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-6 py-2 font-code-sm text-3xl font-bold tracking-widest text-primary shadow-[0_0_16px_rgba(168,85,247,0.25)]">
              {remaining != null ? formatSecondsClock(remaining) : "--:--:--"}
            </div>
            <span className="mt-1 font-label-md text-[10px] tracking-widest text-on-surface-variant uppercase">
              Time Remaining
            </span>
          </div>

          <div className="flex items-center gap-4">
            {!joined ? (
              <button
                type="button"
                disabled={joining || contest.status === "ENDED"}
                onClick={() => void handleJoinContest()}
                className="pw-btn-submit font-label-md text-label-md flex items-center gap-2 rounded-full px-5 py-2.5 font-bold disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">
                  login
                </span>
                {joining ? "Joining…" : "Join contest"}
              </button>
            ) : session?.sessionStatus === "IN_PROGRESS" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleEndSession()}
                className="font-label-md text-label-md flex items-center gap-2 rounded-full border border-hard/40 bg-hard/10 px-4 py-2 text-hard transition-all hover:bg-hard/15 disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">
                  power_settings_new
                </span>
                End session
              </button>
            ) : session?.sessionStatus === "ENDED" ? (
              <span className="rounded-full border border-outline-variant/30 px-4 py-2 font-label-md text-sm text-on-surface-variant">
                Session ended
              </span>
            ) : (
              <button
                type="button"
                disabled={busy || contest.status === "ENDED"}
                onClick={() => void handleStartSession()}
                className="pw-btn-submit font-label-md text-label-md flex items-center gap-2 rounded-full px-5 py-2.5 font-bold disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">
                  play_arrow
                </span>
                {busy ? "Starting…" : "Start contest"}
              </button>
            )}
          </div>
        </header>

        {actionError && (
          <div className="flex-shrink-0 rounded-xl border border-hard/30 bg-hard/10 px-4 py-2 text-sm text-hard">
            {actionError}
          </div>
        )}

        {!joined ? (
          <div className="pw-contest-header flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <span className="material-symbols-outlined text-[32px]">
                emoji_events
              </span>
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="font-headline-lg text-2xl font-semibold text-white">
                Join to unlock problems
              </h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Register for{" "}
                <span className="text-primary">{contest.title}</span> before
                you can view statements, run code, or submit solutions.
              </p>
            </div>
            <button
              type="button"
              disabled={joining || contest.status === "ENDED"}
              onClick={() => void handleJoinContest()}
              className="pw-btn-submit flex items-center gap-2 rounded-full px-8 py-3 font-label-md text-sm font-bold disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[20px]">
                login
              </span>
              {joining
                ? "Joining…"
                : contest.status === "ENDED"
                  ? "Contest ended"
                  : "Join contest"}
            </button>
            <Link
              to="/competitions"
              className="text-sm text-on-surface-variant hover:text-primary"
            >
              Back to competitions
            </Link>
          </div>
        ) : (
          <>
        {/* Controls strip */}
        <div className="pw-contest-strip z-30 flex flex-shrink-0 items-center justify-between gap-2 px-2 py-2">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
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
                  className={`pw-letter-btn group relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md font-label-md text-sm font-bold transition-colors ${
                    active
                      ? "pw-letter-btn-active bg-primary text-on-primary"
                      : "bg-white/5 text-on-surface-variant hover:bg-primary/15 hover:text-primary"
                  }`}
                >
                  {letter}
                  {solved && (
                    <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1 pr-2">
            <button
              type="button"
              onClick={() => setWorkspaceTab("problem")}
              className={`pw-tab flex items-center gap-2 rounded-lg px-3 py-1.5 font-label-md text-[13px] font-medium ${
                workspaceTab === "problem"
                  ? "pw-tab-active bg-white/5 text-primary"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
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
              className={`pw-tab flex items-center gap-2 rounded-lg px-3 py-1.5 font-label-md text-[13px] font-medium ${
                workspaceTab === "standings"
                  ? "pw-tab-active bg-white/5 text-primary"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                leaderboard
              </span>
              Standings ({board.length})
            </button>
          </div>
        </div>

        {workspaceTab === "standings" ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <div className="pw-panel overflow-hidden rounded-2xl">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/5 bg-white/5 text-xs tracking-wider text-on-surface-variant uppercase">
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
                        className="border-b border-white/5 hover:bg-white/5"
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
          <div
            ref={splitRef}
            className="pw-workspace-frame flex min-h-0 flex-1 flex-col md:flex-row"
          >
            {/* Left: statement */}
            <section
              className="pw-panel relative flex min-h-0 min-w-0 flex-col overflow-hidden"
              style={{
                flexBasis: `${splitPct}%`,
                flexGrow: 0,
                flexShrink: 0,
              }}
            >
              <div className="pw-toolbar flex shrink-0 items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <span className="material-symbols-outlined text-[18px]">
                      menu_book
                    </span>
                  </span>
                  <span className="font-label-md text-[13px] font-semibold tracking-wide text-on-background">
                    Description
                  </span>
                </div>
              </div>

              <div className="pw-scroll min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
                {!problem ? (
                  <p className="text-on-surface-variant">
                    Select a problem to begin.
                  </p>
                ) : (
                  <>
                    <div>
                      <h2 className="font-headline-lg mb-3 text-[26px] leading-tight font-semibold tracking-tight text-white md:text-[30px]">
                        <span className="text-primary">
                          {PROBLEM_LETTERS[activeIdx] || activeIdx + 1}.
                        </span>{" "}
                        {problem.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 font-label-md text-[12px] ${difficultyClass(problem.difficulty)}`}
                        >
                          {problem.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="font-body-md whitespace-pre-wrap text-[15px] leading-relaxed text-on-surface-variant/90">
                      {problem.description}
                    </div>

                    {examples.length > 0 && (
                      <div className="space-y-4">
                        {examples.map((ex, i) => (
                          <div
                            key={i}
                            className="rounded-2xl border border-white/5 bg-black/25 p-4 transition-colors hover:border-primary/20"
                          >
                            <p className="mb-3 font-label-md text-[13px] font-semibold text-white">
                              Example {i + 1}
                            </p>
                            <div className="space-y-2.5">
                              <div>
                                <p className="mb-1 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                                  Input
                                </p>
                                <IoPre>
                                  {formatExample(ex.input) || "(empty)"}
                                </IoPre>
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                                  Output
                                </p>
                                <IoPre tone="ok">
                                  {formatExample(ex.output) || "(empty)"}
                                </IoPre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {constraints.length > 0 && (
                      <div>
                        <p className="font-label-md mb-2 text-[13px] font-semibold text-white">
                          Constraints
                        </p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-on-surface-variant">
                          {constraints.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize statement and editor"
              onMouseDown={(e) => {
                e.preventDefault();
                draggingRef.current = true;
                document.body.style.cursor = "col-resize";
                document.body.style.userSelect = "none";
              }}
              className="pw-resize pw-resize-col hidden md:flex"
            />
            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize statement and editor"
              onMouseDown={(e) => {
                e.preventDefault();
                draggingRef.current = true;
                document.body.style.cursor = "row-resize";
                document.body.style.userSelect = "none";
              }}
              className="pw-resize pw-resize-row flex md:hidden"
            />

            {/* Right: IDE shell */}
            <section
              ref={editorSplitRef}
              className="pw-ide-shell flex min-h-0 min-w-0 flex-1 flex-col"
            >
              <div
                className="flex min-h-[160px] flex-col overflow-hidden"
                style={{ flex: `0 0 ${editorPct}%` }}
              >
                <div className="pw-toolbar flex shrink-0 items-center justify-between gap-3 px-3 py-2.5">
                  <div className="relative flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLangOpen((o) => !o)}
                      className="pw-lang-trigger font-code-sm flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12px] font-medium text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        code
                      </span>
                      {language?.name || "Language"}
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                        expand_more
                      </span>
                    </button>
                    {langOpen && (
                      <div className="pw-lang-menu absolute top-full left-0 z-30 mt-2 max-h-60 min-w-[12rem] overflow-y-auto py-1.5">
                        {languages.map((l) => (
                          <button
                            key={l.slug}
                            type="button"
                            onClick={() => handleLanguageChange(l.slug)}
                            className={`flex w-full items-center justify-between px-3.5 py-2 text-left font-code-sm text-[12px] transition-colors hover:bg-primary/10 ${
                              l.slug === language?.slug
                                ? "bg-primary/10 text-primary"
                                : "text-on-surface"
                            }`}
                          >
                            {l.name}
                            {l.slug === language?.slug && (
                              <span className="material-symbols-outlined text-[14px]">
                                check
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={running || !problem}
                      onClick={() => void handleRun()}
                      className="pw-btn-run font-label-md flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        play_arrow
                      </span>
                      {running ? "Running…" : "Run"}
                    </button>
                    <button
                      type="button"
                      disabled={submitting || busy || !problem}
                      onClick={() => void handleSubmit()}
                      className="pw-btn-submit font-label-md flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        cloud_upload
                      </span>
                      {submitting ? "Submitting…" : "Submit"}
                    </button>
                  </div>
                </div>

                <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0a0610]">
                  <Editor
                    height="100%"
                    theme={CODEIT_THEME}
                    language={
                      language
                        ? MONACO_LANG[language.slug] || "plaintext"
                        : "plaintext"
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
              </div>

              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize editor and test panel"
                onMouseDown={(e) => {
                  e.preventDefault();
                  draggingEditorRef.current = true;
                  document.body.style.cursor = "row-resize";
                  document.body.style.userSelect = "none";
                }}
                className="pw-resize pw-resize-row"
              />

              <div className="flex min-h-[140px] min-w-0 flex-1 flex-col overflow-hidden border-t border-white/5">
                <div className="pw-toolbar flex shrink-0 items-center gap-1 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => setBottomTab("testcase")}
                    className={`pw-tab font-label-md flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium ${
                      bottomTab === "testcase"
                        ? "pw-tab-active bg-white/5 text-primary"
                        : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      fact_check
                    </span>
                    Testcase
                  </button>
                  <button
                    type="button"
                    onClick={() => setBottomTab("result")}
                    className={`pw-tab font-label-md flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium ${
                      bottomTab === "result"
                        ? "pw-tab-active bg-white/5 text-primary"
                        : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      terminal
                    </span>
                    Test Result
                  </button>
                </div>

                <div className="pw-scroll min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-black/20 to-transparent p-4">
                  {bottomTab === "testcase" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {(examples.length
                          ? examples
                          : [{ input: "", output: "" }]
                        ).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveCaseIdx(i)}
                            className={`pw-case-chip rounded-full px-3.5 py-1.5 font-label-md text-[12px] font-medium ${
                              activeCaseIdx === i
                                ? "pw-case-chip-active bg-primary/20 text-primary"
                                : "bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-on-surface"
                            }`}
                          >
                            Case {i + 1}
                          </button>
                        ))}
                      </div>
                      <div>
                        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                          stdin
                        </p>
                        <textarea
                          value={caseStdins[activeCaseIdx] ?? ""}
                          onChange={(e) => {
                            const next = [...caseStdins];
                            next[activeCaseIdx] = e.target.value;
                            setCaseStdins(next);
                          }}
                          className="mono min-h-[5rem] w-full resize-y rounded-2xl border border-white/8 bg-black/30 p-3.5 text-[13px] leading-[1.55] tracking-wide text-on-surface outline-none transition-shadow focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(183,109,255,0.15)]"
                        />
                      </div>
                    </div>
                  )}
                  {bottomTab === "result" && (
                    <div className="space-y-3 font-code-sm text-sm">
                      {verdict && (
                        <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
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
                              className="rounded-2xl border border-white/6 bg-white/4 p-3"
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
            </section>
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}
