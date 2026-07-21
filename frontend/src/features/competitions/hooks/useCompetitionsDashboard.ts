import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  getAllCompetitions,
  getCompetitionParticipants,
  getCompetitionProblems,
  getMyContestHistory,
} from "../../../lib/api";
import { buildContestDashboard } from "../adapters";
import type { ContestDashboardData } from "../types";

const ENRICH_CONCURRENCY = 4;

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }

  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    () => run()
  );
  await Promise.all(runners);
  return results;
}

export function useCompetitionsDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<ContestDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const [competitions, history] = await Promise.all([
        getAllCompetitions(),
        user ? getMyContestHistory().catch(() => []) : Promise.resolve([]),
      ]);

      if (current !== requestId.current) return;

      const countsEntries = await mapPool(
        competitions,
        ENRICH_CONCURRENCY,
        async (competition) => {
          const [problems, participants] = await Promise.all([
            getCompetitionProblems(competition.id).catch(() => null),
            getCompetitionParticipants(competition.id).catch(() => null),
          ]);
          return [
            competition.id,
            {
              problemCount: problems?.length ?? null,
              participantCount: participants?.length ?? null,
            },
          ] as const;
        }
      );

      if (current !== requestId.current) return;

      const countsById = Object.fromEntries(countsEntries);
      setData(buildContestDashboard(competitions, countsById, history));
    } catch (err) {
      if (current !== requestId.current) return;
      setError(
        err instanceof Error ? err.message : "Failed to load competitions."
      );
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
    return () => {
      requestId.current += 1;
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
