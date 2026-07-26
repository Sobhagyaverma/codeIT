import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE } from "./api";
import { getAuthToken } from "./authStorage";

let client: Client | null = null;

type TopicListener = (payload: unknown) => void;

type TopicEntry = {
  subscription: StompSubscription | null;
  listeners: Set<TopicListener>;
};

const topics = new Map<string, TopicEntry>();

function ensureTopicSubscription(topic: string, entry: TopicEntry) {
  if (!client?.connected || entry.subscription) return;
  entry.subscription = client.subscribe(topic, (msg: IMessage) => {
    let payload: unknown = msg.body;
    try {
      payload = JSON.parse(msg.body);
    } catch {
      /* keep raw */
    }
    entry.listeners.forEach((listener) => listener(payload));
  });
}

function resubscribeAll() {
  topics.forEach((entry, topic) => {
    entry.subscription = null;
    if (entry.listeners.size > 0) {
      ensureTopicSubscription(topic, entry);
    }
  });
}

function getClient(): Client {
  if (client) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws`) as WebSocket,
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    beforeConnect: () => {
      const token = getAuthToken();
      client!.connectHeaders = token
        ? { Authorization: `Bearer ${token}` }
        : {};
    },
    onConnect: () => {
      resubscribeAll();
    },
  });
  client.activate();
  return client;
}

async function whenConnected(c: Client): Promise<void> {
  if (c.connected) return;
  await new Promise<void>((resolve, reject) => {
    const prevConnect = c.onConnect;
    const prevError = c.onStompError;
    const timer = window.setTimeout(() => {
      reject(new Error("STOMP connect timeout"));
    }, 15000);
    c.onConnect = (frame) => {
      window.clearTimeout(timer);
      prevConnect?.(frame);
      resolve();
    };
    c.onStompError = (frame) => {
      window.clearTimeout(timer);
      prevError?.(frame);
      reject(new Error(frame.headers["message"] || "STOMP error"));
    };
  });
}

/** Subscribe to a topic. Returns an unsubscribe function. */
export function subscribeTopic<T>(
  topic: string,
  onMessage: (payload: T) => void
): () => void {
  const c = getClient();
  const listener: TopicListener = (payload) => onMessage(payload as T);

  let entry = topics.get(topic);
  if (!entry) {
    entry = { subscription: null, listeners: new Set() };
    topics.set(topic, entry);
  }
  entry.listeners.add(listener);

  const attach = () => ensureTopicSubscription(topic, entry!);
  if (c.connected) {
    attach();
  } else {
    void whenConnected(c).then(attach).catch(() => {
      /* connection failed; onConnect resubscribe will retry */
    });
  }

  return () => {
    const current = topics.get(topic);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      current.subscription?.unsubscribe();
      topics.delete(topic);
    }
  };
}

/** Publish to an /app destination (requires connected + JWT). */
export async function publishApp(
  destination: string,
  body: unknown = {}
): Promise<void> {
  const c = getClient();
  await whenConnected(c);
  c.publish({
    destination,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

export const leaderboardTopic = (competitionId: number) =>
  `/topic/competitions/${competitionId}/leaderboard`;
export const statusTopic = (competitionId: number) =>
  `/topic/competitions/${competitionId}/status`;
export const sessionTopic = (competitionId: number, userId: number) =>
  `/topic/competitions/${competitionId}/users/${userId}/session`;

export const roomChatTopic = (roomId: string) =>
  `/topic/rooms/${roomId}/chat`;
export const roomPresenceTopic = (roomId: string) =>
  `/topic/rooms/${roomId}/presence`;
export const roomPresenceJoinDestination = (roomId: string) =>
  `/app/rooms/${roomId}/presence/join`;
export const roomRunTopic = (roomId: string) => `/topic/rooms/${roomId}/run`;
export const roomSubmitTopic = (roomId: string) =>
  `/topic/rooms/${roomId}/submit`;
export const roomWorkspaceTopic = (roomId: string) =>
  `/topic/rooms/${roomId}/workspace`;
