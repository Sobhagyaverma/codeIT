import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  addMyBookmark,
  getMyBookmarks,
  getLanguages,
  getProblem,
  recordRecentProblem,
  removeMyBookmark,
  submitCode,
} from "../lib/api";
import type {
  JudgeVerdictDTO,
  LanguageDTO,
  ProblemPublicDTO,
} from "../lib/types";
import {
  exampleInputToStdin,
  exampleOutputToExpected,
  formatExample,
  parseExamples,
} from "../lib/examples";
import {
  runSampleTests,
  type SampleRunSession,
} from "../lib/runSampleTests";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/toast/ToastProvider";
import { Loading, ErrorState } from "../components/Loading";
import DifficultyBadge from "../components/DifficultyBadge";
import VerdictPanel from "../components/VerdictPanel";
import RunResultsPanel from "../components/RunResultsPanel";
import AIPanel from "../components/AIPanel";

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

type RightPanelTab = "io" | "result" | "ai";

function parseTopics(topics: string[] | string | undefined): string[] {
  if (!topics) return [];
  if (Array.isArray(topics)) return topics.flatMap((t) => parseTopics(t));
  try {
    const parsed = JSON.parse(topics);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* plain */
  }
  return [topics];
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

export default function ProblemDetail() {
  const { id } = useParams();
  const problemId = Number(id);
  const { user } = useAuth();
  const { pushToast } = useToast();

  const [problem, setProblem] = useState<ProblemPublicDTO | null>(null);
  const [languages, setLanguages] = useState<LanguageDTO[]>([]);
  const [language, setLanguage] = useState<LanguageDTO | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [caseStdins, setCaseStdins] = useState<string[]>([]);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [customStdin, setCustomStdin] = useState("");
  const [runSession, setRunSession] = useState<SampleRunSession | null>(null);
  const [verdict, setVerdict] = useState<JudgeVerdictDTO | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [rightTab, setRightTab] = useState<RightPanelTab>("io");
  const runAbortRef = useRef<AbortController | null>(null);

  const [splitPct, setSplitPct] = useState(48);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setHasSubmitted(false);
    setVerdict(null);
    setRunSession(null);
    setCaseStdins([]);
    setCustomStdin("");
    setActiveCaseIdx(0);
    setRightTab("io");

    Promise.all([getProblem(problemId), getLanguages()])
      .then(([p, langs]) => {
        if (cancelled) return;

        setProblem(p);
        setLanguages(langs);

        const py = langs.find((l) => l.slug === "python") || langs[0];
        setLanguage(py);
        setCode(STARTER[py?.slug] || "");

        const exs = parseExamples(p.examples);
        setCaseStdins(exs.map((ex) => exampleInputToStdin(ex.input)));
        setActiveCaseIdx(0);
        setCustomStdin(exs[0] ? exampleInputToStdin(exs[0].input) : "");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      runAbortRef.current?.abort();
    };
  }, [problemId]);

  useEffect(() => {
    if (!user || !Number.isFinite(problemId)) return;
    let cancelled = false;

    void recordRecentProblem(problemId).catch(() => {
      /* non-blocking recent-view write */
    });

    getMyBookmarks()
      .then((bookmarks) => {
        if (!cancelled) {
          setBookmarked(bookmarks.some((b) => b.id === problemId));
        }
      })
      .catch(() => {
        if (!cancelled) setBookmarked(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, problemId]);

  useEffect(() => {
    const onMove = (clientX: number, clientY: number) => {
      if (!draggingRef.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const horizontal = window.matchMedia("(min-width: 1024px)").matches;
      const pct = horizontal
        ? ((clientX - rect.left) / rect.width) * 100
        : ((clientY - rect.top) / rect.height) * 100;
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

  const examples = useMemo(() => {
    if (!problem) return [];
    return parseExamples(problem.examples);
  }, [problem]);

  const constraints = useMemo(
    () => parseConstraints(problem?.constraintsData),
    [problem?.constraintsData]
  );

  const topics = useMemo(
    () => (problem ? parseTopics(problem.topics) : []),
    [problem]
  );

  const handleLanguageChange = (slug: string) => {
    const lang = languages.find((l) => l.slug === slug) || null;
    setLanguage(lang);

    if (lang && STARTER[lang.slug]) {
      setCode(STARTER[lang.slug]);
    }
  };

  const handleRun = async () => {
    if (!language) return;

    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;

    setRunning(true);
    setActionError(null);
    setRunSession(null);
    setVerdict(null);
    setRightTab("result");

    try {
      const samples =
        examples.length > 0
          ? examples.map((ex, i) => ({
              stdin: caseStdins[i] ?? exampleInputToStdin(ex.input),
              expectedOutput: exampleOutputToExpected(ex.output),
              inputDisplay: formatExample(ex.input),
            }))
          : undefined;

      const session = await runSampleTests({
        sourceCode: code,
        languageId: language.languageId,
        samples,
        customStdin,
        signal: controller.signal,
      });
      setRunSession(session);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setActionError(err instanceof Error ? err.message : "Run failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!language || !user) return;

    runAbortRef.current?.abort();
    setSubmitting(true);
    setActionError(null);
    setVerdict(null);
    setRunSession(null);
    setRightTab("result");

    try {
      const res = await submitCode({
        userId: user.id,
        problemId,
        languageId: language.languageId,
        language: language.slug,
        code,
      });

      setVerdict(res);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setHasSubmitted(true);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <Loading label="Loading problem" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <ErrorState message={error || "Problem not found."} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/problems"
                className="text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
              >
                Problems
              </Link>
              <span className="text-[var(--text-dim)]">/</span>
              <h1 className="display truncate text-lg font-semibold sm:text-xl">
                {problem.id}. {problem.title}
              </h1>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
            {topics.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {topics.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-[var(--line)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-dim)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={language?.slug || ""}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--info)] focus:outline-none"
            >
              {languages.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleRun}
              disabled={running}
              className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--text)] transition hover:border-[var(--info)] hover:text-[var(--info)] disabled:opacity-40"
            >
              {running ? "Running…" : "Run"}
            </button>

            {user && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (bookmarked) {
                      await removeMyBookmark(problemId);
                      setBookmarked(false);
                      pushToast("Bookmark removed.", "info");
                    } else {
                      await addMyBookmark(problemId);
                      setBookmarked(true);
                      pushToast("Problem bookmarked.", "info");
                    }
                  } catch (err) {
                    pushToast(
                      err instanceof Error
                        ? err.message
                        : "Failed to update bookmark.",
                      "error"
                    );
                  }
                }}
                className={`rounded-md border px-3 py-1.5 text-sm transition ${
                  bookmarked
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--line)] text-[var(--text-dim)] hover:text-[var(--text)]"
                }`}
                aria-pressed={bookmarked}
              >
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !user}
              title={!user ? "Log in to submit" : undefined}
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#0a0d12] transition hover:brightness-110 disabled:opacity-40"
            >
              {submitting ? "Judging…" : "Submit"}
            </button>
          </div>
          {language?.slug === "csharp" && (
            <p className="mt-2 text-xs text-[var(--text-dim)]">
              C# uses the batch judge path (slower than compile-once).
            </p>
          )}
        </div>
      </header>

      {/* Workspace */}
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
          <div className="border-b border-[var(--line)] bg-[var(--bg-raised)] px-4 py-2.5">
            <span className="verdict-strip text-[var(--text-dim)]">
              Problem statement
            </span>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
            <div>
              <h2 className="verdict-strip mb-2 text-[var(--text-dim)]">
                Description
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
                {problem.description}
              </p>
            </div>

            {examples.length > 0 && (
              <div>
                <h2 className="verdict-strip mb-3 text-[var(--text-dim)]">
                  Examples
                </h2>
                <div className="space-y-3">
                  {examples.map((ex, index) => (
                    <div
                      key={index}
                      className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] p-3"
                    >
                      <p className="verdict-strip mb-2 text-[var(--text-dim)]">
                        Example {index + 1}
                      </p>
                      <div className="mono space-y-2 text-xs">
                        <div>
                          <span className="text-[var(--text-dim)]">Input: </span>
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
                <h2 className="verdict-strip mb-3 text-[var(--text-dim)]">
                  Constraints
                </h2>
                <ul className="list-inside list-disc space-y-1 text-sm text-[var(--text-dim)]">
                  {constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
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

        {/* Editor + panels */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-[220px] flex-[1.4] bg-[var(--bg-inset)]">
            <Editor
              height="100%"
              language={MONACO_LANG[language?.slug || "python"] || "plaintext"}
              value={code}
              onChange={(v) => setCode(v || "")}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                fontFamily: "JetBrains Mono, monospace",
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>

          <div className="flex min-h-[180px] flex-1 flex-col border-t border-[var(--line)]">
            <div className="flex shrink-0 items-center gap-1 border-b border-[var(--line)] bg-[var(--bg-raised)] px-2">
              {(
                [
                  ["io", "Testcase"],
                  ["result", "Test Result"],
                  ["ai", "AI Help"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRightTab(id)}
                  className={`verdict-strip border-b-2 px-3 py-2 ${
                    rightTab === id
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {rightTab === "io" && (
                <div className="space-y-3">
                  {examples.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {examples.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveCaseIdx(idx)}
                            className={`rounded-md border px-2.5 py-1 text-xs transition ${
                              activeCaseIdx === idx
                                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                                : "border-[var(--line)] text-[var(--text-dim)] hover:border-[var(--info)] hover:text-[var(--text)]"
                            }`}
                          >
                            Case {idx + 1}
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
                          Input
                        </label>
                        <textarea
                          value={caseStdins[activeCaseIdx] ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCaseStdins((prev) => {
                              const next = [...prev];
                              next[activeCaseIdx] = value;
                              return next;
                            });
                          }}
                          rows={6}
                          spellCheck={false}
                          className="mono w-full resize-y rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--info)] focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
                          Expected Output
                        </div>
                        <pre className="mono whitespace-pre-wrap rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-xs text-[var(--text-dim)]">
                          {exampleOutputToExpected(
                            examples[activeCaseIdx]?.output
                          ) || "—"}
                        </pre>
                      </div>

                      <p className="text-xs text-[var(--text-dim)]">
                        Run executes all sample cases. Submit judges against
                        hidden tests (never shown).
                      </p>
                    </>
                  ) : (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
                        Custom stdin
                      </label>
                      <textarea
                        value={customStdin}
                        onChange={(e) => setCustomStdin(e.target.value)}
                        rows={6}
                        spellCheck={false}
                        placeholder={"4\n2 7 11 15\n9"}
                        className="mono w-full resize-y rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--info)] focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-[var(--text-dim)]">
                        No sample cases on this problem. Run uses this input
                        only.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {rightTab === "result" && (
                <div className="space-y-3">
                  {actionError &&
                    !actionError.includes("Invalid test_cases JSON") && (
                      <ErrorState message={actionError} />
                    )}

                  {submitting && (
                    <p className="text-sm text-[var(--text-dim)]">
                      Judging against hidden test cases
                      {language?.slug === "csharp"
                        ? " (batch path)…"
                        : " (compile once)…"}
                    </p>
                  )}

                  {verdict && (
                    <div className="space-y-3">
                      <VerdictPanel verdict={verdict} />
                      {typeof verdict.totalCount === "number" &&
                        verdict.totalCount > 0 && (
                        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-3 text-sm">
                          <div className="verdict-strip mb-1 text-[var(--text-dim)]">
                            Hidden tests
                          </div>
                          <p
                            style={{
                              color:
                                (verdict.passedCount ?? 0) === verdict.totalCount
                                  ? "var(--ok)"
                                  : "var(--err)",
                            }}
                          >
                            {verdict.passedCount ?? 0} / {verdict.totalCount}{" "}
                            passed
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-dim)]">
                            Hidden case details are never shown.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!submitting && !verdict && (
                    <RunResultsPanel session={runSession} loading={running} />
                  )}
                </div>
              )}

              {rightTab === "ai" && (
                <div>
                  {!user ? (
                    <p className="text-sm text-[var(--text-dim)]">
                      Log in and submit a solution to unlock AI Help.
                    </p>
                  ) : !hasSubmitted ? (
                    <div className="rounded-md border border-dashed border-[var(--line)] bg-[var(--bg-raised)] p-4 text-sm text-[var(--text-dim)]">
                      Submit your solution to unlock AI Help.
                    </div>
                  ) : (
                    <AIPanel
                      baseRequest={{
                        userId: user.id,
                        problemId,
                        language: language?.slug || "python",
                        languageId: language?.languageId || 71,
                        code,
                        verdict: verdict?.verdict,
                        failedTestIndex: verdict?.failedTestIndex ?? null,
                      }}
                      onApplyCorrectedCode={setCode}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
