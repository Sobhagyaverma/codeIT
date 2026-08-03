import { getAuthToken, type ProblemPublicDTO, type Submission, type User } from "./authStorage";

/** Empty = same-origin Vite proxy → Spring Boot */
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Is the backend running on port 9091?",
      0
    );
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (isJson && body && (body.message || body.error)) ||
      (typeof body === "string" && body) ||
      `Request failed (${res.status})`;
    throw new ApiError(
      typeof message === "string" ? message : `Request failed (${res.status})`,
      res.status
    );
  }

  return body as T;
}

export type LoginResponse = {
  token: string;
  userId: number;
  name: string;
  uniqueUserId: string;
  email: string;
  role: "USER" | "ADMIN";
  expiresIn: number;
};

export const login = (loginId: string, password: string) =>
  request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: loginId, password }),
  });

export const register = (data: {
  name: string;
  uniqueUserId: string;
  email: string;
  password: string;
}) =>
  request<string>("/api/user/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getProblems = () => request<ProblemPublicDTO[]>("/api/problems");

export const getProblem = (id: number) =>
  request<ProblemPublicDTO>(`/api/problems/${id}`);

export type LanguageDTO = {
  slug: string;
  name: string;
  languageId: number;
};

export type RunRequest = {
  source_code: string;
  language_id: number;
  stdin?: string;
};

export type RunResult = {
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  status?: { id: number; description: string };
  time?: string | number;
  memory?: number;
};

export type SubmitRequest = {
  userId: number;
  problemId: number;
  languageId: number;
  language: string;
  code: string;
};

export type JudgeVerdictDTO = {
  submissionId?: number;
  verdict: string;
  passed?: boolean;
  failedTestIndex?: number | null;
  passedCount?: number;
  totalCount?: number;
  time?: number;
  memory?: number;
  engine?: string;
};

export const getLanguages = () =>
  request<LanguageDTO[]>("/api/submissions/languages");

export const runCode = (data: RunRequest) =>
  request<RunResult>("/api/submissions/run", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const submitCode = (data: SubmitRequest) =>
  request<JudgeVerdictDTO>("/api/submissions/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getUserSubmissions = (userId: number) =>
  request<Submission[]>(`/api/submissions/user/${userId}`);

/* ---------------- Profile ---------------- */

export type ProfileProblemSummary = {
  id: number;
  title: string;
  difficulty: string;
  topics: string[];
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
};

export type ProfileContestHistory = {
  competitionId: number;
  title: string;
  rank: number | null;
  solved: number;
  score: number | null;
  date: string | null;
  ratingDelta: number | null;
};

export type ProfileResponse = {
  identity: {
    id: number;
    name: string;
    username: string;
    email: string | null;
    role: "USER" | "ADMIN";
    bio: string | null;
    location: string | null;
    avatarUrl: string | null;
    showEmail: boolean;
    joinedAt: string | null;
  };
  stats: {
    totalSolved: number;
    totalSubmissions: number;
    acceptanceRate: number;
    totalRuntimeSeconds: number;
    difficulty: {
      easy: number;
      medium: number;
      hard: number;
      totalAvailable: {
        easy: number;
        medium: number;
        hard: number;
      };
    };
    currentStreak: number;
    longestStreak: number;
    contestBestRank: number | null;
    rating: number | null;
  };
  topics: Array<{ topic: string; solved: number; total: number }>;
  languages: Array<{ language: string; count: number; percent: number }>;
  heatmap: Array<{ date: string; count: number }>;
  weeklyActivity: Array<{ label: string; count: number }>;
  monthlyActivity: Array<{ label: string; count: number }>;
  recentSubmissions: ProfileSubmissionRow[];
  recentSolved: ProfileProblemSummary[];
  contestHistory: ProfileContestHistory[];
  bookmarked: ProfileProblemSummary[];
  recentlyViewed: ProfileProblemSummary[];
  achievements: unknown[];
  personalBests: {
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
  activeContest: {
    id: number;
    title: string;
    status: string;
  } | null;
  continueProblem: ProfileProblemSummary | null;
};

export type ProfileSubmissionsPage = {
  items: ProfileSubmissionRow[];
  nextCursor: number | null;
};

export const getMyProfile = () => request<ProfileResponse>("/api/profile/me");

export const getPublicProfile = (username: string) =>
  request<ProfileResponse>(`/api/profile/${encodeURIComponent(username)}`);

export const updateMyProfile = (data: {
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  showEmail: boolean;
}) =>
  request<User>("/api/profile/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const changeMyPassword = (data: {
  currentPassword: string;
  newPassword: string;
}) =>
  request<string>("/api/profile/me/password", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getMyProfileSubmissions = (limit = 20, cursor?: number) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor !== undefined) params.set("cursor", String(cursor));
  return request<ProfileSubmissionsPage>(
    `/api/profile/me/submissions?${params}`
  );
};

export const getMyContestHistory = () =>
  request<
    Array<{
      competitionId: number;
      title: string;
      rank: number | null;
      solved: number;
      score: number | null;
      date: string | null;
      ratingDelta: number | null;
    }>
  >("/api/profile/me/contests");

export const createProblem = (data: Record<string, unknown>) =>
  request<ProblemPublicDTO>("/api/problems", {
    method: "POST",
    body: JSON.stringify(data),
  });

/* ---------------- Competitions ---------------- */

export type Competition = {
  id: number;
  title?: string;
  name?: string;
  description?: string;
  createdBy?: number;
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  durationMinutes?: number;
  contestType?: string;
  difficulty?: string;
  isFeatured?: boolean;
  problemCount?: number;
  participantCount?: number;
  [key: string]: unknown;
};

export type ContestSession = {
  competitionId?: number;
  userId?: number;
  sessionStatus: "JOINED" | "IN_PROGRESS" | "ENDED";
  startedAt?: string | null;
  deadlineAt?: string | null;
  serverTime?: string | null;
  remainingSeconds?: number | null;
  [key: string]: unknown;
};

export type LeaderboardEntry = {
  userId: number;
  userName: string;
  solved: number;
  totalTime: number;
  rank: number;
};

export const getAllCompetitions = () =>
  request<Competition[]>("/api/competitions/getAllCompetitions");

export const createCompetition = (data: Record<string, unknown>) =>
  request<Competition>("/api/competitions/create", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const addProblemsToCompetition = (id: number, problemIds: number[]) =>
  request<string>(`/api/competitions/addProblemsTo/${id}/problems`, {
    method: "POST",
    body: JSON.stringify({ problemIds }),
  });

export const getCompetition = (id: number) =>
  request<Competition>(`/api/competitions/get/${id}`);

export const getCompetitionProblems = (id: number) =>
  request<number[]>(`/api/competitions/getProblemsOf/${id}/problems`);

export const getCompetitionParticipants = (id: number) =>
  request<number[]>(`/api/competitions/${id}/participants`);

export const joinCompetition = (id: number, userId: number) =>
  request<void>(`/api/competitions/${id}/join?userId=${userId}`, {
    method: "POST",
  });

export const startCompetition = (id: number, userId: number) =>
  request<ContestSession>(`/api/competitions/${id}/start?userId=${userId}`, {
    method: "POST",
  });

export const endCompetition = (id: number) =>
  request<ContestSession>(`/api/competitions/${id}/end`, { method: "POST" });

export const getCompetitionSession = (id: number, userId: number) =>
  request<ContestSession>(
    `/api/competitions/${id}/session?userId=${userId}`
  );

export const submitToCompetition = (id: number, data: SubmitRequest) =>
  request<JudgeVerdictDTO>(`/api/competitions/${id}/submit`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getLeaderboard = (id: number) =>
  request<LeaderboardEntry[]>(`/api/competitions/${id}/leaderboard`);

export type { User, ProblemPublicDTO, Submission };
