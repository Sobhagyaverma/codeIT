import type { JudgeVerdictDTO } from "../lib/types";

const VERDICT_COLOR: Record<string, string> = {
  Accepted: "var(--ok)",
  "Wrong Answer": "var(--err)",
  "Runtime Error": "var(--err)",
  "Time Limit Exceeded": "var(--warn)",
  "Compilation Error": "var(--err)",
};

const ENGINE_LABEL: Record<string, string> = {
  "compile-once": "Compile once",
  "progressive-batch": "Batch",
};

export default function VerdictPanel({
  verdict,
}: {
  verdict: JudgeVerdictDTO;
}) {
  const color = VERDICT_COLOR[verdict.verdict] || "var(--info)";

  const passed = verdict.hiddenSummary?.passed ?? verdict.passedCount ?? 0;
  const total = verdict.hiddenSummary?.total ?? verdict.totalCount ?? 0;
  const progress = total > 0 ? (passed / total) * 100 : 0;
  const engineLabel = verdict.engine
    ? ENGINE_LABEL[verdict.engine] ?? verdict.engine
    : null;

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <div className="verdict-strip flex items-center justify-between gap-3">
        <span style={{ color }} className="text-sm font-semibold">
          {verdict.verdict}
        </span>

        <div className="flex items-center gap-2 text-[var(--text-dim)]">
          {engineLabel && (
            <span className="rounded border border-[var(--line)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
              {engineLabel}
            </span>
          )}
          <span>
            {total > 0 ? `${passed}/${total} passed` : "Result available"}
          </span>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-inset)]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            background: color,
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-5 text-xs text-[var(--text-dim)]">
        <span>
          time: {verdict.time !== undefined ? `${verdict.time}s` : "—"}
        </span>

        <span>
          memory: {verdict.memory !== undefined ? `${verdict.memory}kb` : "—"}
        </span>

        {verdict.failedTestIndex !== null &&
          verdict.failedTestIndex !== undefined && (
            <span className="text-[var(--err)]">
              failed on test #{verdict.failedTestIndex + 1}
            </span>
          )}
      </div>
    </div>
  );
}
