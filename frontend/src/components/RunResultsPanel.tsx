import type { RunVerdictKind, SampleCaseResult, SampleRunSession } from "../lib/runSampleTests";

const VERDICT_META: Record<
  RunVerdictKind,
  { color: string; label: string; hint: string }
> = {
  Accepted: {
    color: "var(--ok)",
    label: "Accepted",
    hint: "All sample test cases passed.",
  },
  "Wrong Answer": {
    color: "var(--err)",
    label: "Wrong Answer",
    hint: "Output did not match the expected result.",
  },
  "Compilation Error": {
    color: "var(--err)",
    label: "Compilation Error",
    hint: "Your code failed to compile.",
  },
  "Runtime Error": {
    color: "var(--err)",
    label: "Runtime Error",
    hint: "Your program crashed while running.",
  },
  "Time Limit Exceeded": {
    color: "var(--warn)",
    label: "Time Limit Exceeded",
    hint: "Your program took too long on a sample case.",
  },
  "Memory Limit Exceeded": {
    color: "var(--warn)",
    label: "Memory Limit Exceeded",
    hint: "Your program used too much memory.",
  },
  "Internal Error": {
    color: "var(--info)",
    label: "Internal Error",
    hint: "Something went wrong while judging. Try again.",
  },
};

function formatTime(time?: number) {
  if (time === undefined) return "—";
  return `${time.toFixed(3)} s`;
}

function formatMemory(memory?: number) {
  if (memory === undefined) return "—";
  if (memory >= 1024) return `${(memory / 1024).toFixed(1)} MB`;
  return `${memory} KB`;
}

function StatusIcon({ kind }: { kind: RunVerdictKind }) {
  const ok = kind === "Accepted";
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{
        background: ok ? "color-mix(in srgb, var(--ok) 18%, transparent)" : "color-mix(in srgb, var(--err) 18%, transparent)",
        color: ok ? "var(--ok)" : "var(--err)",
      }}
      aria-hidden
    >
      {ok ? "✓" : "✕"}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2">
      <div className="verdict-strip text-[var(--text-dim)]">{label}</div>
      <div className="mono mt-1 text-sm text-[var(--text)]">{value}</div>
    </div>
  );
}

function CodeBlock({
  label,
  children,
  tone = "default",
}: {
  label: string;
  children: string;
  tone?: "default" | "error" | "warn";
}) {
  const color =
    tone === "error"
      ? "var(--err)"
      : tone === "warn"
        ? "var(--warn)"
        : "var(--text)";

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
        {label}
      </div>
      <pre
        className="mono max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-xs leading-relaxed"
        style={{ color }}
      >
        {children || "—"}
      </pre>
    </div>
  );
}

function SampleCaseCard({
  testCase,
  highlighted,
}: {
  testCase: SampleCaseResult;
  highlighted: boolean;
}) {
  const meta = VERDICT_META[testCase.status];

  return (
    <article
      className={`run-case-card rounded-lg border bg-[var(--bg-raised)] p-3 transition ${
        highlighted
          ? "border-[var(--err)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--err)_35%,transparent)]"
          : "border-[var(--line)]"
      }`}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusIcon kind={testCase.status} />
          <div>
            <div className="text-sm font-semibold text-[var(--text)]">
              Sample Test Case {testCase.index}
            </div>
            <div className="text-xs text-[var(--text-dim)]">
              {formatTime(testCase.time)} · {formatMemory(testCase.memory)}
            </div>
          </div>
        </div>
        <span
          className="verdict-strip rounded px-2 py-1"
          style={{
            color: meta.color,
            background: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
          }}
        >
          {meta.label}
        </span>
      </header>

      <div className="space-y-3">
        <CodeBlock label="Input">{testCase.inputDisplay}</CodeBlock>
        {testCase.expectedOutput !== "" && (
          <CodeBlock label="Expected Output">{testCase.expectedOutput}</CodeBlock>
        )}
        <CodeBlock
          label="Your Output"
          tone={testCase.passed ? "default" : "error"}
        >
          {testCase.userOutput}
        </CodeBlock>
        {testCase.message && (
          <CodeBlock label="Message" tone="error">
            {testCase.message}
          </CodeBlock>
        )}
      </div>
    </article>
  );
}

function VerdictBanner({
  session,
}: {
  session: SampleRunSession;
}) {
  const meta = VERDICT_META[session.overall];
  const showMetrics =
    session.overall === "Accepted" ||
    session.overall === "Wrong Answer" ||
    session.cases.length > 0;

  return (
    <div
      className="run-result-enter rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: meta.color,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div
            className="display text-xl font-semibold"
            style={{ color: meta.color }}
          >
            {meta.label}
          </div>
          <p className="mt-1 text-sm text-[var(--text-dim)]">{meta.hint}</p>
        </div>
        {session.mode === "samples" && session.cases.length > 0 && (
          <div className="verdict-strip text-[var(--text-dim)]">
            {session.cases.filter((c) => c.passed).length}/{session.cases.length}{" "}
            samples
          </div>
        )}
      </div>

      {showMetrics && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Metric label="Runtime" value={formatTime(session.time)} />
          <Metric label="Memory" value={formatMemory(session.memory)} />
          {session.mode === "samples" && (
            <Metric
              label="Samples"
              value={`${session.cases.filter((c) => c.passed).length}/${session.cases.length}`}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function RunResultsEmpty() {
  return (
    <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--bg-raised)] px-4 py-8 text-center">
      <div className="verdict-strip mb-2 text-[var(--text-dim)]">No run yet</div>
      <p className="max-w-sm text-sm text-[var(--text-dim)]">
        Click Run to execute your code against the sample test cases.
      </p>
    </div>
  );
}

export function RunResultsLoading({
  label = "Running sample test cases…",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-8">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accent)]"
        aria-hidden
      />
      <p className="text-sm text-[var(--text-dim)]">{label}</p>
    </div>
  );
}

export default function RunResultsPanel({
  session,
  loading,
}: {
  session: SampleRunSession | null;
  loading?: boolean;
}) {
  if (loading) {
    return <RunResultsLoading />;
  }

  if (!session) {
    return <RunResultsEmpty />;
  }

  if (session.overall === "Compilation Error") {
    return (
      <div className="space-y-3">
        <VerdictBanner session={session} />
        <div className="run-result-enter rounded-lg border border-[var(--err)]/40 bg-[var(--bg-raised)] p-4">
          <div className="mb-2 text-sm font-semibold text-[var(--err)]">
            Compiler message
          </div>
          <pre className="mono max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-3 text-xs leading-relaxed text-[var(--err)]">
            {session.compileOutput || "Compilation failed."}
          </pre>
        </div>
      </div>
    );
  }

  if (
    (session.overall === "Runtime Error" ||
      session.overall === "Time Limit Exceeded" ||
      session.overall === "Memory Limit Exceeded" ||
      session.overall === "Internal Error") &&
    session.cases.length === 0
  ) {
    return (
      <div className="space-y-3">
        <VerdictBanner session={session} />
        {session.runtimeMessage && (
          <div className="run-result-enter rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
            <div className="mb-2 text-sm font-semibold" style={{ color: VERDICT_META[session.overall].color }}>
              {VERDICT_META[session.overall].label}
            </div>
            <pre className="mono max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-3 text-xs leading-relaxed text-[var(--err)]">
              {session.runtimeMessage}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <VerdictBanner session={session} />

      {session.overall === "Runtime Error" && session.runtimeMessage && (
        <div className="run-result-enter rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <div className="mb-2 text-sm font-semibold text-[var(--err)]">
            Runtime Error
          </div>
          <pre className="mono max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-3 text-xs leading-relaxed text-[var(--err)]">
            {session.runtimeMessage}
          </pre>
        </div>
      )}

      {session.cases.length > 0 && (
        <div className="space-y-3">
          <div className="verdict-strip text-[var(--text-dim)]">
            {session.mode === "samples" ? "Sample test results" : "Run output"}
          </div>
          {session.cases.map((testCase, idx) => (
            <SampleCaseCard
              key={testCase.index}
              testCase={testCase}
              highlighted={session.firstFailedIndex === idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}
