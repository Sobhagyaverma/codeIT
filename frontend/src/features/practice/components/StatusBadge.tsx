import type { PracticeProblemStatus } from "../types";

const STATUS_CONTENT: Record<
  PracticeProblemStatus,
  { icon: string; label: string; className: string }
> = {
  SOLVED: {
    icon: "✅",
    label: "Solved",
    className: "border-[var(--ok)]/30 bg-[var(--ok)]/10 text-[var(--ok)]",
  },
  ATTEMPTED: {
    icon: "🟡",
    label: "Attempted",
    className: "border-[var(--warn)]/30 bg-[var(--warn)]/10 text-[var(--warn)]",
  },
  NOT_STARTED: {
    icon: "⚪",
    label: "Not started",
    className: "border-[var(--line)] bg-[var(--bg-inset)] text-[var(--text-dim)]",
  },
};

export function BookmarkIndicator({ bookmarked }: { bookmarked: boolean }) {
  if (!bookmarked) return null;
  return (
    <span
      aria-label="Bookmarked"
      className="text-[var(--warn)]"
      role="img"
      title="Bookmarked"
    >
      ★
    </span>
  );
}

export default function StatusBadge({
  status,
  className = "",
}: {
  status: PracticeProblemStatus;
  className?: string;
}) {
  const content = STATUS_CONTENT[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${content.className} ${className}`}
    >
      <span aria-hidden="true">{content.icon}</span>
      {content.label}
    </span>
  );
}
