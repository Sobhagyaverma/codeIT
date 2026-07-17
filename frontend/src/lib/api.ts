import type {
  AIRequest,
  AIResponse,
  Competition,
  ContestSession,
  JudgeVerdictDTO,
  LanguageDTO,
  LeaderboardEntry,
  ProblemPublicDTO,
  RunRequest,
  RunResult,
  Submission,
  SubmitRequest,
  User,
} from "./types";

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:9091";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const body = isJson
    ? await res.json().catch(() => null)
    : await res.text();

  if (!res.ok) {
    const message =
      (isJson && body && (body.message || body.error)) ||
      (typeof body === "string" && body) ||
      `Request failed (${res.status})`;

    throw new ApiError(message, res.status);
  }

  return body as T;
}

/* ---------------- Auth ---------------- */

export interface LoginResponse {
  token: string;
  userId: number;
  name: string;
  uniqueUserId: string;
  email: string;
  role: "USER" | "ADMIN";
  expiresIn: number;
}

export const login = (login: string, password: string) =>
  request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
    }),
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

export const getUsers = () =>
  request<User[]>("/api/user/getUsers");

export const getUser = (id: number) =>
  request<User>(`/api/user/getUser/${id}`);

export const deleteUser = (id: number) =>
  request<void>(
    `/api/user/deleteUser/${id}`,
    {
      method: "DELETE",
    }
  );

/* ---------------- Problems ---------------- */

export const getProblems = () =>
  request<ProblemPublicDTO[]>("/api/problems");

export const getProblem = (id: number) =>
  request<ProblemPublicDTO>(
    `/api/problems/${id}`
  );

export const getProblemsByDifficulty = (
  difficulty: string
) =>
  request<ProblemPublicDTO[]>(
    `/api/problems/difficulty/${difficulty}`
  );

export const getProblemsByTopic = (
  topic: string
) =>
  request<ProblemPublicDTO[]>(
    `/api/problems/topic/${topic}`
  );

export const searchProblems = (
  keyword: string
) =>
  request<ProblemPublicDTO[]>(
    `/api/problems/search?keyword=${encodeURIComponent(
      keyword
    )}`
  );

export const createProblem = (
  data: Record<string, unknown>
) =>
  request<ProblemPublicDTO>(
    "/api/problems",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

/* ---------------- Submissions ---------------- */

export const getLanguages = () =>
  request<LanguageDTO[]>(
    "/api/submissions/languages"
  );

export const runCode = (
  data: RunRequest
) =>
  request<RunResult>(
    "/api/submissions/run",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

export const submitCode = (
  data: SubmitRequest
) =>
  request<JudgeVerdictDTO>(
    "/api/submissions/submit",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

export const getUserSubmissions = (
  userId: number
) =>
  request<Submission[]>(
    `/api/submissions/user/${userId}`
  );

export const getProblemSubmissions = (
  problemId: number
) =>
  request<Submission[]>(
    `/api/submissions/problem/${problemId}`
  );

  /* ---------------- Competitions ---------------- */

export const createCompetition = (
  data: Record<string, unknown>
) =>
  request<Competition>(
    "/api/competitions/create",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

export const getAllCompetitions = () =>
  request<Competition[]>(
    "/api/competitions/getAllCompetitions"
  );

export const getCompetition = (
  id: number
) =>
  request<Competition>(
    `/api/competitions/get/${id}`
  );

export const addProblemsToCompetition = (
  id: number,
  _userId: number,
  problemIds: number[]
) =>
  request<string>(
    `/api/competitions/addProblemsTo/${id}/problems`,
    {
      method: "POST",
      body: JSON.stringify({
        problemIds,
      }),
    }
  );

export const getCompetitionProblems = (
  id: number
) =>
  request<number[]>(
    `/api/competitions/getProblemsOf/${id}/problems`
  );

export const joinCompetition = (
  id: number,
  userId: number
) =>
  request<void>(
    `/api/competitions/${id}/join?userId=${userId}`,
    {
      method: "POST",
    }
  );

export const startCompetition = (
  id: number,
  userId: number
) =>
  request<void>(
    `/api/competitions/${id}/start?userId=${userId}`,
    {
      method: "POST",
    }
  );

export const endCompetition = (id: number) =>
  request<ContestSession>(`/api/competitions/${id}/end`, {
    method: "POST",
  });

export const getCompetitionSession = (
  id: number,
  userId: number
) =>
  request<ContestSession>(
    `/api/competitions/${id}/session?userId=${userId}`
  );

export const getCompetitionParticipants = (
  id: number
) =>
  request<number[]>(
    `/api/competitions/${id}/participants`
  );

export const submitToCompetition = (
  id: number,
  data: SubmitRequest
) =>
  request<JudgeVerdictDTO>(
    `/api/competitions/${id}/submit`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

export const getLeaderboard = (
  id: number
) =>
  request<LeaderboardEntry[]>(
    `/api/competitions/${id}/leaderboard`
  );

export const patchCompetitionTimes = (
  id: number,
  data: {
    startTime?: string;
    endTime?: string;
  }
) =>
  request<Competition>(
    `/api/competitions/${id}/times`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

/* ---------------- AI ---------------- */

export const explainCode = (
  data: AIRequest
) =>
  request<AIResponse>(
    "/api/ai/explain",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

export const correctCode = (
  data: AIRequest
) =>
  request<AIResponse>(
    "/api/ai/correct",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

export { ApiError };