import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type { PresenceEvent } from "../types";

type Chip = {
  id: string;
  kind: "joined" | "left";
  text: string;
};

const DISMISS_MS = 3200;

/** In-room ephemeral join/leave chips (not global toasts). */
export default function PresenceChips({
  lastEvent,
}: {
  lastEvent: PresenceEvent | null;
}) {
  const { user } = useAuth();
  const [chips, setChips] = useState<Chip[]>([]);
  const [seenKey, setSeenKey] = useState<string | null>(null);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type !== "JOINED" && lastEvent.type !== "LEFT") return;

    const key = `${lastEvent.type}:${lastEvent.userId}:${lastEvent.roomId}:${lastEvent.onlineUserIds?.join(",") ?? ""}`;
    if (seenKey === key) return;
    setSeenKey(key);

    if (user && lastEvent.userId === user.id) return;

    const name = lastEvent.username || `User ${lastEvent.userId}`;
    const kind = lastEvent.type === "JOINED" ? "joined" : "left";
    const chip: Chip = {
      id: `${key}:${Date.now()}`,
      kind,
      text:
        kind === "joined"
          ? `${name} joined the room`
          : `${name} left the room`,
    };

    setChips((prev) => [...prev.slice(-3), chip]);
    const t = window.setTimeout(() => {
      setChips((prev) => prev.filter((c) => c.id !== chip.id));
    }, DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [lastEvent, user, seenKey]);

  if (chips.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2"
      aria-live="polite"
    >
      {chips.map((c) => (
        <div
          key={c.id}
          className="animate-[fadeIn_180ms_ease-out] rounded-full border border-[var(--line)] bg-[var(--bg-raised)]/95 px-3.5 py-1.5 text-sm text-[var(--text)] shadow-lg backdrop-blur"
        >
          <span
            className={`mr-2 inline-block h-2 w-2 rounded-full ${
              c.kind === "joined" ? "bg-emerald-400" : "bg-[var(--err)]"
            }`}
            aria-hidden
          />
          {c.text}
        </div>
      ))}
    </div>
  );
}
