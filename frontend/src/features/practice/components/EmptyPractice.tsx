import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";

type EmptyPracticeProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyPractice({
  title = "No problems found",
  description = "Try changing your search or filters.",
  action,
  className = "",
}: EmptyPracticeProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-raised)] px-5 py-12 text-center ${className}`}
    >
      <div className="grid size-11 place-items-center rounded-full bg-[var(--bg-inset)] text-[var(--text-dim)]">
        <BookOpen aria-hidden="true" className="size-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--text)]">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-[var(--text-dim)]">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
