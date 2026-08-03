import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Editor from "@monaco-editor/react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../context/AuthContext";
import {
  getRoom,
  getRoomMessages,
  joinRoom,
  runRoomCode,
  sendRoomMessage,
  updateWorkspace,
} from "../features/collaboration/api";
import ConnectionStatus from "../features/collaboration/ConnectionStatus";
import { useYjsCanvasBoard } from "../features/collaboration/hooks/useYjsCanvasBoard";
import { useYjsCodeEditor } from "../features/collaboration/hooks/useYjsCodeEditor";
import InviteModal from "../features/collaboration/InviteModal";
import {
  codeRoomShareUrl,
  roomCodeFromSearchParams,
  roomCodeOf,
} from "../features/collaboration/roomLinks";
import type {
  Room,
  RoomMessage,
  WorkspaceType,
} from "../features/collaboration/types";
import type { CanvasStroke } from "../features/collaboration/sync";
import { ApiError, getLanguages, type LanguageDTO } from "../lib/api";
import { CODEIT_THEME, defineCodeitTheme } from "../lib/monacoTheme";

const STARTER: Record<string, string> = {
  python:
    "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # your solution here\n\nif __name__ == '__main__':\n    main()\n",
  java:
    "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    return 0;\n}\n",
  javascript:
    "const lines = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n');\n",
};

const MONACO_LANG: Record<string, string> = {
  python: "python",
  java: "java",
  cpp: "cpp",
  javascript: "javascript",
  c: "c",
  go: "go",
  rust: "rust",
  typescript: "typescript",
};

const AVATAR_COLORS = [
  "bg-primary text-on-primary",
  "bg-pink-400 text-pink-950",
  "bg-blue-400 text-blue-950",
  "bg-emerald-400 text-emerald-950",
  "bg-amber-400 text-amber-950",
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleStyle(role: string) {
  if (role === "HOST")
    return "bg-primary/10 text-primary";
  if (role === "EDITOR")
    return "bg-pink-400/10 text-pink-300";
  return "bg-surface-variant text-on-surface-variant";
}

function paintStroke(
  ctx: CanvasRenderingContext2D,
  stroke: CanvasStroke,
  dpr: number
) {
  if (stroke.points.length < 2) return;
  ctx.save();
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.erase ? "#09040D" : stroke.color;
  ctx.globalCompositeOperation = stroke.erase
    ? "destination-out"
    : "source-over";
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x * dpr, stroke.points[0].y * dpr);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x * dpr, stroke.points[i].y * dpr);
  }
  ctx.stroke();
  ctx.restore();
}

function SharedWhiteboard({
  readOnly,
  strokes,
  onStroke,
  onClear,
}: {
  readOnly: boolean;
  strokes: CanvasStroke[];
  onStroke: (stroke: Omit<CanvasStroke, "id">) => void;
  onClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const [tool, setTool] = useState<"pen" | "erase">("pen");
  const dprRef = useRef(1);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dpr = dprRef.current;
    for (const s of strokes) paintStroke(ctx, s, dpr);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const pos = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#160B22]">
      <div className="absolute top-4 left-4 z-10 flex gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-high p-1">
        <button
          type="button"
          disabled={readOnly}
          onClick={() => setTool("pen")}
          className={`rounded px-3 py-1.5 font-label-md text-label-md ${
            tool === "pen"
              ? "bg-secondary-container text-on-secondary-container"
              : "text-on-surface-variant"
          }`}
        >
          Pen
        </button>
        <button
          type="button"
          disabled={readOnly}
          onClick={() => setTool("erase")}
          className={`rounded px-3 py-1.5 font-label-md text-label-md ${
            tool === "erase"
              ? "bg-secondary-container text-on-secondary-container"
              : "text-on-surface-variant"
          }`}
        >
          Erase
        </button>
        <button
          type="button"
          disabled={readOnly}
          onClick={onClear}
          className="rounded px-3 py-1.5 font-label-md text-label-md text-on-surface-variant hover:text-primary"
        >
          Clear
        </button>
      </div>
      <div
        className="relative min-h-0 flex-1"
        style={{
          backgroundImage:
            "linear-gradient(rgba(77,67,84,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(77,67,84,0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundColor: "#09040D",
        }}
      >
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full ${readOnly ? "cursor-default" : "cursor-crosshair"}`}
          onPointerDown={(e) => {
            if (readOnly) return;
            drawing.current = true;
            pointsRef.current = [pos(e)];
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drawing.current || readOnly) return;
            const p = pos(e);
            pointsRef.current.push(p);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!ctx || !canvas || pointsRef.current.length < 2) return;
            const dpr = dprRef.current;
            const a = pointsRef.current[pointsRef.current.length - 2];
            const b = pointsRef.current[pointsRef.current.length - 1];
            paintStroke(
              ctx,
              {
                id: "live",
                points: [a, b],
                width: tool === "erase" ? 20 : 2,
                color: "#ddb7ff",
                erase: tool === "erase",
              },
              dpr
            );
          }}
          onPointerUp={() => {
            if (!drawing.current) return;
            drawing.current = false;
            const pts = pointsRef.current;
            pointsRef.current = [];
            if (pts.length >= 2) {
              onStroke({
                points: pts,
                width: tool === "erase" ? 20 : 2,
                color: "#ddb7ff",
                erase: tool === "erase",
              });
            }
          }}
        />
      </div>
    </div>
  );
}

export default function CodeRoomWorkspace() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<LanguageDTO[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceType>("CODE");
  const [output, setOutput] = useState("> Awaiting execution...");
  const [running, setRunning] = useState(false);
  const [sideTab, setSideTab] = useState<"participants" | "chat">(
    "participants"
  );
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [editorPct, setEditorPct] = useState(65);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

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
  const isHost = !!user && room?.hostUserId === user.id;
  const shareUrl =
    room && roomId
      ? codeRoomShareUrl(roomId, roomCodeOf(room))
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

  const board = useYjsCanvasBoard({
    roomId: roomId || "",
    enabled: !!room,
    readOnly: !canEdit,
    userName: user?.uniqueUserId || user?.name || "user",
    userId: user?.id,
  });

  useEffect(() => {
    void getLanguages().catch(() => [] as LanguageDTO[]).then(setLanguages);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await getRoom(roomId);
        if (cancelled) return;
        setRoom(r);
        setWorkspace(r.activeWorkspace || "CODE");
        const msgs = await getRoomMessages(roomId).catch(() => []);
        if (!cancelled) setMessages(msgs);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load room."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    const codeParam = roomCodeFromSearchParams(searchParams);
    if (!codeParam || room || joining || !error || !roomId) return;
    if (!user) {
      navigate("/login", {
        state: {
          from: `/coderoom/${roomId}?code=${encodeURIComponent(codeParam)}`,
        },
      });
      return;
    }
    setJoining(true);
    void joinRoom(codeParam)
      .then((r) => {
        setRoom(r);
        setError(null);
        setWorkspace(r.activeWorkspace || "CODE");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to join");
      })
      .finally(() => setJoining(false));
  }, [searchParams, room, error, joining, user, navigate, roomId]);

  useEffect(() => {
    const onMove = (clientY: number) => {
      if (!dragging.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      if (rect.height <= 0) return;
      setEditorPct(
        Math.min(85, Math.max(30, ((clientY - rect.top) / rect.height) * 100))
      );
    };
    const onMouseMove = (e: MouseEvent) => onMove(e.clientY);
    const stop = () => {
      dragging.current = false;
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

  const switchWorkspace = async (next: WorkspaceType) => {
    setWorkspace(next);
    if (!roomId || !isHost) return;
    try {
      const updated = await updateWorkspace(roomId, next);
      setRoom(updated);
    } catch {
      /* local only */
    }
  };

  const handleRun = async () => {
    if (!roomId || !languageMeta) return;
    setRunning(true);
    setOutput("Running…");
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
      const compile =
        typeof result.compile_output === "string"
          ? result.compile_output
          : "";
      const status =
        result.status &&
        typeof result.status === "object" &&
        "description" in result.status
          ? String((result.status as { description?: string }).description)
          : "";
      setOutput(
        [status && `Status: ${status}`, stdout, stderr, compile]
          .filter(Boolean)
          .join("\n") || "(empty)"
      );
    } catch (err) {
      setOutput(
        err instanceof Error ? err.message : "Run failed."
      );
    } finally {
      setRunning(false);
    }
  };

  const handleSendChat = async () => {
    if (!roomId || !chatInput.trim()) return;
    setSending(true);
    try {
      const msg = await sendRoomMessage(roomId, chatInput.trim());
      setMessages((prev) => [...prev, msg]);
      setChatInput("");
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-on-surface">
        <AppNav activeHint="/coderoom" />
        <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 pt-16 text-center">
          <p>Sign in to enter CodeRoom.</p>
          <Link to="/login" className="text-primary hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (loading || joining) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-on-surface">
        <AppNav activeHint="/coderoom" />
        <div className="flex flex-1 items-center justify-center pt-16">
          <p className="text-on-surface-variant">
            {joining ? "Joining room…" : "Loading room…"}
          </p>
        </div>
      </div>
    );
  }

  if (error || !room || !roomId) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-on-surface">
        <AppNav activeHint="/coderoom" />
        <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 pt-16 text-center">
          <p className="text-hard">{error || "Room not found"}</p>
          <Link to="/coderoom" className="text-primary hover:underline">
            Back to CodeRoom
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background font-body-md text-on-background">
      <AppNav
        activeHint="/coderoom"
        workspaceActions={
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="rounded border border-primary px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-primary/10"
          >
            Invite
          </button>
        }
      />

      <div className="relative mt-16 flex h-[calc(100vh-64px)] flex-1">
        {/* Main pane */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col border-r border-outline-variant/20 bg-surface-container-lowest">
          <div className="flex h-12 items-center justify-between border-b border-outline-variant/20 bg-surface-container/80 px-4 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex rounded-md border border-outline-variant/30 bg-surface-dim p-1">
                <button
                  type="button"
                  onClick={() => void switchWorkspace("CODE")}
                  className={`flex items-center gap-2 rounded px-3 py-1 font-label-md text-label-md ${
                    workspace === "CODE"
                      ? "bg-surface-container-highest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    code
                  </span>{" "}
                  CODE
                </button>
                <button
                  type="button"
                  onClick={() => void switchWorkspace("WHITEBOARD")}
                  className={`flex items-center gap-2 rounded px-3 py-1 font-label-md text-label-md ${
                    workspace === "WHITEBOARD"
                      ? "bg-secondary-container text-on-secondary-container shadow-[0_0_12px_2px_rgba(221,183,255,0.15)]"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    brush
                  </span>{" "}
                  WHITEBOARD
                </button>
              </div>
              <div className="flex items-center gap-2">
                <ConnectionStatus
                  status={
                    workspace === "WHITEBOARD"
                      ? board.connectionStatus
                      : connectionStatus
                  }
                />
                {(syncError || board.error) && (
                  <span className="max-w-[180px] truncate text-[11px] text-hard">
                    {syncError || board.error}
                  </span>
                )}
              </div>
            </div>

            <div className="flex -space-x-2">
              {room.members.slice(0, 4).map((m, i) => (
                <div
                  key={m.userId}
                  title={m.username}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                  style={{ zIndex: 30 - i }}
                >
                  {initials(m.username)}
                </div>
              ))}
              {room.members.length > 4 && (
                <div className="z-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container bg-surface-variant text-xs font-bold text-on-surface-variant">
                  +{room.members.length - 4}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-1 rounded border border-primary px-3 py-1.5 font-label-md text-label-md text-primary transition-colors hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>{" "}
                Invite
              </button>
              {workspace === "CODE" && (
                <button
                  type="button"
                  disabled={running || !canEdit}
                  onClick={() => void handleRun()}
                  className="flex items-center gap-1 rounded bg-primary px-4 py-1.5 font-label-md text-label-md text-on-primary shadow-[0_0_12px_rgba(221,183,255,0.3)] transition-colors hover:bg-primary-container disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    play_arrow
                  </span>{" "}
                  {running ? "Running…" : "Run"}
                </button>
              )}
            </div>
          </div>

          {workspace === "WHITEBOARD" ? (
            <SharedWhiteboard
              readOnly={!canEdit}
              strokes={board.strokes}
              onStroke={board.addStroke}
              onClear={board.clear}
            />
          ) : (
            <div ref={splitRef} className="flex min-h-0 flex-1 flex-col">
              <div
                className="min-h-0 overflow-hidden bg-[#09040D]"
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
                  dragging.current = true;
                  document.body.style.cursor = "row-resize";
                  document.body.style.userSelect = "none";
                }}
                className="h-2 cursor-ns-resize bg-transparent hover:bg-primary/20"
              />
              <div className="flex min-h-0 flex-1 border-t border-outline-variant/30 bg-surface-container-low">
                <div className="flex flex-1 flex-col border-r border-outline-variant/20">
                  <div className="flex h-8 items-center border-b border-outline-variant/20 bg-surface-container-high px-4">
                    <span className="font-label-md text-[12px] tracking-wider text-on-surface-variant uppercase">
                      Shared STDIN
                    </span>
                  </div>
                  <textarea
                    value={customStdin}
                    onChange={(e) => setCustomStdin(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Enter input here..."
                    className="flex-1 resize-none border-none bg-[#160B22] p-4 font-code-sm text-code-sm text-on-surface focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex h-8 items-center border-b border-outline-variant/20 bg-surface-container-high px-4">
                    <span className="font-label-md text-[12px] tracking-wider text-on-surface-variant uppercase">
                      Run Results
                    </span>
                  </div>
                  <pre className="flex-1 overflow-y-auto bg-[#160B22] p-4 font-code-sm text-code-sm whitespace-pre-wrap text-on-surface-variant">
                    {output}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side rail */}
        <aside className="z-20 flex w-[300px] flex-shrink-0 flex-col border-l border-outline-variant/20 bg-surface-container-low/90 backdrop-blur-xl">
          <div className="border-b border-outline-variant/20 p-4">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
              CodeRoom
            </h2>
            <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
              Collaborative Session
            </p>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-outline-variant/30 bg-surface-container-high py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined text-[18px]">
                link
              </span>{" "}
              Share Link
            </button>
          </div>

          <div className="flex border-b border-outline-variant/20">
            <button
              type="button"
              onClick={() => setSideTab("participants")}
              className={`flex-1 py-3 text-center font-label-md text-label-md ${
                sideTab === "participants"
                  ? "border-b-2 border-primary bg-secondary-container/20 text-primary"
                  : "border-b-2 border-transparent text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined mb-1 block text-[20px]">
                group
              </span>
              Participants
            </button>
            <button
              type="button"
              onClick={() => setSideTab("chat")}
              className={`flex-1 py-3 text-center font-label-md text-label-md ${
                sideTab === "chat"
                  ? "border-b-2 border-primary bg-secondary-container/20 text-primary"
                  : "border-b-2 border-transparent text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined mb-1 block text-[20px]">
                chat
              </span>
              Room Chat
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {sideTab === "participants" &&
              room.members.map((m, i) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between rounded p-2 transition-colors hover:bg-surface-container"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                    >
                      {initials(m.username)}
                    </div>
                    <div>
                      <div className="font-label-md text-label-md text-on-surface">
                        {m.username}
                        {user.id === m.userId ? " (You)" : ""}
                      </div>
                      <div
                        className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[11px] ${roleStyle(m.role)}`}
                      >
                        {m.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {sideTab === "chat" && (
              <div className="flex h-full flex-col gap-3">
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {messages.length === 0 && (
                    <p className="text-sm text-on-surface-variant">
                      No messages yet.
                    </p>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className="rounded-lg bg-surface-container p-2">
                      <div className="text-[11px] text-primary">
                        {msg.username}
                      </div>
                      <div className="mt-0.5 text-sm text-on-surface">
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSendChat();
                    }}
                    placeholder="Say something…"
                    className="min-w-0 flex-1 rounded border border-outline-variant/40 bg-surface-container-high px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    disabled={sending || !chatInput.trim()}
                    onClick={() => void handleSendChat()}
                    className="rounded bg-primary px-3 py-2 text-on-primary disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      send
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-outline-variant/20 p-4">
            <Link
              to="/help"
              className="flex w-full items-center gap-3 rounded px-3 py-2 text-left font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            >
              <span className="material-symbols-outlined text-[20px]">
                help
              </span>{" "}
              Help
            </Link>
            <button
              type="button"
              onClick={() => navigate("/coderoom")}
              className="flex w-full items-center gap-3 rounded px-3 py-2 text-left font-label-md text-label-md text-error transition-colors hover:bg-error/10"
            >
              <span className="material-symbols-outlined text-[20px]">
                logout
              </span>{" "}
              Leave Room
            </button>
          </div>
        </aside>
      </div>

      <InviteModal
        open={shareOpen}
        room={room}
        shareUrl={shareUrl}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
