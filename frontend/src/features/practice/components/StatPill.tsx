import type { ReactNode } from "react";

type StatPillProps = {
  label: string;
  value: ReactNode;
  dotColor?: string;
  className?: string;
};

export default function StatPill({
  label,
  value,
  dotColor,
  className = "",
}: StatPillProps) {
  return (
    <div
      className={`inline-flex min-w-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-1.5 ${className}`}
    >
      {dotColor && (
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      )}
      <span className="truncate text-xs text-[var(--text-dim)]">{label}</span>
      <strong className="text-xs font-semibold text-[var(--text)]">{value}</strong>
    </div>
  );
}
