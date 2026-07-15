# CodeIT

A Spring Boot coding platform backend where users browse problems, run code, and submit solutions judged against hidden test cases via [Judge0](https://github.com/judge0/judge0).

## Tech Stack

- Java 21
- Spring Boot 4
- PostgreSQL
- Redis (caching)
- Spring Security + JWT
- Judge0 (code execution)
- WebSocket (STOMP over SockJS)
- Maven

## Prerequisites

- JDK 21+
- Maven 3.9+
- PostgreSQL (database: `codeit`)
- Redis (default: `localhost:6379`)
- Judge0 running locally (default: `http://localhost:2358`)

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Sobhagyaverma/codeIT.git
   cd codeIT
   ```

2. **Create the database and load the schema**

   ```sql
   CREATE DATABASE codeit;
   ```

   ```bash
   psql -U postgres -d codeit -f schema/schema.sql
   ```

   That creates `users`, `problems`, `competitions`, `competition_participants`, `competition_problems`, and `submissions`.  
   If you already have an older DB without per-user session columns, run `schema/competition_session.sql` instead of recreating everything.

3. **Configure environment variables**

   ```bash
   export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/codeit
   export SPRING_DATASOURCE_USERNAME=postgres
   export SPRING_DATASOURCE_PASSWORD=your_password
   export JUDGE0_API_URL=http://localhost:2358
   export CODEIT_JWT_SECRET=change-me-to-a-secret-at-least-32-characters-long
   ```

   Alternatively, create `src/main/resources/application-local.properties` (gitignored) with your local values.

4. **Run the application**

   ```bash
   ./mvnw spring-boot:run
   ```

   The API starts on **http://localhost:9091**.

## Authentication (JWT)

Stateless JWT auth via Spring Security. Passwords are stored with **BCrypt**. Most REST APIs require `Authorization: Bearer <token>`.

### JWT config

[`application.properties`](src/main/resources/application.properties):

```properties
codeit.jwt.secret=${CODEIT_JWT_SECRET:change-me-to-a-secret-at-least-32-characters-long}
codeit.jwt.expiration-ms=86400000
```

Set `CODEIT_JWT_SECRET` in production (at least 32 characters). Default expiry is **24 hours**.

Token claims: `sub` (email), `userId`, `role` (`USER` or `ADMIN`), `exp`.

### Register

```bash
curl -X POST http://localhost:9091/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@test.com","password":"secret123"}'
```

Returns `201` with `User created successfully`. Public register always creates role `USER` (client-supplied `role` is ignored). Password hashes are never returned in API responses.

### Login

```bash
curl -X POST http://localhost:9091/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"secret123"}'
```

Success (`200`):

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 1,
  "email": "alice@test.com",
  "role": "USER",
  "expiresIn": 86400000
}
```

Invalid credentials → `401` JSON: `{ "status": 401, "error": "Unauthorized", "message": "Invalid email or password" }`.

### Call protected APIs

```bash
curl http://localhost:9091/api/problems \
  -H "Authorization: Bearer <token>"
```

| Situation | HTTP |
|-----------|------|
| Missing / invalid token on protected route | `401 Unauthorized` |
| Authenticated but lacking `ADMIN` role | `403 Forbidden` |

### Access rules

| Endpoints | Access |
|-----------|--------|
| `POST /api/auth/login`, `POST /api/user/register` | Public |
| `GET /api/health/**` | Public |
| `/ws/**` | Public (WebSocket JWT deferred) |
| Most `/api/**` | Authenticated (Bearer JWT) |
| `POST /api/problems` | `ADMIN` |
| `POST /api/competitions/create`, `addProblemsTo/**`, `PATCH .../times` | `ADMIN` |
| `GET/DELETE /api/user/**` (except register) | `ADMIN` |
| `GET /api/submissions/user/{userId}` | Own `userId`, or `ADMIN` |

Identity for join / start / session / submit is taken from the JWT — do **not** send `userId` in query params or body.

### Promote an admin (SQL)

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'alice@test.com';
```

Log in again so the new token includes `role: ADMIN`.

### Migration note

Users created before JWT/BCrypt was added have plain-text passwords and cannot log in. Delete them and re-register, or update passwords to BCrypt hashes.

### Quick check

```bash
# Public
curl http://localhost:9091/api/health/redis

# No token → 401
curl http://localhost:9091/api/problems

# With token → 200
curl http://localhost:9091/api/problems -H "Authorization: Bearer <token>"
```

## Redis Caching

CodeIT uses **cache-aside** Redis caching to reduce PostgreSQL load during problem reads, submissions, and competitions.

### Start Redis

```bash
# Docker (recommended)
docker run -d --name redis -p 6379:6379 redis:7

# Or Homebrew
brew services start redis

redis-cli ping   # expect PONG
```

### Configuration

[`application.properties`](src/main/resources/application.properties):

```properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
codeit.cache.leaderboard-ttl-seconds=60
codeit.cache.competition-ttl-seconds=120
codeit.cache.problem-ttl-seconds=1800
codeit.cache.testcase-ttl-seconds=1800
codeit.judge.max-parallelism=8
```

### Cache keys

| Key | Value | TTL | Used by |
|-----|-------|-----|---------|
| `problem:public:{id}` | Problem JSON (no test cases) | 30 min | `GET /api/problems/{id}` |
| `problem:judge:{id}` | Full problem JSON | 30 min | Submit / judge path |
| `problem:all` | Problem list JSON | 30 min | `GET /api/problems` |
| `testcases:problem:{id}` | Parsed test cases JSON | 30 min | `POST /api/submissions/submit` |
| `leaderboard:competition:{id}` | Leaderboard entries JSON | 60s | `GET /api/competitions/{id}/leaderboard` |
| `competitions:all` | Competition list JSON | 2 min | `GET /api/competitions/getAllCompetitions` |
| `competition:{id}` | Single competition JSON | 2 min | `GET /api/competitions/get/{id}` |

### Health check

```bash
curl http://localhost:9091/api/health/redis
```

### Verification commands

```bash
# Problem cache
curl http://localhost:9091/api/problems/1
redis-cli GET problem:public:1

# Leaderboard cache (requires JWT)
curl http://localhost:9091/api/competitions/1/leaderboard \
  -H "Authorization: Bearer <token>"
redis-cli GET leaderboard:competition:1

# Competition cache (requires JWT)
curl http://localhost:9091/api/competitions/getAllCompetitions \
  -H "Authorization: Bearer <token>"
redis-cli GET competitions:all

# Test case cache (after an authenticated submit)
redis-cli GET testcases:problem:1
```


### Parallel judging

Test cases run in parallel via a bounded thread pool (`codeit.judge.max-parallelism`). Results are evaluated in **original order** so early-exit on Wrong Answer / Runtime Error still works. Judge0 URL is read from `judge0.api.url`.

## API Overview

Auth column: **Public** | **JWT** (any authenticated user) | **ADMIN** (JWT + `ADMIN` role).

### Health

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health/redis` | Redis connectivity smoke test | Public |

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login; returns JWT | Public |

### Problems

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/problems` | List all problems (test cases hidden) | JWT |
| GET | `/api/problems/{id}` | Get problem by ID | JWT |
| GET | `/api/problems/difficulty/{difficulty}` | Filter by difficulty | JWT |
| GET | `/api/problems/topic/{topic}` | Filter by topic | JWT |
| GET | `/api/problems/search?keyword=` | Search problems | JWT |
| POST | `/api/problems` | Create a problem | ADMIN |

### Submissions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/submissions/languages` | List supported languages (slug, name, languageId) | JWT |
| POST | `/api/submissions/run` | Run code once (no DB save) | JWT |
| POST | `/api/submissions/submit` | Run all hidden test cases, save verdict (`userId` from JWT) | JWT |
| GET | `/api/submissions/user/{userId}` | Submission history (own user, or ADMIN) | JWT |
| GET | `/api/submissions/problem/{problemId}` | Submissions for a problem | JWT |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/user/register` | Register a new user (role forced to `USER`) | Public |
| GET | `/api/user/getUsers` | List all users (password omitted) | ADMIN |
| GET | `/api/user/getUser/{id}` | Get user by ID (password omitted) | ADMIN |
| DELETE | `/api/user/deleteUser/{id}` | Delete a user | ADMIN |

### Competitions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/competitions/create` | Create a competition (`createdBy` from JWT) | ADMIN |
| GET | `/api/competitions/getAllCompetitions` | List all competitions | JWT |
| GET | `/api/competitions/get/{id}` | Get competition by ID | JWT |
| POST | `/api/competitions/addProblemsTo/{competitionsId}/problems` | Add problems to a competition | ADMIN |
| GET | `/api/competitions/getProblemsOf/{competitionId}/problems` | Get problem IDs for a competition | JWT |
| POST | `/api/competitions/{competitionId}/join` | Join (user from JWT; no `userId` param) | JWT |
| POST | `/api/competitions/{competitionId}/start` | Start personal contest timer | JWT |
| GET | `/api/competitions/{competitionId}/session` | Get session state and deadline | JWT |
| GET | `/api/competitions/{competitionId}/participants` | List participant user IDs | JWT |
| POST | `/api/competitions/{competitionId}/submit` | Contest submit (`userId` from JWT) | JWT |
| GET | `/api/competitions/{competitionId}/leaderboard` | Competition leaderboard | JWT |
| PATCH | `/api/competitions/{competitionId}/times` | Update start/end times | ADMIN |

#### Competition status (auto-computed)

Status is **never set manually**. It is derived from `startTime` and `endTime`:

| Status | Condition |
|--------|-----------|
| `UPCOMING` | Current time is before `startTime` |
| `ACTIVE` | Current time is between `startTime` and `endTime` |
| `ENDED` | Current time is after `endTime` |

Status is recomputed on create, read, admin time updates, and synced to the database every minute by a scheduler.

#### Per-user session timer

Each participant has a personal timer that starts when they call `POST /start`:

| Session status | Meaning |
|----------------|---------|
| `JOINED` | Registered but timer not started |
| `IN_PROGRESS` | Personal timer running |
| `ENDED` | Personal time expired |

`durationMinutes` on the competition (default 120) sets how long each user gets after starting. The personal deadline is capped by the global contest `endTime`.

Fresh installs already include these columns via `schema/schema.sql`. For older databases, run:

```bash
psql -U postgres -d codeit -f schema/competition_session.sql
```

#### Start session example

```http
POST /api/competitions/1/start
Authorization: Bearer <token>
```

Response:

```json
{
  "competitionId": 1,
  "userId": 1,
  "sessionStatus": "IN_PROGRESS",
  "startedAt": "2026-06-22T10:00:00Z",
  "deadlineAt": "2026-06-22T12:00:00Z",
  "serverTime": "2026-06-22T10:00:01Z",
  "remainingSeconds": 7199
}
```

#### Get session example

```http
GET /api/competitions/1/session
Authorization: Bearer <token>
```

Submissions require `IN_PROGRESS` session and time before `deadlineAt`. When the timer ends, the frontend should auto-submit via `POST /submit`; the backend scheduler also marks the session `ENDED`.

#### Create competition example

```http
POST /api/competitions/create
Authorization: Bearer <admin-token>
```

```json
{
  "title": "Weekly Contest",
  "description": "Beginner-friendly contest",
  "startTime": "2026-06-20 10:00:00",
  "endTime": "2026-06-20 12:00:00"
}
```

`createdBy` is set from the JWT admin user.

#### Add problems to competition example

```http
POST /api/competitions/addProblemsTo/1/problems
Authorization: Bearer <admin-token>
```

```json
{
  "problemIds": [1, 2, 3]
}
```

#### Get competition problems example

```http
GET /api/competitions/getProblemsOf/1/problems
Authorization: Bearer <token>
```

Response: `[1, 2, 3]`

#### Update competition times (admin)

```http
PATCH /api/competitions/1/times
Authorization: Bearer <admin-token>
```

```json
{
  "startTime": "2026-06-20 10:00:00",
  "endTime": "2026-06-20 12:00:00"
}
```

Response returns the updated competition with the recomputed `status` (`UPCOMING`, `ACTIVE`, or `ENDED`).

#### Join / contest submit examples

```http
POST /api/competitions/1/join
Authorization: Bearer <token>
```

No body or `userId` query param — the authenticated user is joined.

```http
POST /api/competitions/1/submit
Authorization: Bearer <token>
```

```json
{
  "problemId": 1,
  "languageId": 62,
  "language": "java",
  "code": "..."
}
```

Do not send `userId` in the body.

## WebSocket (Real-Time Updates)

The backend pushes live competition events over STOMP WebSocket. Clients connect once and subscribe to topics — no polling required.

> **Note:** `/ws` is currently **public** (no JWT on STOMP connect). Securing WebSocket is a follow-up.

### Connection

| Setting | Value |
|---------|-------|
| Endpoint | `http://localhost:9091/ws` |
| Protocol | STOMP over SockJS |
| Broker prefix | `/topic` |

### Topics

| Topic | Trigger | Payload |
|-------|---------|---------|
| `/topic/competitions/{id}/leaderboard` | Accepted contest submission | `List<LeaderboardEntry>` |
| `/topic/competitions/{id}/status` | Global status change or admin time update | `ContestStatusEvent` |
| `/topic/competitions/{id}/users/{userId}/session` | User starts session or session expires | `ContestSessionEvent` |

### ContestStatusEvent payload

```json
{
  "competitionId": 1,
  "status": "ACTIVE",
  "startTime": "2026-06-22T05:00:00Z",
  "endTime": "2026-06-22T23:59:59Z",
  "serverTime": "2026-06-22T07:55:06.530564Z"
}
```

`serverTime` lets the client correct clock drift when showing a countdown.

### ContestSessionEvent payload

```json
{
  "competitionId": 1,
  "userId": 1,
  "sessionStatus": "IN_PROGRESS",
  "startedAt": "2026-06-22T10:00:00Z",
  "deadlineAt": "2026-06-22T12:00:00Z",
  "serverTime": "2026-06-22T10:00:01Z",
  "remainingSeconds": 7199
}
```

### Client example

```html
<script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>
<script>
  const competitionId = 1;
  const socket = new SockJS('http://localhost:9091/ws');
  const client = Stomp.over(socket);

  client.connect({}, () => {
    client.subscribe('/topic/competitions/' + competitionId + '/leaderboard', (msg) => {
      console.log('Leaderboard:', JSON.parse(msg.body));
    });

    client.subscribe('/topic/competitions/' + competitionId + '/status', (msg) => {
      console.log('Status:', JSON.parse(msg.body));
    });

    client.subscribe('/topic/competitions/' + competitionId + '/users/' + userId + '/session', (msg) => {
      console.log('Session:', JSON.parse(msg.body));
    });
  });
</script>
```

A local test page is available at [`websocket-test.html`](websocket-test.html).

### How it works (backend)

```
CompetitionService / CompetitionStatusScheduler
        ↓
CompetitionEventPublisher  (SimpMessagingTemplate)
        ↓
/topic/competitions/{id}/leaderboard  or  /status
        ↓
All subscribed browsers
```

| Component | Role |
|-----------|------|
| `WebSocketConfig` | Enables STOMP broker on `/topic`, endpoint at `/ws` |
| `CompetitionEventPublisher` | Pushes messages to topics |
| `CompetitionService` | Publishes leaderboard after Accepted submit; session on start; status on admin time update |
| `CompetitionStatusScheduler` | Publishes global status transitions; expires personal sessions (every 60s) |

## Submit Flow

1. Client sends user code with `problemId`.
2. Backend loads hidden `test_cases` from the `problems` table.
3. Each test case provides `stdin` and expected `stdout`.
4. Code runs against every test via Judge0.
5. Output is compared and a verdict is returned and saved.

### Submit request example

```http
POST /api/submissions/submit
Authorization: Bearer <token>
```

```json
{
  "problemId": 1,
  "languageId": 62,
  "language": "java",
  "code": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < n; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                System.out.println(map.get(complement) + \" \" + i);\n                return;\n            }\n            map.put(nums[i], i);\n        }\n    }\n}"
}
```

`userId` is taken from the JWT.

### Submit response example

```json
{
  "verdict": "Accepted",
  "passedCount": 20,
  "totalCount": 20,
  "failedTestIndex": null,
  "time": 0.914,
  "memory": 0
}
```

## Test Case Format

Store test cases in the `problems.test_cases` JSONB column:

```json
[
  { "stdin": "4\n2 7 11 15\n9", "stdout": "0 1" },
  { "stdin": "3\n3 2 4\n6", "stdout": "1 2" }
]
```

User code should be a full program that reads from stdin and prints to stdout (Codeforces/HackerRank style).

### stdin/stdout conventions

| Language | Slug | Typical I/O pattern |
|----------|------|---------------------|
| Java | `java` | `Scanner` on `System.in`; public class `Main` |
| Python | `python` | `input()` / `print()` |
| JavaScript | `javascript` | `readline` or `fs.readFileSync(0, 'utf8')`; `console.log()` |
| TypeScript | `typescript` | Same as JavaScript |
| C++ | `cpp` | `cin` / `cout`; `int main()` |
| C | `c` | `scanf` / `printf`; `int main()` |
| Go | `go` | `fmt.Scan` / `fmt.Println`; `func main()` |
| Rust | `rust` | `use std::io`; `fn main()` |
| C# | `csharp` | `Console.ReadLine()` / `Console.WriteLine()`; class `Program` |
| Ruby | `ruby` | `gets` / `puts` |
| PHP | `php` | `fgets(STDIN)` / `echo` |

## Supported Languages

Fetch the canonical list at runtime:

```http
GET /api/submissions/languages
Authorization: Bearer <token>
```


Response example:

```json
[
  { "slug": "c", "name": "C", "languageId": 50 },
  { "slug": "cpp", "name": "C++", "languageId": 54 },
  { "slug": "csharp", "name": "C#", "languageId": 51 },
  { "slug": "go", "name": "Go", "languageId": 60 },
  { "slug": "java", "name": "Java", "languageId": 62 },
  { "slug": "javascript", "name": "JavaScript", "languageId": 63 },
  { "slug": "php", "name": "PHP", "languageId": 68 },
  { "slug": "python", "name": "Python", "languageId": 71 },
  { "slug": "ruby", "name": "Ruby", "languageId": 72 },
  { "slug": "rust", "name": "Rust", "languageId": 73 },
  { "slug": "typescript", "name": "TypeScript", "languageId": 74 }
]
```

## Judge0 Language IDs

| Slug | Language | ID |
|------|----------|----|
| `java` | Java | 62 |
| `python` | Python | 71 |
| `javascript` | JavaScript | 63 |
| `typescript` | TypeScript | 74 |
| `cpp` | C++ | 54 |
| `c` | C | 50 |
| `go` | Go | 60 |
| `rust` | Rust | 73 |
| `csharp` | C# | 51 |
| `ruby` | Ruby | 72 |
| `php` | PHP | 68 |

Unsupported `languageId` values are rejected on `/run` and `/submit`. If both `language` and `languageId` are sent, they must match.

## Project Structure

```
src/main/java/com/codeit/
├── config/          # SecurityConfig, JwtAuthFilter, Redis, WebSocket, GlobalExceptionHandler
├── modules/
│   ├── auth/        # JWT (JwtService), login, AuthUserPrincipal, SecurityUtils
│   ├── competition/ # Competition CRUD, sessions, WebSocket event publishing
│   ├── problems/    # Problem CRUD and public DTOs
│   ├── submission/  # Judge0 integration and test case judging
│   └── user/        # Register (BCrypt), admin user APIs
```

## License

MIT
