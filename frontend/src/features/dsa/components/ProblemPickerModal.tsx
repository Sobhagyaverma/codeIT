import { useMemo, useState } from "react";
import type { ProblemPublicDTO } from "../../../lib/authStorage";
import { DsaModal } from "./DsaModal";

type Diff = "ALL" | "EASY" | "MEDIUM" | "HARD";

function parseTopics(topics: string[] | string | undefined): string[] {
  if (!topics) return [];
  if (Array.isArray(topics)) return topics.map(String).filter(Boolean);
  const raw = topics.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    /* ignore */
  }
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

type Props = {
  open: boolean;
  folderName: string;
  problems: ProblemPublicDTO[];
  alreadyInFolder: Set<number>;
  onClose: () => void;
  onAdd: (ids: number[]) => Promise<void>;
};

export function ProblemPickerModal({
  open,
  folderName,
  problems,
  alreadyInFolder,
  onClose,
  onAdd,
}: Props) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Diff>("ALL");
  const [topic, setTopic] = useState("ALL");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 40;

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    for (const p of problems) for (const t of parseTopics(p.topics)) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [problems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return problems.filter((p) => {
      const diff = (p.difficulty || "").toUpperCase();
      if (difficulty !== "ALL" && !diff.startsWith(difficulty)) return false;
      const topics = parseTopics(p.topics);
      if (
        topic !== "ALL" &&
        !topics.some((t) => t.toLowerCase() === topic.toLowerCase())
      ) {
        return false;
      }
      if (q && !p.title.toLowerCase().includes(q) && !String(p.id).includes(q)) {
        return false;
      }
      return true;
    });
  }, [problems, search, difficulty, topic]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggle = (id: number) => {
    if (alreadyInFolder.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      await onAdd(Array.from(selected));
      setSelected(new Set());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DsaModal
      open={open}
      title={`Add Problems to ${folderName}`}
      onClose={onClose}
      wide
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant">
            search
          </span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search problems…"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2 pl-10 pr-3 text-sm text-on-surface outline-none focus:border-[#a855f7]"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value as Diff);
            setPage(1);
          }}
          className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface"
        >
          <option value="ALL">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <select
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            setPage(1);
          }}
          className="max-w-[180px] rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface"
        >
          <option value="ALL">All topics</option>
          {allTopics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 max-h-[420px] overflow-y-auto rounded-lg border border-outline-variant/40">
        {pageItems.length === 0 ? (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            No problems match your filters.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {pageItems.map((p) => {
              const inFolder = alreadyInFolder.has(p.id);
              const checked = selected.has(p.id) || inFolder;
              const topics = parseTopics(p.topics);
              return (
                <li key={p.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface-container-high/60 ${
                      inFolder ? "opacity-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={inFolder}
                      onChange={() => toggle(p.id)}
                      className="accent-[#a855f7]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-on-surface">
                        {p.title}
                      </p>
                      <p className="truncate text-[11px] text-on-surface-variant">
                        #{p.id}
                        {topics.length ? ` · ${topics.slice(0, 3).join(", ")}` : ""}
                        {inFolder ? " · already in folder" : ""}
                      </p>
                    </div>
                    <span
                      className={`mono text-[11px] font-bold ${
                        (p.difficulty || "").toUpperCase().startsWith("HARD")
                          ? "text-hard"
                          : (p.difficulty || "").toUpperCase().startsWith("MED")
                            ? "text-medium"
                            : "text-easy"
                      }`}
                    >
                      {p.difficulty}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span>Selected: {selected.size}</span>
          {pageCount > 1 && (
            <>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-outline-variant px-2 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                {page}/{pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-outline-variant px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selected.size === 0 || saving}
            onClick={() => void handleAdd()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-40"
          >
            {saving
              ? "Adding…"
              : `Add ${selected.size || ""} Problem${selected.size === 1 ? "" : "s"}`.trim()}
          </button>
        </div>
      </div>
    </DsaModal>
  );
}
