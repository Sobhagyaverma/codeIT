import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, resendVerifyEmail, verifyEmail } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import TurnstileWidget from "../components/TurnstileWidget";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [email, setEmail] = useState(params.get("email") || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  useEffect(() => {
    const fromQuery = params.get("email");
    if (fromQuery) setEmail(fromQuery);
  }, [params]);

  if (user) {
    return <Navigate to="/problems" replace />;
  }

  const bumpCaptcha = (err: unknown) => {
    if (err instanceof ApiError && err.code === "CAPTCHA_FAILED") {
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim() || otp.trim().length !== 6) {
      setError("Enter your email and the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(email.trim(), otp.trim(), captchaToken || undefined);
      setMessage("Email verified. You can sign in now.");
      window.setTimeout(() => navigate("/login", { replace: true }), 700);
    } catch (err) {
      bumpCaptcha(err);
      setError(err instanceof ApiError ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setResending(true);
    try {
      const res = await resendVerifyEmail(email.trim(), captchaToken || undefined);
      setMessage(res.message || "If an account exists, a new code was sent.");
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    } catch (err) {
      bumpCaptcha(err);
      setError(err instanceof ApiError ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 text-on-surface">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-low/80 p-8 backdrop-blur-xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
            terminal
          </span>
          <span className="font-bold tracking-tighter">CodeIT</span>
        </Link>
        <h1 className="mb-2 text-2xl font-bold">Verify your email</h1>
        <p className="mb-6 text-sm text-on-surface-variant">
          Enter the 6-digit code we sent. Codes expire in a few minutes.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-on-surface-variant">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-on-surface-variant">
              Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3 tracking-[0.3em]"
              placeholder="000000"
              required
            />
          </div>
          <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />
          {error && <p className="text-sm text-error">{error}</p>}
          {message && <p className="text-sm text-primary">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-primary-container font-semibold text-on-primary-container disabled:opacity-70"
          >
            {loading ? "Verifying…" : "Verify email"}
          </button>
        </form>
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="mt-4 w-full text-sm text-primary underline-offset-4 hover:underline disabled:opacity-70"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
