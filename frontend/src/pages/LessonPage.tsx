import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import BrandMark from "../components/BrandMark";
import {
  LessonBlocksView,
  useLessonNav,
} from "../components/LessonBlocksView";
import { useAuth } from "../context/AuthContext";
import {
  getFirstLesson,
  getLearnSection,
  getLesson,
  getNextLearnSection,
} from "../features/learn/content/sections";
import { useLearnLanguage } from "../features/learn/hooks/useLearnLanguage";
import { useLessonProgress } from "../features/learn/hooks/useLessonProgress";
import {
  lessonProblemIds,
  type LearnLanguage,
} from "../features/learn/types";
import { ApiError, getUserSubmissions } from "../lib/api";

const LANGS: { id: LearnLanguage; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
];

function kindLabel(kind: string) {
  if (kind === "read+problem") return "READ+PROBLEM";
  if (kind === "solve") return "SOLVE";
  return "READ";
}

export default function LessonPage() {
  const { sectionId = "", slug = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage } = useLearnLanguage();
  const [mobileContents, setMobileContents] = useState(false);

  const section = getLearnSection(sectionId);
  const lesson = getLesson(sectionId, slug);
  const lessons = section?.lessons ?? [];

  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        setSolvedIds(new Set());
        return;
      }
      try {
        const submissions = await getUserSubmissions(user.id);
        const set = new Set<number>();
        for (const s of submissions) {
          const v = (s.verdict || "").toUpperCase();
          if (v === "ACCEPTED" || v.startsWith("ACCEPTED")) {
            set.add(s.problemId);
          }
        }
        if (!cancelled) setSolvedIds(set);
      } catch (err) {
        if (!(err instanceof ApiError)) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const { isRead, markRead, completedCount, totalCount, percent } =
    useLessonProgress(sectionId, lessons, solvedIds);

  const problemIds = useMemo(
    () => (lesson ? lessonProblemIds(lesson) : []),
    [lesson]
  );

  const nav = useLessonNav(lessons, slug);

  // Pure solve with single problem and no rich blocks → workspace
  useEffect(() => {
    if (!lesson) return;
    if (
      lesson.kind === "solve" &&
      problemIds.length === 1 &&
      !lesson.blocks.some((b) => b.type === "practiceList")
    ) {
      navigate(`/problems/${problemIds[0]}`, { replace: true });
    }
  }, [lesson, problemIds, navigate]);

  if (!section || !lesson) {
    return <Navigate to="/dsa-sheet" replace />;
  }

  const nextSection = !nav.next ? getNextLearnSection(sectionId) : undefined;
  const nextHref = nav.next
    ? `/dsa-sheet/${sectionId}/${nav.next.slug}`
    : nextSection
      ? `/dsa-sheet/${nextSection.id}/${getFirstLesson(nextSection.id)?.slug}`
      : "/dsa-sheet";
  const prevHref = nav.prev
    ? `/dsa-sheet/${sectionId}/${nav.prev.slug}`
    : "/dsa-sheet";

  const done = isRead(lesson.slug);
  const practiceId = problemIds[0];

  const onMarkComplete = () => {
    markRead(lesson.slug);
  };

  const onMarkAndContinue = () => {
    markRead(lesson.slug);
    navigate(nextHref);
  };

  const sideRail = (
    <>
      <div className="sticky top-0 z-10 border-b border-outline-variant/10 bg-surface-container-low/95 p-6 backdrop-blur-sm">
        <Link
          to="/dsa-sheet"
          className="mb-4 flex items-center gap-2 text-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          DSA Sheet
        </Link>
        <h3 className="display mb-2 text-xl text-on-surface">{section.title}</h3>
        <div className="mb-2 flex items-center justify-between text-sm text-on-surface-variant">
          <span>Progress</span>
          <span className="mono">
            {completedCount}/{totalCount} lessons
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div
            className="h-full rounded-full bg-primary shadow-[0_0_8px_rgba(221,183,255,0.6)] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="border-b border-outline-variant/10 p-4">
        <div className="flex rounded-lg bg-surface-container-highest p-1">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLanguage(l.id)}
              className={`flex-1 rounded-md py-1 text-center text-sm font-medium transition-colors ${
                language === l.id
                  ? "border border-outline-variant/20 bg-surface-bright text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {[...lessons]
          .sort((a, b) => a.order - b.order)
          .map((l) => {
            const active = l.slug === slug;
            const completed = isRead(l.slug);
            return (
              <Link
                key={l.slug}
                to={`/dsa-sheet/${sectionId}/${l.slug}`}
                onClick={() => setMobileContents(false)}
                className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
                  active
                    ? "border-l-4 border-primary bg-secondary-container/30 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high/50"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${
                    completed
                      ? "text-primary"
                      : active
                        ? "text-primary"
                        : "text-on-surface-variant"
                  }`}
                  style={
                    completed
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  {completed ? "check_circle" : "radio_button_unchecked"}
                </span>
                <span className="truncate text-sm">
                  {l.order}. {l.title}
                </span>
              </Link>
            );
          })}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <AppNav activeHint="/dsa-sheet" />

      <div className="flex h-[calc(100vh-4rem)] flex-1 overflow-hidden pt-16">
        {/* Desktop side rail */}
        <aside className="z-40 hidden h-full w-72 shrink-0 flex-col overflow-y-auto border-r border-outline-variant/10 bg-surface-container-low lg:flex">
          {sideRail}
        </aside>

        {/* Mobile contents drawer */}
        {mobileContents && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              aria-label="Close contents"
              onClick={() => setMobileContents(false)}
            />
            <aside className="absolute bottom-0 left-0 top-16 flex w-[min(20rem,90vw)] flex-col overflow-y-auto border-r border-outline-variant/20 bg-surface-container-low shadow-xl">
              {sideRail}
            </aside>
          </div>
        )}

        <main className="relative flex-1 overflow-y-auto pb-28 md:pb-24">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[800px] -translate-x-1/2 rounded-[100%] bg-primary/5 blur-[120px]" />

          <div className="mx-auto max-w-4xl px-margin-mobile py-8 md:px-margin-desktop md:py-12">
            <div className="verdict-strip mb-6 flex items-center gap-2 text-on-surface-variant">
              <Link to="/dsa-sheet" className="transition-colors hover:text-primary">
                DSA Sheet
              </Link>
              <span className="material-symbols-outlined text-xs">
                chevron_right
              </span>
              <span className="text-on-surface">{section.title}</span>
            </div>

            <div className="mb-10">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded border border-primary/20 bg-surface-container-highest px-2 py-0.5 text-xs uppercase tracking-widest text-primary">
                  <span className="material-symbols-outlined text-[14px]">
                    menu_book
                  </span>
                  {kindLabel(lesson.kind)} · {lesson.estMinutes} min
                </span>
                {done && (
                  <span className="inline-flex items-center gap-1 rounded border border-easy/30 bg-easy/10 px-2 py-0.5 text-xs text-easy">
                    <span className="material-symbols-outlined text-[14px]">
                      check_circle
                    </span>
                    Completed
                  </span>
                )}
              </div>
              <h1 className="display mb-4 text-3xl tracking-tight text-on-surface sm:text-4xl md:text-5xl">
                {lesson.title}
              </h1>
              <p className="max-w-2xl text-base text-on-surface-variant sm:text-lg">
                {lesson.teaser}
              </p>
            </div>

            <LessonBlocksView blocks={lesson.blocks} language={language} />

            {problemIds.length > 0 && (
              <div className="mt-12 rounded-xl border border-outline-variant/30 bg-surface-container-low p-6">
                <p className="mb-3 flex items-center gap-2 font-medium text-on-surface">
                  <span className="material-symbols-outlined text-primary">
                    code
                  </span>
                  Practice problems
                </p>
                <div className="flex flex-col gap-2">
                  {problemIds.map((id) => (
                    <Link
                      key={id}
                      to={`/problems/${id}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        play_arrow
                      </span>
                      Open problem #{id}
                      {solvedIds.has(id) && (
                        <span className="text-xs text-easy">Solved</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-10 mt-16 flex items-center justify-between border-t border-outline-variant/10 pt-8">
              {nav.prev ? (
                <Link
                  to={prevHref}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-on-surface-variant transition-colors hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm">
                    arrow_back
                  </span>
                  Previous Lesson
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex cursor-not-allowed items-center gap-2 rounded-lg px-4 py-2 text-sm text-on-surface-variant opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    arrow_back
                  </span>
                  Previous Lesson
                </button>
              )}
              <Link
                to={nextHref}
                className="group flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-bright px-6 py-2.5 text-sm text-on-surface transition-all hover:border-primary/50 hover:bg-primary/20 hover:text-primary"
              >
                {nav.next
                  ? `Next: ${nav.next.title}`
                  : nextSection
                    ? `Next: ${nextSection.title}`
                    : "Back to DSA Sheet"}
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </Link>
            </div>

            <footer className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 py-8 text-xs text-on-surface-variant md:flex-row">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">terminal</span>
                <span>
                  <BrandMark />
                </span>
              </div>
              <div className="flex items-center gap-6">
                <Link to="/privacy" className="transition-colors hover:text-primary">
                  Privacy
                </Link>
                <Link to="/terms" className="transition-colors hover:text-primary">
                  Terms
                </Link>
                <Link to="/help" className="transition-colors hover:text-primary">
                  Help
                </Link>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Desktop sticky action bar */}
      <div className="fixed bottom-0 left-0 z-50 hidden w-full items-center justify-center gap-4 border-t border-outline-variant/20 bg-surface/80 px-gutter py-4 shadow-lg backdrop-blur-xl md:flex">
        <div className="flex w-full max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary">info</span>
            <span>
              Lesson {nav.position} of {nav.total}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onMarkComplete}
              className="flex items-center gap-2 rounded-lg border border-outline-variant px-6 py-2 text-sm text-on-surface transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-95"
            >
              <span className="material-symbols-outlined">
                {done ? "check_circle" : "done"}
              </span>
              {done ? "Completed" : "Mark complete"}
            </button>
            {practiceId ? (
              <Link
                to={`/problems/${practiceId}`}
                onClick={() => markRead(lesson.slug)}
                className="glow-hover flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm text-on-primary transition-all hover:brightness-110 active:scale-95"
              >
                Solve practice problem
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={onMarkAndContinue}
                className="glow-hover flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm text-on-primary transition-all hover:brightness-110 active:scale-95"
              >
                Continue
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-primary/20 bg-surface-container-highest/90 px-4 shadow-lg backdrop-blur-md md:hidden">
        <Link
          to={prevHref}
          className="flex flex-col items-center justify-center text-on-surface-variant transition-transform active:scale-90"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="mt-1 text-[10px]">Back</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            const order: LearnLanguage[] = ["python", "java", "cpp"];
            const i = order.indexOf(language);
            setLanguage(order[(i + 1) % order.length]);
          }}
          className="flex flex-col items-center justify-center text-on-surface-variant transition-transform active:scale-90"
        >
          <span className="material-symbols-outlined">code</span>
          <span className="mt-1 text-[10px]">
            {LANGS.find((l) => l.id === language)?.label}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileContents(true)}
          className="flex flex-col items-center justify-center rounded-xl bg-primary px-4 py-1 text-on-primary shadow-md transition-transform active:scale-90"
        >
          <span className="material-symbols-outlined">format_list_bulleted</span>
          <span className="mt-1 text-[10px]">Contents</span>
        </button>
        <Link
          to={nextHref}
          onClick={() => markRead(lesson.slug)}
          className="flex flex-col items-center justify-center text-on-surface-variant transition-transform active:scale-90"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
          <span className="mt-1 text-[10px]">Next</span>
        </Link>
      </nav>
    </div>
  );
}
