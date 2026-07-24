import { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type {
  AppState,
  BinaryFiles,
  Collaborator,
  ExcalidrawImperativeAPI,
  SocketId,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import DsaLibraryPanel from "../whiteboard/DsaLibraryPanel";
import StructureInspector from "../whiteboard/StructureInspector";
import TemplatesBar from "../whiteboard/TemplatesBar";
import type { CodeitStructureKind } from "../whiteboard/kinds";
import {
  addArrayCell,
  appendListNode,
  connectSelectedNodes,
  deleteListNode,
  dequeue,
  enqueue,
  findStructureFromSelection,
  highlightSelectedCells,
  popStack,
  pushStack,
  removeArrayCell,
  resizeDp,
  stampFactory,
} from "../whiteboard/sceneOps";
import { BOARD_TEMPLATES } from "../whiteboard/templates";

type Props = {
  onApiReady: (api: ExcalidrawImperativeAPI) => void;
  onSceneChange: (
    elements: readonly ExcalidrawElement[],
    files: BinaryFiles
  ) => void;
  onPointerUpdate?: (payload: {
    pointer: { x: number; y: number; tool: "pointer" | "laser" };
    button: "up" | "down";
  }) => void;
  collaborators?: Map<SocketId, Collaborator>;
  onClear: () => void;
  readOnly?: boolean;
  isHost?: boolean;
  visible?: boolean;
};

export default function SharedWhiteboard({
  onApiReady,
  onSceneChange,
  onPointerUpdate,
  collaborators: _collaborators,
  onClear,
  readOnly = false,
  isHost = false,
  visible = true,
}: Props) {
  void _collaborators;
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [libCollapsed, setLibCollapsed] = useState(false);
  const [selection, setSelection] = useState<{
    structureId: string;
    kind: CodeitStructureKind;
  } | null>(null);

  useEffect(() => {
    if (!visible) return;
    const id = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
    return () => window.cancelAnimationFrame(id);
  }, [visible]);

  // Collaborators are applied directly in the Yjs hook — do not re-updateScene here
  // (that was causing an onChange ↔ publish freeze loop while dragging).

  const handleClear = useCallback(() => {
    if (!isHost) return;
    if (!window.confirm("Clear the whiteboard for everyone?")) return;
    onClear();
    setSelection(null);
  }, [isHost, onClear]);

  const setSelectionSafe = useCallback(
    (next: { structureId: string; kind: CodeitStructureKind } | null) => {
      setSelection((prev) => {
        if (next === null) return prev === null ? prev : null;
        if (
          prev &&
          prev.structureId === next.structureId &&
          prev.kind === next.kind
        ) {
          return prev;
        }
        return next;
      });
    },
    []
  );

  const refreshSelection = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      const app = api.getAppState();
      const found = findStructureFromSelection(
        api.getSceneElements(),
        app.selectedElementIds || {}
      );
      setSelectionSafe(
        found
          ? { structureId: found.structureId, kind: found.kind }
          : null
      );
    },
    [setSelectionSafe]
  );

  const handleStamp = useCallback(
    (factoryId: string) => {
      const api = apiRef.current;
      if (!api || readOnly) return;
      stampFactory(api, factoryId);
      refreshSelection(api);
    },
    [readOnly, refreshSelection]
  );

  const handleTemplate = useCallback(
    (templateId: string) => {
      const api = apiRef.current;
      if (!api || readOnly) return;
      const tmpl = BOARD_TEMPLATES.find((t) => t.id === templateId);
      if (!tmpl) return;
      const existing = api.getSceneElements().filter((e) => !e.isDeleted);
      if (existing.length > 0 && templateId !== "blank") {
        if (
          !window.confirm(
            "Replace the current board with this template? This cannot be undone easily."
          )
        ) {
          return;
        }
      }
      const stamps = tmpl.build();
      const elements = stamps.flatMap((s) => s.elements);
      api.updateScene({
        elements,
        appState: {
          ...api.getAppState(),
          selectedElementIds: {},
        },
      });
      setSelection(null);
    },
    [readOnly]
  );

  const handleInspectorAction = useCallback(
    (action: string) => {
      const api = apiRef.current;
      if (!api || !selection || readOnly) return;
      const { structureId, kind } = selection;

      switch (action) {
        case "push":
          pushStack(api, structureId);
          break;
        case "pop":
          popStack(api, structureId);
          break;
        case "enqueue":
          enqueue(api, structureId);
          break;
        case "dequeue":
          dequeue(api, structureId);
          break;
        case "add_cell":
          addArrayCell(api, structureId);
          break;
        case "remove_cell":
          removeArrayCell(api, structureId);
          break;
        case "append_node": {
          const mode =
            kind === "linked_list_doubly"
              ? "doubly"
              : kind === "linked_list_circular"
                ? "circular"
                : "singly";
          appendListNode(api, structureId, mode);
          break;
        }
        case "delete_node": {
          const mode =
            kind === "linked_list_doubly"
              ? "doubly"
              : kind === "linked_list_circular"
                ? "circular"
                : "singly";
          deleteListNode(api, structureId, mode);
          break;
        }
        case "dp_2":
          resizeDp(api, structureId, 2, 2);
          break;
        case "dp_5":
          resizeDp(api, structureId, 5, 5);
          break;
        case "dp_10":
          resizeDp(api, structureId, 10, 10);
          break;
        case "connect":
          if (!connectSelectedNodes(api)) {
            window.alert("Select exactly two nodes (or cells) to connect.");
          }
          break;
        case "highlight":
          highlightSelectedCells(api);
          break;
        default:
          break;
      }
      refreshSelection(api);
    },
    [selection, readOnly, refreshSelection]
  );

  const fitView = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    api.scrollToContent(undefined, { fitToContent: true, animate: true });
  }, []);

  return (
    <div
      className="absolute inset-0 flex min-h-0 w-full flex-col transition-opacity duration-200"
      style={{
        display: visible ? "flex" : "none",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--line)] px-3 py-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
          DSA Whiteboard
        </span>
        <TemplatesBar onApply={handleTemplate} disabled={readOnly} />
        <button
          type="button"
          onClick={fitView}
          className="rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--text)] hover:border-[var(--accent)]"
        >
          Fit
        </button>
        <div className="ml-auto flex items-center gap-2">
          {isHost && !readOnly && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md border border-[var(--err)]/40 px-2 py-1 text-xs text-[var(--err)]"
            >
              Clear board
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <DsaLibraryPanel
          collapsed={libCollapsed}
          onToggle={() => setLibCollapsed((v) => !v)}
          onStamp={handleStamp}
          disabled={readOnly}
        />

        <div className="relative min-h-0 min-w-0 flex-1">
          <div className="excalidraw-host absolute inset-0 h-full w-full">
            <Excalidraw
              excalidrawAPI={(api) => {
                apiRef.current = api;
                onApiReady(api);
              }}
              isCollaborating
              viewModeEnabled={readOnly}
              zenModeEnabled={false}
              gridModeEnabled={false}
              theme="dark"
              onPointerUpdate={(payload) => {
                onPointerUpdate?.({
                  pointer: payload.pointer,
                  button: payload.button,
                });
              }}
              onChange={(elements, appState: AppState, files) => {
                onSceneChange(elements, files);
                const found = findStructureFromSelection(
                  elements,
                  appState.selectedElementIds || {}
                );
                setSelectionSafe(
                  found
                    ? { structureId: found.structureId, kind: found.kind }
                    : null
                );
              }}
              UIOptions={{
                canvasActions: {
                  export: false,
                  loadScene: false,
                  saveToActiveFile: false,
                  toggleTheme: false,
                  clearCanvas: false,
                },
              }}
            />
          </div>
        </div>

        {selection && !readOnly && (
          <StructureInspector
            kind={selection.kind}
            structureId={selection.structureId}
            onClose={() => setSelection(null)}
            onAction={handleInspectorAction}
          />
        )}
      </div>
    </div>
  );
}
