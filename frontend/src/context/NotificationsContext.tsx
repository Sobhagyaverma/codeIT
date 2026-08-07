import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ApiError,
  describeApiError,
  getNotifications,
  joinQuickContest,
  markAllNotificationsRead,
  markNotificationRead,
  respondFriendRequest,
  type AppNotification,
} from "../lib/api";
import { disconnectWs, subscribeTopic, userNotificationsTopic } from "../lib/ws";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

type WsEvent =
  | { event: "notification:created"; notification: AppNotification; unreadCount: number }
  | { event: "notification:unread"; unreadCount: number }
  | { event: "friends:changed"; detail?: Record<string, unknown> }
  | { event: "friend-request:resolved"; requestId: number; status: string };

type RespondOptions = {
  /** Suppress the standalone success toast (used when a toast morphs in place instead). */
  silent?: boolean;
};

type NotificationsState = {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  connected: boolean;
  /** Increments whenever this user's friend graph changes, locally or remotely. */
  friendsVersion: number;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  acceptFriendRequest: (
    requestId: number,
    senderName: string,
    options?: RespondOptions
  ) => Promise<boolean>;
  rejectFriendRequest: (
    requestId: number,
    senderName: string,
    options?: RespondOptions
  ) => Promise<boolean>;
  notifyFriendsChanged: () => void;
};

const NotificationsContext = createContext<NotificationsState | undefined>(
  undefined
);

const str = (value: unknown, fallback = "") =>
  typeof value === "string" && value ? value : fallback;

const num = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, updateToast, dismissToastByKey } = useToast();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [friendsVersion, setFriendsVersion] = useState(0);

  // Kept in refs so the STOMP subscription can stay mounted for the session.
  const seenIds = useRef(new Set<number>());
  const handlerRef = useRef<(event: WsEvent) => void>(() => {});
  const itemsRef = useRef<AppNotification[]>([]);
  itemsRef.current = items;

  const notifyFriendsChanged = useCallback(
    () => setFriendsVersion((v) => v + 1),
    []
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getNotifications(50);
      const list = data.items || [];
      setItems(list);
      setUnreadCount(data.unreadCount || 0);
      list.forEach((n) => seenIds.current.add(n.id));
    } catch {
      /* transient; the next event or visit retries */
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markRead = useCallback(async (id: number) => {
    setItems((list) =>
      list.map((n) =>
        n.id === id && !n.read_at
          ? { ...n, read_at: new Date().toISOString() }
          : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      const res = await markNotificationRead(id);
      setUnreadCount(res.unreadCount);
    } catch {
      /* optimistic update stands; server count syncs on next refresh */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((list) => list.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      /* ignore */
    }
  }, []);

  /** Drop friend-request cards for this request from the inbox (and unread count). */
  const removeFriendRequestCards = useCallback((requestId: number) => {
    const removedUnread = itemsRef.current.filter(
      (n) =>
        n.type === "FRIEND_REQUEST" &&
        Number(n.payload?.requestId) === requestId &&
        !n.read_at
    ).length;
    setItems((list) =>
      list.filter(
        (n) =>
          !(
            n.type === "FRIEND_REQUEST" &&
            Number(n.payload?.requestId) === requestId
          )
      )
    );
    if (removedUnread > 0) {
      setUnreadCount((c) => Math.max(0, c - removedUnread));
    }
  }, []);

  const respond = useCallback(
    async (
      requestId: number,
      senderName: string,
      action: "ACCEPT" | "REJECT",
      options?: RespondOptions
    ) => {
      try {
        const result = await respondFriendRequest(requestId, action);
        const name = result.name || senderName || "them";
        removeFriendRequestCards(requestId);
        dismissToastByKey(`friend-request-${requestId}`);
        notifyFriendsChanged();
        if (!options?.silent && !result.alreadyHandled) {
          showToast(
            action === "ACCEPT"
              ? {
                  title: "Friend added",
                  message: `You are now friends with ${name}.`,
                  icon: "check_circle",
                  tone: "success",
                  duration: 4000,
                }
              : {
                  title: "Request declined",
                  message: `Friend request from ${name} was rejected.`,
                  icon: "person_remove",
                  duration: 4000,
                }
          );
        }
        return true;
      } catch (err) {
        // Stale card: backend already answered this request — still clear the UI.
        if (
          err instanceof ApiError &&
          (err.message.includes("already handled") || err.status === 409)
        ) {
          removeFriendRequestCards(requestId);
          dismissToastByKey(`friend-request-${requestId}`);
          notifyFriendsChanged();
          return true;
        }
        showToast({
          title: action === "ACCEPT" ? "Could not accept" : "Could not reject",
          message: describeApiError(err, "Please try again."),
          icon: "error",
          tone: "error",
          duration: 6000,
        });
        return false;
      }
    },
    [
      dismissToastByKey,
      notifyFriendsChanged,
      removeFriendRequestCards,
      showToast,
    ]
  );

  const acceptFriendRequest = useCallback(
    (requestId: number, senderName: string, options?: RespondOptions) =>
      respond(requestId, senderName, "ACCEPT", options),
    [respond]
  );

  const rejectFriendRequest = useCallback(
    (requestId: number, senderName: string, options?: RespondOptions) =>
      respond(requestId, senderName, "REJECT", options),
    [respond]
  );

  /** Turn an incoming notification into a bottom-right toast. */
  const toastFor = useCallback(
    (n: AppNotification) => {
      const payload = n.payload || {};
      const message = str(payload.message);

      if (n.type === "FRIEND_REQUEST") {
        const requestId = num(payload.requestId);
        const name = str(payload.fromName, "Someone");
        if (!requestId) return;

        let toastId = 0;
        const morph = (title: string, text: string, icon: string) =>
          updateToast(toastId, {
            title,
            message: text,
            icon,
            avatarName: undefined,
            tone: title === "Friend added" ? "success" : "default",
            actions: [],
            duration: 2400,
          });

        toastId = showToast({
          key: `friend-request-${requestId}`,
          title: "Friend Request",
          message: message || `${name} sent you a friend request.`,
          avatarName: name,
          avatarUrl: str(payload.fromAvatarUrl) || null,
          duration: 6000,
          actions: [
            {
              label: "Accept",
              variant: "primary",
              icon: "check",
              onClick: async () => {
                const ok = await acceptFriendRequest(requestId, name, {
                  silent: true,
                });
                if (!ok) return false;
                morph(
                  "Friend added",
                  `You are now friends with ${name}.`,
                  "check_circle"
                );
                return false;
              },
            },
            {
              label: "Reject",
              variant: "danger",
              icon: "close",
              onClick: async () => {
                const ok = await rejectFriendRequest(requestId, name, {
                  silent: true,
                });
                if (!ok) return false;
                morph("Request declined", `You declined ${name}.`, "person_remove");
                return false;
              },
            },
            {
              label: "View",
              variant: "neutral",
              icon: "open_in_new",
              onClick: () => navigate("/inbox"),
            },
          ],
        });
        return;
      }

      if (n.type === "FRIEND_ACCEPTED") {
        const uniqueUserId = str(payload.fromUniqueUserId);
        const name = str(payload.fromName, "Someone");
        notifyFriendsChanged();
        showToast({
          title: "Friend added",
          message: message || `You are now friends with ${name}.`,
          avatarName: name,
          avatarUrl: str(payload.fromAvatarUrl) || null,
          tone: "success",
          duration: 6000,
          actions: uniqueUserId
            ? [
                {
                  label: "View profile",
                  variant: "neutral",
                  icon: "account_circle",
                  onClick: () => navigate(`/users/${uniqueUserId}`),
                },
              ]
            : [],
        });
        return;
      }

      if (n.type === "QUICK_CONTEST_INVITE") {
        const contestId = num(payload.contestId);
        showToast({
          title: "Quick Contest invite",
          message: message || "You were invited to a Quick Contest.",
          icon: "swords",
          duration: 6000,
          actions: contestId
            ? [
                {
                  label: "Join lobby",
                  variant: "primary",
                  icon: "login",
                  onClick: async () => {
                    try {
                      await joinQuickContest(contestId);
                    } catch {
                      /* already joined is fine — still navigate */
                    }
                    navigate(`/competitions/quick/${contestId}`);
                  },
                },
                {
                  label: "View",
                  variant: "neutral",
                  onClick: () => navigate(`/competitions/quick/${contestId}`),
                },
              ]
            : [],
        });
        return;
      }

      if (n.type === "QUICK_CONTEST_STARTING") {
        const contestId = num(payload.contestId);
        showToast({
          title: "Quick Contest starting",
          message: message || "Quick Contest is starting now.",
          icon: "timer",
          duration: 8000,
          actions: contestId
            ? [
                {
                  label: "Enter live",
                  variant: "primary",
                  icon: "play_arrow",
                  onClick: () =>
                    navigate(`/competitions/quick/${contestId}/live`),
                },
              ]
            : [],
        });
        return;
      }

      const contestId = num(payload.contestId);
      const livePath = contestId
        ? n.type === "QUICK_CONTEST_ENDED"
          ? `/competitions/quick/${contestId}/live`
          : `/competitions/quick/${contestId}/live`
        : "/inbox";
      showToast({
        title: n.type.replaceAll("_", " ").toLowerCase(),
        message: message || "You have a new notification.",
        icon: "notifications",
        duration: 6000,
        actions: [
          {
            label: contestId ? "View contest" : "Open inbox",
            variant: "neutral",
            onClick: () => navigate(livePath),
          },
        ],
      });
    },
    [
      acceptFriendRequest,
      navigate,
      notifyFriendsChanged,
      rejectFriendRequest,
      showToast,
      updateToast,
    ]
  );

  handlerRef.current = (event: WsEvent) => {
    if (event.event === "notification:created") {
      const n = event.notification;
      if (!n || seenIds.current.has(n.id)) return;
      seenIds.current.add(n.id);
      setItems((list) => [n, ...list].slice(0, 50));
      if (typeof event.unreadCount === "number") setUnreadCount(event.unreadCount);
      else setUnreadCount((c) => c + 1);
      toastFor(n);
      return;
    }
    if (event.event === "notification:unread") {
      setUnreadCount(event.unreadCount ?? 0);
      return;
    }
    if (event.event === "friends:changed") {
      notifyFriendsChanged();
      return;
    }
    if (event.event === "friend-request:resolved") {
      removeFriendRequestCards(event.requestId);
      dismissToastByKey(`friend-request-${event.requestId}`);
      notifyFriendsChanged();
    }
  };

  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      setConnected(false);
      seenIds.current.clear();
      disconnectWs();
      return;
    }

    void refresh();
    const unsubscribe = subscribeTopic<WsEvent>(
      userNotificationsTopic(user.id),
      (event) => handlerRef.current(event)
    );
    setConnected(true);

    // Safety net: if the socket ever drops silently, a slow poll keeps the bell honest.
    const poll = window.setInterval(() => void refresh(), 120_000);

    return () => {
      unsubscribe();
      window.clearInterval(poll);
      setConnected(false);
    };
  }, [user, refresh]);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      connected,
      friendsVersion,
      refresh,
      markRead,
      markAllRead,
      acceptFriendRequest,
      rejectFriendRequest,
      notifyFriendsChanged,
    }),
    [
      items,
      unreadCount,
      loading,
      connected,
      friendsVersion,
      refresh,
      markRead,
      markAllRead,
      acceptFriendRequest,
      rejectFriendRequest,
      notifyFriendsChanged,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
