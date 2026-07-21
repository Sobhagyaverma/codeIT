export function parseTopics(topics: unknown): string[] {
  if (Array.isArray(topics)) {
    return topics
      .filter((topic): topic is string => typeof topic === "string")
      .map((topic) => topic.trim())
      .filter(Boolean);
  }

  if (typeof topics !== "string") return [];

  const value = topics.trim();
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed !== topics) return parseTopics(parsed);
  } catch {
    // Plain comma-separated topic strings are also supported.
  }

  return value
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean);
}

export function normalizeTopic(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}

export function formatCompactNumber(
  value: number | null | undefined
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export function difficultyRank(difficulty: string): number {
  switch (difficulty.trim().toUpperCase()) {
    case "EASY":
      return 0;
    case "MEDIUM":
      return 1;
    case "HARD":
      return 2;
    default:
      return 3;
  }
}

export function formatRelativeShort(iso: string | null): string {
  if (!iso) return "—";

  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return "—";

  const seconds = Math.round((timestamp - Date.now()) / 1_000);
  const absoluteSeconds = Math.abs(seconds);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  if (absoluteSeconds < 45) return "now";

  const [unit, divisor] =
    units.find(([, size]) => absoluteSeconds >= size) ?? units.at(-1)!;
  return new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
    style: "narrow",
  }).format(Math.round(seconds / divisor), unit);
}
