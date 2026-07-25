import {
  compilationErrorMessage,
  mapJudgeStatus,
  parseTimeSeconds,
  runtimeErrorMessage,
  type RunVerdictKind,
} from "../../lib/judgeStatus";
import { outputsMatch } from "../../lib/examples";
import type {
  SampleCaseResult,
  SampleRunSession,
} from "../../lib/runSampleTests";
import type { JudgeVerdictDTO, RunResult } from "../../lib/types";

function asRunResult(raw: unknown): RunResult {
  if (!raw || typeof raw !== "object") return {};
  return raw as RunResult;
}

export function judge0ToCustomSession(
  raw: unknown,
  stdin = "",
  expectedOutput = ""
): SampleRunSession {
  const result = asRunResult(raw);
  const status = mapJudgeStatus(result);
  const userOutput = result.stdout ?? "";
  const hasExpected = expectedOutput !== "";
  const passed =
    status === "Accepted" &&
    (!hasExpected || outputsMatch(userOutput, expectedOutput));
  const kind: RunVerdictKind =
    status === "Accepted" && hasExpected && !passed ? "Wrong Answer" : status;

  const caseResult: SampleCaseResult = {
    index: 0,
    inputDisplay: stdin || "(empty)",
    stdin,
    expectedOutput,
    userOutput,
    status: kind,
    passed: kind === "Accepted" && (!hasExpected || passed),
    time: parseTimeSeconds(result.time),
    memory:
      typeof result.memory === "number" ? result.memory : undefined,
    message:
      kind === "Compilation Error"
        ? compilationErrorMessage(result)
        : kind === "Runtime Error"
          ? runtimeErrorMessage(result)
          : undefined,
  };

  return {
    overall: caseResult.status,
    cases: [caseResult],
    time: caseResult.time,
    memory: caseResult.memory,
    compileOutput: result.compile_output,
    runtimeMessage: caseResult.message,
    firstFailedIndex: caseResult.passed ? undefined : 0,
    mode: "custom",
  };
}

export function buildSamplesSession(
  cases: SampleCaseResult[]
): SampleRunSession {
  const firstFailed = cases.findIndex((c) => !c.passed);
  const compile = cases.find((c) => c.status === "Compilation Error");
  let overall: RunVerdictKind = "Accepted";
  if (compile) overall = "Compilation Error";
  else if (firstFailed >= 0) overall = cases[firstFailed].status;

  const times = cases.map((c) => c.time).filter((t): t is number => t != null);
  const memories = cases
    .map((c) => c.memory)
    .filter((m): m is number => m != null);

  return {
    overall,
    cases,
    time: times.length ? Math.max(...times) : undefined,
    memory: memories.length ? Math.max(...memories) : undefined,
    compileOutput: compile?.message,
    firstFailedIndex: firstFailed >= 0 ? firstFailed : undefined,
    mode: "samples",
  };
}

export function asJudgeVerdict(raw: unknown): JudgeVerdictDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as JudgeVerdictDTO;
  if (!v.verdict || typeof v.verdict !== "string") return null;
  return v;
}

export function caseFromJudge0(
  index: number,
  sample: {
    stdin: string;
    expectedOutput: string;
    inputDisplay: string;
  },
  raw: unknown
): SampleCaseResult {
  const result = asRunResult(raw);
  const status = mapJudgeStatus(result);
  const userOutput = result.stdout ?? "";
  const hasExpected = sample.expectedOutput !== "";
  const matched =
    !hasExpected || outputsMatch(userOutput, sample.expectedOutput);
  const passed = status === "Accepted" && matched;
  const kind: RunVerdictKind =
    status === "Accepted" && hasExpected && !matched
      ? "Wrong Answer"
      : status;

  return {
    index,
    inputDisplay: sample.inputDisplay,
    stdin: sample.stdin,
    expectedOutput: sample.expectedOutput,
    userOutput,
    status: kind,
    passed,
    time: parseTimeSeconds(result.time),
    memory:
      typeof result.memory === "number" ? result.memory : undefined,
    message:
      kind === "Compilation Error"
        ? compilationErrorMessage(result)
        : kind === "Runtime Error"
          ? runtimeErrorMessage(result)
          : undefined,
  };
}
