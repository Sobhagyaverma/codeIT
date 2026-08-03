import LegalShell from "../components/LegalShell";

export default function Terms() {
  return (
    <LegalShell active="terms">
      <article className="glass-panel relative overflow-hidden rounded-xl p-8 shadow-2xl md:p-12">
        <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <header className="mb-12 border-b border-outline-variant/30 pb-8">
          <div className="mb-4 flex items-center gap-2 font-mono text-sm text-tertiary-container">
            <span className="material-symbols-outlined text-[16px]">
              folder_open
            </span>
            <span>/legal</span>
            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>
            <span className="text-primary-fixed-dim">terms</span>
          </div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary-fixed md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 font-body text-on-surface-variant">
            Last updated: <span className="text-on-surface">October 24, 2024</span>
          </p>
        </header>

        <div className="space-y-12 font-body leading-relaxed text-on-surface">
          <section className="group space-y-4">
            <h2 className="flex items-center gap-3 font-headline text-2xl font-bold text-secondary-fixed">
              <span className="flex size-8 items-center justify-center rounded border border-outline-variant/50 bg-surface-container-high font-mono text-sm text-primary transition-colors group-hover:border-primary/50">
                01
              </span>
              Usage
            </h2>
            <div className="space-y-4 pl-11">
              <p>
                By accessing or using the CodeIT platform, you agree to be bound
                by these Terms of Service. Use CodeIT exclusively for learning,
                improving your coding skills, and participating in fair
                competition.
              </p>
              <p>
                You strictly agree <strong className="text-primary">not to</strong>:
              </p>
              <ul className="mt-2 list-none space-y-2">
                {[
                  "Abuse the automated judging system by intentionally submitting malicious code or attempting to breach sandboxed environments.",
                  "Disrupt scheduled contests through coordinated attacks or exploiting platform vulnerabilities.",
                  "Access, attempt to access, or tamper with other users' accounts, private submissions, or personal data.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-1 shrink-0 text-[20px] text-error">
                      close
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="h-px w-full bg-outline-variant/20" />

          <section className="group space-y-4">
            <h2 className="flex items-center gap-3 font-headline text-2xl font-bold text-secondary-fixed">
              <span className="flex size-8 items-center justify-center rounded border border-outline-variant/50 bg-surface-container-high font-mono text-sm text-primary transition-colors group-hover:border-primary/50">
                02
              </span>
              Conduct
            </h2>
            <div className="space-y-4 pl-11">
              <p>
                Academic integrity is paramount on CodeIT. Contest submissions{" "}
                <strong className="text-on-surface">
                  must be your own original work
                </strong>{" "}
                unless a specific contest explicitly states that collaboration or
                team participation is allowed.
              </p>
              <div className="mt-4 rounded-r-md border-l-4 border-error-container bg-surface-container-high p-4">
                <p className="mb-1 flex items-center gap-2 font-label text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-error">
                    warning
                  </span>
                  Strictly Prohibited Activities
                </p>
                <p className="text-sm">
                  Automated scraping of problem descriptions, test cases, or
                  user data is prohibited. Denial of Service (DoS) attacks or
                  intentionally flooding the judge with resource-heavy infinite
                  loops will result in immediate permanent bans.
                </p>
              </div>
            </div>
          </section>

          <div className="h-px w-full bg-outline-variant/20" />

          <section className="group space-y-4">
            <h2 className="flex items-center gap-3 font-headline text-2xl font-bold text-secondary-fixed">
              <span className="flex size-8 items-center justify-center rounded border border-outline-variant/50 bg-surface-container-high font-mono text-sm text-primary transition-colors group-hover:border-primary/50">
                03
              </span>
              Updates
            </h2>
            <div className="space-y-4 pl-11">
              <p>
                CodeIT is an evolving platform. Features, judging environments,
                and supported languages may change without prior notice.
              </p>
              <p>
                We reserve the right to modify these Terms of Service at any
                time. Significant changes will be communicated via platform
                announcements. Your continued use of the platform after updates
                indicates your acknowledgment and acceptance of the revised
                terms.
              </p>
            </div>
          </section>
        </div>

        <div className="pointer-events-none absolute -right-10 -bottom-10 size-40 rounded-full bg-primary/10 blur-[50px]" />
      </article>
    </LegalShell>
  );
}
