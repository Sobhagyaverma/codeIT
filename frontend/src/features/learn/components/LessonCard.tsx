import { BookOpen, Check, Play } from "lucide-react";
import { Link } from "react-router-dom";
import type { Lesson } from "../types";

export default function LessonCard({
  sectionId,
  lesson,
  complete,
}: {
  sectionId: string;
  lesson: Lesson;
  complete: boolean;
}) {
  const href = `/dsa-sheet/${sectionId}/${lesson.slug}`;
  const canSolve =
    lesson.kind === "read+problem" && lesson.linkedProblemId != null;

  return (
    <div className="grid gap-3 border-t border-[var(--line)] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={href}
            className="truncate text-sm font-medium text-[var(--text)] hover:text-[var(--info)]"
          >
            {lesson.order}. {lesson.title}
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
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--text-dim)]">
          <span>{lesson.teaser}</span>
          <span>{lesson.estMinutes} min</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {lesson.kind === "read" ? (
          <Link
            to={href}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 text-xs font-semibold text-[#0a0d12] transition hover:brightness-110"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Read
          </Link>
        ) : (
          <>
            <Link
              to={href}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 text-xs font-semibold text-[#0a0d12] transition hover:brightness-110"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              Learn
            </Link>
            {canSolve ? (
              <Link
                to={`/problems/${lesson.linkedProblemId}`}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
              >
                <Play className="h-3.5 w-3.5" aria-hidden />
                Solve
              </Link>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
