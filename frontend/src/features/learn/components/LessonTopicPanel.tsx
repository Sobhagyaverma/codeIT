import { Check, PanelLeftClose } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import type { Lesson } from "../types";
import { lessonProblemIds } from "../types";
import ProgressBar from "../../practice/components/ProgressBar";

function kindLabel(kind: Lesson["kind"]): string {
  if (kind === "read+problem") return "Read + Practice";
  if (kind === "solve") return "Practice set";
  return "Read";
}

export default function LessonTopicPanel({
  sectionId,
  sectionTitle,
  lessons,
  currentSlug,
  activeProblemId,
  preferProblemLinks = false,
  isRead,
  completedCount,
  totalCount,
  onClose,
}: {
  sectionId: string;
  sectionTitle: string;
  lessons: readonly Lesson[];
  currentSlug: string;
  activeProblemId?: number;
  /** When true, link read+problem rows to /problems/:id instead of the lesson. */
  preferProblemLinks?: boolean;
  isRead: (slug: string) => boolean;
  completedCount: number;
  totalCount: number;
  onClose: () => void;
}) {
  const percent = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-[var(--line)] px-4 py-4">
        <div className="min-w-0">
          <p className="verdict-strip text-[10px] text-[var(--text-dim)]">
            {sectionTitle}
          </p>
          <h2 className="display mt-1 text-sm font-semibold text-[var(--text)]">
            Topics
          </h2>
          <p className="mt-1 text-[11px] text-[var(--text-dim)]">
            {completedCount}/{totalCount} · {percent}%
          </p>
          <ProgressBar value={percent} className="mt-2" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--text-dim)] transition hover:border-[var(--accent)]/40 hover:text-[var(--text)]"
          aria-label="Close topic panel"
          title="Close panel"
        >
          <PanelLeftClose className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <nav
        aria-label={`${sectionTitle} lessons`}
        className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3"
      >
        {lessons.map((lesson, index) => {
          const ids = lessonProblemIds(lesson);
          const active =
            lesson.slug === currentSlug ||
            (activeProblemId != null && ids.includes(activeProblemId));
          const done = isRead(lesson.slug);
          const showMixedDivider =
            sectionId === "operators" &&
            lesson.kind === "solve" &&
            (index === 0 || lessons[index - 1]?.kind !== "solve");

          let href: string;
          if (lesson.kind === "solve") {
            // Practice sets always open the lesson page (problem list), not a single problem.
            href = `/dsa-sheet/${sectionId}/${lesson.slug}`;
          } else if (preferProblemLinks && ids.length === 1) {
            href = `/problems/${ids[0]}`;
          } else {
            href = `/dsa-sheet/${sectionId}/${lesson.slug}`;
          }

          return (
            <Fragment key={lesson.slug}>
              {showMixedDivider && (
                <div className="px-3 pb-1 pt-3">
                  <p className="verdict-strip text-[10px] text-[var(--text-dim)]">
                    Mixed Operator Practice
                  </p>
                </div>
              )}
              <Link
                to={href}
                className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border border-transparent text-[var(--text-dim)] hover:bg-[var(--bg-inset)]/60 hover:text-[var(--text)]"
                }`}
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                  {done ? (
                    <Check
                      className="h-3.5 w-3.5 text-[var(--ok)]"
                      aria-hidden
                    />
                  ) : (
                    <span className="verdict-strip text-[10px] text-[var(--text-dim)]">
                      {lesson.order}
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block leading-snug font-medium">
                    {lesson.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[var(--text-dim)]">
                    {kindLabel(lesson.kind)} · {lesson.estMinutes} min
                    {ids.length > 0 ? ` · ${ids.length} problems` : ""}
                  </span>
                </span>
              </Link>
            </Fragment>
          );
        })}
      </nav>
    </div>
  );
}
