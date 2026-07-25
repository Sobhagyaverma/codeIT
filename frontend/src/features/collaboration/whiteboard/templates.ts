import {
  stampArray,
  stampBinaryTree,
  stampDpTable,
  stampGraph,
  stampLinkedList,
  stampQueue,
  stampRecursionTree,
  stampStack,
  stampSys,
  stampTrie,
  stampHeap,
  type StampResult,
} from "./factories";

export type BoardTemplate = {
  id: string;
  label: string;
  description: string;
  build: () => StampResult[];
};

const ORIGIN = { x: 80, y: 80 };

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "blank",
    label: "Blank Interview",
    description: "Empty board",
    build: () => [],
  },
  {
    id: "binary_tree",
    label: "Binary Tree",
    description: "Depth-2 tree ready to annotate",
    build: () => [stampBinaryTree(ORIGIN)],
  },
  {
    id: "linked_list",
    label: "Linked List",
    description: "Singly linked list",
    build: () => [stampLinkedList(ORIGIN, "singly")],
  },
  {
    id: "stack",
    label: "Stack",
    description: "Vertical stack with TOP",
    build: () => [stampStack(ORIGIN)],
  },
  {
    id: "queue",
    label: "Queue",
    description: "Front → back queue",
    build: () => [stampQueue(ORIGIN)],
  },
  {
    id: "graph",
    label: "Graph",
    description: "Small undirected graph",
    build: () => [stampGraph(ORIGIN, "undirected")],
  },
  {
    id: "dp5",
    label: "DP Table 5×5",
    description: "Dynamic programming grid",
    build: () => [stampDpTable(ORIGIN, { rows: 5, cols: 5 })],
  },
  {
    id: "recursion",
    label: "Recursion Tree",
    description: "Call tree for interviews",
    build: () => [stampRecursionTree(ORIGIN)],
  },
  {
    id: "heap",
    label: "Heap",
    description: "Min-heap shape",
    build: () => [stampHeap(ORIGIN)],
  },
  {
    id: "trie",
    label: "Trie",
    description: "Prefix tree starter",
    build: () => [stampTrie(ORIGIN)],
  },
  {
    id: "sliding_window",
    label: "Sliding Window",
    description: "Array + window sticky",
    build: () => [
      stampArray({ x: 80, y: 120 }, { cells: 8, values: ["1", "3", "2", "6", "4", "5", "8", "7"] }),
    ],
  },
  {
    id: "dfs",
    label: "DFS Example",
    description: "Directed graph for DFS",
    build: () => [stampGraph(ORIGIN, "directed")],
  },
  {
    id: "bfs",
    label: "BFS Example",
    description: "Undirected graph for BFS",
    build: () => [stampGraph(ORIGIN, "undirected")],
  },
  {
    id: "system_design",
    label: "System Design",
    description: "Client → Gateway → Services",
    build: () => [
      stampSys.client({ x: 60, y: 100 }),
      stampSys.gateway({ x: 220, y: 100 }),
      stampSys.lb({ x: 400, y: 100 }),
      stampSys.server({ x: 220, y: 200 }),
      stampSys.db({ x: 400, y: 200 }),
      stampSys.cache({ x: 580, y: 200 }),
    ],
  },
];
