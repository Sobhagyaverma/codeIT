const SYNC_WS_BASE =
  (import.meta.env.VITE_SYNC_WS_URL as string | undefined) ??
  "ws://localhost:1234";

export function buildSyncProviderUrl(docName: string, syncToken: string): {
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

export function persistLocalCode(roomId: string, payload: LocalCodePayload) {
  try {
    localStorage.setItem(
      `codeit:room:${roomId}:code`,
      JSON.stringify({ ...payload, savedAt: Date.now() })
    );
  } catch {
    /* ignore quota */
  }
}

export function loadLocalCode(roomId: string): LocalCodePayload | null {
  try {
    const raw = localStorage.getItem(`codeit:room:${roomId}:code`);
    if (!raw) return null;
    return JSON.parse(raw) as LocalCodePayload;
  } catch {
    return null;
  }
}

export function persistLocalWorkspace(roomId: string, workspace: string) {
  try {
    sessionStorage.setItem(`codeit:room:${roomId}:workspace`, workspace);
  } catch {
    /* ignore */
  }
}

export function loadLocalWorkspace(roomId: string): string | null {
  try {
    return sessionStorage.getItem(`codeit:room:${roomId}:workspace`);
  } catch {
    return null;
  }
}

const IDB_NAME = "codeit-whiteboard";
const IDB_STORE = "boards";
const idbKey = (roomId: string) => `codeit:room:${roomId}:wb`;

function openWhiteboardDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

export async function persistLocalWhiteboard(
  roomId: string,
  scene: unknown
): Promise<void> {
  try {
    const db = await openWhiteboardDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(scene, idbKey(roomId));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    });
    db.close();
  } catch {
    /* ignore */
  }
}

export async function loadLocalWhiteboard(
  roomId: string
): Promise<unknown | null> {
  try {
    const db = await openWhiteboardDb();
    const value = await new Promise<unknown | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(idbKey(roomId));
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
    });
    db.close();
    return value;
  } catch {
    return null;
  }
}
