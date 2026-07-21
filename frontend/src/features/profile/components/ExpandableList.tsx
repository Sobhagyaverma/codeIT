import { useState } from "react";

const COLLAPSED_COUNT = 3;
const MAX_COUNT = 10;

/**
 * Collapsible list state: shows top 3 items collapsed, up to 10 expanded.
 * Lists with 3 or fewer items never show a toggle.
 */
export function useExpandableList<T>(items: T[]) {
  const [expanded, setExpanded] = useState(false);
  const capped = items.slice(0, MAX_COUNT);
  const visible = expanded ? capped : capped.slice(0, COLLAPSED_COUNT);
  const canToggle = capped.length > COLLAPSED_COUNT;
  const hiddenCount = capped.length - COLLAPSED_COUNT;

  return {
    visible,
    expanded,
    canToggle,
    hiddenCount,
    toggle: () => setExpanded((v) => !v),
  };
}

export function ExpandToggle({
  expanded,
  hiddenCount,
  onToggle,
}: {
  expanded: boolean;
  hiddenCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-3 w-full rounded-md border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--text-dim)] transition hover:border-[var(--info)] hover:text-[var(--text)]"
    >
      {expanded ? "Show less" : `Show ${hiddenCount} more`}
    </button>
  );
}
