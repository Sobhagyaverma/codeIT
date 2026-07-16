import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE } from "./api";

let client: Client | null = null;
const subscriptions = new Map<string, StompSubscription>();

function getClient(): Client {
  if (client) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws`) as WebSocket,
    reconnectDelay: 3000, // auto-reconnect strategy
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });
  client.activate();
  return client;
}

async function whenConnected(c: Client): Promise<void> {
  if (c.connected) return;
  await new Promise<void>((resolve) => {
    const prev = c.onConnect;
    c.onConnect = (frame) => {
      prev?.(frame);
      resolve();
    };
  });
}

/** Subscribe to a competition topic. Returns an unsubscribe function. */
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
    whenConnected(c).then(doSubscribe);
  }

  return () => {
    subscriptions.get(topic)?.unsubscribe();
    subscriptions.delete(topic);
  };
}

export const leaderboardTopic = (competitionId: number) =>
  `/topic/competitions/${competitionId}/leaderboard`;
export const statusTopic = (competitionId: number) =>
  `/topic/competitions/${competitionId}/status`;
export const sessionTopic = (competitionId: number, userId: number) =>
  `/topic/competitions/${competitionId}/users/${userId}/session`;
