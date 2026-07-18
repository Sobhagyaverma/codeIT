import type { RunResult } from "./types";

export type RunVerdictKind =
  | "Accepted"
  | "Wrong Answer"
  | "Compilation Error"
  | "Runtime Error"
  | "Time Limit Exceeded"
  | "Memory Limit Exceeded"
  | "Internal Error";

/** Judge0 status id → verdict kind. */
const STATUS_BY_ID: Record<number, RunVerdictKind> = {
  3: "Accepted",
  4: "Wrong Answer",
  5: "Time Limit Exceeded",
  6: "Compilation Error",
  7: "Runtime Error",
  8: "Runtime Error",
  9: "Runtime Error",
  10: "Runtime Error",
  11: "Runtime Error",
  12: "Runtime Error",
  13: "Internal Error",
  14: "Internal Error",
  15: "Runtime Error",
  17: "Memory Limit Exceeded",
};

const STATUS_BY_DESCRIPTION: Record<string, RunVerdictKind> = {
  Accepted: "Accepted",
  "Wrong Answer": "Wrong Answer",
  "Time Limit Exceeded": "Time Limit Exceeded",
  "Compilation Error": "Compilation Error",
  "Memory Limit Exceeded": "Memory Limit Exceeded",
  "Runtime Error (SIGSEGV)": "Runtime Error",
  "Runtime Error (SIGXFSZ)": "Runtime Error",
  "Runtime Error (SIGFPE)": "Runtime Error",
  "Runtime Error (SIGABRT)": "Runtime Error",
  "Runtime Error (NZEC)": "Runtime Error",
  "Runtime Error (Other)": "Runtime Error",
  "Runtime Error (SIGBUS)": "Runtime Error",
  "Internal Error": "Internal Error",
  "Exec Format Error": "Internal Error",
};

export function mapJudgeStatus(result: RunResult): RunVerdictKind {
  const id = result.status?.id;
  if (typeof id === "number" && STATUS_BY_ID[id]) {
    return STATUS_BY_ID[id];
  }
  const description = result.status?.description?.trim();
  if (description && STATUS_BY_DESCRIPTION[description]) {
    return STATUS_BY_DESCRIPTION[description];
  }
  if (description?.startsWith("Runtime Error")) {
    return "Runtime Error";
  }
  if (result.compile_output && !result.stdout && !result.stderr) {
    return "Compilation Error";
  }
  return "Internal Error";
}

export function parseTimeSeconds(time: string | number | undefined): number | undefined {
  if (time === undefined || time === null || time === "") return undefined;
  const n = typeof time === "number" ? time : Number.parseFloat(time);
  return Number.isFinite(n) ? n : undefined;
}

export function runtimeErrorMessage(result: RunResult): string {
  const parts = [result.stderr, result.compile_output, result.stdout]
    .filter((p): p is string => Boolean(p && p.trim()))
    .map((p) => p.trim());
  if (parts.length) return parts.join("\n\n");
  return result.status?.description || "Runtime Error";
}

export function compilationErrorMessage(result: RunResult): string {
  const msg = result.compile_output?.trim() || result.stderr?.trim();
  if (msg) return msg;
  return result.status?.description || "Compilation failed.";
}
