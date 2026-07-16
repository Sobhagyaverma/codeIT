import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserSubmissions } from "../lib/api";
import type { Submission } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { Loading, ErrorState, EmptyState } from "../components/Loading";

const VERDICT_COLOR: Record<string, string> = {
  Accepted: "var(--ok)",
  "Wrong Answer": "var(--err)",
  "Runtime Error": "var(--err)",
  "Time Limit Exceeded": "var(--warn)",
  "Compilation Error": "var(--err)",
};

export default function SubmissionHistory() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserSubmissions(user.id)
      .then(setSubs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="display mb-6 text-2xl font-semibold">Submission history</h1>

      {loading && <Loading label="Loading submissions" />}
      {error && <ErrorState message={error} />}
      {!loading && !error && subs.length === 0 && (
        <EmptyState message="No submissions yet. Solve a problem to see it here." />
      )}

      {!loading && subs.length > 0 && (
        <div className="divide-y divide-[var(--line)] rounded-lg border border-[var(--line)]">
          {subs.map((s, i) => (
            <Link
              key={s.id ?? i}
              to={`/problems/${s.problemId}`}
              className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-[var(--bg-raised)]"
            >
              <span className="text-[var(--text)]">Problem #{s.problemId}</span>
              <span className="mono text-xs text-[var(--text-dim)]">{s.language}</span>
              <span
                className="verdict-strip"
                style={{ color: VERDICT_COLOR[s.verdict || ""] || "var(--info)" }}
              >
                {s.verdict || "—"}
              </span>
              <span className="text-xs text-[var(--text-dim)]">
                {s.passedCount ?? "-"}/{s.totalCount ?? "-"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
