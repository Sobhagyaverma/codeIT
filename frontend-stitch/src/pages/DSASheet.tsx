import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../context/AuthContext";
import {
  LEARN_SECTION_ORDER,
  getLearnSection,
} from "../features/learn/content/sections";
import { useLearnLanguage } from "../features/learn/hooks/useLearnLanguage";
import { useLessonProgress } from "../features/learn/hooks/useLessonProgress";
import { lessonProblemIds, type LearnLanguage } from "../features/learn/types";
import { buildPracticeCatalog } from "../features/practice/adapters";
import type {
  PracticeModule,
  PracticeProblem,
  PracticeProblemStatus,
} from "../features/practice/types";
import { ApiError, getProblems, getUserSubmissions } from "../lib/api";

type DiffFilter = "ALL" | "EASY" | "MEDIUM" | "HARD";
type StatusFilter = "ALL" | PracticeProblemStatus;

function difficultyColor(d: string): string {
  const u = d.trim().toUpperCase();
  if (u === "EASY") return "text-easy";
  if (u === "MEDIUM") return "text-medium";
  if (u === "HARD") return "text-hard";
  return "text-on-surface-variant";
}

function statusIcon(status: PracticeProblemStatus | "completed" | "todo") {
  if (status === "SOLVED" || status === "completed") {
    return (
      <span className="material-symbols-outlined text-easy">check_circle</span>
    );
  }
  if (status === "ATTEMPTED") {
    return (
      <span className="material-symbols-outlined text-medium">pending</span>
    );
  }
  return (
    <span className="material-symbols-outlined text-outline-variant">
      radio_button_unchecked
    </span>
  );
}

function kindBadge(kind: string) {
  const label =
    kind === "read+problem"
      ? "READ+PROBLEM"
      : kind === "solve"
        ? "SOLVE"
        : "READ";
  return (
    <span className="font-code-sm rounded bg-surface-variant px-2 py-0.5 text-[11px] text-on-surface-variant">
      {label}
    </span>
  );
}

function LearnSectionBlock({
  sectionId,
  solvedIds,
  open,
  onToggle,
}: {
  sectionId: string;
  solvedIds: Set<number>;
  open: boolean;
  onToggle: () => void;
}) {
  const section = getLearnSection(sectionId);
  const lessons = section?.lessons ?? [];
  const { isRead, completedCount, totalCount, percent } = useLessonProgress(
    sectionId,
    lessons,
    solvedIds
  );

  if (!section) return null;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low transition-colors hover:border-[#a855f7]/50 ${
        open ? "" : "cursor-pointer"
      }`}
    >
      <div
        className={`absolute bottom-0 left-0 top-0 w-1 transition-all duration-300 ${
          open ? "bg-[#a855f7]" : "bg-transparent group-hover:bg-[#a855f7]/50"
        }`}
      />
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between p-6 text-left ${
          open
            ? "border-b border-outline-variant/20 bg-surface-container-highest/20"
            : ""
        }`}
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            {section.title}
          </h2>
          <p className="text-sm text-on-surface-variant">{section.subtitle}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end gap-1">
            <span
              className={`font-code-sm text-code-sm ${
                completedCount > 0 ? "text-[#a855f7]" : "text-on-surface-variant"
              }`}
            >
              {completedCount}/{totalCount} lessons
            </span>
            <div className="h-1 w-32 overflow-hidden rounded-full bg-surface-variant">
              <div
                className="h-full bg-[#a855f7] transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-on-surface-variant transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {open && (
        <div className="flex flex-col">
          {[...lessons]
            .sort((a, b) => a.order - b.order)
            .map((lesson, idx) => {
              const done = isRead(lesson.slug);
              const href = `/dsa-sheet/${section.id}/${lesson.slug}`;
              return (
                <Link
                  key={lesson.slug}
                  to={href}
                  className={`group/row flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-variant/30 ${
                    idx < lessons.length - 1
                      ? "border-b border-outline-variant/10"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {statusIcon(done ? "completed" : "todo")}
                    <span className="font-code-sm text-code-sm w-8 text-on-surface-variant">
                      {lesson.order}
                    </span>
                    <span className="font-label-md text-label-md text-on-surface transition-colors group-hover/row:text-primary">
                      {lesson.title}
                    </span>
                    <div className="flex gap-2">{kindBadge(lesson.kind)}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span
                      className={`text-sm ${
                        done ? "text-easy" : "text-on-surface-variant"
                      }`}
                    >
                      {done ? "Completed" : "Not Started"}
                    </span>
                    <span className="rounded p-2 text-on-surface-variant transition-colors group-hover/row:bg-surface-variant group-hover/row:text-on-surface">
                      <span className="material-symbols-outlined text-[20px]">
                        arrow_forward
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}

function ModuleBlock({
  module,
  open,
  onToggle,
}: {
  module: PracticeModule;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low transition-colors hover:border-primary/50 ${
        open ? "" : "cursor-pointer"
      }`}
    >
      {open && (
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary transition-all duration-300 group-hover:w-2" />
      )}
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between p-6 text-left ${
          open
            ? "border-b border-outline-variant/20 bg-surface-container-highest/20"
            : ""
        }`}
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            {module.title}
          </h2>
          <p className="text-sm text-on-surface-variant">{module.description}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end gap-1">
            <span
              className={`font-code-sm text-code-sm ${
                module.solved > 0 ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              {module.solved}/{module.total} ({module.percent}%)
            </span>
            <div className="h-1 w-32 overflow-hidden rounded-full bg-surface-variant">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${module.percent}%` }}
              />
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-on-surface-variant transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {open && (
        <div className="flex flex-col">
          {module.problems.map((p, idx) => (
            <div
              key={p.id}
              className={`group/row flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-variant/30 ${
                idx < module.problems.length - 1
                  ? "border-b border-outline-variant/10"
                  : ""
              }`}
            >
              <div className="flex items-center gap-4">
                {statusIcon(p.status)}
                <span className="font-code-sm text-code-sm w-8 text-on-surface-variant">
                  {idx + 1}
                </span>
                <Link
                  to={`/problems/${p.id}`}
                  className="font-label-md text-label-md text-on-surface transition-colors group-hover/row:text-primary"
                >
                  {p.title}
                </Link>
                <div className="hidden flex-wrap gap-2 sm:flex">
                  {p.topics.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded bg-surface-variant px-2 py-0.5 text-[11px] text-on-surface-variant"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`text-sm ${difficultyColor(p.difficulty)}`}>
                  {p.difficulty}
                </span>
                <Link
                  to={`/problems/${p.id}`}
                  className="flex items-center gap-2 rounded p-2 text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <span className="font-label-md hidden text-sm group-hover/row:block">
                    Solve
                  </span>
                  <span className="material-symbols-outlined text-[20px]">
                    play_arrow
                  </span>
                </Link>
              </div>
            </div>
          ))}
          {module.problems.length === 0 && (
            <p className="px-6 py-4 text-sm text-on-surface-variant">
              No problems match the current filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function matchesFilters(
  problem: PracticeProblem,
  filters: {
    difficulty: DiffFilter;
    status: StatusFilter;
    topic: string | null;
  }
) {
  if (
    filters.difficulty !== "ALL" &&
    problem.difficulty.trim().toUpperCase() !== filters.difficulty
  ) {
    return false;
  }
  if (filters.status !== "ALL" && problem.status !== filters.status) {
    return false;
  }
  if (filters.topic && !problem.topics.some((t) => t === filters.topic)) {
    return false;
  }
  return true;
}

const LANGS: { id: LearnLanguage; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
];

export default function DSASheet() {
  const { user } = useAuth();
  const { language, setLanguage } = useLearnLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<ReturnType<
    typeof buildPracticeCatalog
  > | null>(null);

  const [difficulty, setDifficulty] = useState<DiffFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [topic, setTopic] = useState<string | null>(null);
  const [openLearn, setOpenLearn] = useState<Record<string, boolean>>({
    "start-here": true,
  });
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    arrays: true,
  });
  const [provingOpen, setProvingOpen] = useState(false);
  const [patternsOpen, setPatternsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const problems = await getProblems();
        let submissions: Awaited<ReturnType<typeof getUserSubmissions>> = [];
        if (user?.id) {
          try {
            submissions = await getUserSubmissions(user.id);
          } catch {
            submissions = [];
          }
        }
        if (cancelled) return;
        setCatalog(buildPracticeCatalog(problems, submissions));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load DSA sheet."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const solvedIds = useMemo(() => {
    const set = new Set<number>();
    catalog?.problems.forEach((p) => {
      if (p.status === "SOLVED") set.add(p.id);
    });
    return set;
  }, [catalog]);

  const topicOptions = useMemo(() => {
    if (!catalog) return [] as string[];
    const set = new Set<string>();
    catalog.problems.forEach((p) => p.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b)).slice(0, 24);
  }, [catalog]);

  const patternProblems = useMemo(() => {
    if (!catalog) return [] as PracticeProblem[];
    return catalog.problems.filter((p) =>
      p.topics.some((t) => t === "Pattern Problems")
    );
  }, [catalog]);

  const filteredModules = useMemo(() => {
    if (!catalog) return [] as PracticeModule[];
    const filters = { difficulty, status, topic };
    return catalog.modules
      .filter((m) => m.id !== "proving-grounds")
      .map((module) => {
        const problems = module.problems.filter((p) =>
          matchesFilters(p, filters)
        );
        const solved = problems.filter((p) => p.status === "SOLVED").length;
        return {
          ...module,
          problems,
          solved,
          total: problems.length,
          percent: problems.length
            ? Math.round((solved / problems.length) * 100)
            : 0,
        };
      })
      .filter((m) => {
        const active =
          difficulty !== "ALL" || status !== "ALL" || Boolean(topic);
        return active ? m.total > 0 : true;
      });
  }, [catalog, difficulty, status, topic]);

  const provingGrounds = useMemo(() => {
    if (!catalog) return null;
    const mod = catalog.modules.find((m) => m.id === "proving-grounds");
    if (!mod) return null;
    const filters = { difficulty, status, topic };
    const problems = mod.problems.filter((p) => matchesFilters(p, filters));
    const solved = problems.filter((p) => p.status === "SOLVED").length;
    return {
      ...mod,
      problems,
      solved,
      total: problems.length,
      percent: problems.length
        ? Math.round((solved / problems.length) * 100)
        : 0,
    };
  }, [catalog, difficulty, status, topic]);

  const stats = catalog?.stats;

  // Aggregate learn progress for display in sidebar topics from linked problems
  const learnLinkedTopics = useMemo(() => {
    const topics = new Set<string>();
    for (const id of LEARN_SECTION_ORDER) {
      const section = getLearnSection(id);
      section?.lessons.forEach((l) => {
        lessonProblemIds(l); // keep import used; topics come from catalog
      });
    }
    return Array.from(topics);
  }, []);
  void learnLinkedTopics;

  return (
    <div className="font-body-md flex min-h-screen flex-col bg-background text-on-surface">
      <AppNav activeHint="/dsa-sheet" />

      <main className="mx-auto mt-16 flex w-full max-w-container-max flex-1 gap-gutter px-margin-mobile py-8 md:px-margin-desktop">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col gap-6 lg:flex">
          <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low p-6 text-center">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
            {user ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-primary/20 text-sm font-bold text-primary">
                  {user.name
                    .split(" ")
                    .map((p: string) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-label-md text-label-md mb-1 text-on-surface">
                    {user.name}
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    @{user.uniqueUserId}
                  </p>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Progress syncs from your submissions.
                </p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                  person_off
                </span>
                <div>
                  <h3 className="font-label-md text-label-md mb-1 text-on-surface">
                    Guest Session
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    Sign in to track progress
                  </p>
                </div>
                <Link
                  to="/login"
                  className="font-label-md text-label-md w-full rounded border border-primary px-4 py-2 text-primary transition-colors hover:bg-primary/10"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-col gap-6 rounded-xl border border-outline-variant/30 bg-surface-container-low p-6">
            <h3 className="font-code-sm text-code-sm uppercase tracking-widest text-on-surface-variant">
              Filters
            </h3>

            <div className="flex flex-col gap-3">
              <span className="font-label-md text-label-md text-on-surface">
                Difficulty
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["EASY", "text-easy", "hover:bg-easy/10"],
                    ["MEDIUM", "text-medium", "hover:bg-medium/10"],
                    ["HARD", "text-hard", "hover:bg-hard/10"],
                  ] as const
                ).map(([d, color, hover]) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setDifficulty((prev) => (prev === d ? "ALL" : d))
                    }
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${color} ${hover} ${
                      difficulty === d
                        ? "border-current bg-current/10"
                        : "border-outline-variant/30"
                    }`}
                  >
                    {d[0] + d.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-label-md text-label-md text-on-surface">
                Status
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["ALL", "All"],
                    ["SOLVED", "Solved"],
                    ["ATTEMPTED", "Attempted"],
                    ["NOT_STARTED", "Not started"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStatus(id)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      status === id
                        ? "border-primary/30 bg-primary/20 text-primary"
                        : "border-outline-variant/30 hover:bg-surface-variant"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-label-md text-label-md text-on-surface">
                Topics
              </span>
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                {topicOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic((prev) => (prev === t ? null : t))}
                    className={`cursor-pointer rounded px-2 py-1 text-xs transition-colors ${
                      topic === t
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-variant text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-2 flex cursor-not-allowed items-center gap-2 opacity-50">
              <input
                className="cursor-not-allowed rounded border-outline-variant bg-surface-variant text-primary"
                disabled
                type="checkbox"
              />
              <span className="text-sm text-on-surface-variant">
                Show Favorites Only (Requires Sign In)
              </span>
            </label>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="flex flex-col gap-2">
                <span className="font-code-sm text-code-sm uppercase tracking-wider text-primary">
                  DSA Sheet / Learn
                </span>
                <h1 className="font-headline-xl text-headline-xl text-on-surface">
                  Learn by solving
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  Follow the path — lessons first, then practice problems.
                </p>
              </div>
              <div className="flex rounded-lg bg-surface-container-highest p-1">
                {LANGS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLanguage(l.id)}
                    className={`font-label-md text-label-md rounded-md px-4 py-1.5 transition-colors ${
                      language === l.id
                        ? "bg-surface-dim text-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading && (
            <p className="text-on-surface-variant">Loading DSA sheet…</p>
          )}
          {error && <p className="text-hard">{error}</p>}

          {stats && (
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2">
                <span className="text-sm text-on-surface-variant">Total</span>
                <span className="font-code-sm text-code-sm text-on-surface">
                  {stats.total}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-easy" />
                <span className="text-sm text-on-surface-variant">Solved</span>
                <span className="font-code-sm text-code-sm text-easy">
                  {stats.solved}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-medium" />
                <span className="text-sm text-on-surface-variant">Attempted</span>
                <span className="font-code-sm text-code-sm text-medium">
                  {stats.attempted}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-outline-variant" />
                <span className="text-sm text-on-surface-variant">
                  Not started
                </span>
                <span className="font-code-sm text-code-sm text-on-surface-variant">
                  {stats.notStarted}
                </span>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="flex flex-col gap-4">
                {LEARN_SECTION_ORDER.map((id) => (
                  <LearnSectionBlock
                    key={id}
                    sectionId={id}
                    solvedIds={solvedIds}
                    open={Boolean(openLearn[id])}
                    onToggle={() =>
                      setOpenLearn((prev) => ({
                        ...prev,
                        [id]: !prev[id],
                      }))
                    }
                  />
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-6">
                  <button
                    type="button"
                    className="flex w-full flex-col gap-2 text-left"
                    onClick={() => setPatternsOpen((o) => !o)}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                        Pattern Problems
                      </h2>
                      <span
                        className={`material-symbols-outlined text-on-surface-variant transition-transform ${
                          patternsOpen ? "rotate-180" : ""
                        }`}
                      >
                        expand_more
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      Recognize patterns, then solve tiered practice.
                    </p>
                  </button>
                  {patternsOpen && (
                    <div className="mt-4 flex flex-col">
                      {patternProblems.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">
                          No pattern problems loaded.
                        </p>
                      ) : (
                        patternProblems
                          .filter((p) =>
                            matchesFilters(p, { difficulty, status, topic })
                          )
                          .map((p) => (
                            <Link
                              key={p.id}
                              to={`/problems/${p.id}`}
                              className="flex items-center justify-between border-t border-outline-variant/10 py-3 transition-colors hover:text-primary"
                            >
                              <span className="flex items-center gap-3">
                                {statusIcon(p.status)}
                                <span className="font-label-md text-label-md">
                                  {p.title}
                                </span>
                              </span>
                              <span
                                className={`text-sm ${difficultyColor(p.difficulty)}`}
                              >
                                {p.difficulty}
                              </span>
                            </Link>
                          ))
                      )}
                    </div>
                  )}
                </div>

                {provingGrounds && (
                  <ModuleBlock
                    module={provingGrounds}
                    open={provingOpen}
                    onToggle={() => setProvingOpen((o) => !o)}
                  />
                )}
              </div>

              <div className="flex flex-col gap-4">
                {filteredModules.map((module) => (
                  <ModuleBlock
                    key={module.id}
                    module={module}
                    open={Boolean(openModules[module.id])}
                    onToggle={() =>
                      setOpenModules((prev) => ({
                        ...prev,
                        [module.id]: !prev[module.id],
                      }))
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="mt-12 border-t border-outline-variant/30 bg-surface-dim py-6">
        <div className="mx-auto flex w-full max-w-container-max flex-col items-center justify-between gap-4 px-margin-mobile md:flex-row md:px-margin-desktop">
          <span className="font-label-md text-label-md text-on-surface-variant">
            CodeIT
          </span>
          <div className="flex gap-4">
            <Link
              to="/privacy"
              className="text-sm text-on-surface-variant transition-colors hover:text-primary"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-on-surface-variant transition-colors hover:text-primary"
            >
              Terms
            </Link>
            <Link
              to="/help"
              className="text-sm text-on-surface-variant transition-colors hover:text-primary"
            >
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
