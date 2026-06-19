# CodeIT

A Spring Boot coding platform backend where users browse problems, run code, and submit solutions judged against hidden test cases via [Judge0](https://github.com/judge0/judge0).

## Tech Stack

- Java 21
- Spring Boot 4
- PostgreSQL
- Judge0 (code execution)
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

   The API starts on **http://localhost:8081**.

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
| POST | `/api/submissions/run` | Run code once (no DB save) |
| POST | `/api/submissions/submit` | Run all hidden test cases, save verdict |
| GET | `/api/submissions/user/{userId}` | User submission history |
| GET | `/api/submissions/problem/{problemId}` | Submissions for a problem |

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

## Judge0 Language IDs

| Language | ID |
|----------|----|
| Java | 62 |
| Python | 71 |

## Project Structure

```
src/main/java/com/codeit/
├── config/          # App configuration (RestTemplate, ObjectMapper)
├── modules/
│   ├── auth/        # Authentication
│   ├── problems/    # Problem CRUD and public DTOs
│   ├── submission/  # Judge0 integration and test case judging
│   └── user/        # User management
```

## License

MIT
