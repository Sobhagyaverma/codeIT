import type { ContestStatus, ContestType } from "../types";

const STATUS_STYLES: Record<
  ContestStatus,
  { label: string; className: string; pulse?: boolean }
> = {
  ACTIVE: {
    label: "LIVE",
    className:
      "border-[var(--ok)]/40 bg-[var(--ok)]/15 text-[var(--ok)]",
    pulse: true,
  },
  UPCOMING: {
    label: "STARTING SOON",
    className:
      "border-[var(--warn)]/40 bg-[var(--warn)]/10 text-[var(--warn)]",
  },
  ENDED: {
    label: "ENDED",
    className:
      "border-[var(--line)] bg-[var(--bg-inset)] text-[var(--text-dim)]",
  },
};

export default function ContestStatusBadge({
  status,
  contestType,
}: {
  status: ContestStatus;
  contestType?: ContestType;
}) {
  if (contestType === "PRACTICE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--info)]/40 bg-[var(--info)]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--info)]">
        Practice
      </span>
    );
  }

  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.className}`}
    >
      {style.pulse && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ok)]"
        />
      )}
      {style.label}
    </span>
  );
}
