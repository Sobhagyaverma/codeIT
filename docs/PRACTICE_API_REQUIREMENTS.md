# Practice API Requirements

Frontend handoff for the redesigned CodeIT Practice experience (`/dsa-sheet` and `/problems`).

The frontend currently derives progress from existing endpoints:

- `GET /api/problems`
- `GET /api/submissions/user/{userId}`
- `GET /api/profile/me`
- `GET|POST|DELETE /api/profile/me/bookmarks...`

This document defines the **additional APIs** required for full Practice parity. Backend owns implementation. Until these ship, the UI shows polished `—` / “Coming soon” states and never fabricates metrics.

## Conventions

- Base URL (local): `http://localhost:9091`
- Auth: `Authorization: Bearer <jwt>` when the response is personalized
- Public reads may omit the token; personalized fields then return `null` / empty
- Errors:

```json
{
  "timestamp": "2026-07-21T04:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable reason"
}
```

- Status enum for a user × problem:

```ts
type PracticeStatus = "SOLVED" | "ATTEMPTED" | "NOT_STARTED";
```

Semantics:

- `SOLVED` — at least one submission with status `Accepted`
- `ATTEMPTED` — at least one submission and none accepted
- `NOT_STARTED` — no submissions by the current user

## 1. Problem catalog (Problems page)

### `GET /api/practice/problems`

Paginated catalog with aggregate metrics and optional personalization.

Query params:

| Param | Type | Notes |
|---|---|---|
| `q` | string | Title/topic search |
| `difficulty` | `EASY\|MEDIUM\|HARD` | Optional |
| `topic` | string | Exact topic label |
| `status` | PracticeStatus | Requires auth; ignored anonymously |
| `favorites` | boolean | Requires auth |
| `revision` | boolean | Requires auth |
| `acceptanceMin` | number | 0–100 |
| `acceptanceMax` | number | 0–100 |
| `sort` | string | `name`, `difficulty`, `newest`, `oldest`, `acceptance`, `mostSolved`, `random` |
| `seed` | string | Required when `sort=random` for stable shuffle |
| `cursor` | string | Opaque cursor |
| `limit` | number | Default 50, max 100 |

Response:

```ts
type PracticeProblemCatalogPage = {
  items: PracticeProblemCatalogItem[];
  nextCursor: string | null;
  totals: {
    total: number;
    solved: number;      // current user, else 0
    attempted: number;   // current user, else 0
    notStarted: number;  // current user, else totals.total
  };
};

type PracticeProblemCatalogItem = {
  id: number;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | string;
  topics: string[];
  acceptanceRate: number | null;   // acceptedSubmissions / totalSubmissions * 100
  solvedCount: number;             // distinct users with Accepted
  submissionCount: number;         // all submissions for the problem
  createdAt: string;               // ISO-8601
  status: PracticeStatus | null;   // null when anonymous
  bookmarked: boolean;             // false when anonymous
  markedForRevision: boolean;      // false when anonymous
  lastAttemptAt: string | null;
  lastSolvedAt: string | null;
  companyTags: string[];           // may be empty until populated
  isPremium: boolean;              // future-ready, default false
};
```

Aggregation notes:

- Include competition submissions in `submissionCount` / acceptance unless product later opts out.
- Acceptance: `COUNT(*) FILTER (WHERE status = 'Accepted') / COUNT(*)`.
- `solvedCount`: `COUNT(DISTINCT user_id) FILTER (WHERE status = 'Accepted')`.

Schema prerequisites:

- `problems.created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Backfill existing rows with a deterministic timestamp (e.g. `NOW() - (id || ' days')::interval`) so newest/oldest sorting is stable.
- Recommended index: `(problem_id)` already exists; consider partial `(problem_id, user_id) WHERE status = 'Accepted'`.

Do **not** cache personalized statuses in the shared Redis problem list.

## 2. DSA roadmap / sheet

### `GET /api/practice/sheet`

Returns the ordered CodeIT curriculum with per-module progress.

```ts
type PracticeSheetResponse = {
  modules: Array<{
    id: string;            // stable slug, e.g. "arrays"
    title: string;
    description: string;
    order: number;
    solved: number;
    total: number;
    percent: number;
    difficulty: {
      easy: { solved: number; total: number };
      medium: { solved: number; total: number };
      hard: { solved: number; total: number };
    };
    problems: PracticeProblemCatalogItem[];
  }>;
  stats: {
    total: number;
    solved: number;
    percent: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
  };
};
```

Backend may own module ordering (preferred) or accept the frontend roadmap as a temporary mapping. Either way, each problem should appear in **exactly one** module.

## 3. Favorites (exists) and revision queue

Favorites already live under `/api/profile/me/bookmarks`. Keep them.

### Revision queue

```http
GET    /api/practice/me/revision
POST   /api/practice/me/revision/{problemId}
DELETE /api/practice/me/revision/{problemId}
```

Suggested table:

```sql
CREATE TABLE IF NOT EXISTS user_problem_revision (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, problem_id)
);
```

## 4. Notes, resources, videos

### Notes

```http
GET /api/practice/me/notes/{problemId}
PUT /api/practice/me/notes/{problemId}
```

```ts
type ProblemNote = {
  problemId: number;
  content: string;      // markdown, max ~20k chars
  updatedAt: string;
};
```

### Resources / video metadata (content CMS)

```http
GET /api/practice/problems/{problemId}/resources
```

```ts
type ProblemResources = {
  problemId: number;
  articles: Array<{ id: string; title: string; url: string }>;
  videos: Array<{ id: string; title: string; url: string; durationSec?: number }>;
};
```

Until content exists, return empty arrays (not 404).

## 5. Practice sidebar / challenges / recommendations

### `GET /api/practice/me/sidebar`

```ts
type PracticeSidebarResponse = {
  streak: number;
  weeklyGoal: { target: number; completed: number };
  heatmap: Array<{ date: string; count: number }>;
  continueProblem: PracticeProblemCatalogItem | null;
  recentlySolved: PracticeProblemCatalogItem[];
  recentlyViewed: PracticeProblemCatalogItem[];
  dailyChallenge: {
    problem: PracticeProblemCatalogItem;
    expiresAt: string;
  } | null;
  weeklyChallenge: {
    title: string;
    problems: PracticeProblemCatalogItem[];
    expiresAt: string;
  } | null;
  trendingTopics: Array<{ topic: string; count: number }>;
  suggested: PracticeProblemCatalogItem[];
};
```

Auth required. Anonymous clients should not call this route.

Daily/weekly challenge generation can be cron-based; null is acceptable when none is scheduled.

## 6. Auth and privacy

| Route | Auth |
|---|---|
| `GET /api/practice/problems` | Optional JWT |
| `GET /api/practice/sheet` | Optional JWT |
| `GET /api/practice/problems/{id}/resources` | Public or optional JWT |
| `*/me/*` routes | Required JWT |

Never return another user’s notes, revision list, or bookmarks.

## 7. Frontend readiness checklist

When implementing, confirm the frontend can:

1. Replace nullable `acceptanceRate` / `solvedCount` / `submissionCount` / `createdAt` with live values
2. Enable acceptance-range filters and most-solved / newest sorts without fallbacks
3. Enable Revision / Notes / Resources / Video buttons
4. Replace “Coming soon” challenge widgets with live cards
5. Optionally stop client-side module assignment once `/api/practice/sheet` is authoritative

Until then, keep response shapes backward compatible and additive.

## 8. Performance guidance

- Prefer one SQL CTE for catalog aggregates rather than N+1 submission queries
- Cursor pagination by `(created_at DESC, id DESC)` or `(title ASC, id ASC)` depending on sort
- Invalidate only public aggregate caches on new submissions; never mix user status into shared Redis keys
- Cap catalog `limit` at 100; sheet endpoint may return full curriculum for current problem volume
