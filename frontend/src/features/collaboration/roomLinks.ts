import type { Room } from "./types";

/** Map API `inviteToken` to user-facing Room Code. */
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

/** Accept `?code=` (preferred) or legacy `?invite=`. */
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
