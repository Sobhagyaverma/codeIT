import type { ProblemSummary } from "./types";

export type LocalProfileMeta = {
  bio: string;
  location: string;
  avatarUrl: string;
  showEmail: boolean;
};

export type RecentViewEntry = {
  problemId: number;
  viewedAt: string;
};

const META_KEY = (userId: number) => `codeit.profile.meta.${userId}`;
const BOOKMARKS_KEY = (userId: number) => `codeit.profile.bookmarks.${userId}`;
const RECENT_KEY = (userId: number) => `codeit.profile.recent.${userId}`;

const DEFAULT_META: LocalProfileMeta = {
  bio: "",
  location: "",
  avatarUrl: "",
  showEmail: false,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadProfileMeta(userId: number): LocalProfileMeta {
  return { ...DEFAULT_META, ...readJson(META_KEY(userId), {}) };
}

export function saveProfileMeta(userId: number, meta: LocalProfileMeta) {
  localStorage.setItem(META_KEY(userId), JSON.stringify(meta));
}

export function loadBookmarks(userId: number): number[] {
  return readJson<number[]>(BOOKMARKS_KEY(userId), []);
}

export function saveBookmarks(userId: number, ids: number[]) {
  localStorage.setItem(BOOKMARKS_KEY(userId), JSON.stringify(ids));
}

export function toggleBookmark(userId: number, problemId: number): number[] {
  const current = loadBookmarks(userId);
  const next = current.includes(problemId)
    ? current.filter((id) => id !== problemId)
    : [problemId, ...current];
  saveBookmarks(userId, next);
  return next;
}

export function isBookmarked(userId: number, problemId: number): boolean {
  return loadBookmarks(userId).includes(problemId);
}

export function loadRecentViews(userId: number): RecentViewEntry[] {
  return readJson<RecentViewEntry[]>(RECENT_KEY(userId), []);
}

export function trackRecentView(userId: number, problemId: number) {
  const now = new Date().toISOString();
  const current = loadRecentViews(userId).filter((e) => e.problemId !== problemId);
  const next = [{ problemId, viewedAt: now }, ...current].slice(0, 20);
  localStorage.setItem(RECENT_KEY(userId), JSON.stringify(next));
  return next;
}

export function summarizeProblems(
  ids: number[],
  catalog: Map<number, ProblemSummary>
): ProblemSummary[] {
  return ids
    .map((id) => catalog.get(id))
    .filter((p): p is ProblemSummary => Boolean(p));
}
