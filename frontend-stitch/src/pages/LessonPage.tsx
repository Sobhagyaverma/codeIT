import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { IoPre } from "../components/IoPre";
import {
  getFirstLesson,
  getLearnSection,
  getLesson,
  getNextLearnSection,
} from "../features/learn/content/sections";
import { useLearnLanguage } from "../features/learn/hooks/useLearnLanguage";
import { useLessonProgress } from "../features/learn/hooks/useLessonProgress";
import {
  lessonProblemIds,
  type LearnLanguage,
  type LessonBlock,
} from "../features/learn/types";
import { ApiError, getProblems, getUserSubmissions } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const LANGS: { id: LearnLanguage; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
];

function pickLangText(
  value: Record<LearnLanguage, string> | string,
  lang: LearnLanguage
): string {
  if (typeof value === "string") return value;
  return value[lang] ?? value.python ?? Object.values(value)[0] ?? "";
}

function LessonBlocksView({
  blocks,
  language,
}: {
  blocks: LessonBlock[];
  language: LearnLanguage;
}) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "hook":
          case "paragraph":
            return (
              <p
                key={i}
                className="whitespace-pre-wrap leading-relaxed text-on-surface-variant"
              >
                {block.text}
              </p>
            );
          case "langParagraph":
            return (
              <p
                key={i}
                className="whitespace-pre-wrap leading-relaxed text-on-surface-variant"
              >
                {pickLangText(block.text, language)}
              </p>
            );
          case "heading":
            return (
              <h2
                key={i}
                className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface"
              >
                {block.text}
              </h2>
            );
          case "intro":
            return (
              <div
                key={i}
                className="space-y-2 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-sm text-on-surface-variant"
              >
                <p>
                  <strong className="text-on-surface">What:</strong> {block.what}
                </p>
                <p>
                  <strong className="text-on-surface">Why:</strong> {block.why}
                </p>
                <p>
                  <strong className="text-on-surface">Where:</strong>{" "}
                  {block.where}
                </p>
              </div>
            );
          case "analogy":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-primary/50 pl-4 text-on-surface-variant"
              >
                {block.text}
                {block.caption && (
                  <footer className="mt-1 text-xs text-on-surface-variant/70">
                    {block.caption}
                  </footer>
                )}
              </blockquote>
            );
          case "code":
            return (
              <div key={i} className="space-y-2">
                {block.caption && (
                  <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                    {block.caption}
                  </p>
                )}
                <IoPre>{pickLangText(block.code, language)}</IoPre>
              </div>
            );
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
          case "list":
          case "keyTakeaways":
            return (
              <div key={i}>
                {block.type === "keyTakeaways" && (
                  <p className="mb-2 font-label-md text-on-surface">
                    Key takeaways
                  </p>
                )}
                <ul className="list-inside list-disc space-y-1 text-on-surface-variant">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          case "callout":
            return (
              <div
                key={i}
                className={`rounded-xl border p-4 text-sm ${
                  block.tone === "tip"
                    ? "border-easy/40 bg-easy/10 text-easy"
                    : block.tone === "mistake"
                      ? "border-hard/40 bg-hard/10 text-hard"
                      : "border-primary/40 bg-primary/10 text-primary"
                }`}
              >
                {block.text}
              </div>
            );
          case "practiceList":
            return (
              <div key={i} className="space-y-2">
                {block.caption && (
                  <p className="font-label-md text-on-surface">{block.caption}</p>
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
                      {item.hint && (
                        <p className="text-xs text-on-surface-variant">
                          {item.hint}
                        </p>
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
                <p className="font-label-md mb-1 text-primary">
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
              <div key={i} className="space-y-2 rounded-xl border border-outline-variant/30 p-4">
                <p className="font-label-md text-on-surface">{block.question}</p>
                <IoPre>{pickLangText(block.code, language)}</IoPre>
                <details className="text-sm text-on-surface-variant">
                  <summary className="cursor-pointer text-primary">
                    Reveal answer
                  </summary>
                  <p className="mt-2">{block.answer}</p>
                </details>
              </div>
            );
          case "quiz":
            return (
              <div
                key={i}
                className="space-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4"
              >
                {block.caption && (
                  <p className="font-label-md text-on-surface">{block.caption}</p>
                )}
                {block.questions.map((q, qi) => (
                  <div key={qi} className="text-sm text-on-surface-variant">
                    <p className="mb-1 text-on-surface">{q.prompt}</p>
                    {"choices" in q && (
                      <ul className="list-inside list-disc">
                        {q.choices.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    )}
                    <details className="mt-1">
                      <summary className="cursor-pointer text-primary">
                        Answer
                      </summary>
                      <p className="mt-1">
                        {"answerIndex" in q
                          ? q.choices[q.answerIndex]
                          : "answer" in q
                            ? String(q.answer)
                            : ""}
                        {q.explanation ? ` — ${q.explanation}` : ""}
                      </p>
                    </details>
                  </div>
                ))}
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
                        <tr key={w.term} className="border-t border-outline-variant/20">
                          <td className="mono py-2 pr-4 text-primary">{w.term}</td>
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
                  <p className="mb-2 font-label-md text-on-surface">
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
                        {typeof s === "string"
                          ? s
                          : `${s.label}: ${s.state}`}
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
                              <td key={ci} className="p-1 font-code-sm">
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
    </div>
  );
}

export default function LessonPage() {
  const { sectionId = "", slug = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage } = useLearnLanguage();

  const section = getLearnSection(sectionId);
  const lesson = getLesson(sectionId, slug);
  const lessons = section?.lessons ?? [];

  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        setSolvedIds(new Set());
        return;
      }
      try {
        const [problems, submissions] = await Promise.all([
          getProblems(),
          getUserSubmissions(user.id),
        ]);
        void problems;
        const set = new Set<number>();
        for (const s of submissions) {
          const v = (s.verdict || "").toUpperCase();
          if (v === "ACCEPTED" || v.startsWith("ACCEPTED")) {
            set.add(s.problemId);
          }
        }
        if (!cancelled) setSolvedIds(set);
      } catch (err) {
        if (!(err instanceof ApiError)) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const { isRead, markRead } = useLessonProgress(
    sectionId,
    lessons,
    solvedIds
  );

  const problemIds = useMemo(
    () => (lesson ? lessonProblemIds(lesson) : []),
    [lesson]
  );

  // Pure solve with single problem → jump to workspace
  useEffect(() => {
    if (!lesson) return;
    if (
      lesson.kind === "solve" &&
      problemIds.length === 1 &&
      !lesson.blocks.some((b) => b.type === "practiceList")
    ) {
      navigate(`/problems/${problemIds[0]}`, { replace: true });
    }
  }, [lesson, problemIds, navigate]);

  if (!section || !lesson) {
    return <Navigate to="/dsa-sheet" replace />;
  }

  const sorted = [...lessons].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((l) => l.slug === lesson.slug);
  const nextLesson = sorted[idx + 1];
  const nextSection = !nextLesson ? getNextLearnSection(sectionId) : undefined;
  const nextHref = nextLesson
    ? `/dsa-sheet/${sectionId}/${nextLesson.slug}`
    : nextSection
      ? `/dsa-sheet/${nextSection.id}/${getFirstLesson(nextSection.id)?.slug}`
      : "/dsa-sheet";

  const done = isRead(lesson.slug);

  const onMarkDone = () => {
    markRead(lesson.slug);
    if (nextHref) navigate(nextHref);
  };

  return (
    <div className="font-body-md flex min-h-screen flex-col bg-background text-on-surface">
      <AppNav activeHint="/dsa-sheet" />

      <main className="mx-auto mt-16 w-full max-w-3xl flex-1 px-margin-mobile py-8 md:px-margin-desktop">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/dsa-sheet"
            className="font-label-md text-sm text-on-surface-variant hover:text-primary"
          >
            ← DSA Sheet
          </Link>
          <div className="flex rounded-lg bg-surface-container-highest p-1">
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLanguage(l.id)}
                className={`font-label-md text-label-md rounded-md px-3 py-1 transition-colors ${
                  language === l.id
                    ? "bg-surface-dim text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <p className="font-code-sm text-code-sm mb-2 uppercase tracking-wider text-primary">
          {section.title} · Lesson {lesson.order}
        </p>
        <h1 className="font-headline-lg text-headline-lg mb-2 text-on-surface">
          {lesson.title}
        </h1>
        <p className="mb-8 text-on-surface-variant">{lesson.teaser}</p>

        <LessonBlocksView blocks={lesson.blocks} language={language} />

        {problemIds.length > 0 && (
          <div className="mt-8 space-y-2 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
            <p className="font-label-md text-on-surface">Practice</p>
            {problemIds.map((id) => (
              <Link
                key={id}
                to={`/problems/${id}`}
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]">
                  play_arrow
                </span>
                Open problem #{id}
                {solvedIds.has(id) && (
                  <span className="text-xs text-easy">Solved</span>
                )}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 pt-6">
          <span
            className={`text-sm ${done ? "text-easy" : "text-on-surface-variant"}`}
          >
            {done ? "Marked complete" : "Not marked complete yet"}
          </span>
          <button
            type="button"
            onClick={onMarkDone}
            className="font-label-md text-label-md rounded bg-primary px-4 py-2 text-on-primary transition-colors hover:bg-primary-fixed"
          >
            {done ? "Continue" : "Mark as done & continue"}
          </button>
        </div>
      </main>
    </div>
  );
}
