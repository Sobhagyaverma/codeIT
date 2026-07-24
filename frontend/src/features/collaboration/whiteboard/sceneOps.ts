import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { readCodeit, codeitData, type CodeitMeta } from "./kinds";
import {
  runFactory,
  stampArray,
  stampDpTable,
  stampLinkedList,
  stampQueue,
  stampStack,
  type StampResult,
} from "./factories";
import { CELL_H, CELL_W, WB } from "./style";

type ExcalidrawElementSkeleton = NonNullable<
  Parameters<typeof convertToExcalidrawElements>[0]
>[number];

export function getViewportCenter(api: ExcalidrawImperativeAPI): {
  x: number;
  y: number;
} {
  const app = api.getAppState();
  const w = app.width || 800;
  const h = app.height || 600;
  const zoom = app.zoom?.value ?? 1;
  const x = (w / 2 - (app.scrollX || 0)) / zoom - 100;
  const y = (h / 2 - (app.scrollY || 0)) / zoom - 60;
  return { x, y };
}

export function stampOntoScene(
  api: ExcalidrawImperativeAPI,
  stamp: StampResult
): void {
  const existing = api.getSceneElements();
  const next = [...existing, ...stamp.elements];
  const selected: Record<string, true> = {};
  const root = stamp.elements.find(
    (el) =>
      readCodeit(el.customData as Record<string, unknown>)?.role === "root"
  );
  if (root) {
    selected[root.id] = true;
  } else if (stamp.elements[0]) {
    selected[stamp.elements[0].id] = true;
  }
  api.updateScene({
    elements: next,
    appState: {
      selectedElementIds: selected,
    },
  });
}

export function stampFactory(
  api: ExcalidrawImperativeAPI,
  factoryId: string,
  origin?: { x: number; y: number }
): StampResult | null {
  const o = origin ?? getViewportCenter(api);
  const stamp = runFactory(factoryId, o);
  if (!stamp) return null;
  stampOntoScene(api, stamp);
  return stamp;
}

export function findStructureFromSelection(
  elements: readonly ExcalidrawElement[],
  selectedIds: Record<string, boolean>
): { structureId: string; kind: CodeitMeta["kind"]; meta: CodeitMeta } | null {
  for (const el of elements) {
    if (!selectedIds[el.id] || el.isDeleted) continue;
    const meta = readCodeit(el.customData as Record<string, unknown>);
    if (meta) {
      return { structureId: meta.structureId, kind: meta.kind, meta };
    }
  }
  return null;
}

export function elementsForStructure(
  elements: readonly ExcalidrawElement[],
  structureId: string
): ExcalidrawElement[] {
  return elements.filter((el) => {
    if (el.isDeleted) return false;
    const m = readCodeit(el.customData as Record<string, unknown>);
    return m?.structureId === structureId;
  });
}

function replaceStructure(
  api: ExcalidrawImperativeAPI,
  structureId: string,
  replacement: ExcalidrawElement[]
): void {
  const existing = api.getSceneElements();
  const kept = existing.filter((el) => {
    const m = readCodeit(el.customData as Record<string, unknown>);
    return !m || m.structureId !== structureId;
  });
  const selected: Record<string, true> = {};
  for (const el of replacement) selected[el.id] = true;
  api.updateScene({
    elements: [...kept, ...replacement],
    appState: {
      ...api.getAppState(),
      selectedElementIds: selected,
    },
  });
}

function structureOrigin(
  els: ExcalidrawElement[]
): { x: number; y: number } {
  const nodes = els.filter((e) => e.type !== "arrow" && e.type !== "line");
  if (nodes.length === 0) return { x: 100, y: 100 };
  let minX = Infinity;
  let minY = Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
  }
  return { x: minX, y: minY + 28 };
}

export function pushStack(api: ExcalidrawImperativeAPI, structureId: string) {
  const all = elementsForStructure(api.getSceneElements(), structureId);
  const root = all.find(
    (e) => readCodeit(e.customData as Record<string, unknown>)?.role === "root"
  );
  const items =
    Number(readCodeit(root?.customData as Record<string, unknown>)?.props?.items) ||
    all.filter((e) => readCodeit(e.customData as Record<string, unknown>)?.role === "cell")
      .length;
  const origin = structureOrigin(all);
  const stamp = stampStack(
    { x: origin.x, y: origin.y - 28 },
    { items: items + 1 }
  );
  // keep new structureId? better rewrite with same id — remapping is complex; replace with new stamp
  replaceStructure(api, structureId, stamp.elements);
}

export function popStack(api: ExcalidrawImperativeAPI, structureId: string) {
  const all = elementsForStructure(api.getSceneElements(), structureId);
  const cells = all.filter(
    (e) => readCodeit(e.customData as Record<string, unknown>)?.role === "cell"
  );
  if (cells.length <= 1) return;
  const origin = structureOrigin(all);
  const stamp = stampStack(
    { x: origin.x, y: origin.y - 28 },
    { items: cells.length - 1 }
  );
  replaceStructure(api, structureId, stamp.elements);
}

export function enqueue(api: ExcalidrawImperativeAPI, structureId: string) {
  const all = elementsForStructure(api.getSceneElements(), structureId);
  const cells = all.filter(
    (e) => readCodeit(e.customData as Record<string, unknown>)?.role === "cell"
  );
  const origin = structureOrigin(all);
  const stamp = stampQueue(
    { x: origin.x, y: origin.y - 28 },
    { items: cells.length + 1 }
  );
  replaceStructure(api, structureId, stamp.elements);
}

export function dequeue(api: ExcalidrawImperativeAPI, structureId: string) {
  const all = elementsForStructure(api.getSceneElements(), structureId);
  const cells = all.filter(
    (e) => readCodeit(e.customData as Record<string, unknown>)?.role === "cell"
  );
  if (cells.length <= 1) return;
  const origin = structureOrigin(all);
  const stamp = stampQueue(
    { x: origin.x, y: origin.y - 28 },
    { items: cells.length - 1 }
  );
  replaceStructure(api, structureId, stamp.elements);
}

export function addArrayCell(api: ExcalidrawImperativeAPI, structureId: string) {
  const all = elementsForStructure(api.getSceneElements(), structureId);
  const cells = all.filter(
    (e) => readCodeit(e.customData as Record<string, unknown>)?.role === "cell"
  );
  const origin = structureOrigin(all);
  const stamp = stampArray(
    { x: origin.x, y: origin.y - 28 },
    { cells: cells.length + 1 }
  );
  replaceStructure(api, structureId, stamp.elements);
}

export function removeArrayCell(
  api: ExcalidrawImperativeAPI,
  structureId: string
) {
  const all = elementsForStructure(api.getSceneElements(), structureId);
  const cells = all.filter(
    (e) => readCodeit(e.customData as Record<string, unknown>)?.role === "cell"
  );
  if (cells.length <= 1) return;
  const origin = structureOrigin(all);
  const stamp = stampArray(
    { x: origin.x, y: origin.y - 28 },
    { cells: cells.length - 1 }
  );
  replaceStructure(api, structureId, stamp.elements);
}

export function appendListNode(
  api: ExcalidrawImperativeAPI,
  structureId: string,
  mode: "singly" | "doubly" | "circular"
) {
  const all = elementsForStructure(api.getSceneElements(), structureId);
  const nodes = all.filter((e) => {
    const m = readCodeit(e.customData as Record<string, unknown>);
    return m?.role === "node" && m.slot !== "null";
  });
  const origin = structureOrigin(all);
  const stamp = stampLinkedList(
    { x: origin.x, y: origin.y - 36 },
    mode,
    { nodes: nodes.length + 1 }
  );
  replaceStructure(api, structureId, stamp.elements);
}

export function deleteListNode(
  api: ExcalidrawImperativeAPI,
  structureId: string,
  mode: "singly" | "doubly" | "circular"
) {
  const all = elementsForStructure(api.getSceneElements(), structureId);
  const nodes = all.filter((e) => {
    const m = readCodeit(e.customData as Record<string, unknown>);
    return m?.role === "node" && m.slot !== "null";
  });
  if (nodes.length <= 1) return;
  const origin = structureOrigin(all);
  const stamp = stampLinkedList(
    { x: origin.x, y: origin.y - 36 },
    mode,
    { nodes: nodes.length - 1 }
  );
  replaceStructure(api, structureId, stamp.elements);
}

export function resizeDp(
  api: ExcalidrawImperativeAPI,
  structureId: string,
  rows: number,
  cols: number
) {
  const all = elementsForStructure(api.getSceneElements(), structureId);
  const origin = structureOrigin(all);
  const stamp = stampDpTable(
    { x: origin.x, y: origin.y - 28 },
    { rows, cols }
  );
  replaceStructure(api, structureId, stamp.elements);
}

/** Connect two selected nodes with a bound arrow. */
export function connectSelectedNodes(api: ExcalidrawImperativeAPI): boolean {
  const app = api.getAppState();
  const selected = Object.keys(app.selectedElementIds || {}).filter(
    (id) => app.selectedElementIds[id]
  );
  const elements = api.getSceneElements();
  const nodes: ExcalidrawElement[] = [];
  for (const id of selected) {
    const e = elements.find((el) => el.id === id);
    if (!e || e.isDeleted) continue;
    if (e.type === "arrow" || e.type === "line" || e.type === "selection")
      continue;
    const m = readCodeit(e.customData as Record<string, unknown>);
    if (m?.role === "node" || m?.role === "cell" || !m) {
      nodes.push(e);
    }
  }

  if (nodes.length !== 2) return false;
  const a = nodes[0];
  const b = nodes[1];
  const metaA = readCodeit(a.customData as Record<string, unknown>);
  const structureId = metaA?.structureId ?? `loose_${Date.now()}`;
  const kind = metaA?.kind ?? "graph_directed";

  const arrowId = `${structureId}_conn_${Date.now().toString(36)}`;
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "arrow",
      id: arrowId,
      x: 0,
      y: 0,
      strokeColor: WB.accent,
      strokeWidth: WB.strokeWidth,
      roughness: WB.roughness,
      start: { id: a.id },
      end: { id: b.id },
      endArrowhead: "arrow",
      customData: codeitData({
        kind,
        structureId,
        role: "edge",
        slot: arrowId,
      }),
    },
  ];
  const converted = convertToExcalidrawElements(skeleton, {
    regenerateIds: false,
  });
  api.updateScene({
    elements: [...elements, ...converted],
  });
  return true;
}

export function highlightSelectedCells(api: ExcalidrawImperativeAPI) {
  const app = api.getAppState();
  const selected = app.selectedElementIds || {};
  const elements = api.getSceneElements().map((el) => {
    if (!selected[el.id] || el.isDeleted) return el;
    const m = readCodeit(el.customData as Record<string, unknown>);
    if (m?.role !== "cell" && m?.role !== "node") return el;
    return {
      ...el,
      backgroundColor: WB.accentSoft,
      version: el.version + 1,
    };
  });
  api.updateScene({ elements });
}

void CELL_H;
void CELL_W;
