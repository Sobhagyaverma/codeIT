import { Link } from "react-router-dom";
import type {
  Achievement,
  ContestHistoryRow,
  PersonalBests,
  ProblemSummary,
  ProfileSubmissionRow,
} from "../types";
import {
  formatDate,
  formatRelative,
  formatRuntime,
  verdictColor,
} from "../format";
import { ExpandToggle, useExpandableList } from "./ExpandableList";

export function RecentSubmissionsPanel({
  rows,
}: {
  rows: ProfileSubmissionRow[];
}) {
  const list = useExpandableList(rows);

  if (!rows.length) {
    return (
      <EmptyCard
        title="Recent submissions"
        message="Submit a solution to see activity here."
      />
    );
  }

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-sm font-semibold">Recent submissions</h2>
      <div className="space-y-2">
        {list.visible.map((row) => (
          <Link
            key={row.id}
            to={`/problems/${row.problemId}`}
            className="block rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2.5 transition hover:border-[var(--info)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {row.problemTitle}
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-dim)]">
                  {row.language} · {formatRuntime(row.runtime)} ·{" "}
                  {formatRelative(row.submittedAt)}
                </div>
              </div>
              <span
                className="verdict-strip rounded px-2 py-1"
                style={{
                  color: verdictColor(row.verdict),
                  background: `color-mix(in srgb, ${verdictColor(row.verdict)} 14%, transparent)`,
                }}
              >
                {row.verdict}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {list.canToggle && (
        <ExpandToggle
          expanded={list.expanded}
          hiddenCount={list.hiddenCount}
          onToggle={list.toggle}
        />
      )}
    </section>
  );
}

export function ContestHistoryPanel({
  rows,
}: {
  rows: ContestHistoryRow[];
}) {
  const list = useExpandableList(rows);

  if (!rows.length) {
    return (
      <EmptyCard
        title="Contest history"
        message="Join a contest to build your standings history."
      />
    );
  }

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-sm font-semibold">Contest history</h2>
      <div className="space-y-2">
        {list.visible.map((row) => (
          <div
            key={`${row.competitionId}-${row.title}`}
            className="rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium">{row.title}</div>
                <div className="mt-0.5 text-xs text-[var(--text-dim)]">
                  {formatDate(row.date)} · {row.solved} solved
                  {row.score != null ? ` · score ${row.score}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-[var(--accent)]">
                  {row.rank != null ? `#${row.rank}` : "—"}
                </div>
                {row.ratingDelta != null && (
                  <div
                    className="text-xs"
                    style={{
                      color:
                        row.ratingDelta >= 0 ? "var(--ok)" : "var(--err)",
                    }}
                  >
                    {row.ratingDelta >= 0 ? "+" : ""}
                    {row.ratingDelta} rating
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {list.canToggle && (
        <ExpandToggle
          expanded={list.expanded}
          hiddenCount={list.hiddenCount}
          onToggle={list.toggle}
        />
      )}
    </section>
  );
}

export function ProblemListPanel({
  title,
  problems,
  empty,
}: {
  title: string;
  problems: ProblemSummary[];
  empty: string;
}) {
  const list = useExpandableList(problems);

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {problems.length === 0 ? (
        <p className="text-sm text-[var(--text-dim)]">{empty}</p>
      ) : (
        <div className="space-y-2">
          {list.visible.map((p) => (
            <Link
              key={p.id}
              to={`/problems/${p.id}`}
              className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm transition hover:border-[var(--info)]"
            >
              <span className="truncate font-medium">{p.title}</span>
              <span className="verdict-strip text-[var(--text-dim)]">
                {p.difficulty}
              </span>
            </Link>
          ))}
        </div>
      )}
      {list.canToggle && (
        <ExpandToggle
          expanded={list.expanded}
          hiddenCount={list.hiddenCount}
          onToggle={list.toggle}
        />
      )}
    </section>
  );
}

export function AchievementsPanel({
  achievements,
}: {
  achievements: Achievement[];
}) {
  const list = useExpandableList(achievements);

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-sm font-semibold">Achievements</h2>
      {achievements.length === 0 ? (
        <p className="text-sm text-[var(--text-dim)]">
          Achievements are not available yet.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {list.visible.map((a) => (
            <div
              key={a.id}
              className={`rounded-lg border px-3 py-2.5 ${
                a.earned
                  ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                  : "border-[var(--line)] bg-[var(--bg-inset)] opacity-60"
              }`}
            >
              <div className="text-sm font-medium">{a.title}</div>
              <p className="mt-1 text-xs text-[var(--text-dim)]">
                {a.description}
              </p>
            </div>
          ))}
        </div>
      )}
      {list.canToggle && (
        <ExpandToggle
          expanded={list.expanded}
          hiddenCount={list.hiddenCount}
          onToggle={list.toggle}
        />
      )}
    </section>
  );
}

export function PersonalBestsPanel({ bests }: { bests: PersonalBests }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-sm font-semibold">Personal bests</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] p-3">
          <div className="verdict-strip text-[var(--text-dim)]">
            Fastest accepted
          </div>
          {bests.fastestAccepted ? (
            <div className="mt-2 text-sm">
              <div className="font-medium">
                {bests.fastestAccepted.problemTitle}
              </div>
              <div className="mt-1 text-xs text-[var(--text-dim)]">
                {formatRuntime(bests.fastestAccepted.runtime)} ·{" "}
                {bests.fastestAccepted.language}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--text-dim)]">No accepted runs yet.</p>
          )}
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] p-3">
          <div className="verdict-strip text-[var(--text-dim)]">
            Hardest solved
          </div>
          {bests.hardestSolved ? (
            <div className="mt-2 text-sm">
              <div className="font-medium">
                {bests.hardestSolved.problemTitle}
              </div>
              <div className="mt-1 text-xs text-[var(--text-dim)]">
                {bests.hardestSolved.difficulty}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--text-dim)]">Solve a problem to unlock.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function ContinuePanel({
  problem,
  activeContest,
}: {
  problem: ProblemSummary | null;
  activeContest: { id: number; title: string; status: string } | null;
}) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-sm font-semibold">Continue where you left off</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {problem ? (
          <Link
            to={`/problems/${problem.id}`}
            className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-3 transition hover:border-[var(--accent)]"
          >
            <div className="verdict-strip text-[var(--accent)]">Problem</div>
            <div className="mt-1 text-sm font-medium">{problem.title}</div>
            <div className="mt-1 text-xs text-[var(--text-dim)]">
              {problem.difficulty}
            </div>
          </Link>
        ) : (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-3 text-sm text-[var(--text-dim)]">
            Browse problems to start a trail.
          </div>
        )}
        {activeContest ? (
          <Link
            to={`/competitions/${activeContest.id}`}
            className="rounded-lg border border-[var(--ok)]/30 bg-[var(--ok)]/5 px-3 py-3 transition hover:border-[var(--ok)]"
          >
            <div className="verdict-strip text-[var(--ok)]">Active contest</div>
            <div className="mt-1 text-sm font-medium">{activeContest.title}</div>
            <div className="mt-1 text-xs text-[var(--text-dim)]">
              {activeContest.status}
            </div>
          </Link>
        ) : (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-3 text-sm text-[var(--text-dim)]">
            No active contest right now.
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyCard({ title, message }: { title: string; message: string }) {
  return (
    <section className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <p className="text-sm text-[var(--text-dim)]">{message}</p>
    </section>
  );
}
