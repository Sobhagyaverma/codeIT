import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { IoPre } from "../components/IoPre";
import { useAuth } from "../context/AuthContext";
import {
  getRoom,
  getRoomMessages,
  joinRoom,
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
    // Only seed once when stdin is still empty after first problem load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examples]);

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

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background pt-16 text-on-surface">
        <AppNav activeHint="/problems" />
        <div className="mx-auto flex flex-1 flex-col items-center justify-center gap-3">
          <p>Sign in to collaborate.</p>
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading || joining) {
    return (
      <div className="flex min-h-screen flex-col bg-background pt-16 text-on-surface">
        <AppNav activeHint="/problems" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-on-surface-variant">
            {joining ? "Joining…" : "Loading…"}
          </p>
        </div>
      </div>
    );
  }

  if (error || !room || !problem) {
    return (
      <div className="flex min-h-screen flex-col bg-background pt-16 text-on-surface">
        <AppNav activeHint="/problems" />
        <div className="mx-auto flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-hard">{error || "Room unavailable"}</p>
          <Link to={`/problems/${problemId}`} className="text-primary">
            Back to problem
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-on-surface">
      <AppNav
        activeHint="/problems"
        workspaceActions={
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="rounded border border-primary px-4 py-2 font-label-md text-label-md text-primary hover:bg-primary/10"
          >
            Invite
          </button>
        }
      />

      <div className="mt-16 flex h-[calc(100vh-64px)] min-h-0 flex-1">
        {/* Problem */}
        <aside className="hidden w-[360px] flex-shrink-0 flex-col overflow-y-auto border-r border-outline-variant/20 bg-surface p-6 lg:flex">
          <Link
            to={`/problems/${problemId}`}
            className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            Problem
          </Link>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold">
            {problem.title}
          </h1>
          <span className="mt-2 inline-block rounded border border-outline-variant/30 px-2 py-0.5 text-xs text-on-surface-variant">
            {problem.difficulty}
          </span>
          <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
            {problem.description}
          </p>
          {examples.map((ex, i) => (
            <div key={i} className="mt-6">
              <h3 className="mb-2 border-b border-outline-variant/20 pb-2 text-sm font-bold">
                Example {i + 1}
              </h3>
              <div className="rounded border border-outline-variant/10 bg-surface-container-low p-3 font-code-sm text-xs">
                <div className="mb-2">
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
        </aside>

        {/* Editor */}
        <div className="flex min-w-0 flex-1 flex-col border-r border-outline-variant/20">
          <div className="flex h-12 items-center justify-between border-b border-outline-variant/20 bg-surface-container-low px-4">
            <div className="flex items-center gap-2">
              <ConnectionStatus status={connectionStatus} />
              {syncError && (
                <span className="max-w-[160px] truncate text-[11px] text-hard">
                  {syncError}
                </span>
              )}
              <span className="text-xs text-on-surface-variant">
                · {languageSlug}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={running || !canEdit}
                onClick={() => void handleRun()}
                className="rounded border border-outline-variant/50 px-3 py-1.5 text-sm text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-40"
              >
                {running ? "Running…" : "Run"}
              </button>
              <button
                type="button"
                disabled={submitting || !canEdit}
                onClick={() => void handleSubmit()}
                className="rounded bg-primary px-3 py-1.5 text-sm font-bold text-on-primary disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 bg-[#09040D]">
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
          <div className="grid h-48 grid-cols-2 border-t border-outline-variant/20">
            <div className="flex flex-col border-r border-outline-variant/20">
              <div className="bg-surface-container-high px-3 py-1.5 text-[11px] tracking-wider text-on-surface-variant uppercase">
                STDIN
              </div>
              <textarea
                value={customStdin}
                onChange={(e) => setCustomStdin(e.target.value)}
                disabled={!canEdit}
                className="flex-1 resize-none bg-[#160B22] p-3 font-code-sm text-xs outline-none disabled:opacity-60"
              />
            </div>
            <div className="flex flex-col overflow-auto bg-[#160B22] p-3 font-code-sm text-xs">
              {verdict && (
                <p
                  className={`mb-2 font-bold ${
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
          </div>
        </div>

        {/* Chat / people */}
        <aside className="hidden w-[280px] flex-shrink-0 flex-col bg-surface-container-low md:flex">
          <div className="flex border-b border-outline-variant/20">
            <button
              type="button"
              onClick={() => setSideTab("chat")}
              className={`flex-1 py-3 text-center text-sm ${
                sideTab === "chat"
                  ? "border-b-2 border-primary text-primary"
                  : "text-on-surface-variant"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setSideTab("people")}
              className={`flex-1 py-3 text-center text-sm ${
                sideTab === "people"
                  ? "border-b-2 border-primary text-primary"
                  : "text-on-surface-variant"
              }`}
            >
              People
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {sideTab === "chat" &&
              messages.map((m) => (
                <div key={m.id} className="rounded bg-surface-container p-2 text-sm">
                  <div className="text-[11px] text-primary">{m.username}</div>
                  <div>{m.content}</div>
                </div>
              ))}
            {sideTab === "people" &&
              room.members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2 text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {initials(m.username)}
                  </div>
                  <div>
                    <div>{m.username}</div>
                    <div className="text-[10px] text-on-surface-variant">
                      {m.role}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {sideTab === "chat" && (
            <div className="flex gap-2 border-t border-outline-variant/20 p-3">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSend()}
                className="min-w-0 flex-1 rounded border border-outline-variant/40 bg-surface-container-high px-2 py-1.5 text-sm outline-none focus:border-primary"
                placeholder="Message…"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                className="rounded bg-primary px-2 text-on-primary"
              >
                <span className="material-symbols-outlined text-[18px]">
                  send
                </span>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate(`/problems/${problemId}`)}
            className="m-3 rounded border border-error/40 py-2 text-sm text-error hover:bg-error/10"
          >
            Leave room
          </button>
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
