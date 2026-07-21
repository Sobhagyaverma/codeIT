import type {
  Competition,
  LeaderboardEntry,
  ProblemPublicDTO,
  Submission,
  User,
} from "../../lib/types";
import {
  buildDemoAnalytics,
  buildDemoContestHistory,
  stampDemoSubmissionTimes,
} from "./demoFixtures";
import {
  loadBookmarks,
  loadProfileMeta,
  loadRecentViews,
  summarizeProblems,
} from "./localProfileStorage";
import type {
  LanguageUsage,
  ProblemSummary,
  ProfileSubmissionRow,
  ProfileViewModel,
  TopicProgress,
} from "./types";

function parseTopics(topics: ProblemPublicDTO["topics"] | unknown): string[] {
  if (Array.isArray(topics)) return topics.map(String);
  if (typeof topics === "string") {
    try {
      const parsed = JSON.parse(topics) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* plain */
    }
    return topics
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeDifficulty(raw?: string): "easy" | "medium" | "hard" | "other" {
  const d = (raw || "").toUpperCase();
  if (d.includes("EASY")) return "easy";
  if (d.includes("MEDIUM")) return "medium";
  if (d.includes("HARD")) return "hard";
  return "other";
}

function isAccepted(verdict?: string) {
  return (verdict || "").trim().toLowerCase() === "accepted";
}

function toProblemSummary(p: ProblemPublicDTO): ProblemSummary {
  return {
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    topics: parseTopics(p.topics),
  };
}

function runtimeOf(s: Submission): number | null {
  const value = s.executionTime;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

export type BuildProfileInput = {
  user: User;
  isOwner: boolean;
  submissions: Submission[];
  problems: ProblemPublicDTO[];
  competitions: Competition[];
  leaderboards: Record<number, LeaderboardEntry[]>;
};

export function buildProfileViewModel(input: BuildProfileInput): ProfileViewModel {
  const { user, isOwner, submissions, problems, competitions, leaderboards } =
    input;
  const meta = loadProfileMeta(user.id);
  const demo = buildDemoAnalytics(user.uniqueUserId);
  const catalog = new Map(problems.map((p) => [p.id, toProblemSummary(p)]));

  const available = { easy: 0, medium: 0, hard: 0 };
  for (const p of problems) {
    const d = normalizeDifficulty(p.difficulty);
    if (d !== "other") available[d] += 1;
  }

  const acceptedByProblem = new Map<number, Submission>();
  const topicSolved = new Map<string, Set<number>>();
  const topicTotal = new Map<string, Set<number>>();
  const languageCounts = new Map<string, number>();

  for (const p of problems) {
    for (const topic of parseTopics(p.topics)) {
      if (!topicTotal.has(topic)) topicTotal.set(topic, new Set());
      topicTotal.get(topic)!.add(p.id);
    }
  }

  let acceptedCount = 0;
  let totalRuntime = 0;

  for (const s of submissions) {
    const lang = (s.language || "unknown").toLowerCase();
    languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);

    const rt = runtimeOf(s);
    if (rt != null) totalRuntime += rt;

    if (!isAccepted(s.verdict)) continue;
    acceptedCount += 1;

    const prev = acceptedByProblem.get(s.problemId);
    if (!prev) {
      acceptedByProblem.set(s.problemId, s);
    } else {
      const prevRt = runtimeOf(prev);
      if (rt != null && (prevRt == null || rt < prevRt)) {
        acceptedByProblem.set(s.problemId, s);
      }
    }
  }

  const solvedEasy = [...acceptedByProblem.keys()].filter(
    (id) => normalizeDifficulty(catalog.get(id)?.difficulty) === "easy"
  ).length;
  const solvedMedium = [...acceptedByProblem.keys()].filter(
    (id) => normalizeDifficulty(catalog.get(id)?.difficulty) === "medium"
  ).length;
  const solvedHard = [...acceptedByProblem.keys()].filter(
    (id) => normalizeDifficulty(catalog.get(id)?.difficulty) === "hard"
  ).length;

  for (const problemId of acceptedByProblem.keys()) {
    const summary = catalog.get(problemId);
    if (!summary) continue;
    for (const topic of summary.topics) {
      if (!topicSolved.has(topic)) topicSolved.set(topic, new Set());
      topicSolved.get(topic)!.add(problemId);
    }
  }

  const topics: TopicProgress[] = [...topicTotal.entries()]
    .map(([topic, ids]) => ({
      topic,
      solved: topicSolved.get(topic)?.size || 0,
      total: ids.size,
    }))
    .sort((a, b) => b.solved - a.solved || a.topic.localeCompare(b.topic))
    .slice(0, 12);

  const totalLang = submissions.length || 1;
  const languages: LanguageUsage[] = [...languageCounts.entries()]
    .map(([language, count]) => ({
      language,
      count,
      percent: Math.round((count / totalLang) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const recentSubmissions: ProfileSubmissionRow[] = submissions
    .slice(0, 20)
    .map((s, index) => ({
      id: s.id ?? index,
      problemId: s.problemId,
      problemTitle: catalog.get(s.problemId)?.title || `Problem #${s.problemId}`,
      difficulty: catalog.get(s.problemId)?.difficulty,
      verdict: s.verdict || "Unknown",
      language: s.language || "—",
      runtime: runtimeOf(s),
      memory: typeof s.memoryUsed === "number" ? s.memoryUsed : null,
      submittedAt: s.createdAt || null,
      source: s.createdAt ? ("real" as const) : ("demo" as const),
    }));

  const stampedSubs = stampDemoSubmissionTimes(
    recentSubmissions,
    user.uniqueUserId
  );

  const recentSolved = [...acceptedByProblem.keys()]
    .map((id) => catalog.get(id))
    .filter((p): p is ProblemSummary => Boolean(p))
    .slice(0, 8);

  const realContestRows = competitions
    .map((c) => {
      const board = leaderboards[c.id] || [];
      const entry = board.find((e) => e.userId === user.id);
      if (!entry) return null;
      return {
        competitionId: c.id,
        title: c.title || c.name || `Contest #${c.id}`,
        rank: entry.rank,
        solved: entry.solved,
        score: entry.totalTime,
        date: c.endTime || c.startTime || null,
        ratingDelta: null,
        source: "real" as const,
      };
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .sort((a, b) => {
      const at = a.date ? Date.parse(a.date) : 0;
      const bt = b.date ? Date.parse(b.date) : 0;
      return bt - at;
    });

  const contestHistory =
    realContestRows.length > 0
      ? realContestRows
      : buildDemoContestHistory(user.uniqueUserId);

  const bestRank = contestHistory
    .map((c) => c.rank)
    .filter((r): r is number => typeof r === "number")
    .sort((a, b) => a - b)[0];

  const bookmarkedIds = loadBookmarks(user.id);
  const recentViewIds = loadRecentViews(user.id).map((e) => e.problemId);

  let fastest: ProfileViewModel["personalBests"]["fastestAccepted"] = null;
  for (const s of acceptedByProblem.values()) {
    const rt = runtimeOf(s);
    if (rt == null) continue;
    const title = catalog.get(s.problemId)?.title || `Problem #${s.problemId}`;
    if (!fastest || rt < fastest.runtime) {
      fastest = {
        problemTitle: title,
        runtime: rt,
        language: s.language || "—",
      };
    }
  }

  const hardestOrder = { hard: 3, medium: 2, easy: 1, other: 0 };
  let hardest: ProfileViewModel["personalBests"]["hardestSolved"] = null;
  let hardestScore = -1;
  for (const id of acceptedByProblem.keys()) {
    const summary = catalog.get(id);
    if (!summary) continue;
    const score = hardestOrder[normalizeDifficulty(summary.difficulty)];
    if (score > hardestScore) {
      hardestScore = score;
      hardest = {
        problemTitle: summary.title,
        difficulty: summary.difficulty,
      };
    }
  }

  const activeContest =
    competitions.find((c) => c.status === "ACTIVE") || null;

  const continueProblem =
    summarizeProblems(recentViewIds, catalog)[0] ||
    recentSolved[0] ||
    (problems[0] ? toProblemSummary(problems[0]) : null);

  const demoSections = [
    "Activity heatmap",
    "Streaks",
    "Weekly / monthly charts",
    "Contest rating",
    "Achievements",
  ];
  if (realContestRows.length === 0) demoSections.push("Contest history");
  if (recentSubmissions.some((s) => !s.submittedAt)) {
    demoSections.push("Submission timestamps");
  }

  return {
    identity: {
      id: user.id,
      name: user.name,
      username: user.uniqueUserId,
      email: user.email,
      role: user.role,
      bio: meta.bio,
      location: meta.location,
      avatarUrl: meta.avatarUrl,
      showEmail: meta.showEmail,
      joinedAt: demo.joinedAt,
      joinedAtSource: "demo",
    },
    stats: {
      totalSolved: acceptedByProblem.size,
      totalSubmissions: submissions.length,
      acceptanceRate:
        submissions.length === 0
          ? 0
          : Math.round((acceptedCount / submissions.length) * 1000) / 10,
      totalRuntimeSeconds: Number(totalRuntime.toFixed(3)),
      difficulty: {
        easy: solvedEasy,
        medium: solvedMedium,
        hard: solvedHard,
        totalAvailable: available,
      },
      currentStreak: demo.currentStreak,
      longestStreak: demo.longestStreak,
      streaksSource: "demo",
      contestBestRank: bestRank ?? null,
      contestBestRankSource: realContestRows.length ? "real" : "demo",
      rating: demo.rating,
      ratingSource: "demo",
    },
    topics,
    languages,
    heatmap: demo.heatmap,
    weeklyActivity: demo.weeklyActivity,
    monthlyActivity: demo.monthlyActivity,
    recentSubmissions: stampedSubs,
    recentSolved,
    contestHistory,
    bookmarked: summarizeProblems(bookmarkedIds, catalog),
    recentlyViewed: summarizeProblems(recentViewIds, catalog),
    achievements: demo.achievements,
    personalBests: {
      fastestAccepted: fastest,
      hardestSolved: hardest,
    },
    activeContest: activeContest
      ? {
          id: activeContest.id,
          title:
            activeContest.title ||
            activeContest.name ||
            `Contest #${activeContest.id}`,
          status: activeContest.status,
        }
      : null,
    continueProblem,
    demoSections,
    isOwner,
  };
}
