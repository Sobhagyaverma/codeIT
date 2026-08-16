import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  assignDsaProblems,
  createDsaFolder,
  deleteDsaFolder,
  describeApiError,
  getDsaSheetTree,
  getProblems,
  listDsaSheets,
  moveDsaFolder,
  moveDsaProblem,
  removeDsaProblem,
  reorderDsaFolders,
  reorderDsaProblems,
  updateDsaFolder,
  type DsaSheetDTO,
} from "../lib/api";
import type { ProblemPublicDTO } from "../lib/authStorage";
import { useToast } from "../context/ToastContext";
import { ProblemPickerModal } from "../features/dsa/components/ProblemPickerModal";
import { DsaModal } from "../features/dsa/components/DsaModal";
import type {
  DeleteFolderMode,
  DsaTreeFolder,
  DsaTreeProblem,
  TreeSelection,
} from "../features/dsa/types";
import {
  collectFolderIds,
  descendantFolderIds,
  findFolder,
  findProblemLocation,
  flattenVisibleTree,
  folderBreadcrumb,
  parseTopics,
  searchTree,
  siblingFolders,
} from "../features/dsa/treeUtils";

type ContextMenuState =
  | {
      kind: "folder";
      folderId: number;
      x: number;
      y: number;
    }
  | {
      kind: "problem";
      folderId: number;
      problemId: number;
      x: number;
      y: number;
    }
  | null;

type DragPayload =
  | { type: "folder"; folderId: number; parentId: number | null }
  | { type: "problem"; folderId: number; problemId: number };

function difficultyClass(d: string): string {
  const u = (d || "").toUpperCase();
  if (u.startsWith("HARD")) return "text-hard";
  if (u.startsWith("MED")) return "text-medium";
  return "text-easy";
}

export default function AdminDsaSheet() {
  const { showToast } = useToast();
  const [sheets, setSheets] = useState<DsaSheetDTO[]>([]);
  const [sheetId, setSheetId] = useState<number | null>(null);
  const [tree, setTree] = useState<DsaTreeFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<ProblemPublicDTO[]>([]);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [selection, setSelection] = useState<TreeSelection>(null);
  const [search, setSearch] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DsaTreeFolder | null>(null);
  const [deleteMode, setDeleteMode] = useState<DeleteFolderMode>("UNASSIGN");
  const [deleting, setDeleting] = useState(false);

  const [pickerFolder, setPickerFolder] = useState<DsaTreeFolder | null>(null);
  const [moveTarget, setMoveTarget] = useState<{
    kind: "folder" | "problem";
    folderId: number;
    problemId?: number;
    name: string;
  } | null>(null);
  const [moveDestId, setMoveDestId] = useState<number | null>(null);

  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dropHint, setDropHint] = useState<string | null>(null);
  const [detailsOpenMobile, setDetailsOpenMobile] = useState(false);

  const treeRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragPayload | null>(null);

  const refreshTree = useCallback(async (id: number, keepExpanded = true) => {
    const next = (await getDsaSheetTree(id)) as DsaTreeFolder[];
    setTree(next);
    if (!keepExpanded) {
      setExpanded(new Set(collectFolderIds(next).slice(0, 20)));
    }
    return next;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sheetList, problems] = await Promise.all([
        listDsaSheets(),
        getProblems().catch(() => [] as ProblemPublicDTO[]),
      ]);
      setSheets(sheetList);
      setCatalog(problems);
      const first = sheetList[0];
      if (!first) {
        setError("No DSA sheet found. Run Flyway migration V12.");
        setSheetId(null);
        setTree([]);
        return;
      }
      setSheetId(first.id);
      const next = await refreshTree(first.id, false);
      setExpanded(new Set(collectFolderIds(next)));
    } catch (err) {
      setError(describeApiError(err, "Failed to load DSA sheet."));
    } finally {
      setLoading(false);
    }
  }, [refreshTree]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const selectedFolder = useMemo(() => {
    if (!selection || selection.type !== "folder") return null;
    return findFolder(tree, selection.folderId);
  }, [selection, tree]);

  const selectedProblemLoc = useMemo(() => {
    if (!selection || selection.type !== "problem") return null;
    return findProblemLocation(tree, selection.folderId, selection.problemId);
  }, [selection, tree]);

  const breadcrumbs = useMemo(() => {
    if (selection?.type === "folder") {
      return folderBreadcrumb(tree, selection.folderId);
    }
    if (selection?.type === "problem") {
      return folderBreadcrumb(tree, selection.folderId);
    }
    return [];
  }, [selection, tree]);

  const searchResults = useMemo(
    () => (search.trim() ? searchTree(tree, search) : null),
    [tree, search]
  );

  const flat = useMemo(
    () => flattenVisibleTree(tree, expanded),
    [tree, expanded]
  );

  const toastErr = (err: unknown, fallback: string) => {
    showToast({
      title: describeApiError(err, fallback),
      tone: "error",
      icon: "error",
    });
  };

  const expandAll = () => setExpanded(new Set(collectFolderIds(tree)));
  const collapseAll = () => setExpanded(new Set());

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = (parentId: number | null) => {
    setCreateParentId(parentId);
    setCreateName("");
    setCreateDesc("");
    setCreateOpen(true);
    setContextMenu(null);
  };

  const submitCreate = async () => {
    if (!sheetId || !createName.trim()) return;
    setCreating(true);
    try {
      const created = await createDsaFolder(sheetId, {
        name: createName.trim(),
        description: createDesc.trim() || undefined,
        parentId: createParentId,
      });
      await refreshTree(sheetId);
      if (createParentId != null) {
        setExpanded((prev) => new Set(prev).add(createParentId));
      }
      setSelection({ type: "folder", folderId: created.id });
      setCreateOpen(false);
      showToast({
        title: createParentId == null ? "Module created." : "Folder created.",
        tone: "success",
        icon: "check_circle",
      });
    } catch (err) {
      toastErr(err, "Could not create folder.");
    } finally {
      setCreating(false);
    }
  };

  const startRename = (folder: DsaTreeFolder) => {
    setRenamingId(folder.id);
    setRenameValue(folder.name);
    setContextMenu(null);
  };

  const commitRename = async () => {
    if (renamingId == null || !sheetId) return;
    const name = renameValue.trim();
    if (!name) {
      setRenamingId(null);
      return;
    }
    try {
      await updateDsaFolder(renamingId, { name });
      await refreshTree(sheetId);
      showToast({ title: "Folder renamed.", tone: "success", icon: "check_circle" });
    } catch (err) {
      toastErr(err, "Could not rename folder.");
    } finally {
      setRenamingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !sheetId) return;
    setDeleting(true);
    try {
      await deleteDsaFolder(deleteTarget.id, deleteMode);
      await refreshTree(sheetId);
      if (
        selection?.type === "folder" &&
        selection.folderId === deleteTarget.id
      ) {
        setSelection(null);
      }
      setDeleteTarget(null);
      showToast({
        title: "Folder deleted.",
        tone: "success",
        icon: "check_circle",
      });
    } catch (err) {
      toastErr(err, "Could not delete folder.");
    } finally {
      setDeleting(false);
    }
  };

  const handleAssign = async (ids: number[]) => {
    if (!pickerFolder || !sheetId) return;
    try {
      const result = await assignDsaProblems(pickerFolder.id, ids);
      await refreshTree(sheetId);
      setExpanded((prev) => new Set(prev).add(pickerFolder.id));
      const parts = [`${result.added} problem${result.added === 1 ? "" : "s"} added to ${pickerFolder.name}.`];
      if (result.alreadyPresent.length) {
        parts.push(`${result.alreadyPresent.length} already in folder.`);
      }
      showToast({
        title: parts.join(" "),
        tone: "success",
        icon: "check_circle",
      });
    } catch (err) {
      toastErr(err, "Could not add problems.");
      throw err;
    }
  };

  const handleRemoveProblem = async (folderId: number, problemId: number) => {
    if (!sheetId) return;
    try {
      await removeDsaProblem(folderId, problemId);
      await refreshTree(sheetId);
      if (
        selection?.type === "problem" &&
        selection.problemId === problemId &&
        selection.folderId === folderId
      ) {
        setSelection({ type: "folder", folderId });
      }
      showToast({
        title: "Problem removed from folder.",
        tone: "success",
        icon: "check_circle",
      });
    } catch (err) {
      toastErr(err, "Could not remove problem.");
    }
  };

  const moveFolderUpDown = async (folder: DsaTreeFolder, dir: -1 | 1) => {
    if (!sheetId) return;
    const siblings = siblingFolders(tree, folder);
    const idx = siblings.findIndex((s) => s.id === folder.id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= siblings.length) return;
    const ids = siblings.map((s) => s.id);
    const tmp = ids[idx];
    ids[idx] = ids[swap];
    ids[swap] = tmp;
    try {
      await reorderDsaFolders({
        sheetId,
        parentId: folder.parentId,
        folderIds: ids,
      });
      await refreshTree(sheetId);
    } catch (err) {
      toastErr(err, "Could not reorder.");
    }
  };

  const moveProblemUpDown = async (
    folder: DsaTreeFolder,
    problem: DsaTreeProblem,
    dir: -1 | 1
  ) => {
    if (!sheetId) return;
    const ids = folder.problems.map((p) => p.id);
    const idx = ids.indexOf(problem.id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= ids.length) return;
    const tmp = ids[idx];
    ids[idx] = ids[swap];
    ids[swap] = tmp;
    try {
      await reorderDsaProblems(folder.id, ids);
      await refreshTree(sheetId);
    } catch (err) {
      toastErr(err, "Could not reorder.");
    }
  };

  const submitMove = async () => {
    if (!moveTarget || !sheetId) return;
    try {
      if (moveTarget.kind === "folder") {
        await moveDsaFolder(moveTarget.folderId, { parentId: moveDestId });
      } else if (moveTarget.problemId != null && moveDestId != null) {
        await moveDsaProblem(moveTarget.folderId, moveTarget.problemId, {
          targetFolderId: moveDestId,
        });
      }
      await refreshTree(sheetId);
      if (moveDestId != null) {
        setExpanded((prev) => new Set(prev).add(moveDestId));
      }
      setMoveTarget(null);
      showToast({
        title: "Moved successfully.",
        tone: "success",
        icon: "check_circle",
      });
    } catch (err) {
      toastErr(err, "Unable to move.");
    }
  };

  const onDragStart = (payload: DragPayload, e: DragEvent) => {
    dragRef.current = payload;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify(payload));
  };

  const onDropOntoFolder = async (target: DsaTreeFolder) => {
    const payload = dragRef.current;
    dragRef.current = null;
    setDropHint(null);
    if (!payload || !sheetId) return;

    try {
      if (payload.type === "folder") {
        if (payload.folderId === target.id) return;
        const moving = findFolder(tree, payload.folderId);
        if (!moving) return;
        if (descendantFolderIds(moving).has(target.id)) {
          showToast({
            title: "Unable to move folder into its descendant.",
            tone: "error",
            icon: "error",
          });
          return;
        }
        await moveDsaFolder(payload.folderId, { parentId: target.id });
      } else {
        if (payload.folderId === target.id) return;
        await moveDsaProblem(payload.folderId, payload.problemId, {
          targetFolderId: target.id,
        });
      }
      await refreshTree(sheetId);
      setExpanded((prev) => new Set(prev).add(target.id));
      showToast({
        title: "Moved successfully.",
        tone: "success",
        icon: "check_circle",
      });
    } catch (err) {
      toastErr(err, "Unable to move.");
    }
  };

  const onTreeKeyDown = (e: ReactKeyboardEvent) => {
    if (!selection) return;
    const items = flat;
    const idx = items.findIndex((item) => {
      if (selection.type === "folder") {
        return item.kind === "folder" && item.folder.id === selection.folderId;
      }
      return (
        item.kind === "problem" &&
        item.folder.id === selection.folderId &&
        item.problem.id === selection.problemId
      );
    });

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = items[idx + 1];
      if (!next) return;
      if (next.kind === "folder") {
        setSelection({ type: "folder", folderId: next.folder.id });
      } else {
        setSelection({
          type: "problem",
          folderId: next.folder.id,
          problemId: next.problem.id,
        });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = items[idx - 1];
      if (!prev) return;
      if (prev.kind === "folder") {
        setSelection({ type: "folder", folderId: prev.folder.id });
      } else {
        setSelection({
          type: "problem",
          folderId: prev.folder.id,
          problemId: prev.problem.id,
        });
      }
    } else if (e.key === "ArrowRight" && selection.type === "folder") {
      e.preventDefault();
      setExpanded((prev) => new Set(prev).add(selection.folderId));
    } else if (e.key === "ArrowLeft" && selection.type === "folder") {
      e.preventDefault();
      if (expanded.has(selection.folderId)) {
        setExpanded((prev) => {
          const n = new Set(prev);
          n.delete(selection.folderId);
          return n;
        });
      } else {
        const f = findFolder(tree, selection.folderId);
        if (f?.parentId != null) {
          setSelection({ type: "folder", folderId: f.parentId });
        }
      }
    } else if (e.key === "Enter" && selection.type === "folder") {
      const f = findFolder(tree, selection.folderId);
      if (f) startRename(f);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      if (selection.type === "folder") {
        const f = findFolder(tree, selection.folderId);
        if (f) {
          setDeleteMode("UNASSIGN");
          setDeleteTarget(f);
        }
      } else {
        void handleRemoveProblem(selection.folderId, selection.problemId);
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      document.getElementById("dsa-manager-search")?.focus();
    } else if (
      (e.metaKey || e.ctrlKey) &&
      e.shiftKey &&
      e.key.toLowerCase() === "n"
    ) {
      e.preventDefault();
      openCreate(selection.type === "folder" ? selection.folderId : null);
    }
  };

  const sheet = sheets.find((s) => s.id === sheetId) ?? sheets[0];

  const renderFolderPickerOptions = (
    nodes: DsaTreeFolder[],
    depth: number,
    blocked: Set<number>
  ): ReactNode[] => {
    const out: ReactNode[] = [];
    for (const n of nodes) {
      const disabled = blocked.has(n.id);
      out.push(
        <option key={n.id} value={n.id} disabled={disabled}>
          {"—".repeat(depth)} {n.name}
        </option>
      );
      out.push(...renderFolderPickerOptions(n.children, depth + 1, blocked));
    }
    return out;
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-on-surface-variant">
        Loading DSA Sheet Manager…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-hard/40 bg-hard/10 p-6 text-sm text-hard">
        {error}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-3 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 lg:h-[calc(100vh-3rem)]">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline-lg text-2xl font-bold tracking-tight text-on-surface">
            DSA Sheet Manager
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Organize problems into a structured learning roadmap.
            {sheet ? (
              <span className="text-outline"> · {sheet.name}</span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openCreate(null)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary"
          >
            <span className="material-symbols-outlined text-base">create_new_folder</span>
            New Module
          </button>
          <button
            type="button"
            onClick={expandAll}
            className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-semibold text-on-surface-variant hover:border-[#a855f7]"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-semibold text-on-surface-variant hover:border-[#a855f7]"
          >
            Collapse All
          </button>
          <Link
            to="/dsa-sheet"
            className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-semibold text-on-surface-variant hover:border-[#a855f7]"
          >
            View learner sheet
          </Link>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-low">
        <div className="grid h-full lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.9fr)]">
          {/* Tree panel */}
          <section className="flex min-h-0 flex-col border-b border-outline-variant/40 lg:border-b-0 lg:border-r">
            <div className="border-b border-outline-variant/30 p-3">
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant">
                  search
                </span>
                <input
                  id="dsa-manager-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search folders & problems… (⌘K)"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container py-2 pl-10 pr-3 text-sm text-on-surface outline-none focus:border-[#a855f7]"
                />
              </div>
            </div>

            <div
              ref={treeRef}
              tabIndex={0}
              onKeyDown={onTreeKeyDown}
              className="min-h-0 flex-1 overflow-y-auto p-2 outline-none focus-visible:ring-1 focus-visible:ring-[#a855f7]/50"
              aria-label="DSA folder tree"
            >
              {searchResults ? (
                <div className="space-y-4 p-2">
                  {searchResults.folders.length === 0 &&
                  searchResults.problems.length === 0 ? (
                    <p className="p-6 text-center text-sm text-on-surface-variant">
                      No folders or problems match your search.
                    </p>
                  ) : (
                    <>
                      {searchResults.folders.length > 0 && (
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-outline">
                            Folders
                          </p>
                          <ul className="space-y-1">
                            {searchResults.folders.map(({ folder, path }) => (
                              <li key={`sf-${folder.id}`}>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-container-high"
                                  onClick={() => {
                                    setSelection({
                                      type: "folder",
                                      folderId: folder.id,
                                    });
                                    setExpanded((prev) => {
                                      const n = new Set(prev);
                                      folderBreadcrumb(tree, folder.id).forEach(
                                        (b) => n.add(b.id)
                                      );
                                      return n;
                                    });
                                    setSearch("");
                                    setDetailsOpenMobile(true);
                                  }}
                                >
                                  <span className="material-symbols-outlined text-base text-[#a855f7]">
                                    folder
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block truncate font-medium">
                                      {folder.name}
                                    </span>
                                    <span className="block truncate text-[11px] text-on-surface-variant">
                                      {path}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {searchResults.problems.length > 0 && (
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-outline">
                            Problems
                          </p>
                          <ul className="space-y-1">
                            {searchResults.problems.map(
                              ({ problem, folder, path }) => (
                                <li key={`sp-${folder.id}-${problem.id}`}>
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-container-high"
                                    onClick={() => {
                                      setSelection({
                                        type: "problem",
                                        folderId: folder.id,
                                        problemId: problem.id,
                                      });
                                      setExpanded((prev) => {
                                        const n = new Set(prev);
                                        folderBreadcrumb(tree, folder.id).forEach(
                                          (b) => n.add(b.id)
                                        );
                                        n.add(folder.id);
                                        return n;
                                      });
                                      setSearch("");
                                      setDetailsOpenMobile(true);
                                    }}
                                  >
                                    <span className="material-symbols-outlined text-base text-on-surface-variant">
                                      draft
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate font-medium">
                                        {problem.title}
                                      </span>
                                      <span className="block truncate text-[11px] text-on-surface-variant">
                                        {path}
                                      </span>
                                    </span>
                                  </button>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : tree.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline">
                    folder_off
                  </span>
                  <p className="text-sm font-medium text-on-surface">
                    No modules yet.
                  </p>
                  <p className="max-w-xs text-xs text-on-surface-variant">
                    Build your DSA roadmap by creating your first module.
                  </p>
                  <button
                    type="button"
                    onClick={() => openCreate(null)}
                    className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary"
                  >
                    Create Module
                  </button>
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {flat.map((item) => {
                    if (item.kind === "folder") {
                      const { folder, depth } = item;
                      const isOpen = expanded.has(folder.id);
                      const isSelected =
                        selection?.type === "folder" &&
                        selection.folderId === folder.id;
                      const isRenaming = renamingId === folder.id;
                      return (
                        <li key={`f-${folder.id}`}>
                          <div
                            draggable={!isRenaming}
                            onDragStart={(e) =>
                              onDragStart(
                                {
                                  type: "folder",
                                  folderId: folder.id,
                                  parentId: folder.parentId,
                                },
                                e
                              )
                            }
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDropHint(`folder-${folder.id}`);
                            }}
                            onDragLeave={() => setDropHint(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              void onDropOntoFolder(folder);
                            }}
                            className={`group flex items-center gap-1 rounded-lg pr-1 transition-colors ${
                              isSelected
                                ? "bg-primary-container/15 text-primary"
                                : "hover:bg-surface-container-high"
                            } ${
                              dropHint === `folder-${folder.id}`
                                ? "ring-1 ring-[#a855f7]/60"
                                : ""
                            }`}
                            style={{ paddingLeft: 8 + depth * 14 }}
                          >
                            <button
                              type="button"
                              aria-label={isOpen ? "Collapse" : "Expand"}
                              onClick={() => toggleExpand(folder.id)}
                              className="rounded p-0.5 text-on-surface-variant hover:text-on-surface"
                            >
                              <span className="material-symbols-outlined text-base">
                                {isOpen ? "expand_more" : "chevron_right"}
                              </span>
                            </button>
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
                              onClick={() => {
                                setSelection({
                                  type: "folder",
                                  folderId: folder.id,
                                });
                                setDetailsOpenMobile(true);
                              }}
                              onDoubleClick={() => startRename(folder)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenu({
                                  kind: "folder",
                                  folderId: folder.id,
                                  x: e.clientX,
                                  y: e.clientY,
                                });
                              }}
                            >
                              <span
                                className="material-symbols-outlined text-base text-[#a855f7]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                folder
                              </span>
                              {isRenaming ? (
                                <input
                                  autoFocus
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onBlur={() => void commitRename()}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      void commitRename();
                                    }
                                    if (e.key === "Escape") {
                                      setRenamingId(null);
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full rounded border border-[#a855f7] bg-surface-container px-1 py-0.5 text-sm"
                                />
                              ) : (
                                <span className="truncate text-sm font-medium">
                                  {folder.name}
                                </span>
                              )}
                            </button>
                            <span className="mono shrink-0 pr-1 text-[10px] text-outline">
                              {folder.totalProblemCount}
                            </span>
                            <button
                              type="button"
                              aria-label="Folder actions"
                              className="rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-surface-container"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = (
                                  e.currentTarget as HTMLElement
                                ).getBoundingClientRect();
                                setContextMenu({
                                  kind: "folder",
                                  folderId: folder.id,
                                  x: rect.left,
                                  y: rect.bottom,
                                });
                              }}
                            >
                              <span className="material-symbols-outlined text-base">
                                more_vert
                              </span>
                            </button>
                          </div>
                        </li>
                      );
                    }

                    const { folder, problem, depth } = item;
                    const isSelected =
                      selection?.type === "problem" &&
                      selection.problemId === problem.id &&
                      selection.folderId === folder.id;
                    return (
                      <li key={`p-${folder.id}-${problem.id}`}>
                        <div
                          draggable
                          onDragStart={(e) =>
                            onDragStart(
                              {
                                type: "problem",
                                folderId: folder.id,
                                problemId: problem.id,
                              },
                              e
                            )
                          }
                          className={`group flex items-center gap-2 rounded-lg py-1.5 pr-2 transition-colors ${
                            isSelected
                              ? "bg-primary-container/15 text-primary"
                              : "hover:bg-surface-container-high"
                          }`}
                          style={{ paddingLeft: 28 + depth * 14 }}
                          onClick={() => {
                            setSelection({
                              type: "problem",
                              folderId: folder.id,
                              problemId: problem.id,
                            });
                            setDetailsOpenMobile(true);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              kind: "problem",
                              folderId: folder.id,
                              problemId: problem.id,
                              x: e.clientX,
                              y: e.clientY,
                            });
                          }}
                        >
                          <span className="material-symbols-outlined text-base text-on-surface-variant">
                            draft
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {problem.title}
                          </span>
                          <span
                            className={`mono text-[10px] font-bold ${difficultyClass(
                              problem.difficulty
                            )}`}
                          >
                            {problem.difficulty}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Details panel */}
          <aside
            className={`flex min-h-0 flex-col bg-surface-container ${
              detailsOpenMobile ? "fixed inset-0 z-40 lg:static" : "hidden lg:flex"
            }`}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3 lg:hidden">
              <span className="text-sm font-bold">Details</span>
              <button
                type="button"
                onClick={() => setDetailsOpenMobile(false)}
                aria-label="Close details"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {!selection ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl text-outline">
                    account_tree
                  </span>
                  <p className="text-sm">Select a folder or problem</p>
                </div>
              ) : selectedFolder ? (
                <div className="space-y-5">
                  <nav className="flex flex-wrap items-center gap-1 text-[11px] text-on-surface-variant">
                    <button
                      type="button"
                      className="hover:text-primary"
                      onClick={() => setSelection(null)}
                    >
                      Home
                    </button>
                    {breadcrumbs.map((b) => (
                      <span key={b.id} className="flex items-center gap-1">
                        <span className="text-outline">/</span>
                        <button
                          type="button"
                          className="hover:text-primary"
                          onClick={() =>
                            setSelection({ type: "folder", folderId: b.id })
                          }
                        >
                          {b.name}
                        </button>
                      </span>
                    ))}
                  </nav>

                  <div>
                    <h3 className="font-headline-lg text-xl font-bold text-on-surface">
                      {selectedFolder.name}
                    </h3>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      {selectedFolder.description || "No description."}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["Problems", selectedFolder.directProblemCount],
                      ["Subfolders", selectedFolder.subfolderCount],
                      ["Total", selectedFolder.totalProblemCount],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-center"
                      >
                        <p className="mono text-lg font-bold text-primary">
                          {value}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-outline">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startRename(selectedFolder)}
                      className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:border-[#a855f7]"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreate(selectedFolder.id)}
                      className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:border-[#a855f7]"
                    >
                      New Folder
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerFolder(selectedFolder)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
                    >
                      Add Problems
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMoveDestId(selectedFolder.parentId);
                        setMoveTarget({
                          kind: "folder",
                          folderId: selectedFolder.id,
                          name: selectedFolder.name,
                        });
                      }}
                      className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:border-[#a855f7]"
                    >
                      Move
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteMode("UNASSIGN");
                        setDeleteTarget(selectedFolder);
                      }}
                      className="rounded-lg border border-hard/40 px-3 py-1.5 text-xs font-semibold text-hard hover:bg-hard/10"
                    >
                      Delete
                    </button>
                  </div>

                  {selectedFolder.problems.length === 0 &&
                  selectedFolder.children.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-outline-variant/50 p-6 text-center">
                      <p className="text-sm text-on-surface-variant">
                        No problems here yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setPickerFolder(selectedFolder)}
                        className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
                      >
                        Add Problems
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
                        Direct problems
                      </p>
                      {selectedFolder.problems.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {p.title}
                            </p>
                            <p
                              className={`mono text-[11px] ${difficultyClass(
                                p.difficulty
                              )}`}
                            >
                              {p.difficulty}
                              {parseTopics(p.topics).length
                                ? ` · ${parseTopics(p.topics).slice(0, 2).join(", ")}`
                                : ""}
                            </p>
                          </div>
                          <Link
                            to={`/problems/${p.id}`}
                            className="shrink-0 text-xs font-semibold text-primary"
                          >
                            Open
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : selectedProblemLoc ? (
                <div className="space-y-5">
                  <nav className="flex flex-wrap items-center gap-1 text-[11px] text-on-surface-variant">
                    <button
                      type="button"
                      className="hover:text-primary"
                      onClick={() => setSelection(null)}
                    >
                      Home
                    </button>
                    {breadcrumbs.map((b) => (
                      <span key={b.id} className="flex items-center gap-1">
                        <span>/</span>
                        <button
                          type="button"
                          className="hover:text-primary"
                          onClick={() =>
                            setSelection({ type: "folder", folderId: b.id })
                          }
                        >
                          {b.name}
                        </button>
                      </span>
                    ))}
                  </nav>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">
                      {selectedProblemLoc.problem.title}
                    </h3>
                    <p
                      className={`mono mt-1 text-sm font-bold ${difficultyClass(
                        selectedProblemLoc.problem.difficulty
                      )}`}
                    >
                      {selectedProblemLoc.problem.difficulty}
                    </p>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      Problem ID #{selectedProblemLoc.problem.id}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Topics:{" "}
                      {parseTopics(selectedProblemLoc.problem.topics).join(
                        ", "
                      ) || "—"}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      In: {selectedProblemLoc.folder.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/problems/${selectedProblemLoc.problem.id}`}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
                    >
                      Open Problem
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMoveDestId(null);
                        setMoveTarget({
                          kind: "problem",
                          folderId: selectedProblemLoc.folder.id,
                          problemId: selectedProblemLoc.problem.id,
                          name: selectedProblemLoc.problem.title,
                        });
                      }}
                      className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold"
                    >
                      Move To
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void handleRemoveProblem(
                          selectedProblemLoc.folder.id,
                          selectedProblemLoc.problem.id
                        )
                      }
                      className="rounded-lg border border-hard/40 px-3 py-1.5 text-xs font-semibold text-hard"
                    >
                      Remove from folder
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[180px] overflow-hidden rounded-lg border border-outline-variant bg-surface-container py-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.kind === "folder" &&
            (() => {
              const folder = findFolder(tree, contextMenu.folderId);
              if (!folder) return null;
              return (
                <>
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-outline">
                    Organize
                  </p>
                  <MenuBtn
                    label="Add Problems"
                    onClick={() => {
                      setPickerFolder(folder);
                      setContextMenu(null);
                    }}
                  />
                  <MenuBtn
                    label="New Folder"
                    onClick={() => openCreate(folder.id)}
                  />
                  <MenuBtn
                    label="Move To"
                    onClick={() => {
                      setMoveDestId(folder.parentId);
                      setMoveTarget({
                        kind: "folder",
                        folderId: folder.id,
                        name: folder.name,
                      });
                      setContextMenu(null);
                    }}
                  />
                  <p className="mt-1 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-outline">
                    Order
                  </p>
                  <MenuBtn
                    label="Move Up"
                    onClick={() => {
                      void moveFolderUpDown(folder, -1);
                      setContextMenu(null);
                    }}
                  />
                  <MenuBtn
                    label="Move Down"
                    onClick={() => {
                      void moveFolderUpDown(folder, 1);
                      setContextMenu(null);
                    }}
                  />
                  <p className="mt-1 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-outline">
                    Manage
                  </p>
                  <MenuBtn
                    label="Rename"
                    onClick={() => startRename(folder)}
                  />
                  <MenuBtn
                    label="Delete"
                    danger
                    onClick={() => {
                      setDeleteMode("UNASSIGN");
                      setDeleteTarget(folder);
                      setContextMenu(null);
                    }}
                  />
                </>
              );
            })()}
          {contextMenu.kind === "problem" &&
            (() => {
              const loc = findProblemLocation(
                tree,
                contextMenu.folderId,
                contextMenu.problemId
              );
              if (!loc) return null;
              return (
                <>
                  <MenuBtn
                    label="Open Problem"
                    onClick={() => {
                      window.open(`/problems/${loc.problem.id}`, "_blank");
                      setContextMenu(null);
                    }}
                  />
                  <MenuBtn
                    label="Move To"
                    onClick={() => {
                      setMoveDestId(null);
                      setMoveTarget({
                        kind: "problem",
                        folderId: loc.folder.id,
                        problemId: loc.problem.id,
                        name: loc.problem.title,
                      });
                      setContextMenu(null);
                    }}
                  />
                  <MenuBtn
                    label="Move Up"
                    onClick={() => {
                      void moveProblemUpDown(loc.folder, loc.problem, -1);
                      setContextMenu(null);
                    }}
                  />
                  <MenuBtn
                    label="Move Down"
                    onClick={() => {
                      void moveProblemUpDown(loc.folder, loc.problem, 1);
                      setContextMenu(null);
                    }}
                  />
                  <MenuBtn
                    label="Remove from folder"
                    danger
                    onClick={() => {
                      void handleRemoveProblem(loc.folder.id, loc.problem.id);
                      setContextMenu(null);
                    }}
                  />
                </>
              );
            })()}
        </div>
      )}

      {/* Create modal */}
      <DsaModal
        open={createOpen}
        title={createParentId == null ? "New Module" : "Create Folder"}
        onClose={() => setCreateOpen(false)}
      >
        {createParentId != null && (
          <p className="mb-3 text-xs text-on-surface-variant">
            Parent:{" "}
            <strong>{findFolder(tree, createParentId)?.name ?? "—"}</strong>
          </p>
        )}
        <label className="mb-3 block text-xs font-semibold text-on-surface-variant">
          Name
          <input
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-[#a855f7]"
            placeholder="e.g. Arrays"
          />
        </label>
        <label className="mb-4 block text-xs font-semibold text-on-surface-variant">
          Description (optional)
          <textarea
            value={createDesc}
            onChange={(e) => setCreateDesc(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-[#a855f7]"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(false)}
            className="rounded-lg border border-outline-variant px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!createName.trim() || creating}
            onClick={() => void submitCreate()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-40"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </DsaModal>

      {/* Delete modal */}
      <DsaModal
        open={!!deleteTarget}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : "Delete"}
        onClose={() => setDeleteTarget(null)}
      >
        {deleteTarget && (
          <>
            <p className="mb-3 text-sm text-on-surface-variant">
              This folder contains{" "}
              <strong>{deleteTarget.subfolderCount}</strong> subfolders and{" "}
              <strong>{deleteTarget.totalProblemCount}</strong> problems (nested).
              Problems are never deleted from the catalog.
            </p>
            <div className="mb-4 space-y-2 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  checked={deleteMode === "UNASSIGN"}
                  onChange={() => setDeleteMode("UNASSIGN")}
                />
                <span>
                  Remove folder and unassign its problems (default)
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  checked={deleteMode === "MOVE_TO_PARENT"}
                  onChange={() => setDeleteMode("MOVE_TO_PARENT")}
                />
                <span>Move contents to parent</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-hard px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </>
        )}
      </DsaModal>

      {/* Move dialog */}
      <DsaModal
        open={!!moveTarget}
        title={moveTarget ? `Move "${moveTarget.name}"` : "Move"}
        onClose={() => setMoveTarget(null)}
      >
        {moveTarget && (
          <>
            <label className="mb-4 block text-xs font-semibold text-on-surface-variant">
              Destination folder
              <select
                value={
                  moveTarget.kind === "folder"
                    ? moveDestId == null
                      ? ""
                      : String(moveDestId)
                    : moveDestId == null
                      ? ""
                      : String(moveDestId)
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setMoveDestId(v === "" ? null : Number(v));
                }}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
              >
                {moveTarget.kind === "folder" ? (
                  <option value="">Sheet root</option>
                ) : (
                  <option value="" disabled>
                    Select a folder…
                  </option>
                )}
                {renderFolderPickerOptions(
                  tree,
                  0,
                  moveTarget.kind === "folder"
                    ? descendantFolderIds(
                        findFolder(tree, moveTarget.folderId) ?? {
                          id: moveTarget.folderId,
                          sheetId: sheetId ?? 0,
                          parentId: null,
                          name: "",
                          description: null,
                          position: 0,
                          directProblemCount: 0,
                          subfolderCount: 0,
                          totalProblemCount: 0,
                          children: [],
                          problems: [],
                        }
                      )
                    : new Set()
                )}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMoveTarget(null)}
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={moveTarget.kind === "problem" && moveDestId == null}
                onClick={() => void submitMove()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-40"
              >
                Move
              </button>
            </div>
          </>
        )}
      </DsaModal>

      {pickerFolder && (
        <ProblemPickerModal
          open={!!pickerFolder}
          folderName={pickerFolder.name}
          problems={catalog}
          alreadyInFolder={
            new Set(pickerFolder.problems.map((p) => p.id))
          }
          onClose={() => setPickerFolder(null)}
          onAdd={handleAssign}
        />
      )}
    </div>
  );
}

function MenuBtn({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-surface-container-high ${
        danger ? "text-hard" : "text-on-surface"
      }`}
    >
      {label}
    </button>
  );
}
