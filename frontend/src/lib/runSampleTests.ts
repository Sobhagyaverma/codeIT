import { runCode } from "./api";
import {
  exampleInputToStdin,
  exampleOutputToExpected,
  formatExample,
  outputsMatch,
  type Example,
} from "./examples";
import {
  compilationErrorMessage,
  mapJudgeStatus,
  parseTimeSeconds,
  runtimeErrorMessage,
  type RunVerdictKind,
} from "./judgeStatus";
import type { RunResult } from "./types";

export type { RunVerdictKind };

export type SampleCaseResult = {
  index: number;
  inputDisplay: string;
  stdin: string;
  expectedOutput: string;
  userOutput: string;
  status: RunVerdictKind;
  passed: boolean;
  time?: number;
  memory?: number;
  message?: string;
};

export type SampleRunSession = {
  overall: RunVerdictKind;
  cases: SampleCaseResult[];
  time?: number;
  memory?: number;
  compileOutput?: string;
  runtimeMessage?: string;
  firstFailedIndex?: number;
  mode: "samples" | "custom";
};

export type PreparedSampleCase = {
  stdin: string;
  expectedOutput: string;
  inputDisplay: string;
};

export type RunSampleTestsParams = {
  sourceCode: string;
  languageId: number;
  /** Prepared sample cases (preferred). */
  samples?: PreparedSampleCase[];
  /** Fallback: build samples from problem examples. */
  examples?: Example[];
  /** Used when there are no sample cases. */
  customStdin?: string;
  signal?: AbortSignal;
};

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    const err = new Error("Run cancelled");
    err.name = "AbortError";
    throw err;
  }
}

async function executeOnce(
  sourceCode: string,
  languageId: number,
  stdin: string,
  signal?: AbortSignal
): Promise<RunResult> {
  throwIfAborted(signal);
  return runCode({
    source_code: sourceCode,
    language_id: languageId,
    stdin,
  });
}

function prepareFromExamples(examples: Example[]): PreparedSampleCase[] {
  return examples.map((example) => ({
    stdin: exampleInputToStdin(example.input),
    expectedOutput: exampleOutputToExpected(example.output),
    inputDisplay: formatExample(example.input),
  }));
}

function buildCaseFromResult(
  index: number,
  sample: PreparedSampleCase,
  result: RunResult
): SampleCaseResult {
  const judgeStatus = mapJudgeStatus(result);
  const userOutput = result.stdout ?? "";
  const hasExpected = sample.expectedOutput !== "";
  const passed =
    judgeStatus === "Accepted" &&
    (!hasExpected || outputsMatch(userOutput, sample.expectedOutput));

  let status: RunVerdictKind = judgeStatus;
  if (judgeStatus === "Accepted" && hasExpected && !passed) {
    status = "Wrong Answer";
  }

  return {
    index,
    inputDisplay: sample.inputDisplay,
    stdin: sample.stdin,
    expectedOutput: sample.expectedOutput,
    userOutput,
    status,
    passed,
    time: parseTimeSeconds(result.time),
    memory: result.memory,
    message:
      status === "Runtime Error"
        ? runtimeErrorMessage(result)
        : status === "Compilation Error"
          ? compilationErrorMessage(result)
          : undefined,
  };
}

function summarize(cases: SampleCaseResult[]): Omit<SampleRunSession, "mode"> {
  const firstFailed = cases.findIndex((c) => !c.passed);
  const firstFailedCase = firstFailed >= 0 ? cases[firstFailed] : undefined;

  let overall: RunVerdictKind = "Accepted";
  if (firstFailedCase) {
    overall = firstFailedCase.status;
  }

  let time: number | undefined;
  let memory: number | undefined;
  for (const c of cases) {
    if (c.time !== undefined) {
      time = time === undefined ? c.time : Math.max(time, c.time);
    }
    if (c.memory !== undefined) {
      memory = memory === undefined ? c.memory : Math.max(memory, c.memory);
    }
  }

  return {
    overall,
    cases,
    time,
    memory,
    runtimeMessage:
      overall === "Runtime Error" ? firstFailedCase?.message : undefined,
    firstFailedIndex: firstFailed >= 0 ? firstFailed : undefined,
  };
}

/**
 * Runs sample cases via POST /api/submissions/run (one call per sample).
 * Short-circuits on compilation error so CE is shown without case cards.
 */
export async function runSampleTests(
  params: RunSampleTestsParams
): Promise<SampleRunSession> {
  const {
    sourceCode,
    languageId,
    samples: samplesParam,
    examples = [],
    customStdin = "",
    signal,
  } = params;

  const samples =
    samplesParam && samplesParam.length > 0
      ? samplesParam
      : prepareFromExamples(examples);

  if (samples.length === 0) {
    const result = await executeOnce(
      sourceCode,
      languageId,
      customStdin,
      signal
    );
    const status = mapJudgeStatus(result);

    if (status === "Compilation Error") {
      return {
        overall: "Compilation Error",
        cases: [],
        compileOutput: compilationErrorMessage(result),
        time: parseTimeSeconds(result.time),
        memory: result.memory,
        mode: "custom",
      };
    }

    const caseResult: SampleCaseResult = {
      index: 1,
      inputDisplay: customStdin || "(empty)",
      stdin: customStdin,
      expectedOutput: "",
      userOutput: result.stdout ?? "",
      status,
      passed: status === "Accepted",
      time: parseTimeSeconds(result.time),
      memory: result.memory,
      message:
        status === "Runtime Error" ? runtimeErrorMessage(result) : undefined,
    };

    return {
      ...summarize([caseResult]),
      mode: "custom",
      runtimeMessage:
        status === "Runtime Error" ? runtimeErrorMessage(result) : undefined,
    };
  }

  const cases: SampleCaseResult[] = [];

  for (let i = 0; i < samples.length; i++) {
    throwIfAborted(signal);
    const sample = samples[i];
    const result = await executeOnce(
      sourceCode,
      languageId,
      sample.stdin,
      signal
    );
    const judgeStatus = mapJudgeStatus(result);

    if (judgeStatus === "Compilation Error") {
      return {
        overall: "Compilation Error",
        cases: [],
        compileOutput: compilationErrorMessage(result),
        time: parseTimeSeconds(result.time),
        memory: result.memory,
        mode: "samples",
      };
    }

    cases.push(buildCaseFromResult(i + 1, sample, result));
  }

  return {
    ...summarize(cases),
    mode: "samples",
  };
}
