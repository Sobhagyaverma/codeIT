export type ProfileTab = "overview" | "submissions" | "contests" | "saved";

export type DataSource = "real" | "demo" | "local";

export type ProfileIdentity = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  bio: string;
  location: string;
  avatarUrl: string;
  showEmail: boolean;
  joinedAt: string | null;
  joinedAtSource: DataSource;
};

export type DifficultyStats = {
  easy: number;
  medium: number;
  hard: number;
  totalAvailable: {
    easy: number;
    medium: number;
    hard: number;
  };
};

export type TopicProgress = {
  topic: string;
  solved: number;
  total: number;
};

export type LanguageUsage = {
  language: string;
  count: number;
  percent: number;
};

export type ActivityDay = {
  date: string; // YYYY-MM-DD
  count: number;
};

export type WeeklyBucket = {
  label: string;
  count: number;
};

export type ProfileSubmissionRow = {
  id: number;
  problemId: number;
  problemTitle: string;
  difficulty?: string;
  verdict: string;
  language: string;
  runtime: number | null;
  memory: number | null;
  submittedAt: string | null;
  source: DataSource;
};

export type ContestHistoryRow = {
  competitionId: number;
  title: string;
  rank: number | null;
  solved: number;
  score: number | null;
  date: string | null;
  ratingDelta: number | null;
  source: DataSource;
};

export type ProblemSummary = {
  id: number;
  title: string;
  difficulty: string;
  topics: string[];
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  source: DataSource;
};

export type PersonalBests = {
  fastestAccepted: {
    problemTitle: string;
    runtime: number;
    language: string;
  } | null;
  hardestSolved: {
    problemTitle: string;
    difficulty: string;
  } | null;
};

export type ProfileStats = {
  totalSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
  totalRuntimeSeconds: number;
  difficulty: DifficultyStats;
  currentStreak: number;
  longestStreak: number;
  streaksSource: DataSource;
  contestBestRank: number | null;
  contestBestRankSource: DataSource;
  rating: number | null;
  ratingSource: DataSource;
};

export type ProfileViewModel = {
  identity: ProfileIdentity;
  stats: ProfileStats;
  topics: TopicProgress[];
  languages: LanguageUsage[];
  heatmap: ActivityDay[];
  weeklyActivity: WeeklyBucket[];
  monthlyActivity: WeeklyBucket[];
  recentSubmissions: ProfileSubmissionRow[];
  recentSolved: ProblemSummary[];
  contestHistory: ContestHistoryRow[];
  bookmarked: ProblemSummary[];
  recentlyViewed: ProblemSummary[];
  achievements: Achievement[];
  personalBests: PersonalBests;
  activeContest: {
    id: number;
    title: string;
    status: string;
  } | null;
  continueProblem: ProblemSummary | null;
  demoSections: string[];
  isOwner: boolean;
};
