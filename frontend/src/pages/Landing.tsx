import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEED = [
  { user: "priya_k", problem: "Two Sum", verdict: "Accepted", color: "var(--ok)" },
  { user: "arjun.dev", problem: "Longest Substring", verdict: "Wrong Answer", color: "var(--err)" },
  { user: "manya", problem: "Binary Tree Paths", verdict: "Accepted", color: "var(--ok)" },
  { user: "rohit99", problem: "Graph Coloring", verdict: "TLE", color: "var(--warn)" },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <section className="grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <div className="verdict-strip mb-4 text-[var(--text-dim)]">
            /judge/status → online
          </div>
          <h1 className="display text-4xl font-bold leading-tight md:text-5xl">
            Write code.
            <br />
            Get a <span style={{ color: "var(--ok)" }}>verdict</span>.
            <br />
            Not a guess.
          </h1>
          <p className="mt-5 max-w-md text-[var(--text-dim)]">
            Solve problems against hidden test cases, race the clock in live
            contests, and when you get stuck — ask the AI to explain your
            code or fix what's failing, grounded in the actual problem
            constraints.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              to={user ? "/problems" : "/register"}
              className="rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[#0a0d12] transition hover:brightness-110"
            >
              {user ? "Browse problems" : "Get started"}
            </Link>
            <Link
              to="/competitions"
              className="rounded-md border border-[var(--line)] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition hover:border-[var(--info)] hover:text-[var(--info)]"
            >
              View competitions
            </Link>
          </div>
        </div>

        {/* signature element: live-looking verdict feed styled like a judge output log */}
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <div className="verdict-strip mb-3 flex items-center justify-between text-[var(--text-dim)]">
            <span>recent submissions</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)]" />
              live
            </span>
          </div>
          <div className="mono divide-y divide-[var(--line)] text-xs">
            {FEED.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-dim)]">{f.user}</span>
                <span className="text-[var(--text)]">{f.problem}</span>
                <span style={{ color: f.color }}>{f.verdict}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-24 grid gap-6 md:grid-cols-3">
        {[
          { t: "Practice", d: "Filter by difficulty and topic, write full stdin/stdout programs in the language of your choice." },
          { t: "Compete", d: "Join timed contests with a personal countdown and a leaderboard that updates live." },
          { t: "Get unstuck", d: "Ask the AI to explain your logic or propose a fix — grounded in the problem, not a raw guess." },
        ].map((f) => (
          <div key={f.t} className="rounded-lg border border-[var(--line)] p-5">
            <h3 className="display mb-2 text-base font-semibold">{f.t}</h3>
            <p className="text-sm text-[var(--text-dim)]">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
