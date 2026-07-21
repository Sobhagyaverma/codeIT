import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "Problems",
    detail: "Practice curated challenges with a live judge.",
  },
  {
    title: "Contests",
    detail: "Race timed contests and climb the standings.",
  },
  {
    title: "Leaderboards",
    detail: "Track rank, penalty, and accepted submissions.",
  },
  {
    title: "AI Help",
    detail: "Ask for grounded hints after a failed submit.",
  },
] as const;

const STATS = [
  { value: "350+", label: "Problems" },
  { value: "Weekly", label: "Contests" },
  { value: "Live", label: "Judge" },
] as const;

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerNote?: ReactNode;
};

export default function AuthLayout({
  title,
  subtitle,
  children,
  footerNote,
}: AuthLayoutProps) {
  return (
    <div className="auth-shell relative min-h-[calc(100vh-57px)] overflow-hidden">
      <div className="auth-grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="auth-glow pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[var(--accent)]/10 blur-3xl" aria-hidden />
      <div className="auth-glow pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[var(--info)]/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto grid min-h-[calc(100vh-57px)] max-w-6xl lg:grid-cols-2">
        <aside className="auth-panel-enter relative flex flex-col justify-between border-b border-[var(--line)] px-6 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="display text-xl font-semibold tracking-tight text-[var(--text)]">
                Code<span className="text-[var(--accent)]">IT</span>
              </span>
              <span className="verdict-strip rounded border border-[var(--line)] px-2 py-0.5 text-[var(--ok)]">
                online
              </span>
            </Link>

            <p className="verdict-strip mt-8 text-[var(--text-dim)]">
              /auth → welcome
            </p>
            <h1 className="display mt-3 max-w-md text-3xl font-semibold leading-tight sm:text-4xl">
              Continue your coding journey
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-dim)] sm:text-base">
              Write full programs, get real verdicts, compete live, and level up
              with grounded AI help when you get stuck.
            </p>

            <ul className="mt-8 hidden space-y-3 sm:block">
              {FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)]/80 px-4 py-3 backdrop-blur"
                >
                  <div className="text-sm font-semibold text-[var(--text)]">
                    {feature.title}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-dim)]">
                    {feature.detail}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-[var(--line)] bg-[var(--bg-inset)]/80 px-3 py-3 text-center"
                >
                  <div className="display text-base font-semibold text-[var(--accent)] sm:text-lg">
                    {stat.value}
                  </div>
                  <div className="verdict-strip mt-1 text-[10px] text-[var(--text-dim)]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-console mt-8 hidden overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] lg:block">
            <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--err)]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--warn)]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--ok)]/80" />
              <span className="verdict-strip ml-2 text-[var(--text-dim)]">
                judge0 · session
              </span>
            </div>
            <pre className="mono overflow-x-auto px-4 py-3 text-[11px] leading-relaxed text-[var(--text-dim)]">
{`> submit two_sum.py
  compiling... ok
  case 01  Accepted  12ms
  case 02  Accepted  14ms
  verdict  Accepted`}
            </pre>
          </div>
        </aside>

        <section className="auth-form-enter flex flex-col justify-center px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 lg:mb-8">
              <h2 className="display text-2xl font-semibold sm:text-3xl">
                {title}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-dim)]">{subtitle}</p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-6">
              {children}
            </div>

            {footerNote && (
              <div className="mt-5 text-center text-sm text-[var(--text-dim)]">
                {footerNote}
              </div>
            )}

            <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[var(--text-dim)]">
              <Link to="/privacy" className="hover:text-[var(--info)]">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-[var(--info)]">
                Terms of Service
              </Link>
              <Link to="/help" className="hover:text-[var(--info)]">
                Help
              </Link>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
