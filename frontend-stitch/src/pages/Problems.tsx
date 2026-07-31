import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../context/AuthContext";
import { ApiError, getProblems, getUserSubmissions } from "../lib/api";
import type { ProblemPublicDTO, Submission } from "../lib/authStorage";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type Status = "solved" | "attempted" | "not_started";

type ProblemRow = {
  id: number;
  title: string;
  difficulty: Difficulty | string;
  topics: string[];
  status: Status;
};

function parseTopics(topics: string[] | string | undefined): string[] {
  if (!topics) return [];
  if (Array.isArray(topics)) return topics.map(String);
  const raw = topics.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* comma-separated */
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function isAccepted(verdict?: string): boolean {
  const raw = (verdict || "").trim().toUpperCase();
  return raw === "ACCEPTED" || raw.startsWith("ACCEPTED");
}

function statusFromSubs(subs: Submission[]): Status {
  if (subs.some((s) => isAccepted(s.verdict))) return "solved";
  return subs.length > 0 ? "attempted" : "not_started";
}

function normalizeDifficulty(d: string): Difficulty | string {
  const u = d.trim().toUpperCase();
  if (u === "EASY" || u === "MEDIUM" || u === "HARD") return u;
  return d;
}

function buildRows(
  problems: ProblemPublicDTO[],
  submissions: Submission[]
): ProblemRow[] {
  const byProblem = new Map<number, Submission[]>();
  for (const sub of submissions) {
    const list = byProblem.get(sub.problemId) || [];
    list.push(sub);
    byProblem.set(sub.problemId, list);
  }

  return problems.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: normalizeDifficulty(p.difficulty),
    topics: parseTopics(p.topics),
    status: statusFromSubs(byProblem.get(p.id) || []),
  }));
}

const DIFFICULTY_CLASS: Record<string, string> = {
  EASY: "text-easy",
  MEDIUM: "text-medium",
  HARD: "text-hard",
};

function statusIcon(status: Status) {
  if (status === "solved") {
    return (
      <span className="material-symbols-outlined text-[20px] text-easy" title="SOLVED">
        check_circle
      </span>
    );
  }
  if (status === "attempted") {
    return (
      <span className="material-symbols-outlined text-[20px] text-medium" title="ATTEMPTED">
        remove_circle_outline
      </span>
    );
  }
  return (
    <span
      className="material-symbols-outlined text-[20px] text-on-surface-variant/30"
      title="NOT STARTED"
    >
      radio_button_unchecked
    </span>
  );
}

const PAGE_SIZE = 20;

export default function Problems() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ProblemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "ALL">("ALL");
  const [status, setStatus] = useState<"ALL" | Status>("ALL");
  const [topic, setTopic] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [problems, submissions] = await Promise.all([
          getProblems(),
          user ? getUserSubmissions(user.id) : Promise.resolve([] as Submission[]),
        ]);
        if (cancelled) return;
        setRows(buildRows(problems, submissions));
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load problems."
        );
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      for (const t of row.topics) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((p) => {
      if (difficulty !== "ALL" && p.difficulty !== difficulty) return false;
      if (status !== "ALL" && p.status !== status) return false;
      if (topic && !p.topics.some((t) => t.toLowerCase() === topic.toLowerCase())) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!`${p.id} ${p.title} ${p.topics.join(" ")}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, difficulty, status, topic]);

  useEffect(() => {
    setPage(1);
  }, [search, difficulty, status, topic]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const stats = useMemo(() => {
    const solved = rows.filter((r) => r.status === "solved").length;
    const attempted = rows.filter((r) => r.status === "attempted").length;
    const notStarted = rows.length - solved - attempted;
    const denom = solved + attempted;
    const acceptance = denom ? Math.round((solved / denom) * 100) : 0;
    return { total: rows.length, solved, attempted, notStarted, acceptance };
  }, [rows]);

  const resetFilters = () => {
    setSearch("");
    setDifficulty("ALL");
    setStatus("ALL");
    setTopic(null);
  };

  const pickRandom = () => {
    if (!filtered.length) return;
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    window.open(`/problems/${pick.id}`, "_self");
  };

  const chip = (
    active: boolean,
    onClick: () => void,
    label: string,
    activeClass: string,
    idleClass: string
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`font-code-sm text-code-sm rounded-full px-3 py-1 transition-colors ${
        active ? activeClass : idleClass
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="font-body-md flex min-h-screen flex-col bg-[#09040D] pt-16 text-on-surface antialiased">
      <AppNav />

      <main className="mx-auto grid w-full max-w-container-max flex-grow grid-cols-1 items-start gap-gutter px-margin-mobile py-8 md:px-margin-desktop lg:grid-cols-[300px_1fr]">
        <aside className="sticky top-24 flex flex-col gap-6">
          {user ? (
            <div className="glass-panel flex flex-col gap-4 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-primary/20 text-sm font-bold text-primary">
                  {user.name
                    .split(" ")
                    .map((p: string) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-label-md text-label-md font-bold text-on-surface">
                    {user.name}
                  </h3>
                  <p className="font-code-sm text-code-sm text-on-surface-variant">
                    @{user.uniqueUserId}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-end justify-between">
                  <span className="font-code-sm text-code-sm text-on-surface-variant">
                    Problems Solved
                  </span>
                  <span className="font-code-sm text-code-sm text-primary">
                    <span className="text-on-surface">{stats.solved}</span>/{stats.total}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="progress-bar-fill h-full rounded-full"
                    style={{
                      width: `${stats.total ? Math.round((stats.solved / stats.total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-xl p-6 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container">
                <span
                  className="material-symbols-outlined text-on-surface-variant"
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  person
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-body-md text-on-surface">Sign in to track progress</p>
                <p className="font-code-sm text-code-sm text-on-surface-variant">
                  Save solutions, track stats.
                </p>
              </div>
              <Link
                to="/login"
                className="glow-hover font-label-md text-label-md mt-2 w-full rounded-DEFAULT border border-primary/50 py-2 text-primary transition-colors hover:bg-primary/10"
              >
                Sign In
              </Link>
            </div>
          )}

          <div className="glass-panel flex flex-col gap-6 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <span className="font-code-sm text-code-sm tracking-widest text-primary uppercase">
                FILTERS
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-on-surface-variant hover:text-on-surface"
                aria-label="Reset filters"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-label-md text-label-md text-on-surface-variant">Difficulty</span>
              <div className="flex flex-wrap gap-2">
                {chip(
                  difficulty === "EASY",
                  () => setDifficulty(difficulty === "EASY" ? "ALL" : "EASY"),
                  "Easy",
                  "bg-easy/10 border border-easy text-easy",
                  "bg-surface-container border border-easy/30 text-easy hover:bg-easy/10"
                )}
                {chip(
                  difficulty === "MEDIUM",
                  () => setDifficulty(difficulty === "MEDIUM" ? "ALL" : "MEDIUM"),
                  "Medium",
                  "bg-medium/10 border border-medium text-medium",
                  "bg-surface-container border border-medium/30 text-medium hover:bg-medium/10"
                )}
                {chip(
                  difficulty === "HARD",
                  () => setDifficulty(difficulty === "HARD" ? "ALL" : "HARD"),
                  "Hard",
                  "bg-hard/10 border border-hard text-hard",
                  "bg-surface-container border border-hard/30 text-hard hover:bg-hard/10"
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-label-md text-label-md text-on-surface-variant">Status</span>
              <div className="flex flex-wrap gap-2">
                {chip(
                  status === "ALL",
                  () => setStatus("ALL"),
                  "All",
                  "bg-primary/20 border border-primary text-primary shadow-[0_0_8px_rgba(221,183,255,0.2)]",
                  "bg-surface-container border border-outline-variant/30 text-on-surface hover:border-outline-variant"
                )}
                {chip(
                  status === "solved",
                  () => setStatus("solved"),
                  "Solved",
                  "bg-primary/20 border border-primary text-primary",
                  "bg-surface-container border border-outline-variant/30 text-on-surface hover:border-outline-variant"
                )}
                {chip(
                  status === "attempted",
                  () => setStatus("attempted"),
                  "Attempted",
                  "bg-primary/20 border border-primary text-primary",
                  "bg-surface-container border border-outline-variant/30 text-on-surface hover:border-outline-variant"
                )}
                {chip(
                  status === "not_started",
                  () => setStatus("not_started"),
                  "Not started",
                  "bg-primary/20 border border-primary text-primary",
                  "bg-surface-container border border-outline-variant/30 text-on-surface hover:border-outline-variant"
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-label-md text-label-md text-on-surface-variant">Topics</span>
              <div className="flex max-h-[200px] flex-wrap gap-2 overflow-y-auto pr-2">
                {topics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(topic === t ? null : t)}
                    className={`font-code-sm text-code-sm rounded-DEFAULT px-3 py-1 transition-colors ${
                      topic === t
                        ? "border border-primary bg-primary/20 text-primary"
                        : "border border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-outline-variant hover:text-on-surface"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex flex-col gap-6">
          <div className="mb-2 flex flex-col gap-4">
            <div>
              <span className="font-code-sm text-code-sm mb-1 block tracking-widest text-primary uppercase">
                PROBLEM CATALOG
              </span>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">Problem Set</h1>
            </div>

            <div className="glass-panel flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-outline-variant/20 px-4 py-3">
              <Stat label="Total" value={String(stats.total)} />
              <Divider />
              <Stat label="Solved" value={String(stats.solved)} valueClass="text-easy" />
              <Divider />
              <Stat label="Attempted" value={String(stats.attempted)} valueClass="text-medium" />
              <Divider />
              <Stat label="Not Started" value={String(stats.notStarted)} />
              <Divider />
              <Stat
                label="Acceptance"
                value={user ? `${stats.acceptance}%` : "—"}
                valueClass="text-primary"
              />
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-4 sm:flex-row">
            <div className="input-glow rounded-DEFAULT relative w-full flex-grow transition-all">
              <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problems..."
                className="font-body-md w-full rounded-DEFAULT border border-outline-variant/30 bg-surface-container-high py-2 pr-4 pl-10 text-on-surface placeholder:text-on-surface-variant/50 focus:border-transparent focus:outline-none"
              />
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={pickRandom}
                disabled={!filtered.length}
                className="glow-hover font-label-md text-label-md flex items-center gap-2 rounded-DEFAULT border border-primary/30 bg-primary/10 px-4 py-2 whitespace-nowrap text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">shuffle</span> Pick Random
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-on-error-container">
              {error}
            </div>
          )}

          <div className="glass-panel overflow-hidden rounded-xl border border-outline-variant/20">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-highest/50">
                    <th className="font-code-sm text-code-sm w-16 p-4 text-center text-on-surface-variant">
                      Status
                    </th>
                    <th className="font-code-sm text-code-sm p-4 text-on-surface-variant">Title</th>
                    <th className="font-code-sm text-code-sm w-24 p-4 text-on-surface-variant">
                      Difficulty
                    </th>
                    <th className="font-code-sm text-code-sm w-24 text-center text-on-surface-variant">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="font-body-md">
                  {loading && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                        Loading problems…
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    pageRows.map((p) => (
                      <tr
                        key={p.id}
                        className={`problem-row group cursor-pointer border-b border-outline-variant/10 ${
                          p.status === "attempted"
                            ? "border-l-[2px] border-l-medium/30 bg-medium/5"
                            : ""
                        }`}
                      >
                        <td className="p-4 text-center">{statusIcon(p.status)}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-code-sm text-on-surface-variant/60">
                                {p.id}.
                              </span>
                              <Link
                                to={`/problems/${p.id}`}
                                className="font-body-md font-medium text-on-surface transition-colors group-hover:text-primary"
                              >
                                {p.title}
                              </Link>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {p.topics.slice(0, 4).map((t) => (
                                <span
                                  key={t}
                                  className="font-code-sm rounded-sm border border-outline-variant/10 bg-surface-container px-2 py-0.5 text-[11px] text-on-surface-variant"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`font-code-sm text-code-sm ${
                              DIFFICULTY_CLASS[String(p.difficulty)] || "text-on-surface-variant"
                            }`}
                          >
                            {p.difficulty}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Link
                            to={`/problems/${p.id}`}
                            className="font-label-md text-label-md rounded-DEFAULT border border-primary/30 bg-primary/10 px-3 py-1 text-primary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary/20"
                          >
                            Solve
                          </Link>
                        </td>
                      </tr>
                    ))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                        No problems match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-outline-variant/20 bg-surface-container-highest/20 p-4">
              <span className="font-code-sm text-code-sm text-on-surface-variant">
                {filtered.length
                  ? `Showing ${(pageSafe - 1) * PAGE_SIZE + 1}-${Math.min(pageSafe * PAGE_SIZE, filtered.length)} of ${filtered.length}`
                  : "Showing 0 of 0"}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-sm border border-outline-variant/30 bg-surface-container p-1 text-on-surface-variant hover:bg-surface-bright hover:text-on-surface disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="font-code-sm text-code-sm px-3 py-1 text-on-surface-variant">
                  {pageSafe} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-sm border border-outline-variant/30 bg-surface-container p-1 text-on-surface-variant hover:bg-surface-bright hover:text-on-surface disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant/10 bg-surface-container-lowest px-margin-desktop py-8 md:flex-row">
        <div className="text-label-md font-bold text-on-surface">© 2024 CodeIT</div>
        <div className="flex gap-6">
          <Link
            to="/privacy"
            className="font-label-md text-label-md text-on-surface-variant opacity-80 transition-colors hover:text-secondary hover:opacity-100"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="font-label-md text-label-md text-on-surface-variant opacity-80 transition-colors hover:text-secondary hover:opacity-100"
          >
            Terms
          </Link>
          <Link
            to="/help"
            className="font-label-md text-label-md text-on-surface-variant opacity-80 transition-colors hover:text-secondary hover:opacity-100"
          >
            Help
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = "text-on-surface",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-label-md text-label-md text-on-surface-variant">{label}:</span>
      <span className={`font-code-sm text-code-sm font-bold ${valueClass}`}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="hidden h-4 w-px bg-outline-variant/50 sm:block" />;
}
