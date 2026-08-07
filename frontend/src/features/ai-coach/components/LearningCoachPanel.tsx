import { Link } from "react-router-dom";
import type { JudgeVerdictDTO } from "../../../lib/api";
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
      <div className="flex h-full flex-col items-start justify-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-3xl text-primary">
          smart_toy
        </span>
        <p className="font-label-md text-on-surface">AI Learning Coach</p>
        <p className="text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>{" "}
          to use the AI Learning Coach on practice problems.
        </p>
      </div>
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
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">smart_toy</span>
          <div>
            <h3 className="font-label-md text-sm font-semibold text-on-surface">
              AI Learning Coach
            </h3>
            <p className="text-xs text-on-surface-variant">
              Optional mentor for practice — never contests.
            </p>
          </div>
        </div>
        {coach.activeTool && (
          <button
            type="button"
            onClick={() => {
              coach.setActiveTool(null);
              coach.setResult(null);
              coach.setError(null);
            }}
            className="text-xs text-on-surface-variant transition hover:text-primary"
          >
            All tools
          </button>
        )}
      </div>

      {!coach.activeTool && (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={coach.loading || !coach.question.trim()}
            onClick={() =>
              coach.runAction("ASK_AI", { question: coach.question })
            }
            className="rounded-xl bg-primary px-4 py-2 font-label-md text-sm font-semibold text-on-primary disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      )}

      {coach.activeTool === "hints" && (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <CoachHintCards
            unlockedHintLevel={coach.unlockedHintLevel}
            hintContents={coach.hintContents}
            loading={coach.loading}
            onUnlock={(level) =>
              coach.runAction("REQUEST_HINT", { hintLevel: level })
            }
          />
        </div>
      )}

      {coach.loading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-primary">
            progress_activity
          </span>
          Thinking…
        </div>
      )}

      {coach.error && (
        <p className="mt-3 rounded-xl border border-hard/30 bg-hard/10 px-3 py-2 text-sm text-hard">
          {coach.error}
        </p>
      )}

      {coach.result && coach.activeTool !== "hints" && !coach.loading && (
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
          <CoachMessage content={coach.result.content} />
        </div>
      )}
    </div>
  );
}
