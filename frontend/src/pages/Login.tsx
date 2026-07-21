import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { login } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/toast/ToastProvider";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import AuthPasswordField from "../components/auth/AuthPasswordField";
import AuthSubmitButton from "../components/auth/AuthSubmitButton";
import SocialAuthButtons from "../components/auth/SocialAuthButtons";
import {
  firstErrorKey,
  mapAuthError,
  validateLogin,
  type FieldErrors,
} from "../lib/authValidation";

export default function Login() {
  const { user, rememberMe, setRememberMe, establishSession } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: string } | null)?.from || "/problems";

  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<
    FieldErrors<"identifier" | "password">
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const redirectTimer = useRef<number | null>(null);

  useEffect(() => {
    identifierRef.current?.focus();
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
    };
  }, []);

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nextErrors = validateLogin({ identifier, password });
    setErrors(nextErrors);
    const first = firstErrorKey(nextErrors);
    if (first) {
      if (first === "identifier") identifierRef.current?.focus();
      else passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const auth = await login(identifier.trim(), password);
      establishSession({
        user: {
          id: auth.userId,
          name: auth.name,
          uniqueUserId: auth.uniqueUserId,
          email: auth.email,
          role: auth.role as "USER" | "ADMIN",
          token: auth.token,
        },
        token: auth.token,
        expiresInMs: auth.expiresIn || 24 * 60 * 60 * 1000,
        rememberMe,
      });

      pushToast("Welcome back. Redirecting…", "success");
      redirectTimer.current = window.setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 700);
    } catch (err) {
      const message = mapAuthError(err);
      setFormError(message);
      pushToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Sign in with your email or unique user ID."
      footerNote={
        <>
          No account?{" "}
          <Link to="/register" className="text-[var(--info)] hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField
          ref={identifierRef}
          label="Email or username"
          name="username"
          autoComplete="username"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (errors.identifier) {
              setErrors((prev) => ({ ...prev, identifier: undefined }));
            }
          }}
          onBlur={() => {
            const next = validateLogin({ identifier, password });
            if (next.identifier) {
              setErrors((prev) => ({ ...prev, identifier: next.identifier }));
            }
          }}
          error={errors.identifier}
        />

        <AuthPasswordField
          ref={passwordRef}
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) {
              setErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          onBlur={() => {
            const next = validateLogin({ identifier, password });
            if (next.password) {
              setErrors((prev) => ({ ...prev, password: next.password }));
            }
          }}
          error={errors.password}
        />

        <div className="flex items-center justify-between gap-3 text-xs">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[var(--text-dim)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-[var(--line)]"
            />
            Remember me
          </label>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="text-[var(--text-dim)] opacity-70"
            aria-disabled="true"
          >
            Forgot password?
          </button>
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-md border border-[var(--err)]/40 bg-[var(--err)]/10 px-3 py-2 text-xs text-[var(--err)]"
          >
            {formError}
          </p>
        )}

        <AuthSubmitButton loading={loading} loadingLabel="Signing in…">
          Log in
        </AuthSubmitButton>

        <SocialAuthButtons />
      </form>
    </AuthLayout>
  );
}
