import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE } from "./api";
import { getAuthToken } from "./authStorage";

let client: Client | null = null;
const subscriptions = new Map<string, StompSubscription>();

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
  });
  client.activate();
  return client;
}

async function whenConnected(c: Client): Promise<void> {
  if (c.connected) return;
  await new Promise<void>((resolve, reject) => {
    const prevConnect = c.onConnect;
    const prevError = c.onStompError;
    c.onConnect = (frame) => {
      prevConnect?.(frame);
      resolve();
    };
    c.onStompError = (frame) => {
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

  const doSubscribe = () => {
    if (subscriptions.has(topic)) return;
    const sub = c.subscribe(topic, (msg: IMessage) => {
      try {
        onMessage(JSON.parse(msg.body));
      } catch {
        onMessage(msg.body as unknown as T);
      }
    });
    subscriptions.set(topic, sub);
  };

  if (c.connected) {
    doSubscribe();
  } else {
    whenConnected(c).then(doSubscribe).catch(() => {
      /* connection failed; caller may retry */
    });
  }

  return () => {
    subscriptions.get(topic)?.unsubscribe();
    subscriptions.delete(topic);
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

