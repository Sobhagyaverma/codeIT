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
    /* comma-separated */
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
