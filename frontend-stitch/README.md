# CodeIT · frontend-stitch

Separate Vite + React + TypeScript + Tailwind app for Google Stitch UI screens.

The production app in `../frontend/` is **not** modified by this project.

## Run

```bash
cd frontend-stitch
npm install
npm run dev
```

Opens at **http://localhost:5175** (port locked so it does not clash with the main frontend on 5173).

```bash
npm run build    # production build
npm run preview  # preview build
```

## Screen-by-screen workflow

1. Export a screen from Stitch (HTML / JSX / Tailwind).
2. Paste it in chat (or drop the file into this repo).
3. It becomes `src/pages/<ScreenName>.tsx` and a route in `src/App.tsx`.
4. The home page (`/`) lists screens as they are added.
5. Shared pieces (nav, footer, tokens) are extracted when a second screen repeats them.

## Structure

```text
src/
  App.tsx           # router shell
  index.css         # Tailwind + Stitch theme tokens
  pages/
    Home.tsx        # S03 Home (first Stitch screen)
    ScreenIndex.tsx # /screens catalog
  components/       # shared UI (added as needed)
```

## Screens added

| ID  | Page | Route      |
| --- | ---- | ---------- |
| S03 | Home | `/`        |
| S01 | Login | `/login`  |
| S02 | Register | `/register` |
| S04 | Problems | `/problems` |
| S05 | Problem Workspace | `/problems/:id` |
| S06 | DSA Sheet | `/dsa-sheet` |
| —   | Catalog | `/screens` |

## Backend connection

Login / Register / Problems / Problem Workspace talk to the Spring Boot API on **port 9091**.

Dev uses a Vite proxy (`/api` → `http://localhost:9091`), so restart `npm run dev` after pulling these changes.

```bash
# terminal 1 — backend
./mvnw spring-boot:run   # or your usual run

# terminal 2 — stitch frontend
cd frontend-stitch && npm run dev   # http://localhost:5175
```

Auth tokens are stored under `codeit.stitch.*` keys (separate from the production `frontend/` app).

**Workspace:** open any problem from `/problems`. Run (sample tests) and Submit require login. Code drafts auto-save locally.
