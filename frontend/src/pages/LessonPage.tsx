import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, LayoutList, Play } from "lucide-react";
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
import { lessonProblemIds } from "../features/learn/types";
import type { Lesson, PracticeListItem } from "../features/learn/types";

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

function isPracticeSetLesson(lesson: Lesson): boolean {
  if (lesson.kind !== "solve") return false;
  const ids = lessonProblemIds(lesson);
  if (ids.length > 1) return true;
  if (lesson.blocks.some((b) => b.type === "practiceList")) return true;
  // Empty solve lesson waiting for Phase 2 IDs — still show the set UI.
  if (lesson.blocks.length === 0 && ids.length === 0) return true;
  return false;
}

function PracticeSetPanel({
  lesson,
  solvedProblemIds,
}: {
  lesson: Lesson;
  solvedProblemIds: Set<number>;
}) {
  const practiceBlock = lesson.blocks.find((b) => b.type === "practiceList");
  const items: PracticeListItem[] =
    practiceBlock?.type === "practiceList"
      ? practiceBlock.items
      : lessonProblemIds(lesson).map((id, i) => ({
          title: `Problem ${i + 1}`,
          problemId: id,
        }));

  // Merge wired IDs onto practice list when present.
  const ids = lessonProblemIds(lesson);
  const merged = items.map((item, i) => ({
    ...item,
    problemId: item.problemId ?? ids[i],
  }));

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-[var(--text-dim)]">
        {lesson.teaser}
      </p>
      <p className="text-sm text-[var(--text)]">
        No theory here — only mixed operator problems. Work Easy → Easy-Medium →
        Medium.
      </p>
      <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)]">
        {merged.map((item) => {
          const done =
            item.problemId != null && solvedProblemIds.has(item.problemId);
          return (
            <li
              key={item.title}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text)]">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-dim)]">
                  {item.difficulty ?? "Practice"}
                  {done ? " · Solved" : ""}
                </p>
              </div>
              {item.problemId != null ? (
                <Link
                  to={`/problems/${item.problemId}`}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2.5 text-xs font-semibold text-[var(--accent)]"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden />
                  Solve
                </Link>
              ) : (
                <span className="text-[11px] text-[var(--text-dim)]">
                  Coming soon
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
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
  kind: "read" | "read+problem" | "solve";
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
            Solve a problem
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
        {(kind === "read+problem" || kind === "solve") && (
          <button
            type="button"
            onClick={onMarkAndContinue}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] transition hover:text-[var(--text)]"
          >
            Mark done &amp; continue
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

  const ids = lessonProblemIds(lesson);
  const practiceSet = isPracticeSetLesson(lesson);

  // Legacy single-problem solve with no practice-set UI → redirect.
  if (lesson.kind === "solve" && !practiceSet) {
    return (
      <Navigate
        to={ids.length === 1 ? `/problems/${ids[0]}` : "/dsa-sheet"}
        replace
      />
    );
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
    lesson.kind === "read+problem" && ids.length > 0;

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
      linkedProblemId={ids[0]}
      onMarkAndContinue={handleMarkAndContinue}
    />
  );

  return (
    <div className="practice-shell flex min-h-[calc(100vh-3.5rem)] flex-col">
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
            {(lesson.kind === "read" ||
              lesson.kind === "read+problem" ||
              practiceSet) && (
              <button
                type="button"
                onClick={handleMarkAndContinue}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/25"
              >
                Mark done &amp; continue
                <ArrowRight className="h-4 w-4" aria-hidden />
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
              {!practiceSet && (
                <LearnLanguagePicker
                  language={language}
                  onChange={setLanguage}
                />
              )}
            </div>

            <main className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/70 p-5 practice-glass sm:p-6">
              {practiceSet ? (
                <PracticeSetPanel
                  lesson={lesson}
                  solvedProblemIds={solvedProblemIds}
                />
              ) : (
                <LessonBlocks blocks={lesson.blocks} language={language} />
              )}

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
