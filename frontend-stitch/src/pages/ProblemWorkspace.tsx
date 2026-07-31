import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Link, useParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { IoPre } from "../components/IoPre";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  getLanguages,
  getProblem,
  submitCode,
  type JudgeVerdictDTO,
  type LanguageDTO,
  type ProblemPublicDTO,
} from "../lib/api";
import {
  loadCodeDraft,
  pickPreferredLanguage,
  saveCodeDraft,
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
  { slug: "c", name: "C", languageId: 50 },
  { slug: "go", name: "Go", languageId: 60 },
  { slug: "rust", name: "Rust", languageId: 73 },
  { slug: "typescript", name: "TypeScript", languageId: 74 },
];

type BottomTab = "testcase" | "result" | "ai";

function parseTopics(topics: string[] | string | undefined): string[] {
  if (!topics) return [];
  if (Array.isArray(topics)) return topics.map(String);
  const raw = topics.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* comma-separated */
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseConstraints(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* plain */
  }
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function difficultyClass(d: string): string {
  const u = d.trim().toUpperCase();
  if (u === "EASY") return "bg-[#1A3F33] text-easy border-[#235343]";
  if (u === "MEDIUM") return "bg-[#3F351A] text-medium border-[#534723]";
  if (u === "HARD") return "bg-[#3F1A1A] text-hard border-[#532323]";
  return "bg-surface-container-high text-on-surface-variant border-outline-variant/30";
}

function formatDifficulty(d: string): string {
  const u = d.trim().toUpperCase();
  if (u === "EASY") return "Easy";
  if (u === "MEDIUM") return "Medium";
  if (u === "HARD") return "Hard";
  return d;
}

function formatMemoryKb(kb?: number): string {
  if (kb == null || !Number.isFinite(kb)) return "—";
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${Math.round(kb)} KB`;
}

function formatTimeSec(sec?: number): string {
  if (sec == null || !Number.isFinite(sec)) return "—";
  return `${Math.round(sec * 1000)} ms`;
}

function verdictColor(verdict: string): string {
  const v = verdict.toUpperCase();
  if (v.includes("ACCEPT")) return "text-easy";
  if (v.includes("WRONG") || v.includes("FAIL")) return "text-hard";
  if (v.includes("COMPIL")) return "text-medium";
  return "text-primary";
}

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}

export default function ProblemWorkspace() {
  const { id } = useParams();
  const problemId = Number(id);
  const { user } = useAuth();

  const [problem, setProblem] = useState<ProblemPublicDTO | null>(null);
  const [languages, setLanguages] = useState<LanguageDTO[]>([]);
  const [language, setLanguage] = useState<LanguageDTO | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [langOpen, setLangOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcase");
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [caseStdins, setCaseStdins] = useState<string[]>([]);
  const [customStdin, setCustomStdin] = useState("");

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runSession, setRunSession] = useState<SampleRunSession | null>(null);
  const [verdict, setVerdict] = useState<JudgeVerdictDTO | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  const [splitPct, setSplitPct] = useState(45);
  const [editorPct, setEditorPct] = useState(62);
  const splitRef = useRef<HTMLElement | null>(null);
  const editorSplitRef = useRef<HTMLElement | null>(null);
  const draggingRef = useRef(false);
  const draggingEditorRef = useRef(false);
  const runAbortRef = useRef<AbortController | null>(null);

  const examples = useMemo(
    () => parseExamples(problem?.examples as string | undefined),
    [problem]
  );
  const topics = useMemo(() => parseTopics(problem?.topics), [problem]);
  const constraints = useMemo(
    () => parseConstraints(problem?.constraintsData),
    [problem]
  );

  useEffect(() => {
    const onMove = (clientX: number, clientY: number) => {
      if (draggingRef.current && splitRef.current) {
        const rect = splitRef.current.getBoundingClientRect();
        const horizontal = window.matchMedia("(min-width: 768px)").matches;
        const pct = horizontal
          ? ((clientX - rect.left) / rect.width) * 100
          : ((clientY - rect.top) / rect.height) * 100;
        setSplitPct(Math.min(72, Math.max(28, pct)));
      }
      if (draggingEditorRef.current && editorSplitRef.current) {
        const rect = editorSplitRef.current.getBoundingClientRect();
        const pct = ((clientY - rect.top) / rect.height) * 100;
        setEditorPct(Math.min(80, Math.max(28, pct)));
      }
    };

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const stop = () => {
      if (draggingRef.current || draggingEditorRef.current) {
        draggingRef.current = false;
        draggingEditorRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
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
    document.body.style.cursor = window.matchMedia("(min-width: 768px)").matches
      ? "col-resize"
      : "row-resize";
    document.body.style.userSelect = "none";
  };

  const startEditorResize = () => {
    draggingEditorRef.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!Number.isFinite(problemId) || problemId <= 0) {
      setError("Invalid problem id.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const p = await getProblem(problemId);
        if (cancelled) return;
        setProblem(p);

        let langs = FALLBACK_LANGUAGES;
        try {
          langs = await getLanguages();
        } catch {
          /* guests / offline: fallback list */
        }
        if (cancelled) return;
        setLanguages(langs);

        const preferred = pickPreferredLanguage(langs);
        setLanguage(preferred);
        if (preferred) {
          const draft = loadCodeDraft(problemId, preferred.slug);
          setCode(draft ?? STARTER[preferred.slug] ?? "");
        }

        const exs = parseExamples(p.examples as string | undefined);
        setCaseStdins(exs.map((ex) => resolveSampleStdin(undefined, ex.input)));
        setActiveCaseIdx(0);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Failed to load problem."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      runAbortRef.current?.abort();
    };
  }, [problemId]);

  useEffect(() => {
    if (!language || !Number.isFinite(problemId) || loading) return;
    const t = window.setTimeout(() => {
      saveCodeDraft(problemId, language.slug, code);
    }, 400);
    return () => window.clearTimeout(t);
  }, [code, language, problemId, loading]);

  const handleLanguageChange = (slug: string) => {
    if (language) saveCodeDraft(problemId, language.slug, code);
    const lang = languages.find((l) => l.slug === slug) || null;
    setLanguage(lang);
    setLangOpen(false);
    if (!lang) return;
    setPreferredLanguage(lang.slug);
    const draft = loadCodeDraft(problemId, lang.slug);
    setCode(draft ?? STARTER[lang.slug] ?? "");
  };

  const requireAuth = (action: string): boolean => {
    if (user) return true;
    setActionError(`Log in to ${action}.`);
    setBottomTab("result");
    return false;
  };

  const handleRun = async () => {
    if (!language) return;
    if (!requireAuth("run code")) return;

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
    if (!language) return;
    if (!requireAuth("submit")) return;

    runAbortRef.current?.abort();
    setSubmitting(true);
    setActionError(null);
    setVerdict(null);
    setRunSession(null);
    setBottomTab("result");

    try {
      const res = await submitCode({
        userId: user!.id,
        problemId,
        languageId: language.languageId,
        language: language.slug,
        code,
      });
      setVerdict(res);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const onBookmark = () => {
    if (!user) {
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 2500);
      return;
    }
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#09040D] text-on-surface">
        <AppNav activeHint="/problems" />
        <div className="flex flex-1 items-center justify-center pt-16">
          <p className="font-label-md text-on-surface-variant">Loading problem…</p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex min-h-screen flex-col bg-[#09040D] text-on-surface">
        <AppNav activeHint="/problems" />
        <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 pt-16 text-center">
          <p className="font-headline-lg text-headline-lg-mobile text-hard">
            {error || "Problem not found"}
          </p>
          <Link to="/problems" className="text-primary hover:underline">
            Back to Problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="font-body-md flex h-screen flex-col overflow-hidden bg-background text-on-background antialiased selection:bg-primary-container selection:text-on-primary-container">
      <AppNav
        activeHint="/problems"
        workspaceActions={
          user ? (
            <button
              type="button"
              className="font-label-md text-label-md flex items-center gap-2 rounded border border-primary/30 px-4 py-2 text-primary transition-all hover:bg-primary/10"
              onClick={() => setActionError("Invite / CodeRoom is coming soon.")}
              title="Coming soon"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Invite
            </button>
          ) : null
        }
      />

      <main
        ref={splitRef}
        className="mt-16 flex h-[calc(100vh-64px)] min-h-0 flex-1 flex-col overflow-hidden bg-[#09040D] p-2 md:flex-row"
      >
        {/* Left: statement */}
        <section
          className="glass-panel relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg"
          style={{
            flexBasis: `${splitPct}%`,
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/30 bg-surface-container/50 p-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-on-surface-variant">
                menu_book
              </span>
              <span className="font-label-md text-label-md text-on-background">
                Description
              </span>
            </div>
            <button
              type="button"
              onClick={onBookmark}
              className="group relative text-on-surface-variant transition-colors hover:text-primary"
              title={user ? "Save" : "Save (Login Required)"}
            >
              <span className="material-symbols-outlined text-lg">bookmark_border</span>
              {!user && (
                <span className="absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded bg-surface-container-highest p-1 text-xs text-on-surface group-hover:block">
                  Save (Login Required)
                </span>
              )}
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <div>
              <h1 className="font-headline-lg text-headline-lg mb-3 text-primary">
                {problem.id}. {problem.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 font-label-md text-[12px] ${difficultyClass(problem.difficulty)}`}
                >
                  {formatDifficulty(problem.difficulty)}
                </span>
                {topics.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 rounded-full border border-outline-variant/30 bg-surface-container-high px-3 py-1 font-label-md text-[12px] text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      local_offer
                    </span>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="font-body-md whitespace-pre-wrap leading-relaxed text-on-surface-variant">
              {problem.description}
            </div>

            {examples.length > 0 && (
              <div className="space-y-4">
                {examples.map((ex, i) => {
                  const inputText = formatExample(ex.input);
                  const outputText = exampleOutputToExpected(ex.output);
                  const block = [
                    `Input:\n${inputText}`,
                    `Output:\n${outputText}`,
                    ex.explanation ? `Explanation: ${ex.explanation}` : "",
                  ]
                    .filter(Boolean)
                    .join("\n\n");
                  return (
                    <div key={i}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-label-md text-on-background">
                          Example {i + 1}:
                        </p>
                        <button
                          type="button"
                          className="text-on-surface-variant transition-colors hover:text-primary"
                          onClick={() => copyText(block)}
                          aria-label="Copy example"
                        >
                          <span className="material-symbols-outlined text-sm">
                            content_copy
                          </span>
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                            Input
                          </p>
                          <IoPre>{inputText}</IoPre>
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                            Output
                          </p>
                          <IoPre tone="ok">{outputText}</IoPre>
                        </div>
                        {ex.explanation ? (
                          <p className="text-sm text-on-surface-variant">
                            {ex.explanation}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {constraints.length > 0 && (
              <div>
                <p className="font-label-md mb-2 text-on-background">Constraints:</p>
                <ul className="font-code-sm list-inside list-disc space-y-1 text-on-surface-variant">
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

        {/* Horizontal / vertical resize: statement ↔ workspace */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize statement and editor"
          onMouseDown={(e) => {
            e.preventDefault();
            startResize();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            startResize();
          }}
          className="group relative z-10 flex h-3 shrink-0 cursor-row-resize items-center justify-center rounded hover:bg-primary/10 md:h-auto md:w-2 md:cursor-col-resize"
        >
          <div className="h-1 w-10 rounded-full bg-outline-variant/60 group-hover:bg-primary md:h-10 md:w-1" />
        </div>

        {/* Right: IDE + terminal */}
        <section
          ref={editorSplitRef}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div
            className="glass-panel flex min-h-[140px] flex-col overflow-hidden rounded-lg"
            style={{ flex: `0 0 ${editorPct}%` }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/30 bg-surface-container/50 p-2">
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLangOpen((o) => !o)}
                  className="font-code-sm flex items-center gap-2 rounded border border-outline-variant/50 bg-surface-container-high px-3 py-1.5 text-xs text-on-surface transition-colors hover:bg-surface-variant"
                >
                  {language?.name || "Language"}
                  <span className="material-symbols-outlined text-[16px]">
                    expand_more
                  </span>
                </button>
                {langOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1 max-h-56 min-w-[10rem] overflow-y-auto rounded border border-outline-variant/40 bg-surface-container-high py-1 shadow-lg">
                    {languages.map((l) => (
                      <button
                        key={l.slug}
                        type="button"
                        className={`block w-full px-3 py-1.5 text-left font-code-sm text-xs hover:bg-surface-variant ${
                          l.slug === language?.slug ? "text-primary" : "text-on-surface"
                        }`}
                        onClick={() => handleLanguageChange(l.slug)}
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
                  disabled={running || submitting || !language}
                  onClick={handleRun}
                  className="font-label-md text-label-md rounded border border-outline-variant/50 px-4 py-1.5 text-on-surface transition-all hover:bg-surface-variant hover:text-secondary disabled:opacity-50"
                >
                  {running ? "Running…" : "Run"}
                </button>
                <button
                  type="button"
                  disabled={running || submitting || !language}
                  onClick={handleSubmit}
                  className="font-label-md text-label-md group relative rounded border border-primary bg-primary/10 px-4 py-1.5 text-primary transition-all hover:bg-primary/20 hover:shadow-[0_0_10px_rgba(221,183,255,0.3)] disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit"}
                  {!user && (
                    <span className="absolute right-0 top-full z-50 mt-2 hidden whitespace-nowrap rounded bg-surface-container-highest p-1 text-xs text-on-surface group-hover:block">
                      Login Required to Submit
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0d1117]">
              <Editor
                key={MONACO_LANG[language?.slug || "python"] || "plaintext"}
                height="100%"
                width="100%"
                theme={CODEIT_THEME}
                language={MONACO_LANG[language?.slug || "python"] || "plaintext"}
                value={code}
                onChange={(v) => setCode(v ?? "")}
                beforeMount={defineCodeitTheme}
                loading={
                  <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                    Loading editor…
                  </div>
                }
                options={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 12 },
                  automaticLayout: true,
                  tabSize: 2,
                  renderLineHighlight: "line",
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true },
                }}
              />
            </div>
          </div>

          {/* Resize: editor ↔ terminal */}
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize editor and test panel"
            onMouseDown={(e) => {
              e.preventDefault();
              startEditorResize();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              startEditorResize();
            }}
            className="group relative z-10 flex h-3 shrink-0 cursor-row-resize items-center justify-center rounded hover:bg-primary/10"
          >
            <div className="h-1 w-10 rounded-full bg-outline-variant/60 group-hover:bg-primary" />
          </div>

          <div className="glass-panel flex min-h-[140px] min-w-0 flex-1 flex-col overflow-hidden rounded-lg">
            <div className="flex shrink-0 items-center gap-1 border-b border-outline-variant/30 bg-surface-container/50 p-1">
              {(
                [
                  { id: "testcase" as const, icon: "fact_check", label: "Testcase" },
                  { id: "result" as const, icon: "terminal", label: "Test Result" },
                  { id: "ai" as const, icon: "smart_toy", label: "AI Coach", accent: true },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBottomTab(tab.id)}
                  className={`font-label-md mr-0 flex items-center gap-2 rounded-t-md px-4 py-2 text-xs transition-colors ${
                    tab.id === "ai" ? "ml-auto mr-1" : ""
                  } ${
                    bottomTab === tab.id
                      ? "border-b-2 border-primary bg-surface-variant text-primary"
                      : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[14px] ${
                      "accent" in tab && tab.accent ? "text-[#A855F7]" : ""
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-surface-container-lowest p-4">
              {bottomTab === "testcase" && (
                <div className="space-y-3">
                  {examples.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {examples.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveCaseIdx(i)}
                            className={`rounded px-3 py-1 font-label-md text-xs ${
                              activeCaseIdx === i
                                ? "bg-primary/20 text-primary"
                                : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            Case {i + 1}
                          </button>
                        ))}
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-on-surface-variant">stdin</p>
                        <textarea
                          className="mono min-h-[5rem] w-full resize-y rounded border border-outline-variant/30 bg-surface-container-lowest p-3 text-[13px] leading-[1.55] tracking-wide text-on-surface outline-none focus:border-primary"
                          spellCheck={false}
                          value={caseStdins[activeCaseIdx] ?? ""}
                          onChange={(e) => {
                            const next = [...caseStdins];
                            next[activeCaseIdx] = e.target.value;
                            setCaseStdins(next);
                          }}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-on-surface-variant">
                          Expected output
                        </p>
                        <IoPre tone="ok">
                          {exampleOutputToExpected(
                            examples[activeCaseIdx]?.output
                          )}
                        </IoPre>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="mb-1 text-xs text-on-surface-variant">
                        Custom stdin
                      </p>
                      <textarea
                        className="font-code-sm min-h-[8rem] w-full resize-y rounded border border-outline-variant/30 bg-surface-container/50 p-3 text-on-surface outline-none focus:border-primary"
                        value={customStdin}
                        onChange={(e) => setCustomStdin(e.target.value)}
                        placeholder="Enter stdin for a custom run…"
                      />
                    </div>
                  )}
                </div>
              )}

              {bottomTab === "result" && (
                <div className="space-y-4">
                  {actionError && (
                    <p className="rounded border border-hard/40 bg-hard/10 p-3 text-sm text-hard">
                      {actionError}{" "}
                      {!user && (
                        <Link to="/login" className="underline text-primary">
                          Log in
                        </Link>
                      )}
                    </p>
                  )}

                  {!actionError && !runSession && !verdict && (
                    <p className="text-sm text-on-surface-variant">
                      Run sample tests or submit to see results here.
                    </p>
                  )}

                  {verdict && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-headline-lg flex items-center gap-2 text-xl ${verdictColor(verdict.verdict)}`}
                          >
                            <span className="material-symbols-outlined">
                              {verdict.verdict.toUpperCase().includes("ACCEPT")
                                ? "check_circle"
                                : "cancel"}
                            </span>
                            {verdict.verdict}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border border-outline-variant/20 bg-surface-container/50 p-3">
                          <p className="mb-1 text-xs text-on-surface-variant">Runtime</p>
                          <p className="font-code-sm text-lg text-on-surface">
                            {formatTimeSec(verdict.time)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-outline-variant/20 bg-surface-container/50 p-3">
                          <p className="mb-1 text-xs text-on-surface-variant">Memory</p>
                          <p className="font-code-sm text-lg text-on-surface">
                            {formatMemoryKb(verdict.memory)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-outline-variant/20 bg-surface-container/50 p-3">
                          <p className="mb-1 text-xs text-on-surface-variant">
                            Test Cases
                          </p>
                          <p className="font-code-sm text-lg text-on-surface">
                            {verdict.passedCount ?? "—"}/{verdict.totalCount ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {runSession && !verdict && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-3">
                        <span
                          className={`font-headline-lg flex items-center gap-2 text-xl ${verdictColor(runSession.overall)}`}
                        >
                          <span className="material-symbols-outlined">
                            {runSession.overall === "Accepted"
                              ? "check_circle"
                              : "cancel"}
                          </span>
                          {runSession.overall}
                        </span>
                        <span className="text-sm text-on-surface-variant">
                          Sample run
                        </span>
                      </div>

                      {runSession.compileOutput && (
                        <pre className="font-code-sm whitespace-pre-wrap rounded border border-hard/30 bg-hard/10 p-3 text-hard">
                          {runSession.compileOutput}
                        </pre>
                      )}

                      {runSession.cases.map((c) => (
                        <div
                          key={c.index}
                          className="space-y-2 rounded-lg border border-outline-variant/20 bg-surface-container/40 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-label-md text-sm">
                              Case {c.index}
                            </span>
                            <span
                              className={`text-xs ${c.passed ? "text-easy" : "text-hard"}`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <div className="grid gap-2 text-xs md:grid-cols-3">
                            <div>
                              <p className="mb-1 text-on-surface-variant">Input</p>
                              <IoPre>{c.inputDisplay}</IoPre>
                            </div>
                            <div>
                              <p className="mb-1 text-on-surface-variant">Expected</p>
                              <IoPre tone="ok">{c.expectedOutput || "(none)"}</IoPre>
                            </div>
                            <div>
                              <p className="mb-1 text-on-surface-variant">Output</p>
                              <IoPre tone={c.passed ? "ok" : "error"}>
                                {c.userOutput || "(empty)"}
                              </IoPre>
                            </div>
                          </div>
                          {c.message && (
                            <IoPre tone="error">{c.message}</IoPre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {bottomTab === "ai" && (
                <div className="flex h-full flex-col items-start justify-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl text-[#A855F7]">
                    smart_toy
                  </span>
                  <p className="font-label-md text-on-surface">AI Coach</p>
                  <p className="text-sm">
                    Coming soon in the Stitch frontend. Use the production app for
                    coaching meanwhile.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded border border-outline-variant/40 bg-surface-container-high px-4 py-2 text-sm text-on-surface shadow-lg">
          {user ? "Draft auto-saved locally." : "Log in to save bookmarks."}
        </div>
      )}
    </div>
  );
}
