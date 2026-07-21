# Profile API — Frontend Integration Guide

This document is the frontend handoff for the profile backend.

## Base URL and authentication

Local API base URL:

```text
http://localhost:9091
```

Owner endpoints require the JWT returned by `POST /api/auth/login`:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Public profile reads do not require a token.

All error responses use:

```ts
type ApiError = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
};
```

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---:|---|
| `GET` | `/api/profile/me` | JWT | Owner aggregate profile |
| `GET` | `/api/profile/{username}` | Public | Privacy-safe public profile |
| `PATCH` | `/api/profile/me` | JWT | Update profile settings |
| `POST` | `/api/profile/me/password` | JWT | Change password |
| `GET` | `/api/profile/me/bookmarks` | JWT | List bookmarks |
| `POST` | `/api/profile/me/bookmarks/{problemId}` | JWT | Add bookmark |
| `DELETE` | `/api/profile/me/bookmarks/{problemId}` | JWT | Remove bookmark |
| `GET` | `/api/profile/me/recent-problems` | JWT | List 20 recent views |
| `POST` | `/api/profile/me/recent-problems/{problemId}` | JWT | Record/upsert a view |
| `GET` | `/api/profile/me/submissions?limit=20&cursor=` | JWT | Paginated submission rows |
| `GET` | `/api/profile/me/contests` | JWT | Contest history |

`me` is a reserved route segment and should not be used as a public username.

## TypeScript contracts

```ts
export type ProblemSummary = {
  id: number;
  title: string;
  difficulty: string;
  topics: string[];
};

export type ProfileIdentity = {
  id: number;
  name: string;
  username: string; // users.uniqueuserid
  email: string | null;
  role: "USER" | "ADMIN";
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  showEmail: boolean;
  joinedAt: string | null;
};

export type ProfileSubmission = {
  id: number;
  problemId: number;
  problemTitle: string;
  difficulty: string;
  verdict: string;
  language: string;
  runtime: number | null;
  memory: number | null;
  submittedAt: string | null;
};

export type ContestHistory = {
  competitionId: number;
  title: string;
  rank: number | null;
  solved: number;
  score: number | null;
  date: string | null;
  ratingDelta: null;
};

export type ProfileResponse = {
  identity: ProfileIdentity;
  stats: {
    totalSolved: number;
    totalSubmissions: number;
    acceptanceRate: number;
    totalRuntimeSeconds: number;
    difficulty: {
      easy: number;
      medium: number;
      hard: number;
      totalAvailable: {
        easy: number;
        medium: number;
        hard: number;
      };
    };
    currentStreak: number;
    longestStreak: number;
    contestBestRank: number | null;
    rating: null;
  };
  topics: Array<{ topic: string; solved: number; total: number }>;
  languages: Array<{ language: string; count: number; percent: number }>;
  heatmap: Array<{ date: string; count: number }>;
  weeklyActivity: Array<{ label: string; count: number }>;
  monthlyActivity: Array<{ label: string; count: number }>;
  recentSubmissions: ProfileSubmission[];
  recentSolved: ProblemSummary[];
  contestHistory: ContestHistory[];
  bookmarked: ProblemSummary[];
  recentlyViewed: ProblemSummary[];
  achievements: []; // no real achievement system yet
  personalBests: {
    fastestAccepted: {
      problemTitle: string;
      runtime: number;
      language: string;
    } | null;
    hardestSolved: {
      problemTitle: string;
      difficulty: string;
    } | null;
  };
  activeContest: {
    id: number;
    title: string;
    status: string;
  } | null;
  continueProblem: ProblemSummary | null;
};

export type ProfileSubmissionsPage = {
  items: ProfileSubmission[];
  nextCursor: number | null;
};
```

## Privacy rules

`GET /api/profile/me`:

- Includes the owner's email.
- Includes bookmarks and recent views.
- Requires JWT.

`GET /api/profile/{username}`:

- Returns `identity.email = null` unless `showEmail` is `true`.
- Always returns empty `bookmarked` and `recentlyViewed` arrays.
- Never includes passwords or submission source code.
- Works without a JWT.

`joinedAt` is `null` for users created before real registration timestamps were introduced. Do not replace it with a fabricated date.

`rating`, `ratingDelta`, and `achievements` remain null/empty until real systems exist.

Activity dates, heatmap, and streaks use UTC.

## Recommended API client functions

Add these to `frontend/src/lib/api.ts`, using the existing `request<T>()` helper:

```ts
export const getMyProfile = () =>
  request<ProfileResponse>("/api/profile/me");

export const getPublicProfile = (username: string) =>
  request<ProfileResponse>(
    `/api/profile/${encodeURIComponent(username)}`
  );

export const updateMyProfile = (data: {
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  showEmail: boolean;
}) =>
  request<User>("/api/profile/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const changeMyPassword = (data: {
  currentPassword: string;
  newPassword: string;
}) =>
  request<string>("/api/profile/me/password", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getMyBookmarks = () =>
  request<ProblemSummary[]>("/api/profile/me/bookmarks");

export const addMyBookmark = (problemId: number) =>
  request<string>(`/api/profile/me/bookmarks/${problemId}`, {
    method: "POST",
  });

export const removeMyBookmark = (problemId: number) =>
  request<string>(`/api/profile/me/bookmarks/${problemId}`, {
    method: "DELETE",
  });

export const getMyRecentProblems = () =>
  request<ProblemSummary[]>("/api/profile/me/recent-problems");

export const recordRecentProblem = (problemId: number) =>
  request<string>(`/api/profile/me/recent-problems/${problemId}`, {
    method: "POST",
  });

export const getMyProfileSubmissions = (
  limit = 20,
  cursor?: number
) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor !== undefined) params.set("cursor", String(cursor));
  return request<ProfileSubmissionsPage>(
    `/api/profile/me/submissions?${params}`
  );
};

export const getMyContestHistory = () =>
  request<ContestHistory[]>("/api/profile/me/contests");
```

The existing request helper already sends `localStorage.token` as a Bearer token.

## Owner profile integration

Replace the current multi-request/demo aggregation in
`frontend/src/features/profile/loadProfile.ts`:

```ts
export async function loadOwnerProfile(): Promise<ProfileResponse> {
  return getMyProfile();
}
```

Mapping notes:

- Backend `identity.username` already contains the unique user ID used in profile URLs.
- Backend DTOs do not include frontend provenance fields such as `source`,
  `joinedAtSource`, or `demoSections`. Remove those fields or set them to
  `"real"` only at the UI adapter boundary.
- Keep `joinedAt`, email, ranks, and rating nullable.
- Remove demo heatmap, streak, rating, achievements, and fake timestamps.

## Public profile integration

For `/users/:username`:

```ts
const profile = await getPublicProfile(username);
```

The route should work for logged-out visitors. Render email only when
`profile.identity.email !== null`.

## Profile settings integration

Replace localStorage profile metadata with:

```ts
await updateMyProfile({
  bio,
  location,
  avatarUrl,
  showEmail,
});
```

Enable password change with:

```ts
await changeMyPassword({ currentPassword, newPassword });
```

The backend enforces a minimum new-password length of 6 and verifies the
current BCrypt password. A wrong current password returns HTTP `400`.

## Bookmark and recent-view integration

On bookmark toggle:

```ts
if (isBookmarked) {
  await removeMyBookmark(problemId);
} else {
  await addMyBookmark(problemId);
}
```

When an authenticated user opens a problem:

```ts
void recordRecentProblem(problemId);
```

Do not block problem rendering if recording a recent view fails.

## Submission pagination

Load the first page:

```ts
const first = await getMyProfileSubmissions(20);
```

Load the next page:

```ts
if (first.nextCursor !== null) {
  const next = await getMyProfileSubmissions(20, first.nextCursor);
}
```

The backend clamps `limit` to `1..100`. `nextCursor = null` means there are no
more rows.

## Database setup

Existing databases:

```bash
psql -U postgres -d codeit -f schema/profile.sql
```

Fresh databases use the updated:

```bash
psql -U postgres -d codeit -f schema/schema.sql
```

Do not run `schema.sql` as a replacement migration on a production database;
use `profile.sql` for existing installations.

## Backend implementation files

- `schema/profile.sql`
- `schema/schema.sql`
- `src/main/java/com/codeit/modules/profile/ProfileController.java`
- `src/main/java/com/codeit/modules/profile/ProfileService.java`
- `src/main/java/com/codeit/modules/profile/ProfileRepository.java`
- `src/main/java/com/codeit/modules/profile/dto/*.java`
- `src/main/java/com/codeit/modules/user/User.java`
- `src/main/java/com/codeit/modules/user/UserRepository.java`
- `src/main/java/com/codeit/modules/submission/Submission.java`
- `src/main/java/com/codeit/modules/submission/SubmissionRowMapper.java`
- `src/main/java/com/codeit/modules/submission/SubmissionRepository.java`
- `src/main/java/com/codeit/config/SecurityConfig.java`
