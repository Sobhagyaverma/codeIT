import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ErrorState } from "../components/Loading";
import { usePracticeCatalog } from "../features/practice/hooks/usePracticeCatalog";
import { useUrlFilters } from "../features/practice/hooks/useUrlFilters";
import ModuleAccordion from "../features/practice/components/ModuleAccordion";
import OverviewStats from "../features/practice/components/OverviewStats";
import PracticeSidebar from "../features/practice/components/PracticeSidebar";
import PracticeSkeleton from "../features/practice/components/PracticeSkeleton";
import EmptyPractice from "../features/practice/components/EmptyPractice";
import SearchBar from "../features/practice/components/SearchBar";
import FilterChips from "../features/practice/components/FilterChips";
import ProgressCircle from "../features/practice/components/ProgressCircle";
import ProgressBar from "../features/practice/components/ProgressBar";
import type { PracticeModule, PracticeProblem } from "../features/practice/types";

function matchesFilters(
  problem: PracticeProblem,
  filters: {
    q: string;
    difficulty: string;
    status: string;
    topic: string;
    favorites: boolean;
    revision: boolean;
  }
) {
  if (filters.favorites && !problem.bookmarked) return false;
  if (filters.revision && !problem.markedForRevision) return false;
  if (filters.difficulty !== "ALL" && problem.difficulty.toUpperCase() !== filters.difficulty) {
    return false;
  }
  if (filters.status !== "ALL" && problem.status !== filters.status) return false;
  if (filters.topic && !problem.topics.some((t) => t === filters.topic)) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const hay = `${problem.title} ${problem.topics.join(" ")}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export default function DSASheet() {
  const { user } = useAuth();
  const { data, loading, error, toggleBookmark } = usePracticeCatalog();
  const filters = useUrlFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const topicOptions = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.problems.forEach((p) => p.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filteredModules = useMemo(() => {
    if (!data) return [] as PracticeModule[];
    return data.modules
      .map((module) => {
        const problems = module.problems.filter((problem) =>
          matchesFilters(problem, filters)
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
      .filter((module) => module.total > 0 || (!filters.q && !filters.topic && !filters.favorites && !filters.revision && filters.status === "ALL" && filters.difficulty === "ALL"));
  }, [data, filters]);

  const visibleModules = useMemo(() => {
    if (!data) return [];
    const hasActive =
      Boolean(filters.q) ||
      filters.difficulty !== "ALL" ||
      filters.status !== "ALL" ||
      Boolean(filters.topic) ||
      filters.favorites ||
      filters.revision;
    if (!hasActive) return data.modules;
    return filteredModules.filter((m) => m.total > 0);
  }, [data, filteredModules, filters]);

  const overall =
    data && data.stats.total
      ? Math.round((data.stats.solved / data.stats.total) * 100)
      : 0;

  return (
    <div className="practice-shell min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="verdict-strip text-[var(--accent)]">Complete DSA Sheet</p>
            <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Structured roadmap for mastery
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-dim)]">
              Learn topic-by-topic with CodeIT’s original curriculum. Track
              progress, bookmark favorites, and jump into practice without leaving
              your flow.
            </p>
          </div>
          {data && (
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 p-4 practice-glass">
              <ProgressCircle value={overall} size={76} label="Sheet progress" />
              <div>
                <div className="text-sm font-semibold">
                  {data.stats.solved} / {data.stats.total} solved
                </div>
                <div className="mt-1 text-xs text-[var(--text-dim)]">
                  Easy {data.stats.difficulty.solved.easy} · Med{" "}
                  {data.stats.difficulty.solved.medium} · Hard{" "}
                  {data.stats.difficulty.solved.hard}
                </div>
                <ProgressBar value={overall} className="mt-2 w-40" />
              </div>
            </div>
          )}
        </header>

        {data && <OverviewStats stats={data.stats} className="mb-5" />}

        <div className="mb-5 space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/70 p-3 practice-glass sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar
              value={filters.q}
              onChange={(q) => filters.patch({ q })}
              placeholder="Search problems or topics…"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] transition hover:border-[var(--info)] hover:text-[var(--text)] lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filters
            </button>
          </div>

          <div className={`space-y-3 ${filtersOpen ? "block" : "hidden lg:block"}`}>
            <FilterChips
              label="Difficulty"
              value={filters.difficulty}
              onChange={(difficulty) => filters.patch({ difficulty })}
              options={[
                { value: "ALL", label: "All" },
                { value: "EASY", label: "Easy" },
                { value: "MEDIUM", label: "Medium" },
                { value: "HARD", label: "Hard" },
              ]}
            />
            <FilterChips
              label="Status"
              value={filters.status}
              onChange={(status) => filters.patch({ status })}
              options={[
                { value: "ALL", label: "All status" },
                { value: "SOLVED", label: "Solved" },
                { value: "ATTEMPTED", label: "Attempted" },
                { value: "NOT_STARTED", label: "Not started" },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={filters.favorites}
                onClick={() => filters.patch({ favorites: !filters.favorites })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  filters.favorites
                    ? "border-[var(--warn)] bg-[var(--warn)]/15 text-[var(--warn)]"
                    : "border-[var(--line)] text-[var(--text-dim)] hover:text-[var(--text)]"
                }`}
              >
                Favorites
              </button>
              <button
                type="button"
                aria-pressed={filters.revision}
                title="Revision queue API coming soon"
                onClick={() => filters.patch({ revision: !filters.revision })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  filters.revision
                    ? "border-[var(--info)] bg-[var(--info)]/15 text-[var(--info)]"
                    : "border-[var(--line)] text-[var(--text-dim)] hover:text-[var(--text)]"
                }`}
              >
                Revision
              </button>
              {(filters.q ||
                filters.difficulty !== "ALL" ||
                filters.status !== "ALL" ||
                filters.topic ||
                filters.favorites ||
                filters.revision) && (
                <button
                  type="button"
                  onClick={filters.clear}
                  className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
                >
                  Clear all
                </button>
              )}
            </div>
            {topicOptions.length > 0 && (
              <FilterChips
                label="Topic"
                value={filters.topic || "ALL"}
                onChange={(topic) =>
                  filters.patch({ topic: topic === "ALL" ? "" : topic })
                }
                options={[
                  { value: "ALL", label: "All topics" },
                  ...topicOptions.map((topic) => ({
                    value: topic,
                    label: topic,
                  })),
                ]}
              />
            )}
          </div>
        </div>

        {loading && <PracticeSkeleton />}
        {error && <ErrorState message={error} />}

        {!loading && !error && data && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              {visibleModules.length === 0 ? (
                <EmptyPractice
                  title="No modules match"
                  description="Try clearing search or filters to see the full roadmap."
                />
              ) : (
                visibleModules.map((module) => {
                  const display =
                    filteredModules.find((m) => m.id === module.id) ?? module;
                  const open = openModules[module.id] ?? false;
                  return (
                    <ModuleAccordion
                      key={module.id}
                      module={display}
                      open={open}
                      onToggle={() =>
                        setOpenModules((prev) => ({
                          ...prev,
                          [module.id]: !open,
                        }))
                      }
                      canFavorite={Boolean(user)}
                      onToggleFavorite={toggleBookmark}
                    />
                  );
                })
              )}
            </div>
            <PracticeSidebar data={data} mode="sheet" />
          </div>
        )}
      </div>
    </div>
  );
}
