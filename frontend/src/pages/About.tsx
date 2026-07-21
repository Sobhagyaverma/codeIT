import { Link } from "react-router-dom";
import {
  BookOpen,
  BrainCircuit,
  Code2,
  Database,
  LineChart,
  Palette,
  Sparkles,
  Trophy,
} from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Structured practice",
    description:
      "A topic-by-topic DSA roadmap with progress tracking, favorites, and a full problem catalog.",
  },
  {
    icon: Trophy,
    title: "Real contests",
    description:
      "Timed rounds with hidden test cases, live standings, and rank history under real pressure.",
  },
  {
    icon: BrainCircuit,
    title: "AI assistance",
    description:
      "Stuck on a verdict? Ask the AI to explain your code or fix what's failing, grounded in the actual problem.",
  },
  {
    icon: LineChart,
    title: "Progress you can see",
    description:
      "Streaks, heatmaps, per-topic stats, and submission history — consistency made visible.",
  },
];

const AUTHORS = [
  {
    name: "Sobhagya Verma",
    role: "Backend / Database",
    icon: Database,
    bio: "Computer Science undergraduate and aspiring AI/ML engineer with a strong interest in backend development and RAG systems. He built CodeIT's backend and database layer, focusing on scalable APIs, reliable architecture, and efficient data handling. He also enjoys machine learning, cloud technologies, and developing intelligent software that solves practical problems.",
  },
  {
    name: "Manya Katakol",
    role: "Frontend / UI",
    icon: Palette,
    bio: "Computer Science undergraduate passionate about building innovative, impactful technology. She explores IoT, cybersecurity, blockchain, AI, and software development, combining creativity with practical problem-solving and aiming to bridge innovation with real-world applications through every project.",
  },
];

export default function About() {
  return (
    <div className="practice-shell min-h-[calc(100vh-3.5rem)]">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="mb-10 text-center">
          <p className="verdict-strip text-[var(--accent)]">/about → codeit</p>
          <h1 className="display mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Built for the grind,
            <br />
            designed for <span className="text-[var(--accent)]">growth</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-dim)] sm:text-base">
            CodeIT brings problem solving, contests, progress tracking, and
            intelligent assistance into a single focused environment — so you
            can practice systematically, measure honestly, and improve
            steadily.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              to="/dsa-sheet"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0a0d12] shadow-[0_8px_24px_rgba(245,166,35,0.22)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Start practicing
            </Link>
            <Link
              to="/competitions"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)]/70 px-4 py-2.5 text-sm text-[var(--text)] transition hover:border-[var(--info)]"
            >
              <Trophy className="h-4 w-4" aria-hidden />
              View competitions
            </Link>
          </div>
        </header>

        {/* Mission */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 practice-glass">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]">
              <Code2 className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="display text-xl font-semibold">
                What this project is about
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-dim)]">
                CodeIT is a dedicated platform for practicing data structures
                and algorithms through a structured, interactive, and
                user-focused experience. It encourages regular practice with
                tools that support both learning and performance evaluation —
                helping you sharpen technical ability, develop stronger
                analytical thinking, and grow consistently in your
                problem-solving journey.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-dim)]">
                Approach problems systematically, evaluate your performance
                across topics and sessions, and refine your strategy over time.
                Through usability, functionality, and guided support, CodeIT
                aims to be an effective space to strengthen your foundations
                and build confidence in tackling technical challenges.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mb-10">
          <h2 className="display mb-4 text-xl font-semibold">
            What you get
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="practice-card rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/70 p-5 practice-glass hover:-translate-y-0.5 hover:border-[var(--info)]/40 hover:shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[var(--text)]">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-dim)]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Authors */}
        <section>
          <h2 className="display mb-4 text-xl font-semibold">Authors</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {AUTHORS.map(({ name, role, icon: Icon, bio }) => {
              const initials = name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .toUpperCase();
              return (
                <article
                  key={name}
                  className="practice-card overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 practice-glass hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
                >
                  <div className="h-16 bg-gradient-to-r from-[var(--accent)]/15 via-[var(--info)]/10 to-transparent" />
                  <div className="relative px-5 pb-5">
                    <div className="-mt-8 flex items-end justify-between">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-[var(--bg-raised)] bg-[var(--accent)] text-xl font-bold text-[#0a0d12]">
                        {initials}
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                        <Icon className="h-3 w-3" aria-hidden />
                        {role}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-[var(--text)]">
                      {name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
                      {bio}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
