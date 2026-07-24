import type { CodeitStructureKind } from "./kinds";

type Props = {
  kind: CodeitStructureKind;
  structureId: string;
  onClose: () => void;
  onAction: (action: string) => void;
};

function actionsFor(kind: CodeitStructureKind): { id: string; label: string }[] {
  switch (kind) {
    case "array":
    case "array2d":
      return [
        { id: "add_cell", label: "Add cell" },
        { id: "remove_cell", label: "Remove cell" },
        { id: "highlight", label: "Highlight" },
        { id: "connect", label: "Connect 2 selected" },
      ];
    case "linked_list_singly":
    case "linked_list_doubly":
    case "linked_list_circular":
      return [
        { id: "append_node", label: "Add node" },
        { id: "delete_node", label: "Delete node" },
        { id: "connect", label: "Connect 2 selected" },
      ];
    case "stack":
      return [
        { id: "push", label: "Push" },
        { id: "pop", label: "Pop" },
        { id: "highlight", label: "Highlight" },
      ];
    case "queue":
      return [
        { id: "enqueue", label: "Enqueue" },
        { id: "dequeue", label: "Dequeue" },
        { id: "highlight", label: "Highlight" },
      ];
    case "dp_table":
      return [
        { id: "dp_2", label: "Resize 2×2" },
        { id: "dp_5", label: "Resize 5×5" },
        { id: "dp_10", label: "Resize 10×10" },
        { id: "highlight", label: "Highlight" },
      ];
    case "binary_tree":
    case "bst":
    case "heap":
    case "trie":
    case "generic_tree":
    case "recursion_tree":
    case "graph_undirected":
    case "graph_directed":
    case "graph_weighted":
    case "dag":
      return [
        { id: "connect", label: "Connect 2 selected" },
        { id: "highlight", label: "Highlight" },
      ];
    default:
      return [
        { id: "connect", label: "Connect 2 selected" },
        { id: "highlight", label: "Highlight" },
      ];
  }
}

const KIND_LABEL: Partial<Record<CodeitStructureKind, string>> = {
  array: "Array",
  array2d: "Matrix",
  linked_list_singly: "Singly Linked List",
  linked_list_doubly: "Doubly Linked List",
  linked_list_circular: "Circular Linked List",
  binary_tree: "Binary Tree",
  stack: "Stack",
  queue: "Queue",
  dp_table: "DP Table",
  recursion_tree: "Recursion Tree",
  graph_undirected: "Graph",
  graph_directed: "Directed Graph",
};

export default function StructureInspector({
  kind,
  structureId,
  onClose,
  onAction,
}: Props) {
  const actions = actionsFor(kind);

  return (
    <aside className="flex w-52 shrink-0 flex-col border-l border-[var(--line)] bg-[var(--bg-raised)]/50">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-2 py-1.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
            Structure
          </p>
          <p className="text-xs font-semibold text-[var(--text)]">
            {KIND_LABEL[kind] || kind}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1 p-2">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onAction(a.id)}
            className="w-full rounded-md border border-[var(--line)] px-2 py-1.5 text-left text-xs text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
          >
            {a.label}
          </button>
        ))}
      </div>
      <p className="mt-auto border-t border-[var(--line)] px-2 py-1.5 text-[10px] text-[var(--text-dim)]">
        Double-click text to edit values. Select two nodes → Connect.
        <span className="mt-1 block opacity-60">id: {structureId.slice(0, 10)}…</span>
      </p>
    </aside>
  );
}
