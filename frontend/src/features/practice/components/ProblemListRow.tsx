import {
  BookOpen,
  Film,
  NotebookPen,
  Play,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { PracticeProblem } from "../types";
import { formatRelativeShort } from "../utils";
import DifficultyBadge from "../../../components/DifficultyBadge";
import ComingSoonButton from "./ComingSoonButton";
import FavoriteButton from "./FavoriteButton";
import StatusBadge from "./StatusBadge";

export default function ProblemListRow({
  problem,
  onToggleFavorite,
  canFavorite,
}: {
  problem: PracticeProblem;
  onToggleFavorite: (id: number) => Promise<void>;
  canFavorite: boolean;
}) {
  return (
    <div className="grid gap-3 border-t border-[var(--line)] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/problems/${problem.id}`}
            className="truncate text-sm font-medium text-[var(--text)] hover:text-[var(--info)]"
          >
            {problem.title}
          </Link>
          <DifficultyBadge difficulty={problem.difficulty} />
          <StatusBadge status={problem.status} />
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--text-dim)]">
          {problem.topics.slice(0, 3).map((topic) => (
            <span key={topic}>{topic}</span>
          ))}
          <span>Last solved {formatRelativeShort(problem.lastSolvedAt)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <FavoriteButton
          bookmarked={problem.bookmarked}
          disabled={!canFavorite}
          onToggle={() => onToggleFavorite(problem.id)}
        />
        <ComingSoonButton
          aria-label="Mark for revision"
          className="inline-flex h-8 w-8 items-center justify-center p-0"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        </ComingSoonButton>
        <ComingSoonButton
          aria-label="Notes"
          className="inline-flex h-8 w-8 items-center justify-center p-0"
        >
          <NotebookPen className="h-3.5 w-3.5" aria-hidden />
        </ComingSoonButton>
        <ComingSoonButton
          aria-label="Resources"
          className="inline-flex h-8 w-8 items-center justify-center p-0"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
        </ComingSoonButton>
        <ComingSoonButton
          aria-label="Video solution"
          className="inline-flex h-8 w-8 items-center justify-center p-0"
        >
          <Film className="h-3.5 w-3.5" aria-hidden />
        </ComingSoonButton>
        <Link
          to={`/problems/${problem.id}`}
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 text-xs font-semibold text-[#0a0d12] transition hover:brightness-110"
        >
          <Play className="h-3.5 w-3.5" aria-hidden />
          Practice
        </Link>
      </div>
    </div>
  );
}
