import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import CodeWorkspace from "../components/CodeWorkspace";
import { Loading, ErrorState } from "../components/Loading";
import DifficultyBadge from "../components/DifficultyBadge";
import VerdictPanel from "../components/VerdictPanel";
import RunResultsPanel from "../components/RunResultsPanel";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/toast/ToastProvider";
import { getLanguages, getProblem } from "../lib/api";
import {
  exampleInputToStdin,
  exampleOutputToExpected,
  formatExample,
  parseExamples,
} from "../lib/examples";
import type { SampleRunSession } from "../lib/runSampleTests";
import type {
  JudgeVerdictDTO,
  LanguageDTO,
  ProblemPublicDTO,
} from "../lib/types";
import CollabSideRail from "../features/collaboration/components/CollabSideRail";
import InviteModal from "../features/collaboration/components/InviteModal";
import ParticipantsPanel from "../features/collaboration/components/ParticipantsPanel";
import PresenceAvatars from "../features/collaboration/components/PresenceAvatars";
import PresenceChips from "../features/collaboration/components/PresenceChips";
import ProblemStatementPanel from "../features/collaboration/components/ProblemStatementPanel";
import RoomChat from "../features/collaboration/components/RoomChat";
import SessionHeader from "../features/collaboration/components/SessionHeader";
import {
  joinRoom,
  runRoomCode,
  submitRoomCode,
} from "../features/collaboration/api";
import { usePresenceMemberSync } from "../features/collaboration/hooks/usePresenceMemberSync";
import { useRoom } from "../features/collaboration/hooks/useRoom";
import { useRoomChat } from "../features/collaboration/hooks/useRoomChat";
import { useRoomPresence } from "../features/collaboration/hooks/useRoomPresence";
import { useYjsCodeEditor } from "../features/collaboration/hooks/useYjsCodeEditor";
import {
  asJudgeVerdict,
  buildSamplesSession,
  caseFromJudge0,
  judge0ToCustomSession,
} from "../features/collaboration/roomRunAdapters";
import {
  problemCollabShareUrl,
  roomCodeFromSearchParams,
  roomCodeOf,
} from "../features/collaboration/roomLinks";
import { roomRunTopic, roomSubmitTopic, subscribeTopic } from "../lib/ws";

type BottomTab = "io" | "result";

export default function ProblemCollabRoom() {
  const { id, roomId } = useParams<{ id: string; roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const problemId = Number(id);
  const { user } = useAuth();
  const { pushToast } = useToast();
  const { room, setRoom, loading, error, canEdit, reload } = useRoom(roomId);
  const { onlineUserIds, lastEvent } = useRoomPresence(roomId, !!room);
  usePresenceMemberSync(lastEvent, reload);
  const { messages, send, sending } = useRoomChat(roomId, !!room);

  const [problem, setProblem] = useState<ProblemPublicDTO | null>(null);
  const [languages, setLanguages] = useState<LanguageDTO[]>([]);
  const [language, setLanguage] = useState("java");
  const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("io");
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [caseStdins, setCaseStdins] = useState<string[]>([]);
  const [runSession, setRunSession] = useState<SampleRunSession | null>(null);
  const [verdict, setVerdict] = useState<JudgeVerdictDTO | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [splitPct, setSplitPct] = useState(42);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const {
    ready,
    error: syncError,
    connectionStatus,
    bindEditor,
    getCode,
    customStdin,
    setCustomStdin,
  } = useYjsCodeEditor({
    roomId: roomId || "",
    language,
    enabled: !!room,
    readOnly: !canEdit,
    userName: user?.uniqueUserId || user?.name || "user",
  });

  useEffect(() => {
    if (!problemId) return;
    void getProblem(problemId)
      .then((p) => {
        setProblem(p);
        const exs = parseExamples(p.examples);
        setCaseStdins(exs.map((ex) => exampleInputToStdin(ex.input)));
      })
      .catch(() => setProblem(null));
    void getLanguages().then(setLanguages);
  }, [problemId]);

  useEffect(() => {
    if (room?.language) setLanguage(room.language);
  }, [room?.language]);

  useEffect(() => {
    const code = roomCodeFromSearchParams(searchParams);
    if (!code || room || joining || !error) return;
    if (!user) {
      navigate("/login", {
        state: {
          from: `/problems/${problemId}/room/${roomId}?code=${encodeURIComponent(code)}`,
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
    problemId,
    roomId,
    setRoom,
    pushToast,
  ]);

  useEffect(() => {
    if (!roomId) return;
    const u1 = subscribeTopic<Record<string, unknown>>(
      roomRunTopic(roomId),
      (payload) => {
        if (payload.status === "STARTED") {
          setRunning(true);
          setBottomTab("result");
        } else if (payload.status === "COMPLETED" && payload.result) {
          setRunning(false);
          setRunSession(judge0ToCustomSession(payload.result));
          setBottomTab("result");
        }
      }
    );
    const u2 = subscribeTopic<Record<string, unknown>>(
      roomSubmitTopic(roomId),
      (payload) => {
        if (payload.status === "STARTED") {
          setSubmitting(true);
          setBottomTab("result");
        } else if (payload.status === "COMPLETED" && payload.verdict) {
          setSubmitting(false);
          const v = asJudgeVerdict(payload.verdict);
          if (v) setVerdict(v);
          setBottomTab("result");
        }
      }
    );
    return () => {
      u1();
      u2();
    };
  }, [roomId]);

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

  const examples = useMemo(
    () => (problem ? parseExamples(problem.examples) : []),
    [problem]
  );

  const languageId = useMemo(
    () => languages.find((l) => l.slug === language)?.languageId,
    [languages, language]
  );

  const shareUrl =
    room && roomId
      ? problemCollabShareUrl(problemId, roomId, roomCodeOf(room))
      : "";

  async function handleRun() {
    if (!roomId || languageId == null) return;
    setBusy(true);
    setRunning(true);
    setActionError(null);
    setVerdict(null);
    setRunSession(null);
    setBottomTab("result");

    try {
      if (examples.length > 0) {
        const cases = [];
        for (let i = 0; i < examples.length; i++) {
          const ex = examples[i];
          const stdin = caseStdins[i] ?? exampleInputToStdin(ex.input);
          const result = await runRoomCode(roomId, {
            sourceCode: getCode(),
            languageId,
            stdin,
          });
          cases.push(
            caseFromJudge0(
              i,
              {
                stdin,
                expectedOutput: exampleOutputToExpected(ex.output),
                inputDisplay: formatExample(ex.input),
              },
              result
            )
          );
          if (cases[i].status === "Compilation Error") break;
        }
        setRunSession(buildSamplesSession(cases));
      } else {
        const stdin = customStdin;
        const result = await runRoomCode(roomId, {
          sourceCode: getCode(),
          languageId,
          stdin,
        });
        setRunSession(judge0ToCustomSession(result, stdin));
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(false);
      setRunning(false);
    }
  }

  async function handleSubmit() {
    if (!roomId || languageId == null) return;
    setBusy(true);
    setSubmitting(true);
    setActionError(null);
    setVerdict(null);
    setRunSession(null);
    setBottomTab("result");
    try {
      const res = await submitRoomCode(roomId, {
        code: getCode(),
        languageId,
      });
      const v = asJudgeVerdict(res);
      if (v) setVerdict(v);
      await reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
      setSubmitting(false);
    }
  }

  if (loading || joining) return <Loading />;
  const pendingJoin = !!roomCodeFromSearchParams(searchParams) && !room;
  if (pendingJoin) return <Loading label="Joining room…" />;
  if ((error || !room) && !joining) {
    return <ErrorState message={error || "Room not found"} />;
  }
  if (!room) return <Loading />;

  return (
    <div className="relative flex h-[calc(100vh-57px)] flex-col overflow-hidden bg-[var(--bg)]">
      <PresenceChips lastEvent={lastEvent} />

      <SessionHeader
        room={room}
        onlineUserIds={onlineUserIds}
        connectionStatus={connectionStatus}
        onInvite={() => setShareOpen(true)}
        left={
          <>
            <Link
              to={`/problems/${problemId}`}
              className="shrink-0 text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
            >
              ← Problem
            </Link>
            <span className="hidden text-[var(--text-dim)] sm:inline">/</span>
            <h1 className="display min-w-0 truncate text-sm font-semibold sm:text-base">
              {problem
                ? `${problem.id}. ${problem.title}`
                : `Problem #${problemId}`}
            </h1>
            {problem && <DifficultyBadge difficulty={problem.difficulty} />}
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={!canEdit}
              className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-2 py-1.5 text-sm text-[var(--text)]"
            >
              {languages.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!canEdit || busy || !ready}
              onClick={() => void handleRun()}
              className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {running ? "Running…" : "Run"}
            </button>
            <button
              type="button"
              disabled={!canEdit || busy || !ready}
              onClick={() => void handleSubmit()}
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-[#0a0d12] disabled:opacity-40"
            >
              {submitting ? "Judging…" : "Submit"}
            </button>
          </div>
        }
      />

      <div className="flex min-h-0 flex-1">
        <div
          ref={splitRef}
          className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row"
        >
          <section
            className="flex min-h-0 flex-col overflow-hidden border-[var(--line)] lg:border-r"
            style={{
              flexBasis: `${splitPct}%`,
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            {problem ? (
              <ProblemStatementPanel
                problem={problem}
                showDifficulty={false}
              />
            ) : (
              <div className="p-4 text-sm text-[var(--text-dim)]">
                Loading statement…
              </div>
            )}
          </section>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize editor"
            onMouseDown={(e) => {
              e.preventDefault();
              draggingRef.current = true;
              document.body.style.cursor = window.matchMedia(
                "(min-width: 1024px)"
              ).matches
                ? "col-resize"
                : "row-resize";
              document.body.style.userSelect = "none";
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              draggingRef.current = true;
            }}
            className="group relative z-10 flex h-3 shrink-0 cursor-row-resize items-center justify-center border-y border-[var(--line)] bg-[var(--bg-raised)] hover:bg-[var(--accent)]/15 lg:h-auto lg:w-2 lg:cursor-col-resize lg:border-x lg:border-y-0"
          >
            <div className="h-1 w-10 rounded-full bg-[var(--line)] group-hover:bg-[var(--accent)] lg:h-10 lg:w-1" />
          </div>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            {syncError && (
              <p className="bg-red-500/10 px-3 py-1 text-xs text-red-300">
                {syncError}
              </p>
            )}
            <div className="min-h-[220px] flex-[1.4] bg-[var(--bg-inset)]">
              <CodeWorkspace
                language={language}
                readOnly={!canEdit}
                onMount={(editor, monaco) => bindEditor(editor, monaco)}
              />
            </div>

            <div className="flex min-h-[180px] flex-1 flex-col border-t border-[var(--line)]">
              <div className="flex shrink-0 items-center gap-1 border-b border-[var(--line)] bg-[var(--bg-raised)] px-2">
                {(
                  [
                    ["io", "Testcase"],
                    ["result", "Test Result"],
                  ] as const
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setBottomTab(tab)}
                    className={`verdict-strip border-b-2 px-3 py-2 ${
                      bottomTab === tab
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {bottomTab === "io" && (
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
                                  : "border-[var(--line)] text-[var(--text-dim)]"
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
                              setCustomStdin(value);
                            }}
                            disabled={!canEdit}
                            rows={6}
                            spellCheck={false}
                            className="mono w-full resize-y rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-xs text-[var(--text)] disabled:opacity-60"
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
                      </>
                    ) : (
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
                          Custom stdin (shared)
                        </label>
                        <textarea
                          value={customStdin}
                          onChange={(e) => setCustomStdin(e.target.value)}
                          disabled={!canEdit}
                          rows={6}
                          spellCheck={false}
                          className="mono w-full resize-y rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-xs text-[var(--text)] disabled:opacity-60"
                        />
                      </div>
                    )}
                  </div>
                )}

                {bottomTab === "result" && (
                  <div className="space-y-3">
                    {actionError && <ErrorState message={actionError} />}
                    {submitting && (
                      <p className="text-sm text-[var(--text-dim)]">
                        Judging against hidden test cases…
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
                                    (verdict.passedCount ?? 0) ===
                                    verdict.totalCount
                                      ? "var(--ok)"
                                      : "var(--err)",
                                }}
                              >
                                {verdict.passedCount ?? 0} /{" "}
                                {verdict.totalCount} passed
                              </p>
                            </div>
                          )}
                      </div>
                    )}
                    {!submitting && !verdict && (
                      <RunResultsPanel
                        session={runSession}
                        loading={running}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
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
              emptyHint="Waiting for collaborators… Start the conversation."
            />
          </div>
        </CollabSideRail>
      </div>

      {/* Mobile participants/chat drawer substitute */}
      <div className="flex max-h-48 flex-col border-t border-[var(--line)] lg:hidden">
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
        onlineUserIds={onlineUserIds}
        connectionStatus={connectionStatus}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
