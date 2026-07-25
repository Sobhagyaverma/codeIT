import { useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import type { PresenceEvent } from "../types";

/**
 * When someone joins, refresh room members so the participant list stays current.
 * Join/leave UI feedback is handled by PresenceChips (not toasts).
 */
export function usePresenceMemberSync(
  lastEvent: PresenceEvent | null,
  reload: () => Promise<void> | void
) {
  const { user } = useAuth();
  const seenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type !== "JOINED" && lastEvent.type !== "LEFT") return;

    const key = `${lastEvent.type}:${lastEvent.userId}:${lastEvent.roomId}`;
    if (seenRef.current === key) return;
    seenRef.current = key;

    // Always refresh on join so new members appear; refresh on leave too.
    void reload();
    void user;
  }, [lastEvent, reload, user]);
}
