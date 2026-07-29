import { useEffect, useMemo, useState } from "react";
import { PanelLeft } from "lucide-react";
import { getLearnSection } from "../content/sections";
import { lessonProblemIds } from "../types";
import { useLessonProgress } from "../hooks/useLessonProgress";
import { usePracticeCatalog } from "../../practice/hooks/usePracticeCatalog";
import LessonTopicPanel from "./LessonTopicPanel";

function navKey(sectionId: string) {
  return `codeit:learn:${sectionId}:nav:v1`;
}

function readNavOpen(sectionId: string): boolean {
  try {
    const raw = localStorage.getItem(navKey(sectionId));
    if (raw === "0") return false;
    if (raw === "1") return true;
  } catch {
    // ignore
  }
  return true;
}

/**
 * Dedicated left rail for a learn section.
 * Reused on lesson pages and linked problem pages.
 */
export default function LessonSideRail({
  sectionId,
  currentSlug,
  activeProblemId,
  stickyClassName = "top-0 h-full",
}: {
  sectionId: string;
  currentSlug?: string;
  activeProblemId?: number;
  /** Sticky positioning for the desktop/mobile closed rail */
  stickyClassName?: string;
}) {
  const section = getLearnSection(sectionId);
  const lessons = section?.lessons ?? [];
  const { data } = usePracticeCatalog();
  const [navOpen, setNavOpen] = useState(() => readNavOpen(sectionId));

  const solvedProblemIds = useMemo(() => {
    const set = new Set<number>();
    data?.problems.forEach((p) => {
      if (p.status === "SOLVED") set.add(p.id);
    });
    return set;
  }, [data]);

  const { isRead, completedCount, totalCount } = useLessonProgress(
    sectionId,
    lessons,
    solvedProblemIds
  );

  const resolvedSlug =
    currentSlug ??
    lessons.find((l) =>
      activeProblemId != null
        ? lessonProblemIds(l).includes(activeProblemId)
        : false
    )?.slug ??
    "";

  useEffect(() => {
    setNavOpen(readNavOpen(sectionId));
  }, [sectionId]);

  useEffect(() => {
    try {
      localStorage.setItem(navKey(sectionId), navOpen ? "1" : "0");
    } catch {
      // ignore
    }
  }, [navOpen, sectionId]);

  if (!section) return null;

  return (
    <>
      <aside
        id={`${sectionId}-topic-nav`}
        className={`z-20 hidden shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-raised)] transition-[width] duration-200 ease-out lg:flex sticky ${stickyClassName} ${
          navOpen ? "w-[16.5rem]" : "w-12"
        }`}
      >
        {navOpen ? (
          <div className="h-full w-[16.5rem]">
            <LessonTopicPanel
              sectionId={sectionId}
              sectionTitle={section.title}
              lessons={lessons}
              currentSlug={resolvedSlug}
              activeProblemId={activeProblemId}
              preferProblemLinks={activeProblemId != null}
              isRead={isRead}
              completedCount={completedCount}
              totalCount={totalCount}
              onClose={() => setNavOpen(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="flex h-full w-12 flex-col items-center gap-3 pt-5 text-[var(--text-dim)] transition hover:bg-[var(--bg-inset)]/50 hover:text-[var(--accent)]"
            aria-expanded={false}
            title="Open topics"
          >
            <PanelLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="verdict-strip text-[10px] tracking-widest [writing-mode:vertical-rl] rotate-180">
              Topics
            </span>
          </button>
        )}
      </aside>

      {!navOpen && (
        <aside
          className={`z-20 flex w-12 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-raised)] lg:hidden sticky ${stickyClassName}`}
        >
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="flex h-full w-12 flex-col items-center gap-3 pt-5 text-[var(--text-dim)] transition hover:bg-[var(--bg-inset)]/50 hover:text-[var(--accent)]"
            aria-expanded={false}
            title="Open topics"
          >
            <PanelLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="verdict-strip text-[10px] tracking-widest [writing-mode:vertical-rl] rotate-180">
              Topics
            </span>
          </button>
        </aside>
      )}

      {navOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          aria-label="Close topic panel"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[16.5rem] flex-col border-r border-[var(--line)] bg-[var(--bg-raised)] pt-14 shadow-xl transition-transform duration-200 ease-out lg:hidden ${
          navOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
        aria-hidden={!navOpen}
      >
        <LessonTopicPanel
          sectionId={sectionId}
          sectionTitle={section.title}
          lessons={lessons}
          currentSlug={resolvedSlug}
          activeProblemId={activeProblemId}
          preferProblemLinks={activeProblemId != null}
          isRead={isRead}
          completedCount={completedCount}
          totalCount={totalCount}
          onClose={() => setNavOpen(false)}
        />
      </aside>
    </>
  );
}
