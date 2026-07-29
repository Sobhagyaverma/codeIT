import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { LessonSection } from "../types";
import { useLearnLanguage } from "../hooks/useLearnLanguage";
import { useLessonProgress } from "../hooks/useLessonProgress";
import ProgressBar from "../../practice/components/ProgressBar";
import LearnLanguagePicker from "./LearnLanguagePicker";
import LessonCard from "./LessonCard";

function collapseKey(sectionId: string) {
  return `codeit:learn:${sectionId}:collapsed:v1`;
}

function readCollapsed(sectionId: string): boolean {
  try {
    return localStorage.getItem(collapseKey(sectionId)) === "1";
  } catch {
    return false;
  }
}

export default function LearnSectionCard({
  section,
  solvedProblemIds,
}: {
  section: LessonSection;
  solvedProblemIds?: Set<number>;
}) {
  const lessons = section.lessons;
  const { language, setLanguage } = useLearnLanguage();
  const { isRead, completedCount, totalCount } = useLessonProgress(
    section.id,
    lessons,
    solvedProblemIds
  );
  // Default expanded (collapsed = false), matching ModuleAccordion UX with +/−
  const [open, setOpen] = useState(() => !readCollapsed(section.id));

  const percent = useMemo(
    () => (totalCount ? Math.round((completedCount / totalCount) * 100) : 0),
    [completedCount, totalCount]
  );

  const readStats = useMemo(() => {
    const readLessons = lessons.filter((l) => l.kind === "read");
    const solveLessons = lessons.filter((l) => l.kind === "read+problem");
    const mixedLessons = lessons.filter((l) => l.kind === "solve");
    return {
      read: {
        solved: readLessons.filter((l) => isRead(l.slug)).length,
        total: readLessons.length,
      },
      solve: {
        solved: solveLessons.filter((l) => isRead(l.slug)).length,
        total: solveLessons.length,
      },
      mixed: {
        solved: mixedLessons.filter((l) => isRead(l.slug)).length,
        total: mixedLessons.length,
      },
    };
  }, [isRead, lessons]);

  useEffect(() => {
    try {
      localStorage.setItem(collapseKey(section.id), open ? "0" : "1");
    } catch {
      // ignore
    }
  }, [open, section.id]);

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
            <h3 className="display text-base font-semibold">{section.title}</h3>
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--text-dim)]">
              {completedCount}/{totalCount}
            </span>
            <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 text-[11px] text-[var(--accent)]">
              {percent}%
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-dim)]">{section.subtitle}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            {readStats.read.total > 0 && (
              <span className="text-[var(--ok)]">
                Read {readStats.read.solved}/{readStats.read.total}
              </span>
            )}
            {readStats.solve.total > 0 && (
              <span className="text-[var(--accent)]">
                Solve {readStats.solve.solved}/{readStats.solve.total}
              </span>
            )}
            {readStats.mixed.total > 0 && (
              <span className="text-[var(--info)]">
                Mixed {readStats.mixed.solved}/{readStats.mixed.total}
              </span>
            )}
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
              <p className="text-[11px] text-[var(--text-dim)]">
                Pick a language — code samples update in every lesson.
              </p>
              <LearnLanguagePicker
                language={language}
                onChange={setLanguage}
              />
            </div>
            {lessons.map((lesson, index) => {
              const showMixedDivider =
                section.id === "operators" &&
                lesson.kind === "solve" &&
                (index === 0 || lessons[index - 1]?.kind !== "solve");
              return (
                <div key={lesson.slug}>
                  {showMixedDivider && (
                    <div className="border-t border-[var(--line)] bg-[var(--bg-inset)]/40 px-4 py-2">
                      <p className="verdict-strip text-[10px] text-[var(--text-dim)]">
                        Mixed Operator Practice
                      </p>
                    </div>
                  )}
                  <LessonCard
                    sectionId={section.id}
                    lesson={lesson}
                    complete={isRead(lesson.slug)}
                  />
                </div>
              );
            })}
            <div className="border-t border-[var(--line)] px-4 py-2 text-[11px] text-[var(--text-dim)]">
              <ExternalLink className="mr-1 inline h-3 w-3" aria-hidden />
              Open any row to jump into the lesson.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
