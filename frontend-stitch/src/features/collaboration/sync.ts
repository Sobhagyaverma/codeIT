const SYNC_WS_BASE =
  (import.meta.env.VITE_SYNC_WS_URL as string | undefined) ??
  "ws://localhost:1234";

export function buildSyncProviderUrl(
  docName: string,
  syncToken: string
): {
  serverUrl: string;
  roomName: string;
  params: Record<string, string>;
} {
  return {
    serverUrl: SYNC_WS_BASE.replace(/\/$/, ""),
    roomName: docName,
    params: { token: syncToken },
  };
}

export type LocalCodePayload = {
  code: string;
  language: string;
  cursor?: number;
  savedAt?: number;
};

const codeKey = (roomId: string) => `codeit.stitch:room:${roomId}:code`;

export function persistLocalCode(roomId: string, payload: LocalCodePayload) {
  try {
    localStorage.setItem(
      codeKey(roomId),
      JSON.stringify({ ...payload, savedAt: Date.now() })
    );
  } catch {
    /* ignore quota */
  }
}

export function loadLocalCode(roomId: string): LocalCodePayload | null {
  try {
    const raw = localStorage.getItem(codeKey(roomId));
    if (!raw) return null;
    return JSON.parse(raw) as LocalCodePayload;
  } catch {
    return null;
  }
}

export type CanvasStroke = {
  id: string;
  points: Array<{ x: number; y: number }>;
  width: number;
  color: string;
  erase: boolean;
};

const boardKey = (roomId: string) => `codeit.stitch:room:${roomId}:wb`;

export function persistLocalStrokes(roomId: string, strokes: CanvasStroke[]) {
  try {
    localStorage.setItem(
      boardKey(roomId),
      JSON.stringify({ strokes, savedAt: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

export function loadLocalStrokes(roomId: string): CanvasStroke[] | null {
  try {
    const raw = localStorage.getItem(boardKey(roomId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { strokes?: CanvasStroke[] };
    return Array.isArray(parsed.strokes) ? parsed.strokes : null;
  } catch {
    return null;
  }
}
