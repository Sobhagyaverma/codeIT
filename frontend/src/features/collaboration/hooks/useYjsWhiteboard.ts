import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type {
  Collaborator,
  ExcalidrawImperativeAPI,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { SocketId } from "@excalidraw/excalidraw/types";
import { getSyncToken } from "../api";
import {
  buildSyncProviderUrl,
  loadLocalWhiteboard,
  persistLocalWhiteboard,
} from "../sync";
import type { ConnectionState } from "../components/ConnectionStatus";
import { mapProviderStatus } from "../components/ConnectionStatus";

type Options = {
  roomId: string;
  enabled: boolean;
  readOnly?: boolean;
  userName?: string;
  userColor?: string;
};

export type WhiteboardScene = {
  elements: readonly ExcalidrawElement[];
  files?: BinaryFiles;
};

const COLORS = [
  "#f5a623",
  "#3b82f6",
  "#22c55e",
  "#ec4899",
  "#a78bfa",
  "#14b8a6",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function useYjsWhiteboard({
  roomId,
  enabled,
  readOnly = false,
  userName = "anon",
  userColor,
}: Options) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionState>("connecting");
  const [collaborators, setCollaborators] = useState<
    Map<SocketId, Collaborator>
  >(new Map());

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ymapRef = useRef<Y.Map<unknown> | null>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const applyingRemoteRef = useRef(false);
  const localWriteRef = useRef(false);
  const hydratedRef = useRef(false);
  const publishTimerRef = useRef(0);
  const lastPublishedSigRef = useRef("");
  const pendingSceneRef = useRef<WhiteboardScene | null>(null);
  const color = userColor || colorForName(userName);

  const sceneSignature = useCallback(
    (elements: readonly ExcalidrawElement[]) =>
      elements.map((e) => `${e.id}:${e.version}`).join("|"),
    []
  );

  const readSceneFromY = useCallback((): WhiteboardScene | null => {
    const ymap = ymapRef.current;
    if (!ymap) return null;
    const elements = ymap.get("elements");
    const files = ymap.get("files");
    if (!Array.isArray(elements)) return null;
    return {
      elements: elements as ExcalidrawElement[],
      files: (files as BinaryFiles) || undefined,
    };
  }, []);

  const applySceneToApi = useCallback((scene: WhiteboardScene) => {
    const api = apiRef.current;
    if (!api) return;
    applyingRemoteRef.current = true;
    api.updateScene({
      elements: scene.elements,
    });
    if (scene.files && Object.keys(scene.files).length > 0) {
      api.addFiles(Object.values(scene.files));
    }
    // Keep gate up until after Excalidraw's onChange from this update
    window.setTimeout(() => {
      applyingRemoteRef.current = false;
    }, 50);
  }, []);

  useEffect(() => {
    if (!enabled || !roomId) return;
    let cancelled = false;
    let persistInterval = 0;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const ymap = ydoc.getMap<unknown>("excalidraw");
    ymapRef.current = ymap;
    hydratedRef.current = false;

    const onYChange = () => {
      // Skip echo of our own publishes — otherwise stamp/draw freezes the tab
      if (localWriteRef.current || applyingRemoteRef.current) return;
      const scene = readSceneFromY();
      if (!scene) return;
      const sig = scene.elements.map((e) => `${e.id}:${e.version}`).join("|");
      if (sig === lastPublishedSigRef.current) return;
      applySceneToApi(scene);
      void persistLocalWhiteboard(roomId, scene);
    };
    ymap.observe(onYChange);

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
        });
        providerRef.current = provider;

        provider.awareness.setLocalStateField("user", {
          name: userName,
          color,
        });

        const syncAwareness = () => {
          // Avoid React re-renders on every pointer move — update Excalidraw API directly
          const next = new Map<SocketId, Collaborator>();
          provider.awareness.getStates().forEach((state, clientId) => {
            if (clientId === provider.awareness.clientID) return;
            const user = state.user as
              | { name?: string; color?: string }
              | undefined;
            const pointer = state.pointer as
              | { x: number; y: number; tool: "pointer" | "laser" }
              | undefined;
            const c = user?.color || colorForName(String(clientId));
            next.set(String(clientId) as SocketId, {
              username: user?.name || `user-${clientId}`,
              color: { background: c, stroke: c },
              pointer,
            });
          });
          apiRef.current?.updateScene({ collaborators: next });
          // Throttle React state (connection UI) — only when member set changes
          setCollaborators((prev) => {
            if (prev.size === next.size) {
              let same = true;
              for (const id of next.keys()) {
                if (!prev.has(id)) {
                  same = false;
                  break;
                }
              }
              if (same) return prev;
            }
            return next;
          });
        };
        provider.awareness.on("change", syncAwareness);
        syncAwareness();

        const hydrateIfEmpty = async () => {
          if (hydratedRef.current) return;
          const existing = ymap.get("elements");
          if (Array.isArray(existing) && existing.length > 0) {
            hydratedRef.current = true;
            applySceneToApi({
              elements: existing as ExcalidrawElement[],
              files: (ymap.get("files") as BinaryFiles) || undefined,
            });
            return;
          }
          const local = (await loadLocalWhiteboard(roomId)) as WhiteboardScene | null;
          if (
            local &&
            Array.isArray(local.elements) &&
            local.elements.length > 0
          ) {
            ydoc.transact(() => {
              ymap.set("elements", local.elements);
              if (local.files) ymap.set("files", local.files);
            });
            applySceneToApi(local);
          }
          hydratedRef.current = true;
        };

        provider.on("status", (event: { status: string }) => {
          setConnectionStatus(mapProviderStatus(event.status));
        });
        provider.on("sync", (isSynced: boolean) => {
          if (isSynced) {
            void hydrateIfEmpty();
            setConnectionStatus("connected");
          }
        });
        window.setTimeout(() => {
          if (!cancelled) void hydrateIfEmpty();
        }, 800);

        persistInterval = window.setInterval(() => {
          const scene = readSceneFromY();
          if (scene) void persistLocalWhiteboard(roomId, scene);
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
      ymap.unobserve(onYChange);
      if (persistInterval) window.clearInterval(persistInterval);
      if (publishTimerRef.current) window.clearTimeout(publishTimerRef.current);
      providerRef.current?.destroy();
      providerRef.current = null;
      ydoc.destroy();
      ydocRef.current = null;
      ymapRef.current = null;
      setReady(false);
      setConnectionStatus("disconnected");
    };
  }, [roomId, enabled, userName, color, applySceneToApi, readSceneFromY]);

  const bindApi = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api;
    const scene = readSceneFromY();
    if (scene) applySceneToApi(scene);
  }, [applySceneToApi, readSceneFromY]);

  const publishScene = useCallback(
    (elements: readonly ExcalidrawElement[], files: BinaryFiles) => {
      if (readOnly || applyingRemoteRef.current) return;
      const ymap = ymapRef.current;
      const ydoc = ydocRef.current;
      if (!ymap || !ydoc) return;

      const sig = sceneSignature(elements);
      if (sig === lastPublishedSigRef.current) return;

      pendingSceneRef.current = { elements, files };

      // Debounce high-frequency Excalidraw onChange while dragging
      if (publishTimerRef.current) window.clearTimeout(publishTimerRef.current);
      publishTimerRef.current = window.setTimeout(() => {
        if (applyingRemoteRef.current) return;
        const pending = pendingSceneRef.current;
        if (!pending) return;
        const latestSig = sceneSignature(pending.elements);
        if (latestSig === lastPublishedSigRef.current) return;
        lastPublishedSigRef.current = latestSig;
        localWriteRef.current = true;
        ydoc.transact(() => {
          ymap.set("elements", pending.elements);
          ymap.set("files", pending.files || {});
        });
        void persistLocalWhiteboard(roomId, pending);
        window.setTimeout(() => {
          localWriteRef.current = false;
        }, 50);
      }, 80);
    },
    [readOnly, roomId, sceneSignature]
  );

  const publishPointer = useCallback(
    (pointer: { x: number; y: number; tool: "pointer" | "laser" } | null) => {
      const provider = providerRef.current;
      if (!provider) return;
      provider.awareness.setLocalStateField("pointer", pointer);
    },
    []
  );

  const clear = useCallback(() => {
    if (readOnly) return;
    const ymap = ymapRef.current;
    const ydoc = ydocRef.current;
    if (!ymap || !ydoc) return;
    ydoc.transact(() => {
      ymap.set("elements", []);
      ymap.set("files", {});
    });
    applySceneToApi({ elements: [], files: {} });
  }, [readOnly, applySceneToApi]);

  return {
    ready,
    error,
    connectionStatus,
    collaborators,
    bindApi,
    publishScene,
    publishPointer,
    clear,
    readOnly,
    userColor: color,
  };
}
