import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getSyncToken } from "../api";
import {
  buildSyncProviderUrl,
  loadLocalStrokes,
  persistLocalStrokes,
  type CanvasStroke,
} from "../sync";
import type { ConnectionState } from "../ConnectionStatus";
import { mapProviderStatus } from "../ConnectionStatus";
import { avatarColorFor } from "../userColors";

type Options = {
  roomId: string;
  enabled: boolean;
  readOnly?: boolean;
  userName?: string;
  userId?: number;
};

const MAX_STROKES = 500;
const MAX_POINTS = 400;
const MAX_UNDO = 50;

function strokeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function clampStroke(stroke: CanvasStroke): CanvasStroke {
  const points =
    stroke.points.length > MAX_POINTS
      ? stroke.points.slice(0, MAX_POINTS)
      : stroke.points;
  return { ...stroke, points };
}

export function useYjsCanvasBoard({
  roomId,
  enabled,
  readOnly = false,
  userName = "anon",
  userId,
}: Options) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionState>("connecting");
  const [strokes, setStrokes] = useState<CanvasStroke[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const yarrRef = useRef<Y.Array<CanvasStroke> | null>(null);
  const hydratedRef = useRef(false);
  const undoStackRef = useRef<CanvasStroke[][]>([]);
  const redoStackRef = useRef<CanvasStroke[][]>([]);
  const applyingHistoryRef = useRef(false);
  const userColor = avatarColorFor(userId ?? 0);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const pushUndoSnapshot = useCallback(
    (snapshot: CanvasStroke[]) => {
      if (applyingHistoryRef.current) return;
      undoStackRef.current = [
        ...undoStackRef.current.slice(-(MAX_UNDO - 1)),
        snapshot,
      ];
      redoStackRef.current = [];
      syncHistoryFlags();
    },
    [syncHistoryFlags]
  );

  const readStrokes = useCallback((): CanvasStroke[] => {
    const yarr = yarrRef.current;
    if (!yarr) return [];
    return yarr
      .toArray()
      .filter(
        (s): s is CanvasStroke =>
          !!s &&
          typeof s === "object" &&
          Array.isArray((s as CanvasStroke).points)
      )
      .slice(-MAX_STROKES);
  }, []);

  const replaceAllStrokes = useCallback((next: CanvasStroke[]) => {
    const yarr = yarrRef.current;
    if (!yarr) return;
    const capped = next.slice(-MAX_STROKES).map(clampStroke);
    yarr.delete(0, yarr.length);
    if (capped.length) yarr.push(capped);
  }, []);

  useEffect(() => {
    if (!enabled || !roomId) return;

    let cancelled = false;
    let persistInterval = 0;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const yarr = ydoc.getArray<CanvasStroke>("canvasStrokes");
    yarrRef.current = yarr;
    hydratedRef.current = false;
    undoStackRef.current = [];
    redoStackRef.current = [];
    syncHistoryFlags();

    const onChange = () => {
      const next = readStrokes();
      setStrokes(next);
      persistLocalStrokes(roomId, next);
    };
    yarr.observe(onChange);

    void (async () => {
      try {
        const sync = await getSyncToken(roomId);
        if (cancelled) return;
        const { serverUrl, roomName, params, protocols } = buildSyncProviderUrl(
          sync.whiteboardDocName,
          sync.token
        );
        const provider = new WebsocketProvider(serverUrl, roomName, ydoc, {
          params,
          protocols,
          connect: true,
        });
        providerRef.current = provider;
        provider.awareness.setLocalStateField("user", {
          name: userName,
          color: userColor,
        });

        const hydrateIfEmpty = () => {
          if (hydratedRef.current) return;
          if (yarr.length > 0) {
            hydratedRef.current = true;
            onChange();
            return;
          }
          const local = loadLocalStrokes(roomId);
          if (local && local.length > 0) {
            ydoc.transact(() => {
              yarr.push(local.slice(-MAX_STROKES).map(clampStroke));
            });
          }
          hydratedRef.current = true;
          onChange();
        };

        provider.on("status", (event: { status: string }) => {
          setConnectionStatus(mapProviderStatus(event.status));
        });
        provider.on("sync", (isSynced: boolean) => {
          if (isSynced) {
            hydrateIfEmpty();
            setConnectionStatus("connected");
          }
        });
        window.setTimeout(() => {
          if (!cancelled) hydrateIfEmpty();
        }, 800);

        persistInterval = window.setInterval(() => {
          persistLocalStrokes(roomId, readStrokes());
        }, 3000);

        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Whiteboard sync failed");
          setConnectionStatus("disconnected");
        }
      }
    })();

    return () => {
      cancelled = true;
      yarr.unobserve(onChange);
      if (persistInterval) window.clearInterval(persistInterval);
      providerRef.current?.destroy();
      providerRef.current = null;
      ydoc.destroy();
      ydocRef.current = null;
      yarrRef.current = null;
      setReady(false);
      setConnectionStatus("disconnected");
    };
  }, [roomId, enabled, userName, userColor, readStrokes, syncHistoryFlags]);

  const addStroke = useCallback(
    (stroke: Omit<CanvasStroke, "id"> & { id?: string }) => {
      if (readOnly) return;
      const yarr = yarrRef.current;
      if (!yarr) return;
      pushUndoSnapshot(readStrokes());
      const full = clampStroke({
        id: stroke.id || strokeId(),
        points: stroke.points,
        width: stroke.width,
        color: stroke.color,
        erase: stroke.erase,
      });
      yarr.push([full]);
      // Cap total strokes on the shared array
      if (yarr.length > MAX_STROKES) {
        yarr.delete(0, yarr.length - MAX_STROKES);
      }
    },
    [readOnly, pushUndoSnapshot, readStrokes]
  );

  const undo = useCallback(() => {
    if (readOnly || undoStackRef.current.length === 0) return;
    const previous = undoStackRef.current[undoStackRef.current.length - 1]!;
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    redoStackRef.current = [
      ...redoStackRef.current.slice(-(MAX_UNDO - 1)),
      readStrokes(),
    ];
    applyingHistoryRef.current = true;
    replaceAllStrokes(previous);
    applyingHistoryRef.current = false;
    syncHistoryFlags();
  }, [readOnly, readStrokes, replaceAllStrokes, syncHistoryFlags]);

  const redo = useCallback(() => {
    if (readOnly || redoStackRef.current.length === 0) return;
    const next = redoStackRef.current[redoStackRef.current.length - 1]!;
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    undoStackRef.current = [
      ...undoStackRef.current.slice(-(MAX_UNDO - 1)),
      readStrokes(),
    ];
    applyingHistoryRef.current = true;
    replaceAllStrokes(next);
    applyingHistoryRef.current = false;
    syncHistoryFlags();
  }, [readOnly, readStrokes, replaceAllStrokes, syncHistoryFlags]);

  const clear = useCallback(() => {
    if (readOnly) return;
    const yarr = yarrRef.current;
    if (!yarr) return;
    pushUndoSnapshot(readStrokes());
    yarr.delete(0, yarr.length);
  }, [readOnly, pushUndoSnapshot, readStrokes]);

  return {
    ready,
    error,
    connectionStatus,
    strokes,
    addStroke,
    clear,
    undo,
    redo,
    canUndo,
    canRedo,
    userColor,
  };
}
