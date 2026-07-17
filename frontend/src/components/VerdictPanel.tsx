import type { JudgeVerdictDTO } from "../lib/types";

const VERDICT_COLOR: Record<string, string> = {
  Accepted: "var(--ok)",
  "Wrong Answer": "var(--err)",
  "Runtime Error": "var(--err)",
  "Time Limit Exceeded": "var(--warn)",
  "Compilation Error": "var(--err)",
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

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <div className="verdict-strip flex items-center justify-between">
        <span style={{ color }} className="text-sm font-semibold">
          {verdict.verdict}
        </span>

        <span className="text-[var(--text-dim)]">
          {total > 0 ? `${passed}/${total} passed` : "Result available"}
        </span>
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

      <div className="mt-3 flex gap-5 text-xs text-[var(--text-dim)]">
        <span>
          time: {verdict.time !== undefined ? `${verdict.time}s` : "—"}
        </span>

        <span>
          memory: {verdict.memory !== undefined ? `${verdict.memory}kb` : "—"}
        </span>

        {verdict.failedTestIndex !== null &&
          verdict.failedTestIndex !== undefined && (
            <span className="text-[var(--err)]">
              failed on test #{verdict.failedTestIndex}
            </span>
          )}
      </div>
    </div>
  );
}