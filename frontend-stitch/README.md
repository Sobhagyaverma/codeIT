# CodeIT · frontend-stitch

Polished Vite + React + TypeScript + Tailwind app built from Google Stitch screens.

This is the **primary UI under active development**. The legacy app in `../frontend/` is unchanged and still runs on port **5173**.

## Run

```bash
cd frontend-stitch
npm ci
npm run dev
```

Opens at **http://localhost:5175** (locked so it does not clash with the legacy frontend).

```bash
npm run build    # production build
npm run preview  # preview build
npm run lint
```

Backend must be on **9091** (`./mvnw spring-boot:run` from repo root). Dev proxies `/api` → `http://localhost:9091`.

Optional env:

```properties
VITE_API_URL=http://localhost:9091
VITE_SYNC_WS_URL=ws://localhost:1234
```

Auth tokens use `codeit.stitch.*` keys (separate from the legacy frontend).

## Sensitive auth (RSA-OAEP)

Login identifier, passwords (login / register / change-password) are encrypted in the browser with the server’s RSA public key (`GET /api/crypto/public-key`) before POST. Backend decrypts with the private key, then bcrypt as usual.

- Algorithm: RSA-OAEP SHA-256
- Config (Spring): `codeit.crypto.rsa.*` in `application.properties`
- Private key file (gitignored): `data/codeit-rsa-private.pem` (auto-generated locally)
- This is defense-in-depth for plaintext JSON; **use HTTPS in production**

## Screen map

| Area | Route | Notes |
| --- | --- | --- |
| Home | `/` | Landing |
| Login / Register | `/login`, `/register` | JWT auth |
| Problems | `/problems` | Catalog |
| Problem workspace | `/problems/:id` | Monaco, run/submit |
| Problem collab | `/problems/:id/room/:roomId` | Shared room |
| DSA Sheet | `/dsa-sheet`, `/dsa-sheet/:sectionId/:slug` | Lessons + practice |
| CodeRoom | `/coderoom`, `/coderoom/:roomId` | Freeform collab |
| Competitions | `/competitions`, `/competitions/:id` | Contests + room |
| Profile | `/profile`, `/users/:username` | Public/own profile |
| Settings | `/settings/profile` | Edit profile (all roles) |
| Admin Command Center | `/admin` | ADMIN only |
| Competition repository | `/admin/competitions` | ADMIN list UI |
| Competition studio | `/admin/competitions/create` | ADMIN create |
| Meta | `/about`, `/contact`, `/help`, `/privacy`, `/terms` | Static |
| Catalog | `/screens` | Screen index |

Nav: **Settings** (gear, rightmost) opens `/settings/profile` for every logged-in user. **Admin** appears only for `ADMIN`.

## Admin Command Center

| View | Entry | Backend |
| --- | --- | --- |
| Overview | `/admin` | Problem + competition lists |
| Problem repository | sidebar → Problems | `GET /api/problems` |
| Problem Studio | Create Problem | `POST /api/problems` |
| Competition repository | `/admin/competitions` | `GET …/getAllCompetitions` |
| Competition Studio | `/admin/competitions/create` | `POST …/create` + `addProblemsTo` |

Studio drafts autosave to **localStorage** (no draft API). Publish/create uses existing endpoints only — no invented backend fields.

## Structure

```text
src/
  App.tsx
  index.css              # Tailwind + Stitch / admin tokens
  components/            # AppNav, SoftPageFade, …
  context/               # Auth
  features/              # collaboration, practice, …
  lib/                   # api, monacoTheme, authStorage
  pages/                 # product pages + Admin*
```

## Workflow

1. Export a screen from Stitch.
2. Integrate into `src/pages/` and wire routes in `App.tsx`.
3. Reuse existing `lib/api.ts` endpoints — do not invent APIs.
4. Keep UI faithful to the Stitch mock; show `—` / disable when backend lacks a field.
