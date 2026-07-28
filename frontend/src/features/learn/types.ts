export type LearnLanguage = "cpp" | "java" | "python";

export type SyntaxWord = {
  term: string;
  meaning: string;
};

export type LessonBlock =
  | { type: "hook"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "langParagraph"; text: Record<LearnLanguage, string> }
  | { type: "heading"; text: string }
  | { type: "analogy"; text: string }
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
  | { type: "keyTakeaways"; items: string[] };

export type Lesson = {
  slug: string;
  order: number;
  title: string;
  estMinutes: number;
  kind: "read" | "read+problem";
  linkedProblemId?: number;
  teaser: string;
  blocks: LessonBlock[];
};

export type LessonSection = {
  id: string;
  title: string;
  subtitle: string;
  lessons: Lesson[];
};
