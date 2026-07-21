import React from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      {/* Hero section */}
      <section className="mb-16 grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-dim)]">
            /judge/status → online
          </p>

          <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight text-[var(--text)] md:text-6xl">
            Write code.
            <br />
            Get a <span className="text-green-400">verdict</span>.
            <br />
            Not a guess.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-dim)]">
            Solve problems against hidden test cases, race the clock in
            live contests, and when you get stuck — ask the AI to explain
            your code or fix what&apos;s failing, grounded in the actual
            problem constraints.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/dsa-sheet"
              className="inline-flex items-center rounded-md bg-[var(--accent)] px-6 py-3 text-base font-medium text-[#0a0d12] hover:brightness-110"
            >
              Open DSA Sheet
            </Link>

            <Link
              to="/problems"
              className="inline-flex items-center rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-6 py-3 text-base font-medium text-[var(--text)] hover:border-[var(--accent)]"
            >
              Browse problems
            </Link>

            <Link
              to="/competitions"
              className="inline-flex items-center rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-6 py-3 text-base font-medium text-[var(--text)] hover:border-[var(--accent)]"
            >
              View competitions
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 shadow-md">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--text-dim)]">
                Problem solving workspace
              </span>
              <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-400">
                Active
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text)]">
                    Arrays & Hashing
                  </span>
                  <span className="text-xs text-[var(--text-dim)]">
                    72% complete
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-inset)]">
                  <div className="h-2 w-[72%] rounded-full bg-[var(--accent)]" />
                </div>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
                <div className="mb-3 text-sm font-medium text-[var(--text)]">
                  Today&apos;s flow
                </div>
                <div className="space-y-2 text-sm text-[var(--text-dim)]">
                  <div className="flex items-center justify-between rounded-md border border-[var(--line)] px-3 py-2">
                    <span>Practice a problem</span>
                    <span className="text-green-400">Done</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-[var(--line)] px-3 py-2">
                    <span>Run sample tests</span>
                    <span className="text-green-400">Done</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-[var(--line)] px-3 py-2">
                    <span>Submit solution</span>
                    <span className="text-yellow-400">Pending</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
                <div className="mb-3 text-sm font-medium text-[var(--text)]">
                  Weekly consistency
                </div>
                <div className="grid grid-cols-7 gap-2">
                  <span className="h-10 rounded-md bg-[var(--accent)]/90" />
                  <span className="h-10 rounded-md bg-[var(--accent)]/75" />
                  <span className="h-10 rounded-md bg-[var(--accent)]/60" />
                  <span className="h-10 rounded-md bg-[var(--accent)]/85" />
                  <span className="h-10 rounded-md bg-[var(--accent)]/70" />
                  <span className="h-10 rounded-md bg-[var(--accent)]/80" />
                  <span className="h-10 rounded-md bg-[var(--accent)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick sections */}
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Topic‑wise sheets
          </h2>
          <p className="mt-2 text-xs text-[var(--text-dim)]">
            Organised problems by topic — arrays, DP, graphs, and more —
            similar to Striver&apos;s A2Z sheet.
          </p>
        </article>

        <article className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Contests & sessions
          </h2>
          <p className="mt-2 text-xs text-[var(--text-dim)]">
            Join competitions with friends and see where you stand on
            the leaderboard.
          </p>
        </article>

        <article className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Progress tracking
          </h2>
          <p className="mt-2 text-xs text-[var(--text-dim)]">
            Mark problems as completed, filter by topic, and keep an eye
            on your overall progress.
          </p>
        </article>
      </section>
    </main>
  );
};

export default Home;