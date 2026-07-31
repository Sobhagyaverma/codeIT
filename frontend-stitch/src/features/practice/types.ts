export type PracticeProblemStatus = "SOLVED" | "ATTEMPTED" | "NOT_STARTED";

export type PracticeProblem = {
  id: number;
  title: string;
  difficulty: string;
  topics: string[];
  status: PracticeProblemStatus;
  bookmarked: boolean;
  lastAttemptAt: string | null;
  lastSolvedAt: string | null;
  acceptanceRate: number | null;
  solvedCount: number | null;
  submissionCount: number | null;
  createdAt: string | null;
  companyTags: string[] | null;
  isPremium: boolean | null;
  markedForRevision: boolean;
  notesAvailable: false;
};

export type DifficultyCounts = {
  easy: number;
  medium: number;
  hard: number;
};

export type PracticeStats = {
  total: number;
  solved: number;
  attempted: number;
  notStarted: number;
  acceptanceRate: number;
  difficulty: {
    solved: DifficultyCounts;
    totals: DifficultyCounts;
  };
};

export type RoadmapModuleDef = {
  id: string;
  title: string;
  description: string;
  topicAliases: string[];
};

export type DifficultyProgress = {
  easy: { solved: number; total: number };
  medium: { solved: number; total: number };
  hard: { solved: number; total: number };
};

export type PracticeModule = {
  id: string;
  title: string;
  description: string;
  problems: PracticeProblem[];
  solved: number;
  total: number;
  percent: number;
  difficulty: DifficultyProgress;
};

export type PracticeHeatmapDay = {
  date: string;
  count: number;
};

export type WeeklyGoal = {
  target: number;
  completed: number;
};

export type PracticeCatalogData = {
  problems: PracticeProblem[];
  stats: PracticeStats;
  bookmarks: Set<number>;
  modules: PracticeModule[];
  streak: number;
  heatmap: PracticeHeatmapDay[];
  continueProblem: PracticeProblem | null;
  recentSolved: PracticeProblem[];
  weeklyGoal: WeeklyGoal;
};
