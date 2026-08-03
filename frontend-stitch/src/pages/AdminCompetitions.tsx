import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ApiError,
  getAllCompetitions,
  type Competition,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";

type StatusFilter = "ALL" | "ACTIVE" | "UPCOMING" | "ENDED";
type TypeFilter = "ALL" | "RATED" | "PRACTICE" | "UNRATED";
type ViewMode = "grid" | "list";

type Enriched = Competition & {
  problemCountResolved: number | null;
  participantCountResolved: number | null;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function monthDay(iso: string): { mon: string; day: string } {
  try {
    const d = new Date(iso);
    return {
      mon: d.toLocaleString(undefined, { month: "short" }).toUpperCase(),
      day: String(d.getDate()).padStart(2, "0"),
    };
  } catch {
    return { mon: "—", day: "—" };
  }
}

function statusBadge(status: Competition["status"]) {
  if (status === "ACTIVE")
    return "bg-error/20 text-error border-error/30";
  if (status === "UPCOMING")
    return "bg-secondary-container/40 text-secondary border-secondary/30";
  return "bg-surface-container-highest text-outline border-outline-variant";
}

function statusLabel(status: Competition["status"]) {
  if (status === "ACTIVE") return "Live";
  if (status === "UPCOMING") return "Upcoming";
  return "Ended";
}

type Props = {
  onCreate: () => void;
};

export default function AdminCompetitions({ onCreate }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [quickSearch, setQuickSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getAllCompetitions();
        const enriched: Enriched[] = list.map((c) => ({
          ...c,
          problemCountResolved:
            typeof c.problemCount === "number" ? c.problemCount : null,
          participantCountResolved:
            typeof c.participantCount === "number"
              ? c.participantCount
              : null,
        }));
        if (!cancelled) setRows(enriched);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Failed to load competitions"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = useMemo(() => {
    const total = rows.length;
    const upcoming = rows.filter((c) => c.status === "UPCOMING").length;
    const live = rows.filter((c) => c.status === "ACTIVE").length;
    const completed = rows.filter((c) => c.status === "ENDED").length;
    const participants = rows.reduce(
      (sum, c) => sum + (c.participantCountResolved ?? 0),
      0
    );
    return { total, upcoming, live, completed, participants };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = (search || quickSearch).trim().toLowerCase();
    return rows.filter((c) => {
      if (status !== "ALL" && c.status !== status) return false;
      const type = String(c.contestType || "").toUpperCase();
      if (typeFilter !== "ALL" && type && type !== typeFilter) return false;
      if (typeFilter !== "ALL" && !type) return false;
      if (!q) return true;
      const title = (c.title || c.name || "").toLowerCase();
      return (
        title.includes(q) ||
        String(c.id).includes(q) ||
        String(c.createdBy ?? "").includes(q)
      );
    });
  }, [rows, search, quickSearch, status, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (pageSafe - 1) * pageSize,
    pageSafe * pageSize
  );

  const upcomingNext = useMemo(
    () =>
      [...rows]
        .filter((c) => c.status === "UPCOMING")
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
        .slice(0, 4),
    [rows]
  );

  useEffect(() => {
    setPage(1);
  }, [search, quickSearch, status, typeFilter, pageSize]);

  const bannerGradients = [
    "from-[#4c1d95] via-[#7c3aed] to-[#09040D]",
    "from-[#1e1b4b] via-[#6d28d9] to-[#09040D]",
    "from-[#312e81] via-[#a855f7] to-[#09040D]",
  ];

  return (
    <div className="admin-comp-repo flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-8 pb-24">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-headline-lg mb-2 text-on-surface">
              Competition Repository
            </h2>
            <p className="font-body-md max-w-2xl text-on-surface-variant">
              Manage and orchestrate elite developer challenges. Monitor
              engagement and competitive integrity.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreate}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-label-md font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary-container"
          >
            <span className="material-symbols-outlined">add</span>
            Create Competition
          </button>
        </div>

        {/* Header tools mirror */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[200px] flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-1.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50"
              placeholder="Quick search..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {(
            [
              ["Total", kpis.total, "military_tech", "border-primary", null],
              ["Draft", "—", "edit_note", "border-outline", "No draft API"],
              ["Upcoming", kpis.upcoming, "event", "border-secondary", null],
              ["Live Now", kpis.live, "sensors", "border-error", "live"],
              [
                "Completed",
                kpis.completed,
                "check_circle",
                "border-primary-container",
                null,
              ],
              [
                "Participants",
                kpis.participants,
                "groups",
                "border-tertiary",
                null,
              ],
            ] as const
          ).map(([label, value, icon, border, extra]) => (
            <div
              key={label}
              className={`repo-glass rounded-xl border-l-4 p-5 transition-all hover:bg-surface-container ${border}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="material-symbols-outlined text-primary/70">
                  {icon}
                </span>
                {extra === "live" && kpis.live > 0 && (
                  <span className="mt-1 flex h-2 w-2 animate-pulse rounded-full bg-error" />
                )}
              </div>
              <h4 className="font-label-md text-[12px] uppercase tracking-wider text-on-surface-variant">
                {label}
              </h4>
              <div className="font-headline-lg text-[28px] text-on-surface">
                {loading ? "…" : value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="repo-glass flex flex-wrap items-center gap-4 rounded-xl p-4">
          <div className="relative min-w-[240px] flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full rounded-lg border-none bg-surface-container-lowest py-3 pl-12 pr-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Filter by name, ID, or creator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="cursor-pointer rounded-lg border-none bg-surface-container-high px-4 py-3 font-label-md text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="ALL">Status: All</option>
            <option value="ACTIVE">Live</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ENDED">Ended</option>
          </select>
          <select
            className="cursor-pointer rounded-lg border-none bg-surface-container-high px-4 py-3 font-label-md text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            title="contestType is not returned by current API — filter only applies if present"
          >
            <option value="ALL">Type: All</option>
            <option value="RATED">Rated</option>
            <option value="PRACTICE">Practice</option>
            <option value="UNRATED">Unrated</option>
          </select>
          <div className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded p-2 ${
                viewMode === "grid"
                  ? "bg-surface-container-highest text-primary"
                  : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded p-2 ${
                viewMode === "list"
                  ? "bg-surface-container-highest text-primary"
                  : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined">
                format_list_bulleted
              </span>
            </button>
          </div>
        </div>

        {/* Grid / list */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="repo-glass h-72 animate-pulse rounded-2xl"
              />
            ))}
          </div>
        ) : pageRows.length === 0 ? (
          <div className="repo-glass rounded-2xl p-12 text-center text-on-surface-variant">
            No competitions match your filters.
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3"
                : "space-y-4"
            }
          >
            {pageRows.map((c, idx) => (
              <div
                key={c.id}
                className="repo-glass group flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:border-primary/50"
              >
                <div
                  className={`relative h-32 bg-gradient-to-br ${
                    bannerGradients[idx % bannerGradients.length]
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                  <div className="absolute left-4 top-4 flex gap-2">
                    <span
                      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${statusBadge(
                        c.status
                      )}`}
                    >
                      {c.status === "ACTIVE" && (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error" />
                      )}
                      {statusLabel(c.status)}
                    </span>
                    {c.contestType ? (
                      <span className="rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                        {String(c.contestType)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-headline-lg text-[20px] text-on-surface transition-colors group-hover:text-primary">
                      {c.title || c.name || `Competition #${c.id}`}
                    </h3>
                  </div>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/50 bg-surface-container text-[10px] font-bold text-primary">
                      {(user?.name || "A")[0]}
                    </div>
                    <span className="text-[12px] text-on-surface-variant">
                      ID {c.id}
                      {c.createdBy != null && (
                        <>
                          {" "}
                          · creator{" "}
                          <span className="font-medium text-on-surface">
                            #{c.createdBy}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mb-6 grid grid-cols-2 gap-x-2 gap-y-4 text-[14px]">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">
                        calendar_today
                      </span>
                      <span>{formatWhen(c.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">
                        schedule
                      </span>
                      <span>{c.durationMinutes ?? "—"}m</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">
                        data_object
                      </span>
                      <span>
                        {c.problemCountResolved != null
                          ? `${c.problemCountResolved} Problems`
                          : "— Problems"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">
                        groups
                      </span>
                      <span>
                        {c.participantCountResolved != null
                          ? `${c.participantCountResolved} Joined`
                          : "— Joined"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-outline-variant/30 pt-6">
                    <span className="text-[11px] text-outline">
                      {c.difficulty || "—"}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        to={`/competitions/${c.id}`}
                        className="rounded-lg bg-surface-container-high p-2 text-on-surface-variant transition-all hover:bg-primary/20 hover:text-primary"
                        title="View"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          visibility
                        </span>
                      </Link>
                      <button
                        type="button"
                        disabled
                        title="No update competition API"
                        className="cursor-not-allowed rounded-lg bg-surface-container-high p-2 text-on-surface-variant/40"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          edit
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="repo-glass sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant p-4">
          <div className="flex items-center gap-3 text-sm text-on-surface-variant">
            <span>
              Showing{" "}
              {filtered.length === 0
                ? "0"
                : `${(pageSafe - 1) * pageSize + 1}-${Math.min(
                    pageSafe * pageSize,
                    filtered.length
                  )}`}{" "}
              of {filtered.length}
            </span>
            <select
              className="cursor-pointer border-none bg-transparent text-sm font-medium text-on-surface outline-none"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
            <span className="px-2 text-sm font-bold text-primary">
              {pageSafe} / {totalPages}
            </span>
            <button
              type="button"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <aside className="flex w-full flex-col gap-6 xl:w-80 xl:shrink-0">
        <div className="repo-glass space-y-4 rounded-2xl p-6">
          <h3 className="font-label-md flex items-center gap-2 font-bold text-primary">
            <span className="material-symbols-outlined text-[20px]">bolt</span>
            Quick Actions
          </h3>
          <button
            type="button"
            onClick={onCreate}
            className="group flex w-full items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/10"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-outline group-hover:text-primary">
                add
              </span>
              <span className="font-label-md">Create Competition</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-outline">
              chevron_right
            </span>
          </button>
          <button
            type="button"
            disabled
            title="No import API"
            className="flex w-full cursor-not-allowed items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container p-3 text-left opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-outline">
                upload_file
              </span>
              <span className="font-label-md">Import Contest</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-outline">
              chevron_right
            </span>
          </button>
        </div>

        <div className="repo-glass rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-label-md font-bold text-on-surface">
              Recent Drafts
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant">
            No draft competitions API — drafts are local to Competition Studio
            only.
          </p>
        </div>

        <div className="repo-glass rounded-2xl p-6">
          <h3 className="font-label-md mb-4 font-bold text-on-surface">
            Upcoming Next
          </h3>
          <div className="space-y-4">
            {upcomingNext.length === 0 ? (
              <p className="text-xs text-on-surface-variant">
                No upcoming competitions.
              </p>
            ) : (
              upcomingNext.map((c) => {
                const md = monthDay(c.startTime);
                return (
                  <Link
                    key={c.id}
                    to={`/competitions/${c.id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-outline-variant bg-surface-container-highest">
                      <span className="text-[10px] font-bold uppercase text-outline">
                        {md.mon}
                      </span>
                      <span className="text-[16px] font-bold leading-none text-on-surface">
                        {md.day}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h4 className="truncate text-[13px] font-medium text-on-surface">
                        {c.title || c.name || `#${c.id}`}
                      </h4>
                      <p className="text-[11px] text-outline">
                        {formatWhen(c.startTime)}
                        {c.participantCountResolved != null
                          ? ` · ${c.participantCountResolved} joined`
                          : ""}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
