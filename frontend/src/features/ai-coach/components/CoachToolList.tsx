import { ListChecks, MessageCircle, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CoachTool, CoachToolId } from "../types";
import { COACH_TOOLS } from "../types";

interface Props {
  hasCode: boolean;
  isFailed: boolean;
  isAccepted: boolean;
  editorialUnlocked: boolean;
  onSelect: (tool: CoachTool) => void;
}

const TOOL_ICONS: Partial<Record<CoachToolId, LucideIcon>> = {
  explain: Search,
  constraints: ListChecks,
  ask: MessageCircle,
};

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

        const primary = tool.id === "ask";
        const Icon = TOOL_ICONS[tool.id];

        return (
          <button
            key={tool.id}
            type="button"
            disabled={disabled}
            title={disabled ? reason : tool.description}
            onClick={() => onSelect(tool)}
            className={`w-full rounded-md border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
              primary
                ? "border-[var(--accent)] bg-[var(--accent)]/12 hover:bg-[var(--accent)]/18"
                : "border-[var(--line)] bg-[var(--bg-raised)] hover:border-[var(--info)]"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {Icon && (
                <span
                  className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-md ${
                    primary
                      ? "bg-[var(--accent)] text-[#0a0d12]"
                      : "bg-[var(--bg-inset)] text-[var(--text-dim)]"
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm font-medium ${
                    primary ? "text-[var(--accent)]" : "text-[var(--text)]"
                  }`}
                >
                  {tool.label}
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-dim)]">
                  {tool.description}
                </div>
                {disabled && reason && (
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-dim)]">
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
