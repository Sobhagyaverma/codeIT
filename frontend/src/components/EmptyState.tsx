import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  /** denser layout for sidebars / modals */
  size?: "md" | "sm";
  /** dashed bordered card (default) vs bare centered stack */
  bordered?: boolean;
};

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className = "",
  size = "md",
  bordered = true,
}: EmptyStateProps) {
  const sm = size === "sm";

  return (
    <div
      className={`flex flex-col items-center text-center ${
        bordered
          ? "rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-raised)]"
          : ""
      } ${sm ? "px-3 py-5" : "px-5 py-10"} ${className}`}
    >
      <div
        className={`grid place-items-center rounded-full bg-[var(--bg-inset)] text-[var(--text-dim)] ${
          sm ? "size-9" : "size-11"
        }`}
      >
        <Icon className={sm ? "size-4" : "size-5"} aria-hidden />
      </div>
      <h3
        className={`font-semibold text-[var(--text)] ${
          sm ? "mt-2.5 text-sm" : "mt-4 text-base"
        }`}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          className={`max-w-md text-[var(--text-dim)] ${
            sm ? "mt-0.5 text-[11px] leading-relaxed" : "mt-1 text-sm"
          }`}
        >
          {subtitle}
        </p>
      )}
      {action && <div className={sm ? "mt-2.5" : "mt-4"}>{action}</div>}
    </div>
  );
}
