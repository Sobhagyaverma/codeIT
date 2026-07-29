import { BookOpen, Check, Play } from "lucide-react";
import { Link } from "react-router-dom";
import type { Lesson } from "../types";
import { lessonProblemIds } from "../types";

export default function LessonCard({
  sectionId,
  lesson,
  complete,
}: {
  sectionId: string;
  lesson: Lesson;
  complete: boolean;
}) {
  const lessonHref = `/dsa-sheet/${sectionId}/${lesson.slug}`;
  const ids = lessonProblemIds(lesson);
  const practiceCount = ids.length;
  const firstProblemHref = ids.length === 1 ? `/problems/${ids[0]}` : null;
  const isPracticeSet =
    lesson.kind === "solve" && (lesson.blocks.length === 0 || ids.length > 1);
  const titleHref = isPracticeSet ? lessonHref : lesson.kind === "solve" && firstProblemHref
    ? firstProblemHref
    : lessonHref;

  const title = (
    <>
      {lesson.order}. {lesson.title}
    </>
  );

  return (
    <div className="grid gap-3 border-t border-[var(--line)] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={titleHref}
            className="truncate text-sm font-medium text-[var(--text)] hover:text-[var(--info)]"
          >
            {title}
          </Link>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
              complete
                ? "border-[var(--ok)]/30 bg-[var(--ok)]/10 text-[var(--ok)]"
                : "border-[var(--line)] bg-[var(--bg-inset)] text-[var(--text-dim)]"
            }`}
          >
            {complete ? (
              <>
                <Check className="h-3 w-3" aria-hidden />
                Done
              </>
            ) : (
              "Not started"
            )}
          </span>
          {practiceCount > 0 && (
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--text-dim)]">
              {practiceCount} problem{practiceCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--text-dim)]">
          <span>{lesson.teaser}</span>
          <span>{lesson.estMinutes} min</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {lesson.kind === "read" ? (
          <Link
            to={lessonHref}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 text-xs font-semibold text-[#0a0d12] transition hover:brightness-110"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Read
          </Link>
        ) : lesson.kind === "solve" ? (
          <Link
            to={lessonHref}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            {isPracticeSet ? "Practice" : "Solve"}
          </Link>
        ) : (
          <>
            <Link
              to={lessonHref}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 text-xs font-semibold text-[#0a0d12] transition hover:brightness-110"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              Learn
            </Link>
            {firstProblemHref ? (
              <Link
                to={firstProblemHref}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
              >
                <Play className="h-3.5 w-3.5" aria-hidden />
                Solve
              </Link>
            ) : practiceCount > 1 ? (
              <Link
                to={lessonHref}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
              >
                <Play className="h-3.5 w-3.5" aria-hidden />
                Practice
              </Link>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
