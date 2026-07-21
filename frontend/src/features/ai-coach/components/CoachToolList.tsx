import type { CoachTool } from "../types";
import { COACH_TOOLS } from "../types";

interface Props {
  hasCode: boolean;
  isFailed: boolean;
  isAccepted: boolean;
  editorialUnlocked: boolean;
  onSelect: (tool: CoachTool) => void;
}

export default function CoachToolList({
  hasCode,
  isFailed,
  isAccepted,
  editorialUnlocked,
  onSelect,
}: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-dim)]">
        Choose a tool. The AI only runs when you click one.
      </p>
      {COACH_TOOLS.map((tool) => {
        const disabled =
          (tool.requiresCode && !hasCode) ||
          (tool.requiresFailed && !isFailed) ||
          (tool.requiresAccepted && !isAccepted) ||
          (tool.requiresEditorialGate && !editorialUnlocked);

        let reason = "";
        if (tool.requiresCode && !hasCode) reason = "Write some code first";
        if (tool.requiresFailed && !isFailed) reason = "Needs a failed practice submission";
        if (tool.requiresAccepted && !isAccepted) reason = "Needs an Accepted submission";
        if (tool.requiresEditorialGate && !editorialUnlocked) {
          reason = "Unlock hint level 3 or get Accepted";
        }

        return (
          <button
            key={tool.id}
            type="button"
            disabled={disabled}
            title={disabled ? reason : tool.description}
            onClick={() => onSelect(tool)}
            className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2.5 text-left transition hover:border-[var(--info)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="text-sm font-medium text-[var(--text)]">{tool.label}</div>
            <div className="mt-0.5 text-xs text-[var(--text-dim)]">{tool.description}</div>
            {disabled && reason && (
              <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-dim)]">
                {reason}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
