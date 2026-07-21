import { Link } from "react-router-dom";
import { BookOpen, LineChart, Trophy } from "lucide-react";

const PARTICLES = [
  { size: 4, left: "6%", top: "18%", color: "rgba(245,166,35,0.85)", duration: "9s", delay: "0s", driftX: "16px", driftY: "-14px" },
  { size: 3, left: "14%", top: "58%", color: "rgba(91,168,255,0.7)", duration: "11s", delay: "1s", driftX: "-12px", driftY: "-20px" },
  { size: 5, left: "28%", top: "28%", color: "rgba(255,255,255,0.45)", duration: "10s", delay: "0.4s", driftX: "14px", driftY: "12px" },
  { size: 3, left: "42%", top: "72%", color: "rgba(52,211,153,0.55)", duration: "12s", delay: "1.8s", driftX: "-10px", driftY: "-16px" },
  { size: 4, left: "55%", top: "22%", color: "rgba(168,108,255,0.65)", duration: "9s", delay: "0.8s", driftX: "12px", driftY: "-18px" },
  { size: 3, left: "68%", top: "48%", color: "rgba(245,166,35,0.7)", duration: "11s", delay: "2.2s", driftX: "-14px", driftY: "10px" },
  { size: 5, left: "78%", top: "16%", color: "rgba(91,168,255,0.65)", duration: "10s", delay: "0.2s", driftX: "-10px", driftY: "-12px" },
  { size: 2, left: "86%", top: "62%", color: "rgba(255,255,255,0.4)", duration: "8s", delay: "1.4s", driftX: "10px", driftY: "-14px" },
  { size: 4, left: "92%", top: "34%", color: "rgba(245,166,35,0.75)", duration: "13s", delay: "2.6s", driftX: "-8px", driftY: "14px" },
  { size: 3, left: "22%", top: "82%", color: "rgba(168,108,255,0.5)", duration: "10s", delay: "0.6s", driftX: "12px", driftY: "-10px" },
  { size: 4, left: "48%", top: "12%", color: "rgba(52,211,153,0.5)", duration: "9s", delay: "1.1s", driftX: "-16px", driftY: "8px" },
  { size: 2, left: "74%", top: "78%", color: "rgba(91,168,255,0.55)", duration: "11s", delay: "1.7s", driftX: "8px", driftY: "-18px" },
] as const;

const FEATURES = [
  {
    icon: BookOpen,
    title: "Topic-wise sheets",
    description:
      "Organised problems by topic — arrays, DP, graphs, and more — similar to Striver's A2Z sheet.",
  },
  {
    icon: Trophy,
    title: "Contests & sessions",
    description:
      "Join competitions with friends and see where you stand on the leaderboard.",
  },
  {
    icon: LineChart,
    title: "Progress tracking",
    description:
      "Mark problems as completed, filter by topic, and keep an eye on your overall progress.",
  },
] as const;

export default function Home() {
  return (
    <div className="practice-shell min-h-[calc(100vh-3.5rem)]">
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-6">
        <section className="hero-stage mb-16 rounded-3xl border border-[var(--line)]/60 bg-[var(--bg-raised)]/30 p-6 sm:p-8 lg:p-10">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              aria-hidden
              className="hero-particle"
              style={{
                width: p.size,
                height: p.size,
                left: p.left,
                top: p.top,
                background: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                ["--duration" as string]: p.duration,
                ["--delay" as string]: p.delay,
                ["--drift-x" as string]: p.driftX,
                ["--drift-y" as string]: p.driftY,
              }}
            />
          ))}

          <div className="relative z-[1] grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="verdict-strip text-[var(--accent)]">
                Your coding journey starts here
              </p>

              <h1 className="display mt-6 text-5xl font-semibold leading-tight tracking-tight text-[var(--text)] md:text-6xl">
                Learn by solving.
                <br />
                Build real{" "}
                <span className="verdict-glow text-emerald-400">confidence</span>.
                <br />
                Grow every day.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-dim)]">
                Follow a structured DSA roadmap, solve problems at your pace,
                test your skills in contests, and track every step of your
                progress — all in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/dsa-sheet"
                  className="inline-flex items-center rounded-xl bg-[var(--accent)] px-6 py-3 text-base font-semibold text-[#0a0d12] shadow-[0_8px_24px_rgba(245,166,35,0.22)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Open DSA Sheet
                </Link>

                <Link
                  to="/problems"
                  className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--bg-raised)]/70 px-6 py-3 text-base font-medium text-[var(--text)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
                >
                  Browse problems
                </Link>

                <Link
                  to="/competitions"
                  className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--bg-raised)]/70 px-6 py-3 text-base font-medium text-[var(--text)] transition hover:-translate-y-0.5 hover:border-[var(--info)]"
                >
                  View competitions
                </Link>
              </div>
            </div>

            <div className="card-halo">
              <div className="practice-card rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/90 p-5 practice-glass hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)]/80 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="verdict-strip text-[var(--text-dim)]">
                      Problem solving workspace
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                      Active
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)]/80 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--text)]">
                          Arrays & Hashing
                        </span>
                        <span className="text-xs text-[var(--text-dim)]">
                          72% complete
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-inset)]">
                        <div className="h-2 w-[72%] rounded-full bg-[var(--accent)] shadow-[0_0_12px_rgba(245,166,35,0.55)]" />
                      </div>
                    </div>

                    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)]/80 p-4">
                      <div className="mb-3 text-sm font-medium text-[var(--text)]">
                        Today&apos;s flow
                      </div>
                      <div className="space-y-2 text-sm text-[var(--text-dim)]">
                        <div className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--bg)]/40 px-3 py-2">
                          <span>Practice a problem</span>
                          <span className="text-emerald-400">Done</span>
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--bg)]/40 px-3 py-2">
                          <span>Run sample tests</span>
                          <span className="text-emerald-400">Done</span>
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--bg)]/40 px-3 py-2">
                          <span>Submit solution</span>
                          <span className="text-yellow-400">Pending</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)]/80 p-4">
                      <div className="mb-3 text-sm font-medium text-[var(--text)]">
                        Weekly consistency
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {[90, 75, 60, 85, 70, 80, 100].map((opacity, i) => (
                          <span
                            key={i}
                            className="h-10 rounded-md bg-[var(--accent)] shadow-[0_0_10px_rgba(245,166,35,0.25)]"
                            style={{ opacity: opacity / 100 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="practice-card rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/70 p-5 practice-glass hover:-translate-y-0.5 hover:border-[var(--info)]/40 hover:shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] text-[var(--accent)]">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-[var(--text)]">
                {title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-dim)]">
                {description}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
