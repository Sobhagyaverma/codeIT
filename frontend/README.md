# CodeT · frontend

Vite + React + TypeScript + Tailwind product UI for CodeT.

This is the **primary product UI**. Dev server defaults to port **5175**.

## Run

```bash
cd frontend
npm ci
npm run dev
```

Opens at **http://localhost:5175**.

```bash
npm run build    # production build
npm run preview  # preview build
npm run lint
```

Backend must be on **9091** (`./mvnw spring-boot:run` from repo root). Dev proxies `/api` and `/ws` → `http://localhost:9091`, and `/sync/*` → sync-server `:1234` (path prefix stripped).

Optional env ([`.env.example`](./.env.example)):

```properties
# Empty = same-origin (Vite proxy locally; Nginx /api+/ws+/sync in production)
VITE_API_URL=
# Empty = ws(s)://{host}/sync  (y-websocket connects to /sync/{doc})
VITE_SYNC_WS_URL=
```

Auth tokens and session preferences are stored in browser storage (see `src/lib/authStorage.ts`).

**Nginx / Compose:** `deploy/nginx/Dockerfile` builds this app and serves it same-origin with proxies for `/api`, `/ws`, `/sync`.

## Sensitive auth (RSA-OAEP)

Login identifier, passwords (login / register / change-password) are encrypted in the browser with the server’s RSA public key (`GET /api/crypto/public-key`) before POST. Backend decrypts with the private key, then bcrypt as usual.

- Algorithm: RSA-OAEP SHA-256
- Config (Spring): `codeit.crypto.rsa.*` in `application.properties`
- Private key file (gitignored): `data/codeit-rsa-private.pem` (auto-generated locally)
- This is defense-in-depth for plaintext JSON; **use HTTPS in production**

## Screen map

| Area                   | Route                                               | Notes                    |
| ---------------------- | --------------------------------------------------- | ------------------------ |
| Home                   | `/`                                                 | Landing                  |
| Login / Register       | `/login`, `/register`                               | JWT auth                 |
| Problems               | `/problems`                                         | Catalog                  |
| Problem workspace      | `/problems/:id`                                     | Monaco, run/submit       |
| Problem collab         | `/problems/:id/room/:roomId`                        | Shared room              |
| DSA Sheet              | `/dsa-sheet`, `/dsa-sheet/:sectionId/:slug`         | Lessons + practice       |
| CodeRoom               | `/coderoom`, `/coderoom/:roomId`                    | Freeform collab          |
| Competitions           | `/competitions`, `/competitions/:id`                | Contests + room          |
| Profile                | `/profile`, `/users/:username`                      | Public/own profile       |
| Settings               | `/settings/profile`                                 | Edit profile (all roles) |
| Admin Command Center   | `/admin`                                            | ADMIN only               |
| Competition repository | `/admin/competitions`                               | ADMIN list UI            |
| Competition studio     | `/admin/competitions/create`                        | ADMIN create             |
| Meta                   | `/about`, `/contact`, `/help`, `/privacy`, `/terms` | Static                   |

Nav: **Settings** (gear, rightmost) opens `/settings/profile` for every logged-in user. **Admin** appears only for `ADMIN`.

## Admin Command Center

| View                   | Entry                        | Backend                           |
| ---------------------- | ---------------------------- | --------------------------------- |
| Overview               | `/admin`                     | Problem + competition lists       |
| Problem repository     | sidebar → Problems           | `GET /api/problems`               |
| Problem Studio         | Create Problem               | `POST /api/problems`              |
| Competition repository | `/admin/competitions`        | `GET …/getAllCompetitions`        |
| Competition Studio     | `/admin/competitions/create` | `POST …/create` + `addProblemsTo` |

Studio drafts autosave to **localStorage** (no draft API). Publish/create uses existing endpoints only — no invented backend fields.

## Structure

See repo root [`README.md`](../README.md) and `src/` for pages, features, and lib helpers.
