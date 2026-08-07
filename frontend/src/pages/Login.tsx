import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ApiError, login } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useRegistration } from "../context/RegistrationContext";
import TurnstileWidget from "../components/TurnstileWidget";

const LEFT_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB0pkqjDs_c1M_SDcWreXKSC6T80ekev2YeHxksln1UXxulTdUcIVnwaMaWAQPPtEK4nymYcchMCXU3UM4NFbL5iyie9Ev60Pk1pDnUrEn0XRGQV5_bhJ_O7lCVLHZ0mnR8T3EuPfZgVTLiCRNSgNdEyt1xpr7a0FelYtM6My02Zf1R-yVB-t3jCIG6Y1IqlBTFxXoocLF2B7LubCPe1i8ghTmVgcgHEXdQ3aDaxnXQQAESllBWQgQQ";

export default function Login() {
  const navigate = useNavigate();
  const { user, rememberMe, setRememberMe, establishSession } = useAuth();
  const { config } = useRegistration();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [btnLabel, setBtnLabel] = useState("Sign In");
  const [successStyle, setSuccessStyle] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [toast, setToast] = useState<{ open: boolean; exiting: boolean; message: string }>({
    open: false,
    exiting: false,
    message: "",
  });

  if (user) {
    return <Navigate to="/problems" replace />;
  }

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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIdentifierError(false);
    setPasswordError(false);

    let valid = true;
    if (!identifier.trim()) {
      setIdentifierError(true);
      valid = false;
    }
    if (!password) {
      setPasswordError(true);
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    setBtnLabel("Authenticating...");
    try {
      const auth = await login(identifier.trim(), password, captchaToken || undefined);
      establishSession({
        user: {
          id: auth.userId,
          name: auth.name,
          uniqueUserId: auth.uniqueUserId,
          email: auth.email,
          role: auth.role,
          token: auth.token,
        },
        token: auth.token,
        expiresInMs: auth.expiresIn || 24 * 60 * 60 * 1000,
        rememberMe,
      });
      setBtnLabel("Authorized");
      setSuccessStyle(true);
      window.setTimeout(() => navigate("/problems", { replace: true }), 400);
    } catch (err) {
      if (err instanceof ApiError && err.code === "CAPTCHA_FAILED") {
        setCaptchaReset((n) => n + 1);
        setCaptchaToken(null);
      }
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        const q = identifier.includes("@")
          ? `?email=${encodeURIComponent(identifier.trim())}`
          : "";
        showToast("Verify your email before signing in.");
        window.setTimeout(() => navigate(`/verify-email${q}`), 500);
        setBtnLabel("Sign In");
        setSuccessStyle(false);
        return;
      }
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Authentication failed.";
      showToast(message);
      setBtnLabel("Sign In");
      setSuccessStyle(false);
    } finally {
      setLoading(false);
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
              aria-label="Atmospheric command center background"
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
                Continue your coding journey
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Write full programs, get real verdicts, compete live, and get grounded AI help when
                you get stuck.
              </p>
            </div>

            <div className="font-code-sm text-code-sm mt-12 max-w-lg rounded-xl border border-outline-variant/30 bg-surface-container/30 p-6 text-primary/70 backdrop-blur-md">
              <div className="mb-4 flex items-center gap-2 opacity-60">
                <span className="h-3 w-3 rounded-full bg-error/40" />
                <span className="h-3 w-3 rounded-full bg-primary/40" />
                <span className="h-3 w-3 rounded-full bg-tertiary/40" />
              </div>
              <div className="font-code-sm space-y-1">
                <div className="flex gap-2">
                  <span className="text-primary">$</span>
                  <span>submit two_sum.py</span>
                </div>
                <div className="text-outline">compiling... ok</div>
                <div className="flex justify-between">
                  <span>case 01</span>
                  <span className="text-primary">Accepted</span>
                  <span className="text-outline">12ms</span>
                </div>
                <div className="flex justify-between">
                  <span>case 02</span>
                  <span className="text-primary">Accepted</span>
                  <span className="text-outline">14ms</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-outline-variant/20 pt-4">
                  <span className="text-label-md tracking-wider uppercase opacity-60">verdict</span>
                  <span className="font-bold text-primary">Accepted</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center bg-surface p-margin-mobile md:p-margin-desktop lg:w-1/2">
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

          <div className="relative w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-low/80 p-8 shadow-[0_0_40px_rgba(132,43,210,0.05)] backdrop-blur-xl">
            <div className="mb-10 text-center">
              <h2 className="font-headline-lg text-headline-lg mb-2 text-on-surface lg:font-headline-xl lg:text-headline-xl">
                Sign In
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Enter your credentials to access the terminal.
              </p>
            </div>

            <form className="space-y-6" onSubmit={onSubmit} noValidate>
              <div className="space-y-2">
                <label
                  className="font-label-md text-label-md block text-on-surface-variant"
                  htmlFor="identifier"
                >
                  Email or User ID
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                    person
                  </span>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="sysadmin@codeit.dev"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={`glow-input font-body-md h-12 w-full rounded-lg border bg-surface-container pr-4 pl-12 text-on-surface transition-all placeholder:text-outline/50 focus:ring-0 focus:outline-none ${
                      identifierError ? "border-error" : "border-outline-variant"
                    }`}
                  />
                </div>
                {identifierError && (
                  <p className="font-label-md mt-1 text-sm text-error">
                    Please enter a valid identifier.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    className="font-label-md text-label-md block text-on-surface-variant"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="font-label-md text-label-md text-primary transition-colors hover:text-primary-container"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                    lock
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`glow-input font-body-md h-12 w-full rounded-lg border bg-surface-container pr-12 pl-12 text-on-surface transition-all placeholder:text-outline/50 focus:ring-0 focus:outline-none ${
                      passwordError ? "border-error" : "border-outline-variant"
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-outline transition-colors hover:text-on-surface focus:outline-none"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {passwordError && (
                  <p className="font-label-md mt-1 text-sm text-error">Password is required.</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-5 w-5 rounded border-outline-variant bg-surface-container text-primary-container focus:ring-primary-container focus:ring-offset-surface"
                />
                <label
                  htmlFor="remember"
                  className="font-body-md text-body-md ml-3 cursor-pointer text-on-surface-variant select-none"
                >
                  Remember me
                </label>
              </div>

              <TurnstileWidget
                onToken={setCaptchaToken}
                resetKey={captchaReset}
              />

              <button
                type="submit"
                disabled={loading}
                className={`btn-glow font-label-md text-label-md flex h-12 w-full items-center justify-center gap-2 rounded-lg transition-all active:scale-[0.98] ${
                  successStyle
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : "bg-primary-container text-on-primary-container"
                } ${loading ? "cursor-not-allowed opacity-80" : ""}`}
              >
                <span>{btnLabel}</span>
                {loading && (
                  <span className="material-symbols-outlined animate-spin-fast">
                    progress_activity
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Don&apos;t have an account?{" "}
                {config.privateBeta ? (
                  <Link
                    to="/request-access"
                    className="font-label-md text-primary underline-offset-4 decoration-primary/50 hover:underline"
                  >
                    Request Beta Access
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="font-label-md text-primary underline-offset-4 decoration-primary/50 hover:underline"
                  >
                    Create an account
                  </Link>
                )}
              </p>
            </div>
          </div>

          <div className="absolute bottom-margin-mobile w-full text-center md:bottom-margin-desktop">
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
              <span className="font-label-md text-label-md font-bold">Authentication Failed</span>
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
