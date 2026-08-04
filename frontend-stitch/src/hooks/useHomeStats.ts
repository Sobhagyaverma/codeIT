import { useEffect, useState } from "react";
import { getAllCompetitions, getProblems } from "../lib/api";
import { LEARN_SECTIONS } from "../features/learn/content/sections";

export type HomeStats = {
  problemCount: number;
  lessonCount: number;
  activeContestCount: number;
  /** No public online-users API yet — design fallback used for banner. */
  usersOnline: number;
  /** No solved-today API yet — design fallback used for banner. */
  problemsSolvedToday: number;
};

const FALLBACK: HomeStats = {
  problemCount: 1000,
  lessonCount: 120,
  activeContestCount: 12,
  usersOnline: 1432,
  problemsSolvedToday: 85420,
};

function countLessons() {
  return Object.values(LEARN_SECTIONS).reduce(
    (n, section) => n + (section.lessons?.length ?? 0),
    0
  );
}

/** Loads live platform counts for the landing page; falls back to design targets. */
export function useHomeStats(): HomeStats {
  const [stats, setStats] = useState<HomeStats>({
    ...FALLBACK,
    lessonCount: Math.max(countLessons(), FALLBACK.lessonCount),
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [problems, competitions] = await Promise.all([
          getProblems().catch(() => null),
          getAllCompetitions().catch(() => null),
        ]);
        if (cancelled) return;

        const lessonCount = countLessons();
        const problemCount = problems?.length ?? FALLBACK.problemCount;
        const activeContestCount =
          competitions?.filter((c) => c.status === "ACTIVE").length ??
          FALLBACK.activeContestCount;

        setStats({
          problemCount: problemCount > 0 ? problemCount : FALLBACK.problemCount,
          lessonCount:
            lessonCount > 0 ? Math.max(lessonCount, 1) : FALLBACK.lessonCount,
          activeContestCount:
            activeContestCount > 0
              ? activeContestCount
              : FALLBACK.activeContestCount,
          usersOnline: FALLBACK.usersOnline,
          problemsSolvedToday: FALLBACK.problemsSolvedToday,
        });
      } catch {
        /* keep fallbacks */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}
