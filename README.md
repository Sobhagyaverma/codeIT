# CodeIT

A Spring Boot coding platform backend where users browse problems, run code, and submit solutions judged against hidden test cases via [Judge0](https://github.com/judge0/judge0).

## Tech Stack

- Java 21
- Spring Boot 4
- PostgreSQL
- Judge0 (code execution)
- WebSocket (STOMP over SockJS)
- Maven

## Prerequisites

- JDK 21+
- Maven 3.9+
- PostgreSQL (database: `codeit`)
- Judge0 running locally (default: `http://localhost:2358`)

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Sobhagyaverma/codeIT.git
   cd codeIT
   ```

2. **Create the database**

   ```sql
   CREATE DATABASE codeit;
   ```

3. **Configure environment variables**

   ```bash
   export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/codeit
   export SPRING_DATASOURCE_USERNAME=postgres
   export SPRING_DATASOURCE_PASSWORD=your_password
   export JUDGE0_API_URL=http://localhost:2358
   ```

   Alternatively, create `src/main/resources/application-local.properties` (gitignored) with your local values.

4. **Run the application**

   ```bash
   ./mvnw spring-boot:run
   ```

   The API starts on **http://localhost:9091**.

## API Overview

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |

### Problems

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/problems` | List all problems (test cases hidden) |
| GET | `/api/problems/{id}` | Get problem by ID |
| GET | `/api/problems/difficulty/{difficulty}` | Filter by difficulty |
| GET | `/api/problems/topic/{topic}` | Filter by topic |
| GET | `/api/problems/search?keyword=` | Search problems |
| POST | `/api/problems` | Create a problem |

### Submissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submissions/languages` | List supported languages (slug, name, languageId) |
| POST | `/api/submissions/run` | Run code once (no DB save) |
| POST | `/api/submissions/submit` | Run all hidden test cases, save verdict |
| GET | `/api/submissions/user/{userId}` | User submission history |
| GET | `/api/submissions/problem/{problemId}` | Submissions for a problem |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/getUsers` | List all users |
| GET | `/api/user/getUser/{id}` | Get user by ID |
| POST | `/api/user/register` | Register a new user |
| DELETE | `/api/user/deleteUser/{id}` | Delete a user |

### Competitions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/competitions/create` | Create a competition | Admin (`createdBy` must be an ADMIN user) |
| GET | `/api/competitions/getAllCompetitions` | List all competitions | Public |
| GET | `/api/competitions/get/{id}` | Get competition by ID | Public |
| POST | `/api/competitions/addProblemsTo/{competitionsId}/problems` | Add problems to a competition | Admin (`userId` in body) |
| GET | `/api/competitions/getProblemsOf/{competitionId}/problems` | Get problem IDs for a competition | Public |
| POST | `/api/competitions/{competitionId}/join` | Join a competition | Public |
| POST | `/api/competitions/{competitionId}/start` | Start personal contest timer | Public (must have joined) |
| GET | `/api/competitions/{competitionId}/session` | Get session state and deadline | Public |
| GET | `/api/competitions/{competitionId}/participants` | List participant user IDs | Public |
| POST | `/api/competitions/{competitionId}/submit` | Submit solution during an active competition | Public |
| GET | `/api/competitions/{competitionId}/leaderboard` | Competition leaderboard | Public |
| PATCH | `/api/competitions/{competitionId}/times` | Update start/end times (status auto-recalculated) | Admin (`userId` in body) |

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

Run the migration before using sessions:

```bash
psql -U postgres -d codeit -f schema/competition_session.sql
```

#### Start session example

```http
POST /api/competitions/1/start?userId=1
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
GET /api/competitions/1/session?userId=1
```

Submissions require `IN_PROGRESS` session and time before `deadlineAt`. When the timer ends, the frontend should auto-submit via `POST /submit`; the backend scheduler also marks the session `ENDED`.

#### Create competition example

```json
{
  "title": "Weekly Contest",
  "description": "Beginner-friendly contest",
  "startTime": "2026-06-20 10:00:00",
  "endTime": "2026-06-20 12:00:00",
  "createdBy": 1
}
```

#### Add problems to competition example

```http
POST /api/competitions/addProblemsTo/1/problems
```

```json
{
  "userId": 1,
  "problemIds": [1, 2, 3]
}
```

#### Get competition problems example

```http
GET /api/competitions/getProblemsOf/1/problems
```

Response: `[1, 2, 3]`

#### Update competition times (admin)

```http
PATCH /api/competitions/1/times
```

```json
{
  "userId": 1,
  "startTime": "2026-06-20 10:00:00",
  "endTime": "2026-06-20 12:00:00"
}
```

Response returns the updated competition with the recomputed `status` (`UPCOMING`, `ACTIVE`, or `ENDED`).

## WebSocket (Real-Time Updates)

The backend pushes live competition events over STOMP WebSocket. Clients connect once and subscribe to topics — no polling required.

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

```json
{
  "userId": 1,
  "problemId": 1,
  "languageId": 62,
  "language": "java",
  "code": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < n; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                System.out.println(map.get(complement) + \" \" + i);\n                return;\n            }\n            map.put(nums[i], i);\n        }\n    }\n}"
}
```

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
├── config/          # App configuration (WebSocket, RestTemplate, ObjectMapper)
├── modules/
│   ├── auth/        # Authentication
│   ├── competition/ # Competition CRUD, WebSocket event publishing
│   ├── problems/    # Problem CRUD and public DTOs
│   ├── submission/  # Judge0 integration and test case judging
│   └── user/        # User management
```

## License

MIT
