import { useState } from "react";
import { Link } from "react-router-dom";
import type {
  LearnLanguage,
  PracticeListItem,
  QuizQuestion,
} from "../types";

function resolveCode(
  code: Record<LearnLanguage, string> | string,
  language: LearnLanguage
): string {
  return typeof code === "string" ? code : code[language];
}

export function PredictRevealBlock({
  caption,
  question,
  code,
  answer,
  language,
}: {
  caption?: string;
  question: string;
  code: Record<LearnLanguage, string> | string;
  answer: string;
  language: LearnLanguage;
}) {
  const [open, setOpen] = useState(false);
  return (
    <figure className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/40">
      <figcaption className="border-b border-[var(--line)] px-4 py-2 text-xs text-[var(--text-dim)]">
        {caption ?? "Try it yourself"}
      </figcaption>
      <div className="space-y-3 p-4">
        <p className="text-sm font-medium text-[var(--text)]">{question}</p>
        <pre className="mono overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] p-3 text-xs leading-relaxed text-[var(--text)]">
          <code>{resolveCode(code, language)}</code>
        </pre>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
        >
          {open ? "Hide answer" : "Reveal answer"}
        </button>
        {open && (
          <p className="rounded-xl border border-[var(--ok)]/30 bg-[var(--ok)]/10 px-3 py-2 text-sm text-[var(--ok)]">
            {answer}
          </p>
        )}
      </div>
    </figure>
  );
}

export function MistakePairBlock({
  note,
  wrong,
  correct,
  language,
}: {
  note: string;
  wrong: Record<LearnLanguage, string> | string;
  correct: Record<LearnLanguage, string> | string;
  language: LearnLanguage;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--err)]/25 bg-[var(--err)]/5 p-4">
      <p className="verdict-strip text-[10px] text-[var(--err)]">
        Common mistake
      </p>
      <p className="text-sm text-[var(--text)]">{note}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-[var(--err)]/30">
          <div className="border-b border-[var(--line)] bg-[var(--err)]/10 px-3 py-1.5 text-[11px] text-[var(--err)]">
            Incorrect
          </div>
          <pre className="mono overflow-x-auto bg-[var(--bg-inset)] p-3 text-xs text-[var(--text)]">
            <code>{resolveCode(wrong, language)}</code>
          </pre>
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--ok)]/30">
          <div className="border-b border-[var(--line)] bg-[var(--ok)]/10 px-3 py-1.5 text-[11px] text-[var(--ok)]">
            Correct
          </div>
          <pre className="mono overflow-x-auto bg-[var(--bg-inset)] p-3 text-xs text-[var(--text)]">
            <code>{resolveCode(correct, language)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function QuizItem({
  q,
  index,
  language,
}: {
  q: QuizQuestion;
  index: number;
  language: LearnLanguage;
}) {
  const [choice, setChoice] = useState<string | number | boolean | null>(null);
  const [checked, setChecked] = useState(false);

  const correct =
    q.kind === "mcq"
      ? choice === q.answerIndex
      : q.kind === "trueFalse"
        ? choice === q.answer
        : typeof choice === "string" &&
          choice.trim().toLowerCase() === q.answer.trim().toLowerCase();

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)]/40 p-3">
      <p className="text-sm font-medium text-[var(--text)]">
        {index + 1}. {q.prompt}
      </p>
      {q.kind === "predict" && q.code && (
        <pre className="mono mt-2 overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--bg)]/40 p-2 text-xs">
          <code>{resolveCode(q.code, language)}</code>
        </pre>
      )}
      {q.kind === "mcq" && (
        <div className="mt-2 space-y-1.5">
          {q.choices.map((c, i) => (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-dim)]"
            >
              <input
                type="radio"
                name={`quiz-${index}`}
                checked={choice === i}
                onChange={() => {
                  setChoice(i);
                  setChecked(false);
                }}
              />
              {c}
            </label>
          ))}
        </div>
      )}
      {q.kind === "trueFalse" && (
        <div className="mt-2 flex gap-3">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => {
                setChoice(v);
                setChecked(false);
              }}
              className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
                choice === v
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--text-dim)]"
              }`}
            >
              {v ? "True" : "False"}
            </button>
          ))}
        </div>
      )}
      {(q.kind === "predict" || q.kind === "fillBlank") && (
        <input
          value={typeof choice === "string" ? choice : ""}
          onChange={(e) => {
            setChoice(e.target.value);
            setChecked(false);
          }}
          placeholder="Your answer"
          className="mono mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)]"
        />
      )}
      <button
        type="button"
        onClick={() => setChecked(true)}
        disabled={choice === null || choice === ""}
        className="mt-2 rounded-lg border border-[var(--line)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-dim)] disabled:opacity-40"
      >
        Check
      </button>
      {checked && (
        <p
          className={`mt-2 text-xs ${
            correct ? "text-[var(--ok)]" : "text-[var(--err)]"
          }`}
        >
          {correct ? "Correct." : `Not quite — answer: ${
            q.kind === "mcq"
              ? q.choices[q.answerIndex]
              : q.kind === "trueFalse"
                ? String(q.answer)
                : q.answer
          }`}
          {q.explanation ? ` ${q.explanation}` : ""}
        </p>
      )}
    </div>
  );
}

export function QuizBlock({
  caption,
  questions,
  language,
}: {
  caption?: string;
  questions: QuizQuestion[];
  language: LearnLanguage;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--info)]/25 bg-[var(--info)]/5 p-4">
      <p className="verdict-strip text-[10px] text-[var(--info)]">
        {caption ?? "Quick quiz"}
      </p>
      {questions.map((q, i) => (
        <QuizItem key={i} q={q} index={i} language={language} />
      ))}
    </div>
  );
}

export function PracticeListBlock({
  caption,
  items,
}: {
  caption?: string;
  items: PracticeListItem[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
      <div className="border-b border-[var(--line)] px-4 py-2 text-xs text-[var(--text-dim)]">
        {caption ?? "Practice problems"}
      </div>
      <ul className="divide-y divide-[var(--line)]">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text)]">
                {item.title}
              </p>
              {item.difficulty && (
                <p className="mt-0.5 text-[11px] text-[var(--text-dim)]">
                  {item.difficulty}
                </p>
              )}
            </div>
            {item.problemId != null ? (
              <Link
                to={`/problems/${item.problemId}`}
                className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--accent)]"
              >
                Solve
              </Link>
            ) : (
              <span className="text-[11px] text-[var(--text-dim)]">
                Coming soon
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
