import { useMemo } from "react";
import DifficultyBadge from "../../../components/DifficultyBadge";
import {
  formatExample,
  parseExamples,
} from "../../../lib/examples";
import type { ProblemPublicDTO } from "../../../lib/types";

function parseTopics(topics: string[] | string | undefined): string[] {
  if (!topics) return [];
  if (Array.isArray(topics)) return topics.flatMap((t) => parseTopics(t));
  try {
    const parsed = JSON.parse(topics);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* plain */
  }
  return [topics];
}

function parseConstraints(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* plain text */
  }
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

type Props = {
  problem: ProblemPublicDTO;
  showHeader?: boolean;
  showDifficulty?: boolean;
};

export default function ProblemStatementPanel({
  problem,
  showHeader = true,
  showDifficulty = true,
}: Props) {
  const examples = useMemo(
    () => parseExamples(problem.examples),
    [problem.examples]
  );
  const constraints = useMemo(
    () => parseConstraints(problem.constraintsData),
    [problem.constraintsData]
  );
  const topics = useMemo(() => parseTopics(problem.topics), [problem.topics]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {showHeader && (
        <div className="border-b border-[var(--line)] bg-[var(--bg-raised)] px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="verdict-strip text-[var(--text-dim)]">
              Problem statement
            </span>
            {showDifficulty && (
              <DifficultyBadge difficulty={problem.difficulty} />
            )}
          </div>
          {topics.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <span
                  key={t}
                  className="rounded border border-[var(--line)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-dim)]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
        <div>
          <h2 className="verdict-strip mb-2 text-[var(--text-dim)]">
            Description
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
            {problem.description}
          </p>
        </div>

        {examples.length > 0 && (
          <div>
            <h2 className="verdict-strip mb-3 text-[var(--text-dim)]">
              Examples
            </h2>
            <div className="space-y-3">
              {examples.map((ex, index) => (
                <div
                  key={index}
                  className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] p-3"
                >
                  <p className="verdict-strip mb-2 text-[var(--text-dim)]">
                    Example {index + 1}
                  </p>
                  <div className="mono space-y-2 text-xs">
                    <div>
                      <span className="text-[var(--text-dim)]">Input: </span>
                      <span className="text-[var(--text)]">
                        {formatExample(ex.input)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-dim)]">Output: </span>
                      <span className="text-[var(--ok)]">
                        {formatExample(ex.output)}
                      </span>
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
        )}

        {constraints.length > 0 && (
          <div>
            <h2 className="verdict-strip mb-3 text-[var(--text-dim)]">
              Constraints
            </h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-[var(--text-dim)]">
              {constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export { parseTopics, parseConstraints };
