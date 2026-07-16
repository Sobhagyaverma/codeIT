import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getProblems,
  getProblemsByDifficulty,
  searchProblems,
} from "../lib/api";
import type { ProblemPublicDTO } from "../lib/types";
import { Loading, ErrorState, EmptyState } from "../components/Loading";
import DifficultyBadge from "../components/DifficultyBadge";

const DIFFICULTIES = ["ALL", "EASY", "MEDIUM", "HARD"];

function parseTopics(topics: unknown): string[] {
  if (!topics) return [];

  if (Array.isArray(topics)) {
    return topics.flatMap((item) => parseTopics(item));
  }

  if (typeof topics === "string") {
    try {
      const parsed = JSON.parse(topics);

      if (Array.isArray(parsed)) {
        return parsed.flatMap((item) => parseTopics(item));
      }
    } catch {
      // Not JSON, return as plain string
    }

    return [topics];
  }

  return [];
}

export default function ProblemList() {
  const [problems, setProblems] = useState<ProblemPublicDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [completedMap, setCompletedMap] = useState<Record<number, boolean>>(
    {}
  );
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: ProblemPublicDTO[];

      if (keyword.trim()) {
        data = await searchProblems(keyword.trim());
      } else if (difficulty !== "ALL") {
        data = await getProblemsByDifficulty(difficulty);
      } else {
        data = await getProblems();
      }

      if (topicFilter) {
        data = data.filter((p) =>
           parseTopics(p.topics).includes(topicFilter)
        );
      }

      setProblems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problems.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, topicFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const toggleCompleted = (id: number) => {
    setCompletedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleTopic = (topic: string) => {
    setOpenTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic],
    }));
  };

  const allTopics = Array.from(
  new Set(
    problems.flatMap((p) => parseTopics(p.topics))
  )
 ).slice(0, 12);

  const groupedProblems = allTopics.map((topic) => ({
  topic,
  problems: problems.filter((p) =>
    parseTopics(p.topics).includes(topic)
   ),
  }));

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="display mb-6 text-2xl font-semibold">Problems</h1>

      <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search problems..."
          className="flex-1 rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md border border-[var(--line)] px-4 py-2 text-sm text-[var(--text)] hover:border-[var(--info)] hover:text-[var(--info)]"
        >
          Search
        </button>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => {
              setKeyword("");
              setDifficulty(d);
            }}
            className={`verdict-strip rounded-full border px-3 py-1 transition ${
              difficulty === d
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--line)] text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            {d}
          </button>
        ))}

        {topicFilter && (
          <button
            onClick={() => setTopicFilter(null)}
            className="verdict-strip rounded-full border border-[var(--info)] px-3 py-1 text-[var(--info)]"
          >
            {topicFilter} ×
          </button>
        )}
      </div>

      {allTopics.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {allTopics.map((t) => (
            <button
              key={t}
              onClick={() => setTopicFilter(t)}
              className="rounded border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--text-dim)] hover:border-[var(--info)] hover:text-[var(--info)]"
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {loading && <Loading label="Loading problems" />}
      {error && <ErrorState message={error} />}
      {!loading && !error && problems.length === 0 && (
        <EmptyState message="No problems match these filters." />
      )}

      {!loading && !error && groupedProblems.length > 0 && (
        <div className="space-y-4">
          {groupedProblems.map(({ topic, problems: topicProblems }) => {
            const isOpen = openTopics[topic] ?? false;

            return (
              <div
                key={topic}
                className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg)]"
              >
                <button
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className="flex w-full items-center justify-between bg-[var(--bg-raised)] px-4 py-3 text-left transition hover:bg-[var(--bg-inset)]"
                >
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">
                      {topic}
                    </div>
                    <div className="text-xs text-[var(--text-dim)]">
                      {topicProblems.length} problem
                      {topicProblems.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <span className="text-lg text-[var(--text-dim)]">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div>
                    <div className="grid grid-cols-[60px_minmax(0,1fr)_120px_90px] border-t border-[var(--line)] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
                      <div>#</div>
                      <div>Problem</div>
                      <div>Difficulty</div>
                      <div className="text-right">Completed</div>
                    </div>

                    <div className="divide-y divide-[var(--line)]">
                      {topicProblems.map((p, index) => (
                        <div
                          key={`${topic}-${p.id}`}
                          className="grid grid-cols-[60px_minmax(0,1fr)_120px_90px] items-center px-4 py-3 transition hover:bg-[var(--bg-raised)]"
                        >
                          <div className="text-sm text-[var(--text-dim)]">
                            {index + 1}
                          </div>

                          <div className="min-w-0">
                            <Link
                              to={`/problems/${p.id}`}
                              className="block text-sm font-medium text-[var(--text)] hover:text-[var(--accent)]"
                            >
                              {p.title}
                            </Link>
                            <div className="mt-1 text-xs text-[var(--text-dim)]">
                              Problem ID: {p.id}
                            </div>
                          </div>

                          <div>
                            <DifficultyBadge difficulty={p.difficulty} />
                          </div>

                          <div className="flex justify-end">
                            <input
                              type="checkbox"
                              checked={!!completedMap[p.id]}
                              onChange={() => toggleCompleted(p.id)}
                              className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}