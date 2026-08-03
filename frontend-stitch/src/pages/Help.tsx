import { Link } from "react-router-dom";
import LegalShell from "../components/LegalShell";

export default function Help() {
  return (
    <LegalShell active="help">
      <article className="glass-panel relative overflow-hidden rounded-2xl p-8 md:p-12">
        <div className="pointer-events-none absolute top-0 right-0 size-[500px] translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 flex items-center gap-2 font-mono text-sm text-primary/70">
            <span>/support</span>
            <span className="material-symbols-outlined text-[14px]">
              arrow_forward
            </span>
            <span className="text-primary">help</span>
          </div>
          <h1 className="mb-12 border-b border-outline-variant/30 pb-6 font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
            Help Center
          </h1>

          <div className="space-y-12">
            <section>
              <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold text-primary">
                <span
                  className="material-symbols-outlined text-primary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  login
                </span>
                Login Issues
              </h2>
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-6">
                <p className="mb-4 leading-relaxed text-on-surface-variant">
                  Ensure you are using either your registered email address or
                  your unique user ID along with your password.
                </p>
                <ul className="ml-4 space-y-2 border-l-2 border-primary/30 pl-4 font-mono text-sm text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary-container" />
                    Passwords are strictly case-sensitive.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary-container" />
                    Minimum requirement: 6 characters.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold text-primary">
                <span
                  className="material-symbols-outlined text-primary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  terminal
                </span>
                Running Code
              </h2>
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-6">
                <p className="mb-4 leading-relaxed text-on-surface-variant">
                  CodeIT&apos;s execution engine expects your program to read
                  input from standard input (<code>stdin</code>) and output
                  results to standard output (<code>stdout</code>).
                </p>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2 rounded-lg border border-outline-variant/30 bg-surface-dim p-4">
                    <span className="font-label text-xs tracking-wider text-primary uppercase">
                      Run Action
                    </span>
                    <p className="text-sm text-on-surface-variant">
                      Executes your code against the visible sample test cases
                      provided in the problem description.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-lg border border-outline-variant/30 bg-surface-dim p-4">
                    <span className="font-label text-xs tracking-wider text-primary uppercase">
                      Submit Action
                    </span>
                    <p className="text-sm text-on-surface-variant">
                      Evaluates your solution against the full suite of hidden
                      system tests. This determines final status.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold text-primary">
                <span
                  className="material-symbols-outlined text-primary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  trophy
                </span>
                Contests
              </h2>
              <div className="relative overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-6">
                <div className="relative z-10">
                  <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/20 bg-surface-dim px-3 py-1.5">
                    <span className="size-2 animate-pulse rounded-full bg-primary-container" />
                    <span className="font-mono text-sm text-on-surface">
                      Live Leaderboard
                    </span>
                  </div>
                  <ol className="ml-2 list-inside list-decimal space-y-3 font-body leading-relaxed text-on-surface-variant">
                    <li>
                      Click{" "}
                      <span className="font-medium text-primary">Join</span> on
                      an active contest page.
                    </li>
                    <li>
                      Your personal competition timer starts immediately upon
                      joining.
                    </li>
                    <li>
                      Submit your solutions within the designated Competition
                      Room interface.
                    </li>
                    <li>
                      <strong className="font-medium text-on-surface">
                        Note:
                      </strong>{" "}
                      Only{" "}
                      <span className="rounded bg-primary-container/10 px-2 py-0.5 text-sm text-primary-container">
                        Accepted
                      </span>{" "}
                      submissions will positively update your standing on the
                      live leaderboard.
                    </li>
                  </ol>
                </div>
              </div>
            </section>

            <section className="mt-16 border-t border-outline-variant/20 pt-8 text-center">
              <h3 className="mb-3 font-headline text-2xl font-bold text-on-surface">
                Still stuck?
              </h3>
              <p className="mb-6 text-on-surface-variant">
                Our support team is ready to assist you with complex technical
                issues.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-transparent px-8 py-3 font-label text-sm text-primary transition-all duration-300 hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(183,109,255,0.2)]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  support_agent
                </span>
                Contact Support
              </Link>
            </section>
          </div>
        </div>
      </article>
    </LegalShell>
  );
}
