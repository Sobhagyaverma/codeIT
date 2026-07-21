import type {
  Achievement,
  ActivityDay,
  ContestHistoryRow,
  ProfileSubmissionRow,
  WeeklyBucket,
} from "./types";

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Deterministic demo analytics keyed by username so the UI stays stable. */
export function buildDemoAnalytics(username: string) {
  const rand = mulberry32(hashSeed(username || "codeit"));
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const heatmap: ActivityDay[] = [];
  for (let i = 364; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const roll = rand();
    const count =
      roll > 0.72 ? Math.floor(rand() * 6) + 1 : roll > 0.55 ? 1 : 0;
    heatmap.push({ date: formatDay(day), count });
  }

  const weeklyActivity: WeeklyBucket[] = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(today);
    start.setDate(today.getDate() - (7 - i) * 7);
    return {
      label: start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      count: Math.floor(rand() * 18) + 2,
    };
  });

  const monthlyActivity: WeeklyBucket[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleDateString(undefined, { month: "short" }),
      count: Math.floor(rand() * 55) + 8,
    };
  });

  const currentStreak = Math.floor(rand() * 8) + 2;
  const longestStreak = Math.max(currentStreak, Math.floor(rand() * 20) + 5);

  const achievements: Achievement[] = [
    {
      id: "first-ac",
      title: "First Blood",
      description: "Earn your first Accepted verdict.",
      earned: true,
      source: "demo",
    },
    {
      id: "streak-7",
      title: "Week Warrior",
      description: "Maintain a 7-day coding streak.",
      earned: currentStreak >= 7,
      source: "demo",
    },
    {
      id: "hard-solver",
      title: "Hard Mode",
      description: "Solve a Hard problem.",
      earned: rand() > 0.4,
      source: "demo",
    },
    {
      id: "contest-debut",
      title: "Contest Debut",
      description: "Finish your first contest.",
      earned: true,
      source: "demo",
    },
    {
      id: "polyglot",
      title: "Polyglot",
      description: "Submit in 3+ languages.",
      earned: rand() > 0.5,
      source: "demo",
    },
  ];

  return {
    heatmap,
    weeklyActivity,
    monthlyActivity,
    currentStreak,
    longestStreak,
    achievements,
    rating: 1200 + Math.floor(rand() * 450),
    joinedAt: new Date(
      today.getFullYear() - 1,
      Math.floor(rand() * 11),
      Math.floor(rand() * 27) + 1
    ).toISOString(),
  };
}

export function buildDemoContestHistory(
  username: string
): ContestHistoryRow[] {
  const rand = mulberry32(hashSeed(`${username}-contests`));
  const titles = [
    "Weekly Sprint #12",
    "Arrays Arena",
    "Midnight Mashup",
    "DP Derby",
  ];
  return titles.map((title, i) => {
    const daysAgo = 10 + i * 17;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      competitionId: -(i + 1),
      title,
      rank: Math.floor(rand() * 40) + 1,
      solved: Math.floor(rand() * 4) + 1,
      score: Number((rand() * 8 + 1).toFixed(2)),
      date: date.toISOString(),
      ratingDelta: Math.floor(rand() * 80) - 20,
      source: "demo" as const,
    };
  });
}

export function stampDemoSubmissionTimes(
  rows: ProfileSubmissionRow[],
  username: string
): ProfileSubmissionRow[] {
  const rand = mulberry32(hashSeed(`${username}-subs`));
  return rows.map((row, index) => {
    if (row.submittedAt) return row;
    const d = new Date();
    d.setHours(d.getHours() - index * 5 - Math.floor(rand() * 8));
    return {
      ...row,
      submittedAt: d.toISOString(),
      source: row.source === "real" ? "demo" : row.source,
    };
  });
}
