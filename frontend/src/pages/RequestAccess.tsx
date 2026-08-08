import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import AppNav from "../components/AppNav";
import TurnstileWidget from "../components/TurnstileWidget";
import { useAuth } from "../context/AuthContext";
import { useRegistration } from "../context/RegistrationContext";
import { ApiError, describeApiError, requestBetaAccess } from "../lib/api";

export default function RequestAccess() {
  const { user } = useAuth();
  const { config, loading: configLoading } = useRegistration();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [reason, setReason] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/problems" replace />;
  }

  if (!configLoading && config.mode === "OPEN") {
    return <Navigate to="/register" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !email.trim() || !college.trim() || !year.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await requestBetaAccess({
        fullName: fullName.trim(),
        email: email.trim(),
        college: college.trim(),
        year: year.trim(),
        reason: reason.trim() || undefined,
        captchaToken: captchaToken || undefined,
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "CAPTCHA_FAILED") {
        setCaptchaReset((n) => n + 1);
        setCaptchaToken(null);
      }
      setError(describeApiError(err, "Could not submit request."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-surface text-on-surface">
      <AppNav />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-16 pt-28">
        <p className="mb-2 font-code-sm text-xs font-semibold tracking-widest text-primary uppercase">
          Private Beta
        </p>
        <h1 className="font-headline-lg mb-2 text-3xl font-bold tracking-tight">
          Request Beta Access
        </h1>
        <p className="mb-8 text-on-surface-variant">
          CodeT is invite-only while we run the private beta. Tell us a bit
          about yourself and we&apos;ll email an invite if approved.
        </p>

        {done ? (
          <div className="rounded-xl border border-secondary/40 bg-secondary/10 p-6">
            <h2 className="mb-2 font-semibold text-secondary">Request received</h2>
            <p className="text-sm text-on-surface-variant">
              Thanks — we&apos;ll review your request and email you if you&apos;re
              invited. Already have a code?{" "}
              <Link to="/register" className="text-primary underline">
                Register here
              </Link>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Full name" id="fullName">
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="glow-input h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3 text-on-surface"
                required
              />
            </Field>
            <Field label="Email" id="email">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glow-input h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3 text-on-surface"
                required
              />
            </Field>
            <Field label="College" id="college">
              <input
                id="college"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="glow-input h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3 text-on-surface"
                required
              />
            </Field>
            <Field label="Year" id="year">
              <input
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2nd year, 2027"
                className="glow-input h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3 text-on-surface"
                required
              />
            </Field>
            <Field label="Why do you want access? (optional)" id="reason">
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-on-surface"
              />
            </Field>
            <TurnstileWidget
              onToken={setCaptchaToken}
              resetKey={captchaReset}
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-on-primary disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Request access"}
            </button>
            <p className="text-center text-sm text-on-surface-variant">
              Already invited?{" "}
              <Link to="/register" className="text-primary underline">
                Create account
              </Link>{" "}
              ·{" "}
              <Link to="/login" className="text-primary underline">
                Login
              </Link>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm text-on-surface-variant">
        {label}
      </label>
      {children}
    </div>
  );
}
