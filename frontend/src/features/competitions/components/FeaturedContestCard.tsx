import { Link } from "react-router-dom";
import { Sparkles, Users } from "lucide-react";
import type { ContestCardModel } from "../types";
import { formatDuration } from "../adapters";
import CountdownTimer from "./CountdownTimer";
import ContestStatusBadge from "./ContestStatusBadge";

export default function FeaturedContestCard({
  contest,
  isAuthenticated,
}: {
  contest: ContestCardModel;
  isAuthenticated: boolean;
}) {
  const countdownTarget =
    contest.status === "ACTIVE" ? contest.endTime : contest.startTime;
  const countdownLabel =
    contest.status === "ACTIVE" ? "Ends in" : "Starts in";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--accent)]/30 bg-[var(--bg-raised)] p-5 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,166,35,0.18),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(91,168,255,0.12),transparent_40%)]"
      />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_240px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
              <Sparkles className="h-3 w-3" aria-hidden />
              Featured
            </span>
            <ContestStatusBadge
              status={contest.status}
              contestType={contest.contestType}
            />
          </div>
          <h2 className="display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {contest.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-dim)]">
            {contest.description ||
              "Improve your rating under real contest pressure. Join now and compete on timed problems with live standings."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--text-dim)]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-inset)]/70 px-3 py-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {contest.participantCount ?? "—"} participants
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--bg-inset)]/70 px-3 py-1">
              {contest.problemCount ?? "—"} problems
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--bg-inset)]/70 px-3 py-1">
              {formatDuration(contest.durationMinutes)}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--bg-inset)]/70 px-3 py-1">
              {contest.contestType ?? "Type soon"} ·{" "}
              {contest.difficulty ?? "Mixed"}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to={`/competitions/${contest.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0a0d12] shadow-[0_8px_24px_rgba(245,166,35,0.22)] transition hover:brightness-110"
            >
              {isAuthenticated ? "Join contest" : "View contest"}
            </Link>
            <Link
              to={`/competitions/${contest.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--bg-inset)]/60 px-4 py-2.5 text-sm text-[var(--text)] transition hover:border-[var(--info)]"
            >
              View details
            </Link>
          </div>
        </div>

        {contest.status !== "ENDED" ? (
          <CountdownTimer targetIso={countdownTarget} label={countdownLabel} />
        ) : (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-4 text-sm text-[var(--text-dim)]">
            This featured contest has ended. Browse history or join the next one.
          </div>
        )}
      </div>
    </section>
  );
}
