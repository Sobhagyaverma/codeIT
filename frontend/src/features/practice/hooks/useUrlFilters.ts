import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export type DifficultyFilter = "ALL" | "EASY" | "MEDIUM" | "HARD";
export type StatusFilter = "ALL" | "SOLVED" | "ATTEMPTED" | "NOT_STARTED";
export type SortKey =
  | "name"
  | "difficulty"
  | "newest"
  | "oldest"
  | "acceptance"
  | "mostSolved"
  | "random";

function read(params: URLSearchParams, key: string, fallback = "") {
  return params.get(key) ?? fallback;
}

export function useUrlFilters(defaults?: {
  sort?: SortKey;
}) {
  const [params, setParams] = useSearchParams();

  const state = useMemo(
    () => ({
      q: read(params, "q"),
      difficulty: (read(params, "difficulty", "ALL") as DifficultyFilter) || "ALL",
      status: (read(params, "status", "ALL") as StatusFilter) || "ALL",
      topic: read(params, "topic"),
      favorites: params.get("favorites") === "1",
      revision: params.get("revision") === "1",
      sort: (read(params, "sort", defaults?.sort ?? "name") as SortKey) || "name",
      seed: read(params, "seed"),
    }),
    [params, defaults?.sort]
  );

  const patch = useCallback(
    (next: Partial<typeof state>) => {
      const copy = new URLSearchParams(params);
      const apply = (key: string, value: string | boolean | undefined) => {
        if (
          value == null ||
          value === "" ||
          value === false ||
          value === "ALL" ||
          (key === "sort" && value === (defaults?.sort ?? "name"))
        ) {
          copy.delete(key);
          return;
        }
        if (typeof value === "boolean") {
          copy.set(key, "1");
          return;
        }
        copy.set(key, value);
      };

      if ("q" in next) apply("q", next.q);
      if ("difficulty" in next) apply("difficulty", next.difficulty);
      if ("status" in next) apply("status", next.status);
      if ("topic" in next) apply("topic", next.topic);
      if ("favorites" in next) apply("favorites", next.favorites);
      if ("revision" in next) apply("revision", next.revision);
      if ("sort" in next) apply("sort", next.sort);
      if ("seed" in next) apply("seed", next.seed);

      setParams(copy, { replace: true });
    },
    [params, setParams, defaults?.sort]
  );

  const clear = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  return { ...state, patch, clear };
}
