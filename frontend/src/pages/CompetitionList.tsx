import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ErrorState } from "../components/Loading";
import { useCompetitionsDashboard } from "../features/competitions/hooks/useCompetitionsDashboard";
import ContestCard from "../features/competitions/components/ContestCard";
import ContestEmpty from "../features/competitions/components/ContestEmpty";
import ContestFilterBar, {
  type ContestFilters,
} from "../features/competitions/components/ContestFilterBar";
import ContestHistoryTable from "../features/competitions/components/ContestHistoryTable";
import ContestSidebar from "../features/competitions/components/ContestSidebar";
import ContestSkeleton from "../features/competitions/components/ContestSkeleton";
import ContestStatsCard from "../features/competitions/components/ContestStatsCard";
import FeaturedContestCard from "../features/competitions/components/FeaturedContestCard";
import type { ContestCardModel } from "../features/competitions/types";

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: accent }}
        />
        <h2 className="display text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function applyFilters(
  contests: ContestCardModel[],
  filters: ContestFilters
): ContestCardModel[] {
  let next = [...contests];

  if (filters.q.trim()) {
    const q = filters.q.trim().toLowerCase();
    next = next.filter(
      (contest) =>
        contest.title.toLowerCase().includes(q) ||
        contest.description.toLowerCase().includes(q)
    );
  }

  if (filters.status !== "ALL") {
    next = next.filter((contest) => contest.status === filters.status);
  }

  if (filters.contestType !== "ALL") {
    next = next.filter((contest) => contest.contestType === filters.contestType);
  }

  next.sort((a, b) => {
    const aTime = Date.parse(a.startTime);
    const bTime = Date.parse(b.startTime);
    return filters.sort === "oldest" ? aTime - bTime : bTime - aTime;
  });

  return next;
}

export default function CompetitionList() {
  const { user } = useAuth();
  const { data, loading, error } = useCompetitionsDashboard();
  const [filters, setFilters] = useState<ContestFilters>({
    q: "",
    status: "ALL",
    contestType: "ALL",
    sort: "newest",
  });

  const showTypeFilter = Boolean(
    data?.contests.some((contest) => contest.contestType != null)
  );

  const filtered = useMemo(
    () => (data ? applyFilters(data.contests, filters) : []),
    [data, filters]
  );

  const filteredLive = filtered.filter((c) => c.status === "ACTIVE");
  const filteredUpcoming = filtered.filter((c) => c.status === "UPCOMING");
  const filteredPast = filtered.filter((c) => c.status === "ENDED");

  return (
    <div className="practice-shell min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 max-w-3xl">
          <p className="verdict-strip text-[var(--accent)]">Competitions</p>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Weekly coding challenges
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
            Improve your rating by participating in contests. Practice under
            real contest conditions with live standings and timed rounds.
          </p>
        </header>

        {loading && <ContestSkeleton />}
        {error && <ErrorState message={error} />}

        {!loading && !error && data && data.contests.length === 0 && (
          <ContestEmpty
            title="No competitions yet"
            description="Contests will appear here once an admin schedules the first round."
          />
        )}

        {!loading && !error && data && data.contests.length > 0 && (
          <div className="space-y-8">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ContestStatsCard
                label="Active contests"
                value={data.stats.active}
              />
              <ContestStatsCard
                label="Upcoming contests"
                value={data.stats.upcoming}
              />
              <ContestStatsCard
                label="Total contests"
                value={data.stats.total}
              />
              <ContestStatsCard
                label="Total participants"
                value={data.stats.totalParticipants ?? "—"}
                hint={
                  data.stats.totalParticipants == null
                    ? "Counts load per contest"
                    : undefined
                }
              />
            </div>

            {data.featured && (
              <FeaturedContestCard
                contest={data.featured}
                isAuthenticated={Boolean(user)}
              />
            )}

            <ContestFilterBar
              filters={filters}
              showTypeFilter={showTypeFilter}
              onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-8">
                <Section title="Live now" accent="var(--ok)">
                  {filteredLive.length === 0 ? (
                    <ContestEmpty
                      title="No live contests"
                      description="Nothing is running right now. Check upcoming rounds or browse past contests."
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredLive.map((contest) => (
                        <ContestCard
                          key={contest.id}
                          contest={contest}
                          isAuthenticated={Boolean(user)}
                        />
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="Starting soon" accent="var(--warn)">
                  {filteredUpcoming.length === 0 ? (
                    <ContestEmpty
                      title="No upcoming contests"
                      description="New contests will appear here when scheduled."
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredUpcoming.map((contest) => (
                        <ContestCard
                          key={contest.id}
                          contest={contest}
                          isAuthenticated={Boolean(user)}
                        />
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="Past competitions" accent="var(--text-dim)">
                  {filteredPast.length === 0 ? (
                    <ContestEmpty
                      title="No past contests"
                      description="Ended contests will show up here for review and leaderboards."
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredPast.map((contest) => (
                        <ContestCard
                          key={contest.id}
                          contest={contest}
                          isAuthenticated={Boolean(user)}
                        />
                      ))}
                    </div>
                  )}
                </Section>

                {filtered.length === 0 && (
                  <ContestEmpty
                    title="No results"
                    description="Try clearing search or filters to see all contests."
                    action={
                      <button
                        type="button"
                        onClick={() =>
                          setFilters({
                            q: "",
                            status: "ALL",
                            contestType: "ALL",
                            sort: "newest",
                          })
                        }
                        className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--text)]"
                      >
                        Clear filters
                      </button>
                    }
                  />
                )}

                {user && (
                  <section className="space-y-3">
                    <h2 className="display text-xl font-semibold">
                      Your contest history
                    </h2>
                    <ContestHistoryTable rows={data.history} />
                  </section>
                )}
              </div>

              <ContestSidebar
                userStats={data.userStats}
                isAuthenticated={Boolean(user)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
