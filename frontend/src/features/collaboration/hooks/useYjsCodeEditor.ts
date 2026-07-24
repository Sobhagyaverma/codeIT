import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import type * as Monaco from "monaco-editor";
import { getSyncToken } from "../api";
import {
  buildSyncProviderUrl,
  loadLocalCode,
  persistLocalCode,
} from "../sync";
import type { ConnectionState } from "../components/ConnectionStatus";
import { mapProviderStatus } from "../components/ConnectionStatus";

type Options = {
  roomId: string;
  language: string;
  enabled: boolean;
  readOnly?: boolean;
  userName?: string;
};

export function useYjsCodeEditor({
  roomId,
  language,
  enabled,
  readOnly = false,
  userName = "anon",
}: Options) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionState>("connecting");
  const [customStdin, setCustomStdin] = useState("");

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const ymetaRef = useRef<Y.Map<string> | null>(null);
  const languageRef = useRef(language);
  const hydratedRef = useRef(false);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  languageRef.current = language;

  useEffect(() => {
    if (!enabled || !roomId) return;

    let cancelled = false;
    let persistInterval = 0;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const ytext = ydoc.getText("monaco");
    const ymeta = ydoc.getMap<string>("meta");
    ytextRef.current = ytext;
    ymetaRef.current = ymeta;
    hydratedRef.current = false;

    const onMeta = () => {
      const next = ymeta.get("customStdin") ?? "";
      setCustomStdin(next);
    };
    ymeta.observe(onMeta);
    onMeta();

    void (async () => {
      try {
        const sync = await getSyncToken(roomId);
        if (cancelled) return;
        const { serverUrl, roomName, params } = buildSyncProviderUrl(
          sync.codeDocName,
          sync.token
        );
        const provider = new WebsocketProvider(serverUrl, roomName, ydoc, {
          params,
          connect: true,
        });
        providerRef.current = provider;
        provider.awareness.setLocalStateField("user", {
          name: userName,
          color: "#f5a623",
        });

        const applyHydrateIfEmpty = () => {
          if (hydratedRef.current) return;
          if (ytext.length > 0) {
            hydratedRef.current = true;
            return;
          }
          const local = loadLocalCode(roomId);
          if (local?.code) {
            ydoc.transact(() => {
              ytext.insert(0, local.code);
              if (local.language && !ymeta.get("language")) {
                ymeta.set("language", local.language);
              }
            });
            if (
              local.cursor != null &&
              editorRef.current &&
              Number.isFinite(local.cursor)
            ) {
              const pos = editorRef.current.getModel()?.getPositionAt(local.cursor);
              if (pos) {
                editorRef.current.setPosition(pos);
                editorRef.current.revealPositionInCenter(pos);
              }
            }
          }
          hydratedRef.current = true;
        };

        provider.on("status", (event: { status: string }) => {
          setConnectionStatus(mapProviderStatus(event.status));
        });

        provider.on("sync", (isSynced: boolean) => {
          if (isSynced) {
            applyHydrateIfEmpty();
            setConnectionStatus("connected");
          }
        });

        // Fallback hydrate shortly after connect even if sync event is late
        window.setTimeout(() => {
          if (!cancelled) applyHydrateIfEmpty();
        }, 800);

        setReady(true);

        persistInterval = window.setInterval(() => {
          const model = editorRef.current?.getModel();
          const pos = editorRef.current?.getPosition();
          const cursor =
            model && pos ? model.getOffsetAt(pos) : undefined;
          persistLocalCode(roomId, {
            code: ytext.toString(),
            language: languageRef.current,
            cursor,
          });
        }, 2000);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Sync connect failed");
          setConnectionStatus("disconnected");
        }
      }
    })();

    return () => {
      cancelled = true;
      ymeta.unobserve(onMeta);
      if (persistInterval) window.clearInterval(persistInterval);
      bindingRef.current?.destroy();
      bindingRef.current = null;
      providerRef.current?.destroy();
      providerRef.current = null;
      ydoc.destroy();
      ydocRef.current = null;
      ytextRef.current = null;
      ymetaRef.current = null;
      setReady(false);
      setConnectionStatus("disconnected");
    };
  }, [roomId, enabled, userName]);

  useEffect(() => {
    const meta = ymetaRef.current;
    if (!meta || !ready) return;
    if (meta.get("language") !== language) {
      meta.set("language", language);
    }
  }, [language, ready]);

  const bindEditor = useCallback(
    (
      editor: Monaco.editor.IStandaloneCodeEditor,
      monaco: typeof Monaco
    ) => {
      const ytext = ytextRef.current;
      const ydoc = ydocRef.current;
      const provider = providerRef.current;
      if (!ytext || !ydoc || !provider) return;

      editorRef.current = editor;
      bindingRef.current?.destroy();
      const model = editor.getModel();
      if (!model) return;

      bindingRef.current = new MonacoBinding(
        ytext,
        model,
        new Set([editor]),
        provider.awareness
      );
      editor.updateOptions({ readOnly });
      void monaco;
    },
    [readOnly]
  );

  const getCode = useCallback(() => ytextRef.current?.toString() ?? "", []);

  const setSharedCustomStdin = useCallback(
    (value: string) => {
      if (readOnly) return;
      const meta = ymetaRef.current;
      if (!meta) {
        setCustomStdin(value);
        return;
      }
      if (meta.get("customStdin") !== value) {
        meta.set("customStdin", value);
      }
    },
    [readOnly]
  );

  return {
    ready,
    error,
    connectionStatus,
    bindEditor,
    getCode,
    customStdin,
    setCustomStdin: setSharedCustomStdin,
    ytextRef,
    ymetaRef,
  };
}
