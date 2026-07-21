import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  addMyBookmark,
  getMyBookmarks,
  getMyProfile,
  getProblems,
  getUserSubmissions,
  removeMyBookmark,
} from "../../../lib/api";
import { buildPracticeCatalog } from "../adapters";
import type { PracticeCatalogData } from "../types";

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to load the practice catalog.";
}

function withBookmark(
  catalog: PracticeCatalogData,
  problemId: number,
  bookmarked: boolean
): PracticeCatalogData {
  const bookmarks = new Set(catalog.bookmarks);
  if (bookmarked) bookmarks.add(problemId);
  else bookmarks.delete(problemId);

  const updateProblem = (problem: PracticeCatalogData["problems"][number]) =>
    problem.id === problemId ? { ...problem, bookmarked } : problem;

  return {
    ...catalog,
    bookmarks,
    problems: catalog.problems.map(updateProblem),
    modules: catalog.modules.map((module) => ({
      ...module,
      problems: module.problems.map(updateProblem),
    })),
    continueProblem: catalog.continueProblem
      ? updateProblem(catalog.continueProblem)
      : null,
    recentSolved: catalog.recentSolved.map(updateProblem),
  };
}

export function usePracticeCatalog() {
  const { user } = useAuth();
  const [data, setData] = useState<PracticeCatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const bookmarkRequests = useRef(new Set<number>());

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const [problems, submissions, bookmarks, profile] = await Promise.all([
        getProblems(),
        user ? getUserSubmissions(user.id) : Promise.resolve([]),
        user ? getMyBookmarks() : Promise.resolve([]),
        user ? getMyProfile() : Promise.resolve(null),
      ]);

      if (currentRequest !== requestId.current) return;
      setData(
        buildPracticeCatalog(
          problems,
          submissions,
          bookmarks.map((bookmark) => bookmark.id),
          profile
        )
      );
    } catch (loadError) {
      if (currentRequest !== requestId.current) return;
      setError(errorMessage(loadError));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
    return () => {
      requestId.current += 1;
    };
  }, [refresh]);

  const toggleBookmark = useCallback(
    async (problemId: number) => {
      if (!user) throw new Error("Sign in to save problems.");
      if (!data || bookmarkRequests.current.has(problemId)) return;

      const wasBookmarked = data.bookmarks.has(problemId);
      bookmarkRequests.current.add(problemId);
      setError(null);
      setData((catalog) =>
        catalog ? withBookmark(catalog, problemId, !wasBookmarked) : catalog
      );

      try {
        if (wasBookmarked) await removeMyBookmark(problemId);
        else await addMyBookmark(problemId);
      } catch (bookmarkError) {
        setData((catalog) =>
          catalog ? withBookmark(catalog, problemId, wasBookmarked) : catalog
        );
        setError(errorMessage(bookmarkError));
        throw bookmarkError;
      } finally {
        bookmarkRequests.current.delete(problemId);
      }
    },
    [data, user]
  );

  return { data, loading, error, refresh, toggleBookmark };
}
