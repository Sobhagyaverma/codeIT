import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { IoPre } from "../components/IoPre";
import { useAuth } from "../context/AuthContext";
import LearningCoachPanel from "../features/ai-coach/components/LearningCoachPanel";
import { createRoom, endRoom, getMyRooms } from "../features/collaboration/api";
import { roomCodeOf } from "../features/collaboration/roomLinks";
import type { RoomSummary } from "../features/collaboration/types";
import {
  ApiError,
  describeApiError,
  getLanguages,
  getProblem,
  submitCode,
  type JudgeVerdictDTO,
  type LanguageDTO,
  type ProblemPublicDTO,
} from "../lib/api";
import { useToast } from "../context/ToastContext";
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
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [inviting, setInviting] = useState(false);
  const [endingRoom, setEndingRoom] = useState(false);
  const [hostedRoom, setHostedRoom] = useState<RoomSummary | null>(null);

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

  const [splitPct, setSplitPct] = useState(40);
  const [editorPct, setEditorPct] = useState(68);
  const splitRef = useRef<HTMLDivElement | null>(null);
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
    if (!user) {
      setHostedRoom(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        // Include CodeRoom leftovers — those also block Invite via "one active host room".
        const rooms = await getMyRooms({
          status: "ACTIVE",
          limit: 50,
        });
        if (cancelled) return;
        const hosted = rooms.filter((r) => r.role === "HOST");
        const forThisProblem =
          hosted.find(
            (r) => r.type === "PROBLEM_COLLAB" && r.problemId === problemId
          ) ?? null;
        setHostedRoom(forThisProblem ?? hosted[0] ?? null);
      } catch {
        if (!cancelled) setHostedRoom(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, problemId]);

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
      <div className="problem-workspace flex min-h-screen flex-col text-on-surface">
        <div className="pw-ambient" aria-hidden />
        <AppNav activeHint="/problems" />
        <div className="relative z-10 flex flex-1 items-center justify-center pt-16">
          <p className="font-label-md text-on-surface-variant">Loading problem…</p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="problem-workspace flex min-h-screen flex-col text-on-surface">
        <div className="pw-ambient" aria-hidden />
        <AppNav activeHint="/problems" />
        <div className="relative z-10 mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 pt-16 text-center">
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
    <div className="problem-workspace font-body-md relative flex h-screen flex-col overflow-hidden text-on-background antialiased selection:bg-primary-container selection:text-on-primary-container">
      <div className="pw-ambient" aria-hidden />
      <AppNav
        activeHint="/problems"
        workspaceActions={
          user ? (
            <div className="flex items-center gap-2">
              {hostedRoom && (
                <>
                  <button
                    type="button"
                    className="font-label-md text-label-md flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 py-2 text-primary transition-all hover:border-primary/55 hover:bg-primary/15 disabled:opacity-50"
                    onClick={() => {
                      if (hostedRoom.type === "CODEROOM") {
                        navigate(
                          `/coderoom/${hostedRoom.id}?code=${encodeURIComponent(roomCodeOf(hostedRoom))}`
                        );
                        return;
                      }
                      navigate(
                        `/problems/${hostedRoom.problemId ?? problemId}/room/${hostedRoom.id}?code=${encodeURIComponent(roomCodeOf(hostedRoom))}`
                      );
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">
                      meeting_room
                    </span>
                    {hostedRoom.type === "PROBLEM_COLLAB" &&
                    hostedRoom.problemId === problemId
                      ? "Open room"
                      : "Open other room"}
                  </button>
                  <button
                    type="button"
                    disabled={endingRoom}
                    className="font-label-md text-label-md flex items-center gap-2 rounded-full border border-hard/40 bg-hard/10 px-4 py-2 text-hard transition-all hover:bg-hard/15 disabled:opacity-50"
                    onClick={() => {
                      void (async () => {
                        setEndingRoom(true);
                        try {
                          await endRoom(hostedRoom.id);
                          setHostedRoom(null);
                          showToast({
                            title: "Room ended",
                            tone: "success",
                            icon: "check_circle",
                          });
                        } catch (err) {
                          showToast({
                            title: "Couldn’t end room",
                            message: describeApiError(err, "Try again."),
                            tone: "error",
                            icon: "error",
                          });
                        } finally {
                          setEndingRoom(false);
                        }
                      })();
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">
                      stop_circle
                    </span>
                    {endingRoom ? "Ending…" : "End room"}
                  </button>
                </>
              )}
              {(!hostedRoom || hostedRoom.problemId !== problemId) && (
                <button
                  type="button"
                  disabled={inviting || endingRoom}
                  className="font-label-md text-label-md flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 py-2 text-primary shadow-[0_0_16px_rgba(168,85,247,0.15)] transition-all hover:border-primary/55 hover:bg-primary/15 hover:shadow-[0_0_24px_rgba(168,85,247,0.3)] disabled:opacity-50"
                  onClick={() => {
                    void (async () => {
                      setInviting(true);
                      setActionError(null);
                      try {
                        // End any leftover hosted room (CodeRoom or other problem)
                        // so Invite never dead-ends with a 409.
                        if (hostedRoom && hostedRoom.role === "HOST") {
                          const sameProblem =
                            hostedRoom.type === "PROBLEM_COLLAB" &&
                            hostedRoom.problemId === problemId;
                          if (!sameProblem) {
                            await endRoom(hostedRoom.id);
                            setHostedRoom(null);
                          }
                        }
                        const room = await createRoom({
                          type: "PROBLEM_COLLAB",
                          problemId,
                          language: language?.slug || "python",
                        });
                        navigate(
                          `/problems/${problemId}/room/${room.id}?code=${encodeURIComponent(roomCodeOf(room))}`
                        );
                      } catch (err) {
                        if (
                          err instanceof ApiError &&
                          err.status === 409
                        ) {
                          try {
                            const rooms = await getMyRooms({
                              status: "ACTIVE",
                              limit: 50,
                            });
                            const blockers = rooms.filter(
                              (r) => r.role === "HOST"
                            );
                            for (const r of blockers) {
                              try {
                                await endRoom(r.id);
                              } catch {
                                /* already ended */
                              }
                            }
                            setHostedRoom(null);
                            const room = await createRoom({
                              type: "PROBLEM_COLLAB",
                              problemId,
                              language: language?.slug || "python",
                            });
                            navigate(
                              `/problems/${problemId}/room/${room.id}?code=${encodeURIComponent(roomCodeOf(room))}`
                            );
                            return;
                          } catch (retryErr) {
                            const message = describeApiError(
                              retryErr,
                              "Failed to start collab room."
                            );
                            setActionError(message);
                            showToast({
                              title: "Invite failed",
                              message,
                              tone: "error",
                              icon: "error",
                            });
                            return;
                          }
                        }
                        const message = describeApiError(
                          err,
                          "Failed to start collab room."
                        );
                        setActionError(message);
                        showToast({
                          title: "Invite failed",
                          message,
                          tone: "error",
                          icon: "error",
                        });
                      } finally {
                        setInviting(false);
                      }
                    })();
                  }}
                >
                  <span className="material-symbols-outlined text-sm">
                    person_add
                  </span>
                  {inviting
                    ? "Starting…"
                    : hostedRoom
                      ? "End & invite here"
                      : "Invite"}
                </button>
              )}
            </div>
          ) : null
        }
      />

      <main className="relative z-10 mt-16 flex h-[calc(100vh-64px)] min-h-0 flex-1 flex-col overflow-hidden p-3">
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
            <button
              type="button"
              onClick={onBookmark}
              className="group relative rounded-lg p-1.5 text-on-surface-variant transition-all hover:bg-primary/10 hover:text-primary"
              title={user ? "Save" : "Save (Login Required)"}
            >
              <span className="material-symbols-outlined text-lg">
                bookmark_border
              </span>
              {!user && (
                <span className="absolute right-0 bottom-full mb-2 hidden whitespace-nowrap rounded-lg border border-outline-variant/30 bg-surface-container-highest px-2 py-1 text-xs text-on-surface shadow-lg group-hover:block">
                  Save (Login Required)
                </span>
              )}
            </button>
          </div>

          <div className="pw-scroll min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <div>
              <h1 className="font-headline-lg mb-3 text-[26px] leading-tight font-semibold tracking-tight text-white md:text-[30px]">
                <span className="text-primary">{problem.id}.</span>{" "}
                {problem.title}
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
                    className="flex items-center gap-1 rounded-full border border-outline-variant/25 bg-white/5 px-3 py-1 font-label-md text-[12px] text-on-surface-variant backdrop-blur-sm"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      local_offer
                    </span>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="font-body-md whitespace-pre-wrap text-[15px] leading-relaxed text-on-surface-variant/90">
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
                    <div
                      key={i}
                      className="rounded-2xl border border-white/5 bg-black/25 p-4 transition-colors hover:border-primary/20"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-label-md text-[13px] font-semibold text-white">
                          Example {i + 1}
                        </p>
                        <button
                          type="button"
                          className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
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
                          <p className="mb-1 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                            Input
                          </p>
                          <IoPre>{inputText}</IoPre>
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
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
                <p className="font-label-md mb-2 text-[13px] font-semibold text-white">
                  Constraints
                </p>
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

        {/* Resize: statement ↔ workspace */}
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
          className="pw-resize pw-resize-col hidden md:flex"
        />
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize statement and editor"
          onMouseDown={(e) => {
            e.preventDefault();
            startResize();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            startResize();
          }}
          className="pw-resize pw-resize-row flex md:hidden"
        />

        {/* Right: unified IDE shell (editor dominates + integrated bottom) */}
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
                        className={`flex w-full items-center justify-between px-3.5 py-2 text-left font-code-sm text-[12px] transition-colors hover:bg-primary/10 ${
                          l.slug === language?.slug
                            ? "bg-primary/10 text-primary"
                            : "text-on-surface"
                        }`}
                        onClick={() => handleLanguageChange(l.slug)}
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
                  disabled={running || submitting || !language}
                  onClick={handleRun}
                  className="pw-btn-run font-label-md flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    play_arrow
                  </span>
                  {running ? "Running…" : "Run"}
                </button>
                <button
                  type="button"
                  disabled={running || submitting || !language}
                  onClick={handleSubmit}
                  className="pw-btn-submit font-label-md group relative flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    rocket_launch
                  </span>
                  {submitting ? "Submitting…" : "Submit"}
                  {!user && (
                    <span className="absolute top-full right-0 z-50 mt-2 hidden whitespace-nowrap rounded-lg border border-outline-variant/30 bg-surface-container-highest px-2 py-1 text-xs text-on-surface shadow-lg group-hover:block">
                      Login Required to Submit
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0a0610]">
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
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  automaticLayout: true,
                  tabSize: 2,
                  renderLineHighlight: "all",
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true },
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
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
            className="pw-resize pw-resize-row"
          />

          <div className="flex min-h-[140px] min-w-0 flex-1 flex-col overflow-hidden border-t border-white/5">
            <div className="pw-toolbar flex shrink-0 items-center gap-1 px-2 py-1.5">
              {(
                [
                  {
                    id: "testcase" as const,
                    icon: "fact_check",
                    label: "Testcase",
                  },
                  {
                    id: "result" as const,
                    icon: "terminal",
                    label: "Test Result",
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBottomTab(tab.id)}
                  className={`pw-tab font-label-md flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium ${
                    bottomTab === tab.id
                      ? "pw-tab-active bg-white/5 text-primary"
                      : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBottomTab("ai")}
                className={`pw-ai-tab font-label-md ml-auto flex items-center gap-2 px-4 py-1.5 text-[12px] font-semibold ${
                  bottomTab === "ai"
                    ? "pw-ai-tab-active text-[#e9d5ff]"
                    : "text-[#c084fc]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#a855f7]">
                  smart_toy
                </span>
                AI Coach
              </button>
            </div>

            <div className="pw-scroll min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-black/20 to-transparent p-4">
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
                          className="mono min-h-[5rem] w-full resize-y rounded-2xl border border-white/8 bg-black/30 p-3.5 text-[13px] leading-[1.55] tracking-wide text-on-surface outline-none transition-shadow focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(183,109,255,0.15)]"
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
                        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
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
                      <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                        Custom stdin
                      </p>
                      <textarea
                        className="font-code-sm min-h-[8rem] w-full resize-y rounded-2xl border border-white/8 bg-black/30 p-3.5 text-on-surface outline-none transition-shadow focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(183,109,255,0.15)]"
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
                    <p className="rounded-2xl border border-hard/40 bg-hard/10 p-3 text-sm text-hard">
                      {actionError}{" "}
                      {!user && (
                        <Link to="/login" className="text-primary underline">
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
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
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
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-white/6 bg-white/4 p-3.5">
                          <p className="mb-1 text-xs text-on-surface-variant">
                            Runtime
                          </p>
                          <p className="font-code-sm text-lg text-on-surface">
                            {formatTimeSec(verdict.time)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/6 bg-white/4 p-3.5">
                          <p className="mb-1 text-xs text-on-surface-variant">
                            Memory
                          </p>
                          <p className="font-code-sm text-lg text-on-surface">
                            {formatMemoryKb(verdict.memory)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/6 bg-white/4 p-3.5">
                          <p className="mb-1 text-xs text-on-surface-variant">
                            Test Cases
                          </p>
                          <p className="font-code-sm text-lg text-on-surface">
                            {verdict.passedCount ?? "—"}/
                            {verdict.totalCount ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {runSession && !verdict && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
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
                        <pre className="font-code-sm whitespace-pre-wrap rounded-2xl border border-hard/30 bg-hard/10 p-3 text-hard">
                          {runSession.compileOutput}
                        </pre>
                      )}

                      {runSession.cases.map((c) => (
                        <div
                          key={c.index}
                          className="space-y-2 rounded-2xl border border-white/6 bg-white/4 p-3.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-label-md text-sm">
                              Case {c.index}
                            </span>
                            <span
                              className={`text-xs font-medium ${c.passed ? "text-easy" : "text-hard"}`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <div className="grid gap-2 text-xs md:grid-cols-3">
                            <div>
                              <p className="mb-1 text-on-surface-variant">
                                Input
                              </p>
                              <IoPre>{c.inputDisplay}</IoPre>
                            </div>
                            <div>
                              <p className="mb-1 text-on-surface-variant">
                                Expected
                              </p>
                              <IoPre tone="ok">
                                {c.expectedOutput || "(none)"}
                              </IoPre>
                            </div>
                            <div>
                              <p className="mb-1 text-on-surface-variant">
                                Output
                              </p>
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
                <LearningCoachPanel
                  problemId={problemId}
                  language={language?.slug || "python"}
                  languageId={language?.languageId || 71}
                  code={code}
                  verdict={verdict}
                  enabled={!!user}
                />
              )}
            </div>
          </div>
        </section>
        </div>
      </main>

      {savedToast && (
        <div className="fixed right-6 bottom-6 z-50 rounded-2xl border border-primary/25 bg-surface-container-high/95 px-4 py-2.5 text-sm text-on-surface shadow-[0_0_24px_rgba(168,85,247,0.25)] backdrop-blur-md">
          {user ? "Draft auto-saved locally." : "Log in to save bookmarks."}
        </div>
      )}
    </div>
  );
}
