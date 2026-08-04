import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Editor from "@monaco-editor/react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { IoPre } from "../components/IoPre";
import { useAuth } from "../context/AuthContext";
import {
  endRoom,
  getRoom,
  getRoomMessages,
  joinRoom,
  leaveRoom,
  runRoomCode,
  sendRoomMessage,
  submitRoomCode,
} from "../features/collaboration/api";
import ConnectionStatus from "../features/collaboration/ConnectionStatus";
import { useYjsCodeEditor } from "../features/collaboration/hooks/useYjsCodeEditor";
import InviteModal from "../features/collaboration/InviteModal";
import {
  problemCollabShareUrl,
  roomCodeFromSearchParams,
  roomCodeOf,
} from "../features/collaboration/roomLinks";
import type { Room, RoomMessage } from "../features/collaboration/types";
import {
  ApiError,
  getLanguages,
  getProblem,
  type JudgeVerdictDTO,
  type LanguageDTO,
  type ProblemPublicDTO,
} from "../lib/api";
import {
  formatExample,
  parseExamples,
  resolveSampleStdin,
} from "../lib/examples";
import { CODEIT_THEME, defineCodeitTheme } from "../lib/monacoTheme";

const STARTER: Record<string, string> = {
  python:
    "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n\nif __name__ == '__main__':\n    main()\n",
  java:
    "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\nint main() { return 0; }\n",
  javascript:
    "const lines = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n');\n",
};

const MONACO_LANG: Record<string, string> = {
  python: "python",
  java: "java",
  cpp: "cpp",
  javascript: "javascript",
};

type BottomTab = "testcase" | "result";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function difficultyClass(d?: string): string {
  const u = (d || "").trim().toUpperCase();
  if (u === "EASY") return "bg-[#1A3F33] text-easy border-[#235343]";
  if (u === "MEDIUM") return "bg-[#3F351A] text-medium border-[#534723]";
  if (u === "HARD") return "bg-[#3F1A1A] text-hard border-[#532323]";
  return "bg-surface-container-high text-on-surface-variant border-outline-variant/30";
}

function formatDifficulty(d?: string): string {
  const u = (d || "").trim().toUpperCase();
  if (u === "EASY") return "Easy";
  if (u === "MEDIUM") return "Medium";
  if (u === "HARD") return "Hard";
  return d || "—";
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

export default function ProblemCollabRoom() {
  const { id, roomId } = useParams<{ id: string; roomId: string }>();
  const problemId = Number(id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [problem, setProblem] = useState<ProblemPublicDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<LanguageDTO[]>([]);
  const [output, setOutput] = useState("");
  const [verdict, setVerdict] = useState<JudgeVerdictDTO | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [sideTab, setSideTab] = useState<"chat" | "people">("chat");
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcase");
  const [splitPct, setSplitPct] = useState(34);
  const [editorPct, setEditorPct] = useState(62);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const editorSplitRef = useRef<HTMLElement | null>(null);
  const draggingRef = useRef(false);
  const draggingEditorRef = useRef(false);

  const languageSlug = room?.language || "python";
  const languageMeta = useMemo(
    () => languages.find((l) => l.slug === languageSlug) || null,
    [languages, languageSlug]
  );
  const canEdit =
    !!user &&
    !!room &&
    room.members.some(
      (m) =>
        m.userId === user.id && (m.role === "HOST" || m.role === "EDITOR")
    );
  const examples = useMemo(
    () => parseExamples(problem?.examples as string | undefined),
    [problem]
  );
  const constraints = useMemo(
    () => parseConstraints(problem?.constraintsData),
    [problem]
  );
  const shareUrl =
    room && roomId && Number.isFinite(problemId)
      ? problemCollabShareUrl(problemId, roomId, roomCodeOf(room))
      : "";

  const {
    connectionStatus,
    error: syncError,
    bindEditor,
    getCode,
    customStdin,
    setCustomStdin,
  } = useYjsCodeEditor({
    roomId: roomId || "",
    language: languageSlug,
    enabled: !!room,
    readOnly: !canEdit,
    userName: user?.uniqueUserId || user?.name || "user",
    userId: user?.id,
    fallbackCode: STARTER[languageSlug] ?? STARTER.python,
  });

  useEffect(() => {
    void getLanguages().catch(() => [] as LanguageDTO[]).then(setLanguages);
  }, []);

  useEffect(() => {
    if (!examples[0]) return;
    if (customStdin.trim()) return;
    setCustomStdin(resolveSampleStdin(undefined, examples[0].input));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examples]);

  useEffect(() => {
    const onMove = (clientX: number, clientY: number) => {
      if (draggingRef.current && splitRef.current) {
        const rect = splitRef.current.getBoundingClientRect();
        const railReserve = window.matchMedia("(min-width: 768px)").matches
          ? 280
          : 0;
        const usable = Math.max(200, rect.width - railReserve);
        const pct = ((clientX - rect.left) / usable) * 100;
        setSplitPct(Math.min(55, Math.max(24, pct)));
      }
      if (draggingEditorRef.current && editorSplitRef.current) {
        const rect = editorSplitRef.current.getBoundingClientRect();
        const pct = ((clientY - rect.top) / rect.height) * 100;
        setEditorPct(Math.min(80, Math.max(28, pct)));
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

  useEffect(() => {
    if (!roomId || !Number.isFinite(problemId)) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [r, p] = await Promise.all([
          getRoom(roomId),
          getProblem(problemId),
        ]);
        if (cancelled) return;
        setRoom(r);
        setProblem(p);
        const msgs = await getRoomMessages(roomId).catch(() => []);
        if (!cancelled) setMessages(msgs);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load collab room."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, problemId]);

  useEffect(() => {
    const codeParam = roomCodeFromSearchParams(searchParams);
    if (!codeParam || room || joining || !error || !roomId) return;
    if (!user) {
      navigate("/login", {
        state: {
          from: `/problems/${problemId}/room/${roomId}?code=${encodeURIComponent(codeParam)}`,
        },
      });
      return;
    }
    setJoining(true);
    void joinRoom(codeParam)
      .then((r) => {
        setRoom(r);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to join")
      )
      .finally(() => setJoining(false));
  }, [
    searchParams,
    room,
    error,
    joining,
    user,
    navigate,
    roomId,
    problemId,
  ]);

  const handleRun = async () => {
    if (!roomId || !languageMeta) return;
    setRunning(true);
    setVerdict(null);
    setBottomTab("result");
    try {
      const result = await runRoomCode(roomId, {
        sourceCode: getCode(),
        languageId: languageMeta.languageId,
        stdin: customStdin || undefined,
      });
      const stdout =
        typeof result.stdout === "string" ? result.stdout : "";
      const stderr =
        typeof result.stderr === "string" ? result.stderr : "";
      setOutput([stdout, stderr].filter(Boolean).join("\n") || "(empty)");
    } catch (err) {
      setOutput(err instanceof Error ? err.message : "Run failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!roomId || !languageMeta) return;
    setSubmitting(true);
    setBottomTab("result");
    try {
      const res = (await submitRoomCode(roomId, {
        code: getCode(),
        languageId: languageMeta.languageId,
      })) as JudgeVerdictDTO;
      setVerdict(res);
    } catch (err) {
      setOutput(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (!roomId || !chatInput.trim()) return;
    try {
      const msg = await sendRoomMessage(roomId, chatInput.trim());
      setMessages((prev) => [...prev, msg]);
      setChatInput("");
    } catch {
      /* ignore */
    }
  };

  const shell = (body: ReactNode) => (
    <div className="problem-workspace font-body-md relative flex min-h-screen flex-col overflow-hidden text-on-background antialiased">
      <div className="pw-ambient" aria-hidden />
      <AppNav activeHint="/problems" />
      <div className="relative z-10 flex flex-1 items-center justify-center pt-16">
        {body}
      </div>
    </div>
  );

  if (!user) {
    return shell(
      <div className="flex flex-col items-center gap-3">
        <p>Sign in to collaborate.</p>
        <Link to="/login" className="text-primary hover:underline">
          Login
        </Link>
      </div>
    );
  }

  if (loading || joining) {
    return shell(
      <p className="text-on-surface-variant">
        {joining ? "Joining…" : "Loading…"}
      </p>
    );
  }

  if (error || !room || !problem) {
    return shell(
      <div className="flex flex-col items-center gap-3">
        <p className="text-hard">{error || "Room unavailable"}</p>
        <Link to={`/problems/${problemId}`} className="text-primary">
          Back to problem
        </Link>
      </div>
    );
  }

  const isHost = room.hostUserId === user.id;

  return (
    <div className="problem-workspace font-body-md relative flex h-screen flex-col overflow-hidden text-on-background antialiased selection:bg-primary-container selection:text-on-primary-container">
      <div className="pw-ambient" aria-hidden />
      <AppNav
        activeHint="/problems"
        workspaceActions={
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="font-label-md text-label-md flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 py-2 text-primary shadow-[0_0_16px_rgba(168,85,247,0.15)] transition-all hover:border-primary/55 hover:bg-primary/15 hover:shadow-[0_0_24px_rgba(168,85,247,0.3)]"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Invite
          </button>
        }
      />

      <main className="relative z-10 mt-16 flex h-[calc(100vh-64px)] min-h-0 flex-1 flex-col overflow-hidden p-3">
        <div
          ref={splitRef}
          className="pw-workspace-frame flex min-h-0 flex-1 flex-col md:flex-row"
        >
          {/* Statement */}
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
                <Link
                  to={`/problems/${problemId}`}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors hover:bg-primary/25"
                  title="Back to problem"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_back
                  </span>
                </Link>
                <span className="font-label-md text-[13px] font-semibold tracking-wide text-on-background">
                  Description
                </span>
              </div>
              <ConnectionStatus status={connectionStatus} />
            </div>

            <div className="pw-scroll min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
              <div>
                <h1 className="font-headline-lg mb-3 text-[26px] leading-tight font-semibold tracking-tight text-white md:text-[30px]">
                  <span className="text-primary">{problem.id}.</span>{" "}
                  {problem.title}
                </h1>
                <span
                  className={`inline-block rounded-full border px-3 py-1 font-label-md text-[12px] ${difficultyClass(problem.difficulty)}`}
                >
                  {formatDifficulty(problem.difficulty)}
                </span>
              </div>

              <div className="font-body-md whitespace-pre-wrap text-[15px] leading-relaxed text-on-surface-variant/90">
                {problem.description}
              </div>

              {examples.map((ex, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="font-label-md text-sm font-semibold text-on-surface">
                    Example {i + 1}
                  </h3>
                  <div className="rounded-2xl border border-white/8 bg-black/25 p-4 font-code-sm text-xs">
                    <div className="mb-3">
                      <span className="text-on-surface-variant">Input:</span>
                      <IoPre className="mt-1 text-primary-fixed">
                        {formatExample(ex.input) || "(empty)"}
                      </IoPre>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Output:</span>
                      <IoPre className="mt-1 text-primary-fixed">
                        {formatExample(ex.output) || "(empty)"}
                      </IoPre>
                    </div>
                  </div>
                </div>
              ))}

              {constraints.length > 0 && (
                <div>
                  <h3 className="mb-2 font-label-md text-sm font-semibold text-on-surface">
                    Constraints
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-on-surface-variant">
                    {constraints.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <div
            role="separator"
            aria-orientation="vertical"
            className="pw-resize pw-resize-col hidden md:flex"
            onMouseDown={() => {
              draggingRef.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
          />

          {/* IDE */}
          <section
            ref={editorSplitRef}
            className="pw-ide-shell relative flex min-h-0 min-w-0 flex-1 flex-col"
          >
            <div className="pw-toolbar flex shrink-0 items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-label-md truncate text-[12px] text-on-surface-variant">
                  Live · {languageSlug}
                </span>
                {syncError && (
                  <span className="max-w-[140px] truncate text-[11px] text-hard">
                    {syncError}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={running || !canEdit}
                  onClick={() => void handleRun()}
                  className="pw-btn-run font-label-md flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    play_arrow
                  </span>
                  {running ? "Running…" : "Run"}
                </button>
                <button
                  type="button"
                  disabled={submitting || !canEdit}
                  onClick={() => void handleSubmit()}
                  className="pw-btn-submit font-label-md flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    cloud_upload
                  </span>
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              </div>
            </div>

            <div
              className="relative min-h-0 overflow-hidden bg-[#09040D]"
              style={{ height: `${editorPct}%` }}
            >
              <Editor
                height="100%"
                theme={CODEIT_THEME}
                language={MONACO_LANG[languageSlug] || "plaintext"}
                defaultValue=""
                onMount={(editor, monaco) => bindEditor(editor, monaco)}
                beforeMount={defineCodeitTheme}
                options={{
                  readOnly: !canEdit,
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12 },
                }}
              />
            </div>

            <div
              role="separator"
              className="pw-resize pw-resize-row"
              onMouseDown={() => {
                draggingEditorRef.current = true;
                document.body.style.cursor = "row-resize";
                document.body.style.userSelect = "none";
              }}
            />

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center gap-1 border-b border-white/5 px-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBottomTab("testcase")}
                  className={`pw-tab font-label-md px-4 py-2 text-[13px] ${
                    bottomTab === "testcase"
                      ? "pw-tab-active text-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Testcase
                </button>
                <button
                  type="button"
                  onClick={() => setBottomTab("result")}
                  className={`pw-tab font-label-md px-4 py-2 text-[13px] ${
                    bottomTab === "result"
                      ? "pw-tab-active text-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Test Result
                </button>
              </div>
              <div className="pw-scroll min-h-0 flex-1 overflow-y-auto p-4">
                {bottomTab === "testcase" && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                      STDIN
                    </p>
                    <textarea
                      value={customStdin}
                      onChange={(e) => setCustomStdin(e.target.value)}
                      disabled={!canEdit}
                      className="font-code-sm min-h-[7rem] w-full resize-y rounded-2xl border border-white/8 bg-black/30 p-3.5 text-on-surface outline-none transition-shadow focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(183,109,255,0.15)] disabled:opacity-60"
                    />
                  </div>
                )}
                {bottomTab === "result" && (
                  <div className="space-y-3 font-code-sm text-sm">
                    {verdict && (
                      <p
                        className={`font-bold ${
                          /ac|accepted/i.test(verdict.verdict) || verdict.passed
                            ? "text-easy"
                            : "text-hard"
                        }`}
                      >
                        {verdict.verdict}
                      </p>
                    )}
                    <pre className="whitespace-pre-wrap text-on-surface-variant">
                      {output || "Run or submit to see results."}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Chat / people */}
          <aside className="pw-side-rail hidden w-[280px] flex-shrink-0 md:flex">
            <div className="pw-side-rail-tabs">
              <button
                type="button"
                onClick={() => setSideTab("chat")}
                className={`pw-tab flex-1 py-3 text-center text-sm ${
                  sideTab === "chat"
                    ? "pw-tab-active text-primary"
                    : "text-on-surface-variant"
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setSideTab("people")}
                className={`pw-tab flex-1 py-3 text-center text-sm ${
                  sideTab === "people"
                    ? "pw-tab-active text-primary"
                    : "text-on-surface-variant"
                }`}
              >
                People
              </button>
            </div>
            <div className="pw-scroll flex-1 space-y-3 overflow-y-auto p-4">
              {sideTab === "chat" &&
                (messages.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    No messages yet.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-white/6 bg-black/25 p-2.5 text-sm"
                    >
                      <div className="text-[11px] text-primary">{m.username}</div>
                      <div className="text-on-surface">{m.content}</div>
                    </div>
                  ))
                ))}
              {sideTab === "people" &&
                room.members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-2 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                      {initials(m.username)}
                    </div>
                    <div>
                      <div className="text-on-surface">{m.username}</div>
                      <div className="text-[10px] text-on-surface-variant">
                        {m.role}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {sideTab === "chat" && (
              <div className="flex gap-2 border-t border-white/5 p-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleSend()}
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none focus:border-primary/50"
                  placeholder="Message…"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    send
                  </span>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    if (!roomId) {
                      navigate(`/problems/${problemId}`);
                      return;
                    }
                    if (isHost) {
                      await endRoom(roomId);
                    } else {
                      await leaveRoom(roomId);
                    }
                  } catch {
                    /* still navigate */
                  }
                  navigate(`/problems/${problemId}`);
                })();
              }}
              className="m-3 rounded-full border border-hard/40 bg-hard/10 py-2 text-sm text-hard transition-colors hover:bg-hard/15"
            >
              {isHost ? "End room" : "Leave room"}
            </button>
          </aside>
        </div>
      </main>

      <InviteModal
        open={shareOpen}
        room={room}
        shareUrl={shareUrl}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
