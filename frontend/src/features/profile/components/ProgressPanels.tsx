import type { DifficultyStats, LanguageUsage, TopicProgress, WeeklyBucket } from "../types";
import { ExpandToggle, useExpandableList } from "./ExpandableList";

export function DifficultyProgress({
  difficulty,
}: {
  difficulty: DifficultyStats;
}) {
  const rows = [
    {
      label: "Easy",
      solved: difficulty.easy,
      total: Math.max(difficulty.totalAvailable.easy, difficulty.easy),
      color: "var(--ok)",
    },
    {
      label: "Medium",
      solved: difficulty.medium,
      total: Math.max(difficulty.totalAvailable.medium, difficulty.medium),
      color: "var(--warn)",
    },
    {
      label: "Hard",
      solved: difficulty.hard,
      total: Math.max(difficulty.totalAvailable.hard, difficulty.hard),
      color: "var(--err)",
    },
  ];

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-sm font-semibold">Solved by difficulty</h2>
      <div className="space-y-3">
        {rows.map((row) => {
          const pct = row.total ? Math.round((row.solved / row.total) * 100) : 0;
          return (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-[var(--text-dim)]">{row.label}</span>
                <span>
                  {row.solved}/{row.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-inset)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: row.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TopicProgressList({ topics }: { topics: TopicProgress[] }) {
  const sorted = [...topics].sort(
    (a, b) => b.solved - a.solved || b.total - a.total
  );
  const list = useExpandableList(sorted);

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-sm font-semibold">Topic progress</h2>
      {topics.length === 0 ? (
        <p className="text-sm text-[var(--text-dim)]">No topic progress yet.</p>
      ) : (
        <div className="space-y-3">
          {list.visible.map((t) => {
            const pct = t.total ? Math.round((t.solved / t.total) * 100) : 0;
            return (
              <div key={t.topic}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[var(--text)]">{t.topic}</span>
                  <span className="text-[var(--text-dim)]">
                    {t.solved}/{t.total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-inset)]">
                  <div
                    className="h-full rounded-full bg-[var(--info)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {list.canToggle && (
        <ExpandToggle
          expanded={list.expanded}
          hiddenCount={list.hiddenCount}
          onToggle={list.toggle}
        />
      )}
    </section>
  );
}

export function LanguageBreakdown({ languages }: { languages: LanguageUsage[] }) {
  const sorted = [...languages].sort((a, b) => b.percent - a.percent);
  const list = useExpandableList(sorted);

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-sm font-semibold">Language usage</h2>
      {languages.length === 0 ? (
        <p className="text-sm text-[var(--text-dim)]">No submissions yet.</p>
      ) : (
        <div className="space-y-2">
          {list.visible.map((lang) => (
            <div key={lang.language} className="flex items-center gap-3">
              <div className="w-20 truncate text-xs capitalize text-[var(--text-dim)]">
                {lang.language}
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-inset)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${lang.percent}%` }}
                />
              </div>
              <div className="w-12 text-right text-xs text-[var(--text-dim)]">
                {lang.percent}%
              </div>
            </div>
          ))}
        </div>
      )}
      {list.canToggle && (
        <ExpandToggle
          expanded={list.expanded}
          hiddenCount={list.hiddenCount}
          onToggle={list.toggle}
        />
      )}
    </section>
  );
}

export function ActivityBars({
  title,
  buckets,
}: {
  title: string;
  buckets: WeeklyBucket[];
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <div className="flex h-32 items-end gap-2">
        {buckets.map((b) => (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-[var(--info)]/80 transition-all"
              style={{ height: `${Math.max(8, (b.count / max) * 100)}%` }}
              title={`${b.label}: ${b.count}`}
            />
            <span className="truncate text-[10px] text-[var(--text-dim)]">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
