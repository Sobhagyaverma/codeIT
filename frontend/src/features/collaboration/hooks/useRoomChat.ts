import { useCallback, useEffect, useState } from "react";
import { getRoomMessages, sendRoomMessage } from "../api";
import type { RoomMessage } from "../types";
import { roomChatTopic, subscribeTopic } from "../../../lib/ws";

export function useRoomChat(roomId: string | undefined, enabled: boolean) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !enabled) return;

    let cancelled = false;
    void getRoomMessages(roomId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load chat");
        }
      });

    const unsub = subscribeTopic<RoomMessage>(roomChatTopic(roomId), (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [roomId, enabled]);

  const send = useCallback(
    async (content: string) => {
      if (!roomId || !content.trim()) return;
      setSending(true);
      setError(null);
      try {
        const saved = await sendRoomMessage(roomId, content.trim());
        setMessages((prev) => {
          if (prev.some((m) => m.id === saved.id)) return prev;
          return [...prev, saved];
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send");
        throw e;
      } finally {
        setSending(false);
      }
    },
    [roomId]
  );

  return { messages, send, sending, error };
}
