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

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function dateKey(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function displayDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ContributionHeatmap({
  days,
}: {
  days: ActivityDay[];
}) {
  const currentYear = new Date().getFullYear();
  const availableYears = days
    .map((day) => Number(day.date.slice(0, 4)))
    .filter(Number.isFinite);
  const year = availableYears.includes(currentYear)
    ? currentYear
    : Math.max(currentYear, ...availableYears);

  const counts = new Map(
    days
      .filter((day) => day.date.startsWith(`${year}-`))
      .map((day) => [day.date, day.count])
  );

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));
  const gridStart = new Date(yearStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());
  const gridEnd = new Date(yearEnd);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay()));

  const weekCount =
    Math.floor((gridEnd.getTime() - gridStart.getTime()) / DAY_MS / 7) + 1;
  const cells = [];
  for (
    let time = gridStart.getTime();
    time <= gridEnd.getTime();
    time += DAY_MS
  ) {
    const date = new Date(time);
    const key = dateKey(date);
    cells.push({
      date,
      key,
      count: counts.get(key) ?? 0,
      inYear: date.getUTCFullYear() === year,
      week: Math.floor((time - gridStart.getTime()) / DAY_MS / 7),
      weekday: date.getUTCDay(),
    });
  }

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  const monthLabels = MONTHS.map((label, month) => {
    const first = Date.UTC(year, month, 1);
    const next = Date.UTC(year, month + 1, 1);
    return {
      label,
      week: Math.floor((first - gridStart.getTime()) / DAY_MS / 7),
      span: Math.max(4, Math.floor((next - first) / DAY_MS / 7)),
    };
  });

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 lg:col-span-2">
      <h2 className="mb-4 text-base font-semibold">
        {total} {total === 1 ? "submission" : "submissions"} in {year}
      </h2>
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[730px] gap-[3px]"
          style={{
            gridTemplateColumns: `32px repeat(${weekCount}, minmax(10px, 1fr))`,
            gridTemplateRows: "18px repeat(7, 12px)",
          }}
        >
          {monthLabels.map((month) => (
            <span
              key={month.label}
              className="text-[10px] text-[var(--text-dim)]"
              style={{
                gridColumn: `${month.week + 2} / span ${month.span}`,
                gridRow: 1,
              }}
            >
              {month.label}
            </span>
          ))}

          {[
            { label: "Mon", row: 3 },
            { label: "Wed", row: 5 },
            { label: "Fri", row: 7 },
          ].map((day) => (
            <span
              key={day.label}
              className="self-center text-[10px] text-[var(--text-dim)]"
              style={{ gridColumn: 1, gridRow: day.row }}
            >
              {day.label}
            </span>
          ))}

          {cells.map((cell) => {
            const description = `${cell.count} ${
              cell.count === 1 ? "submission" : "submissions"
            } on ${displayDate(cell.date)}`;

            return (
              <div
                key={cell.key}
                role={cell.inYear ? "img" : undefined}
                aria-label={cell.inYear ? description : undefined}
                title={cell.inYear ? description : undefined}
                className={`rounded-[2px] ${
                  cell.inYear
                    ? "outline-none transition hover:ring-1 hover:ring-[var(--text)]"
                    : "invisible"
                }`}
                style={{
                  gridColumn: cell.week + 2,
                  gridRow: cell.weekday + 2,
                  background: LEVELS[levelFor(cell.count)],
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-1 text-[10px] text-[var(--text-dim)]">
        <span className="mr-1">Less</span>
        {LEVELS.map((color, index) => (
          <span
            key={index}
            className="inline-block h-3 w-3 rounded-[2px]"
            style={{ background: color }}
          />
        ))}
        <span className="ml-1">More</span>
      </div>
    </section>
  );
}
