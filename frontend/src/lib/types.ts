// Types mirror the backend DTOs exactly. Do not rename fields — they are
// serialized as-is to/from the Spring Boot API.

export interface User {
  id: number;
  name: string;
  uniqueUserId: string;
  email: string;
  role: "USER" | "ADMIN";
  token?: string;
}

export interface ProblemPublicDTO {
  id: number;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | string;
  topics: string[];
  examples: { input: string; output: string; explanation?: string }[] | string;
  constraintsData: string;
}

export interface LanguageDTO {
  slug: string;
  name: string;
  languageId: number;
}

export interface RunRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
}

export interface RunResult {
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  status?: { id: number; description: string };
  time?: string | number;
  memory?: number;
  [key: string]: unknown;
}

export interface SubmitRequest {
  userId: number;
  problemId: number;
  languageId: number;
  language: string;
  code: string;
}

export type JudgeVerdictDTO = {
  submissionId?: number;
  verdict: string;
  passed?: boolean;
  failedTestIndex?: number | null;

  // hidden test-case counts (sent by the backend)
  passedCount?: number;
  totalCount?: number;

  // overall performance
  time?: number; // seconds
  memory?: number; // kilobytes

  /** Backend judge path: compile-once | progressive-batch */
  engine?: "compile-once" | "progressive-batch" | string;

  // data for post-submit test-case panel
  visibleTestCases?: {
    input: string;
    expectedOutput: string;
    userOutput?: string;
    passed: boolean;
  }[];

  hiddenSummary?: {
    passed: number;
    total: number;
  };
};

export interface Submission extends SubmitRequest {
  id?: number;
  verdict?: string;
  passedCount?: number;
  totalCount?: number;
  createdAt?: string;
  /** Backend field names used by SubmissionRowMapper */
  executionTime?: number;
  memoryUsed?: number;
  competitionId?: number | null;
  output?: string | null;
}

export interface Competition {
  id: number;
  title?: string;
  name?: string;
  description?: string | null;
  createdBy?: number;
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  durationMinutes?: number;
  contestType?: string;
  difficulty?: string;
  isFeatured?: boolean;
  createdAt?: string;
  problemCount?: number;
  participantCount?: number;
  [key: string]: unknown;
}

export interface ContestSession {
  sessionStatus: "JOINED" | "IN_PROGRESS" | "ENDED";
  remainingSeconds?: number | null;
  serverTime?: number | string;
  competitionId?: number;
  userId?: number;
  startedAt?: string;
  deadlineAt?: string;
  [key: string]: unknown;
}

export interface LeaderboardEntry {
  userId: number;
  userName: string;
  solved: number;
  totalTime: number;
  rank: number;
}

export type AiAction =
  | "EXPLAIN_PROBLEM"
  | "EXPLAIN_CONSTRAINTS"
  | "ASK_AI"
  | "REQUEST_HINT"
  | "ANALYZE_CODE"
  | "ANALYZE_FAILURE"
  | "REVIEW_ACCEPTED"
  | "EXPLAIN_EDITORIAL";

export interface AiCoachRequest {
  problemId: number;
  language?: string;
  languageId?: number;
  code?: string;
  action?: AiAction;
  hintLevel?: number;
  question?: string;
  submissionId?: number | null;
}

export interface AiCoachResponse {
  action: AiAction;
  content: string;
  hintLevel?: number | null;
  unlockedHintLevel?: number | null;
}

/** @deprecated use AiCoachRequest */
export type AIRequest = AiCoachRequest & { userId?: number };
/** @deprecated use AiCoachResponse */
export type AIResponse = AiCoachResponse & {
  explanation?: string;
  correctedCode?: string;
};
