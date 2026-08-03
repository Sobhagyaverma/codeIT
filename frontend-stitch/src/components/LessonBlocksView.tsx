import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IoPre } from "./IoPre";
import type { LearnLanguage, LessonBlock, QuizQuestion } from "../features/learn/types";

function pickLangText(
  value: Record<LearnLanguage, string> | string,
  lang: LearnLanguage
): string {
  if (typeof value === "string") return value;
  return value[lang] ?? value.python ?? Object.values(value)[0] ?? "";
}

const LANG_LABEL: Record<LearnLanguage, string> = {
  python: "Python 3",
  java: "Java",
  cpp: "C++",
};

function QuizBlock({
  questions,
  caption,
}: {
  questions: QuizQuestion[];
  caption?: string;
}) {
  const [selected, setSelected] = useState<Record<number, number | boolean | string>>(
    {}
  );
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  return (
    <div className="glass-panel mt-4 rounded-xl border border-primary/20 p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl text-primary">quiz</span>
        <h3 className="display text-xl text-on-surface">
          {caption || "Knowledge Check"}
        </h3>
      </div>
      <div className="space-y-8">
        {questions.map((q, qi) => {
          const isRevealed = Boolean(revealed[qi]);
          return (
            <div key={qi}>
              <p className="mb-4 font-medium text-on-surface">{q.prompt}</p>
              {q.kind === "mcq" && (
                <div className="mb-4 space-y-3">
                  {q.choices.map((choice, ci) => {
                    const active = selected[qi] === ci;
                    const correct = isRevealed && ci === q.answerIndex;
                    const wrong =
                      isRevealed && active && ci !== q.answerIndex;
                    return (
                      <label
                        key={choice}
                        className={`group flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all ${
                          correct
                            ? "border-easy bg-easy/10"
                            : wrong
                              ? "border-hard bg-hard/10"
                              : active
                                ? "border-primary bg-primary/10"
                                : "border-outline-variant/30 hover:border-primary/50 hover:bg-surface-bright/20"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`quiz-${qi}`}
                          className="h-5 w-5 border-outline-variant bg-transparent text-primary focus:ring-primary"
                          checked={active}
                          onChange={() =>
                            setSelected((s) => ({ ...s, [qi]: ci }))
                          }
                        />
                        <span
                          className={
                            active || correct
                              ? "font-medium text-on-surface"
                              : "text-on-surface-variant group-hover:text-on-surface"
                          }
                        >
                          {choice}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {q.kind === "trueFalse" && (
                <div className="mb-4 flex gap-3">
                  {[true, false].map((val) => {
                    const active = selected[qi] === val;
                    const correct = isRevealed && val === q.answer;
                    return (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() =>
                          setSelected((s) => ({ ...s, [qi]: val }))
                        }
                        className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                          correct
                            ? "border-easy bg-easy/10 text-easy"
                            : active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-outline-variant/30 text-on-surface-variant"
                        }`}
                      >
                        {val ? "True" : "False"}
                      </button>
                    );
                  })}
                </div>
              )}
              {(q.kind === "predict" || q.kind === "fillBlank") && (
                <div className="mb-4 space-y-3">
                  {"code" in q && q.code && (
                    <IoPre>
                      {typeof q.code === "string"
                        ? q.code
                        : pickLangText(q.code, "python")}
                    </IoPre>
                  )}
                  <input
                    className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                    value={String(selected[qi] ?? "")}
                    onChange={(e) =>
                      setSelected((s) => ({ ...s, [qi]: e.target.value }))
                    }
                    placeholder="Your answer"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => setRevealed((r) => ({ ...r, [qi]: true }))}
                className="rounded-lg border border-outline-variant/30 bg-surface-bright px-6 py-2 text-sm text-on-surface transition-colors hover:bg-surface-container-highest"
              >
                Check Answer
              </button>
              {isRevealed && (
                <p className="mt-3 text-sm text-on-surface-variant">
                  <span className="text-primary">Answer: </span>
                  {q.kind === "mcq"
                    ? q.choices[q.answerIndex]
                    : String(q.answer)}
                  {q.explanation ? ` — ${q.explanation}` : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LessonBlocksView({
  blocks,
  language,
}: {
  blocks: LessonBlock[];
  language: LearnLanguage;
}) {
  const langLabel = LANG_LABEL[language];

  return (
    <article className="space-y-12">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "hook":
            return (
              <div
                key={i}
                className="border-l-4 border-primary py-2 pl-6 text-xl italic text-on-surface"
              >
                {block.text}
              </div>
            );
          case "paragraph":
          case "langParagraph":
            return (
              <p
                key={i}
                className="leading-relaxed text-on-surface-variant whitespace-pre-wrap"
              >
                {block.type === "langParagraph"
                  ? pickLangText(block.text, language)
                  : block.text}
              </p>
            );
          case "heading":
            return (
              <h2
                key={i}
                className="display mb-2 flex items-center gap-3 text-2xl text-on-surface md:text-[32px] md:leading-10"
              >
                {block.text}
                <div className="ml-4 h-px flex-1 bg-outline-variant/30" />
              </h2>
            );
          case "intro":
            return (
              <div
                key={i}
                className="glass-panel group relative overflow-hidden rounded-xl p-6 md:p-8"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative z-10 grid gap-8 md:grid-cols-3">
                  {(
                    [
                      ["data_object", "What", block.what],
                      ["psychology", "Why", block.why],
                      ["route", "Where", block.where],
                    ] as const
                  ).map(([icon, label, text]) => (
                    <div key={label}>
                      <h3 className="display mb-2 flex items-center gap-2 text-lg text-primary">
                        <span className="material-symbols-outlined">{icon}</span>
                        {label}
                      </h3>
                      <p className="text-sm text-on-surface-variant">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          case "analogy":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-primary/40 pl-4 text-on-surface-variant"
              >
                {block.text}
                {block.caption && (
                  <footer className="mt-1 text-xs text-on-surface-variant/70">
                    {block.caption}
                  </footer>
                )}
              </blockquote>
            );
          case "code": {
            const code = pickLangText(block.code, language);
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-lg"
              >
                <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-high px-4 py-2">
                  <span className="text-xs uppercase tracking-wider text-on-surface-variant">
                    {block.caption || langLabel}
                  </span>
                  <button
                    type="button"
                    className="text-on-surface-variant transition-colors hover:text-primary"
                    onClick={() => void navigator.clipboard?.writeText(code)}
                    aria-label="Copy code"
                  >
                    <span className="material-symbols-outlined text-sm">
                      content_copy
                    </span>
                  </button>
                </div>
                <div className="p-4">
                  <IoPre className="border-0 bg-transparent p-0">{code}</IoPre>
                </div>
              </div>
            );
          }
          case "outputPattern":
            return (
              <div key={i} className="space-y-3">
                {block.caption && (
                  <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                    {block.caption}
                  </p>
                )}
                {block.samples.map((s) => (
                  <div key={s.label} className="space-y-1">
                    <p className="text-sm text-on-surface">{s.label}</p>
                    <IoPre tone="ok">{s.output}</IoPre>
                  </div>
                ))}
              </div>
            );
          case "callout": {
            const tip = block.tone === "tip";
            const mistake = block.tone === "mistake";
            return (
              <div
                key={i}
                className={`relative overflow-hidden rounded-xl border p-5 ${
                  tip
                    ? "border-[#38bdf8]/30 bg-[#0f172a]/80"
                    : mistake
                      ? "border-error/30 bg-error-container/20"
                      : "border-primary/30 bg-primary/10"
                }`}
              >
                <div
                  className={`absolute left-0 top-0 h-full w-1 ${
                    tip
                      ? "bg-[#38bdf8]"
                      : mistake
                        ? "bg-error"
                        : "bg-primary"
                  }`}
                />
                <h4
                  className={`mb-2 flex items-center gap-2 text-base ${
                    tip
                      ? "text-[#38bdf8]"
                      : mistake
                        ? "text-error"
                        : "text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {tip ? "lightbulb" : mistake ? "warning" : "auto_awesome"}
                  </span>
                  {tip ? "Pro Tip" : mistake ? "Watch Out" : "Fun Fact"}
                </h4>
                <p className="text-sm text-on-surface-variant">{block.text}</p>
              </div>
            );
          }
          case "list":
            return (
              <ul
                key={i}
                className="list-inside list-disc space-y-2 text-on-surface-variant"
              >
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "keyTakeaways":
            return (
              <div
                key={i}
                className="rounded-xl border border-outline-variant/10 bg-surface-container p-6"
              >
                <h3 className="display mb-4 flex items-center gap-2 text-lg text-on-surface">
                  <span className="material-symbols-outlined text-primary">
                    fact_check
                  </span>
                  Key Takeaways
                </h3>
                <ul className="space-y-3">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="material-symbols-outlined mt-1 text-sm text-primary">
                        check
                      </span>
                      <span className="text-sm text-on-surface-variant">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          case "quiz":
            return (
              <QuizBlock
                key={i}
                questions={block.questions}
                caption={block.caption}
              />
            );
          case "practiceList":
            return (
              <div
                key={i}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-6"
              >
                {block.caption && (
                  <p className="mb-3 font-medium text-on-surface">
                    {block.caption}
                  </p>
                )}
                <ul className="space-y-2">
                  {block.items.map((item) => (
                    <li key={item.title}>
                      {item.problemId ? (
                        <Link
                          to={`/problems/${item.problemId}`}
                          className="text-primary hover:underline"
                        >
                          {item.title}
                          {item.difficulty ? ` · ${item.difficulty}` : ""}
                        </Link>
                      ) : (
                        <span className="text-on-surface-variant">
                          {item.title}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          case "bridge":
            return (
              <div
                key={i}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4"
              >
                <p className="mb-1 font-medium text-primary">
                  Next: {block.nextTitle}
                </p>
                <p className="text-sm text-on-surface-variant">{block.text}</p>
              </div>
            );
          case "mistakePair":
            return (
              <div key={i} className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-hard">Wrong</p>
                  <IoPre tone="error">
                    {pickLangText(block.wrong, language)}
                  </IoPre>
                </div>
                <div>
                  <p className="mb-1 text-xs text-easy">Correct</p>
                  <IoPre tone="ok">
                    {pickLangText(block.correct, language)}
                  </IoPre>
                </div>
                <p className="text-sm text-on-surface-variant md:col-span-2">
                  {block.note}
                </p>
              </div>
            );
          case "predictReveal":
            return (
              <div
                key={i}
                className="space-y-2 rounded-xl border border-outline-variant/30 p-4"
              >
                <p className="font-medium text-on-surface">{block.question}</p>
                <IoPre>{pickLangText(block.code, language)}</IoPre>
                <details className="text-sm text-on-surface-variant">
                  <summary className="cursor-pointer text-primary">
                    Reveal answer
                  </summary>
                  <p className="mt-2">{block.answer}</p>
                </details>
              </div>
            );
          case "syntaxWords":
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-on-surface-variant">
                      <th className="py-1 pr-4">Term</th>
                      <th className="py-1">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(block.words[language] || block.words.python || []).map(
                      (w) => (
                        <tr
                          key={w.term}
                          className="border-t border-outline-variant/20"
                        >
                          <td className="mono py-2 pr-4 text-primary">
                            {w.term}
                          </td>
                          <td className="py-2 text-on-surface-variant">
                            {w.meaning}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            );
          case "truthTable":
          case "stateTrace":
          case "expressionSteps":
            return (
              <div
                key={i}
                className="rounded-xl border border-outline-variant/30 p-4 text-sm text-on-surface-variant"
              >
                {"caption" in block && block.caption && (
                  <p className="mb-2 font-medium text-on-surface">
                    {block.caption}
                  </p>
                )}
                {"expression" in block && (
                  <IoPre className="mb-2">{block.expression}</IoPre>
                )}
                {"steps" in block && Array.isArray(block.steps) && (
                  <ol className="list-inside list-decimal space-y-1">
                    {block.steps.map((s, si) => (
                      <li key={si}>
                        {typeof s === "string" ? s : `${s.label}: ${s.state}`}
                      </li>
                    ))}
                  </ol>
                )}
                {"headers" in block && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr>
                          {block.headers.map((h) => (
                            <th key={h} className="p-1">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="mono p-1">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          default:
            return null;
        }
      })}
    </article>
  );
}

export function useLessonNav(
  lessons: { order: number; slug: string; title: string }[],
  currentSlug: string
) {
  return useMemo(() => {
    const sorted = [...lessons].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((l) => l.slug === currentSlug);
    return {
      sorted,
      index: idx,
      prev: idx > 0 ? sorted[idx - 1] : null,
      next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null,
      position: idx >= 0 ? idx + 1 : 0,
      total: sorted.length,
    };
  }, [lessons, currentSlug]);
}
