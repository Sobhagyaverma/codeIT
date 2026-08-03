import type { Competition } from "../../lib/api";
import type {
  ContestCardModel,
  ContestDashboardData,
  ContestDifficulty,
  ContestHistoryRow,
  ContestStatus,
  ContestType,
  ContestUserStats,
} from "./types";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function parseContestType(value: unknown): ContestType {
  const raw = asString(value)?.toUpperCase();
  if (
    raw === "WEEKLY" ||
    raw === "BIWEEKLY" ||
    raw === "MONTHLY" ||
    raw === "PRACTICE"
  ) {
    return raw;
  }
  return null;
}

function parseDifficulty(value: unknown): ContestDifficulty {
  const raw = asString(value)?.toUpperCase();
  if (raw === "EASY" || raw === "MEDIUM" || raw === "HARD" || raw === "MIXED") {
    return raw;
  }
  return null;
}

function resolveStatus(
  status: Competition["status"],
  startTime: string,
  endTime: string
): ContestStatus {
  const now = Date.now();
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (Number.isFinite(start) && Number.isFinite(end)) {
    if (now < start) return "UPCOMING";
    if (now <= end) return "ACTIVE";
    return "ENDED";
  }
  return status;
}

function durationFromTimes(startTime: string, endTime: string): number | null {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.round((end - start) / 60_000);
}

export function toContestCard(
  competition: Competition,
  counts?: { problemCount?: number | null; participantCount?: number | null }
): ContestCardModel {
  const startTime = competition.startTime;
  const endTime = competition.endTime;
  const durationMinutes =
    asNumber(competition.durationMinutes) ??
    durationFromTimes(startTime, endTime);

  return {
    id: competition.id,
    title:
      asString(competition.title) ||
      asString(competition.name) ||
      `Competition #${competition.id}`,
    description: asString(competition.description) || "",
    status: resolveStatus(competition.status, startTime, endTime),
    startTime,
    endTime,
    durationMinutes,
    problemCount: counts?.problemCount ?? asNumber(competition.problemCount),
    participantCount:
      counts?.participantCount ?? asNumber(competition.participantCount),
    contestType: parseContestType(competition.contestType),
    difficulty: parseDifficulty(competition.difficulty),
    isFeatured: asBoolean(competition.isFeatured),
  };
}

function buildUserStats(history: ContestHistoryRow[]): ContestUserStats {
  const ranked = history
    .map((row) => row.rank)
    .filter((rank): rank is number => rank != null && rank >= 1);

  return {
    contestsPlayed: history.length,
    bestRank: ranked.length ? Math.min(...ranked) : null,
    recentRank: ranked[0] ?? null,
    averageRank: ranked.length
      ? Number(
          (ranked.reduce((sum, rank) => sum + rank, 0) / ranked.length).toFixed(1)
        )
      : null,
  };
}

export function buildContestDashboard(
  competitions: Competition[],
  countsById: Record<
    number,
    { problemCount: number | null; participantCount: number | null }
  >,
  historyRaw: ContestHistoryRow[]
): ContestDashboardData {
  const contests = competitions
    .map((competition) =>
      toContestCard(competition, countsById[competition.id])
    )
    .sort(
      (a, b) => Date.parse(b.startTime) - Date.parse(a.startTime) || b.id - a.id
    );

  const live = contests.filter((c) => c.status === "ACTIVE");
  const upcoming = contests
    .filter((c) => c.status === "UPCOMING")
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  const past = contests.filter((c) => c.status === "ENDED");

  const featured =
    contests.find((c) => c.isFeatured && c.status !== "ENDED") ||
    live[0] ||
    upcoming[0] ||
    null;

  const participantSum = contests.reduce((sum, contest) => {
    if (contest.participantCount == null) return sum;
    return sum + contest.participantCount;
  }, 0);
  const hasAnyParticipants = contests.some((c) => c.participantCount != null);

  return {
    contests,
    featured,
    live,
    upcoming,
    past,
    stats: {
      total: contests.length,
      active: live.length,
      upcoming: upcoming.length,
      ended: past.length,
      totalParticipants: hasAnyParticipants ? participantSum : null,
    },
    history: historyRaw,
    userStats: buildUserStats(historyRaw),
  };
}

export function formatContestWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDuration(minutes: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatSecondsClock(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}
