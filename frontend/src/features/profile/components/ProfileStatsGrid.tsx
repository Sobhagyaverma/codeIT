import type { ProfileStats } from "../types";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <div className="verdict-strip text-[var(--text-dim)]">{label}</div>
      <div className="display mt-2 text-2xl font-semibold text-[var(--text)]">
        {value}
      </div>
      {hint && <p className="mt-1 text-xs text-[var(--text-dim)]">{hint}</p>}
    </div>
  );
}

export default function ProfileStatsGrid({ stats }: { stats: ProfileStats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Problems solved" value={stats.totalSolved} />
      <StatCard
        label="Acceptance"
        value={`${stats.acceptanceRate}%`}
        hint={`${stats.totalSubmissions} submissions`}
      />
      <StatCard
        label="Total runtime"
        value={`${stats.totalRuntimeSeconds}s`}
        hint="Sum of recorded execution times"
      />
      <StatCard
        label="Contest rating"
        value={stats.rating ?? "—"}
        hint={stats.rating == null ? "Not available yet" : undefined}
      />
      <StatCard
        label="Easy / Med / Hard"
        value={`${stats.difficulty.easy} / ${stats.difficulty.medium} / ${stats.difficulty.hard}`}
      />
      <StatCard label="Current streak" value={`${stats.currentStreak}d`} />
      <StatCard label="Longest streak" value={`${stats.longestStreak}d`} />
      <StatCard
        label="Best contest rank"
        value={
          stats.contestBestRank != null ? `#${stats.contestBestRank}` : "—"
        }
      />
    </div>
  );
}
