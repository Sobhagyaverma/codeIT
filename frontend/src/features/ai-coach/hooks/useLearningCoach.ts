import { useCallback, useEffect, useState } from "react";
import {
  aiAnalyze,
  aiAnalyzeFailure,
  aiChat,
  aiConstraints,
  aiEditorial,
  aiExplain,
  aiHints,
  aiReview,
  getAiHintProgress,
} from "../../../lib/api";
import type { AiCoachRequest, AiCoachResponse, JudgeVerdictDTO } from "../../../lib/types";
import type { AiAction, CoachToolId } from "../types";

interface Options {
  problemId: number;
  language: string;
  languageId: number;
  code: string;
  verdict: JudgeVerdictDTO | null;
  enabled: boolean;
}

export function useLearningCoach({
  problemId,
  language,
  languageId,
  code,
  verdict,
  enabled,
}: Options) {
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<CoachToolId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiCoachResponse | null>(null);
  const [question, setQuestion] = useState("");
  const [unlockedHintLevel, setUnlockedHintLevel] = useState(0);
  const [hintContents, setHintContents] = useState<Record<number, string>>({});

  const hasCode = code.trim().length > 0;
  const isAccepted = (verdict?.verdict || "").toLowerCase() === "accepted";
  const isFailed =
    !!verdict?.submissionId &&
    !!verdict.verdict &&
    verdict.verdict.toLowerCase() !== "accepted";
  const editorialUnlocked = unlockedHintLevel >= 3 || isAccepted;

  useEffect(() => {
    if (!enabled || !open) return;
    let cancelled = false;
    getAiHintProgress(problemId)
      .then((res) => {
        if (!cancelled) setUnlockedHintLevel(res.unlockedHintLevel ?? 0);
      })
      .catch(() => {
        /* progress is optional on open */
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, open, problemId]);

  const basePayload = useCallback((): Omit<AiCoachRequest, "action"> => {
    return {
      problemId,
      language,
      languageId,
      code,
      submissionId: verdict?.submissionId ?? null,
    };
  }, [problemId, language, languageId, code, verdict?.submissionId]);

  const runAction = useCallback(
    async (action: AiAction, extra?: Partial<AiCoachRequest>) => {
      setLoading(true);
      setError(null);
      try {
        const payload = { ...basePayload(), ...extra };
        let res: AiCoachResponse;
        switch (action) {
          case "EXPLAIN_PROBLEM":
            res = await aiExplain(payload);
            break;
          case "EXPLAIN_CONSTRAINTS":
            res = await aiConstraints(payload);
            break;
          case "ASK_AI":
            res = await aiChat({ ...payload, question: extra?.question || question });
            break;
          case "REQUEST_HINT":
            res = await aiHints({
              ...payload,
              hintLevel: extra?.hintLevel ?? 1,
            });
            break;
          case "ANALYZE_CODE":
            res = await aiAnalyze(payload);
            break;
          case "ANALYZE_FAILURE":
            res = await aiAnalyzeFailure(payload);
            break;
          case "REVIEW_ACCEPTED":
            res = await aiReview(payload);
            break;
          case "EXPLAIN_EDITORIAL":
            res = await aiEditorial(payload);
            break;
          default:
            throw new Error("Unknown AI action");
        }
        setResult(res);
        if (typeof res.unlockedHintLevel === "number") {
          setUnlockedHintLevel(res.unlockedHintLevel);
        }
        if (action === "REQUEST_HINT" && res.hintLevel) {
          setHintContents((prev) => ({ ...prev, [res.hintLevel!]: res.content }));
        }
        return res;
      } catch (e) {
        setError(e instanceof Error ? e.message : "AI request failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [basePayload, question]
  );

  return {
    open,
    setOpen,
    activeTool,
    setActiveTool,
    loading,
    error,
    setError,
    result,
    setResult,
    question,
    setQuestion,
    unlockedHintLevel,
    hintContents,
    hasCode,
    isAccepted,
    isFailed,
    editorialUnlocked,
    runAction,
  };
}
