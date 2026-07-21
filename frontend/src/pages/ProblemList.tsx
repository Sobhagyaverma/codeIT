import { useMemo, useState } from "react";
import { Dices, SlidersHorizontal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ErrorState } from "../components/Loading";
import { usePracticeCatalog } from "../features/practice/hooks/usePracticeCatalog";
import {
  useUrlFilters,
  type SortKey,
} from "../features/practice/hooks/useUrlFilters";
import CatalogProblemRow from "../features/practice/components/CatalogProblemRow";
import OverviewStats from "../features/practice/components/OverviewStats";
import PracticeSidebar from "../features/practice/components/PracticeSidebar";
import PracticeSkeleton from "../features/practice/components/PracticeSkeleton";
import EmptyPractice from "../features/practice/components/EmptyPractice";
import SearchBar from "../features/practice/components/SearchBar";
import FilterChips from "../features/practice/components/FilterChips";
import type { PracticeProblem } from "../features/practice/types";
import { difficultyRank } from "../features/practice/utils";

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let state = hashSeed(seed || "codeit");
  const rand = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sortProblems(
  problems: PracticeProblem[],
  sort: SortKey,
  seed: string
): PracticeProblem[] {
  const copy = [...problems];
  switch (sort) {
    case "difficulty":
      return copy.sort(
        (a, b) =>
          difficultyRank(a.difficulty) - difficultyRank(b.difficulty) ||
          a.title.localeCompare(b.title)
      );
    case "newest":
      return copy.sort((a, b) => {
        const at = a.createdAt ? Date.parse(a.createdAt) : a.id;
        const bt = b.createdAt ? Date.parse(b.createdAt) : b.id;
        return bt - at;
      });
    case "oldest":
      return copy.sort((a, b) => {
        const at = a.createdAt ? Date.parse(a.createdAt) : a.id;
        const bt = b.createdAt ? Date.parse(b.createdAt) : b.id;
        return at - bt;
      });
    case "acceptance":
      return copy.sort((a, b) => {
        const av = a.acceptanceRate ?? -1;
        const bv = b.acceptanceRate ?? -1;
        return bv - av || a.title.localeCompare(b.title);
      });
    case "mostSolved":
      return copy.sort((a, b) => {
        const av = a.solvedCount ?? -1;
        const bv = b.solvedCount ?? -1;
        return bv - av || a.title.localeCompare(b.title);
      });
    case "random":
      return seededShuffle(copy, seed || "random");
    case "name":
    default:
      return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export default function ProblemList() {
  const { user } = useAuth();
  const { data, loading, error, toggleBookmark } = usePracticeCatalog();
  const filters = useUrlFilters({ sort: "name" });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const topicOptions = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.problems.forEach((p) => p.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const next = data.problems.filter((problem) => {
      if (
        filters.difficulty !== "ALL" &&
        problem.difficulty.toUpperCase() !== filters.difficulty
      ) {
        return false;
      }
      if (filters.status !== "ALL" && problem.status !== filters.status) {
        return false;
      }
      if (filters.favorites && !problem.bookmarked) return false;
      if (filters.topic && !problem.topics.includes(filters.topic)) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const hay = `${problem.title} ${problem.topics.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return sortProblems(next, filters.sort, filters.seed || "codeit");
  }, [data, filters]);

  const sortDisabledHint = (key: SortKey) => {
    if (!data) return undefined;
    if (key === "acceptance" && data.problems.every((p) => p.acceptanceRate == null)) {
      return "Acceptance metrics require the catalog API";
    }
    if (key === "mostSolved" && data.problems.every((p) => p.solvedCount == null)) {
      return "Most solved requires the catalog API";
    }
    if (
      (key === "newest" || key === "oldest") &&
      data.problems.every((p) => p.createdAt == null)
    ) {
      return "Falls back to problem id until createdAt ships";
    }
    return undefined;
  };

  return (
    <div className="practice-shell min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="verdict-strip text-[var(--info)]">Problem catalog</p>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Browse every CodeIT problem
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-dim)]">
            Search instantly, filter by status and topic, and keep solving with a
            clean developer-first catalog.
          </p>
        </header>

        {data && <OverviewStats stats={data.stats} className="mb-5" />}

        <div className="mb-5 space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/70 p-3 practice-glass sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchBar
              value={filters.q}
              onChange={(q) => filters.patch({ q })}
              placeholder="Instant search…"
              className="flex-1"
            />
            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="problem-sort">
                Sort problems
              </label>
              <select
                id="problem-sort"
                value={filters.sort}
                onChange={(e) => {
                  const sort = e.target.value as SortKey;
                  filters.patch({
                    sort,
                    seed:
                      sort === "random"
                        ? String(Date.now())
                        : filters.seed,
                  });
                }}
                className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--info)] focus:outline-none"
              >
                {(
                  [
                    ["name", "Alphabetical"],
                    ["difficulty", "Difficulty"],
                    ["newest", "Newest"],
                    ["oldest", "Oldest"],
                    ["acceptance", "Acceptance"],
                    ["mostSolved", "Most solved"],
                    ["random", "Random"],
                  ] as const
                ).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                    title={sortDisabledHint(value)}
                  >
                    {label}
                    {sortDisabledHint(value) ? " *" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  filters.patch({
                    sort: "random",
                    seed: String(Date.now()),
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
                title="Shuffle problems"
              >
                <Dices className="h-4 w-4" aria-hidden />
                Random
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Filters
              </button>
            </div>
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={filters.favorites}
                onClick={() => filters.patch({ favorites: !filters.favorites })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  filters.favorites
                    ? "border-[var(--warn)] bg-[var(--warn)]/15 text-[var(--warn)]"
                    : "border-[var(--line)] text-[var(--text-dim)]"
                }`}
              >
                Favorites
              </button>
              <span
                className="rounded-full border border-dashed border-[var(--line)] px-3 py-1.5 text-xs text-[var(--text-dim)]"
                title="Acceptance range filters require catalog metrics API"
              >
                Acceptance range · Coming soon
              </span>
              {(filters.q ||
                filters.difficulty !== "ALL" ||
                filters.status !== "ALL" ||
                filters.topic ||
                filters.favorites ||
                filters.sort !== "name") && (
                <button
                  type="button"
                  onClick={filters.clear}
                  className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--text-dim)]"
                >
                  Clear
                </button>
              )}
            </div>
            {topicOptions.length > 0 && (
              <FilterChips
                label="Topics"
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

        {loading && <PracticeSkeleton count={8} />}
        {error && <ErrorState message={error} />}

        {!loading && !error && data && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-3 hidden grid-cols-[48px_minmax(0,1.6fr)_90px_100px_130px_44px_100px] gap-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)] lg:grid">
                <div>#</div>
                <div>Problem</div>
                <div>Acc</div>
                <div>Difficulty</div>
                <div>Status</div>
                <div />
                <div className="text-right">Last attempt</div>
              </div>

              {filtered.length === 0 ? (
                <EmptyPractice
                  title="No problems match"
                  description="Adjust filters or clear search to browse the full catalog."
                />
              ) : (
                <div className="space-y-2">
                  {filtered.map((problem, index) => (
                    <CatalogProblemRow
                      key={problem.id}
                      problem={problem}
                      index={index + 1}
                      canFavorite={Boolean(user)}
                      onToggleFavorite={toggleBookmark}
                    />
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-[var(--text-dim)]">
                Showing {filtered.length} of {data.stats.total} problems.
                Acceptance and most-solved metrics appear when the catalog API
                ships.
              </p>
            </div>
            <PracticeSidebar data={data} mode="problems" />
          </div>
        )}
      </div>
    </div>
  );
}
