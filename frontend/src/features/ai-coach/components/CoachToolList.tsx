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
      <p className="font-label-md text-[12px] text-on-surface-variant">
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
        if (tool.requiresFailed && !isFailed)
          reason = "Needs a failed practice submission";
        if (tool.requiresAccepted && !isAccepted)
          reason = "Needs an Accepted submission";
        if (tool.requiresEditorialGate && !editorialUnlocked) {
          reason = "Unlock hint level 3 or get Accepted";
        }

        const primary = tool.id === "ask";

        return (
          <button
            key={tool.id}
            type="button"
            disabled={disabled}
            title={disabled ? reason : tool.description}
            onClick={() => onSelect(tool)}
            className={`w-full rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
              primary
                ? "border-primary/50 bg-primary/10 hover:bg-primary/15"
                : "border-outline-variant/30 bg-surface-container-high/60 hover:border-primary/40"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
                  primary
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-highest text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {tool.icon}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={`font-label-md text-sm font-semibold ${
                    primary ? "text-primary" : "text-on-surface"
                  }`}
                >
                  {tool.label}
                </div>
                <div className="mt-0.5 text-xs text-on-surface-variant">
                  {tool.description}
                </div>
                {disabled && reason && (
                  <div className="mt-1 text-[10px] tracking-wide text-on-surface-variant/80 uppercase">
                    {reason}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
