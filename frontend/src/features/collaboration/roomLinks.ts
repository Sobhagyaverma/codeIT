import type { Room } from "./types";

export function roomCodeOf(room: Pick<Room, "inviteToken">): string {
  return room.inviteToken;
}

export function problemCollabShareUrl(
  problemId: number | string,
  roomId: string,
  roomCode: string
): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/problems/${problemId}/room/${roomId}?code=${encodeURIComponent(roomCode)}`;
}

export function codeRoomShareUrl(roomId: string, roomCode: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/coderoom/${roomId}?code=${encodeURIComponent(roomCode)}`;
}

export function roomCodeFromSearchParams(
  searchParams: URLSearchParams
): string | null {
  return searchParams.get("code") || searchParams.get("invite");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function formatRelativeTime(iso?: string): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}
