import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lesson } from "../types";
import { lessonProblemIds } from "../types";

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyProgressChanged() {
  for (const listener of listeners) listener();
}

function storageKey(sectionId: string) {
  return `codeit.stitch.learn:${sectionId}:v1`;
}

function readStoredSlugs(sectionId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(sectionId));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((s): s is string => typeof s === "string" && s.length > 0)
    );
  } catch {
    return new Set();
  }
}

function writeStoredSlugs(sectionId: string, slugs: Set<string>) {
  try {
    localStorage.setItem(storageKey(sectionId), JSON.stringify([...slugs]));
  } catch {
    // ignore
  }
}

export function useLessonProgress(
  sectionId: string,
  lessons: readonly Lesson[],
  solvedProblemIds?: Set<number>
) {
  const [readSlugs, setReadSlugs] = useState<Set<string>>(() =>
    readStoredSlugs(sectionId)
  );

  useEffect(() => {
    setReadSlugs(readStoredSlugs(sectionId));
    const sync = () => setReadSlugs(readStoredSlugs(sectionId));
    listeners.add(sync);
    window.addEventListener("storage", sync);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", sync);
    };
  }, [sectionId]);

  const isRead = useCallback(
    (slug: string) => {
      if (readSlugs.has(slug)) return true;
      const lesson = lessons.find((l) => l.slug === slug);
      if (!lesson) return false;
      if (lesson.kind !== "read+problem" && lesson.kind !== "solve") {
        return false;
      }
      const ids = lessonProblemIds(lesson);
      if (ids.length === 0 || !solvedProblemIds) return false;
      return ids.every((id) => solvedProblemIds.has(id));
    },
    [lessons, readSlugs, solvedProblemIds]
  );

  const markRead = useCallback(
    (slug: string) => {
      setReadSlugs((prev) => {
        if (prev.has(slug)) return prev;
        const next = new Set(prev);
        next.add(slug);
        writeStoredSlugs(sectionId, next);
        queueMicrotask(() => notifyProgressChanged());
        return next;
      });
    },
    [sectionId]
  );

  const { completedCount, totalCount, percent } = useMemo(() => {
    const total = lessons.length;
    const completed = lessons.filter((l) => isRead(l.slug)).length;
    return {
      completedCount: completed,
      totalCount: total,
      percent: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [isRead, lessons]);

  return { isRead, markRead, completedCount, totalCount, percent };
}
