import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ExternalLink,
  Film,
  NotebookPen,
  Play,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { PracticeModule, PracticeProblem } from "../types";
import { formatRelativeShort } from "../utils";
import DifficultyBadge from "../../../components/DifficultyBadge";
import ComingSoonButton from "./ComingSoonButton";
import FavoriteButton from "./FavoriteButton";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";

function SheetProblemRow({
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

export default function ModuleAccordion({
  module,
  open,
  onToggle,
  onToggleFavorite,
  canFavorite,
}: {
  module: PracticeModule;
  open: boolean;
  onToggle: () => void;
  onToggleFavorite: (id: number) => Promise<void>;
  canFavorite: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 practice-glass practice-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-4 px-4 py-4 text-left transition hover:bg-[var(--bg-inset)]/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="display text-base font-semibold">{module.title}</h3>
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--text-dim)]">
              {module.solved}/{module.total}
            </span>
            <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 text-[11px] text-[var(--accent)]">
              {module.percent}%
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-dim)]">{module.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="text-[var(--ok)]">
              Easy {module.difficulty.easy.solved}/{module.difficulty.easy.total}
            </span>
            <span className="text-[var(--accent)]">
              Med {module.difficulty.medium.solved}/{module.difficulty.medium.total}
            </span>
            <span className="text-[var(--err)]">
              Hard {module.difficulty.hard.solved}/{module.difficulty.hard.total}
            </span>
          </div>
          <ProgressBar value={module.percent} className="mt-3" />
        </div>
        <span className="mt-1 text-lg text-[var(--text-dim)]" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-[var(--line)]"
          >
            {module.problems.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[var(--text-dim)]">
                No problems mapped to this module yet.
              </p>
            ) : (
              module.problems.map((problem) => (
                <SheetProblemRow
                  key={problem.id}
                  problem={problem}
                  onToggleFavorite={onToggleFavorite}
                  canFavorite={canFavorite}
                />
              ))
            )}
            {module.problems.length > 0 && (
              <div className="border-t border-[var(--line)] px-4 py-2 text-[11px] text-[var(--text-dim)]">
                <ExternalLink className="mr-1 inline h-3 w-3" aria-hidden />
                Open any row to jump into the CodeIT editor.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
