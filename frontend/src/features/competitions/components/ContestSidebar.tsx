import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import SidebarWidget from "../../practice/components/SidebarWidget";
import ComingSoonButton from "../../practice/components/ComingSoonButton";
import type { ContestUserStats } from "../types";

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2">
      <div className="text-[11px] text-[var(--text-dim)]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--text)]">{value}</div>
    </div>
  );
}

export default function ContestSidebar({
  userStats,
  isAuthenticated,
}: {
  userStats: ContestUserStats;
  isAuthenticated: boolean;
}) {
  if (!isAuthenticated) {
    return (
      <aside className="space-y-4 lg:sticky lg:top-20">
        <SidebarWidget title="Your contest progress">
          <p className="text-sm text-[var(--text-dim)]">
            Sign in to track ranks, rating, and contest history.
          </p>
          <Link
            to="/login"
            className="mt-3 inline-flex rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[#0a0d12]"
          >
            Log in
          </Link>
        </SidebarWidget>
      </aside>
    );
  }

  return (
    <aside className="space-y-4 lg:sticky lg:top-20">
      <SidebarWidget title="Your contest progress">
        <div className="mb-3 flex items-center gap-2 text-sm text-[var(--text-dim)]">
          <Trophy className="h-4 w-4 text-[var(--accent)]" aria-hidden />
          Keep competing to improve your standing.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label="Best rank"
            value={userStats.bestRank != null ? `#${userStats.bestRank}` : "—"}
          />
          <Stat
            label="Recent rank"
            value={
              userStats.recentRank != null ? `#${userStats.recentRank}` : "—"
            }
          />
          <Stat label="Contests played" value={userStats.contestsPlayed} />
          <Stat
            label="Average rank"
            value={userStats.averageRank ?? "—"}
          />
          <Stat
            label="Current rating"
            value={userStats.currentRating ?? "—"}
          />
          <Stat
            label="Highest rating"
            value={userStats.highestRating ?? "—"}
          />
        </div>
        <p className="mt-3 text-xs text-[var(--text-dim)]">
          Rating and win rate unlock when the ratings API ships.
        </p>
      </SidebarWidget>

      <SidebarWidget title="Performance chart">
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-inset)] px-3 py-8 text-center text-sm text-[var(--text-dim)]">
          Rating graph coming soon
        </div>
      </SidebarWidget>

      <SidebarWidget title="Coming next">
        <div className="space-y-2 text-sm text-[var(--text-dim)]">
          <p>Live leaderboard peek, announcements, and virtual participation.</p>
          <ComingSoonButton className="w-full">
            Open live feed
          </ComingSoonButton>
        </div>
      </SidebarWidget>
    </aside>
  );
}
