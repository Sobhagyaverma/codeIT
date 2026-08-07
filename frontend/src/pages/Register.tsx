import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  ApiError,
  register,
  resendVerifyEmail,
  verifyEmail,
  verifyInvite,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useRegistration } from "../context/RegistrationContext";
import TurnstileWidget from "../components/TurnstileWidget";

type Step = "details" | "otp";

const LEFT_BG =
  "https://lh3.googleusercontent.com/aida/AP1WRLusNcBWUpNqhzrTCqukp5VIWg3_gbicBOVjiaXKLiondMCNDefJU921z66mx_wjp_AS2eUFlEulC5ysqSjnNHKgfPrMz7EfXNrWLD9HhEIXCyEKyDmJIPBXS-whExu_xrb6etcyApbA28omMAOVC_r6K1i96PJm7WpzkFxTM_ehmxFzRt4LqboqiEp_BOHqH8WL5jjFTDRW-2KINEgeZLvKqA7W7p3j9wLZWRO6x7axCSUE7HficH7nnw";

type Strength = {
  level: 0 | 1 | 2 | 3;
  label: string;
  textClass: string;
  segClass: [string, string, string];
};

function passwordStrength(password: string): Strength {
  const idle = "w-1/3 strength-meter-segment bg-outline-variant/30";
  if (!password) {
    return {
      level: 0,
      label: "Awaiting Input",
      textClass: "font-label-md text-[10px] text-on-surface-variant/70 uppercase tracking-wider",
      segClass: [idle, idle, idle],
    };
  }

  let strength = 0;
  if (password.length > 5) strength += 1;
  if (password.length > 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) strength += 1;
  if (password.length > 10 && /[^A-Za-z0-9]/.test(password)) strength += 1;

  if (strength === 1) {
    return {
      level: 1,
      label: "Weak",
      textClass: "font-label-md text-[10px] text-error uppercase tracking-wider",
      segClass: ["w-1/3 strength-meter-segment bg-error", idle, idle],
    };
  }
  if (strength === 2) {
    return {
      level: 2,
      label: "Acceptable",
      textClass: "font-label-md text-[10px] text-tertiary-container uppercase tracking-wider",
      segClass: [
        "w-1/3 strength-meter-segment bg-tertiary-container",
        "w-1/3 strength-meter-segment bg-tertiary-container",
        idle,
      ],
    };
  }
  return {
    level: 3,
    label: "Optimal",
    textClass: "font-label-md text-[10px] text-primary uppercase tracking-wider",
    segClass: [
      "w-1/3 strength-meter-segment bg-primary",
      "w-1/3 strength-meter-segment bg-primary",
      "w-1/3 strength-meter-segment bg-primary",
    ],
  };
}

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { config } = useRegistration();
  const requiresInvite = config.requiresInvite;
  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [inviteCode, setInviteCode] = useState(
    () => searchParams.get("invite") || ""
  );
  const [inviteOk, setInviteOk] = useState<boolean | null>(null);
  const [inviteHint, setInviteHint] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [btnLabel, setBtnLabel] = useState("Create account");
  const [successStyle, setSuccessStyle] = useState(false);
  const [otpHint, setOtpHint] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [toast, setToast] = useState<{ open: boolean; exiting: boolean; message: string }>({
    open: false,
    exiting: false,
    message: "",
  });

  const strength = useMemo(() => passwordStrength(password), [password]);

  useEffect(() => {
    const qEmail = searchParams.get("email");
    const qInvite = searchParams.get("invite");
    if (qEmail) setEmail(qEmail);
    if (qInvite) setInviteCode(qInvite);
  }, [searchParams]);

  if (user) {
    return <Navigate to="/problems" replace />;
  }

  const checkInvite = async () => {
    if (!requiresInvite) return;
    if (!inviteCode.trim() || !email.trim()) {
      setInviteOk(null);
      setInviteHint("");
      return;
    }
    try {
      await verifyInvite(inviteCode.trim(), email.trim());
      setInviteOk(true);
      setInviteHint("Invite looks valid for this email.");
    } catch (err) {
      setInviteOk(false);
      setInviteHint(
        err instanceof ApiError ? err.message : "Invalid invite code."
      );
    }
  };

  const showToast = (message: string) => {
    setToast({ open: true, exiting: false, message });
    window.setTimeout(() => hideToast(), 5000);
  };

  const hideToast = () => {
    setToast((t) => ({ ...t, exiting: true }));
    window.setTimeout(() => {
      setToast({ open: false, exiting: false, message: "" });
    }, 300);
  };

  const bumpCaptcha = (err: unknown) => {
    if (err instanceof ApiError && err.code === "CAPTCHA_FAILED") {
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    }
  };

  const goToOtpStep = () => {
    setStep("otp");
    setOtp("");
    setOtpHint(`We sent a 6-digit code to ${email.trim()}.`);
    setBtnLabel("Verify email");
    setSuccessStyle(false);
    setCaptchaReset((n) => n + 1);
    setCaptchaToken(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (step === "otp") {
      if (otp.trim().length !== 6) {
        showToast("Enter the 6-digit code from your email.");
        return;
      }
      setLoading(true);
      setBtnLabel("Verifying…");
      try {
        await verifyEmail(email.trim(), otp.trim(), captchaToken || undefined);
        setBtnLabel("Verified");
        setSuccessStyle(true);
        setOtpHint("Email verified. Redirecting to sign in…");
        window.setTimeout(() => navigate("/login", { replace: true }), 700);
      } catch (err) {
        bumpCaptcha(err);
        showToast(err instanceof ApiError ? err.message : "Verification failed.");
        setBtnLabel("Verify email");
        setSuccessStyle(false);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!fullName.trim() || !userId.trim() || !email.trim() || !password || !confirmPassword) {
      showToast("Please fill in all fields.");
      return;
    }
    if (requiresInvite && !inviteCode.trim()) {
      showToast("Invite code is required for Private Beta registration.");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match.");
      return;
    }

    setLoading(true);
    setBtnLabel("Creating account...");
    try {
      if (requiresInvite) {
        await verifyInvite(inviteCode.trim(), email.trim());
      }
      await register({
        name: fullName.trim(),
        uniqueUserId: userId.trim(),
        email: email.trim(),
        password,
        captchaToken: captchaToken || undefined,
        inviteCode: requiresInvite ? inviteCode.trim() : undefined,
      });
      setBtnLabel("Account created");
      setSuccessStyle(true);
      window.setTimeout(() => goToOtpStep(), 500);
    } catch (err) {
      bumpCaptcha(err);
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not create account.";
      showToast(message);
      setBtnLabel("Create account");
      setSuccessStyle(false);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email.trim()) {
      showToast("Email is missing.");
      return;
    }
    setResending(true);
    setOtpHint("");
    try {
      const res = await resendVerifyEmail(email.trim(), captchaToken || undefined);
      setOtpHint(res.message || "If an account exists, a new code was sent.");
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    } catch (err) {
      bumpCaptcha(err);
      showToast(err instanceof ApiError ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="font-body-md text-body-md flex min-h-screen overflow-hidden bg-surface text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container">
      <div className="flex min-h-screen w-full">
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-outline-variant/20 bg-surface-dim p-margin-desktop lg:flex lg:w-1/2">
          <div className="absolute inset-0 z-0">
            <div
              className="h-full w-full bg-cover bg-center opacity-60"
              style={{ backgroundImage: `url("${LEFT_BG}")` }}
              role="img"
              aria-label="Atmospheric coding platform background"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-surface-dim/80 to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-dim/90 via-surface-dim/40 to-transparent" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <Link to="/" className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-4xl text-primary"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  terminal
                </span>
                <h1 className="font-headline-lg text-headline-lg font-bold tracking-tighter text-primary">
                  CodeIT
                </h1>
              </Link>
            </div>

            <div className="max-w-md">
              <h2 className="font-headline-xl text-headline-xl mb-6 text-on-surface drop-shadow-[0_0_15px_rgba(221,183,255,0.2)]">
                Start your coding journey
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Set up your profile, then solve problems, join contests, and enter CodeRooms.
              </p>
            </div>

            <div className="font-code-sm text-code-sm mt-12 max-w-lg rounded-xl border border-outline-variant/30 bg-surface-container/30 p-6 text-primary/70 backdrop-blur-md">
              <div className="mb-4 flex items-center gap-2 opacity-60">
                <span className="h-3 w-3 rounded-full bg-error/40" />
                <span className="h-3 w-3 rounded-full bg-primary/40" />
                <span className="h-3 w-3 rounded-full bg-tertiary/40" />
                <span className="font-body-md ml-2 text-xs text-on-surface-variant/70">
                  register_user.sh
                </span>
              </div>
              <div className="font-code-sm space-y-1">
                <div className="flex gap-2">
                  <span className="text-primary">&gt;</span>
                  <span>register --user adalovelace</span>
                </div>
                <div className="text-outline">validating... ok</div>
                <div className="text-outline">creating profile... ok</div>
                <div className="font-bold text-primary">workspace ready</div>
                <div className="mt-4 flex gap-2 border-t border-outline-variant/20 pt-4">
                  <span className="text-label-md tracking-wider uppercase opacity-60">next:</span>
                  <span className="text-primary">/problems</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center overflow-y-auto bg-surface p-margin-mobile md:p-margin-desktop lg:w-1/2">
          <div className="absolute top-0 left-0 flex w-full items-center justify-center p-margin-mobile lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-2xl text-primary"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                terminal
              </span>
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tighter text-primary">
                CodeIT
              </span>
            </Link>
          </div>

          <div className="relative my-auto w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-low/80 p-8 shadow-[0_0_40px_rgba(132,43,210,0.05)] backdrop-blur-xl">
            <div className="mb-8 text-center">
              <h2 className="font-headline-lg text-headline-lg mb-2 text-on-surface lg:font-headline-xl lg:text-headline-xl">
                {step === "otp" ? "Verify your email" : "Create account"}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {step === "otp"
                  ? "Enter the 6-digit code we sent to finish signup."
                  : requiresInvite
                    ? "Private Beta — register with your invite code."
                    : "Join CodeIT to practice, compete, and collaborate."}
              </p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              {step === "details" ? (
                <>
              {requiresInvite && (
              <div className="space-y-1.5">
                <label
                  className="font-label-md text-label-md block text-on-surface-variant"
                  htmlFor="inviteCode"
                >
                  Invite code
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                    vpn_key
                  </span>
                  <input
                    id="inviteCode"
                    type="text"
                    required
                    placeholder="CODEIT-…"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value);
                      setInviteOk(null);
                    }}
                    onBlur={() => void checkInvite()}
                    className="glow-input font-body-md h-12 w-full rounded-lg border border-outline-variant bg-surface-container pr-4 pl-12 text-on-surface transition-all placeholder:text-outline/50 focus:ring-0 focus:outline-none"
                  />
                </div>
                {inviteHint && (
                  <p
                    className={`text-xs ${
                      inviteOk ? "text-secondary" : "text-error"
                    }`}
                  >
                    {inviteHint}
                  </p>
                )}
                <p className="text-xs text-on-surface-variant">
                  Need an invite?{" "}
                  <Link to="/request-access" className="text-primary underline">
                    Request beta access
                  </Link>
                </p>
              </div>
              )}
              <div className="space-y-1.5">
                <label
                  className="font-label-md text-label-md block text-on-surface-variant"
                  htmlFor="fullName"
                >
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                    person
                  </span>
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="Ada Lovelace"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="glow-input font-body-md h-12 w-full rounded-lg border border-outline-variant bg-surface-container pr-4 pl-12 text-on-surface transition-all placeholder:text-outline/50 focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  className="font-label-md text-label-md block text-on-surface-variant"
                  htmlFor="userId"
                >
                  Unique ID
                </label>
                <div className="relative flex">
                  <span className="font-code-sm inline-flex items-center rounded-l-lg border border-r-0 border-outline-variant bg-surface-container px-4 text-on-surface-variant">
                    @
                  </span>
                  <input
                    id="userId"
                    type="text"
                    required
                    placeholder="adalovelace"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="glow-input font-code-sm h-12 w-full flex-1 rounded-r-lg border border-outline-variant bg-surface-container px-4 text-on-surface transition-all placeholder:text-outline/50 focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  className="font-label-md text-label-md block text-on-surface-variant"
                  htmlFor="email"
                >
                  Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setInviteOk(null);
                    }}
                    onBlur={() => void checkInvite()}
                    className="glow-input font-body-md h-12 w-full rounded-lg border border-outline-variant bg-surface-container pr-4 pl-12 text-on-surface transition-all placeholder:text-outline/50 focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  className="font-label-md text-label-md block text-on-surface-variant"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                    key
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glow-input font-body-md h-12 w-full rounded-lg border border-outline-variant bg-surface-container pr-12 pl-12 text-on-surface transition-all placeholder:text-outline/50 focus:ring-0 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-outline transition-colors hover:text-on-surface focus:outline-none"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
                <div className="mt-2 flex h-1 w-full gap-1 overflow-hidden rounded-full bg-surface-container-highest">
                  <div className={strength.segClass[0]} />
                  <div className={strength.segClass[1]} />
                  <div className={strength.segClass[2]} />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className={strength.textClass}>{strength.label}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  className="font-label-md text-label-md block text-on-surface-variant"
                  htmlFor="confirmPassword"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                    lock_reset
                  </span>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glow-input font-body-md h-12 w-full rounded-lg border border-outline-variant bg-surface-container pr-4 pl-12 text-on-surface transition-all placeholder:text-outline/50 focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label
                      className="font-label-md text-label-md block text-on-surface-variant"
                      htmlFor="verifyEmail"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                        mail
                      </span>
                      <input
                        id="verifyEmail"
                        type="email"
                        value={email}
                        readOnly
                        className="glow-input font-body-md h-12 w-full rounded-lg border border-outline-variant bg-surface-container/70 pr-4 pl-12 text-on-surface-variant focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="font-label-md text-label-md block text-on-surface-variant"
                      htmlFor="otp"
                    >
                      Verification code
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                        pin
                      </span>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        placeholder="000000"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="glow-input font-code-sm h-12 w-full rounded-lg border border-outline-variant bg-surface-container pr-4 pl-12 tracking-[0.35em] text-on-surface transition-all placeholder:tracking-[0.35em] placeholder:text-outline/50 focus:ring-0 focus:outline-none"
                      />
                    </div>
                    {otpHint && (
                      <p className="font-body-md text-sm text-on-surface-variant">{otpHint}</p>
                    )}
                  </div>
                </>
              )}

              <TurnstileWidget
                onToken={setCaptchaToken}
                resetKey={captchaReset}
              />

              <button
                type="submit"
                disabled={loading}
                className={`btn-glow font-label-md text-label-md mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg transition-all active:scale-[0.98] ${
                  successStyle
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : "bg-primary-container text-on-primary-container"
                } ${loading ? "cursor-not-allowed opacity-80" : ""}`}
              >
                <span className="font-bold">{btnLabel}</span>
                {loading && (
                  <span className="material-symbols-outlined animate-spin-fast">
                    progress_activity
                  </span>
                )}
              </button>

              {step === "otp" && (
                <button
                  type="button"
                  onClick={onResend}
                  disabled={resending || loading}
                  className="font-label-md w-full text-sm text-primary underline-offset-4 hover:underline disabled:opacity-70"
                >
                  {resending ? "Sending…" : "Resend code"}
                </button>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-label-md text-primary underline-offset-4 decoration-primary/50 hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>

          <div className="absolute bottom-margin-mobile w-full pb-4 text-center md:bottom-margin-desktop md:pb-0">
            <div className="font-label-md text-label-md flex justify-center gap-6 text-outline-variant">
              <Link to="/privacy" className="transition-colors hover:text-on-surface-variant">
                Privacy Policy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-on-surface-variant">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>

      {toast.open && (
        <div
          className={`fixed top-margin-desktop right-margin-desktop z-50 ${
            toast.exiting ? "toast-exit" : "toast-enter"
          }`}
        >
          <div className="flex items-center gap-3 rounded-xl border border-error/20 bg-error-container px-6 py-4 text-on-error-container shadow-lg">
            <span
              className="material-symbols-outlined text-error"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              error
            </span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-bold">
                {step === "otp" ? "Verification Failed" : "Registration Failed"}
              </span>
              <span className="font-body-md text-sm opacity-90">{toast.message}</span>
            </div>
            <button
              type="button"
              className="ml-4 text-on-error-container/70 hover:text-on-error-container focus:outline-none"
              onClick={hideToast}
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
