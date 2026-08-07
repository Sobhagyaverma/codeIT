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
      <p className="text-xs text-on-surface-variant">
        Unlock one level at a time. Higher hints never open automatically.
      </p>
      {LABELS.map(({ level, title }) => {
        const unlocked = unlockedHintLevel >= level;
        const canUnlock = unlockedHintLevel + 1 === level || unlocked;
        const content = hintContents[level];

        return (
          <div
            key={level}
            className="rounded-xl border border-outline-variant/30 bg-surface-container-high/50 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-label-md text-sm font-medium text-on-surface">
                  {title}
                </div>
                <div className="text-[10px] tracking-wide text-on-surface-variant uppercase">
                  {unlocked ? "Unlocked" : "Locked"}
                </div>
              </div>
              {!content && (
                <button
                  type="button"
                  disabled={!canUnlock || loading}
                  onClick={() => onUnlock(level)}
                  className="rounded-lg border border-outline-variant/40 px-2.5 py-1 text-xs text-on-surface transition hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  {unlocked ? "Reveal" : "Unlock"}
                </button>
              )}
            </div>
            {content && (
              <div className="mt-3 border-t border-outline-variant/25 pt-3">
                <CoachMessage content={content} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
