import type { LearnLanguage, LessonBlock } from "../types";

const CALLOUT_STYLES: Record<
  "tip" | "mistake" | "fun-fact",
  { label: string; className: string }
> = {
  tip: {
    label: "Tip",
    className: "border-[var(--info)]/35 bg-[var(--info)]/10 text-[var(--text)]",
  },
  mistake: {
    label: "Watch out",
    className: "border-[var(--err)]/35 bg-[var(--err)]/10 text-[var(--text)]",
  },
  "fun-fact": {
    label: "Fun fact",
    className:
      "border-[var(--accent)]/35 bg-[var(--accent)]/10 text-[var(--text)]",
  },
};

export default function LessonBlocks({
  blocks,
  language,
}: {
  blocks: LessonBlock[];
  language: LearnLanguage;
}) {
  return (
    <div className="space-y-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "hook":
            return (
              <p
                key={i}
                className="display border-l-2 border-[var(--accent)] pl-4 text-lg font-medium leading-snug text-[var(--text)] sm:text-xl"
              >
                {block.text}
              </p>
            );
          case "paragraph":
            return (
              <p key={i} className="text-sm leading-relaxed text-[var(--text)]">
                {block.text}
              </p>
            );
          case "langParagraph":
            return (
              <p key={i} className="text-sm leading-relaxed text-[var(--text)]">
                {block.text[language]}
              </p>
            );
          case "heading":
            return (
              <h2
                key={i}
                className="display pt-2 text-base font-semibold text-[var(--text)]"
              >
                {block.text}
              </h2>
            );
          case "analogy":
            return (
              <blockquote
                key={i}
                className="rounded-2xl border border-[var(--line)] bg-[var(--bg-inset)]/50 px-4 py-3 text-sm italic leading-relaxed text-[var(--text-dim)] practice-glass"
              >
                {block.text}
              </blockquote>
            );
          case "code":
            return (
              <figure key={i} className="overflow-hidden rounded-2xl border border-[var(--line)]">
                {block.caption && (
                  <figcaption className="border-b border-[var(--line)] bg-[var(--bg-raised)] px-4 py-2 text-xs text-[var(--text-dim)]">
                    {block.caption}
                  </figcaption>
                )}
                <pre className="overflow-x-auto bg-[var(--bg-inset)] p-4 text-xs leading-relaxed text-[var(--text)]">
                  <code className="mono">{block.code[language]}</code>
                </pre>
              </figure>
            );
          case "outputPattern":
            return (
              <figure
                key={i}
                className="overflow-hidden rounded-2xl border border-[var(--accent)]/25 bg-[var(--bg-raised)]/50"
              >
                <figcaption className="border-b border-[var(--line)] px-4 py-2">
                  <span className="verdict-strip text-[10px] text-[var(--accent)]">
                    {block.caption ?? "Sample output"}
                  </span>
                </figcaption>
                <div
                  className={`grid gap-3 p-4 ${
                    block.samples.length > 1
                      ? "sm:grid-cols-2"
                      : "grid-cols-1"
                  }`}
                >
                  {block.samples.map((sample) => (
                    <div
                      key={sample.label}
                      className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-inset)]"
                    >
                      <div className="border-b border-[var(--line)] px-3 py-1.5 text-[11px] text-[var(--text-dim)]">
                        {sample.label}
                      </div>
                      <pre className="mono overflow-x-auto p-3 text-sm leading-[1.55] tracking-wide text-[var(--text)] whitespace-pre">
                        {sample.output}
                      </pre>
                    </div>
                  ))}
                </div>
              </figure>
            );
          case "syntaxWords":
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/60"
              >
                <div className="border-b border-[var(--line)] px-4 py-2 text-xs text-[var(--text-dim)]">
                  {block.caption ?? "Every piece of syntax, explained"}
                </div>
                <ul className="divide-y divide-[var(--line)]">
                  {block.words[language].map((word) => (
                    <li
                      key={`${word.term}-${word.meaning.slice(0, 24)}`}
                      className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-4"
                    >
                      <code className="mono text-xs font-semibold text-[var(--accent)]">
                        {word.term}
                      </code>
                      <span className="text-sm leading-relaxed text-[var(--text)]">
                        {word.meaning}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          case "callout": {
            const style = CALLOUT_STYLES[block.tone];
            return (
              <aside
                key={i}
                className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${style.className}`}
              >
                <div className="verdict-strip mb-1 text-[10px] uppercase tracking-wide opacity-80">
                  {style.label}
                </div>
                {block.text}
              </aside>
            );
          }
          case "list":
            return (
              <ul
                key={i}
                className="list-disc space-y-1.5 pl-5 text-sm text-[var(--text)]"
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
                className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 practice-glass"
              >
                <div className="verdict-strip text-[10px] text-[var(--accent)]">
                  Key takeaways
                </div>
                <ul className="mt-2 space-y-2 text-sm text-[var(--text)]">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-[var(--accent)]" aria-hidden>
                        →
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
