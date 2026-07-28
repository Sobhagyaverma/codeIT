import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Shapes } from "lucide-react";
import EmptyState from "../../../components/EmptyState";
import LessonCard from "../../learn/components/LessonCard";
import { getLearnSection } from "../../learn/content/sections";
import { useLessonProgress } from "../../learn/hooks/useLessonProgress";
import ProgressBar from "../../practice/components/ProgressBar";
import ProblemListRow from "../../practice/components/ProblemListRow";
import type { PracticeProblem } from "../../practice/types";

const COLLAPSE_KEY = "codeit:patterns:collapsed:v1";
const TAB_KEY = "codeit:patterns:tab:v1";

type PatternTab = "learn" | "easy" | "medium" | "hard";

const TABS: { id: PatternTab; label: string }[] = [
  { id: "learn", label: "Learn Basics" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function readTab(): PatternTab {
  try {
    const raw = localStorage.getItem(TAB_KEY);
    if (raw === "easy" || raw === "medium" || raw === "hard" || raw === "learn") {
      return raw;
    }
  } catch {
    // ignore
  }
  return "learn";
}

function tierStats(problems: PracticeProblem[], difficulty: string) {
  const tier = problems.filter(
    (p) => p.difficulty.toUpperCase() === difficulty
  );
  const solved = tier.filter((p) => p.status === "SOLVED").length;
  return { solved, total: tier.length };
}

export default function PatternProblemsSection({
  problems,
  solvedProblemIds,
  onToggleFavorite,
  canFavorite,
}: {
  problems: PracticeProblem[];
  solvedProblemIds?: Set<number>;
  onToggleFavorite: (id: number) => Promise<void>;
  canFavorite: boolean;
}) {
  const section = getLearnSection("pattern-basics");
  const lessons = section?.lessons ?? [];
  const { isRead, completedCount, totalCount } = useLessonProgress(
    "pattern-basics",
    lessons,
    solvedProblemIds
  );

  const [open, setOpen] = useState(() => !readCollapsed());
  const [tab, setTab] = useState<PatternTab>(readTab);

  const patternProblems = useMemo(
    () =>
      problems.filter((p) =>
        p.topics.some((t) => t === "Pattern Problems")
      ),
    [problems]
  );

  const easy = useMemo(
    () => tierStats(patternProblems, "EASY"),
    [patternProblems]
  );
  const medium = useMemo(
    () => tierStats(patternProblems, "MEDIUM"),
    [patternProblems]
  );
  const hard = useMemo(
    () => tierStats(patternProblems, "HARD"),
    [patternProblems]
  );

  const tierProblems = useMemo(() => {
    const diff =
      tab === "easy" ? "EASY" : tab === "medium" ? "MEDIUM" : tab === "hard" ? "HARD" : null;
    if (!diff) return [];
    return patternProblems.filter((p) => p.difficulty.toUpperCase() === diff);
  }, [patternProblems, tab]);

  const solvedTotal =
    easy.solved + medium.solved + hard.solved;
  const totalProblems = easy.total + medium.total + hard.total;
  const percent = totalProblems
    ? Math.round((solvedTotal / totalProblems) * 100)
    : totalCount
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, open ? "0" : "1");
    } catch {
      // ignore
    }
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      // ignore
    }
  }, [tab]);

  if (!section) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 practice-glass practice-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 px-4 py-4 text-left transition hover:bg-[var(--bg-inset)]/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="display text-base font-semibold">Pattern Problems</h3>
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--text-dim)]">
              {solvedTotal}/{totalProblems || "—"}
            </span>
            <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 text-[11px] text-[var(--accent)]">
              {percent}%
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-dim)]">
            Learn the loop mindset, then grind Easy → Medium → Hard shape problems.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="text-[var(--info)]">
              Learn Basics {completedCount}/{totalCount}
            </span>
            <span className="text-[var(--ok)]">
              Easy {easy.solved}/{easy.total}
            </span>
            <span className="text-[var(--accent)]">
              Med {medium.solved}/{medium.total}
            </span>
            <span className="text-[var(--err)]">
              Hard {hard.solved}/{hard.total}
            </span>
          </div>
          <ProgressBar value={percent} className="mt-3" />
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
            <div className="border-b border-[var(--line)] px-4 py-3">
              <div
                className="inline-flex flex-wrap gap-1 rounded-xl border border-[var(--line)] bg-[var(--bg-inset)]/60 p-1"
                role="tablist"
                aria-label="Pattern Problems tabs"
              >
                {TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(t.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? "border border-[var(--accent)]/40 bg-[var(--accent)]/20 text-[var(--accent)]"
                          : "border border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {tab === "learn" ? (
              <>
                {lessons.map((lesson) => (
                  <LessonCard
                    key={lesson.slug}
                    sectionId="pattern-basics"
                    lesson={lesson}
                    complete={isRead(lesson.slug)}
                  />
                ))}
                <div className="border-t border-[var(--line)] px-4 py-2 text-[11px] text-[var(--text-dim)]">
                  <ExternalLink className="mr-1 inline h-3 w-3" aria-hidden />
                  Open any lesson to read (and solve when linked).
                </div>
              </>
            ) : tierProblems.length === 0 ? (
              <EmptyState
                icon={Shapes}
                title={`No ${tab} patterns yet`}
                subtitle="Problems will appear here after they are added to the catalog."
                size="sm"
                bordered={false}
                className="px-4 py-6"
              />
            ) : (
              <>
                {tierProblems.map((problem) => (
                  <ProblemListRow
                    key={problem.id}
                    problem={problem}
                    onToggleFavorite={onToggleFavorite}
                    canFavorite={canFavorite}
                  />
                ))}
                <div className="border-t border-[var(--line)] px-4 py-2 text-[11px] text-[var(--text-dim)]">
                  <ExternalLink className="mr-1 inline h-3 w-3" aria-hidden />
                  Open any row to jump into the CodeIT editor.
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
