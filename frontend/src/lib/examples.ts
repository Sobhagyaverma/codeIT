/** Shared helpers for problem examples (sample tests). */

export type Example = {
  input: unknown;
  output: unknown;
  explanation?: string;
};

export function parseExamples(examples?: string | Example[]): Example[] {
  if (!examples) return [];
  if (Array.isArray(examples)) return examples;
  try {
    return JSON.parse(examples) as Example[];
  } catch {
    return [];
  }
}

export function formatExample(value: unknown): string {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return String(value);
    }
  }
  if (Array.isArray(value)) return `[${value.join(", ")}]`;
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
  return String(value);
}

/** Convert a problem example input into Judge0 stdin. */
export function exampleInputToStdin(input: unknown): string {
  let value = input;

  if (typeof value === "string") {
    const trimmed = value.trim();
    try {
      value = JSON.parse(trimmed);
    } catch {
      return trimmed;
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

  return value == null ? "" : String(value);
}

/** Convert a problem example output into expected stdout for comparison. */
export function exampleOutputToExpected(output: unknown): string {
  let value = output;

  if (typeof value === "string") {
    const trimmed = value.trim();
    try {
      value = JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  if (Array.isArray(value)) {
    return value.join(" ");
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return value == null ? "" : String(value);
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
