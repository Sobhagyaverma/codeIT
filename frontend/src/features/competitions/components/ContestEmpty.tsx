import { CalendarX2 } from "lucide-react";
import type { ReactNode } from "react";

export default function ContestEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-raised)] px-5 py-10 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-[var(--bg-inset)] text-[var(--text-dim)]">
        <CalendarX2 className="size-5" aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[var(--text)]">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-[var(--text-dim)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
