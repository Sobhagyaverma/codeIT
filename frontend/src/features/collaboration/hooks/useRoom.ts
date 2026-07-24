import { useCallback, useEffect, useMemo, useState } from "react";
import { getRoom } from "../api";
import type { Room, RoomRole } from "../types";
import { useAuth } from "../../../context/AuthContext";

export function useRoom(roomId: string | undefined) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRoom(roomId);
      setRoom(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load room");
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const myRole: RoomRole | null = useMemo(() => {
    if (!room || !user) return null;
    const me = room.members.find((m) => m.userId === user.id);
    return me?.role ?? null;
  }, [room, user]);

  const isHost = myRole === "HOST";
  const canEdit = myRole === "HOST" || myRole === "EDITOR";

  return { room, setRoom, loading, error, reload, myRole, isHost, canEdit };
}
