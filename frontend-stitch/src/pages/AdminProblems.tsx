import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, getProblems } from "../lib/api";
import type { ProblemPublicDTO } from "../lib/authStorage";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type SortMode = "latest" | "title" | "difficulty";
type ViewMode = "grid" | "list";

function parseTopics(topics: string[] | string | undefined): string[] {
  if (!topics) return [];
  if (Array.isArray(topics)) return topics.map(String).filter(Boolean);
  const raw = topics.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    /* comma-separated */
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizeDifficulty(d: string): Difficulty | string {
  const u = d.trim().toUpperCase();
  if (u === "EASY" || u === "MEDIUM" || u === "HARD") return u;
  return d;
}

function difficultyKey(diff: string): "easy" | "medium" | "hard" {
  const d = (diff || "").trim().toUpperCase();
  if (d === "HARD" || d.startsWith("HARD")) return "hard";
  if (d === "MEDIUM" || d.startsWith("MED")) return "medium";
  return "easy";
}

function difficultyLabel(diff: string): string {
  const key = difficultyKey(diff);
  if (key === "hard") return "Hard";
  if (key === "medium") return "Medium";
  return "Easy";
}

const DIFF_ORDER: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };

const filterBtn =
  "flex items-center gap-2 whitespace-nowrap rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs font-semibold transition-all hover:border-[#a855f7]";

type AdminProblemsProps = {
  onCreateProblem: () => void;
  viewMode?: ViewMode;
};

export default function AdminProblems({
  onCreateProblem,
  viewMode = "grid",
}: AdminProblemsProps) {
  const [problems, setProblems] = useState<ProblemPublicDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "ALL">("ALL");
  const [topic, setTopic] = useState<string>("ALL");
  const [sort, setSort] = useState<SortMode>("latest");
  const [pageSize, setPageSize] = useState(24);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setProblems(await getProblems());
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load problems."
      );
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(
    () =>
      problems.map((p) => ({
        id: p.id,
        title: p.title,
        difficulty: normalizeDifficulty(p.difficulty),
        topics: parseTopics(p.topics),
      })),
    [problems]
  );

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) for (const t of r.topics) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows.filter((p) => {
      if (difficulty !== "ALL" && p.difficulty !== difficulty) return false;
      if (
        topic !== "ALL" &&
        !p.topics.some((t) => t.toLowerCase() === topic.toLowerCase())
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !`${p.id} ${p.title} ${p.topics.join(" ")}`
            .toLowerCase()
            .includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "difficulty") {
        return (
          (DIFF_ORDER[String(a.difficulty)] ?? 9) -
          (DIFF_ORDER[String(b.difficulty)] ?? 9)
        );
      }
      return b.id - a.id;
    });
  }, [rows, search, difficulty, topic, sort]);

  useEffect(() => {
    setPage(1);
  }, [search, difficulty, topic, sort, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (pageSafe - 1) * pageSize,
    pageSafe * pageSize
  );
  const rangeStart = filtered.length === 0 ? 0 : (pageSafe - 1) * pageSize + 1;
  const rangeEnd = Math.min(pageSafe * pageSize, filtered.length);

  const pageButtons = useMemo(() => {
    const pages: (number | "…")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (pageSafe > 3) pages.push("…");
    for (
      let i = Math.max(2, pageSafe - 1);
      i <= Math.min(totalPages - 1, pageSafe + 1);
      i++
    ) {
      pages.push(i);
    }
    if (pageSafe < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }, [totalPages, pageSafe]);

  const actionBtn =
    "border-r border-outline-variant p-1.5 text-outline transition-all hover:bg-[#a855f7]/20 hover:text-[#a855f7]";
  const actionBtnDisabled =
    "cursor-not-allowed border-r border-outline-variant p-1.5 text-outline opacity-35";

  return (
    <div className="admin-problems-repo relative mx-auto w-full max-w-[1600px]">
      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <div className="repo-glass rounded-xl border-l-4 border-l-[#a855f7] p-4">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-outline">
            Total Problems
          </p>
          <div className="flex items-end justify-between">
            <h3 className="font-headline-lg text-2xl font-bold">
              {loading ? "…" : rows.length.toLocaleString()}
            </h3>
          </div>
        </div>
        <div className="repo-glass rounded-xl p-4">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-outline">
            Active in Contests
          </p>
          <h3 className="font-headline-lg text-2xl font-bold text-orange-400">
            —
          </h3>
        </div>
        <div className="repo-glass rounded-xl p-4">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-outline">
            Drafts
          </p>
          <h3 className="font-headline-lg text-2xl font-bold text-outline-variant">
            —
          </h3>
        </div>
        <div className="repo-glass rounded-xl p-4">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-outline">
            Avg Acceptance
          </p>
          <h3 className="font-headline-lg text-2xl font-bold">—</h3>
        </div>
        <div className="repo-glass rounded-xl p-4">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-outline">
            Recent (24h)
          </p>
          <h3 className="font-headline-lg text-2xl font-bold text-[#a855f7]">
            —
          </h3>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-10 flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="group relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-[#a855f7]">
            search
          </span>
          <input
            className="w-full rounded-lg border border-outline-variant bg-surface-container py-2.5 pl-10 pr-4 text-sm transition-all placeholder:text-outline/50 focus:border-[#a855f7] focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20"
            placeholder="Search problems by name, ID, tags or author..."
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <label className={`${filterBtn} relative`}>
            <span className="material-symbols-outlined text-[16px]">
              filter_list
            </span>
            Difficulty
            <span className="material-symbols-outlined text-[16px]">
              expand_more
            </span>
            <select
              className="absolute inset-0 cursor-pointer opacity-0"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as Difficulty | "ALL")
              }
            >
              <option value="ALL">All</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>

          <button
            type="button"
            disabled
            title="Requires draft/published status API"
            className={`${filterBtn} cursor-not-allowed opacity-50`}
          >
            Status
            <span className="material-symbols-outlined text-[16px]">
              expand_more
            </span>
          </button>

          <label className={`${filterBtn} relative`}>
            Tags
            <span className="material-symbols-outlined text-[16px]">
              expand_more
            </span>
            <select
              className="absolute inset-0 cursor-pointer opacity-0"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="ALL">All</option>
              {allTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled
            title="Author filter not available"
            className={`${filterBtn} cursor-not-allowed opacity-50`}
          >
            Author
          </button>

          <div className="mx-1 h-6 w-px bg-outline-variant" />

          <label className={`${filterBtn} relative`}>
            Sort:{" "}
            {sort === "latest"
              ? "Latest"
              : sort === "title"
                ? "Title"
                : "Difficulty"}
            <span className="material-symbols-outlined text-[16px]">
              swap_vert
            </span>
            <select
              className="absolute inset-0 cursor-pointer opacity-0"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
            >
              <option value="latest">Latest</option>
              <option value="title">Title</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onCreateProblem}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#a855f7] px-6 py-2.5 font-bold text-white shadow-lg shadow-[#a855f7]/20 transition-all hover:brightness-110 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add_box</span>
          <span>Create Problem</span>
        </button>
      </div>

      {error && (
        <div className="repo-glass mb-6 rounded-xl border border-error/40 p-4">
          <p className="mb-3 text-sm text-error">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-[#a855f7]/40 px-4 py-2 text-sm text-[#a855f7] hover:bg-[#a855f7]/10"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="repo-glass h-[300px] animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="repo-glass flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/30 p-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-highest">
            <span className="material-symbols-outlined text-4xl text-outline">
              search_off
            </span>
          </div>
          <h4 className="font-headline-lg mb-2 text-lg">No problems found</h4>
          <p className="max-w-[220px] text-sm text-outline">
            Adjust your filters or create a new problem template to start.
          </p>
          <button
            type="button"
            onClick={onCreateProblem}
            className="mt-6 rounded-lg bg-[#a855f7] px-5 py-2 text-sm font-bold text-white"
          >
            Create Problem
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {pageRows.map((p) => {
            const diff = difficultyKey(String(p.difficulty));
            return (
              <article
                key={p.id}
                className={`problem-card group flex flex-col rounded-xl p-6 diff-${diff}`}
              >
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`repo-diff-badge diff-${diff}`}>
                      {difficultyLabel(String(p.difficulty))}
                    </span>
                    <span className="flex items-center gap-1 rounded-md bg-[#a855f7]/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#a855f7]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a855f7]" />
                      Published
                    </span>
                  </div>
                  <Link
                    to={`/problems/${p.id}`}
                    className="font-headline-lg mt-2 block cursor-pointer text-lg leading-tight text-on-surface transition-colors group-hover:text-[#a855f7]"
                  >
                    {p.title}
                  </Link>
                </div>

                <div className="mb-6 flex flex-wrap gap-1.5">
                  {p.topics.length === 0 ? (
                    <span className="text-[11px] text-outline">No tags</span>
                  ) : (
                    p.topics.slice(0, 5).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTopic(t)}
                        className="cursor-pointer rounded-md border border-outline-variant bg-surface-container-highest px-2 py-0.5 text-[11px] text-outline transition-all hover:border-[#a855f7]/50"
                      >
                        {t}
                      </button>
                    ))
                  )}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4 border-y border-outline-variant/30 py-3">
                  <div>
                    <p className="mb-0.5 text-[10px] font-bold uppercase text-outline">
                      Acceptance
                    </p>
                    <p className="text-sm font-semibold">—</p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-bold uppercase text-outline">
                      Submissions
                    </p>
                    <p className="text-sm font-semibold">—</p>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-highest">
                      <span className="material-symbols-outlined text-[18px] text-outline">
                        person
                      </span>
                    </div>
                    <div className="min-w-0 text-[11px]">
                      <p className="truncate font-semibold text-on-surface">
                        —
                      </p>
                      <p className="text-outline">Updated —</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
                    <Link
                      to={`/problems/${p.id}`}
                      className={actionBtn}
                      title="Preview"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        visibility
                      </span>
                    </Link>
                    <button
                      type="button"
                      disabled
                      title="Edit API not available"
                      className={actionBtnDisabled}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit_note
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Duplicate API not available"
                      className={actionBtnDisabled}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        content_copy
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Delete API not available"
                      className="cursor-not-allowed p-1.5 text-outline opacity-35"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-outline-variant/30 pt-8 md:flex-row">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-outline">
                Rows per page:
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-md border border-outline-variant bg-surface-container-low px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#a855f7]/40"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <p className="text-xs text-outline">
              Showing{" "}
              <span className="font-bold text-on-surface">
                {rangeStart} - {rangeEnd}
              </span>{" "}
              of{" "}
              <span className="font-bold text-on-surface">
                {filtered.length.toLocaleString()}
              </span>{" "}
              problems
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-outline transition-all hover:border-[#a855f7] hover:text-[#a855f7] disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </button>
            {pageButtons.map((item, idx) =>
              item === "…" ? (
                <span key={`e-${idx}`} className="px-2 text-outline">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    item === pageSafe
                      ? "bg-[#a855f7] font-bold text-white shadow-md shadow-[#a855f7]/20"
                      : "border border-outline-variant text-on-surface-variant hover:border-[#a855f7] hover:text-[#a855f7]"
                  }`}
                >
                  {item}
                </button>
              )
            )}
            <button
              type="button"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-outline transition-all hover:border-[#a855f7] hover:text-[#a855f7] disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-[#a855f7]/5 blur-[120px]" />
      <div className="pointer-events-none fixed left-64 top-0 -z-10 h-[300px] w-[300px] rounded-full bg-secondary/5 blur-[100px]" />
    </div>
  );
}
