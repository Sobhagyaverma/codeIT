import { getAuthToken, type ProblemPublicDTO, type Submission, type User } from "./authStorage";
import { notifyUnauthorized } from "./authEvents";
import { resolveApiBase } from "./runtimeConfig";

/** Empty = same-origin (Vite proxy in dev, Nginx in prod). */
export const API_BASE = resolveApiBase();

const AUTH_FLOW_PATHS = [
  "/api/auth/login",
  "/api/user/register",
  "/api/auth/verify-email",
  "/api/auth/verify-email/resend",
  "/api/auth/forgot-password",
  "/api/auth/forgot-password/verify",
  "/api/auth/forgot-password/reset",
];

function isAuthFlowPath(path: string): boolean {
  return AUTH_FLOW_PATHS.some(
    (p) => path === p || path.startsWith(`${p}?`) || path.startsWith(`${p}/`)
  );
}

export class ApiError extends Error {
  status: number;
  code?: string;
  /** Seconds until a rate-limited call may be retried (429 responses only). */
  retryAfter?: number;

  constructor(
    message: string,
    status: number,
    code?: string,
    retryAfter?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/** Human-readable failure text, with a cooldown hint when rate limited. */
export function describeApiError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  if (err.status === 429) {
    const seconds = err.retryAfter ?? 0;
    if (seconds > 0) {
      const wait =
        seconds >= 60
          ? `${Math.ceil(seconds / 60)} minute${seconds >= 120 ? "s" : ""}`
          : `${seconds} second${seconds === 1 ? "" : "s"}`;
      return `Slow down — try again in ${wait}.`;
    }
    return "Slow down — you're doing that too often.";
  }
  return err.message || fallback;
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
    if (res.status === 401 && !isAuthFlowPath(path)) {
      notifyUnauthorized();
    }
    const message =
      (isJson && body && (body.message || body.error)) ||
      (typeof body === "string" && body) ||
      `Request failed (${res.status})`;
    const code =
      isJson && body && typeof body.code === "string"
        ? body.code
        : isJson && body && typeof body.error === "string" && /^[A-Z][A-Z0-9_]+$/.test(body.error)
          ? body.error
          : undefined;
    const retryAfterBody =
      isJson && body && typeof body.retryAfter === "number"
        ? body.retryAfter
        : undefined;
    const retryAfterHeader = Number(res.headers.get("retry-after"));
    throw new ApiError(
      typeof message === "string" ? message : `Request failed (${res.status})`,
      res.status,
      code,
      retryAfterBody ??
        (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
          ? retryAfterHeader
          : undefined)
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

export type CaptchaConfig = {
  enabled: boolean;
  provider: string;
  siteKey: string;
};

export const getCaptchaConfig = () =>
  request<CaptchaConfig>("/api/captcha/config");

export const login = async (
  loginId: string,
  password: string,
  captchaToken?: string
) => {
  const { encryptRsaOaep, isRsaEnabled } = await import("./rsaCrypto");
  const encrypted = await isRsaEnabled();
  const body = encrypted
    ? {
        login: await encryptRsaOaep(loginId),
        password: await encryptRsaOaep(password),
        encrypted: true,
        captchaToken: captchaToken || undefined,
      }
    : {
        login: loginId,
        password,
        encrypted: false,
        captchaToken: captchaToken || undefined,
      };
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const register = async (data: {
  name: string;
  uniqueUserId: string;
  email: string;
  password: string;
  captchaToken?: string;
  inviteCode?: string;
}) => {
  const { encryptRsaOaep, isRsaEnabled } = await import("./rsaCrypto");
  const encrypted = await isRsaEnabled();
  const body = {
    name: data.name,
    uniqueUserId: data.uniqueUserId,
    email: data.email,
    password: encrypted
      ? await encryptRsaOaep(data.password)
      : data.password,
    encrypted,
    captchaToken: data.captchaToken || undefined,
    inviteCode: data.inviteCode || undefined,
  };
  return request<{ message: string; needsVerification?: boolean; email?: string }>(
    "/api/user/register",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
};

export const verifyEmail = (email: string, otp: string, captchaToken?: string) =>
  request<{ message: string; verified?: boolean }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, otp, captchaToken: captchaToken || undefined }),
  });

export const resendVerifyEmail = (email: string, captchaToken?: string) =>
  request<{ message: string; verified?: boolean }>("/api/auth/verify-email/resend", {
    method: "POST",
    body: JSON.stringify({ email, captchaToken: captchaToken || undefined }),
  });

export const forgotPasswordRequest = (email: string, captchaToken?: string) =>
  request<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, captchaToken: captchaToken || undefined }),
  });

export const forgotPasswordVerify = (
  email: string,
  otp: string,
  captchaToken?: string
) =>
  request<{ message: string; resetToken: string; expiresInSeconds: number }>(
    "/api/auth/forgot-password/verify",
    {
      method: "POST",
      body: JSON.stringify({ email, otp, captchaToken: captchaToken || undefined }),
    }
  );

export const forgotPasswordReset = async (
  resetToken: string,
  newPassword: string,
  captchaToken?: string
) => {
  const { encryptRsaOaep, isRsaEnabled } = await import("./rsaCrypto");
  const encrypted = await isRsaEnabled();
  return request<{ message: string }>("/api/auth/forgot-password/reset", {
    method: "POST",
    body: JSON.stringify({
      resetToken,
      newPassword: encrypted ? await encryptRsaOaep(newPassword) : newPassword,
      encrypted,
      captchaToken: captchaToken || undefined,
    }),
  });
};

export const submitContact = (data: {
  username: string;
  email: string;
  subject: string;
  message: string;
  captchaToken?: string;
}) =>
  request<{ message: string; id: number }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });

export type RegistrationConfig = {
  mode: "OPEN" | "INVITE_ONLY" | "COLLEGE_ONLY" | string;
  requiresInvite: boolean;
  privateBeta: boolean;
  inviteTtlDays?: number;
};

export const getRegistrationConfig = () =>
  request<RegistrationConfig>("/api/registration/config");

export const requestBetaAccess = (data: {
  fullName: string;
  email: string;
  college: string;
  year: string;
  reason?: string;
  captchaToken?: string;
}) =>
  request<{ id: number; status: string; message: string }>(
    "/api/beta/request-access",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

export const verifyInvite = (inviteCode: string, email: string) =>
  request<{ valid: boolean; email: string; expiresAt?: string }>(
    "/api/beta/verify-invite",
    {
      method: "POST",
      body: JSON.stringify({ inviteCode, email }),
    }
  );

export type BetaAccessRequest = {
  id: number;
  fullName: string;
  email: string;
  college: string;
  year: string;
  reason?: string | null;
  status: string;
  createdAt?: string | null;
  reviewedAt?: string | null;
  rejectReason?: string | null;
};

export type BetaInviteRow = {
  id: number;
  codePrefix: string;
  email: string;
  requestId?: number | null;
  status: string;
  expiresAt?: string | null;
  createdAt?: string | null;
  usedAt?: string | null;
};

export type BetaAnalytics = {
  registeredUsers: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  activeInvites: number;
  usedInvites: number;
  expiredInvites: number;
  dailyActiveUsers: number;
  problemsSolved: number;
  quickClashCount: number;
  competitionCount: number;
  codeRoomsCreated: number;
  aiRequests: number;
};

export const listBetaRequests = (status = "ALL") =>
  request<BetaAccessRequest[]>(
    `/api/admin/beta/requests?status=${encodeURIComponent(status)}`
  );

export const approveBetaRequest = (id: number) =>
  request<{
    requestId: number;
    status: string;
    inviteId: number;
    inviteCode: string;
    expiresAt: string;
    emailSent: boolean;
  }>(`/api/admin/beta/requests/${id}/approve`, { method: "POST" });

export const rejectBetaRequest = (id: number, reason?: string) =>
  request<{ requestId: number; status: string }>(
    `/api/admin/beta/requests/${id}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason: reason || undefined }),
    }
  );

export const generateBetaInvite = (email: string, fullName?: string) =>
  request<{
    inviteId: number;
    inviteCode: string;
    email: string;
    expiresAt: string;
    emailSent: boolean;
  }>("/api/admin/beta/invites", {
    method: "POST",
    body: JSON.stringify({ email, fullName: fullName || undefined }),
  });

export const listBetaInvites = () =>
  request<BetaInviteRow[]>("/api/admin/beta/invites");

export const resendBetaInvite = (id: number) =>
  request<{
    inviteId: number;
    inviteCode: string;
    email: string;
    expiresAt: string;
    emailSent: boolean;
  }>(`/api/admin/beta/invites/${id}/resend`, { method: "POST" });

export const getBetaAnalytics = () =>
  request<BetaAnalytics>("/api/admin/beta/analytics");

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
    friendCount: number;
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

export const changeMyPassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  const { encryptRsaOaep, isRsaEnabled } = await import("./rsaCrypto");
  const encrypted = await isRsaEnabled();
  const body = encrypted
    ? {
        currentPassword: await encryptRsaOaep(data.currentPassword),
        newPassword: await encryptRsaOaep(data.newPassword),
        encrypted: true,
      }
    : { ...data, encrypted: false };
  return request<string>("/api/profile/me/password", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

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

export const joinCompetition = (id: number, userId?: number) => {
  const qs = userId != null ? `?userId=${userId}` : "";
  return request<string>(`/api/competitions/${id}/join${qs}`, {
    method: "POST",
  });
};

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

/* ---------------- AI Coach (practice only) ---------------- */

export type AiAction =
  | "EXPLAIN_PROBLEM"
  | "EXPLAIN_CONSTRAINTS"
  | "ASK_AI"
  | "REQUEST_HINT"
  | "ANALYZE_CODE"
  | "ANALYZE_FAILURE"
  | "REVIEW_ACCEPTED"
  | "EXPLAIN_EDITORIAL";

export type AiCoachRequest = {
  problemId: number;
  language?: string;
  languageId?: number;
  code?: string;
  action?: AiAction;
  hintLevel?: number;
  question?: string;
  submissionId?: number | null;
};

export type AiCoachResponse = {
  action: AiAction;
  content: string;
  hintLevel?: number | null;
  unlockedHintLevel?: number | null;
};

export const aiExplain = (data: Omit<AiCoachRequest, "action">) =>
  request<AiCoachResponse>("/api/ai/explain", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const aiConstraints = (data: Omit<AiCoachRequest, "action">) =>
  request<AiCoachResponse>("/api/ai/constraints", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const aiChat = (data: Omit<AiCoachRequest, "action">) =>
  request<AiCoachResponse>("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const aiHints = (
  data: Omit<AiCoachRequest, "action"> & { hintLevel: number }
) =>
  request<AiCoachResponse>("/api/ai/hints", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const aiAnalyze = (data: Omit<AiCoachRequest, "action">) =>
  request<AiCoachResponse>("/api/ai/analyze", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const aiAnalyzeFailure = (data: Omit<AiCoachRequest, "action">) =>
  request<AiCoachResponse>("/api/ai/analyze-failure", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const aiReview = (data: Omit<AiCoachRequest, "action">) =>
  request<AiCoachResponse>("/api/ai/review", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const aiEditorial = (data: Omit<AiCoachRequest, "action">) =>
  request<AiCoachResponse>("/api/ai/editorial", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getAiHintProgress = (problemId: number) =>
  request<{ problemId: number; unlockedHintLevel: number }>(
    `/api/ai/hints/progress?problemId=${problemId}`
  );

/* ── Friends / Notifications / Quick Clash ───────────────────────── */

export type FriendUserCard = {
  user_id: number;
  name: string;
  unique_user_id: string;
  avatar_url?: string | null;
  solved_count?: number;
  friends_since?: string;
  request_id?: number;
  created_at?: string;
};

export const getFriends = () =>
  request<{
    friends: FriendUserCard[];
    incoming: FriendUserCard[];
    outgoing: FriendUserCard[];
  }>("/api/friends");

export const searchFriend = (q: string) =>
  request<{
    user_id: number;
    name: string;
    unique_user_id: string;
    avatar_url?: string | null;
    solved_count?: number;
    isSelf: boolean;
    isFriend: boolean;
    outgoingPending: boolean;
    incomingPending: boolean;
  }>(`/api/friends/search?q=${encodeURIComponent(q)}`);

export const sendFriendRequest = (uniqueUserId: string) =>
  request<{ requestId: number; status: string }>("/api/friends/request", {
    method: "POST",
    body: JSON.stringify({ uniqueUserId }),
  });

export type FriendRespondResult = {
  status: "ACCEPTED" | "REJECTED" | "IGNORED" | string;
  friends?: boolean;
  alreadyHandled?: boolean;
  userId?: number;
  name?: string;
  uniqueUserId?: string;
};

export const respondFriendRequest = (
  requestId: number,
  action: "ACCEPT" | "REJECT" | "IGNORE"
) =>
  request<FriendRespondResult>(
    `/api/friends/requests/${requestId}/respond`,
    {
      method: "POST",
      body: JSON.stringify({ action }),
    }
  );

export const removeFriend = (userId: number) =>
  request<{ ok: boolean }>(`/api/friends/${userId}`, { method: "DELETE" });

export type AppNotification = {
  id: number;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export const getNotifications = (limit = 50) =>
  request<{ items: AppNotification[]; unreadCount: number }>(
    `/api/notifications?limit=${limit}`
  );

export const getNotificationUnreadCount = () =>
  request<{ unreadCount: number }>("/api/notifications/unread-count");

export const markNotificationRead = (id: number) =>
  request<{ ok: boolean; unreadCount: number }>(`/api/notifications/${id}/read`, {
    method: "POST",
  });

export const markAllNotificationsRead = () =>
  request<{ ok: boolean; updated: number; unreadCount: number }>(
    "/api/notifications/read-all",
    { method: "POST" }
  );

export type QuickContest = {
  id: number;
  name: string;
  description?: string;
  difficulty_tier: string;
  duration_minutes: number;
  max_players: number;
  status: string;
  invite_token?: string;
  host_user_id: number;
  started_at?: string | null;
  ends_at?: string | null;
  problems?: Array<{
    ordinal: number;
    problem_id: number;
    title: string;
    difficulty: string;
  }>;
  participants?: Array<Record<string, unknown>>;
  joinedCount?: number;
  leaderboard?: Array<Record<string, unknown>>;
};

export const createQuickContest = (body: {
  name: string;
  description?: string;
  difficultyTier: "EASY" | "MEDIUM" | "HARD";
  durationMinutes: number;
  maxPlayers: number;
}) =>
  request<QuickContest>("/api/quick-clash", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getQuickContest = (id: number | string) =>
  request<QuickContest>(`/api/quick-clash/${id}`);

export const getQuickContestLeaderboard = (id: number | string) =>
  request<Array<Record<string, unknown>>>(
    `/api/quick-clash/${id}/leaderboard`
  );

/** Live Quick Clash submit — judged against full hidden tests, unrated. */
export const submitQuickContest = (
  id: number | string,
  data: {
    problemId: number;
    languageId: number;
    language: string;
    code: string;
  }
) =>
  request<JudgeVerdictDTO>(`/api/quick-clash/${id}/submit`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const inviteToQuickContest = (id: number | string, friendUserIds: number[]) =>
  request<{ invited: number; contest: QuickContest }>(`/api/quick-clash/${id}/invite`, {
    method: "POST",
    body: JSON.stringify({ friendUserIds }),
  });

export const joinQuickContest = (id: number | string) =>
  request<QuickContest>(`/api/quick-clash/${id}/join`, { method: "POST" });

export const readyQuickContest = (id: number | string, ready: boolean) =>
  request<QuickContest>(`/api/quick-clash/${id}/ready`, {
    method: "POST",
    body: JSON.stringify({ ready }),
  });

export const startQuickContest = (id: number | string) =>
  request<QuickContest>(`/api/quick-clash/${id}/start`, { method: "POST" });

export const cancelQuickContest = (id: number | string) =>
  request<{ ok: boolean }>(`/api/quick-clash/${id}/cancel`, { method: "POST" });

export const leaveQuickContest = (id: number | string) =>
  request<{ ok: boolean }>(`/api/quick-clash/${id}/leave`, { method: "POST" });

export const getQuickClashHistory = () =>
  request<{
    active?: Array<Record<string, unknown>>;
    history: Array<Record<string, unknown>>;
    invited: Array<Record<string, unknown>>;
  }>("/api/quick-clash/history");

export type { User, ProblemPublicDTO, Submission };
