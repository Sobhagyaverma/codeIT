import { Link } from "react-router-dom";
import LegalShell from "../components/LegalShell";

export default function Privacy() {
  return (
    <LegalShell active="privacy">
      <div className="mb-12">
        <div className="mb-4 flex items-center gap-2 font-mono text-sm text-tertiary">
          <span className="material-symbols-outlined text-[16px]">
            folder_open
          </span>
          <span>/legal</span>
          <span className="text-outline">-&gt;</span>
          <span className="text-primary">privacy</span>
        </div>
        <h1 className="mb-6 font-headline text-4xl font-extrabold tracking-tight text-on-background md:text-5xl">
          Privacy Policy
        </h1>
        <p className="font-body text-lg text-on-surface-variant">
          Last updated:{" "}
          <span className="font-mono text-sm">2024-05-20</span>. This policy
          outlines how CodeT manages your data within our highly secure
          technical environment.
        </p>
      </div>

      <div className="glass-panel space-y-12 rounded-xl p-6 md:p-10">
        <section>
          <h2 className="mb-6 flex items-center gap-3 font-headline text-2xl font-bold text-primary">
            <span className="material-symbols-outlined">database</span>
            1. Data Storage
          </h2>
          <div className="space-y-4 font-body text-on-surface-variant">
            <p>
              CodeT stores necessary registration account details to maintain
              secure access and operational integrity. This minimal dataset
              includes:
            </p>
            <ul className="list-none space-y-3 pl-2">
              {[
                ["Name", "For internal identification and leaderboard displays (configurable)."],
                [
                  "Unique User ID",
                  "An immutable technical identifier tying your activity to your account.",
                ],
                [
                  "Email Address",
                  "Used strictly for account recovery, critical security alerts, and essential service communications.",
                ],
                [
                  "Authentication Tokens",
                  "Securely hashed tokens required to maintain active sessions across the platform.",
                ],
              ].map(([title, body]) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-1 text-[20px] text-primary">
                    check_circle
                  </span>
                  <div>
                    <strong className="text-on-surface">{title}:</strong> {body}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <hr className="border-outline-variant/30" />

        <section>
          <h2 className="mb-6 flex items-center gap-3 font-headline text-2xl font-bold text-primary">
            <span className="material-symbols-outlined">monitoring</span>
            2. Usage &amp; Telemetry
          </h2>
          <div className="space-y-4 font-body text-on-surface-variant">
            <p>
              To provide core functionalities like real-time compilation,
              competitive ranking, and detailed analytics, we process specific
              platform interactions:
            </p>
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-4 font-mono text-sm text-tertiary-fixed-dim">
              <span className="text-primary-fixed-dim">const</span>{" "}
              processed_metrics = [
              <span className="text-secondary-fixed-dim">
                &quot;submission_code&quot;
              </span>
              ,{" "}
              <span className="text-secondary-fixed-dim">
                &quot;contest_activity&quot;
              </span>
              ,{" "}
              <span className="text-secondary-fixed-dim">
                &quot;judge_results&quot;
              </span>
              ];
            </div>
            <p>
              This data is utilized solely to enhance your experience, compute
              algorithm efficiency scores, and maintain the integrity of
              competitions.
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary-container/30 bg-primary-container/10 p-4">
              <span className="material-symbols-outlined text-primary">
                gpp_good
              </span>
              <p className="font-label text-sm text-on-surface">
                <strong>Zero-Sale Protocol:</strong> We categorically do not
                sell, rent, or lease personal data to third-party brokers or
                advertisers.
              </p>
            </div>
          </div>
        </section>

        <hr className="border-outline-variant/30" />

        <section>
          <h2 className="mb-6 flex items-center gap-3 font-headline text-2xl font-bold text-primary">
            <span className="material-symbols-outlined">web</span>
            3. Browser Data &amp; Control
          </h2>
          <div className="space-y-4 font-body text-on-surface-variant">
            <p>
              Session management relies on local browser storage to ensure
              seamless navigation across the command center.
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Authentication tokens are securely stored within your
                browser&apos;s local environment.
              </li>
              <li>
                You have absolute control over these tokens. Initiating a
                standard &quot;Log Out&quot; procedure immediately purges these
                tokens from your local machine and invalidates the session
                server-side.
              </li>
            </ul>
            <div className="mt-6 rounded-lg border border-outline-variant/30 bg-surface-container/50 p-5">
              <h4 className="mb-2 font-label text-sm font-bold text-on-surface">
                Account Deletion Request
              </h4>
              <p className="mb-4 text-sm">
                To initiate a complete purge of your account and associated
                historical data from our systems, you must submit a formal
                request.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded border border-outline-variant/50 bg-surface-variant px-4 py-2 font-label text-sm text-on-surface transition-colors hover:bg-surface-bright"
              >
                <span className="material-symbols-outlined text-[18px]">
                  delete_forever
                </span>
                Contact Support for Removal
              </Link>
            </div>
          </div>
        </section>
      </div>
    </LegalShell>
  );
}
