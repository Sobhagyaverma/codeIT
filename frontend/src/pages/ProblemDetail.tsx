import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { getLanguages, getProblem, runCode, submitCode } from "../lib/api";
import type {
  JudgeVerdictDTO,
  LanguageDTO,
  ProblemPublicDTO,
  RunResult,
} from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { Loading, ErrorState } from "../components/Loading";
import DifficultyBadge from "../components/DifficultyBadge";
import VerdictPanel from "../components/VerdictPanel";
import AIPanel from "../components/AIPanel";

// Monaco language ids differ from Judge0 slugs in a few cases.
const MONACO_LANG: Record<string, string> = {
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  go: "go",
  java: "java",
  javascript: "javascript",
  php: "php",
  python: "python",
  ruby: "ruby",
  rust: "rust",
  typescript: "typescript",
};

const STARTER: Record<string, string> = {
  python:
    "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # your solution here\n\nif __name__ == '__main__':\n    main()\n",
  java:
    "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your solution here\n    }\n}\n",
  cpp:
    "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your solution here\n    return 0;\n}\n",
  javascript:
    "const lines = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n');\n// your solution here\n",
};

type VisibleTestCase = {
  input: string;
  expectedOutput: string;
  userOutput?: string;
  passed: boolean;
};

type SubmissionFeedback = {
  visibleTestCases: VisibleTestCase[];
  hiddenSummary?: {
    passed: number;
    total: number;
  };
};

function parseTopics(topics: string[] | string | undefined): string[] {
  if (!topics) return [];

  if (Array.isArray(topics)) {
    return topics.flatMap((t) => parseTopics(t));
  }

  try {
    const parsed = JSON.parse(topics);

    if (Array.isArray(parsed)) {
      return parsed.map(String);
    }
  } catch {}

  return [topics];
}

type Example = {
  input: unknown;
  output: unknown;
  explanation?: string;
};

function parseExamples(examples?: string | Example[]): Example[] {
  if (!examples) return [];

  if (Array.isArray(examples)) {
    return examples;
  }

  try {
    return JSON.parse(examples) as Example[];
  } catch {
    return [];
  }
}

function formatExample(value: unknown): string {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return String(value);
    }
  }

  if (Array.isArray(value)) {
    return `[${value.join(", ")}]`;
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value)
      .map(([key, val]) => {
        if (Array.isArray(val)) {
          return `${key} = [${val.join(", ")}]`;
        }

        if (typeof val === "object" && val !== null) {
          return `${key} = ${JSON.stringify(val)}`;
        }

        return `${key} = ${val}`;
      })
      .join(", ");
  }

  return String(value);
}

export default function ProblemDetail() {
  const { id } = useParams();
  const problemId = Number(id);
  const { user } = useAuth();

  const [problem, setProblem] = useState<ProblemPublicDTO | null>(null);
  const [languages, setLanguages] = useState<LanguageDTO[]>([]);
  const [language, setLanguage] = useState<LanguageDTO | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [verdict, setVerdict] = useState<JudgeVerdictDTO | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] =
    useState<SubmissionFeedback | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([getProblem(problemId), getLanguages()])
      .then(([p, langs]) => {
        if (cancelled) return;

        setProblem(p);
        setLanguages(langs);

        const py = langs.find((l) => l.slug === "python") || langs[0];
        setLanguage(py);
        setCode(STARTER[py?.slug] || "");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [problemId]);

  const handleLanguageChange = (slug: string) => {
    const lang = languages.find((l) => l.slug === slug) || null;
    setLanguage(lang);

    if (lang && STARTER[lang.slug]) {
      setCode(STARTER[lang.slug]);
    }
  };

  const handleRun = async () => {
    if (!language) return;

    setRunning(true);
    setActionError(null);
    setRunResult(null);

    try {
      const res = await runCode({
        source_code: code,
        language_id: language.languageId,
      });
      setRunResult(res);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Run failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!language || !user) return;

    setSubmitting(true);
    setActionError(null);
    setVerdict(null);
    setSubmissionFeedback(null);

    try {
      const res = await submitCode({
        userId: user.id,
        problemId,
        languageId: language.languageId,
        language: language.slug,
        code,
      });

      setVerdict(res);

      setSubmissionFeedback({
        visibleTestCases: (res.visibleTestCases || []).slice(0, 3),
        hiddenSummary: res.hiddenSummary,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setHasSubmitted(true);
      setSubmitting(false);
    }
  };

   const examples = useMemo(() => {
     if (!problem) return [];
     return parseExamples(problem.examples);
    }, [problem]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <Loading label="Loading problem" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <ErrorState message={error || "Problem not found."} />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-2">
      {/* Left: statement */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <h1 className="display text-xl font-semibold">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {parseTopics(problem.topics).map((t) => (
            <span
              key={t}
              className="rounded border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--text-dim)]"
            >
              #{t}
            </span>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold text-[var(--text)]">
            Description
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
              {problem.description}
            </p>
          </div>
        </div>

        {examples.length > 0 && (
           <div className="mt-8">
            {examples.map((ex: Example, index: number) => (
             <div key={index} className="mb-8">
             <h3 className="mb-3 text-base font-semibold text-[var(--text)]">
                Example {index + 1}
             </h3>

        <div className="space-y-3 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">

          <div>
            <div className="mb-1 font-semibold">Input:</div>
            <pre className="mono whitespace-pre-wrap text-sm">
              {formatExample(ex.input)}
            </pre>
          </div>

          <div>
            <div className="mb-1 font-semibold">Output:</div>
            <pre className="mono whitespace-pre-wrap text-sm">
               {formatExample(ex.output)}
            </pre>
          </div>

          {ex.explanation && (
            <div>
              <div className="mb-1 font-semibold">Explanation:</div>
              <pre className="whitespace-pre-wrap text-sm text-[var(--text-dim)]">
                {ex.explanation}
              </pre>
            </div>
          )}

        </div>
      </div>
    ))}
  </div>
 )}

        {problem.constraintsData && (
          <div className="mt-6">
            <div className="verdict-strip mb-2 text-[var(--text-dim)]">
              Constraints
            </div>

            <pre className="mono whitespace-pre-wrap text-xs text-[var(--text-dim)]">
              {problem.constraintsData}
            </pre>
          </div>
        )}

        {user && !hasSubmitted && (
          <div className="mt-6 rounded-lg border border-dashed border-[var(--line)] bg-[var(--bg-raised)] p-4 text-sm text-[var(--text-dim)]">
            Submit your solution to unlock AI Help.
          </div>
        )}

        {user && hasSubmitted && (
          <div className="mt-6 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
            <div className="mb-3 text-sm font-semibold text-[var(--text)]">
              AI Help
            </div>

            <AIPanel
              baseRequest={{
                userId: user.id,
                problemId,
                language: language?.slug || "python",
                languageId: language?.languageId || 71,
                code,
                verdict: verdict?.verdict,
                failedTestIndex: verdict?.failedTestIndex ?? null,
              }}
              onApplyCorrectedCode={setCode}
            />
          </div>
        )}
      </div>

      {/* Right: editor */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <select
            value={language?.slug || ""}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--info)] focus:outline-none"
          >
            {languages.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleRun}
              disabled={running}
              className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--text)] transition hover:border-[var(--info)] hover:text-[var(--info)] disabled:opacity-40"
            >
              {running ? "Running..." : "Run"}
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting || !user}
              title={!user ? "Log in to submit" : undefined}
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#0a0d12] transition hover:brightness-110 disabled:opacity-40"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--line)]">
          <Editor
            height="420px"
            language={MONACO_LANG[language?.slug || "python"] || "plaintext"}
            value={code}
            onChange={(v) => setCode(v || "")}
            theme="vs-dark"
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              fontFamily: "JetBrains Mono, monospace",
            }}
          />
        </div>

          {actionError &&
             !actionError.includes("Invalid test_cases JSON") && (
              <div className="mt-3">
                 <ErrorState message={actionError} />
               </div>
          )}

        {runResult && (
          <div className="mono mt-3 rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] p-3 text-xs">
            <div className="verdict-strip mb-2 text-[var(--text-dim)]">
              Run output
            </div>

            {runResult.stdout && (
              <pre className="whitespace-pre-wrap text-[var(--text)]">
                {runResult.stdout}
              </pre>
            )}

            {runResult.stderr && (
              <pre className="whitespace-pre-wrap text-[var(--err)]">
                {runResult.stderr}
              </pre>
            )}

            {runResult.compile_output && (
              <pre className="whitespace-pre-wrap text-[var(--warn)]">
                {runResult.compile_output}
              </pre>
            )}

            {runResult.status && (
              <div className="mt-2 text-[var(--text-dim)]">
                {runResult.status.description}
              </div>
            )}
          </div>
        )}

        {verdict && (
          <div className="mt-3">
            <VerdictPanel verdict={verdict} />
          </div>
        )}

        {hasSubmitted && (
<div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] p-4">
  <div className="mb-3 text-sm font-semibold text-[var(--text)]">
    Test Cases
  </div>

  {submissionFeedback?.visibleTestCases?.length ? (
    <div className="space-y-3">
      {submissionFeedback.visibleTestCases.map((tc, idx) => (
        <div
          key={idx}
          className="rounded-md border border-[var(--line)] bg-[var(--bg-raised)] p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span>Test Case {idx + 1}</span>

            <span
              className={
                tc.passed ? "text-green-400" : "text-red-400"
              }
            >
              {tc.passed ? "Passed" : "Failed"}
            </span>
          </div>

          <div className="text-sm">
            <div>
              <b>Input:</b> {tc.input}
            </div>

            <div>
              <b>Expected:</b> {tc.expectedOutput}
            </div>

            <div>
              <b>Your Output:</b> {tc.userOutput}
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--text-dim)]">
      Submit your code to view test case results.
    </div>
  )}
</div>
        )}
      </div>
    </div>
  );
}