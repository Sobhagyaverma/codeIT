import { useState } from "react";
import { correctCode, explainCode } from "../lib/api";
import type { AIRequest, AIResponse } from "../lib/types";
import { Loading, ErrorState } from "./Loading";

interface Props {
  baseRequest: Omit<AIRequest, "question">;
  onApplyCorrectedCode: (code: string) => void;
}

/** Very small markdown-ish renderer: bold, inline code, line breaks. Good
 * enough for AI explanations without pulling in a markdown dependency. */
function renderMarkdownLite(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <p key={i} className="mb-2 last:mb-0">
      {line
        .split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
        .filter(Boolean)
        .map((chunk, j) => {
          if (chunk.startsWith("`") && chunk.endsWith("`")) {
            return (
              <code key={j} className="mono rounded bg-[var(--bg-inset)] px-1 py-0.5 text-[var(--info)]">
                {chunk.slice(1, -1)}
              </code>
            );
          }
          if (chunk.startsWith("**") && chunk.endsWith("**")) {
            return <strong key={j}>{chunk.slice(2, -2)}</strong>;
          }
          return <span key={j}>{chunk}</span>;
        })}
    </p>
  ));
}

export default function AIPanel({ baseRequest, onApplyCorrectedCode }: Props) {
  const [mode, setMode] = useState<"explain" | "correct" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [question, setQuestion] = useState("");

  const run = async (m: "explain" | "correct") => {
    if (loading) return; // debounce / in-flight lock
    setMode(m);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fn = m === "explain" ? explainCode : correctCode;
      const res = await fn({ ...baseRequest, question: question || undefined });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="display text-sm font-semibold text-[var(--text)]">AI Help</h3>
        <div className="flex gap-2">
          <button
            onClick={() => run("explain")}
            disabled={loading}
            className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[var(--info)] hover:text-[var(--info)] disabled:opacity-40"
          >
            Explain
          </button>
          <button
            onClick={() => run("correct")}
            disabled={loading}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[#0a0d12] transition hover:brightness-110 disabled:opacity-40"
          >
            Fix my code
          </button>
        </div>
      </div>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Optional follow-up question..."
        className="mb-3 w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--info)] focus:outline-none"
      />

      {loading && <Loading label={mode === "explain" ? "Explaining" : "Finding a fix"} />}
      {error && <ErrorState message={error} />}

      {result && !loading && (
        <div className="space-y-4">
          <div className="text-sm leading-relaxed text-[var(--text)]">
            {renderMarkdownLite(result.explanation)}
          </div>

          {result.hints && result.hints.length > 0 && (
            <div>
              <div className="verdict-strip mb-1 text-[var(--text-dim)]">Hints</div>
              <ul className="list-inside list-disc space-y-1 text-sm text-[var(--text-dim)]">
                {result.hints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {result.correctedCode && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="verdict-strip text-[var(--text-dim)]">Corrected code</span>
                <button
                  onClick={() => onApplyCorrectedCode(result.correctedCode!)}
                  className="rounded-md border border-[var(--ok)] px-2 py-1 text-xs font-medium text-[var(--ok)] hover:bg-[var(--ok)]/10"
                >
                  Apply to editor
                </button>
              </div>
              <pre className="mono max-h-64 overflow-auto rounded-md bg-[var(--bg-inset)] p-3 text-xs text-[var(--text)]">
                {result.correctedCode}
              </pre>
            </div>
          )}

          {result.citations && result.citations.length > 0 && (
            <div>
              <div className="verdict-strip mb-1 text-[var(--text-dim)]">Citations</div>
              <div className="space-y-1">
                {result.citations.map((c, i) => (
                  <div key={i} className="mono text-xs text-[var(--text-dim)]">
                    [{c.source}:{c.id}] {c.snippet}
                  </div>
                ))}
              </div>
            </div>
          )}

          {typeof result.confidence === "number" && (
            <div className="verdict-strip text-[var(--text-dim)]">
              confidence: {(result.confidence * 100).toFixed(0)}%
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <p className="text-sm text-[var(--text-dim)]">
          Ask the AI to explain your code or fix a failing submission.
        </p>
      )}
    </div>
  );
}
