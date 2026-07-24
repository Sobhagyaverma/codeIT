import { useMemo, useState } from "react";
import { LIBRARY_CATEGORIES, LIBRARY_ITEMS } from "./catalog";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  onStamp: (factoryId: string) => void;
  disabled?: boolean;
};

export default function DsaLibraryPanel({
  collapsed,
  onToggle,
  onStamp,
  disabled,
}: Props) {
  const [query, setQuery] = useState("");
  const [openCat, setOpenCat] = useState<string>("arrays");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LIBRARY_ITEMS;
    return LIBRARY_ITEMS.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [query]);

  if (collapsed) {
    return (
      <aside className="flex w-11 shrink-0 flex-col items-center border-r border-[var(--line)] bg-[var(--bg-raised)]/50 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md px-2 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10"
          title="Open DSA Library"
        >
          DSA
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-raised)]/40">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-2 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
          DSA Library
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="rounded px-1.5 py-0.5 text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
          title="Collapse"
        >
          «
        </button>
      </div>
      <div className="border-b border-[var(--line)] p-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search components…"
          className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {LIBRARY_CATEGORIES.map((cat) => {
          const items = filtered.filter((i) => i.category === cat.id);
          if (items.length === 0) return null;
          const open = openCat === cat.id || !!query;
          return (
            <div key={cat.id} className="mb-1">
              <button
                type="button"
                onClick={() =>
                  setOpenCat((c) => (c === cat.id ? "" : cat.id))
                }
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)] hover:bg-[var(--bg-inset)]"
              >
                {cat.label}
                <span className="text-[10px]">{open ? "▾" : "▸"}</span>
              </button>
              {open && (
                <ul className="mt-0.5 space-y-0.5 px-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onStamp(item.factoryId)}
                        className="w-full rounded-md border border-transparent px-2 py-1.5 text-left text-xs text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 disabled:opacity-40"
                        title="Click to place on the board"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <p className="border-t border-[var(--line)] px-2 py-1.5 text-[10px] text-[var(--text-dim)]">
        Click a component to place it
      </p>
    </aside>
  );
}
