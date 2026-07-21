import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyProfileSubmissions } from "../../../lib/api";
import type { ProfileSubmissionRow } from "../types";
import {
  formatRelative,
  formatRuntime,
  verdictColor,
} from "../format";
import { ExpandToggle, useExpandableList } from "./ExpandableList";

export default function SubmissionsTab({
  initialRows,
  isOwner,
  title = "Submissions",
  paginate = false,
}: {
  initialRows: ProfileSubmissionRow[];
  isOwner: boolean;
  title?: string;
  /** When true (owner submissions tab), load from paginated API */
  paginate?: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const collapsedList = useExpandableList(rows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    if (!paginate || !isOwner) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await getMyProfileSubmissions(20);
        if (cancelled) return;
        setRows(page.items);
        setNextCursor(page.nextCursor);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load submissions."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [paginate, isOwner]);

  const loadMore = async () => {
    if (!isOwner || nextCursor == null || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await getMyProfileSubmissions(20, nextCursor);
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...page.items.filter((r) => !seen.has(r.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more submissions."
      );
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading && !rows.length) {
    return (
      <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
        <h2 className="mb-2 text-sm font-semibold">{title}</h2>
        <p className="text-sm text-[var(--text-dim)]">Loading submissions…</p>
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-raised)] p-4">
        <h2 className="mb-2 text-sm font-semibold">{title}</h2>
        <p className="text-sm text-[var(--text-dim)]">
          Submit a solution to see activity here.
        </p>
      </section>
    );
  }

  const visibleRows = paginate ? rows : collapsedList.visible;

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <div className="space-y-2">
        {visibleRows.map((row) => (
          <Link
            key={row.id}
            to={`/problems/${row.problemId}`}
            className="block rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2.5 transition hover:border-[var(--info)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {row.problemTitle}
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-dim)]">
                  {row.language} · {formatRuntime(row.runtime)} ·{" "}
                  {formatRelative(row.submittedAt)}
                </div>
              </div>
              <span
                className="verdict-strip rounded px-2 py-1"
                style={{
                  color: verdictColor(row.verdict),
                  background: `color-mix(in srgb, ${verdictColor(row.verdict)} 14%, transparent)`,
                }}
              >
                {row.verdict}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-[var(--err)]">{error}</p>}

      {!paginate && collapsedList.canToggle && (
        <ExpandToggle
          expanded={collapsedList.expanded}
          hiddenCount={collapsedList.hiddenCount}
          onToggle={collapsedList.toggle}
        />
      )}

      {paginate && isOwner && nextCursor != null && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-4 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] transition hover:border-[var(--info)] hover:text-[var(--text)] disabled:opacity-40"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </section>
  );
}
