import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { describeApiError, joinQuickContest, type AppNotification } from "../lib/api";

type Meta = { icon: string; tone: string; title: string };

const META: Record<string, Meta> = {
  FRIEND_REQUEST: {
    icon: "person_add",
    tone: "text-secondary",
    title: "Friend Request",
  },
  FRIEND_ACCEPTED: {
    icon: "handshake",
    tone: "text-primary",
    title: "Request Accepted",
  },
  QUICK_CONTEST_INVITE: {
    icon: "swords",
    tone: "text-tertiary",
    title: "Quick Contest Invitation",
  },
  QUICK_CONTEST_STARTING: {
    icon: "timer",
    tone: "text-primary",
    title: "Contest Starting",
  },
  QUICK_CONTEST_ENDED: {
    icon: "flag",
    tone: "text-on-surface-variant",
    title: "Contest Ended",
  },
  CONTACT_MESSAGE: {
    icon: "mark_email_read",
    tone: "text-primary",
    title: "Message Received",
  },
};

const FALLBACK: Meta = {
  icon: "notifications",
  tone: "text-on-surface-variant",
  title: "Notification",
};

const metaFor = (type: string): Meta => META[type] ?? FALLBACK;

const str = (value: unknown, fallback = "") =>
  typeof value === "string" && value ? value : fallback;

const relativeTime = (iso: string) => {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const dayBucket = (n: AppNotification): string => {
  if (!n.read_at) return "Unread";
  const ts = new Date(n.created_at).getTime();
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  if (ts >= startOfToday) return "Today";
  if (ts >= startOfToday - 86_400_000) return "Yesterday";
  return "Earlier";
};

const GROUP_ORDER = ["Unread", "Today", "Yesterday", "Earlier"];

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full border border-outline-variant/40 bg-gradient-to-br from-primary/30 to-secondary-container/40 font-bold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function Inbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    items,
    unreadCount,
    loading,
    connected,
    markRead,
    markAllRead,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useNotifications();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const groups = useMemo(() => {
    const map = new Map<string, AppNotification[]>();
    for (const n of items) {
      const key = dayBucket(n);
      const bucket = map.get(key);
      if (bucket) bucket.push(n);
      else map.set(key, [n]);
    }
    return GROUP_ORDER.filter((k) => map.has(k)).map((k) => ({
      label: k,
      items: map.get(k)!,
    }));
  }, [items]);

  if (!user) return <Navigate to="/login" replace />;

  const onOpen = (n: AppNotification) => {
    if (!n.read_at) void markRead(n.id);
    if (n.type === "FRIEND_REQUEST" || n.type === "FRIEND_ACCEPTED") {
      navigate("/friends");
      return;
    }
    const contestId = Number(n.payload?.contestId);
    if (Number.isFinite(contestId) && contestId > 0) {
      navigate(`/competitions/quick/${contestId}`);
    }
  };

  const onRespond = async (
    n: AppNotification,
    action: "ACCEPT" | "REJECT"
  ) => {
    const requestId = Number(n.payload?.requestId);
    if (!Number.isFinite(requestId) || requestId <= 0) {
      setError("This request is no longer available.");
      return;
    }
    setBusyId(n.id);
    setError("");
    const name = str(n.payload?.fromName, "them");
    if (action === "ACCEPT") await acceptFriendRequest(requestId, name);
    else await rejectFriendRequest(requestId, name);
    setBusyId(null);
  };

  const onJoinContest = async (n: AppNotification) => {
    const contestId = Number(n.payload?.contestId);
    if (!Number.isFinite(contestId) || contestId <= 0) return;
    setBusyId(n.id);
    try {
      await joinQuickContest(contestId);
      void markRead(n.id);
      navigate(`/competitions/quick/${contestId}`);
    } catch (err) {
      setError(describeApiError(err, "Could not join the lobby."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface text-on-surface">
      <AppNav />

      <div
        className="ambient-orb left-1/2 top-[-10rem] h-[26rem] w-[46rem] -translate-x-1/2 bg-primary-container/10"
        aria-hidden="true"
      />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-margin-mobile pb-24 pt-24 md:px-margin-desktop md:pt-28">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant/10 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-headline-xl text-headline-lg tracking-tight text-primary md:text-headline-xl [text-shadow:0_0_24px_rgba(221,183,255,0.25)]">
                Inbox
              </h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary px-2.5 py-1 font-code-sm text-[11px] font-bold text-on-primary shadow-[0_0_12px_rgba(221,183,255,0.5)]">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
              Review your latest alerts, invites, and system updates.
              <span
                title={connected ? "Live updates on" : "Reconnecting…"}
                className={`inline-flex items-center gap-1 font-label-md text-[11px] uppercase tracking-widest ${
                  connected ? "text-primary" : "text-outline"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    connected ? "animate-pulse bg-primary" : "bg-outline"
                  }`}
                />
                {connected ? "Live" : "Offline"}
              </span>
            </p>
          </div>
          <button
            type="button"
            disabled={unreadCount === 0}
            onClick={() => void markAllRead()}
            className="group flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-all hover:bg-surface-variant hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            <span className="hidden sm:inline">Mark all as read</span>
          </button>
        </header>

        {error && (
          <p
            role="alert"
            className="mb-6 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 font-body-md text-sm text-error"
          >
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </p>
        )}

        {loading && items.length === 0 ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-outline-variant/20 bg-surface-container-low"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-t border-dashed border-outline-variant/10 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container">
              <span className="material-symbols-outlined text-[32px] text-primary">
                check_circle
              </span>
            </div>
            <h4 className="mb-2 font-headline-lg-mobile text-[20px] font-bold text-on-surface">
              All caught up
            </h4>
            <p className="max-w-sm font-body-md text-body-md text-on-surface-variant">
              You&apos;ve reviewed all your recent notifications. Friend requests
              and Quick Contest invites will show up here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map((group) => {
              const isUnread = group.label === "Unread";
              return (
                <section key={group.label}>
                  <div className="mb-4 flex items-center gap-4">
                    <h3
                      className={`flex items-center gap-2 font-label-md text-label-md uppercase tracking-widest ${
                        isUnread ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {isUnread && (
                        <span className="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_8px_rgba(221,183,255,0.8)]" />
                      )}
                      {group.label}
                    </h3>
                    <div className="rule-fade" />
                  </div>

                  <div className="flex flex-col gap-3">
                    {group.items.map((n) =>
                      n.type === "FRIEND_REQUEST" ? (
                        <FriendRequestCard
                          key={n.id}
                          notification={n}
                          busy={busyId === n.id}
                          onAccept={() => void onRespond(n, "ACCEPT")}
                          onReject={() => void onRespond(n, "REJECT")}
                        />
                      ) : (
                        <GenericCard
                          key={n.id}
                          notification={n}
                          busy={busyId === n.id}
                          onOpen={() => onOpen(n)}
                          onJoinContest={() => void onJoinContest(n)}
                          onDismiss={() => void markRead(n.id)}
                        />
                      )
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function FriendRequestCard({
  notification,
  busy,
  onAccept,
  onReject,
}: {
  notification: AppNotification;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const payload = notification.payload || {};
  const name = str(payload.fromName, "Someone");
  const uniqueUserId = str(payload.fromUniqueUserId);
  const resolved = Boolean(notification.read_at);

  return (
    <article
      className={`glass-panel group relative flex flex-col gap-4 overflow-hidden rounded-xl p-4 transition-all md:p-5 ${
        resolved
          ? "border border-outline-variant/20 opacity-80 hover:opacity-100"
          : "border-l-4 border-l-primary"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <Avatar name={name} />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container">
            <span className="material-symbols-outlined text-[12px] text-tertiary">
              person_add
            </span>
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="min-w-0">
              <h4 className="truncate font-label-md text-label-md font-bold text-on-surface">
                {name}
              </h4>
              {uniqueUserId && (
                <span className="font-code-sm text-code-sm text-on-surface-variant">
                  @{uniqueUserId}
                </span>
              )}
            </div>
            <span className="whitespace-nowrap font-code-sm text-[12px] text-on-surface-variant/60">
              {relativeTime(notification.created_at)}
            </span>
          </div>

          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            <strong className="font-medium text-on-surface">{name}</strong> wants
            to be your friend.
          </p>
          <p className="mt-1 font-label-md text-[12px] text-outline">
            0 mutual friends
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onAccept}
              className="picker flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 font-label-md text-[13px] text-on-primary shadow-[0_0_12px_rgba(221,183,255,0.25)] hover:bg-primary-container disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="picker flex items-center gap-1.5 rounded-md border border-error/30 bg-error/10 px-4 py-1.5 font-label-md text-[13px] text-error hover:bg-error/20 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Reject
            </button>
            {uniqueUserId && (
              <Link
                to={`/users/${uniqueUserId}`}
                className="picker flex items-center gap-1.5 rounded-md border border-outline-variant/30 bg-surface-container-high px-4 py-1.5 font-label-md text-[13px] text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">
                  account_circle
                </span>
                View Profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function GenericCard({
  notification,
  busy,
  onOpen,
  onJoinContest,
  onDismiss,
}: {
  notification: AppNotification;
  busy: boolean;
  onOpen: () => void;
  onJoinContest: () => void;
  onDismiss: () => void;
}) {
  const meta = metaFor(notification.type);
  const payload = notification.payload || {};
  const message = str(
    payload.message,
    notification.type.replaceAll("_", " ").toLowerCase()
  );
  const uniqueUserId = str(payload.fromUniqueUserId);
  const read = Boolean(notification.read_at);

  return (
    <article
      className={`glass-panel group relative flex flex-col gap-4 overflow-hidden rounded-xl p-4 transition-all sm:flex-row sm:items-start md:p-5 ${
        read
          ? "border border-outline-variant/20 opacity-80 hover:opacity-100"
          : "border-l-4 border-l-primary"
      }`}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-outline-variant/30 bg-surface-container transition-colors group-hover:border-primary/50">
        <span className={`material-symbols-outlined ${meta.tone}`}>
          {meta.icon}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <button type="button" onClick={onOpen} className="w-full text-left">
          <div className="mb-1 flex items-start justify-between gap-3">
            <h4
              className={`font-label-md text-label-md text-on-surface ${
                read ? "font-medium" : "font-bold"
              }`}
            >
              {meta.title}
            </h4>
            <span className="whitespace-nowrap font-code-sm text-[12px] text-on-surface-variant/60">
              {relativeTime(notification.created_at)}
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {message}
          </p>
        </button>

        <div className="mt-3 flex flex-wrap gap-2">
          {notification.type === "QUICK_CONTEST_INVITE" && (
            <button
              type="button"
              disabled={busy}
              onClick={onJoinContest}
              className="picker flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-4 py-1.5 font-label-md text-[13px] text-primary hover:bg-primary/20 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              Join lobby
            </button>
          )}
          {notification.type === "FRIEND_ACCEPTED" && uniqueUserId && (
            <Link
              to={`/users/${uniqueUserId}`}
              className="picker flex items-center gap-1.5 rounded-md border border-outline-variant/30 bg-surface-container-high px-4 py-1.5 font-label-md text-[13px] text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">
                account_circle
              </span>
              View Profile
            </Link>
          )}
          {(notification.type === "QUICK_CONTEST_STARTING" ||
            notification.type === "QUICK_CONTEST_ENDED") && (
            <button
              type="button"
              onClick={onOpen}
              className="picker flex items-center gap-1.5 rounded-md border border-outline-variant/30 bg-surface-container-high px-4 py-1.5 font-label-md text-[13px] text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">
                open_in_new
              </span>
              View contest
            </button>
          )}
          {!read && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-md px-3 py-1.5 font-label-md text-[13px] text-on-surface-variant transition-colors hover:bg-surface-variant/50 hover:text-on-surface"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
