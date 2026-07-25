export type LibraryCategoryId =
  | "arrays"
  | "lists"
  | "trees"
  | "graphs"
  | "linear"
  | "tables"
  | "flow"
  | "system"
  | "notes";

export type LibraryItem = {
  id: string;
  label: string;
  category: LibraryCategoryId;
  factoryId: string;
  hint?: string;
};

export const LIBRARY_CATEGORIES: {
  id: LibraryCategoryId;
  label: string;
}[] = [
  { id: "arrays", label: "Arrays" },
  { id: "lists", label: "Linked Lists" },
  { id: "trees", label: "Trees" },
  { id: "graphs", label: "Graphs" },
  { id: "linear", label: "Stack / Queue / Hash" },
  { id: "tables", label: "DP & Tables" },
  { id: "flow", label: "Flowchart" },
  { id: "system", label: "System Design" },
  { id: "notes", label: "Notes & Code" },
];

export const LIBRARY_ITEMS: LibraryItem[] = [
  { id: "array", label: "Array", category: "arrays", factoryId: "array" },
  {
    id: "array_dynamic",
    label: "Dynamic Array",
    category: "arrays",
    factoryId: "array_dynamic",
  },
  { id: "array2d", label: "2D Array", category: "arrays", factoryId: "array2d" },
  { id: "matrix", label: "Matrix", category: "arrays", factoryId: "matrix" },
  { id: "grid", label: "Grid", category: "arrays", factoryId: "grid" },

  {
    id: "ll_singly",
    label: "Singly Linked List",
    category: "lists",
    factoryId: "ll_singly",
  },
  {
    id: "ll_doubly",
    label: "Doubly Linked List",
    category: "lists",
    factoryId: "ll_doubly",
  },
  {
    id: "ll_circular",
    label: "Circular Linked List",
    category: "lists",
    factoryId: "ll_circular",
  },

  {
    id: "binary_tree",
    label: "Binary Tree",
    category: "trees",
    factoryId: "binary_tree",
  },
  { id: "bst", label: "BST", category: "trees", factoryId: "bst" },
  { id: "heap", label: "Heap", category: "trees", factoryId: "heap" },
  { id: "trie", label: "Trie", category: "trees", factoryId: "trie" },
  {
    id: "generic_tree",
    label: "N-ary Tree",
    category: "trees",
    factoryId: "generic_tree",
  },

  {
    id: "graph_undirected",
    label: "Undirected Graph",
    category: "graphs",
    factoryId: "graph_undirected",
  },
  {
    id: "graph_directed",
    label: "Directed Graph",
    category: "graphs",
    factoryId: "graph_directed",
  },
  {
    id: "graph_weighted",
    label: "Weighted Graph",
    category: "graphs",
    factoryId: "graph_weighted",
  },
  { id: "dag", label: "DAG", category: "graphs", factoryId: "dag" },

  { id: "stack", label: "Stack", category: "linear", factoryId: "stack" },
  { id: "queue", label: "Queue", category: "linear", factoryId: "queue" },
  {
    id: "priority_queue",
    label: "Priority Queue",
    category: "linear",
    factoryId: "priority_queue",
  },
  { id: "hashmap", label: "HashMap", category: "linear", factoryId: "hashmap" },
  { id: "hashset", label: "HashSet", category: "linear", factoryId: "hashset" },

  { id: "dp_2", label: "DP 2×2", category: "tables", factoryId: "dp_2" },
  { id: "dp_5", label: "DP 5×5", category: "tables", factoryId: "dp_5" },
  { id: "dp_10", label: "DP 10×10", category: "tables", factoryId: "dp_10" },
  {
    id: "recursion_tree",
    label: "Recursion Tree",
    category: "tables",
    factoryId: "recursion_tree",
  },

  {
    id: "flow_start",
    label: "Start",
    category: "flow",
    factoryId: "flow_start",
  },
  { id: "flow_end", label: "End", category: "flow", factoryId: "flow_end" },
  {
    id: "flow_process",
    label: "Process",
    category: "flow",
    factoryId: "flow_process",
  },
  {
    id: "flow_decision",
    label: "Decision",
    category: "flow",
    factoryId: "flow_decision",
  },
  { id: "flow_loop", label: "Loop", category: "flow", factoryId: "flow_loop" },
  {
    id: "flow_io",
    label: "Input / Output",
    category: "flow",
    factoryId: "flow_io",
  },

  {
    id: "sys_client",
    label: "Client",
    category: "system",
    factoryId: "sys_client",
  },
  {
    id: "sys_gateway",
    label: "API Gateway",
    category: "system",
    factoryId: "sys_gateway",
  },
  {
    id: "sys_lb",
    label: "Load Balancer",
    category: "system",
    factoryId: "sys_lb",
  },
  {
    id: "sys_server",
    label: "Server",
    category: "system",
    factoryId: "sys_server",
  },
  { id: "sys_db", label: "Database", category: "system", factoryId: "sys_db" },
  {
    id: "sys_cache",
    label: "Cache",
    category: "system",
    factoryId: "sys_cache",
  },
  {
    id: "sys_redis",
    label: "Redis",
    category: "system",
    factoryId: "sys_redis",
  },
  {
    id: "sys_queue",
    label: "Message Queue",
    category: "system",
    factoryId: "sys_queue",
  },
  {
    id: "sys_worker",
    label: "Worker",
    category: "system",
    factoryId: "sys_worker",
  },
  {
    id: "sys_storage",
    label: "Storage",
    category: "system",
    factoryId: "sys_storage",
  },
  {
    id: "sys_microservice",
    label: "Microservice",
    category: "system",
    factoryId: "sys_microservice",
  },
  { id: "sys_cdn", label: "CDN", category: "system", factoryId: "sys_cdn" },
  { id: "sys_auth", label: "Auth", category: "system", factoryId: "sys_auth" },

  { id: "sticky", label: "Sticky Note", category: "notes", factoryId: "sticky" },
  {
    id: "sticky_todo",
    label: "TODO Sticky",
    category: "notes",
    factoryId: "sticky_todo",
  },
  {
    id: "sticky_edge",
    label: "Edge Cases",
    category: "notes",
    factoryId: "sticky_edge",
  },
  {
    id: "code_python",
    label: "Code (Python)",
    category: "notes",
    factoryId: "code_python",
  },
  {
    id: "code_java",
    label: "Code (Java)",
    category: "notes",
    factoryId: "code_java",
  },
  {
    id: "code_cpp",
    label: "Code (C++)",
    category: "notes",
    factoryId: "code_cpp",
  },
];
