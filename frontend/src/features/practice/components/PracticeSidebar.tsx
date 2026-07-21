import { Link } from "react-router-dom";
import { Flame, Target, Sparkles } from "lucide-react";
import type { PracticeCatalogData } from "../types";
import ContributionHeatmap from "../../profile/components/ContributionHeatmap";
import ProgressCircle from "./ProgressCircle";
import ProgressBar from "./ProgressBar";
import SidebarWidget from "./SidebarWidget";
import ComingSoonButton from "./ComingSoonButton";

export default function PracticeSidebar({
  data,
  mode,
}: {
  data: PracticeCatalogData;
  mode: "sheet" | "problems";
}) {
  const overall =
    data.stats.total > 0
      ? Math.round((data.stats.solved / data.stats.total) * 100)
      : 0;
  const weeklyPct = Math.min(
    100,
    Math.round((data.weeklyGoal.completed / Math.max(1, data.weeklyGoal.target)) * 100)
  );

  return (
    <aside className="space-y-4 lg:sticky lg:top-20">
      <SidebarWidget title="Overall progress">
        <div className="flex items-center gap-4">
          <ProgressCircle value={overall} size={84} label="Overall progress" />
          <div className="min-w-0 space-y-1 text-sm">
            <div className="font-semibold text-[var(--text)]">
              {data.stats.solved}/{data.stats.total} solved
            </div>
            <div className="text-xs text-[var(--text-dim)]">
              Easy {data.stats.difficulty.solved.easy} · Med{" "}
              {data.stats.difficulty.solved.medium} · Hard{" "}
              {data.stats.difficulty.solved.hard}
            </div>
            <ProgressBar value={overall} className="mt-2" />
          </div>
        </div>
      </SidebarWidget>

      <div className="grid grid-cols-2 gap-3">
        <SidebarWidget title="Streak">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-[var(--accent)]" aria-hidden />
            <div>
              <div className="display text-xl font-semibold">{data.streak}</div>
              <div className="text-[11px] text-[var(--text-dim)]">day streak</div>
            </div>
          </div>
        </SidebarWidget>
        <SidebarWidget title="Weekly goal">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--info)]" aria-hidden />
            <div>
              <div className="display text-xl font-semibold">
                {data.weeklyGoal.completed}/{data.weeklyGoal.target}
              </div>
              <div className="text-[11px] text-[var(--text-dim)]">{weeklyPct}%</div>
            </div>
          </div>
          <ProgressBar value={weeklyPct} className="mt-2" />
        </SidebarWidget>
      </div>

      {data.heatmap.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 practice-glass">
          <ContributionHeatmap days={data.heatmap} />
        </div>
      )}

      <SidebarWidget title="Continue learning">
        {data.continueProblem ? (
          <Link
            to={`/problems/${data.continueProblem.id}`}
            className="block rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/5 p-3 transition hover:border-[var(--accent)]/50"
          >
            <div className="text-sm font-medium">{data.continueProblem.title}</div>
            <div className="mt-1 text-xs text-[var(--text-dim)]">
              {data.continueProblem.difficulty} · Pick up where you left off
            </div>
          </Link>
        ) : (
          <p className="text-sm text-[var(--text-dim)]">
            Attempt a problem to unlock your continue trail.
          </p>
        )}
      </SidebarWidget>

      <SidebarWidget title="Recently solved">
        {data.recentSolved.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">No accepted solves yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.recentSolved.slice(0, 5).map((problem) => (
              <li key={problem.id}>
                <Link
                  to={`/problems/${problem.id}`}
                  className="block truncate text-sm text-[var(--text)] hover:text-[var(--info)]"
                >
                  {problem.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SidebarWidget>

      <SidebarWidget
        title={mode === "sheet" ? "Daily challenge" : "Challenges"}
      >
        <div className="space-y-2">
          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-inset)] p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              Daily challenge
            </div>
            <p className="mt-1 text-xs text-[var(--text-dim)]">
              Curated daily picks arrive with the Practice challenge API.
            </p>
            <ComingSoonButton className="mt-3 w-full">
              Start challenge
            </ComingSoonButton>
          </div>
          {mode === "problems" && (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-inset)] p-3">
              <div className="text-sm font-medium">Weekly challenge</div>
              <p className="mt-1 text-xs text-[var(--text-dim)]">
                Multi-problem weekly sets are coming soon.
              </p>
              <ComingSoonButton className="mt-3 w-full">
                View weekly
              </ComingSoonButton>
            </div>
          )}
        </div>
      </SidebarWidget>

      {mode === "problems" && (
        <SidebarWidget title="Discover">
          <div className="space-y-2 text-sm text-[var(--text-dim)]">
            <p>Trending topics, suggested problems, and recommendations will appear here.</p>
            <ComingSoonButton className="w-full">
              Explore suggestions
            </ComingSoonButton>
          </div>
        </SidebarWidget>
      )}
    </aside>
  );
}
