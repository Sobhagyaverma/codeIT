const PREFERRED_LANG_KEY = "codeit.stitch.preferredLanguage";

function draftKey(problemId: number, languageSlug: string): string {
  return `codeit.stitch.draft:${problemId}:${languageSlug}`;
}

export function getPreferredLanguage(): string | null {
  try {
    return localStorage.getItem(PREFERRED_LANG_KEY);
  } catch {
    return null;
  }
}

export function setPreferredLanguage(slug: string): void {
  try {
    localStorage.setItem(PREFERRED_LANG_KEY, slug);
  } catch {
    /* ignore */
  }
}

export function loadCodeDraft(
  problemId: number,
  languageSlug: string
): string | null {
  try {
    return localStorage.getItem(draftKey(problemId, languageSlug));
  } catch {
    return null;
  }
}

export function saveCodeDraft(
  problemId: number,
  languageSlug: string,
  code: string
): void {
  try {
    localStorage.setItem(draftKey(problemId, languageSlug), code);
  } catch {
    /* ignore */
  }
}

export function pickPreferredLanguage<T extends { slug: string }>(
  langs: T[]
): T | null {
  if (langs.length === 0) return null;
  const preferredSlug = getPreferredLanguage();
  return (
    langs.find((l) => l.slug === preferredSlug) ||
    langs.find((l) => l.slug === "python") ||
    langs[0] ||
    null
  );
}
