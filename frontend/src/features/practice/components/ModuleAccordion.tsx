import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ExternalLink } from "lucide-react";
import type { PracticeModule } from "../types";
import EmptyState from "../../../components/EmptyState";
import ProgressBar from "./ProgressBar";
import ProblemListRow from "./ProblemListRow";

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
              <EmptyState
                icon={BookOpen}
                title="No problems yet"
                subtitle="No problems mapped to this module yet."
                size="sm"
                bordered={false}
                className="px-4 py-6"
              />
            ) : (
              module.problems.map((problem) => (
                <ProblemListRow
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
