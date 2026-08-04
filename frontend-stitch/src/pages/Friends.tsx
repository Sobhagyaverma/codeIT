import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import {
  describeApiError,
  getFriends,
  removeFriend,
  searchFriend,
  sendFriendRequest,
  type FriendUserCard,
} from "../lib/api";

type Tab = "friends" | "incoming" | "outgoing";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "friends", label: "All Friends" },
  { key: "incoming", label: "Incoming" },
  { key: "outgoing", label: "Outgoing" },
];

const EMPTY_COPY: Record<Tab, { icon: string; title: string; hint: string }> = {
  friends: {
    icon: "group_add",
    title: "No friends yet",
    hint: "Search someone's unique User ID above to send your first request.",
  },
  incoming: {
    icon: "inbox",
    title: "No incoming requests",
    hint: "When someone adds you, their request lands here for approval.",
  },
  outgoing: {
    icon: "outgoing_mail",
    title: "No pending invites",
    hint: "Requests you send will stay here until they respond.",
  },
};

function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full border border-outline-variant/40 bg-gradient-to-br from-primary/30 to-secondary-container/40 font-headline-lg-mobile font-bold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function Friends() {
  const { user } = useAuth();
  const {
    friendsVersion,
    acceptFriendRequest,
    rejectFriendRequest,
    notifyFriendsChanged,
  } = useNotifications();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FriendUserCard[]>([]);
  const [incoming, setIncoming] = useState<FriendUserCard[]>([]);
  const [outgoing, setOutgoing] = useState<FriendUserCard[]>([]);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof searchFriend>> | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getFriends();
      setFriends(data.friends || []);
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
    } catch (err) {
      setError(describeApiError(err, "Could not load friends."));
    } finally {
      setLoading(false);
    }
  };

  // Refetches on mount and whenever the friend graph changes (locally or via WebSocket).
  useEffect(() => {
    if (user) void reload();
  }, [user, friendsVersion]);

  if (!user) return <Navigate to="/login" replace />;

  const onSearch = async () => {
    setError("");
    setMessage("");
    setPreview(null);
    if (!query.trim()) {
      setError("Enter a unique User ID.");
      return;
    }
    setSearching(true);
    try {
      setPreview(await searchFriend(query.trim()));
    } catch (err) {
      setError(describeApiError(err, "User not found."));
    } finally {
      setSearching(false);
    }
  };

  const onSend = async () => {
    if (!preview) return;
    try {
      await sendFriendRequest(preview.unique_user_id);
      setMessage(`Friend request sent to ${preview.name}.`);
      setPreview(null);
      setQuery("");
      await reload();
    } catch (err) {
      setError(describeApiError(err, "Could not send request."));
    }
  };

  const onRespond = async (
    card: FriendUserCard,
    action: "ACCEPT" | "REJECT"
  ) => {
    if (card.request_id == null) return;
    setError("");
    const ok =
      action === "ACCEPT"
        ? await acceptFriendRequest(card.request_id, card.name)
        : await rejectFriendRequest(card.request_id, card.name);
    if (ok) await reload();
  };

  const onRemove = async (userId: number) => {
    try {
      await removeFriend(userId);
      notifyFriendsChanged();
      await reload();
    } catch (err) {
      setError(describeApiError(err, "Remove failed."));
    }
  };

  const counts: Record<Tab, number> = {
    friends: friends.length,
    incoming: incoming.length,
    outgoing: outgoing.length,
  };
  const list = tab === "friends" ? friends : tab === "incoming" ? incoming : outgoing;
  const empty = EMPTY_COPY[tab];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface text-on-surface">
      <AppNav activeHint="/friends" />

      <div
        className="ambient-orb left-1/2 top-[-10rem] h-[34rem] w-[42rem] -translate-x-1/2 bg-primary/10"
        aria-hidden="true"
      />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-margin-mobile pb-20 pt-24 md:px-margin-desktop md:pt-28">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-label-md text-[11px] uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-[14px]">hub</span>
              Your Network
            </span>
            <h1 className="font-headline-xl text-headline-lg text-primary md:text-headline-xl [text-shadow:0_0_24px_rgba(221,183,255,0.25)]">
              Friends Network
            </h1>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              Search by unique User ID, accept requests, and pull friends into a
              Quick Contest.
            </p>
          </div>
          <Link
            to="/competitions/quick"
            className="btn-glow flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-md text-label-md text-on-primary shadow-[0_0_15px_rgba(221,183,255,0.25)] transition-colors hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">swords</span>
            New Quick Contest
          </Link>
        </header>

        <div className="mb-6 grid grid-cols-3 gap-3">
          {TABS.map((t) => (
            <div
              key={t.key}
              className="glass-panel rounded-xl px-4 py-3"
            >
              <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                {counts[t.key]}
              </div>
              <div className="font-label-md text-[12px] uppercase tracking-wider text-on-surface-variant">
                {t.label}
              </div>
            </div>
          ))}
        </div>

        <div className="group relative mb-4">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant transition-colors group-focus-within:text-primary">
            search
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void onSearch()}
            placeholder="Search friends using unique User ID..."
            aria-label="Search by unique User ID"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-high py-4 pl-12 pr-32 font-body-md text-on-surface shadow-inner transition-all placeholder:text-outline-variant focus:border-primary focus:shadow-[0_0_15px_rgba(221,183,255,0.15)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void onSearch()}
            disabled={searching}
            className="picker absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary-container px-4 py-2 font-label-md text-label-md text-on-primary-container hover:brightness-110 disabled:opacity-60"
          >
            {searching ? "…" : "Search"}
          </button>
        </div>

        {preview && (
          <div className="glass-panel mb-4 flex flex-wrap items-center gap-4 rounded-xl border-l-4 border-l-primary p-4">
            <Avatar name={preview.name} size={48} />
            <div className="min-w-0 flex-1">
              <div className="font-label-md text-label-md font-bold text-on-surface">
                {preview.name}
              </div>
              <div className="font-code-sm text-code-sm text-on-surface-variant">
                @{preview.unique_user_id}
              </div>
              <div className="font-label-md text-[12px] text-outline">
                {preview.solved_count ?? 0} problems solved
              </div>
            </div>
            {preview.isSelf ? (
              <span className="rounded-full bg-surface-container-high px-3 py-1.5 font-label-md text-[13px] text-on-surface-variant">
                That&apos;s you
              </span>
            ) : preview.isFriend ? (
              <span className="rounded-full bg-primary/10 px-3 py-1.5 font-label-md text-[13px] text-primary">
                Already friends
              </span>
            ) : preview.outgoingPending ? (
              <span className="rounded-full bg-surface-container-high px-3 py-1.5 font-label-md text-[13px] text-on-surface-variant">
                Request pending
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void onSend()}
                className="picker flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>
                Send request
              </button>
            )}
          </div>
        )}

        {(error || message) && (
          <p
            role="status"
            className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 font-body-md text-sm ${
              error
                ? "border-error/30 bg-error/10 text-error"
                : "border-primary/30 bg-primary/10 text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {error ? "error" : "check_circle"}
            </span>
            {error || message}
          </p>
        )}

        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-outline-variant/30">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 font-label-md text-label-md transition-colors ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t.label}
              <span
                className={`rounded px-1.5 py-0.5 font-code-sm text-[11px] ${
                  tab === t.key
                    ? "bg-primary/15 text-primary"
                    : "bg-surface-container-highest text-on-surface-variant"
                }`}
              >
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-xl border border-outline-variant/20 bg-surface-container-low"
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/30 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container">
              <span className="material-symbols-outlined text-[32px] text-primary">
                {empty.icon}
              </span>
            </div>
            <h4 className="mb-2 font-headline-lg-mobile text-[20px] font-bold text-on-surface">
              {empty.title}
            </h4>
            <p className="max-w-sm font-body-md text-body-md text-on-surface-variant">
              {empty.hint}
            </p>
          </div>
        ) : (
          <div className="grid auto-rows-max grid-cols-1 gap-4 md:grid-cols-2">
            {list.map((card) => (
              <article
                key={`${tab}-${card.user_id}-${card.request_id ?? 0}`}
                className="glass-panel glow-hover group relative flex flex-col gap-4 overflow-hidden rounded-xl p-5 transition-all"
              >
                <span className="absolute left-0 top-0 h-full w-1 bg-primary/70" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar name={card.name} />
                    <div className="min-w-0">
                      <h3 className="truncate font-label-md text-label-md font-bold text-on-surface transition-colors group-hover:text-primary">
                        {card.name}
                      </h3>
                      <span className="font-code-sm text-code-sm text-on-surface-variant">
                        @{card.unique_user_id}
                      </span>
                    </div>
                  </div>
                  {tab === "friends" && (
                    <button
                      type="button"
                      title="Remove friend"
                      aria-label={`Remove ${card.name}`}
                      onClick={() => void onRemove(card.user_id)}
                      className="p-1 text-outline-variant transition-colors hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        person_remove
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1 rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
                  <span className="flex items-center gap-1.5 font-code-sm text-code-sm text-primary">
                    <span className="material-symbols-outlined text-[14px]">
                      emoji_events
                    </span>
                    {card.solved_count ?? 0} problems solved
                  </span>
                  <span className="font-label-md text-[12px] text-on-surface-variant/70">
                    {tab === "friends"
                      ? card.friends_since
                        ? `Friends since ${new Date(card.friends_since).toLocaleDateString()}`
                        : "Connected"
                      : tab === "incoming"
                        ? "Wants to connect with you"
                        : "Waiting for their response"}
                  </span>
                </div>

                <div className="mt-auto flex gap-2 pt-1">
                  {tab === "friends" && (
                    <Link
                      to={`/competitions/quick?invite=${card.user_id}`}
                      className="picker flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 font-label-md text-label-md text-on-primary hover:bg-primary-container hover:shadow-[0_0_10px_rgba(221,183,255,0.3)]"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        swords
                      </span>
                      Contest
                    </Link>
                  )}
                  {tab === "incoming" && card.request_id != null && (
                    <>
                      <button
                        type="button"
                        onClick={() => void onRespond(card, "ACCEPT")}
                        className="picker flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 font-label-md text-label-md text-on-primary hover:bg-primary-container"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          check
                        </span>
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void onRespond(card, "REJECT")}
                        className="picker flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-high py-2 font-label-md text-label-md text-on-surface-variant hover:bg-error/10 hover:text-error"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          close
                        </span>
                        Reject
                      </button>
                    </>
                  )}
                  {tab === "outgoing" && (
                    <span className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-high py-2 font-label-md text-label-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">
                        hourglass_top
                      </span>
                      Pending
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
