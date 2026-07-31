import { Link } from "react-router-dom";

/** Screens land here as Stitch code is pasted screen-by-screen. */
const SCREENS: { id: string; name: string; path: string; status: "ready" | "pending" }[] = [
  { id: "S03", name: "Home", path: "/", status: "ready" },
  { id: "S01", name: "Login", path: "/login", status: "ready" },
  { id: "S02", name: "Register", path: "/register", status: "ready" },
  { id: "S04", name: "Problems", path: "/problems", status: "ready" },
  { id: "S05", name: "Problem Workspace", path: "/problems/1", status: "ready" },
  { id: "S06", name: "DSA Sheet", path: "/dsa-sheet", status: "ready" },
];

export default function ScreenIndex() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <p className="mono text-sm text-[var(--accent)]">CodeIT · frontend-stitch</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Stitch frontend shell
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-dim)]">
        Separate from the production <code className="mono text-[var(--text)]">frontend/</code> app.
        Paste Stitch screen code one at a time — each screen becomes a page under{" "}
        <code className="mono text-[var(--text)]">src/pages/</code> and a route below.
      </p>

      <section className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-dim)]">
          Screens
        </h2>
        <ul className="mt-4 space-y-2">
          {SCREENS.map((screen) => (
            <li key={screen.id}>
              <Link
                to={screen.path}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-4 py-3 text-sm transition hover:border-[var(--accent)]/50"
              >
                <span>
                  <span className="mono text-[var(--accent)]">{screen.id}</span>{" "}
                  {screen.name}
                </span>
                <span className="mono text-xs text-[var(--text-dim)]">{screen.path}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-xs text-[var(--text-dim)]">
        Dev server: <span className="mono">http://localhost:5175</span> · Catalog:{" "}
        <Link to="/screens" className="text-[var(--accent)] hover:underline">
          /screens
        </Link>
      </p>
    </main>
  );
}
