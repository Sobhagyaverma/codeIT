import type { ProblemPublicDTO, Submission } from "../../lib/authStorage";
import { isRoadmapExcludedTopic } from "../learn/content/sections";
import { OTHER_MODULE_ID, PRACTICE_ROADMAP } from "./config/roadmap";
import type {
  DifficultyCounts,
  DifficultyProgress,
  PracticeCatalogData,
  PracticeModule,
  PracticeProblem,
  PracticeProblemStatus,
} from "./types";
import { normalizeTopic, parseTopics } from "./utils";

const EMPTY_COUNTS = (): DifficultyCounts => ({ easy: 0, medium: 0, hard: 0 });

function isAccepted(submission: Submission): boolean {
  const raw = (submission.verdict || "").trim().toUpperCase();
  return raw === "ACCEPTED" || raw.startsWith("ACCEPTED");
}

function latestDate(
  submissions: Submission[],
  predicate: (submission: Submission) => boolean = () => true
): string | null {
  let latest: string | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;

  for (const submission of submissions) {
    if (!predicate(submission) || !submission.createdAt) continue;
    const time = Date.parse(submission.createdAt);
    if (Number.isFinite(time) && time > latestTime) {
      latest = submission.createdAt;
      latestTime = time;
    }
  }

  return latest;
}

function statusFor(submissions: Submission[]): PracticeProblemStatus {
  if (submissions.some(isAccepted)) return "SOLVED";
  return submissions.length > 0 ? "ATTEMPTED" : "NOT_STARTED";
}

function difficultyKey(
  difficulty: string
): keyof DifficultyCounts | undefined {
  const key = difficulty.trim().toLowerCase();
  return key === "easy" || key === "medium" || key === "hard"
    ? key
    : undefined;
}

function emptyDifficultyProgress(): DifficultyProgress {
  return {
    easy: { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard: { solved: 0, total: 0 },
  };
}

function buildModule(
  definition: (typeof PRACTICE_ROADMAP)[number],
  problems: PracticeProblem[]
): PracticeModule {
  const solved = problems.filter((problem) => problem.status === "SOLVED").length;
  const difficulty = emptyDifficultyProgress();

  for (const problem of problems) {
    const key = difficultyKey(problem.difficulty);
    if (!key) continue;
    difficulty[key].total += 1;
    if (problem.status === "SOLVED") difficulty[key].solved += 1;
  }

  return {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    problems,
    solved,
    total: problems.length,
    percent: problems.length ? Math.round((solved / problems.length) * 100) : 0,
    difficulty,
  };
}

function moduleIdFor(topics: string[]): string {
  const normalizedTopics = new Set(topics.map(normalizeTopic));

  for (const module of PRACTICE_ROADMAP) {
    if (module.id === OTHER_MODULE_ID) continue;
    if (
      module.topicAliases.some((alias) =>
        normalizedTopics.has(normalizeTopic(alias))
      )
    ) {
      return module.id;
    }
  }

  return OTHER_MODULE_ID;
}

/** Build practice catalog from problems + submissions (no profile/bookmarks required). */
export function buildPracticeCatalog(
  problems: ProblemPublicDTO[],
  submissions: Submission[],
  bookmarkedIds: number[] = []
): PracticeCatalogData {
  const bookmarkSet = new Set(bookmarkedIds);
  const submissionsByProblem = new Map<number, Submission[]>();

  for (const submission of submissions) {
    const existing = submissionsByProblem.get(submission.problemId) ?? [];
    existing.push(submission);
    submissionsByProblem.set(submission.problemId, existing);
  }

  const practiceProblems: PracticeProblem[] = problems.map((problem) => {
    const problemSubmissions = submissionsByProblem.get(problem.id) ?? [];

    return {
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      topics: parseTopics(problem.topics),
      status: statusFor(problemSubmissions),
      bookmarked: bookmarkSet.has(problem.id),
      lastAttemptAt: latestDate(problemSubmissions),
      lastSolvedAt: latestDate(problemSubmissions, isAccepted),
      acceptanceRate: null,
      solvedCount: null,
      submissionCount: null,
      createdAt: null,
      companyTags: null,
      isPremium: null,
      markedForRevision: false,
      notesAvailable: false,
    };
  });

  const problemsByModule = new Map<string, PracticeProblem[]>(
    PRACTICE_ROADMAP.map((module) => [module.id, []])
  );
  for (const problem of practiceProblems) {
    if (problem.topics.some((topic) => isRoadmapExcludedTopic(topic))) {
      continue;
    }
    problemsByModule.get(moduleIdFor(problem.topics))!.push(problem);
  }

  problemsByModule.get("proving-grounds")?.sort((a, b) => a.id - b.id);

  const solved = practiceProblems.filter(
    (problem) => problem.status === "SOLVED"
  ).length;
  const attempted = practiceProblems.filter(
    (problem) => problem.status === "ATTEMPTED"
  ).length;
  const difficulty = {
    solved: EMPTY_COUNTS(),
    totals: EMPTY_COUNTS(),
  };

  for (const problem of practiceProblems) {
    const key = difficultyKey(problem.difficulty);
    if (!key) continue;
    difficulty.totals[key] += 1;
    if (problem.status === "SOLVED") difficulty.solved[key] += 1;
  }

  const modules = PRACTICE_ROADMAP.map((definition) =>
    buildModule(definition, problemsByModule.get(definition.id) ?? [])
  ).filter((m) => m.total > 0 || m.id === "proving-grounds");

  return {
    problems: practiceProblems,
    stats: {
      total: practiceProblems.length,
      solved,
      attempted,
      notStarted: practiceProblems.length - solved - attempted,
      acceptanceRate: 0,
      difficulty,
    },
    bookmarks: bookmarkSet,
    modules,
    streak: 0,
    heatmap: [],
    continueProblem: null,
    recentSolved: [],
    weeklyGoal: { target: 5, completed: 0 },
  };
}
