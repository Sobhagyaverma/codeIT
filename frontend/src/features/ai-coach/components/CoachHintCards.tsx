import CoachMessage from "./CoachMessage";

interface Props {
  unlockedHintLevel: number;
  hintContents: Record<number, string>;
  loading: boolean;
  onUnlock: (level: number) => void;
}

const LABELS = [
  { level: 1, title: "Hint Level 1 — Concept" },
  { level: 2, title: "Hint Level 2 — Approach" },
  { level: 3, title: "Hint Level 3 — Algorithm" },
] as const;

export default function CoachHintCards({
  unlockedHintLevel,
  hintContents,
  loading,
  onUnlock,
}: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-dim)]">
        Unlock one level at a time. Higher hints never open automatically.
      </p>
      {LABELS.map(({ level, title }) => {
        const unlocked = unlockedHintLevel >= level;
        const canUnlock = unlockedHintLevel + 1 === level || unlocked;
        const content = hintContents[level];

        return (
          <div
            key={level}
            className="rounded-md border border-[var(--line)] bg-[var(--bg-raised)] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-[var(--text)]">{title}</div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">
                  {unlocked ? "Unlocked" : "Locked"}
                </div>
              </div>
              {!content && (
                <button
                  type="button"
                  disabled={!canUnlock || loading}
                  onClick={() => onUnlock(level)}
                  className="rounded-md border border-[var(--line)] px-2.5 py-1 text-xs text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
                >
                  {unlocked ? "Reveal" : "Unlock"}
                </button>
              )}
            </div>
            {content && (
              <div className="mt-3 border-t border-[var(--line)] pt-3">
                <CoachMessage content={content} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
