import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Code2, KeyRound, MessageSquare, PenTool, Video } from "lucide-react";
import { ErrorState } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { createRoom, getMyRooms, joinRoom } from "../features/collaboration/api";
import InviteModal from "../features/collaboration/components/InviteModal";
import {
  codeRoomShareUrl,
  roomCodeFromSearchParams,
  roomCodeOf,
} from "../features/collaboration/roomLinks";
import type { Room, RoomSummary } from "../features/collaboration/types";
import { getLanguages } from "../lib/api";
import type { LanguageDTO } from "../lib/types";
import {
  pickPreferredLanguage,
  setPreferredLanguage,
} from "../lib/editorPrefs";

const FEATURES = [
  { icon: Code2, label: "Shared editor" },
  { icon: MessageSquare, label: "Live chat" },
  { icon: PenTool, label: "Whiteboard" },
] as const;

function shortRoomCode(token: string): string {
  if (token.length <= 8) return token;
  return `${token.slice(0, 8)}…`;
}

export default function CodeRoomHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [languages, setLanguages] = useState<LanguageDTO[]>([]);
  const [language, setLanguage] = useState("python");
  const [roomCode, setRoomCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [myRooms, setMyRooms] = useState<RoomSummary[]>([]);
  const [myRoomsLoading, setMyRoomsLoading] = useState(false);

  const refreshMyRooms = useCallback(async () => {
    if (!user) {
      setMyRooms([]);
      return;
    }
    setMyRoomsLoading(true);
    try {
      const rooms = await getMyRooms({ type: "CODEROOM", limit: 10 });
      setMyRooms(rooms);
    } catch {
      setMyRooms([]);
    } finally {
      setMyRoomsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void getLanguages().then((langs) => {
      setLanguages(langs);
      const preferred = pickPreferredLanguage(langs);
      if (preferred) setLanguage(preferred.slug);
    });
  }, []);

  useEffect(() => {
    const fromQuery = roomCodeFromSearchParams(searchParams);
    if (fromQuery) setRoomCode(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    void refreshMyRooms();
  }, [refreshMyRooms]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: "/coderoom" } });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const room = await createRoom({ type: "CODEROOM", language });
      setCreatedRoom(room);
      setModalOpen(true);
      void refreshMyRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: "/coderoom" } });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const room = await joinRoom(roomCode.trim());
      void refreshMyRooms();
      navigate(
        `/coderoom/${room.id}?code=${encodeURIComponent(roomCodeOf(room))}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setBusy(false);
    }
  }

  const shareUrl =
    createdRoom != null
      ? codeRoomShareUrl(createdRoom.id, roomCodeOf(createdRoom))
      : "";

  return (
    <div className="practice-shell min-h-[calc(100vh-3.5rem)]">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-14">
        <p className="verdict-strip text-[var(--accent)]">/coderoom</p>
        <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          CodeRoom <span className="text-[var(--accent)]">Live</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-[var(--text-dim)]">
          Collaborative coding workspace with shared editor, chat, and
          whiteboard. Not tied to a problem — just create a room and invite
          friends.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {FEATURES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]"
            >
              <Icon className="h-3 w-3" aria-hidden />
              {label}
            </span>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 p-5"
          >
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Create room
            </h2>
            <label className="mt-4 block text-xs text-[var(--text-dim)]">
              Language
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setPreferredLanguage(e.target.value);
                }}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text)]"
              >
                {languages.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0a0d12] disabled:opacity-50"
            >
              <Video className="h-4 w-4" aria-hidden />
              {busy ? "Creating…" : "Create CodeRoom"}
            </button>
          </form>

          <form
            onSubmit={handleJoin}
            className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 p-5"
          >
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Join with Room Code
            </h2>
            <label className="mt-4 block text-xs text-[var(--text-dim)]">
              Room Code
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="e.g. f171abe7…"
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text)]"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !roomCode.trim()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--text)] disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" aria-hidden />
              Join room
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorState message={error} />
          </div>
        )}

        {user && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Your rooms
            </h2>
            {myRoomsLoading ? (
              <p className="mt-3 text-sm text-[var(--text-dim)]">Loading…</p>
            ) : myRooms.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--text-dim)]">
                No active CodeRooms yet. Create one or join with a room code.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80">
                {myRooms.map((room) => (
                  <li
                    key={room.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-[var(--text)]">
                        {shortRoomCode(room.inviteToken)}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-dim)]">
                        {room.language}
                        {room.role ? ` · ${room.role}` : ""}
                      </p>
                    </div>
                    <Link
                      to={`/coderoom/${room.id}?code=${encodeURIComponent(room.inviteToken)}`}
                      className="shrink-0 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <p className="mt-8 text-sm text-[var(--text-dim)]">
          Solving a problem with a friend? Use{" "}
          <Link to="/problems" className="text-[var(--accent)]">
            Invite Friends on the problem page
          </Link>{" "}
          instead.
        </p>
      </main>

      <InviteModal
        open={modalOpen}
        room={createdRoom}
        shareUrl={shareUrl}
        mode="created"
        subtitle="Invite friends to code together in this CodeRoom."
        enterPath={
          createdRoom
            ? `/coderoom/${createdRoom.id}?code=${encodeURIComponent(roomCodeOf(createdRoom))}`
            : "/coderoom"
        }
        onlineUserIds={createdRoom ? [createdRoom.hostUserId] : []}
        connectionStatus="connected"
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
