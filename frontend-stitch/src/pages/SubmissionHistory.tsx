import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AppNav from "../components/AppNav";
import {
  getMyProfileSubmissions,
  type ProfileSubmissionRow,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "Yesterday" : `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function verdictStyle(verdict: string): {
  className: string;
  icon: string;
} {
  const v = verdict.toLowerCase();
  if (v.includes("accept")) {
    return {
      className:
        "bg-[rgba(74,222,128,0.1)] text-[#4ade80] border-[#4ade80]/30",
      icon: "check_circle",
    };
  }
  if (v.includes("wrong") || v.includes("runtime")) {
    return {
      className:
        "bg-[rgba(248,113,113,0.1)] text-[#f87171] border-[#f87171]/30",
      icon: v.includes("runtime") ? "bug_report" : "cancel",
    };
  }
  if (v.includes("time")) {
    return {
      className:
        "bg-[rgba(251,191,36,0.1)] text-[#fbbf24] border-[#fbbf24]/30",
      icon: "timer",
    };
  }
  if (v.includes("compil")) {
    return {
      className:
        "bg-[rgba(248,113,113,0.1)] text-[#f87171] border-[#f87171]/30",
      icon: "code_off",
    };
  }
  return {
    className:
      "bg-surface-container-high text-on-surface-variant border-outline-variant/40",
    icon: "info",
  };
}

function difficultyBadge(diff?: string) {
  const d = (diff ?? "").toUpperCase();
  if (d === "EASY") {
    return "bg-[rgba(74,222,128,0.1)] text-[#4ade80] border-[#4ade80]/30";
  }
  if (d === "HARD") {
    return "bg-error-container/30 text-error border-error-container/50";
  }
  return "bg-secondary-container/30 text-secondary border-secondary-container/50";
}

export default function SubmissionHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProfileSubmissionRow[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const cursorRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("");
  const [langFilter, setLangFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("");

  const load = async (reset: boolean) => {
    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }
    try {
      const page = await getMyProfileSubmissions(
        20,
        reset ? undefined : (cursorRef.current ?? undefined)
      );
      setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
      cursorRef.current = page.nextCursor;
      setNextCursor(page.nextCursor);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load submissions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void load(true);
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row) => {
      if (q && !row.problemTitle.toLowerCase().includes(q) && !String(row.problemId).includes(q)) {
        return false;
      }
      if (verdictFilter) {
        const v = row.verdict.toLowerCase();
        if (verdictFilter === "ac" && !v.includes("accept")) return false;
        if (verdictFilter === "wa" && !v.includes("wrong")) return false;
        if (verdictFilter === "tle" && !v.includes("time")) return false;
        if (verdictFilter === "re" && !v.includes("runtime")) return false;
        if (verdictFilter === "ce" && !v.includes("compil")) return false;
      }
      if (langFilter && !row.language.toLowerCase().includes(langFilter)) {
        return false;
      }
      if (diffFilter && (row.difficulty ?? "").toLowerCase() !== diffFilter) {
        return false;
      }
      return true;
    });
  }, [items, search, verdictFilter, langFilter, diffFilter]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-on-surface">
      <AppNav />
      <main className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-grow flex-col gap-8 px-4 pb-16 pt-28 md:px-12">
        <header className="flex flex-col items-start justify-between gap-4 border-b border-surface-variant pb-6 md:flex-row md:items-end">
          <div>
            <Link
              className="group mb-2 inline-flex items-center gap-2 font-label text-sm text-primary transition-colors hover:text-primary-container"
              to="/profile"
            >
              <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">
                arrow_back
              </span>
              View profile
            </Link>
            <h1 className="font-headline text-3xl font-bold text-on-surface">
              Submission history
            </h1>
            <p className="mt-1 font-body text-on-surface-variant">
              Your past runs and verdicts
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">
              timeline
            </span>
            <span className="font-mono text-sm text-on-surface">
              Loaded:{" "}
              <span className="font-bold text-primary">{items.length}</span>
            </span>
          </div>
        </header>

        <div className="glass-panel flex flex-col items-center justify-between gap-4 rounded-xl p-4 lg:flex-row">
          <div className="relative w-full lg:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full rounded-lg border border-outline-variant bg-surface-container py-2 pl-10 pr-4 font-body text-on-surface transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Search problem..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
            <select
              className="cursor-pointer appearance-none rounded-lg border border-outline-variant bg-surface-container px-4 py-2 font-label text-sm text-on-surface focus:border-primary focus:outline-none"
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
            >
              <option value="">Verdict: All</option>
              <option value="ac">Accepted</option>
              <option value="wa">Wrong Answer</option>
              <option value="tle">Time Limit Exceeded</option>
              <option value="re">Runtime Error</option>
              <option value="ce">Compilation Error</option>
            </select>
            <select
              className="cursor-pointer appearance-none rounded-lg border border-outline-variant bg-surface-container px-4 py-2 font-label text-sm text-on-surface focus:border-primary focus:outline-none"
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
            >
              <option value="">Language: All</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
            <select
              className="cursor-pointer appearance-none rounded-lg border border-outline-variant bg-surface-container px-4 py-2 font-label text-sm text-on-surface focus:border-primary focus:outline-none"
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
            >
              <option value="">Difficulty: All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button
              type="button"
              title="Refresh"
              onClick={() => void load(true)}
              className="flex size-10 items-center justify-center rounded-lg bg-surface-variant text-on-surface transition-colors hover:bg-surface-bright"
            >
              <span className="material-symbols-outlined text-[20px]">
                refresh
              </span>
            </button>
          </div>
        </div>

        <div className="glass-panel flex flex-grow flex-col overflow-hidden rounded-xl">
          {loading ? (
            <p className="p-8 text-center text-on-surface-variant">
              Loading submissions…
            </p>
          ) : error ? (
            <p className="p-8 text-center text-error">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-on-surface-variant">
              No submissions match your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-variant bg-surface-container-low font-label text-sm text-on-surface-variant">
                    <th className="px-6 py-4 font-medium">Problem</th>
                    <th className="w-24 px-6 py-4 font-medium">Difficulty</th>
                    <th className="w-48 px-6 py-4 font-medium">Verdict</th>
                    <th className="w-28 px-6 py-4 font-medium">Language</th>
                    <th className="w-24 px-6 py-4 text-right font-medium">
                      Runtime
                    </th>
                    <th className="w-24 px-6 py-4 text-right font-medium">
                      Memory
                    </th>
                    <th className="w-32 px-6 py-4 text-right font-medium">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/50 font-body text-on-surface">
                  {filtered.map((row) => {
                    const vs = verdictStyle(row.verdict);
                    return (
                      <tr
                        key={row.id}
                        className="group cursor-pointer transition-colors hover:bg-surface-container-high/40"
                        onClick={() => navigate(`/problems/${row.problemId}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-on-surface-variant">
                              {row.problemId}
                            </span>
                            <span className="font-medium transition-colors group-hover:text-primary">
                              {row.problemTitle}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded border px-2 py-1 font-label text-xs ${difficultyBadge(row.difficulty)}`}
                          >
                            {row.difficulty ?? "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 ${vs.className}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {vs.icon}
                            </span>
                            <span className="font-label text-sm">
                              {row.verdict}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-tertiary">
                          {row.language}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm">
                          {row.runtime != null ? `${row.runtime}ms` : "—"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm">
                          {row.memory != null ? `${row.memory}KB` : "—"}
                        </td>
                        <td className="px-6 py-4 text-right font-label text-sm text-on-surface-variant">
                          {formatRelative(row.submittedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {nextCursor != null && (
            <div className="flex justify-center border-t border-surface-variant bg-surface-container-low/50 p-6">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void load(false)}
                className="group relative overflow-hidden rounded-lg border border-primary bg-transparent px-6 py-2.5 font-label text-sm text-primary transition-all hover:shadow-[0_0_15px_rgba(183,109,255,0.4)] disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loadingMore ? "Loading…" : "Load more"}
                  <span className="material-symbols-outlined text-[18px] group-hover:animate-spin">
                    sync
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
