import { useEffect, useState } from "react";
import {
  publishApp,
  roomPresenceJoinDestination,
  roomPresenceTopic,
  subscribeTopic,
} from "../../../lib/ws";
import type { PresenceEvent } from "../types";

export function useRoomPresence(roomId: string | undefined, enabled: boolean) {
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [lastEvent, setLastEvent] = useState<PresenceEvent | null>(null);

  useEffect(() => {
    if (!roomId || !enabled) return;

    const unsub = subscribeTopic<PresenceEvent>(
      roomPresenceTopic(roomId),
      (event) => {
        setLastEvent(event);
        if (Array.isArray(event.onlineUserIds)) {
          setOnlineUserIds(event.onlineUserIds);
        }
      }
    );

    void publishApp(roomPresenceJoinDestination(roomId));

    return () => {
      unsub();
    };
  }, [roomId, enabled]);

  return { onlineUserIds, lastEvent };
}
