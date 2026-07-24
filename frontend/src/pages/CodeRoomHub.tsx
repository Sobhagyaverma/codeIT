import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createRoom, joinRoom } from "../features/collaboration/api";
import InviteModal from "../features/collaboration/components/InviteModal";
import {
  codeRoomShareUrl,
  roomCodeFromSearchParams,
  roomCodeOf,
} from "../features/collaboration/roomLinks";
import type { Room } from "../features/collaboration/types";
import { getLanguages } from "../lib/api";
import type { LanguageDTO } from "../lib/types";

export default function CodeRoomHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [languages, setLanguages] = useState<LanguageDTO[]>([]);
  const [language, setLanguage] = useState("java");
  const [roomCode, setRoomCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    void getLanguages().then((langs) => {
      setLanguages(langs);
      if (langs[0]) setLanguage(langs[0].slug);
    });
  }, []);

  useEffect(() => {
    const fromQuery = roomCodeFromSearchParams(searchParams);
    if (fromQuery) setRoomCode(fromQuery);
  }, [searchParams]);

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
      navigate(`/coderoom/${room.id}`);
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
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="verdict-strip text-[var(--accent)]">/coderoom</p>
        <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          CodeRoom <span className="text-[var(--accent)]">Live</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-[var(--text-dim)]">
          Collaborative coding workspace with shared editor, chat, and
          whiteboard. Not tied to a problem — just create a room and invite
          friends.
        </p>

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
                onChange={(e) => setLanguage(e.target.value)}
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
              className="mt-4 w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0a0d12] disabled:opacity-50"
            >
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
                placeholder="Paste Room Code"
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text)]"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !roomCode.trim()}
              className="mt-4 w-full rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--text)] disabled:opacity-50"
            >
              Join room
            </button>
          </form>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {error}
          </p>
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
        enterPath={createdRoom ? `/coderoom/${createdRoom.id}` : "/coderoom"}
        onlineUserIds={createdRoom ? [createdRoom.hostUserId] : []}
        connectionStatus="connected"
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
