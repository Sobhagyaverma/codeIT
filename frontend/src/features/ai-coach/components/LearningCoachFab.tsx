interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function LearningCoachFab({ open, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      className={`fixed bottom-5 right-5 z-40 rounded-full border px-4 py-3 text-sm font-medium shadow-lg transition ${
        open
          ? "border-[var(--accent)] bg-[var(--accent)] text-[#0a0d12]"
          : "border-[var(--line)] bg-[var(--bg-raised)] text-[var(--text)] hover:border-[var(--accent)]"
      }`}
    >
      AI Coach
    </button>
  );
}
