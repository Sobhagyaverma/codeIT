import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import CodeWorkspace from "../components/CodeWorkspace";
import { Loading, ErrorState } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/toast/ToastProvider";
import { getLanguages } from "../lib/api";
import type { LanguageDTO } from "../lib/types";
import CollabSideRail from "../features/collaboration/components/CollabSideRail";
import InviteModal from "../features/collaboration/components/InviteModal";
import ParticipantsPanel from "../features/collaboration/components/ParticipantsPanel";
import PresenceAvatars from "../features/collaboration/components/PresenceAvatars";
import PresenceChips from "../features/collaboration/components/PresenceChips";
import RoomChat from "../features/collaboration/components/RoomChat";
import SessionHeader from "../features/collaboration/components/SessionHeader";
import SharedWhiteboard from "../features/collaboration/components/SharedWhiteboard";
import {
  joinRoom,
  runRoomCode,
  updateWorkspace,
} from "../features/collaboration/api";
import { useLocalRoomPersistence } from "../features/collaboration/hooks/useLocalRoomPersistence";
import { usePresenceMemberSync } from "../features/collaboration/hooks/usePresenceMemberSync";
import { useRoom } from "../features/collaboration/hooks/useRoom";
import { useRoomChat } from "../features/collaboration/hooks/useRoomChat";
import { useRoomPresence } from "../features/collaboration/hooks/useRoomPresence";
import { useYjsCodeEditor } from "../features/collaboration/hooks/useYjsCodeEditor";
import { useYjsWhiteboard } from "../features/collaboration/hooks/useYjsWhiteboard";
import {
  codeRoomShareUrl,
  roomCodeFromSearchParams,
  roomCodeOf,
} from "../features/collaboration/roomLinks";
import { judge0ToCustomSession } from "../features/collaboration/roomRunAdapters";
import type { WorkspaceType } from "../features/collaboration/types";
import type { SampleRunSession } from "../lib/runSampleTests";
import RunResultsPanel from "../components/RunResultsPanel";
import {
  roomRunTopic,
  roomWorkspaceTopic,
  subscribeTopic,
} from "../lib/ws";

export default function CodeRoomWorkspace() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pushToast } = useToast();
  const { room, setRoom, loading, error, isHost, canEdit, reload } =
    useRoom(roomId);
  const { onlineUserIds, lastEvent } = useRoomPresence(roomId, !!room);
  usePresenceMemberSync(lastEvent, reload);
  const { messages, send, sending } = useRoomChat(roomId, !!room);
  const persistence = useLocalRoomPersistence(roomId);

  const [languages, setLanguages] = useState<LanguageDTO[]>([]);
  const [language, setLanguage] = useState("java");
  const [workspace, setWorkspace] = useState<WorkspaceType>("CODE");
  const [runSession, setRunSession] = useState<SampleRunSession | null>(null);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editorPct, setEditorPct] = useState(() => {
    try {
      const raw = sessionStorage.getItem("codeit.coderoom.editorPct");
      const n = raw ? Number(raw) : 68;
      return Number.isFinite(n) ? Math.min(85, Math.max(30, n)) : 68;
    } catch {
      return 68;
    }
  });
  const codeSplitRef = useRef<HTMLDivElement | null>(null);
  const draggingSplit = useRef(false);

  const codeSync = useYjsCodeEditor({
    roomId: roomId || "",
    language,
    enabled: !!room,
    readOnly: !canEdit,
    userName: user?.uniqueUserId || user?.name || "user",
  });

  const board = useYjsWhiteboard({
    roomId: roomId || "",
    enabled: !!room,
    readOnly: !canEdit,
    userName: user?.uniqueUserId || user?.name || "user",
  });

  useEffect(() => {
    void getLanguages().then(setLanguages);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("codeit.coderoom.editorPct", String(editorPct));
    } catch {
      /* ignore */
    }
  }, [editorPct]);

  useEffect(() => {
    const onMove = (clientY: number) => {
      if (!draggingSplit.current || !codeSplitRef.current) return;
      const rect = codeSplitRef.current.getBoundingClientRect();
      if (rect.height <= 0) return;
      const pct = ((clientY - rect.top) / rect.height) * 100;
      setEditorPct(Math.min(85, Math.max(30, pct)));
    };
    const onMouseMove = (e: MouseEvent) => onMove(e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0].clientY);
    };
    const stop = () => {
      if (!draggingSplit.current) return;
      draggingSplit.current = false;
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

  useEffect(() => {
    if (!room) return;
    setWorkspace(persistence.resolveWorkspace(room.activeWorkspace));
    setLanguage(room.language || "java");
  }, [room, persistence.resolveWorkspace]);

  useEffect(() => {
    const code = roomCodeFromSearchParams(searchParams);
    if (!code || room || joining || !error) return;
    if (!user) {
      navigate("/login", {
        state: {
          from: `/coderoom/${roomId}?code=${encodeURIComponent(code)}`,
        },
      });
      return;
    }
    setJoining(true);
    void joinRoom(code)
      .then((r) => setRoom(r))
      .catch((e) => {
        pushToast(e instanceof Error ? e.message : "Failed to join", "error");
      })
      .finally(() => setJoining(false));
  }, [
    searchParams,
    room,
    error,
    joining,
    user,
    navigate,
    roomId,
    setRoom,
    pushToast,
  ]);

  useEffect(() => {
    if (!roomId) return;
    const u1 = subscribeTopic<{ workspace: WorkspaceType }>(
      roomWorkspaceTopic(roomId),
      (payload) => {
        if (payload.workspace) {
          setWorkspace(payload.workspace);
          persistence.saveWorkspace(payload.workspace);
        }
      }
    );
    const u2 = subscribeTopic<Record<string, unknown>>(
      roomRunTopic(roomId),
      (payload) => {
        if (payload.status === "STARTED") {
          setRunning(true);
          setActionError(null);
        } else if (payload.status === "COMPLETED" && payload.result) {
          setRunning(false);
          setRunSession(judge0ToCustomSession(payload.result));
        }
      }
    );
    return () => {
      u1();
      u2();
    };
  }, [roomId, persistence.saveWorkspace]);

  const languageId = useMemo(
    () => languages.find((l) => l.slug === language)?.languageId,
    [languages, language]
  );

  const shareUrl =
    room && roomId ? codeRoomShareUrl(roomId, roomCodeOf(room)) : "";

  const connectionStatus =
    workspace === "CODE"
      ? codeSync.connectionStatus
      : board.connectionStatus;

  async function switchWorkspace(next: WorkspaceType) {
    if (!roomId || !isHost) return;
    const updated = await updateWorkspace(roomId, next);
    setRoom(updated);
    setWorkspace(next);
    persistence.saveWorkspace(next);
  }

  async function handleRun() {
    if (!roomId || languageId == null) return;
    setBusy(true);
    setRunning(true);
    setActionError(null);
    setRunSession(null);
    try {
      const result = await runRoomCode(roomId, {
        sourceCode: codeSync.getCode(),
        languageId,
        stdin: codeSync.customStdin,
      });
      setRunSession(judge0ToCustomSession(result, codeSync.customStdin));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(false);
      setRunning(false);
    }
  }

  if (loading || joining) return <Loading />;
  const pendingJoin = !!roomCodeFromSearchParams(searchParams) && !room;
  if (pendingJoin) return <Loading label="Joining room…" />;
  if (error || !room) return <ErrorState message={error || "Room not found"} />;

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] flex-col bg-[var(--bg)]">
      <PresenceChips lastEvent={lastEvent} />

      <SessionHeader
        room={room}
        onlineUserIds={onlineUserIds}
        connectionStatus={connectionStatus}
        onInvite={() => setShareOpen(true)}
        showWorkspaceSwitcher
        workspace={workspace}
        isHost={isHost}
        onWorkspaceChange={(w) => void switchWorkspace(w)}
        left={
          <>
            <Link
              to="/coderoom"
              className="shrink-0 text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
            >
              ← CodeRoom
            </Link>
            <h1 className="display truncate text-sm font-semibold sm:text-base">
              Live workspace
            </h1>
          </>
        }
        actions={
          workspace === "CODE" ? (
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={!canEdit}
                className="rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-2 py-1.5 text-sm text-[var(--text)]"
              >
                {languages.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!canEdit || busy || !codeSync.ready}
                onClick={() => void handleRun()}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-[#0a0d12] disabled:opacity-50"
              >
                {running ? "Running…" : "Run"}
              </button>
            </div>
          ) : null
        }
      />

      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            ref={codeSplitRef}
            className="flex min-h-0 flex-1 flex-col transition-opacity duration-200"
            style={{
              display: workspace === "CODE" ? "flex" : "none",
              opacity: workspace === "CODE" ? 1 : 0,
            }}
          >
            {codeSync.error && (
              <p className="shrink-0 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                {codeSync.error}
              </p>
            )}
            <div
              className="min-h-0 overflow-hidden"
              style={{
                flexBasis: `${editorPct}%`,
                flexGrow: 0,
                flexShrink: 0,
              }}
            >
              <CodeWorkspace
                language={language}
                readOnly={!canEdit}
                onMount={(editor, monaco) =>
                  codeSync.bindEditor(editor, monaco)
                }
              />
            </div>

            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize editor and output"
              onMouseDown={(e) => {
                e.preventDefault();
                draggingSplit.current = true;
                document.body.style.cursor = "row-resize";
                document.body.style.userSelect = "none";
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                draggingSplit.current = true;
              }}
              className="group relative z-10 flex h-2 shrink-0 cursor-row-resize items-center justify-center border-y border-[var(--line)] bg-[var(--bg-raised)] hover:bg-[var(--accent)]/15"
            >
              <div className="h-1 w-10 rounded-full bg-[var(--line)] group-hover:bg-[var(--accent)]" />
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-[var(--bg-inset)] p-3">
              {actionError && (
                <p className="mb-2 text-xs text-red-300">{actionError}</p>
              )}
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
                Shared stdin
              </label>
              <textarea
                value={codeSync.customStdin}
                onChange={(e) => codeSync.setCustomStdin(e.target.value)}
                disabled={!canEdit}
                rows={2}
                spellCheck={false}
                className="mono mb-2 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--text)] disabled:opacity-60"
              />
              <RunResultsPanel
                session={runSession}
                loading={running}
                emptyMessage="Click Run to execute with the shared stdin."
                loadingLabel="Running…"
              />
            </div>
          </div>

          <div
            className="min-h-0 w-full flex-1 flex-col transition-opacity duration-200"
            style={{
              display: workspace === "WHITEBOARD" ? "flex" : "none",
              opacity: workspace === "WHITEBOARD" ? 1 : 0,
            }}
          >
            {board.error && (
              <p className="shrink-0 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                {board.error}
              </p>
            )}
            <div className="relative min-h-0 w-full flex-1">
              <SharedWhiteboard
                visible={workspace === "WHITEBOARD"}
                onApiReady={board.bindApi}
                onSceneChange={board.publishScene}
                onPointerUpdate={(p) => {
                  board.publishPointer(
                    p.button === "down" || p.button === "up" ? p.pointer : null
                  );
                }}
                collaborators={board.collaborators}
                onClear={board.clear}
                readOnly={!canEdit}
                isHost={isHost}
              />
            </div>
          </div>
        </div>

        <CollabSideRail
          onInvite={() => setShareOpen(true)}
          collapsedContent={
            <PresenceAvatars
              members={room.members}
              onlineUserIds={onlineUserIds}
              hostUserId={room.hostUserId}
              vertical
              compact
              maxVisible={4}
            />
          }
        >
          <ParticipantsPanel
            members={room.members}
            onlineUserIds={onlineUserIds}
            hostUserId={room.hostUserId}
            onInvite={() => setShareOpen(true)}
          />
          <div className="min-h-0 flex-1">
            <RoomChat
              messages={messages}
              onSend={send}
              sending={sending}
              emptyHint="Waiting for collaborators… Share your invite link."
            />
          </div>
        </CollabSideRail>
      </div>

      <div className="flex max-h-44 flex-col border-t border-[var(--line)] lg:hidden">
        <ParticipantsPanel
          members={room.members}
          onlineUserIds={onlineUserIds}
          hostUserId={room.hostUserId}
          onInvite={() => setShareOpen(true)}
        />
        <div className="min-h-0 flex-1">
          <RoomChat messages={messages} onSend={send} sending={sending} />
        </div>
      </div>

      <InviteModal
        open={shareOpen}
        room={room}
        shareUrl={shareUrl}
        mode="in-room"
        subtitle="Invite friends to code together in this CodeRoom."
        onlineUserIds={onlineUserIds}
        connectionStatus={connectionStatus}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
