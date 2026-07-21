import type { ReactNode } from "react";

type SidebarWidgetProps = {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function SidebarWidget({
  title,
  action,
  children,
  className = "",
}: SidebarWidgetProps) {
  return (
    <section
      className={`rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 ${className}`}
    >
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && (
            <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
          )}
          {action && <div className="ml-auto shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
