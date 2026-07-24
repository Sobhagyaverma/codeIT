/** CodeIT DSA structure metadata stamped onto Excalidraw elements. */

export const CODEIT_WB_VERSION = 1;

export type CodeitStructureKind =
  | "array"
  | "array2d"
  | "linked_list_singly"
  | "linked_list_doubly"
  | "linked_list_circular"
  | "binary_tree"
  | "bst"
  | "heap"
  | "trie"
  | "generic_tree"
  | "graph_undirected"
  | "graph_directed"
  | "graph_weighted"
  | "dag"
  | "stack"
  | "queue"
  | "priority_queue"
  | "hashmap"
  | "hashset"
  | "dp_table"
  | "recursion_tree"
  | "flow_start"
  | "flow_end"
  | "flow_process"
  | "flow_decision"
  | "flow_loop"
  | "flow_io"
  | "sys_client"
  | "sys_gateway"
  | "sys_lb"
  | "sys_server"
  | "sys_db"
  | "sys_cache"
  | "sys_redis"
  | "sys_queue"
  | "sys_worker"
  | "sys_storage"
  | "sys_microservice"
  | "sys_cdn"
  | "sys_auth"
  | "sticky"
  | "code_block";

export type CodeitElementRole =
  | "root"
  | "node"
  | "cell"
  | "edge"
  | "label"
  | "frame";

export type CodeitMeta = {
  kind: CodeitStructureKind;
  structureId: string;
  version: number;
  role: CodeitElementRole;
  /** Stable slot within the structure (e.g. cell index, node id). */
  slot?: string;
  /** Parent slot for trees / lists. */
  parentSlot?: string;
  /** Extra payload (rows, cols, direction, …). */
  props?: Record<string, string | number | boolean>;
};

export type CodeitCustomData = {
  codeit: CodeitMeta;
};

export function isCodeitMeta(v: unknown): v is CodeitMeta {
  if (!v || typeof v !== "object") return false;
  const m = v as CodeitMeta;
  return (
    typeof m.kind === "string" &&
    typeof m.structureId === "string" &&
    typeof m.role === "string"
  );
}

export function readCodeit(
  customData: Record<string, unknown> | undefined
): CodeitMeta | null {
  if (!customData) return null;
  const raw = customData.codeit;
  return isCodeitMeta(raw) ? raw : null;
}

export function makeStructureId(): string {
  return `cs_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function codeitData(
  partial: Omit<CodeitMeta, "version"> & { version?: number }
): CodeitCustomData {
  return {
    codeit: {
      version: CODEIT_WB_VERSION,
      ...partial,
    },
  };
}
