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

export type { User, ProblemPublicDTO, Submission };
