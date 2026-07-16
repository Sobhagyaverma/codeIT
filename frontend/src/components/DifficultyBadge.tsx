const COLORS: Record<string, string> = {
  EASY: "var(--ok)",
  MEDIUM: "var(--accent)",
  HARD: "var(--err)",
};

export default function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color = COLORS[difficulty?.toUpperCase()] || "var(--info)";
  return (
    <span
      className="verdict-strip rounded border px-2 py-0.5"
      style={{ color, borderColor: color }}
    >
      {difficulty}
    </span>
  );
}
