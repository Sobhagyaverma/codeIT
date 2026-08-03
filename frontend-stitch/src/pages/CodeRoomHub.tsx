import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../context/AuthContext";
import {
  createRoom,
  getMyRooms,
  joinRoom,
} from "../features/collaboration/api";
import InviteModal from "../features/collaboration/InviteModal";
import {
  codeRoomShareUrl,
  formatRelativeTime,
  roomCodeFromSearchParams,
  roomCodeOf,
} from "../features/collaboration/roomLinks";
import type { Room, RoomSummary } from "../features/collaboration/types";
import { ApiError, getLanguages, type LanguageDTO } from "../lib/api";
import {
  pickPreferredLanguage,
  setPreferredLanguage,
} from "../lib/editorPrefs";

const FALLBACK_LANGS: LanguageDTO[] = [
  { slug: "python", name: "Python", languageId: 71 },
  { slug: "java", name: "Java", languageId: 62 },
  { slug: "cpp", name: "C++", languageId: 54 },
  { slug: "javascript", name: "JavaScript", languageId: 63 },
];

export default function CodeRoomHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [languages, setLanguages] = useState<LanguageDTO[]>(FALLBACK_LANGS);
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
      setMyRooms(await getMyRooms({ type: "CODEROOM", limit: 10 }));
    } catch {
      setMyRooms([]);
    } finally {
      setMyRoomsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void getLanguages()
      .then((langs) => {
        const list = langs.length ? langs : FALLBACK_LANGS;
        setLanguages(list);
        const preferred = pickPreferredLanguage(list);
        if (preferred) setLanguage(preferred.slug);
      })
      .catch(() => {
        const preferred = pickPreferredLanguage(FALLBACK_LANGS);
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
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create room"
      );
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
    const code = roomCode.trim();
    if (!code) {
      setError("Enter a room code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const room = await joinRoom(code);
      void refreshMyRooms();
      navigate(
        `/coderoom/${room.id}?code=${encodeURIComponent(roomCodeOf(room))}`
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to join room"
      );
    } finally {
      setBusy(false);
    }
  }

  const shareUrl =
    createdRoom != null
      ? codeRoomShareUrl(createdRoom.id, roomCodeOf(createdRoom))
      : "";

  return (
    <div className="flex min-h-screen flex-col bg-background font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container">
      <AppNav activeHint="/coderoom" />

      <main className="mx-auto flex w-full max-w-[900px] flex-grow flex-col gap-12 px-margin-mobile py-12 pt-28 md:px-0 md:py-20">
        <header className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
          <div className="flex flex-col gap-2">
            <span className="font-code-sm text-code-sm tracking-widest text-primary uppercase opacity-80">
              /coderoom
            </span>
            <h1 className="font-headline-xl text-headline-xl text-on-surface">
              CodeRoom Live
            </h1>
            <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
              Collaborative coding workspace with shared editor, chat, and
              whiteboard. Not tied to a problem — create a room and invite
              friends.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 md:justify-start">
            <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-code-sm text-[11px] tracking-wider text-primary uppercase">
              <span className="material-symbols-outlined text-[14px]">
                integration_instructions
              </span>{" "}
              Shared editor
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 font-code-sm text-[11px] tracking-wider text-secondary uppercase">
              <span className="material-symbols-outlined text-[14px]">chat</span>{" "}
              Live chat
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-tertiary/20 bg-tertiary/10 px-3 py-1 font-code-sm text-[11px] tracking-wider text-tertiary uppercase">
              <span className="material-symbols-outlined text-[14px]">draw</span>{" "}
              Whiteboard
            </span>
          </div>
        </header>

        {error && <p className="text-sm text-hard">{error}</p>}

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <form
            onSubmit={handleCreate}
            className="group relative flex flex-col gap-6 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container p-6 md:p-8"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span className="material-symbols-outlined">add_box</span>
              </div>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Create room
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">
                  Language
                </label>
                <div className="focus-glow relative rounded-lg transition-all">
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setPreferredLanguage(e.target.value);
                    }}
                    className="w-full appearance-none rounded-lg border border-outline-variant/40 bg-surface-container-high p-3 font-body-md text-body-md text-on-surface focus:ring-0 focus:outline-none"
                  >
                    {languages.map((l) => (
                      <option key={l.slug} value={l.slug}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="glow-effect mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-label-md text-label-md text-on-primary transition-all hover:bg-primary-fixed-dim disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create CodeRoom"}{" "}
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>

          <form
            onSubmit={handleJoin}
            className="relative flex flex-col gap-6 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container p-6 md:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface">
                <span className="material-symbols-outlined">login</span>
              </div>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Join with Room Code
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">
                  Room Code
                </label>
                <div className="focus-glow flex items-center overflow-hidden rounded-lg border border-outline-variant/40 bg-surface-container-high transition-all">
                  <span className="material-symbols-outlined pl-3 text-on-surface-variant">
                    key
                  </span>
                  <input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="w-full border-none bg-transparent p-3 font-code-sm text-code-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-0 focus:outline-none"
                    placeholder="e.g. f171abe7..."
                    type="text"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-outline bg-transparent py-3 font-label-md text-label-md text-on-surface transition-all hover:border-outline-variant hover:bg-surface-variant/50 disabled:opacity-50"
              >
                Join room
              </button>
            </div>
          </form>
        </section>

        <section className="mt-4 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <h3 className="flex items-center gap-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              <span className="material-symbols-outlined text-primary">
                history
              </span>{" "}
              Your rooms
            </h3>
          </div>

          {!user && (
            <p className="text-sm text-on-surface-variant">
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>{" "}
              to see your rooms.
            </p>
          )}

          {user && myRoomsLoading && (
            <p className="text-sm text-on-surface-variant">Loading rooms…</p>
          )}

          {user && !myRoomsLoading && myRooms.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              No rooms yet — create one above.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {myRooms.map((room) => {
              const isHost = room.role === "HOST";
              return (
                <div
                  key={room.id}
                  className="group flex flex-col justify-between gap-4 rounded-lg border border-outline-variant/10 bg-surface-container-low p-4 transition-colors hover:bg-surface-container md:flex-row md:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-2 rounded-full ${
                        isHost ? "bg-primary/40" : "bg-outline-variant"
                      }`}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-code-sm text-code-sm ${
                            isHost ? "text-primary" : "text-on-surface"
                          }`}
                        >
                          {room.inviteToken.length > 12
                            ? `${room.inviteToken.slice(0, 8)}…`
                            : room.inviteToken}
                        </span>
                        <span className="rounded bg-surface-container-high px-2 py-0.5 font-label-md text-[10px] tracking-wider text-on-surface-variant uppercase">
                          {room.role}
                        </span>
                      </div>
                      <span className="mt-1 font-body-md text-sm text-on-surface-variant">
                        {room.language} •{" "}
                        {formatRelativeTime(room.updatedAt || room.lastSeenAt)}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/coderoom/${room.id}?code=${encodeURIComponent(room.inviteToken)}`}
                    className="flex items-center gap-1 self-start rounded-lg border border-primary/30 bg-transparent px-4 py-1.5 font-label-md text-label-md text-primary transition-all hover:bg-primary/10 md:opacity-0 md:group-hover:opacity-100"
                  >
                    Open{" "}
                    <span className="material-symbols-outlined text-[16px]">
                      open_in_new
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-4 flex items-start gap-3 rounded-lg border border-outline-variant/10 bg-surface-container-lowest p-4">
          <span className="material-symbols-outlined mt-0.5 text-[20px] text-secondary">
            info
          </span>
          <p className="font-body-md text-sm text-on-surface-variant">
            Solving a problem with a friend? Use{" "}
            <Link
              to="/problems"
              className="text-secondary underline decoration-secondary/30 underline-offset-2 transition-colors hover:text-secondary-fixed"
            >
              Invite Friends on the problem page
            </Link>{" "}
            instead.
          </p>
        </div>
      </main>

      <footer className="mt-auto border-t border-outline-variant/20 py-8">
        <div className="mx-auto flex w-full max-w-container-max flex-col items-center justify-between gap-4 px-margin-desktop md:flex-row">
          <span className="font-label-md text-label-md text-on-surface-variant/60">
            © {new Date().getFullYear()} CodeIT
          </span>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            >
              Terms
            </Link>
            <Link
              to="/help"
              className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            >
              Help
            </Link>
          </div>
        </div>
      </footer>

      <InviteModal
        open={modalOpen}
        room={createdRoom}
        shareUrl={shareUrl}
        enterPath={
          createdRoom
            ? `/coderoom/${createdRoom.id}?code=${encodeURIComponent(roomCodeOf(createdRoom))}`
            : undefined
        }
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
