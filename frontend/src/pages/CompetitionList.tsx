import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllCompetitions } from "../lib/api";
import type { Competition } from "../lib/types";
import { Loading, ErrorState, EmptyState } from "../components/Loading";

const STATUS_COLOR: Record<string, string> = {
  UPCOMING: "var(--info)",
  ACTIVE: "var(--ok)",
  ENDED: "var(--text-dim)",
};

export default function CompetitionList() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllCompetitions()
      .then(setCompetitions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="display mb-6 text-2xl font-semibold">Competitions</h1>

      {loading && <Loading label="Loading competitions" />}
      {error && <ErrorState message={error} />}
      {!loading && !error && competitions.length === 0 && (
        <EmptyState message="No competitions scheduled yet." />
      )}

      <div className="grid gap-3">
        {competitions.map((c) => (
          <Link
            key={c.id}
            to={`/competitions/${c.id}`}
            className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-3 transition hover:border-[var(--info)]"
          >
            <div>
              <div className="text-sm font-medium text-[var(--text)]">
                {c.title || c.name || `Competition #${c.id}`}
              </div>
              <div className="mt-1 text-xs text-[var(--text-dim)]">
                {new Date(c.startTime).toLocaleString()} → {new Date(c.endTime).toLocaleString()}
              </div>
            </div>
            <span
              className="verdict-strip rounded border px-2 py-0.5"
              style={{ color: STATUS_COLOR[c.status], borderColor: STATUS_COLOR[c.status] }}
            >
              {c.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
