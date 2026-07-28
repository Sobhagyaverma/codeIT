import {
  exampleOutputToExpected,
  formatExample,
  type Example,
} from "../lib/examples";

/** Monospace I/O block that preserves exact pattern newlines and spaces. */
export function IoPre({
  children,
  tone = "default",
}: {
  children: string;
  tone?: "default" | "ok" | "dim" | "error";
}) {
  const color =
    tone === "ok"
      ? "text-[var(--ok)]"
      : tone === "dim"
        ? "text-[var(--text-dim)]"
        : tone === "error"
          ? "text-[var(--err)]"
          : "text-[var(--text)]";

  return (
    <pre
      className={`mono max-h-56 overflow-auto whitespace-pre rounded-md border border-[var(--line)] bg-[var(--bg)]/40 px-3 py-2 text-xs leading-[1.55] tracking-wide ${color}`}
    >
      {children || "—"}
    </pre>
  );
}

export function ProblemExamples({ examples }: { examples: Example[] }) {
  if (examples.length === 0) return null;

  return (
    <div>
      <h2 className="verdict-strip mb-3 text-[var(--text-dim)]">Examples</h2>
      <div className="space-y-3">
        {examples.map((ex, index) => (
          <div
            key={index}
            className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] p-3"
          >
            <p className="verdict-strip mb-2 text-[var(--text-dim)]">
              Example {index + 1}
            </p>
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
                  Input
                </div>
                <IoPre>{formatExample(ex.input)}</IoPre>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
                  Output
                </div>
                <IoPre tone="ok">{exampleOutputToExpected(ex.output)}</IoPre>
              </div>
              {ex.explanation && (
                <p className="font-sans text-[var(--text-dim)]">
                  {ex.explanation}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
