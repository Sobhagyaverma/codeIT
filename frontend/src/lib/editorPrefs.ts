const PREFERRED_LANG_KEY = "codeit:preferredLanguage";

function draftKey(problemId: number, languageSlug: string): string {
  return `codeit:draft:${problemId}:${languageSlug}`;
}

function contestDraftKey(
  competitionId: number,
  problemId: number,
  languageSlug: string
): string {
  return `codeit:contest-draft:${competitionId}:${problemId}:${languageSlug}`;
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
    /* ignore quota / private mode */
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
    /* ignore quota / private mode */
  }
}

export function clearCodeDraft(
  problemId: number,
  languageSlug: string
): void {
  try {
    localStorage.removeItem(draftKey(problemId, languageSlug));
  } catch {
    /* ignore */
  }
}

export function loadContestCodeDraft(
  competitionId: number,
  problemId: number,
  languageSlug: string
): string | null {
  try {
    return localStorage.getItem(
      contestDraftKey(competitionId, problemId, languageSlug)
    );
  } catch {
    return null;
  }
}

export function saveContestCodeDraft(
  competitionId: number,
  problemId: number,
  languageSlug: string,
  code: string
): void {
  try {
    localStorage.setItem(
      contestDraftKey(competitionId, problemId, languageSlug),
      code
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/** Resolve preferred language from a list, falling back to python then first. */
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
