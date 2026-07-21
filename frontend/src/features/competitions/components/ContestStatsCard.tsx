export default function ContestStatsCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 p-4 practice-glass practice-card">
      <div className="verdict-strip text-[var(--text-dim)]">{label}</div>
      <div className="display mt-2 text-2xl font-semibold text-[var(--text)]">
        {value}
      </div>
      {hint && <p className="mt-1 text-xs text-[var(--text-dim)]">{hint}</p>}
    </div>
  );
}
