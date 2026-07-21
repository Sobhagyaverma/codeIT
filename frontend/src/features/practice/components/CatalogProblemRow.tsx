import { Link } from "react-router-dom";
import type { PracticeProblem } from "../types";
import {
  formatCompactNumber,
  formatPercent,
  formatRelativeShort,
} from "../utils";
import DifficultyBadge from "../../../components/DifficultyBadge";
import FavoriteButton from "./FavoriteButton";
import StatusBadge from "./StatusBadge";

export default function CatalogProblemRow({
  problem,
  index,
  onToggleFavorite,
  canFavorite,
}: {
  problem: PracticeProblem;
  index: number;
  onToggleFavorite: (id: number) => Promise<void>;
  canFavorite: boolean;
}) {
  return (
    <article className="practice-card rounded-xl border border-[var(--line)] bg-[var(--bg-raised)]/70 px-3 py-3 transition hover:-translate-y-0.5 hover:border-[var(--info)]/40 hover:shadow-[0_12px_30px_rgba(0,0,0,0.28)] sm:px-4">
      <div className="hidden items-center gap-3 lg:grid lg:grid-cols-[48px_minmax(0,1.6fr)_90px_100px_130px_44px_100px]">
        <div className="text-sm text-[var(--text-dim)]">{index}</div>
        <div className="min-w-0">
          <Link
            to={`/problems/${problem.id}`}
            className="block truncate text-sm font-medium hover:text-[var(--info)]"
          >
            {problem.title}
          </Link>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {problem.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] text-[var(--text-dim)]"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
        <div className="text-sm text-[var(--text-dim)]">
          {formatPercent(problem.acceptanceRate)}
        </div>
        <div>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div>
          <StatusBadge status={problem.status} />
        </div>
        <div>
          <FavoriteButton
            bookmarked={problem.bookmarked}
            disabled={!canFavorite}
            onToggle={() => onToggleFavorite(problem.id)}
          />
        </div>
        <div className="text-right text-xs text-[var(--text-dim)]">
          {formatRelativeShort(problem.lastAttemptAt)}
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] text-[var(--text-dim)]">#{index}</div>
            <Link
              to={`/problems/${problem.id}`}
              className="mt-0.5 block text-sm font-medium hover:text-[var(--info)]"
            >
              {problem.title}
            </Link>
          </div>
          <FavoriteButton
            bookmarked={problem.bookmarked}
            disabled={!canFavorite}
            onToggle={() => onToggleFavorite(problem.id)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          <StatusBadge status={problem.status} />
          <span className="text-xs text-[var(--text-dim)]">
            Acc {formatPercent(problem.acceptanceRate)}
          </span>
          <span className="text-xs text-[var(--text-dim)]">
            Solved {formatCompactNumber(problem.solvedCount)}
          </span>
        </div>
        <div className="text-xs text-[var(--text-dim)]">
          Last attempt {formatRelativeShort(problem.lastAttemptAt)}
        </div>
      </div>
    </article>
  );
}
