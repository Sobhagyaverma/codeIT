import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, resendVerifyEmail, verifyEmail } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import TurnstileWidget from "../components/TurnstileWidget";

export default function VerifyEmail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  useEffect(() => {
    const q = params.get("email");
    if (q) setEmail(q);
  }, [params]);

  if (user) return <Navigate to="/problems" replace />;

  const bumpCaptcha = (err: unknown) => {
    if (err instanceof ApiError && err.code === "CAPTCHA_FAILED") {
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyEmail(email.trim(), otp.trim(), captchaToken || undefined);
      setInfo("Verified. Redirecting to login…");
      window.setTimeout(() => navigate("/login", { replace: true }), 700);
    } catch (err) {
      bumpCaptcha(err);
      setError(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError(null);
    try {
      const res = await resendVerifyEmail(email.trim(), captchaToken || undefined);
      setInfo(res.message);
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    } catch (err) {
      bumpCaptcha(err);
      setError(err instanceof ApiError ? err.message : "Resend failed");
    }
  };

  return (
    <AuthLayout title="Verify email" subtitle="Enter the 6-digit code we sent you.">
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="email"
          className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 tracking-widest"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          required
        />
        <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />
        {error && <p className="text-xs text-[var(--err)]">{error}</p>}
        {info && <p className="text-xs text-[var(--info)]">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[var(--accent)] px-3 py-2 font-semibold text-black disabled:opacity-70"
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
        <button type="button" onClick={onResend} className="w-full text-xs text-[var(--info)]">
          Resend code
        </button>
        <p className="text-center text-xs text-[var(--text-dim)]">
          <Link to="/login" className="text-[var(--info)] hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
