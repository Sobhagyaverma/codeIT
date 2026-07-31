/** Monospace I/O block that preserves exact pattern newlines and spaces. */
export function IoPre({
  children,
  tone = "default",
  className = "",
}: {
  children: string;
  tone?: "default" | "ok" | "dim" | "error";
  className?: string;
}) {
  const color =
    tone === "ok"
      ? "text-easy"
      : tone === "dim"
        ? "text-on-surface-variant"
        : tone === "error"
          ? "text-hard"
          : "text-on-surface";

  return (
    <pre
      className={`mono max-h-56 overflow-auto whitespace-pre rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-[13px] leading-[1.55] tracking-wide ${color} ${className}`}
    >
      {children || "—"}
    </pre>
  );
}
