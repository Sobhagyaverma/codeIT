import { Link } from "react-router-dom";
import { Clock3, Layers3, Users } from "lucide-react";
import type { ContestCardModel } from "../types";
import { formatContestWhen, formatDuration } from "../adapters";
import CountdownTimer from "./CountdownTimer";
import ContestStatusBadge from "./ContestStatusBadge";

export default function ContestCard({
  contest,
  isAuthenticated,
}: {
  contest: ContestCardModel;
  isAuthenticated: boolean;
}) {
  const countdownTarget =
    contest.status === "ACTIVE" ? contest.endTime : contest.startTime;
  const countdownLabel =
    contest.status === "ACTIVE"
      ? "Ends in"
      : contest.status === "UPCOMING"
        ? "Starts in"
        : "Finished";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 p-4 practice-glass practice-card hover:-translate-y-0.5 hover:border-[var(--info)]/40 hover:shadow-[0_14px_36px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="display truncate text-lg font-semibold">
            {contest.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <ContestStatusBadge
              status={contest.status}
              contestType={contest.contestType}
            />
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-dim)]">
              {contest.contestType ?? "Type soon"}
            </span>
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-dim)]">
              {contest.difficulty ?? "Difficulty —"}
            </span>
          </div>
        </div>
        {contest.status !== "ENDED" && (
          <CountdownTimer targetIso={countdownTarget} label={countdownLabel} />
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-[var(--text-dim)]">
        {contest.description ||
          "Compete under timed conditions and climb the standings."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--text-dim)] sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2">
          <div className="mb-1 flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" aria-hidden />
            Start
          </div>
          <div className="text-[var(--text)]">{formatContestWhen(contest.startTime)}</div>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2">
          <div className="mb-1 flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" aria-hidden />
            End
          </div>
          <div className="text-[var(--text)]">{formatContestWhen(contest.endTime)}</div>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2">
          <div className="mb-1">Duration</div>
          <div className="text-[var(--text)]">
            {formatDuration(contest.durationMinutes)}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2">
          <div className="mb-1 flex items-center gap-1">
            <Layers3 className="h-3.5 w-3.5" aria-hidden />
            Problems
          </div>
          <div className="text-[var(--text)]">
            {contest.problemCount ?? "—"}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2">
          <div className="mb-1 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Participants
          </div>
          <div className="text-[var(--text)]">
            {contest.participantCount ?? "—"}
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Link
          to={`/competitions/${contest.id}`}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-[#0a0d12] transition hover:brightness-110"
        >
          {contest.status === "ENDED"
            ? "View room"
            : isAuthenticated
              ? "Join contest"
              : "View contest"}
        </Link>
        <Link
          to={`/competitions/${contest.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] px-3.5 py-2 text-sm text-[var(--text-dim)] transition hover:border-[var(--info)] hover:text-[var(--text)]"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
