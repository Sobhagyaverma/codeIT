import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type LegalPageProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
};

function LegalPage({ title, eyebrow, children }: LegalPageProps) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="verdict-strip text-[var(--text-dim)]">{eyebrow}</p>
      <h1 className="display mt-3 text-3xl font-semibold">{title}</h1>
      <div className="mt-8 space-y-4 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-6 text-sm leading-relaxed text-[var(--text-dim)]">
        {children}
      </div>
      <p className="mt-6 text-sm text-[var(--text-dim)]">
        <Link to="/login" className="text-[var(--info)] hover:underline">
          Back to login
        </Link>
      </p>
    </main>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy" eyebrow="/legal → privacy">
      <p>
        CodeIT stores the account details you provide during registration
        (name, unique user ID, email) and authentication tokens required to
        keep you signed in.
      </p>
      <p>
        Submission code, contest activity, and judge results are processed to
        provide platform features. We do not sell personal data.
      </p>
      <p>
        Tokens are stored in your browser. You can clear them at any time by
        logging out. Contact support if you need an account removed.
      </p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms of Service" eyebrow="/legal → terms">
      <p>
        By using CodeIT you agree to use the platform for learning and fair
        competition. Do not abuse the judge, disrupt contests, or attempt to
        access other users&apos; accounts.
      </p>
      <p>
        Contest submissions must be your own work unless a contest explicitly
        allows collaboration. Automated scraping or denial-of-service against
        the judge is prohibited.
      </p>
      <p>
        Features may change as the platform evolves. Continued use after
        updates constitutes acceptance of the revised terms.
      </p>
    </LegalPage>
  );
}

export function Help() {
  return (
    <LegalPage title="Help" eyebrow="/support → help">
      <p>
        <strong className="text-[var(--text)]">Login issues:</strong> Use your
        email or unique user ID with the correct password. Passwords are case
        sensitive and must be at least 6 characters.
      </p>
      <p>
        <strong className="text-[var(--text)]">Running code:</strong> Programs
        should read from stdin and write to stdout. Use Run for sample cases
        and Submit for hidden tests.
      </p>
      <p>
        <strong className="text-[var(--text)]">Contests:</strong> Join the
        contest, start your personal timer, then submit from the competition
        room. Only Accepted contest submissions update the live leaderboard.
      </p>
      <p>
        Still stuck? Reach out via the{" "}
        <Link to="/contact" className="text-[var(--info)] hover:underline">
          Contact
        </Link>{" "}
        page.
      </p>
    </LegalPage>
  );
}
