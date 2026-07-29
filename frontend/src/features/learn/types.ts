export type LearnLanguage = "cpp" | "java" | "python";

export type SyntaxWord = {
  term: string;
  meaning: string;
};

export type QuizQuestion =
  | {
      kind: "mcq";
      prompt: string;
      choices: string[];
      answerIndex: number;
      explanation?: string;
    }
  | {
      kind: "trueFalse";
      prompt: string;
      answer: boolean;
      explanation?: string;
    }
  | {
      kind: "predict";
      prompt: string;
      code?: Record<LearnLanguage, string> | string;
      answer: string;
      explanation?: string;
    }
  | {
      kind: "fillBlank";
      prompt: string;
      answer: string;
      explanation?: string;
    };

export type PracticeListItem = {
  title: string;
  difficulty?: "EASY" | "EASY-MEDIUM" | "MEDIUM" | "HARD";
  problemId?: number;
  hint?: string;
};

export type LessonBlock =
  | { type: "hook"; text: string }
  | { type: "intro"; what: string; why: string; where: string }
  | { type: "paragraph"; text: string }
  | { type: "langParagraph"; text: Record<LearnLanguage, string> }
  | { type: "heading"; text: string }
  | { type: "analogy"; text: string; caption?: string }
  | { type: "code"; caption?: string; code: Record<LearnLanguage, string> }
  | {
      type: "outputPattern";
      caption?: string;
      samples: { label: string; output: string }[];
    }
  | {
      type: "syntaxWords";
      caption?: string;
      words: Record<LearnLanguage, SyntaxWord[]>;
    }
  | { type: "callout"; tone: "tip" | "mistake" | "fun-fact"; text: string }
  | { type: "list"; items: string[] }
  | { type: "keyTakeaways"; items: string[] }
  | {
      type: "predictReveal";
      caption?: string;
      question: string;
      code: Record<LearnLanguage, string> | string;
      answer: string;
      animationHint?: string;
    }
  | {
      type: "mistakePair";
      note: string;
      wrong: Record<LearnLanguage, string> | string;
      correct: Record<LearnLanguage, string> | string;
    }
  | {
      type: "truthTable";
      caption?: string;
      headers: string[];
      rows: string[][];
      animationHint?: string;
    }
  | {
      type: "stateTrace";
      caption?: string;
      steps: { label: string; state: string }[];
      animationHint?: string;
    }
  | {
      type: "expressionSteps";
      caption?: string;
      expression: string;
      steps: string[];
      animationHint?: string;
    }
  | { type: "quiz"; caption?: string; questions: QuizQuestion[] }
  | { type: "practiceList"; caption?: string; items: PracticeListItem[] }
  | { type: "bridge"; nextTitle: string; text: string };

export type Lesson = {
  slug: string;
  order: number;
  title: string;
  estMinutes: number;
  kind: "read" | "read+problem" | "solve";
  /** Legacy single-problem link (Start Here / Control Flow / Pattern Basics). */
  linkedProblemId?: number;
  /** Preferred multi-problem practice links (Operators). */
  linkedProblemIds?: number[];
  teaser: string;
  blocks: LessonBlock[];
};

export type LessonSection = {
  id: string;
  title: string;
  subtitle: string;
  lessons: Lesson[];
};

/** Resolve practice problem IDs for a lesson (array preferred, else single). */
export function lessonProblemIds(lesson: Lesson): number[] {
  if (lesson.linkedProblemIds && lesson.linkedProblemIds.length > 0) {
    return lesson.linkedProblemIds;
  }
  if (lesson.linkedProblemId != null) return [lesson.linkedProblemId];
  return [];
}
