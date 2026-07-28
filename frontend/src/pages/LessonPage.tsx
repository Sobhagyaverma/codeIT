import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, LayoutList } from "lucide-react";
import {
  getFirstLesson,
  getLearnSection,
  getLesson,
  getLessonByOrder,
  getNextLearnSection,
} from "../features/learn/content/sections";
import LessonBlocks from "../features/learn/components/LessonBlocks";
import LessonSideRail from "../features/learn/components/LessonSideRail";
import LearnLanguagePicker from "../features/learn/components/LearnLanguagePicker";
import { useLearnLanguage } from "../features/learn/hooks/useLearnLanguage";
import { useLessonProgress } from "../features/learn/hooks/useLessonProgress";
import { usePracticeCatalog } from "../features/practice/hooks/usePracticeCatalog";

function NextSectionLink({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
    >
      Next · {title}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}

function LessonActions({
  sectionId,
  prevSlug,
  nextSlug,
  nextSectionHref,
  nextSectionTitle,
  kind,
  canSolve,
  linkedProblemId,
  onMarkAndContinue,
}: {
  sectionId: string;
  prevSlug?: string;
  nextSlug?: string;
  nextSectionHref?: string;
  nextSectionTitle?: string;
  kind: "read" | "read+problem";
  canSolve: boolean;
  linkedProblemId?: number;
  onMarkAndContinue: () => void;
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/dsa-sheet"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
        >
          <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
          DSA Sheet
        </Link>
        {prevSlug ? (
          <Link
            to={`/dsa-sheet/${sectionId}/${prevSlug}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] transition hover:text-[var(--text)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Previous
          </Link>
        ) : null}
        {nextSlug ? (
          <Link
            to={`/dsa-sheet/${sectionId}/${nextSlug}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] transition hover:text-[var(--text)]"
          >
            Next
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : nextSectionHref && nextSectionTitle ? (
          <NextSectionLink href={nextSectionHref} title={nextSectionTitle} />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {kind === "read" && (
          <button
            type="button"
            onClick={onMarkAndContinue}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/25"
          >
            Mark as read &amp; continue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
        {kind === "read+problem" && canSolve && (
          <Link
            to={`/problems/${linkedProblemId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/25"
          >
            Solve the problem
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
        {kind === "read+problem" && (
          <button
            type="button"
            onClick={onMarkAndContinue}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] transition hover:text-[var(--text)]"
          >
            Mark read &amp; continue
          </button>
        )}
      </div>
    </div>
  );
}

export default function LessonPage() {
  const { sectionId = "", slug = "" } = useParams<{
    sectionId: string;
    slug: string;
  }>();
  const navigate = useNavigate();
  const section = getLearnSection(sectionId);
  const lesson = getLesson(sectionId, slug);
  const lessons = section?.lessons ?? [];
  const { language, setLanguage } = useLearnLanguage();
  const { data } = usePracticeCatalog();

  const solvedProblemIds = useMemo(() => {
    const set = new Set<number>();
    data?.problems.forEach((p) => {
      if (p.status === "SOLVED") set.add(p.id);
    });
    return set;
  }, [data]);

  const { markRead, completedCount, totalCount } = useLessonProgress(
    sectionId,
    lessons,
    solvedProblemIds
  );

  if (!section || !lesson) {
    return <Navigate to="/dsa-sheet" replace />;
  }

  const prev = getLessonByOrder(sectionId, lesson.order - 1);
  const next = getLessonByOrder(sectionId, lesson.order + 1);
  const nextSection = !next ? getNextLearnSection(sectionId) : undefined;
  const nextSectionFirst = nextSection
    ? getFirstLesson(nextSection.id)
    : undefined;
  const nextSectionHref =
    nextSection && nextSectionFirst
      ? `/dsa-sheet/${nextSection.id}/${nextSectionFirst.slug}`
      : undefined;
  const canSolve =
    lesson.kind === "read+problem" && lesson.linkedProblemId != null;

  const handleMarkAndContinue = () => {
    markRead(lesson.slug);
    if (next) {
      navigate(`/dsa-sheet/${sectionId}/${next.slug}`);
    } else if (nextSectionHref) {
      navigate(nextSectionHref);
    } else {
      navigate("/dsa-sheet");
    }
  };

  const actions = (
    <LessonActions
      sectionId={sectionId}
      prevSlug={prev?.slug}
      nextSlug={next?.slug}
      nextSectionHref={nextSectionHref}
      nextSectionTitle={nextSection?.title}
      kind={lesson.kind}
      canSolve={canSolve}
      linkedProblemId={lesson.linkedProblemId}
      onMarkAndContinue={handleMarkAndContinue}
    />
  );

  return (
    <div className="practice-shell flex min-h-[calc(100vh-3.5rem)] flex-col">
      {/* Full-bleed top bar — above left panel, buttons at screen edges */}
      <div className="sticky top-14 z-40 w-full border-b border-[var(--line)] bg-[var(--bg)]/95 py-2.5 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-3 px-3 sm:px-4">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              to="/dsa-sheet"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">DSA Sheet</span>
              <span className="sm:hidden">Sheet</span>
            </Link>
            <span
              className="hidden h-5 w-px bg-[var(--line)] sm:block"
              aria-hidden
            />
            {prev ? (
              <Link
                to={`/dsa-sheet/${sectionId}/${prev.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] transition hover:text-[var(--text)]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Previous
              </Link>
            ) : null}
            {next ? (
              <Link
                to={`/dsa-sheet/${sectionId}/${next.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] transition hover:text-[var(--text)]"
              >
                Next
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : nextSectionHref && nextSection ? (
              <NextSectionLink
                href={nextSectionHref}
                title={nextSection.title}
              />
            ) : null}
          </div>

          <p className="verdict-strip hidden text-[11px] text-[var(--text-dim)] md:block">
            Lesson {lesson.order} of {lessons.length} · {completedCount}/
            {totalCount} done
          </p>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {lesson.kind === "read" && (
              <button
                type="button"
                onClick={handleMarkAndContinue}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/25"
              >
                Mark as read &amp; continue
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
            {lesson.kind === "read+problem" && canSolve && (
              <Link
                to={`/problems/${lesson.linkedProblemId}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/25"
              >
                Solve the problem
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
            {lesson.kind === "read+problem" && (
              <button
                type="button"
                onClick={handleMarkAndContinue}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] transition hover:text-[var(--text)]"
              >
                Mark read &amp; continue
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <LessonSideRail
          sectionId={sectionId}
          currentSlug={lesson.slug}
          stickyClassName="top-[6.75rem] h-[calc(100vh-6.75rem)]"
        />

        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="verdict-strip text-[10px] text-[var(--text-dim)]">
                  {section.title}
                </p>
                <h1 className="display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {lesson.title}
                </h1>
              </div>
              <LearnLanguagePicker language={language} onChange={setLanguage} />
            </div>

            <main className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/70 p-5 practice-glass sm:p-6">
              <LessonBlocks blocks={lesson.blocks} language={language} />

              <div className="mt-8 border-t border-[var(--line)] pt-6">
                {actions}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
