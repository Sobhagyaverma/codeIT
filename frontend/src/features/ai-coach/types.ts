export type AiAction =
  | "EXPLAIN_PROBLEM"
  | "EXPLAIN_CONSTRAINTS"
  | "ASK_AI"
  | "REQUEST_HINT"
  | "ANALYZE_CODE"
  | "ANALYZE_FAILURE"
  | "REVIEW_ACCEPTED"
  | "EXPLAIN_EDITORIAL";

export type CoachToolId =
  | "explain"
  | "constraints"
  | "ask"
  | "hints"
  | "analyze"
  | "failure"
  | "review"
  | "editorial";

export interface CoachTool {
  id: CoachToolId;
  action: AiAction;
  label: string;
  description: string;
  requiresCode?: boolean;
  requiresFailed?: boolean;
  requiresAccepted?: boolean;
  requiresEditorialGate?: boolean;
}

export const COACH_TOOLS: CoachTool[] = [
  {
    id: "explain",
    action: "EXPLAIN_PROBLEM",
    label: "Explain Problem",
    description: "Beginner-friendly restatement. No algorithm spoilers.",
  },
  {
    id: "constraints",
    action: "EXPLAIN_CONSTRAINTS",
    label: "Explain Constraints",
    description: "Edge cases, complexity bounds, and observations.",
  },
  {
    id: "ask",
    action: "ASK_AI",
    label: "Ask AI",
    description: "Ask a conceptual question about this problem.",
  },
  {
    id: "hints",
    action: "REQUEST_HINT",
    label: "I'm Stuck",
    description: "Progressive hints — unlock levels voluntarily.",
  },
  {
    id: "analyze",
    action: "ANALYZE_CODE",
    label: "Analyze My Code",
    description: "Logic review without rewriting your solution.",
    requiresCode: true,
  },
  {
    id: "failure",
    action: "ANALYZE_FAILURE",
    label: "Why Did My Submission Fail?",
    description: "Explain a failed practice submission safely.",
    requiresFailed: true,
  },
  {
    id: "review",
    action: "REVIEW_ACCEPTED",
    label: "Review Accepted Solution",
    description: "Complexity, strengths, and interview notes.",
    requiresAccepted: true,
  },
  {
    id: "editorial",
    action: "EXPLAIN_EDITORIAL",
    label: "Explain Official Solution",
    description: "Available after hint level 3 or Accepted.",
    requiresEditorialGate: true,
  },
];
