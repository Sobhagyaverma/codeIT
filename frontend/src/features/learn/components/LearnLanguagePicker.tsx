import type { LearnLanguage } from "../types";

const OPTIONS: { value: LearnLanguage; label: string }[] = [
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
];

export default function LearnLanguagePicker({
  language,
  onChange,
  className = "",
}: {
  language: LearnLanguage;
  onChange: (lang: LearnLanguage) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex flex-wrap gap-1 rounded-xl border border-[var(--line)] bg-[var(--bg-inset)]/60 p-1 ${className}`}
      role="group"
      aria-label="Lesson language"
    >
      {OPTIONS.map((opt) => {
        const active = language === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40"
                : "border border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
