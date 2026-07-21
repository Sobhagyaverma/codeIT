import type { ButtonHTMLAttributes } from "react";

type ComingSoonButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "disabled" | "title"
>;

export default function ComingSoonButton({
  children = "Coming soon",
  className = "",
  type = "button",
  ...props
}: ComingSoonButtonProps) {
  return (
    <button
      {...props}
      aria-disabled="true"
      className={`cursor-not-allowed rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text-dim)] opacity-70 ${className}`}
      disabled
      title="Coming soon"
      type={type}
    >
      {children}
    </button>
  );
}
