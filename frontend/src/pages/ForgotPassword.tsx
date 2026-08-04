import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ApiError,
  forgotPasswordRequest,
  forgotPasswordReset,
  forgotPasswordVerify,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import TurnstileWidget from "../components/TurnstileWidget";

type Step = 1 | 2 | 3;

export default function ForgotPassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  if (user) return <Navigate to="/problems" replace />;

  const bumpCaptcha = (err: unknown) => {
    if (err instanceof ApiError && err.code === "CAPTCHA_FAILED") {
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    }
  };

  const onRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await forgotPasswordRequest(email.trim(), captchaToken || undefined);
      setInfo(res.message);
      setStep(2);
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    } catch (err) {
      bumpCaptcha(err);
      setError(err instanceof ApiError ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await forgotPasswordVerify(
        email.trim(),
        otp.trim(),
        captchaToken || undefined
      );
      setResetToken(res.resetToken);
      setStep(3);
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    } catch (err) {
      bumpCaptcha(err);
      setError(err instanceof ApiError ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6 || password !== confirm) {
      setError("Passwords must match and be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPasswordReset(
        resetToken,
        password,
        captchaToken || undefined
      );
      setInfo(res.message);
      window.setTimeout(() => navigate("/login", { replace: true }), 800);
    } catch (err) {
      bumpCaptcha(err);
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle={`Step ${step} of 3`}>
      {step === 1 && (
        <form onSubmit={onRequest} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          />
          <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />
          {error && <p className="text-xs text-[var(--err)]">{error}</p>}
          {info && <p className="text-xs text-[var(--info)]">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--accent)] px-3 py-2 font-semibold text-black disabled:opacity-70"
          >
            {loading ? "Sending…" : "Send code"}
          </button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={onVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 tracking-widest"
          />
          <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />
          {error && <p className="text-xs text-[var(--err)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--accent)] px-3 py-2 font-semibold text-black disabled:opacity-70"
          >
            {loading ? "Checking…" : "Verify code"}
          </button>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={onReset} className="space-y-4">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          />
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
            className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          />
          <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />
          {error && <p className="text-xs text-[var(--err)]">{error}</p>}
          {info && <p className="text-xs text-[var(--info)]">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--accent)] px-3 py-2 font-semibold text-black disabled:opacity-70"
          >
            {loading ? "Saving…" : "Update password"}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-xs text-[var(--text-dim)]">
        <Link to="/login" className="text-[var(--info)] hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
