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
import TurnstileWidget from "../components/TurnstileWidget";

type Step = 1 | 2 | 3;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  if (user) {
    return <Navigate to="/problems" replace />;
  }

  const bumpCaptcha = (err: unknown) => {
    if (err instanceof ApiError && err.code === "CAPTCHA_FAILED") {
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    }
  };

  const onRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPasswordRequest(email.trim(), captchaToken || undefined);
      setInfo(res.message);
      setStep(2);
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    } catch (err) {
      bumpCaptcha(err);
      setError(err instanceof ApiError ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPasswordVerify(
        email.trim(),
        otp.trim(),
        captchaToken || undefined
      );
      setResetToken(res.resetToken);
      setInfo("Code accepted. Choose a new password.");
      setStep(3);
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    } catch (err) {
      bumpCaptcha(err);
      setError(err instanceof ApiError ? err.message : "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
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
      setError(err instanceof ApiError ? err.message : "Reset failed.");
    } finally {
      setLoading(false);
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
        <h1 className="mb-2 text-2xl font-bold">Forgot password</h1>
        <p className="mb-6 text-sm text-on-surface-variant">
          Step {step} of 3 — request a code, verify it, then set a new password.
        </p>

        {step === 1 && (
          <form className="space-y-4" onSubmit={onRequest}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3"
              required
            />
            <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />
            {error && <p className="text-sm text-error">{error}</p>}
            {info && <p className="text-sm text-primary">{info}</p>}
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary-container font-semibold text-on-primary-container disabled:opacity-70"
            >
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-4" onSubmit={onVerify}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3 tracking-[0.3em]"
              required
            />
            <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />
            {error && <p className="text-sm text-error">{error}</p>}
            {info && <p className="text-sm text-primary">{info}</p>}
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary-container font-semibold text-on-primary-container disabled:opacity-70"
            >
              {loading ? "Checking…" : "Verify code"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="space-y-4" onSubmit={onReset}>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3"
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3"
              required
            />
            <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />
            {error && <p className="text-sm text-error">{error}</p>}
            {info && <p className="text-sm text-primary">{info}</p>}
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary-container font-semibold text-on-primary-container disabled:opacity-70"
            >
              {loading ? "Saving…" : "Update password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
