import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import {
  codeitData,
  makeStructureId,
  type CodeitStructureKind,
} from "./kinds";
import { CELL_H, CELL_W, GAP, NODE_R, WB } from "./style";

type ExcalidrawElementSkeleton = NonNullable<
  Parameters<typeof convertToExcalidrawElements>[0]
>[number];

export type StampResult = {
  elements: ExcalidrawElement[];
  structureId: string;
  kind: CodeitStructureKind;
};

type Origin = { x: number; y: number };

function convert(skeleton: ExcalidrawElementSkeleton[]): ExcalidrawElement[] {
  return convertToExcalidrawElements(skeleton, { regenerateIds: false });
}

function baseShape(
  type: "rectangle" | "ellipse" | "diamond",
  opts: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    bg?: string;
    stroke?: string;
    customData: ReturnType<typeof codeitData>;
  }
): ExcalidrawElementSkeleton {
  return {
    type,
    id: opts.id,
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    strokeColor: opts.stroke ?? WB.stroke,
    backgroundColor: opts.bg ?? WB.nodeFill,
    fillStyle: "solid",
    strokeWidth: WB.strokeWidth,
    roughness: WB.roughness,
    opacity: 100,
    label: opts.label
      ? {
          text: opts.label,
          fontSize: WB.fontSize,
          textAlign: "center",
          verticalAlign: "middle",
        }
      : undefined,
    customData: opts.customData,
  };
}

function arrowBetween(
  id: string,
  fromId: string,
  toId: string,
  structureId: string,
  kind: CodeitStructureKind,
  opts?: { endArrow?: boolean; label?: string; startArrow?: boolean }
): ExcalidrawElementSkeleton {
  return {
    type: "arrow",
    id,
    x: 0,
    y: 0,
    strokeColor: WB.accent,
    strokeWidth: WB.strokeWidth,
    roughness: WB.roughness,
    start: { id: fromId },
    end: { id: toId },
    startArrowhead: opts?.startArrow ? "arrow" : null,
    endArrowhead: opts?.endArrow === false ? null : "arrow",
    label: opts?.label ? { text: opts.label, fontSize: WB.fontSmall } : undefined,
    customData: codeitData({
      kind,
      structureId,
      role: "edge",
      slot: id,
    }),
  };
}

export function stampArray(
  origin: Origin,
  opts?: { cells?: number; values?: string[] }
): StampResult {
  const n = opts?.cells ?? 5;
  const values = opts?.values ?? Array.from({ length: n }, (_, i) => String(i));
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "array";
  const skeleton: ExcalidrawElementSkeleton[] = [];

  skeleton.push({
    type: "text",
    id: `${structureId}_title`,
    x: origin.x,
    y: origin.y - 28,
    text: "Array",
    fontSize: WB.fontSmall,
    strokeColor: WB.accent,
    customData: codeitData({
      kind,
      structureId,
      role: "label",
      slot: "title",
    }),
  });

  for (let i = 0; i < n; i++) {
    const id = `${structureId}_c${i}`;
    skeleton.push(
      baseShape("rectangle", {
        id,
        x: origin.x + i * (CELL_W + 4),
        y: origin.y,
        width: CELL_W,
        height: CELL_H,
        label: values[i] ?? "",
        customData: codeitData({
          kind,
          structureId,
          role: "cell",
          slot: String(i),
          props: { index: i },
        }),
      })
    );
    skeleton.push({
      type: "text",
      id: `${structureId}_i${i}`,
      x: origin.x + i * (CELL_W + 4) + CELL_W / 2 - 4,
      y: origin.y + CELL_H + 6,
      text: String(i),
      fontSize: WB.fontSmall,
      strokeColor: WB.strokeMuted,
      customData: codeitData({
        kind,
        structureId,
        role: "label",
        slot: `idx-${i}`,
      }),
    });
  }

  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 8,
      y: origin.y - 8,
      width: n * (CELL_W + 4) + 12,
      height: CELL_H + 36,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({
        kind,
        structureId,
        role: "root",
        props: { cells: n },
      }),
    })
  );

  return { elements: convert(skeleton), structureId, kind };
}

export function stampArray2d(
  origin: Origin,
  opts?: { rows?: number; cols?: number }
): StampResult {
  const rows = opts?.rows ?? 3;
  const cols = opts?.cols ?? 4;
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "array2d";
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 28,
      text: `Matrix ${rows}×${cols}`,
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const slot = `${r},${c}`;
      skeleton.push(
        baseShape("rectangle", {
          id: `${structureId}_c${r}_${c}`,
          x: origin.x + c * (CELL_W + 4),
          y: origin.y + r * (CELL_H + 4),
          width: CELL_W,
          height: CELL_H,
          label: "0",
          customData: codeitData({
            kind,
            structureId,
            role: "cell",
            slot,
            props: { row: r, col: c },
          }),
        })
      );
    }
  }

  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 8,
      y: origin.y - 8,
      width: cols * (CELL_W + 4) + 12,
      height: rows * (CELL_H + 4) + 12,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({
        kind,
        structureId,
        role: "root",
        props: { rows, cols },
      }),
    })
  );

  return { elements: convert(skeleton), structureId, kind };
}

export function stampDpTable(
  origin: Origin,
  opts?: { rows?: number; cols?: number }
): StampResult {
  const rows = opts?.rows ?? 5;
  const cols = opts?.cols ?? 5;
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "dp_table";
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 28,
      text: `DP Table ${rows}×${cols}`,
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      skeleton.push(
        baseShape("rectangle", {
          id: `${structureId}_c${r}_${c}`,
          x: origin.x + c * (CELL_W + 2),
          y: origin.y + r * (CELL_H + 2),
          width: CELL_W,
          height: CELL_H,
          label: "",
          bg: WB.fill,
          customData: codeitData({
            kind,
            structureId,
            role: "cell",
            slot: `${r},${c}`,
            props: { row: r, col: c },
          }),
        })
      );
    }
  }

  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 8,
      y: origin.y - 8,
      width: cols * (CELL_W + 2) + 12,
      height: rows * (CELL_H + 2) + 12,
      bg: "transparent",
      stroke: WB.accentSoft,
      customData: codeitData({
        kind,
        structureId,
        role: "root",
        props: { rows, cols },
      }),
    })
  );

  return { elements: convert(skeleton), structureId, kind };
}

type LlMode = "singly" | "doubly" | "circular";

export function stampLinkedList(
  origin: Origin,
  mode: LlMode = "singly",
  opts?: { nodes?: number }
): StampResult {
  const n = opts?.nodes ?? 4;
  const structureId = makeStructureId();
  const kind: CodeitStructureKind =
    mode === "doubly"
      ? "linked_list_doubly"
      : mode === "circular"
        ? "linked_list_circular"
        : "linked_list_singly";

  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 36,
      text:
        mode === "doubly"
          ? "Doubly Linked List"
          : mode === "circular"
            ? "Circular Linked List"
            : "Singly Linked List",
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];

  const nodeIds: string[] = [];
  for (let i = 0; i < n; i++) {
    const id = `${structureId}_n${i}`;
    nodeIds.push(id);
    skeleton.push(
      baseShape("rectangle", {
        id,
        x: origin.x + i * (CELL_W + 48),
        y: origin.y,
        width: CELL_W + 12,
        height: CELL_H + 8,
        label: String(i + 1),
        customData: codeitData({
          kind,
          structureId,
          role: "node",
          slot: String(i),
          props: { index: i },
        }),
      })
    );
  }

  for (let i = 0; i < n - 1; i++) {
    skeleton.push(
      arrowBetween(
        `${structureId}_e${i}`,
        nodeIds[i],
        nodeIds[i + 1],
        structureId,
        kind,
        { startArrow: mode === "doubly" }
      )
    );
  }

  if (mode === "circular" && n > 1) {
    skeleton.push(
      arrowBetween(
        `${structureId}_ecirc`,
        nodeIds[n - 1],
        nodeIds[0],
        structureId,
        kind
      )
    );
  }

  // null terminator for singly
  if (mode === "singly") {
    const nullId = `${structureId}_null`;
    skeleton.push(
      baseShape("ellipse", {
        id: nullId,
        x: origin.x + n * (CELL_W + 48),
        y: origin.y + 4,
        width: 40,
        height: 32,
        label: "∅",
        bg: WB.fillAlt,
        customData: codeitData({
          kind,
          structureId,
          role: "node",
          slot: "null",
        }),
      })
    );
    skeleton.push(
      arrowBetween(
        `${structureId}_enull`,
        nodeIds[n - 1],
        nullId,
        structureId,
        kind
      )
    );
  }

  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 12,
      y: origin.y - 12,
      width: (n + (mode === "singly" ? 1 : 0)) * (CELL_W + 48) + 20,
      height: CELL_H + 40,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({
        kind,
        structureId,
        role: "root",
        props: { nodes: n, mode },
      }),
    })
  );

  return { elements: convert(skeleton), structureId, kind };
}

export function stampBinaryTree(origin: Origin): StampResult {
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "binary_tree";
  // depth-2 complete: slots 0..6 heap indexing
  const positions: Record<number, { x: number; y: number }> = {
    0: { x: origin.x + 160, y: origin.y },
    1: { x: origin.x + 60, y: origin.y + 90 },
    2: { x: origin.x + 260, y: origin.y + 90 },
    3: { x: origin.x, y: origin.y + 180 },
    4: { x: origin.x + 120, y: origin.y + 180 },
    5: { x: origin.x + 200, y: origin.y + 180 },
    6: { x: origin.x + 320, y: origin.y + 180 },
  };
  const labels = ["1", "2", "3", "4", "5", "6", "7"];
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 32,
      text: "Binary Tree",
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];

  const d = NODE_R * 2;
  for (let i = 0; i < 7; i++) {
    const p = positions[i];
    skeleton.push(
      baseShape("ellipse", {
        id: `${structureId}_n${i}`,
        x: p.x,
        y: p.y,
        width: d,
        height: d,
        label: labels[i],
        customData: codeitData({
          kind,
          structureId,
          role: "node",
          slot: String(i),
          parentSlot: i === 0 ? undefined : String(Math.floor((i - 1) / 2)),
          props: { index: i },
        }),
      })
    );
  }

  for (let i = 1; i < 7; i++) {
    const parent = Math.floor((i - 1) / 2);
    skeleton.push(
      arrowBetween(
        `${structureId}_e${i}`,
        `${structureId}_n${parent}`,
        `${structureId}_n${i}`,
        structureId,
        kind,
        { endArrow: false }
      )
    );
  }

  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 16,
      y: origin.y - 16,
      width: 400,
      height: 260,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({
        kind,
        structureId,
        role: "root",
        props: { nodes: 7 },
      }),
    })
  );

  return { elements: convert(skeleton), structureId, kind };
}

export function stampGraph(
  origin: Origin,
  mode: "undirected" | "directed" | "weighted" | "dag" = "undirected"
): StampResult {
  const structureId = makeStructureId();
  const kind: CodeitStructureKind =
    mode === "directed"
      ? "graph_directed"
      : mode === "weighted"
        ? "graph_weighted"
        : mode === "dag"
          ? "dag"
          : "graph_undirected";

  const nodes = [
    { slot: "0", x: origin.x + 80, y: origin.y, label: "A" },
    { slot: "1", x: origin.x, y: origin.y + 100, label: "B" },
    { slot: "2", x: origin.x + 160, y: origin.y + 100, label: "C" },
    { slot: "3", x: origin.x + 80, y: origin.y + 200, label: "D" },
  ];
  const edges: [string, string, string?][] =
    mode === "dag"
      ? [
          ["0", "1"],
          ["0", "2"],
          ["1", "3"],
          ["2", "3"],
        ]
      : [
          ["0", "1", mode === "weighted" ? "2" : undefined],
          ["0", "2", mode === "weighted" ? "5" : undefined],
          ["1", "3", mode === "weighted" ? "1" : undefined],
          ["2", "3", mode === "weighted" ? "3" : undefined],
          ...(mode === "undirected" || mode === "weighted"
            ? ([["1", "2", mode === "weighted" ? "4" : undefined]] as [
                string,
                string,
                string?,
              ][])
            : []),
        ];

  const title =
    mode === "directed"
      ? "Directed Graph"
      : mode === "weighted"
        ? "Weighted Graph"
        : mode === "dag"
          ? "DAG"
          : "Undirected Graph";

  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 32,
      text: title,
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];

  const d = NODE_R * 2;
  for (const n of nodes) {
    skeleton.push(
      baseShape("ellipse", {
        id: `${structureId}_n${n.slot}`,
        x: n.x,
        y: n.y,
        width: d,
        height: d,
        label: n.label,
        customData: codeitData({
          kind,
          structureId,
          role: "node",
          slot: n.slot,
        }),
      })
    );
  }

  edges.forEach(([a, b, w], i) => {
    skeleton.push(
      arrowBetween(
        `${structureId}_e${i}`,
        `${structureId}_n${a}`,
        `${structureId}_n${b}`,
        structureId,
        kind,
        {
          endArrow: mode !== "undirected",
          label: w,
        }
      )
    );
  });

  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 20,
      y: origin.y - 20,
      width: 240,
      height: 280,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({
        kind,
        structureId,
        role: "root",
        props: { mode, nodes: nodes.length },
      }),
    })
  );

  return { elements: convert(skeleton), structureId, kind };
}

export function stampStack(origin: Origin, opts?: { items?: number }): StampResult {
  const n = opts?.items ?? 3;
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "stack";
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 28,
      text: "Stack  TOP ↑",
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];

  for (let i = 0; i < n; i++) {
    // top of stack visually at top: index n-1 is top
    const fromBottom = i;
    skeleton.push(
      baseShape("rectangle", {
        id: `${structureId}_c${fromBottom}`,
        x: origin.x,
        y: origin.y + (n - 1 - fromBottom) * (CELL_H + 4),
        width: CELL_W + 24,
        height: CELL_H,
        label: String(fromBottom + 1),
        customData: codeitData({
          kind,
          structureId,
          role: "cell",
          slot: String(fromBottom),
          props: { index: fromBottom },
        }),
      })
    );
  }

  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 10,
      y: origin.y - 10,
      width: CELL_W + 44,
      height: n * (CELL_H + 4) + 16,
      bg: "transparent",
      stroke: WB.strokeMuted,
      customData: codeitData({
        kind,
        structureId,
        role: "root",
        props: { items: n },
      }),
    })
  );

  return { elements: convert(skeleton), structureId, kind };
}

export function stampQueue(origin: Origin, opts?: { items?: number }): StampResult {
  const n = opts?.items ?? 4;
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "queue";
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 28,
      text: "Queue  FRONT → … → BACK",
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];

  for (let i = 0; i < n; i++) {
    skeleton.push(
      baseShape("rectangle", {
        id: `${structureId}_c${i}`,
        x: origin.x + i * (CELL_W + 8),
        y: origin.y,
        width: CELL_W,
        height: CELL_H,
        label: String(i + 1),
        customData: codeitData({
          kind,
          structureId,
          role: "cell",
          slot: String(i),
          props: { index: i },
        }),
      })
    );
  }

  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 10,
      y: origin.y - 10,
      width: n * (CELL_W + 8) + 12,
      height: CELL_H + 20,
      bg: "transparent",
      stroke: WB.strokeMuted,
      customData: codeitData({
        kind,
        structureId,
        role: "root",
        props: { items: n },
      }),
    })
  );

  return { elements: convert(skeleton), structureId, kind };
}

export function stampPriorityQueue(origin: Origin): StampResult {
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "priority_queue";
  // mini heap triangle of 3
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 28,
      text: "Priority Queue (Min)",
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];
  const d = NODE_R * 2;
  const nodes = [
    { slot: "0", x: origin.x + 70, y: origin.y, label: "1" },
    { slot: "1", x: origin.x, y: origin.y + 80, label: "3" },
    { slot: "2", x: origin.x + 140, y: origin.y + 80, label: "5" },
  ];
  for (const n of nodes) {
    skeleton.push(
      baseShape("ellipse", {
        id: `${structureId}_n${n.slot}`,
        x: n.x,
        y: n.y,
        width: d,
        height: d,
        label: n.label,
        customData: codeitData({
          kind,
          structureId,
          role: "node",
          slot: n.slot,
        }),
      })
    );
  }
  skeleton.push(
    arrowBetween(
      `${structureId}_e1`,
      `${structureId}_n0`,
      `${structureId}_n1`,
      structureId,
      kind,
      { endArrow: false }
    )
  );
  skeleton.push(
    arrowBetween(
      `${structureId}_e2`,
      `${structureId}_n0`,
      `${structureId}_n2`,
      structureId,
      kind,
      { endArrow: false }
    )
  );
  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 12,
      y: origin.y - 12,
      width: 220,
      height: 160,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({ kind, structureId, role: "root" }),
    })
  );
  return { elements: convert(skeleton), structureId, kind };
}

export function stampHashMap(origin: Origin): StampResult {
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "hashmap";
  const pairs = [
    ["key", "val"],
    ["a", "1"],
    ["b", "2"],
    ["c", "3"],
  ];
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 28,
      text: "HashMap",
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];
  pairs.forEach(([k, v], i) => {
    skeleton.push(
      baseShape("rectangle", {
        id: `${structureId}_k${i}`,
        x: origin.x,
        y: origin.y + i * (CELL_H + 6),
        width: 70,
        height: CELL_H,
        label: k,
        bg: WB.fill,
        customData: codeitData({
          kind,
          structureId,
          role: "cell",
          slot: `k${i}`,
        }),
      })
    );
    skeleton.push(
      baseShape("rectangle", {
        id: `${structureId}_v${i}`,
        x: origin.x + 78,
        y: origin.y + i * (CELL_H + 6),
        width: 70,
        height: CELL_H,
        label: v,
        customData: codeitData({
          kind,
          structureId,
          role: "cell",
          slot: `v${i}`,
        }),
      })
    );
  });
  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 8,
      y: origin.y - 8,
      width: 164,
      height: pairs.length * (CELL_H + 6) + 8,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({
        kind,
        structureId,
        role: "root",
        props: { entries: pairs.length - 1 },
      }),
    })
  );
  return { elements: convert(skeleton), structureId, kind };
}

export function stampHashSet(origin: Origin): StampResult {
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "hashset";
  const vals = ["a", "b", "c", "d"];
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 28,
      text: "HashSet",
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];
  vals.forEach((v, i) => {
    skeleton.push(
      baseShape("ellipse", {
        id: `${structureId}_c${i}`,
        x: origin.x + (i % 2) * 70,
        y: origin.y + Math.floor(i / 2) * 60,
        width: 56,
        height: 40,
        label: v,
        customData: codeitData({
          kind,
          structureId,
          role: "cell",
          slot: String(i),
        }),
      })
    );
  });
  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 8,
      y: origin.y - 8,
      width: 150,
      height: 130,
      bg: "transparent",
      stroke: WB.strokeMuted,
      customData: codeitData({ kind, structureId, role: "root" }),
    })
  );
  return { elements: convert(skeleton), structureId, kind };
}

export function stampRecursionTree(origin: Origin): StampResult {
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "recursion_tree";
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 28,
      text: "Recursion Tree",
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];
  const frames = [
    { slot: "0", x: origin.x + 100, y: origin.y, label: "f(n)" },
    { slot: "1", x: origin.x, y: origin.y + 90, label: "f(n-1)" },
    { slot: "2", x: origin.x + 200, y: origin.y + 90, label: "f(n-2)" },
    { slot: "3", x: origin.x - 40, y: origin.y + 180, label: "…" },
    { slot: "4", x: origin.x + 60, y: origin.y + 180, label: "…" },
  ];
  for (const f of frames) {
    skeleton.push(
      baseShape("rectangle", {
        id: `${structureId}_n${f.slot}`,
        x: f.x,
        y: f.y,
        width: 72,
        height: 36,
        label: f.label,
        bg: WB.fill,
        customData: codeitData({
          kind,
          structureId,
          role: "node",
          slot: f.slot,
        }),
      })
    );
  }
  for (const [p, c] of [
    ["0", "1"],
    ["0", "2"],
    ["1", "3"],
    ["1", "4"],
  ] as const) {
    skeleton.push(
      arrowBetween(
        `${structureId}_e${p}_${c}`,
        `${structureId}_n${p}`,
        `${structureId}_n${c}`,
        structureId,
        kind,
        { endArrow: false }
      )
    );
  }
  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 50,
      y: origin.y - 12,
      width: 340,
      height: 240,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({ kind, structureId, role: "root" }),
    })
  );
  return { elements: convert(skeleton), structureId, kind };
}

export function stampHeap(origin: Origin): StampResult {
  const r = stampBinaryTree(origin);
  // retag as heap — rebuild with heap title via fresh stamp
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "heap";
  const tree = stampBinaryTree(origin);
  // simpler: use binary tree positions but change labels
  void r;
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 32,
      text: "Min Heap",
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];
  const labels = ["1", "3", "5", "7", "9", "8", "6"];
  const positions: Record<number, { x: number; y: number }> = {
    0: { x: origin.x + 160, y: origin.y },
    1: { x: origin.x + 60, y: origin.y + 90 },
    2: { x: origin.x + 260, y: origin.y + 90 },
    3: { x: origin.x, y: origin.y + 180 },
    4: { x: origin.x + 120, y: origin.y + 180 },
    5: { x: origin.x + 200, y: origin.y + 180 },
    6: { x: origin.x + 320, y: origin.y + 180 },
  };
  const d = NODE_R * 2;
  for (let i = 0; i < 7; i++) {
    const p = positions[i];
    skeleton.push(
      baseShape("ellipse", {
        id: `${structureId}_n${i}`,
        x: p.x,
        y: p.y,
        width: d,
        height: d,
        label: labels[i],
        customData: codeitData({
          kind,
          structureId,
          role: "node",
          slot: String(i),
        }),
      })
    );
  }
  for (let i = 1; i < 7; i++) {
    const parent = Math.floor((i - 1) / 2);
    skeleton.push(
      arrowBetween(
        `${structureId}_e${i}`,
        `${structureId}_n${parent}`,
        `${structureId}_n${i}`,
        structureId,
        kind,
        { endArrow: false }
      )
    );
  }
  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 16,
      y: origin.y - 16,
      width: 400,
      height: 260,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({ kind, structureId, role: "root" }),
    })
  );
  void tree;
  return { elements: convert(skeleton), structureId, kind };
}

export function stampTrie(origin: Origin): StampResult {
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "trie";
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 28,
      text: "Trie",
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];
  const nodes = [
    { slot: "root", x: origin.x + 80, y: origin.y, label: "∅" },
    { slot: "c", x: origin.x + 20, y: origin.y + 80, label: "c" },
    { slot: "a", x: origin.x + 140, y: origin.y + 80, label: "a" },
    { slot: "at", x: origin.x + 100, y: origin.y + 160, label: "t*" },
    { slot: "ca", x: origin.x - 20, y: origin.y + 160, label: "a" },
    { slot: "cat", x: origin.x - 20, y: origin.y + 240, label: "t*" },
  ];
  for (const n of nodes) {
    skeleton.push(
      baseShape("ellipse", {
        id: `${structureId}_n${n.slot}`,
        x: n.x,
        y: n.y,
        width: 48,
        height: 40,
        label: n.label,
        customData: codeitData({
          kind,
          structureId,
          role: "node",
          slot: n.slot,
        }),
      })
    );
  }
  for (const [a, b] of [
    ["root", "c"],
    ["root", "a"],
    ["a", "at"],
    ["c", "ca"],
    ["ca", "cat"],
  ] as const) {
    skeleton.push(
      arrowBetween(
        `${structureId}_e${a}_${b}`,
        `${structureId}_n${a}`,
        `${structureId}_n${b}`,
        structureId,
        kind,
        { endArrow: false }
      )
    );
  }
  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 40,
      y: origin.y - 12,
      width: 260,
      height: 300,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({ kind, structureId, role: "root" }),
    })
  );
  return { elements: convert(skeleton), structureId, kind };
}

export function stampGenericTree(origin: Origin): StampResult {
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "generic_tree";
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_title`,
      x: origin.x,
      y: origin.y - 28,
      text: "N-ary Tree",
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({ kind, structureId, role: "label", slot: "title" }),
    },
  ];
  const nodes = [
    { slot: "0", x: origin.x + 100, y: origin.y, label: "1" },
    { slot: "1", x: origin.x, y: origin.y + 100, label: "2" },
    { slot: "2", x: origin.x + 100, y: origin.y + 100, label: "3" },
    { slot: "3", x: origin.x + 200, y: origin.y + 100, label: "4" },
  ];
  for (const n of nodes) {
    skeleton.push(
      baseShape("ellipse", {
        id: `${structureId}_n${n.slot}`,
        x: n.x,
        y: n.y,
        width: 48,
        height: 48,
        label: n.label,
        customData: codeitData({
          kind,
          structureId,
          role: "node",
          slot: n.slot,
        }),
      })
    );
  }
  for (const c of ["1", "2", "3"]) {
    skeleton.push(
      arrowBetween(
        `${structureId}_e${c}`,
        `${structureId}_n0`,
        `${structureId}_n${c}`,
        structureId,
        kind,
        { endArrow: false }
      )
    );
  }
  skeleton.push(
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 16,
      y: origin.y - 12,
      width: 280,
      height: 180,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({ kind, structureId, role: "root" }),
    })
  );
  return { elements: convert(skeleton), structureId, kind };
}

function stampFlowNode(
  origin: Origin,
  kind: CodeitStructureKind,
  shape: "ellipse" | "rectangle" | "diamond",
  label: string,
  w = 100,
  h = 48
): StampResult {
  const structureId = makeStructureId();
  const skeleton: ExcalidrawElementSkeleton[] = [
    baseShape(shape, {
      id: `${structureId}_n0`,
      x: origin.x,
      y: origin.y,
      width: w,
      height: h,
      label,
      bg: shape === "diamond" ? WB.accentSoft : WB.nodeFill,
      customData: codeitData({
        kind,
        structureId,
        role: "node",
        slot: "0",
      }),
    }),
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 8,
      y: origin.y - 8,
      width: w + 16,
      height: h + 16,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({ kind, structureId, role: "root" }),
    }),
  ];
  return { elements: convert(skeleton), structureId, kind };
}

export function stampFlowStart(o: Origin) {
  return stampFlowNode(o, "flow_start", "ellipse", "Start", 90, 44);
}
export function stampFlowEnd(o: Origin) {
  return stampFlowNode(o, "flow_end", "ellipse", "End", 90, 44);
}
export function stampFlowProcess(o: Origin) {
  return stampFlowNode(o, "flow_process", "rectangle", "Process", 110, 48);
}
export function stampFlowDecision(o: Origin) {
  return stampFlowNode(o, "flow_decision", "diamond", "Decision?", 120, 80);
}
export function stampFlowLoop(o: Origin) {
  return stampFlowNode(o, "flow_loop", "rectangle", "Loop", 100, 48);
}
export function stampFlowIo(o: Origin) {
  return stampFlowNode(o, "flow_io", "rectangle", "Input/Output", 120, 48);
}

function stampSysCard(
  origin: Origin,
  kind: CodeitStructureKind,
  label: string
): StampResult {
  const structureId = makeStructureId();
  const w = 130;
  const h = 56;
  const skeleton: ExcalidrawElementSkeleton[] = [
    baseShape("rectangle", {
      id: `${structureId}_n0`,
      x: origin.x,
      y: origin.y,
      width: w,
      height: h,
      label,
      bg: WB.sys,
      stroke: WB.accent,
      customData: codeitData({
        kind,
        structureId,
        role: "node",
        slot: "0",
      }),
    }),
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 6,
      y: origin.y - 6,
      width: w + 12,
      height: h + 12,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({ kind, structureId, role: "root" }),
    }),
  ];
  return { elements: convert(skeleton), structureId, kind };
}

export const stampSys = {
  client: (o: Origin) => stampSysCard(o, "sys_client", "Client"),
  gateway: (o: Origin) => stampSysCard(o, "sys_gateway", "API Gateway"),
  lb: (o: Origin) => stampSysCard(o, "sys_lb", "Load Balancer"),
  server: (o: Origin) => stampSysCard(o, "sys_server", "Server"),
  db: (o: Origin) => stampSysCard(o, "sys_db", "Database"),
  cache: (o: Origin) => stampSysCard(o, "sys_cache", "Cache"),
  redis: (o: Origin) => stampSysCard(o, "sys_redis", "Redis"),
  queue: (o: Origin) => stampSysCard(o, "sys_queue", "Message Queue"),
  worker: (o: Origin) => stampSysCard(o, "sys_worker", "Worker"),
  storage: (o: Origin) => stampSysCard(o, "sys_storage", "Storage"),
  microservice: (o: Origin) =>
    stampSysCard(o, "sys_microservice", "Microservice"),
  cdn: (o: Origin) => stampSysCard(o, "sys_cdn", "CDN"),
  auth: (o: Origin) => stampSysCard(o, "sys_auth", "Auth"),
};

export function stampSticky(origin: Origin, text = "Note"): StampResult {
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "sticky";
  const skeleton: ExcalidrawElementSkeleton[] = [
    baseShape("rectangle", {
      id: `${structureId}_n0`,
      x: origin.x,
      y: origin.y,
      width: 160,
      height: 120,
      label: text,
      bg: WB.sticky,
      stroke: "#e0c35a",
      customData: codeitData({
        kind,
        structureId,
        role: "node",
        slot: "0",
      }),
    }),
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 4,
      y: origin.y - 4,
      width: 168,
      height: 128,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({ kind, structureId, role: "root" }),
    }),
  ];
  return { elements: convert(skeleton), structureId, kind };
}

export function stampCodeBlock(
  origin: Origin,
  lang = "python"
): StampResult {
  const structureId = makeStructureId();
  const kind: CodeitStructureKind = "code_block";
  const sample =
    lang === "java"
      ? "public int solve() {\n  // ...\n}"
      : lang === "cpp"
        ? "int solve() {\n  // ...\n}"
        : "def solve():\n    # ...";
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      id: `${structureId}_lang`,
      x: origin.x + 8,
      y: origin.y + 6,
      text: lang,
      fontSize: WB.fontSmall,
      strokeColor: WB.accent,
      customData: codeitData({
        kind,
        structureId,
        role: "label",
        slot: "lang",
      }),
    },
    baseShape("rectangle", {
      id: `${structureId}_n0`,
      x: origin.x,
      y: origin.y,
      width: 220,
      height: 120,
      label: sample,
      bg: "#0d1117",
      stroke: WB.strokeMuted,
      customData: codeitData({
        kind,
        structureId,
        role: "node",
        slot: "0",
        props: { lang },
      }),
    }),
    baseShape("rectangle", {
      id: `${structureId}_root`,
      x: origin.x - 4,
      y: origin.y - 4,
      width: 228,
      height: 128,
      bg: "transparent",
      stroke: "transparent",
      customData: codeitData({ kind, structureId, role: "root" }),
    }),
  ];
  return { elements: convert(skeleton), structureId, kind };
}

export type LibraryFactoryId = string;

export function runFactory(
  factoryId: string,
  origin: Origin
): StampResult | null {
  switch (factoryId) {
    case "array":
      return stampArray(origin);
    case "array_dynamic":
      return stampArray(origin, { cells: 6 });
    case "array2d":
      return stampArray2d(origin);
    case "matrix":
      return stampArray2d(origin, { rows: 4, cols: 4 });
    case "grid":
      return stampArray2d(origin, { rows: 5, cols: 5 });
    case "ll_singly":
      return stampLinkedList(origin, "singly");
    case "ll_doubly":
      return stampLinkedList(origin, "doubly");
    case "ll_circular":
      return stampLinkedList(origin, "circular");
    case "binary_tree":
      return stampBinaryTree(origin);
    case "bst":
      return stampBinaryTree(origin); // same layout; title differs in dedicated stamp
    case "heap":
      return stampHeap(origin);
    case "trie":
      return stampTrie(origin);
    case "generic_tree":
      return stampGenericTree(origin);
    case "graph_undirected":
      return stampGraph(origin, "undirected");
    case "graph_directed":
      return stampGraph(origin, "directed");
    case "graph_weighted":
      return stampGraph(origin, "weighted");
    case "dag":
      return stampGraph(origin, "dag");
    case "stack":
      return stampStack(origin);
    case "queue":
      return stampQueue(origin);
    case "priority_queue":
      return stampPriorityQueue(origin);
    case "hashmap":
      return stampHashMap(origin);
    case "hashset":
      return stampHashSet(origin);
    case "dp_2":
      return stampDpTable(origin, { rows: 2, cols: 2 });
    case "dp_5":
      return stampDpTable(origin, { rows: 5, cols: 5 });
    case "dp_10":
      return stampDpTable(origin, { rows: 10, cols: 10 });
    case "recursion_tree":
      return stampRecursionTree(origin);
    case "flow_start":
      return stampFlowStart(origin);
    case "flow_end":
      return stampFlowEnd(origin);
    case "flow_process":
      return stampFlowProcess(origin);
    case "flow_decision":
      return stampFlowDecision(origin);
    case "flow_loop":
      return stampFlowLoop(origin);
    case "flow_io":
      return stampFlowIo(origin);
    case "sys_client":
      return stampSys.client(origin);
    case "sys_gateway":
      return stampSys.gateway(origin);
    case "sys_lb":
      return stampSys.lb(origin);
    case "sys_server":
      return stampSys.server(origin);
    case "sys_db":
      return stampSys.db(origin);
    case "sys_cache":
      return stampSys.cache(origin);
    case "sys_redis":
      return stampSys.redis(origin);
    case "sys_queue":
      return stampSys.queue(origin);
    case "sys_worker":
      return stampSys.worker(origin);
    case "sys_storage":
      return stampSys.storage(origin);
    case "sys_microservice":
      return stampSys.microservice(origin);
    case "sys_cdn":
      return stampSys.cdn(origin);
    case "sys_auth":
      return stampSys.auth(origin);
    case "sticky":
      return stampSticky(origin, "Complexity / notes");
    case "sticky_todo":
      return stampSticky(origin, "TODO");
    case "sticky_edge":
      return stampSticky(origin, "Edge cases");
    case "code_python":
      return stampCodeBlock(origin, "python");
    case "code_java":
      return stampCodeBlock(origin, "java");
    case "code_cpp":
      return stampCodeBlock(origin, "cpp");
    default:
      return null;
  }
}

void GAP;
