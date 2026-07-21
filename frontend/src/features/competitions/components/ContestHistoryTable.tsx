import { Link } from "react-router-dom";
import ComingSoonButton from "../../practice/components/ComingSoonButton";
import type { ContestHistoryRow } from "../types";
import { formatContestWhen } from "../adapters";

export default function ContestHistoryTable({
  rows,
}: {
  rows: ContestHistoryRow[];
}) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-raised)] px-4 py-10 text-center text-sm text-[var(--text-dim)]">
        No contest participation yet. Join a live or upcoming contest to build
        history.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[var(--line)] text-[11px] uppercase tracking-wide text-[var(--text-dim)]">
          <tr>
            <th className="px-4 py-3 font-semibold">Contest</th>
            <th className="px-4 py-3 font-semibold">Rank</th>
            <th className="px-4 py-3 font-semibold">Solved</th>
            <th className="px-4 py-3 font-semibold">Penalty</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Rating</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {rows.map((row) => (
            <tr key={`${row.competitionId}-${row.title}`}>
              <td className="px-4 py-3 font-medium text-[var(--text)]">
                {row.title}
              </td>
              <td className="px-4 py-3 text-[var(--accent)]">
                {row.rank != null ? `#${row.rank}` : "—"}
              </td>
              <td className="px-4 py-3">{row.solved}</td>
              <td className="px-4 py-3 text-[var(--text-dim)]">
                {row.score != null ? `${row.score}s` : "—"}
              </td>
              <td className="px-4 py-3 text-[var(--text-dim)]">
                {row.date ? formatContestWhen(row.date) : "—"}
              </td>
              <td className="px-4 py-3 text-[var(--text-dim)]">
                {row.ratingDelta != null
                  ? `${row.ratingDelta >= 0 ? "+" : ""}${row.ratingDelta}`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/competitions/${row.competitionId}`}
                    className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs text-[var(--text-dim)] hover:border-[var(--info)] hover:text-[var(--text)]"
                  >
                    Leaderboard
                  </Link>
                  <ComingSoonButton className="px-2.5 py-1 text-xs">
                    Virtual
                  </ComingSoonButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
