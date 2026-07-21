export type ContestStatus = "UPCOMING" | "ACTIVE" | "ENDED";

export type ContestType =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "PRACTICE"
  | null;

export type ContestDifficulty = "EASY" | "MEDIUM" | "HARD" | "MIXED" | null;

export type ContestCardModel = {
  id: number;
  title: string;
  description: string;
  status: ContestStatus;
  startTime: string;
  endTime: string;
  durationMinutes: number | null;
  problemCount: number | null;
  participantCount: number | null;
  contestType: ContestType;
  difficulty: ContestDifficulty;
  isFeatured: boolean;
  createdAt: string | null;
};

export type ContestHistoryRow = {
  competitionId: number;
  title: string;
  rank: number | null;
  solved: number;
  score: number | null;
  date: string | null;
  ratingDelta: number | null;
};

export type ContestUserStats = {
  contestsPlayed: number;
  bestRank: number | null;
  recentRank: number | null;
  averageRank: number | null;
  currentRating: number | null;
  highestRating: number | null;
  winRate: number | null;
};

export type ContestDashboardStats = {
  total: number;
  active: number;
  upcoming: number;
  ended: number;
  totalParticipants: number | null;
};

export type ContestDashboardData = {
  contests: ContestCardModel[];
  featured: ContestCardModel | null;
  live: ContestCardModel[];
  upcoming: ContestCardModel[];
  past: ContestCardModel[];
  stats: ContestDashboardStats;
  history: ContestHistoryRow[];
  userStats: ContestUserStats;
};
