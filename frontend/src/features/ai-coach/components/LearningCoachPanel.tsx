import { Loading, ErrorState } from "../../../components/Loading";
import type { JudgeVerdictDTO } from "../../../lib/types";
import { useLearningCoach } from "../hooks/useLearningCoach";
import type { CoachTool } from "../types";
import CoachHintCards from "./CoachHintCards";
import CoachMessage from "./CoachMessage";
import CoachToolList from "./CoachToolList";

interface Props {
  problemId: number;
  language: string;
  languageId: number;
  code: string;
  verdict: JudgeVerdictDTO | null;
  enabled: boolean;
}

export default function LearningCoachPanel({
  problemId,
  language,
  languageId,
  code,
  verdict,
  enabled,
}: Props) {
  const coach = useLearningCoach({
    problemId,
    language,
    languageId,
    code,
    verdict,
    enabled,
  });

  if (!enabled) {
    return (
      <p className="text-sm text-[var(--text-dim)]">
        Log in to use the AI Learning Coach on practice problems.
      </p>
    );
  }

  const onSelectTool = async (tool: CoachTool) => {
    coach.setActiveTool(tool.id);
    coach.setResult(null);
    if (tool.id === "hints" || tool.id === "ask") {
      return;
    }
    await coach.runAction(tool.action);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="display text-sm font-semibold text-[var(--text)]">
            AI Learning Coach
          </h3>
          <p className="text-xs text-[var(--text-dim)]">
            Optional mentor for practice — never contests.
          </p>
        </div>
        {coach.activeTool && (
          <button
            type="button"
            onClick={() => {
              coach.setActiveTool(null);
              coach.setResult(null);
              coach.setError(null);
            }}
            className="text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
          >
            All tools
          </button>
        )}
      </div>

      {!coach.activeTool && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CoachToolList
            hasCode={coach.hasCode}
            isFailed={coach.isFailed}
            isAccepted={coach.isAccepted}
            editorialUnlocked={coach.editorialUnlocked}
            onSelect={onSelectTool}
          />
        </div>
      )}

      {coach.activeTool === "ask" && (
        <div className="space-y-3">
          <textarea
            value={coach.question}
            onChange={(e) => coach.setQuestion(e.target.value)}
            rows={3}
            placeholder="What does this constraint mean?"
            className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--info)] focus:outline-none"
          />
          <button
            type="button"
            disabled={coach.loading || !coach.question.trim()}
            onClick={() => coach.runAction("ASK_AI", { question: coach.question })}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#0a0d12] disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      )}

      {coach.activeTool === "hints" && (
        <CoachHintCards
          unlockedHintLevel={coach.unlockedHintLevel}
          hintContents={coach.hintContents}
          loading={coach.loading}
          onUnlock={(level) => coach.runAction("REQUEST_HINT", { hintLevel: level })}
        />
      )}

      {coach.loading && <Loading label="Thinking" />}
      {coach.error && <ErrorState message={coach.error} />}

      {coach.result && coach.activeTool !== "hints" && !coach.loading && (
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-md border border-[var(--line)] bg-[var(--bg-raised)] p-3">
          <CoachMessage content={coach.result.content} />
        </div>
      )}
    </div>
  );
}
