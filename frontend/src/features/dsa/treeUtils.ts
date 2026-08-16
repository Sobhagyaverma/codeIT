import type { DsaTreeFolder, DsaTreeProblem } from "./types";

export function findFolder(
  roots: DsaTreeFolder[],
  folderId: number
): DsaTreeFolder | null {
  for (const f of roots) {
    if (f.id === folderId) return f;
    const nested = findFolder(f.children, folderId);
    if (nested) return nested;
  }
  return null;
}

export function findProblemLocation(
  roots: DsaTreeFolder[],
  folderId: number,
  problemId: number
): { folder: DsaTreeFolder; problem: DsaTreeProblem } | null {
  const folder = findFolder(roots, folderId);
  if (!folder) return null;
  const problem = folder.problems.find((p) => p.id === problemId);
  if (!problem) return null;
  return { folder, problem };
}

export function folderBreadcrumb(
  roots: DsaTreeFolder[],
  folderId: number
): DsaTreeFolder[] {
  const path: DsaTreeFolder[] = [];

  function walk(nodes: DsaTreeFolder[]): boolean {
    for (const n of nodes) {
      path.push(n);
      if (n.id === folderId) return true;
      if (walk(n.children)) return true;
      path.pop();
    }
    return false;
  }

  walk(roots);
  return path;
}

export function collectFolderIds(roots: DsaTreeFolder[]): number[] {
  const ids: number[] = [];
  function walk(nodes: DsaTreeFolder[]) {
    for (const n of nodes) {
      ids.push(n.id);
      walk(n.children);
    }
  }
  walk(roots);
  return ids;
}

export function parseTopics(topics: string | string[] | undefined): string[] {
  if (!topics) return [];
  if (Array.isArray(topics)) return topics.map(String).filter(Boolean);
  const raw = topics.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    /* comma-separated */
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export type FlatTreeItem =
  | { kind: "folder"; folder: DsaTreeFolder; depth: number }
  | {
      kind: "problem";
      folder: DsaTreeFolder;
      problem: DsaTreeProblem;
      depth: number;
    };

export function flattenVisibleTree(
  roots: DsaTreeFolder[],
  expanded: Set<number>
): FlatTreeItem[] {
  const out: FlatTreeItem[] = [];

  function walk(nodes: DsaTreeFolder[], depth: number) {
    for (const folder of nodes) {
      out.push({ kind: "folder", folder, depth });
      if (!expanded.has(folder.id)) continue;
      walk(folder.children, depth + 1);
      for (const problem of folder.problems) {
        out.push({ kind: "problem", folder, problem, depth: depth + 1 });
      }
    }
  }

  walk(roots, 0);
  return out;
}

export function searchTree(
  roots: DsaTreeFolder[],
  query: string
): {
  folders: { folder: DsaTreeFolder; path: string }[];
  problems: {
    problem: DsaTreeProblem;
    folder: DsaTreeFolder;
    path: string;
  }[];
} {
  const q = query.trim().toLowerCase();
  const folders: { folder: DsaTreeFolder; path: string }[] = [];
  const problems: {
    problem: DsaTreeProblem;
    folder: DsaTreeFolder;
    path: string;
  }[] = [];

  if (!q) return { folders, problems };

  function walk(nodes: DsaTreeFolder[], pathParts: string[]) {
    for (const folder of nodes) {
      const path = [...pathParts, folder.name];
      const pathLabel = path.join(" → ");
      if (folder.name.toLowerCase().includes(q)) {
        folders.push({ folder, path: pathLabel });
      }
      for (const problem of folder.problems) {
        if (problem.title.toLowerCase().includes(q)) {
          problems.push({ problem, folder, path: pathLabel });
        }
      }
      walk(folder.children, path);
    }
  }

  walk(roots, []);
  return { folders, problems };
}

/** All descendant folder ids including self — used to block invalid moves. */
export function descendantFolderIds(folder: DsaTreeFolder): Set<number> {
  const ids = new Set<number>();
  function walk(n: DsaTreeFolder) {
    ids.add(n.id);
    n.children.forEach(walk);
  }
  walk(folder);
  return ids;
}

export function siblingFolders(
  roots: DsaTreeFolder[],
  folder: DsaTreeFolder
): DsaTreeFolder[] {
  if (folder.parentId == null) return roots;
  const parent = findFolder(roots, folder.parentId);
  return parent?.children ?? [];
}
