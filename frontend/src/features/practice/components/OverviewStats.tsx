import type { PracticeStats } from "../types";
import { formatPercent } from "../utils";
import StatPill from "./StatPill";

export default function OverviewStats({
  stats,
  className = "",
}: {
  stats: PracticeStats;
  className?: string;
}) {
  return (
    <div
      aria-label="Practice overview"
      className={`flex flex-wrap gap-2 ${className}`}
    >
      <StatPill label="Total" value={stats.total} />
      <StatPill dotColor="var(--ok)" label="Solved" value={stats.solved} />
      <StatPill
        dotColor="var(--warn)"
        label="Attempted"
        value={stats.attempted}
      />
      <StatPill
        dotColor="var(--text-dim)"
        label="Not started"
        value={stats.notStarted}
      />
      <StatPill
        dotColor="var(--info)"
        label="Acceptance"
        value={formatPercent(stats.acceptanceRate)}
      />
    </div>
  );
}
