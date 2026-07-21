# Profile Backend Requirements (Handoff)

Frontend-only profile UX currently lives at:

- `/profile` (owner)
- `/users/:username` (public URL reserved; only owner works today)
- `/settings/profile` (local browser settings)

Real data today comes from existing submission/problem/competition APIs.
Heatmap, streaks, rating, achievements, and missing submission timestamps use **clearly labeled demo analytics**.
Bookmarks, recent views, bio/location/avatar/email visibility are stored in **user-scoped localStorage**.

This document defines what backend should implement so the frontend can drop demo/local fallbacks without UI rewrites.

---

## Goals

1. Provide an aggregate owner profile DTO and a privacy-safe public profile DTO.
2. Expose submission chronology, activity, contest history, bookmarks, and recent views.
3. Support profile update + password change.
4. Never fabricate historical registration dates, ranks, ratings, bookmarks, or views.

---

## Suggested additive schema

```sql
-- users extensions
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS show_email BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ, -- leave existing rows NULL
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT NOW();

-- profile query indexes on existing submissions
CREATE INDEX IF NOT EXISTS idx_submissions_user_created
  ON submissions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_user_accepted
  ON submissions (user_id, problem_id)
  WHERE status = 'Accepted';

-- bookmarks
CREATE TABLE IF NOT EXISTS user_problem_bookmarks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, problem_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created
  ON user_problem_bookmarks (user_id, created_at DESC);

-- recent views
CREATE TABLE IF NOT EXISTS user_problem_recent_views (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  view_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, problem_id)
);
CREATE INDEX IF NOT EXISTS idx_recent_views_user
  ON user_problem_recent_views (user_id, last_viewed_at DESC);

-- optional durable contest results (future rating)
CREATE TABLE IF NOT EXISTS competition_results (
  competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  solved INTEGER NOT NULL DEFAULT 0,
  score DOUBLE PRECISION,
  finalized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (competition_id, user_id)
);
```

Also expose `submissions.created_at` in Java `Submission` + `SubmissionRowMapper`.

---

## Required APIs

### 1) Owner profile aggregate

`GET /api/profile/me`  
Auth: required

Response shape (matches frontend `ProfileViewModel` intent):

```json
{
  "identity": {
    "id": 1,
    "name": "Ada",
    "username": "ada_l",
    "email": "ada@codeit.dev",
    "role": "USER",
    "bio": "...",
    "location": "...",
    "avatarUrl": "...",
    "showEmail": false,
    "joinedAt": "2025-03-01T00:00:00Z"
  },
  "stats": {
    "totalSolved": 12,
    "totalSubmissions": 40,
    "acceptanceRate": 45.0,
    "totalRuntimeSeconds": 3.421,
    "difficulty": {
      "easy": 5,
      "medium": 5,
      "hard": 2,
      "totalAvailable": { "easy": 20, "medium": 30, "hard": 15 }
    },
    "currentStreak": 3,
    "longestStreak": 11,
    "contestBestRank": 4,
    "rating": null
  },
  "topics": [{ "topic": "Arrays", "solved": 4, "total": 12 }],
  "languages": [{ "language": "python", "count": 20, "percent": 50 }],
  "heatmap": [{ "date": "2026-07-01", "count": 2 }],
  "weeklyActivity": [{ "label": "Jul 1", "count": 5 }],
  "monthlyActivity": [{ "label": "Jul", "count": 22 }],
  "recentSubmissions": [
    {
      "id": 99,
      "problemId": 12,
      "problemTitle": "Two Sum",
      "difficulty": "EASY",
      "verdict": "Accepted",
      "language": "python",
      "runtime": 0.012,
      "memory": 10240,
      "submittedAt": "2026-07-20T10:00:00Z"
    }
  ],
  "recentSolved": [{ "id": 12, "title": "Two Sum", "difficulty": "EASY", "topics": ["Arrays"] }],
  "contestHistory": [
    {
      "competitionId": 3,
      "title": "Weekly Sprint",
      "rank": 4,
      "solved": 2,
      "score": 1.24,
      "date": "2026-07-10T18:00:00Z",
      "ratingDelta": null
    }
  ],
  "bookmarked": [],
  "recentlyViewed": [],
  "achievements": [],
  "personalBests": {
    "fastestAccepted": {
      "problemTitle": "Two Sum",
      "runtime": 0.008,
      "language": "python"
    },
    "hardestSolved": {
      "problemTitle": "Hard DP",
      "difficulty": "HARD"
    }
  },
  "activeContest": { "id": 8, "title": "July Arena", "status": "ACTIVE" },
  "continueProblem": { "id": 12, "title": "Two Sum", "difficulty": "EASY", "topics": ["Arrays"] }
}
```

Rules:

- Do **not** include source code in profile DTOs.
- `rating` may be `null` until rating system exists.
- Streaks/heatmap must be computed from real `created_at` (timezone policy documented).
- Unknown historical `joinedAt` should be `null`, not deployment time.

### 2) Public profile

`GET /api/profile/{username}`  
Auth: optional

Same shape as owner profile **except**:

- `email` only if `showEmail=true`
- no private settings
- bookmarks/recent views omitted or empty
- never include submission source code

### 3) Update profile

`PATCH /api/profile/me`  
Auth: required

```json
{
  "bio": "string|null",
  "location": "string|null",
  "avatarUrl": "string|null",
  "showEmail": false
}
```

### 4) Change password

`POST /api/profile/me/password`  
Auth: required

```json
{
  "currentPassword": "...",
  "newPassword": "..."
}
```

Validate current password, enforce min length 6 (or stronger policy), BCrypt-hash new password.

### 5) Bookmarks

- `GET /api/profile/me/bookmarks`
- `POST /api/profile/me/bookmarks/{problemId}`
- `DELETE /api/profile/me/bookmarks/{problemId}`

### 6) Recent views

- `POST /api/profile/me/recent-problems/{problemId}` (upsert `last_viewed_at`)
- Included in `/api/profile/me` as `recentlyViewed` (limit 20)

### 7) Paginated submissions (profile tab)

`GET /api/profile/me/submissions?limit=20&cursor=`

Must return:

- `id`, `problemId`, `problemTitle`, `difficulty`, `verdict`, `language`, `runtime`, `memory`, `submittedAt`

Also fix existing `GET /api/submissions/user/{userId}` mapper to include `createdAt` and preferably problem title for owner history pages.

### 8) Contest history

`GET /api/profile/me/contests`

Prefer durable `competition_results` once available. Until then, derive from leaderboard + participation, but:

- include participants with zero solves if they joined
- do not invent ranks/ratings

---

## Metric definitions

| Metric | Definition |
|---|---|
| totalSolved | Distinct `problem_id` with verdict exactly `Accepted` |
| acceptanceRate | Accepted submissions / total submissions * 100 |
| totalRuntimeSeconds | Sum of non-null runtimes |
| difficulty solved | Distinct accepted problems grouped by problem.difficulty |
| topic progress | Distinct accepted problems intersecting topic membership |
| language usage | Count submissions by language slug |
| heatmap | Count submissions per UTC/local day (document timezone) |
| streak | Consecutive days with >=1 submission ending today/yesterday |

---

## Privacy & auth

- Owner endpoints require JWT and must ignore request userId spoofing (use SecurityUtils).
- Public profile hides email by default.
- `/api/submissions/problem/{id}` currently returns source code to any authenticated user; **do not reuse** it for public activity feeds.
- Admin-only user list endpoints remain admin-only.

---

## Migration / backfill policy

1. Additive migrations only.
2. Existing `users.created_at` stays `NULL` for old rows.
3. Do not backfill fake bookmarks/views/achievements/ratings.
4. Heatmap/streaks only use real `submissions.created_at`.
5. Introduce Flyway/Liquibase before more schema churn.

---

## Frontend replacement checklist

Once APIs ship, frontend should:

1. Replace `loadOwnerProfile()` demo merge with `GET /api/profile/me`.
2. Replace localStorage meta/bookmarks/recent with API calls.
3. Enable public `/users/:username` via `GET /api/profile/{username}`.
4. Wire settings save + password change to PATCH/POST endpoints.
5. Remove demo badges/banners when corresponding fields are no longer synthetic.

Until then, keep demo labels visible.
