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

function strokeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
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

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const yarrRef = useRef<Y.Array<CanvasStroke> | null>(null);
  const hydratedRef = useRef(false);
  const userColor = avatarColorFor(userId ?? 0);

  const readStrokes = useCallback((): CanvasStroke[] => {
    const yarr = yarrRef.current;
    if (!yarr) return [];
    return yarr.toArray().filter(
      (s): s is CanvasStroke =>
        !!s &&
        typeof s === "object" &&
        Array.isArray((s as CanvasStroke).points)
    );
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
        const { serverUrl, roomName, params } = buildSyncProviderUrl(
          sync.whiteboardDocName,
          sync.token
        );
        const provider = new WebsocketProvider(serverUrl, roomName, ydoc, {
          params,
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
              yarr.push(local);
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
  }, [roomId, enabled, userName, userColor, readStrokes]);

  const addStroke = useCallback(
    (stroke: Omit<CanvasStroke, "id"> & { id?: string }) => {
      if (readOnly) return;
      const yarr = yarrRef.current;
      if (!yarr) return;
      const full: CanvasStroke = {
        id: stroke.id || strokeId(),
        points: stroke.points,
        width: stroke.width,
        color: stroke.color,
        erase: stroke.erase,
      };
      yarr.push([full]);
    },
    [readOnly]
  );

  const clear = useCallback(() => {
    if (readOnly) return;
    const yarr = yarrRef.current;
    if (!yarr) return;
    yarr.delete(0, yarr.length);
  }, [readOnly]);

  return {
    ready,
    error,
    connectionStatus,
    strokes,
    addStroke,
    clear,
    userColor,
  };
}
