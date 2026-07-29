/** Shared helpers for problem examples (sample tests). */

export type Example = {
  input: unknown;
  output: unknown;
  explanation?: string;
};

/**
 * Fix I/O strings that were stored with literal backslash-n (e.g. from
 * non-E'...' SQL inserts) instead of real newlines.
 */
export function unescapeIoString(s: string): string {
  if (!s.includes("\\n") && !s.includes("\\r") && !s.includes("\\t")) {
    return s;
  }
  // Already has real newlines — leave as-is to avoid corrupting valid data.
  if (s.includes("\n") || s.includes("\r")) {
    return s;
  }
  return s
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

export function parseExamples(examples?: string | Example[]): Example[] {
  if (!examples) return [];
  if (Array.isArray(examples)) return examples;
  try {
    return JSON.parse(examples) as Example[];
  } catch {
    return [];
  }
}

/** True when a string looks like program I/O, not a JSON blob to re-parse. */
function looksLikeRawIo(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  // Pattern / multi-line stdout — never JSON.parse (would strip structure).
  if (t.includes("\n") || t.includes("\\n")) return true;
  // Bare scalars / star patterns / numbers — leave as text.
  if (/^[\d\s.*+-]+$/.test(t)) return true;
  // JSON objects/arrays/quoted strings only.
  return !(t.startsWith("{") || t.startsWith("[") || t.startsWith('"'));
}

export function formatExample(value: unknown): string {
  if (typeof value === "string") {
    if (looksLikeRawIo(value)) {
      return unescapeIoString(value);
    }
    try {
      value = JSON.parse(value);
    } catch {
      return unescapeIoString(String(value));
    }
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string")) {
      return value.map((v) => unescapeIoString(v)).join("\n");
    }
    return `[${value.join(", ")}]`;
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value)
      .map(([key, val]) => {
        if (Array.isArray(val)) return `${key} = [${val.join(", ")}]`;
        if (typeof val === "object" && val !== null) {
          return `${key} = ${JSON.stringify(val)}`;
        }
        return `${key} = ${val}`;
      })
      .join("\n");
  }
  return value == null ? "" : unescapeIoString(String(value));
}

/**
 * Stdin for a sample run: prefer the editable case value (with \\n fixed),
 * but if it's blank fall back to the problem example so Run can't silently
 * use empty stdin while the UI still shows the sample input.
 */
export function resolveSampleStdin(
  caseStdin: string | undefined,
  exampleInput: unknown
): string {
  const fromCase = unescapeIoString(caseStdin ?? "");
  if (fromCase.trim() !== "") return fromCase;
  return exampleInputToStdin(exampleInput);
}

/** Convert a problem example input into Judge0 stdin. */
export function exampleInputToStdin(input: unknown): string {
  let value = input;

  if (typeof value === "string") {
    const trimmed = value.trim();
    try {
      value = JSON.parse(trimmed);
    } catch {
      return unescapeIoString(trimmed);
    }
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;

    if (Array.isArray(obj.nums) && "target" in obj) {
      const nums = obj.nums as unknown[];
      return `${nums.length}\n${nums.join(" ")}\n${obj.target}`;
    }

    const arrayEntry = Object.entries(obj).find(([, v]) => Array.isArray(v));
    if (arrayEntry) {
      const [, arr] = arrayEntry;
      const nums = arr as unknown[];
      const scalars = Object.entries(obj)
        .filter(([, v]) => !Array.isArray(v) && typeof v !== "object")
        .map(([, v]) => String(v));
      return [`${nums.length}`, nums.join(" "), ...scalars].join("\n");
    }
  }

  if (Array.isArray(value)) {
    return `${value.length}\n${value.join(" ")}`;
  }

  return value == null ? "" : unescapeIoString(String(value));
}

/** Convert a problem example output into expected stdout for comparison. */
export function exampleOutputToExpected(output: unknown): string {
  let value = output;

  if (typeof value === "string") {
    // Keep trailing newline semantics for judges, but trim only for JSON detect.
    if (looksLikeRawIo(value)) {
      return unescapeIoString(value);
    }
    const trimmed = value.trim();
    try {
      value = JSON.parse(trimmed);
    } catch {
      return unescapeIoString(trimmed);
    }
  }

  if (Array.isArray(value)) {
    // String rows (pattern lines) → real newlines; scalars → space-separated.
    if (value.every((v) => typeof v === "string")) {
      return value.map((v) => unescapeIoString(v)).join("\n");
    }
    return value.join(" ");
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return value == null ? "" : unescapeIoString(String(value));
}

/** Match backend OutputComparator normalization. */
export function normalizeOutput(s: string | null | undefined): string {
  if (s == null) return "";
  const lines = s.replace(/\r\n/g, "\n").replace(/\s+$/u, "").split("\n");
  return lines.map((line) => line.replace(/\s+$/u, "")).join("\n");
}

export function outputsMatch(
  actual: string | null | undefined,
  expected: string | null | undefined
): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}
