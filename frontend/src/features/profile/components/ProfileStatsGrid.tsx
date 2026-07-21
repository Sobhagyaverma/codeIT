import type { ProfileStats } from "../types";

function StatCard({
  label,
  value,
  hint,
  demo,
}: {
  label: string;
  value: string | number;
  hint?: string;
  demo?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="verdict-strip text-[var(--text-dim)]">{label}</div>
        {demo && (
          <span className="rounded border border-[var(--warn)]/30 bg-[var(--warn)]/10 px-1.5 py-0.5 text-[10px] text-[var(--warn)]">
            Demo
          </span>
        )}
      </div>
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
        demo={stats.ratingSource === "demo"}
        hint="Future-ready rating"
      />
      <StatCard
        label="Easy / Med / Hard"
        value={`${stats.difficulty.easy} / ${stats.difficulty.medium} / ${stats.difficulty.hard}`}
      />
      <StatCard
        label="Current streak"
        value={`${stats.currentStreak}d`}
        demo={stats.streaksSource === "demo"}
      />
      <StatCard
        label="Longest streak"
        value={`${stats.longestStreak}d`}
        demo={stats.streaksSource === "demo"}
      />
      <StatCard
        label="Best contest rank"
        value={stats.contestBestRank != null ? `#${stats.contestBestRank}` : "—"}
        demo={stats.contestBestRankSource === "demo"}
      />
    </div>
  );
}
