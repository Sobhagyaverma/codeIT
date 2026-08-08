import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
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
  { slug: "go", name: "Go", languageId: 60 },
  { slug: "rust", name: "Rust", languageId: 73 },
];

const HERO_BADGES = [
  "Shared Editor",
  "Live Whiteboard",
  "Live Chat",
  "Multi-language",
  "Invite by Link",
  "Live Cursors",
  "Shared Compiler",
] as const;

const FEATURE_CARDS = [
  {
    icon: "edit_note",
    title: "Shared Editor",
    body: "Multiple developers editing together with live cursors on Monaco — low latency, conflict-aware sync.",
  },
  {
    icon: "draw",
    title: "Whiteboard",
    body: "Sketch trees, graphs, arrays, DP tables, and flow diagrams on an infinite canvas beside the code.",
  },
  {
    icon: "play_circle",
    title: "Run Together",
    body: "Shared compiler, shared stdin, shared output. Everyone sees the same execution environment.",
  },
  {
    icon: "group_add",
    title: "Invite Friends",
    body: "Share a room code or invite link. Teammates join instantly — no setup beyond CodeT login.",
  },
] as const;

const LANG_ICONS: Record<string, string> = {
  python: "🐍",
  java: "☕",
  cpp: "⚙️",
  c: "⚙️",
  javascript: "🟨",
  typescript: "🔷",
  go: "🐹",
  rust: "🦀",
};

type RoomFilter = "all" | "hosted" | "joined" | "recent" | "favorites";

const FAVORITES_KEY = "codeit.coderoom.favorites";

function loadFavoriteIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? new Set(parsed.filter((x): x is string => typeof x === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

function persistFavoriteIds(ids: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]));
}

function roomTitle(room: RoomSummary, isHost: boolean): string {
  if (room.hostNote?.trim()) {
    const note = room.hostNote.trim();
    return note.length > 42 ? `${note.slice(0, 40)}…` : note;
  }
  const lang =
    room.language.charAt(0).toUpperCase() + room.language.slice(1).toLowerCase();
  return isHost ? `${lang} workspace` : `${lang} session`;
}

function initialOf(name: string): string {
  const t = name.trim();
  return t ? t[0]!.toUpperCase() : "?";
}

function CodeRoomHeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:mx-0">
      <div className="pointer-events-none absolute -inset-6 rounded-full bg-primary/15 blur-3xl" />
      <div className="glass-panel relative overflow-hidden rounded-2xl border border-outline-variant/40 p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.65)] md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
            <span className="font-label-md text-[11px] tracking-wider text-primary uppercase">
              Live · 3 online
            </span>
          </div>
          <div className="flex -space-x-2">
            {["SV", "AK", "RJ"].map((label, i) => (
              <div
                key={label}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-container text-[10px] font-semibold text-on-surface"
                style={{
                  background:
                    i === 0
                      ? "rgba(183,109,255,0.45)"
                      : i === 1
                        ? "rgba(222,183,255,0.35)"
                        : "rgba(155,138,176,0.45)",
                  zIndex: 3 - i,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
            <div className="flex items-center gap-1.5 border-b border-outline-variant/20 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-hard/80" />
              <span className="h-2 w-2 rounded-full bg-medium/80" />
              <span className="h-2 w-2 rounded-full bg-easy/80" />
              <span className="ml-2 font-code-sm text-[10px] text-on-surface-variant">
                main.java
              </span>
            </div>
            <pre className="overflow-hidden p-3 font-code-sm text-[11px] leading-5 text-on-surface/90">
              <code>
                <span className="text-secondary">class</span>{" "}
                <span className="text-primary">Solution</span> {"{\n"}
                {"  "}
                <span className="text-secondary">void</span> solve() {"{\n"}
                {"    "}
                <span className="text-on-surface-variant">// SV editing…</span>
                {"\n"}
                {"    "}int[] a = {"{"}1, 2, 3{"}"};{"\n"}
                {"  "}\n{"}"}
              </code>
            </pre>
            <div className="flex items-center gap-2 border-t border-outline-variant/20 px-3 py-2">
              <span className="rounded bg-primary/15 px-2 py-0.5 font-label-md text-[10px] text-primary">
                SV
              </span>
              <span className="h-3 w-px bg-primary/50" />
              <span className="rounded bg-secondary/15 px-2 py-0.5 font-label-md text-[10px] text-secondary">
                AK
              </span>
            </div>
          </div>

          <div className="col-span-2 flex flex-col gap-3">
            <div className="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
              <p className="mb-2 font-label-md text-[10px] tracking-wide text-on-surface-variant uppercase">
                Whiteboard
              </p>
              <div className="relative h-16 overflow-hidden rounded-lg bg-surface-container-highest/60">
                <div className="absolute top-3 left-3 h-8 w-8 rounded-full border border-primary/40" />
                <div className="absolute top-5 left-8 h-px w-10 rotate-12 bg-secondary/60" />
                <div className="absolute right-4 bottom-3 h-6 w-10 rounded border border-tertiary/40" />
              </div>
            </div>
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
              <p className="mb-2 font-label-md text-[10px] tracking-wide text-on-surface-variant uppercase">
                Chat
              </p>
              <div className="space-y-1.5">
                <p className="rounded-lg rounded-tl-sm bg-primary/15 px-2 py-1 font-label-md text-[11px] text-on-surface">
                  Try sliding window?
                </p>
                <p className="rounded-lg rounded-tr-sm bg-surface-container-highest px-2 py-1 text-right font-label-md text-[11px] text-on-surface-variant">
                  Running sample…
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-3 py-2">
          <span className="font-code-sm text-[11px] text-easy">
            ✓ Accepted · 42ms
          </span>
          <span className="font-label-md text-[10px] text-on-surface-variant">
            Shared run
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CodeRoomHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [languages, setLanguages] = useState<LanguageDTO[]>(FALLBACK_LANGS);
  const [language, setLanguage] = useState("python");
  const [hostNote, setHostNote] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [myRooms, setMyRooms] = useState<RoomSummary[]>([]);
  const [myRoomsLoading, setMyRoomsLoading] = useState(false);
  const [roomQuery, setRoomQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState<RoomFilter>("all");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() =>
    loadFavoriteIds()
  );

  function toggleFavorite(roomId: string) {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      persistFavoriteIds(next);
      return next;
    });
  }

  const refreshMyRooms = useCallback(async () => {
    if (!user) {
      setMyRooms([]);
      return;
    }
    setMyRoomsLoading(true);
    try {
      setMyRooms(await getMyRooms({ type: "CODEROOM", limit: 20 }));
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

  const featuredLangs = useMemo(() => {
    const order = ["python", "java", "cpp", "go", "rust", "javascript"];
    const bySlug = new Map(languages.map((l) => [l.slug, l]));
    const picked = order
      .map((slug) => bySlug.get(slug))
      .filter((l): l is LanguageDTO => Boolean(l));
    if (picked.length >= 3) return picked;
    return languages.slice(0, 6);
  }, [languages]);

  const filteredRooms = useMemo(() => {
    let list = [...myRooms];
    if (roomFilter === "hosted") {
      list = list.filter(
        (r) => r.role === "HOST" || (user != null && r.hostUserId === user.id)
      );
    } else if (roomFilter === "joined") {
      list = list.filter(
        (r) => r.role !== "HOST" && !(user != null && r.hostUserId === user.id)
      );
    } else if (roomFilter === "recent") {
      list = list.sort((a, b) => {
        const ta = Date.parse(a.lastSeenAt || a.updatedAt || a.createdAt || "0");
        const tb = Date.parse(b.lastSeenAt || b.updatedAt || b.createdAt || "0");
        return tb - ta;
      });
    } else if (roomFilter === "favorites") {
      list = list.filter((r) => favoriteIds.has(r.id));
    }
    const q = roomQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const hay = [
          r.hostNote,
          r.hostName,
          r.hostUsername,
          r.language,
          r.role,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [favoriteIds, myRooms, roomFilter, roomQuery, user]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: "/coderoom" } });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const room = await createRoom({
        type: "CODEROOM",
        language,
        hostNote: hostNote.trim() || undefined,
      });
      setCreatedRoom(room);
      setModalOpen(true);
      setHostNote("");
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

  function scrollToCreate() {
    document.getElementById("coderoom-create")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const shareUrl =
    createdRoom != null
      ? codeRoomShareUrl(createdRoom.id, roomCodeOf(createdRoom))
      : "";

  const filterChips: { id: RoomFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "hosted", label: "Hosted" },
    { id: "joined", label: "Joined" },
    { id: "recent", label: "Recent" },
    { id: "favorites", label: "Favorites" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(132,43,210,0.16),transparent_42%),radial-gradient(circle_at_85%_75%,rgba(96,51,137,0.12),transparent_40%)]" />
      <AppNav activeHint="/coderoom" />

      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col gap-16 px-margin-mobile pt-28 pb-16 md:px-margin-desktop md:pt-32 md:pb-20">
        {/* Hero */}
        <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <div className="flex w-fit items-center gap-2 rounded-full border border-secondary-container/30 bg-secondary-container/20 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="font-label-md text-[11px] tracking-widest text-primary uppercase">
                Live collaboration
              </span>
            </div>
            <div>
              <p className="mb-2 font-code-sm text-code-sm tracking-[0.2em] text-primary/80 uppercase">
                /coderoom
              </p>
              <h1 className="font-headline-xl text-headline-xl text-on-surface">
                CodeRoom Live
              </h1>
              <p className="mt-4 max-w-lg font-body-lg text-body-lg text-on-surface-variant">
                Real-time collaborative coding workspace for developers.
              </p>
              <p className="mt-3 max-w-lg font-body-md text-body-md text-on-surface-variant/90">
                Write code together.
                <br />
                Draw ideas together.
                <br />
                Debug together.
              </p>
              <p className="mt-3 max-w-lg font-body-md text-sm text-on-surface-variant">
                Create a room and invite your teammates in seconds.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {HERO_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-high/80 px-3 py-1.5 font-label-md text-[12px] text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    check_circle
                  </span>
                  {badge}
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToCreate}
                className="glow-effect rounded-xl bg-primary px-8 py-3 font-label-md text-label-md font-semibold text-on-primary shadow-[0_0_24px_rgba(221,183,255,0.28)] transition-transform active:scale-[0.98]"
              >
                Launch CodeRoom
              </button>
              <Link
                to="/problems"
                className="rounded-xl border border-outline-variant/50 px-6 py-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
              >
                Prefer problem collab?
              </Link>
            </div>
          </div>
          <CodeRoomHeroIllustration />
        </section>

        {error && (
          <p className="rounded-xl border border-hard/30 bg-hard/10 px-4 py-3 text-sm text-hard">
            {error}
          </p>
        )}

        {/* Create / Join */}
        <section
          id="coderoom-create"
          className="grid scroll-mt-28 grid-cols-1 gap-6 lg:grid-cols-10"
        >
          <form
            onSubmit={handleCreate}
            className="glass-panel group relative overflow-hidden rounded-2xl border border-primary/25 p-6 md:p-8 lg:col-span-6"
          >
            <div className="pointer-events-none absolute top-0 right-0 p-6 opacity-[0.08] transition-opacity group-hover:opacity-20">
              <span className="material-symbols-outlined text-[120px]">
                rocket_launch
              </span>
            </div>
            <div className="relative z-10 flex h-full flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">rocket_launch</span>
                </div>
                <div>
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                    Start a New Session
                  </h2>
                  <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                    Launch a fresh workspace with shared editor and whiteboard.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-3 font-label-md text-[11px] tracking-[0.18em] text-on-surface-variant uppercase">
                  Select language
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {featuredLangs.map((l) => {
                    const active = language === l.slug;
                    return (
                      <button
                        key={l.slug}
                        type="button"
                        onClick={() => {
                          setLanguage(l.slug);
                          setPreferredLanguage(l.slug);
                        }}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 font-label-md text-label-md transition-all active:scale-95 ${
                          active
                            ? "border-primary bg-primary-container/20 text-primary shadow-[0_0_12px_rgba(221,183,255,0.12)]"
                            : "border-outline-variant/40 bg-surface-container-highest/60 text-on-surface hover:border-primary/50"
                        }`}
                      >
                        <span aria-hidden>{LANG_ICONS[l.slug] ?? "⌘"}</span>
                        {l.name}
                      </button>
                    );
                  })}
                </div>
                {languages.length > featuredLangs.length && (
                  <select
                    value={
                      featuredLangs.some((l) => l.slug === language)
                        ? ""
                        : language
                    }
                    onChange={(e) => {
                      if (!e.target.value) return;
                      setLanguage(e.target.value);
                      setPreferredLanguage(e.target.value);
                    }}
                    className="mt-3 w-full max-w-xs rounded-lg border border-outline-variant/40 bg-surface-container-high px-3 py-2 font-body-md text-sm text-on-surface"
                  >
                    <option value="">More languages…</option>
                    {languages
                      .filter((l) => !featuredLangs.some((f) => f.slug === l.slug))
                      .map((l) => (
                        <option key={l.slug} value={l.slug}>
                          {l.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div>
                <label className="mb-2 block font-label-md text-[11px] tracking-[0.18em] text-on-surface-variant uppercase">
                  Note from host{" "}
                  <span className="normal-case tracking-normal opacity-60">
                    (optional)
                  </span>
                </label>
                <input
                  value={hostNote}
                  onChange={(e) => setHostNote(e.target.value.slice(0, 280))}
                  maxLength={280}
                  placeholder="e.g. Pairing on graphs — jump in"
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface placeholder-on-surface-variant/45 outline-none transition-colors focus:border-primary"
                  type="text"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-auto w-full rounded-xl bg-primary py-4 font-label-md text-label-md font-bold text-on-primary shadow-[0_0_28px_rgba(221,183,255,0.22)] transition-all hover:bg-primary-fixed-dim disabled:opacity-50"
              >
                {busy ? "Launching…" : "Launch CodeRoom"}
              </button>
            </div>
          </form>

          <form
            onSubmit={handleJoin}
            className="glass-panel flex flex-col justify-between rounded-2xl border border-outline-variant/30 p-6 md:p-8 lg:col-span-4"
          >
            <div>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Join Workspace
              </h2>
              <p className="mt-2 mb-8 font-body-md text-body-md text-on-surface-variant">
                Enter a room code shared by your teammate to jump right in.
              </p>
              <div className="relative">
                <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant">
                  key
                </span>
                <input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-4 pr-4 pl-12 font-code-sm text-code-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/40"
                  placeholder="Room code"
                  type="text"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-8 w-full rounded-xl border border-primary py-4 font-label-md text-label-md font-bold text-primary transition-all hover:bg-primary/10 disabled:opacity-50"
            >
              Join Workspace
            </button>
          </form>
        </section>

        {/* Feature grid */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {FEATURE_CARDS.map((card) => (
            <article
              key={card.title}
              className="glass-panel group rounded-xl border border-outline-variant/30 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_12px_40px_-18px_rgba(183,109,255,0.35)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest text-primary transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
              <h3 className="mb-2 font-label-md text-label-md font-bold text-on-surface">
                {card.title}
              </h3>
              <p className="font-label-md text-[13px] leading-5 text-on-surface-variant">
                {card.body}
              </p>
            </article>
          ))}
        </section>

        {/* What is CodeRoom */}
        <section className="glass-panel overflow-hidden rounded-2xl border border-outline-variant/30 bg-gradient-to-br from-surface-container-low to-surface-container-lowest">
          <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-5 md:p-8">
            <div className="md:col-span-2">
              <div className="relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container p-4">
                <div className="mb-3 flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-hard/70" />
                  <span className="h-2 w-2 rounded-full bg-medium/70" />
                  <span className="h-2 w-2 rounded-full bg-easy/70" />
                </div>
                <div className="space-y-2 font-code-sm text-[11px] text-on-surface-variant">
                  <p>
                    <span className="text-secondary">workspace</span> · freeform
                  </p>
                  <p>
                    <span className="text-primary">≠</span> problem-bound collab
                  </p>
                  <p>pair · teach · interview · prototype</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-3">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                What is CodeRoom?
              </h2>
              <p className="mt-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                CodeRoom is an independent collaborative coding workspace. Unlike
                Problem Collaboration, it is not tied to a coding problem — a blank
                slate for pairing, teaching, and interviews.
              </p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  "Practice DSA together",
                  "Prepare interviews",
                  "Teach juniors",
                  "Debug projects",
                  "Brainstorm algorithms",
                  "Pair programming",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 font-label-md text-[13px] text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">
                      check_circle
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 font-body-md text-sm text-on-surface-variant">
                Need a problem-linked session? Use{" "}
                <Link
                  to="/problems"
                  className="text-secondary underline decoration-secondary/30 underline-offset-2 hover:text-secondary-fixed"
                >
                  Invite Friends on a problem page
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Your rooms */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Your Rooms
            </h2>
            {user && (
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    search
                  </span>
                  <input
                    value={roomQuery}
                    onChange={(e) => setRoomQuery(e.target.value)}
                    placeholder="Search rooms…"
                    className="min-w-[220px] rounded-lg border border-outline-variant/40 bg-surface-container-high py-2 pr-4 pl-10 font-body-md text-sm text-on-surface outline-none focus:border-primary"
                    type="search"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                  {filterChips.map((chip) => {
                    const active = roomFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setRoomFilter(chip.id)}
                        className={`shrink-0 rounded-full px-4 py-1.5 font-label-md text-label-md transition-colors ${
                          active
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {!user && (
            <div className="glass-panel rounded-2xl border border-outline-variant/25 px-6 py-10 text-center">
              <p className="font-body-md text-on-surface-variant">
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>{" "}
                to see and manage your CodeRooms.
              </p>
            </div>
          )}

          {user && myRoomsLoading && (
            <p className="text-sm text-on-surface-variant">Loading rooms…</p>
          )}

          {user && !myRoomsLoading && myRooms.length === 0 && (
            <div className="glass-panel flex flex-col items-center gap-5 rounded-2xl border border-dashed border-outline-variant/40 px-6 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <span className="material-symbols-outlined text-[36px]">
                  groups
                </span>
              </div>
              <div>
                <h3 className="font-headline-lg-mobile text-xl text-on-surface">
                  No CodeRooms yet
                </h3>
                <p className="mt-2 max-w-md font-body-md text-sm text-on-surface-variant">
                  Create your first collaborative workspace and invite friends to
                  code, draw, and debug live.
                </p>
              </div>
              <button
                type="button"
                onClick={scrollToCreate}
                className="rounded-xl bg-primary px-6 py-3 font-label-md text-label-md font-semibold text-on-primary"
              >
                Create Room
              </button>
            </div>
          )}

          {user && !myRoomsLoading && myRooms.length > 0 && filteredRooms.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              No rooms match this filter.
            </p>
          )}

          {user && filteredRooms.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.map((room) => {
                const isHost =
                  room.role === "HOST" ||
                  (user != null && room.hostUserId === user.id);
                const hostLabel = isHost
                  ? "You"
                  : room.hostName ||
                    room.hostUsername ||
                    (room.hostUserId != null
                      ? `User ${room.hostUserId}`
                      : "Host");
                const members = room.memberCount ?? 0;
                const online = room.onlineCount ?? 0;
                const title = roomTitle(room, isHost);
                const when = formatRelativeTime(
                  room.lastSeenAt || room.updatedAt || room.createdAt
                );
                const created = formatRelativeTime(room.createdAt);
                const langIcon =
                  LANG_ICONS[room.language.toLowerCase()] ?? "⌘";

                return (
                  <article
                    key={room.id}
                    className="glass-panel group flex flex-col gap-4 rounded-2xl border border-outline-variant/30 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_48px_-24px_rgba(183,109,255,0.4)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
                          {langIcon}
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate font-body-md text-body-md font-bold text-on-surface transition-colors group-hover:text-primary">
                            {title}
                          </h4>
                          <p className="font-label-md text-[12px] text-on-surface-variant">
                            Host: {hostLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          title={
                            favoriteIds.has(room.id)
                              ? "Remove favorite"
                              : "Favorite"
                          }
                          onClick={() => toggleFavorite(room.id)}
                          className="rounded-md p-1 text-on-surface-variant transition-colors hover:text-primary"
                        >
                          <span
                            className="material-symbols-outlined text-[20px]"
                            style={{
                              fontVariationSettings: favoriteIds.has(room.id)
                                ? "'FILL' 1"
                                : "'FILL' 0",
                            }}
                          >
                            star
                          </span>
                        </button>
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-label-md text-[10px] tracking-wide uppercase ${
                            isHost
                              ? "bg-primary/15 text-primary"
                              : "bg-surface-container-highest text-on-surface-variant"
                          }`}
                        >
                          {room.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {Array.from({
                          length: Math.min(Math.max(members, 1), 3),
                        }).map((_, i) => (
                          <div
                            key={i}
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-surface-container-high text-[10px] font-semibold text-on-surface"
                          >
                            {i === 0 ? initialOf(hostLabel) : String(i + 1)}
                          </div>
                        ))}
                        {members > 3 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-primary-container text-[10px] font-bold text-on-primary-container">
                            +{members - 3}
                          </div>
                        )}
                      </div>
                      <span className="font-label-md text-[12px] text-on-surface-variant">
                        {members} {members === 1 ? "member" : "members"}
                        {online > 0 ? ` · ${online} online` : ""}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 font-label-md text-[11px] text-outline">
                      <span className="capitalize">{room.language}</span>
                      <span>·</span>
                      <span>Created {created}</span>
                      <span>·</span>
                      <span>Active {when}</span>
                    </div>

                    {room.hostNote ? (
                      <p className="line-clamp-2 font-body-md text-[13px] text-on-surface/75">
                        {room.hostNote}
                      </p>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className="font-label-md text-[11px] text-on-surface-variant/70">
                        {room.status === "ACTIVE" ? "Active" : room.status}
                      </span>
                      <Link
                        to={`/coderoom/${room.id}?code=${encodeURIComponent(room.inviteToken)}`}
                        className="rounded-lg bg-surface-container-highest px-4 py-2 font-label-md text-label-md font-bold text-on-surface transition-all hover:bg-primary hover:text-on-primary"
                      >
                        Continue
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-auto border-t border-outline-variant/20 py-8">
        <div className="mx-auto flex w-full max-w-container-max flex-col items-center justify-between gap-4 px-margin-desktop md:flex-row">
          <span className="font-label-md text-label-md text-on-surface-variant/60">
            © {new Date().getFullYear()} CodeT
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
