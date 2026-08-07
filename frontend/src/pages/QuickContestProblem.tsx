import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Link, Navigate, useParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { IoPre } from "../components/IoPre";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  getLanguages,
  getProblem,
  getQuickContest,
  submitQuickContest,
  type JudgeVerdictDTO,
  type LanguageDTO,
  type ProblemPublicDTO,
  type QuickContest,
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

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type BottomTab = "testcase" | "result";
type SideTab = "problem" | "standings";

function difficultyClass(d?: string) {
  const x = (d || "").trim().toUpperCase();
  if (x === "EASY") return "bg-[#1A3F33] text-easy border-[#235343]";
  if (x === "MEDIUM") return "bg-[#3F351A] text-medium border-[#534723]";
  if (x === "HARD") return "bg-[#3F1A1A] text-hard border-[#532323]";
  return "bg-surface-container-high text-on-surface-variant border-outline-variant/30";
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

function formatClock(totalSeconds: number | null) {
  if (totalSeconds == null) return "--:--";
  const s = Math.max(0, totalSeconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function QuickContestProblem() {
  const { id, problemId: problemIdParam } = useParams();
  const contestId = Number(id);
  const problemId = Number(problemIdParam);
  const { user } = useAuth();

  const [contest, setContest] = useState<QuickContest | null>(null);
  const [problem, setProblem] = useState<ProblemPublicDTO | null>(null);
  const [languages, setLanguages] = useState<LanguageDTO[]>(FALLBACK_LANGUAGES);
  const [language, setLanguage] = useState<LanguageDTO | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<JudgeVerdictDTO | null>(null);
  const [runSession, setRunSession] = useState<SampleRunSession | null>(null);
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcase");
  const [sideTab, setSideTab] = useState<SideTab>("problem");
  const [caseStdins, setCaseStdins] = useState<string[]>([]);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [splitPct, setSplitPct] = useState(44);
  const [editorPct, setEditorPct] = useState(58);

  const splitRef = useRef<HTMLDivElement>(null);
  const editorSplitRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const draggingEditorRef = useRef(false);
  const runAbortRef = useRef<AbortController | null>(null);

  const examples = useMemo(
    () => parseExamples(problem?.examples as string | undefined),
    [problem]
  );
  const constraints = useMemo(
    () => parseConstraints(problem?.constraintsData),
    [problem]
  );

  const problems = contest?.problems || [];
  const activeOrdinal =
    problems.find((p) => p.problem_id === problemId)?.ordinal ?? 1;
  const activeLetter = LETTERS[activeOrdinal - 1] || String(activeOrdinal);

  const remaining = useMemo(() => {
    if (!contest?.ends_at) return null;
    const ends = new Date(contest.ends_at).getTime();
    if (!Number.isFinite(ends)) return null;
    return Math.max(0, Math.floor((ends - now) / 1000));
  }, [contest?.ends_at, now]);

  useEffect(() => {
    if (!user || !Number.isFinite(contestId) || !Number.isFinite(problemId))
      return;
    let cancelled = false;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const [qc, prob, langs] = await Promise.all([
          getQuickContest(contestId),
          getProblem(problemId),
          getLanguages().catch(() => FALLBACK_LANGUAGES),
        ]);
        if (cancelled) return;
        const inContest = (qc.problems || []).some(
          (p) => p.problem_id === problemId
        );
        if (!inContest) {
          setError("This problem is not part of the contest.");
          setContest(qc);
          setLoading(false);
          return;
        }
        setContest(qc);
        setProblem(prob);
        const list = langs.length ? langs : FALLBACK_LANGUAGES;
        setLanguages(list);
        setLanguage(pickPreferredLanguage(list) || list[0] || null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load problem"
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
  }, [user, contestId, problemId]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = window.setInterval(() => {
      if (!Number.isFinite(contestId)) return;
      void getQuickContest(contestId)
        .then(setContest)
        .catch(() => undefined);
    }, 5000);
    return () => {
      window.clearInterval(t);
      window.clearInterval(poll);
    };
  }, [contestId]);

  useEffect(() => {
    if (!language || !Number.isFinite(contestId) || !Number.isFinite(problemId))
      return;
    const draft = loadContestCodeDraft(contestId, problemId, language.slug);
    setCode(draft ?? STARTER[language.slug] ?? "");
    const exs = parseExamples(problem?.examples as string | undefined);
    setCaseStdins(exs.map((ex) => resolveSampleStdin(undefined, ex.input)));
    setActiveCaseIdx(0);
    setVerdict(null);
    setRunSession(null);
    setBottomTab("testcase");
  }, [language?.slug, contestId, problemId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!language || loading) return;
    const t = window.setTimeout(() => {
      saveContestCodeDraft(contestId, problemId, language.slug, code);
    }, 400);
    return () => window.clearTimeout(t);
  }, [code, language, contestId, problemId, loading]);

  useEffect(() => {
    const onMove = (clientX: number, clientY: number) => {
      if (draggingRef.current && splitRef.current) {
        const rect = splitRef.current.getBoundingClientRect();
        const pct = ((clientX - rect.left) / rect.width) * 100;
        setSplitPct(Math.min(68, Math.max(32, pct)));
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
    if (language) {
      saveContestCodeDraft(contestId, problemId, language.slug, code);
    }
    const lang = languages.find((l) => l.slug === slug) || null;
    setLanguage(lang);
    setLangOpen(false);
    if (lang) setPreferredLanguage(lang.slug);
  };

  const handleRun = async () => {
    if (!language) return;
    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;
    setRunning(true);
    setActionError(null);
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
        examples.length === 0 ? caseStdins[0] || "" : undefined;
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
    if (!language || !user) {
      setActionError("Log in to submit.");
      return;
    }
    if (contest?.status !== "LIVE") {
      setActionError("Contest is not live — submissions are closed.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    setVerdict(null);
    setRunSession(null);
    setBottomTab("result");
    try {
      const res = await submitQuickContest(contestId, {
        problemId,
        languageId: language.languageId,
        language: language.slug,
        code,
      });
      setVerdict(res);
      try {
        setContest(await getQuickContest(contestId));
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

  if (!user) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <div className="problem-workspace flex min-h-screen flex-col text-on-surface">
        <div className="pw-ambient" aria-hidden />
        <AppNav activeHint="/competitions/quick" />
        <div className="relative z-10 flex flex-1 items-center justify-center pt-16">
          <p className="font-label-md text-on-surface-variant">Loading problem…</p>
        </div>
      </div>
    );
  }

  if (error || !contest || !problem) {
    return (
      <div className="problem-workspace flex min-h-screen flex-col text-on-surface">
        <div className="pw-ambient" aria-hidden />
        <AppNav activeHint="/competitions/quick" />
        <div className="relative z-10 mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 pt-16 text-center">
          <p className="font-headline-lg text-headline-lg-mobile text-hard">
            {error || "Problem not found"}
          </p>
          <Link
            to={`/competitions/quick/${id}/live`}
            className="text-primary hover:underline"
          >
            Back to live contest
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="problem-workspace font-body-md relative flex h-screen flex-col overflow-hidden text-on-background antialiased">
      <div className="pw-ambient" aria-hidden />
      <AppNav activeHint="/competitions/quick" />

      <main className="relative z-10 mt-16 flex h-[calc(100vh-64px)] min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
        <header className="pw-contest-header relative z-40 flex flex-shrink-0 flex-wrap items-center justify-between gap-3 px-gutter py-3">
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              to={`/competitions/quick/${id}/live`}
              className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              {contest.name}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-easy/30 bg-easy/10 px-2 py-0.5 font-label-md text-[10px] uppercase tracking-widest text-easy">
                Live · Unrated
              </span>
              <span className="font-code-sm text-xs text-on-surface-variant">
                Problem {activeLetter}
              </span>
            </div>
          </div>
          <div
            className={`rounded-lg border px-4 py-1.5 font-mono text-xl tabular-nums ${
              remaining != null && remaining < 300
                ? "border-hard/40 bg-hard/10 text-hard"
                : "border-primary/40 bg-primary/10 text-primary"
            }`}
          >
            {formatClock(remaining)}
          </div>
        </header>

        <div className="pw-contest-strip z-30 flex flex-shrink-0 items-center justify-between gap-2 px-2 py-2">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {problems.map((p) => {
              const letter = LETTERS[p.ordinal - 1] || String(p.ordinal);
              const active = p.problem_id === problemId;
              return (
                <Link
                  key={p.problem_id}
                  to={`/competitions/quick/${id}/problems/${p.problem_id}`}
                  title={p.title}
                  className={`pw-letter-btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md font-label-md text-sm font-bold transition-colors ${
                    active
                      ? "pw-letter-btn-active bg-primary text-on-primary"
                      : "bg-white/5 text-on-surface-variant hover:bg-primary/15 hover:text-primary"
                  }`}
                >
                  {letter}
                </Link>
              );
            })}
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 pr-2">
            {(
              [
                ["problem", "Problem"],
                ["standings", "Standings"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSideTab(key)}
                className={`pw-tab rounded-lg px-3 py-1.5 font-label-md text-[13px] font-medium ${
                  sideTab === key
                    ? "pw-tab-active bg-white/5 text-primary"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {actionError && (
          <div className="flex-shrink-0 rounded-xl border border-error/30 bg-error/10 px-4 py-2 text-sm text-error">
            {actionError}
          </div>
        )}

        {sideTab === "standings" ? (
          <div className="pw-scroll min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-6">
            <h2 className="mb-4 font-headline-lg-mobile text-headline-lg-mobile font-semibold text-white">
              Leaderboard
            </h2>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/5 font-label-md text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Player</th>
                    <th className="px-4 py-3 font-semibold">Solved</th>
                    <th className="px-4 py-3 font-semibold">Penalty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(contest.leaderboard || []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-on-surface-variant"
                      >
                        No submissions yet.
                      </td>
                    </tr>
                  ) : (
                    (contest.leaderboard || []).map((row, idx) => {
                      const uid = Number(row.user_id);
                      return (
                        <tr
                          key={String(row.user_id ?? idx)}
                          className={`transition-colors hover:bg-white/5 ${
                            user && uid === user.id ? "bg-primary/10" : ""
                          }`}
                        >
                          <td className="mono px-4 py-3 text-on-surface-variant">
                            {Number(row.placement) || idx + 1}
                          </td>
                          <td className="px-4 py-3 text-on-surface">
                            {String(row.name || "Player")}
                            {user && uid === user.id && (
                              <span className="ml-2 text-xs text-primary">
                                (you)
                              </span>
                            )}
                          </td>
                          <td className="mono px-4 py-3 text-on-surface">
                            {Number(row.solved) || 0}
                          </td>
                          <td className="mono px-4 py-3 text-on-surface-variant">
                            {Number(row.penalty) || 0}
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
            className="pw-workspace-frame flex min-h-0 flex-1 flex-col md:flex-row"
          >
            <section
              className="pw-panel relative flex min-h-0 min-w-0 flex-col overflow-hidden"
              style={{
                flexBasis: `${splitPct}%`,
                flexGrow: 0,
                flexShrink: 0,
              }}
            >
              <div className="pw-toolbar flex shrink-0 items-center gap-2.5 px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <span className="material-symbols-outlined text-[18px]">
                    menu_book
                  </span>
                </span>
                <span className="font-label-md text-[13px] font-semibold tracking-wide text-on-background">
                  Problem Statement
                </span>
              </div>
              <div className="pw-scroll min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <h2 className="font-headline-lg-mobile text-[26px] leading-tight font-semibold tracking-tight text-white md:text-[30px]">
                    <span className="text-primary">{activeLetter}.</span>{" "}
                    {problem.title}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 font-label-md text-[12px] font-bold ${difficultyClass(problem.difficulty)}`}
                  >
                    {problem.difficulty}
                  </span>
                </div>

                <p className="mb-6 whitespace-pre-wrap font-body-md text-[15px] leading-relaxed text-on-surface-variant/90">
                  {problem.description}
                </p>

                {examples.map((ex, i) => (
                  <div key={i} className="mb-8">
                    <div className="rounded-2xl border border-white/5 bg-black/25 p-4 transition-colors hover:border-primary/20">
                      <h3 className="mb-3 font-label-md text-[13px] font-semibold text-white">
                        Example {i + 1}
                      </h3>
                      <div className="space-y-2.5">
                        <div>
                          <p className="mb-1 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                            Input
                          </p>
                          <IoPre className="mt-1 text-primary-fixed">
                            {formatExample(ex.input) || "(empty)"}
                          </IoPre>
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                            Output
                          </p>
                          <IoPre tone="ok" className="mt-1">
                            {formatExample(ex.output) || "(empty)"}
                          </IoPre>
                        </div>
                        {ex.explanation && (
                          <p className="text-sm text-on-surface-variant">
                            {ex.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {constraints.length > 0 && (
                  <div className="mb-8">
                    <h3 className="mb-3 font-label-md text-[13px] font-semibold text-white">
                      Constraints
                    </h3>
                    <ul className="font-code-sm list-inside list-disc space-y-1.5 text-on-surface-variant">
                      {constraints.map((c) => (
                        <li key={c}>
                          <code className="text-secondary">{c}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize statement and editor"
              onMouseDown={() => {
                draggingRef.current = true;
                document.body.style.cursor = "col-resize";
                document.body.style.userSelect = "none";
              }}
              className="pw-resize pw-resize-col hidden md:flex"
            />

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
                      <div className="pw-lang-menu absolute top-full left-0 z-50 mt-2 max-h-56 min-w-[12rem] overflow-y-auto py-1.5">
                        {languages.map((l) => (
                          <button
                            key={l.slug}
                            type="button"
                            onClick={() => handleLanguageChange(l.slug)}
                            className={`flex w-full items-center justify-between px-3.5 py-2 text-left font-code-sm text-[12px] transition-colors hover:bg-primary/10 ${
                              language?.slug === l.slug
                                ? "bg-primary/10 text-primary"
                                : "text-on-surface"
                            }`}
                          >
                            {l.name}
                            {language?.slug === l.slug && (
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
                      disabled={running || !language}
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
                      disabled={submitting || !language}
                      onClick={() => void handleSubmit()}
                      className="pw-btn-submit font-label-md flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        rocket_launch
                      </span>
                      {submitting ? "Submitting…" : "Submit"}
                    </button>
                  </div>
                </div>

                <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0a0610]">
                  <Editor
                    key={MONACO_LANG[language?.slug || "python"] || "plaintext"}
                    height="100%"
                    theme={CODEIT_THEME}
                    language={
                      MONACO_LANG[language?.slug || "python"] || "plaintext"
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
                onMouseDown={() => {
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
                    <>
                      <div className="mb-4 flex flex-wrap gap-2">
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
                      <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                        stdin
                      </label>
                      <textarea
                        value={caseStdins[activeCaseIdx] ?? ""}
                        onChange={(e) => {
                          const next = [...caseStdins];
                          next[activeCaseIdx] = e.target.value;
                          setCaseStdins(next);
                        }}
                        className="mono min-h-[100px] w-full resize-y rounded-2xl border border-white/8 bg-black/30 px-3.5 py-3 text-[13px] leading-[1.55] tracking-wide text-on-surface outline-none transition-shadow focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(183,109,255,0.15)]"
                      />
                      {examples[activeCaseIdx] && (
                        <div className="mt-3">
                          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                            Expected output
                          </p>
                          <IoPre tone="ok">
                            {formatExample(examples[activeCaseIdx].output) ||
                              "(empty)"}
                          </IoPre>
                        </div>
                      )}
                    </>
                  )}
                  {bottomTab === "result" && (
                    <div className="space-y-3 font-code-sm text-sm">
                      {verdict && (
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
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
                                {verdict.passedCount}/{verdict.totalCount} tests
                              </p>
                            )}
                          {(verdict.time != null || verdict.memory != null) && (
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {verdict.time != null
                                ? `${verdict.time}s`
                                : ""}
                              {verdict.time != null && verdict.memory != null
                                ? " · "
                                : ""}
                              {verdict.memory != null
                                ? `${verdict.memory} KB`
                                : ""}
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
                              className="rounded-2xl border border-white/10 bg-black/25 p-3"
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
                          Run sample cases or submit for full judging.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
