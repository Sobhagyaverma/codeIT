# Competitions Dashboard API — Backend Handoff

Frontend redesign for `/competitions` is live. Postgres schema for contest metadata, ratings, and virtual sessions is already applied. This document describes the API work needed so the UI can stop showing placeholders.

## Schema already applied

```text
competitions.contest_type
competitions.difficulty
competitions.is_featured
competitions.registration_deadline
competitions.created_at

competition_results.penalty_seconds
competition_results.rating_before
competition_results.rating_after
competition_results.rating_change

user_contest_ratings
competition_virtual_sessions
```

## Current frontend consumers

| UI need | Today | Desired |
|---|---|---|
| List contests | `GET /api/competitions/getAllCompetitions` | Same or aggregated dashboard |
| Problem count | N+1 `GET .../getProblemsOf/{id}/problems` | Include `problemCount` |
| Participant count | N+1 `GET .../{id}/participants` | Include `participantCount` |
| Contest history | `GET /api/profile/me/contests` | Keep + rating deltas |
| Contest type / difficulty / featured | Not in DTO | Return new columns |
| Ratings | Placeholder | `user_contest_ratings` |
| Virtual participate | Coming soon button | Virtual session APIs |

## 1. Extend competition list/detail DTO

Return these fields from list and get-by-id responses:

```ts
type CompetitionDTO = {
  id: number;
  title: string;
  description: string | null;
  startTime: string;          // ISO
  endTime: string;            // ISO
  createdBy: number;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  durationMinutes: number;
  contestType: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "PRACTICE";
  difficulty: "EASY" | "MEDIUM" | "HARD" | "MIXED";
  isFeatured: boolean;
  registrationDeadline: string | null;
  createdAt: string;
  problemCount: number;
  participantCount: number;
};
```

Update:

- `Competition.java`
- repository `SELECT` / row mappers
- create/update payloads so admins can set type, difficulty, featured

Keep status resolution as time-based `UPCOMING | ACTIVE | ENDED`.

## 2. Preferred aggregated endpoint

To avoid N+1 count fetches:

```http
GET /api/competitions/dashboard
Authorization: optional Bearer
```

```ts
type CompetitionsDashboardResponse = {
  contests: CompetitionDTO[];
  stats: {
    total: number;
    active: number;
    upcoming: number;
    ended: number;
    totalParticipants: number; // sum or distinct users
  };
  featuredCompetitionId: number | null;
};
```

SQL tip: join aggregates once:

```sql
SELECT c.*,
       COALESCE(p.problem_count, 0) AS problem_count,
       COALESCE(u.participant_count, 0) AS participant_count
FROM competitions c
LEFT JOIN (
  SELECT competition_id, COUNT(*) AS problem_count
  FROM competition_problems
  GROUP BY competition_id
) p ON p.competition_id = c.id
LEFT JOIN (
  SELECT competition_id, COUNT(*) AS participant_count
  FROM competition_participants
  GROUP BY competition_id
) u ON u.competition_id = c.id
ORDER BY c.start_time DESC;
```

## 3. Ratings

### `GET /api/competitions/me/rating`

```ts
type UserContestRatingDTO = {
  currentRating: number;
  highestRating: number;
  contestsPlayed: number;
  bestRank: number | null;
  updatedAt: string;
};
```

### History rating deltas

Extend `GET /api/profile/me/contests` (or dashboard history) so `ratingDelta` is populated from `competition_results.rating_change` instead of always `null`.

Also return `penaltySeconds` from `competition_results.penalty_seconds` when finalized.

## 4. Virtual participation

```http
POST /api/competitions/{id}/virtual/start
POST /api/competitions/{id}/virtual/end
GET  /api/competitions/{id}/virtual/session
```

Use `competition_virtual_sessions`.

Rules:

- Only for `ENDED` contests (or practice contests if product allows)
- One active virtual session per user × contest
- `deadline_at = started_at + duration_minutes`
- Virtual submissions should be tagged distinctly or excluded from live leaderboards

## 5. Finalized results

Prefer writing `competition_results` when a contest ends (cron or end-session hook):

- `rank`, `solved`, `score` / `penalty_seconds`
- optional rating before/after/change once a rating engine exists

Frontend history can then read durable rows instead of live-derived ranks.

## 6. Auth notes

- Public catalog can remain JWT-optional for browsing
- `/me/rating`, virtual routes, and personal history require JWT
- Do not put personalized rating into a globally cached Redis list key

## 7. Frontend readiness checklist

When APIs ship, frontend can:

1. Stop fan-out problem/participant requests
2. Enable type/difficulty filters with real values
3. Show rating cards and rating deltas in history
4. Enable Virtual participation buttons
5. Prefer `isFeatured` from API over heuristic featured selection

Until then, placeholders remain intentional.
