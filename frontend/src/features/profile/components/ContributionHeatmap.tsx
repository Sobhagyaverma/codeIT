import type { ActivityDay } from "../types";

const LEVELS = [
  "var(--bg-inset)",
  "color-mix(in srgb, var(--ok) 25%, var(--bg-inset))",
  "color-mix(in srgb, var(--ok) 45%, var(--bg-inset))",
  "color-mix(in srgb, var(--ok) 70%, var(--bg-inset))",
  "var(--ok)",
];

function levelFor(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export default function ContributionHeatmap({
  days,
  demo,
}: {
  days: ActivityDay[];
  demo?: boolean;
}) {
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Contribution heatmap</h2>
        {demo && (
          <span className="rounded border border-[var(--warn)]/30 bg-[var(--warn)]/10 px-1.5 py-0.5 text-[10px] text-[var(--warn)]">
            Demo analytics
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} submissions`}
                  className="h-2.5 w-2.5 rounded-[2px] sm:h-3 sm:w-3"
                  style={{ background: LEVELS[levelFor(day.count)] }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-[10px] text-[var(--text-dim)]">
        <span>Less</span>
        {LEVELS.map((c, i) => (
          <span
            key={i}
            className="inline-block h-2.5 w-2.5 rounded-[2px]"
            style={{ background: c }}
          />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}
