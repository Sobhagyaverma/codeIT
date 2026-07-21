import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { register } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/toast/ToastProvider";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import AuthPasswordField from "../components/auth/AuthPasswordField";
import AuthSubmitButton from "../components/auth/AuthSubmitButton";
import PasswordStrengthMeter from "../components/auth/PasswordStrengthMeter";
import SocialAuthButtons from "../components/auth/SocialAuthButtons";
import {
  firstErrorKey,
  mapAuthError,
  validateRegister,
  type FieldErrors,
  type RegisterFormValues,
} from "../lib/authValidation";

export default function Register() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const nameRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const redirectTimer = useRef<number | null>(null);

  const [form, setForm] = useState<RegisterFormValues>({
    name: "",
    uniqueUserId: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<
    FieldErrors<"name" | "uniqueUserId" | "email" | "password">
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    nameRef.current?.focus();
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
    };
  }, []);

  if (user) {
    return <Navigate to="/problems" replace />;
  }

  const updateField = <K extends keyof RegisterFormValues>(
    key: K,
    value: RegisterFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nextErrors = validateRegister(form);
    setErrors(nextErrors);
    const first = firstErrorKey(nextErrors);
    if (first) {
      const refs = {
        name: nameRef,
        uniqueUserId: userIdRef,
        email: emailRef,
        password: passwordRef,
      };
      refs[first].current?.focus();
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        uniqueUserId: form.uniqueUserId.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      pushToast("Account created. Redirecting to login…", "success");
      redirectTimer.current = window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
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
      title="Create account"
      subtitle="Join CodeIT and start solving with a live judge."
      footerNote={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-[var(--info)] hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField
          ref={nameRef}
          label="Name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          onBlur={() => {
            const next = validateRegister(form);
            if (next.name) setErrors((prev) => ({ ...prev, name: next.name }));
          }}
          error={errors.name}
        />

        <AuthField
          ref={userIdRef}
          label="Username"
          name="uniqueUserId"
          autoComplete="username"
          value={form.uniqueUserId}
          onChange={(e) => updateField("uniqueUserId", e.target.value)}
          onBlur={() => {
            const next = validateRegister(form);
            if (next.uniqueUserId) {
              setErrors((prev) => ({
                ...prev,
                uniqueUserId: next.uniqueUserId,
              }));
            }
          }}
          error={errors.uniqueUserId}
          hint="3–24 letters, numbers, or underscores."
        />

        <AuthField
          ref={emailRef}
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          onBlur={() => {
            const next = validateRegister(form);
            if (next.email) {
              setErrors((prev) => ({ ...prev, email: next.email }));
            }
          }}
          error={errors.email}
        />

        <AuthPasswordField
          ref={passwordRef}
          label="Password"
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          onBlur={() => {
            const next = validateRegister(form);
            if (next.password) {
              setErrors((prev) => ({ ...prev, password: next.password }));
            }
          }}
          error={errors.password}
          hint="Minimum 6 characters (required by the server)."
        />

        <PasswordStrengthMeter password={form.password} />

        {formError && (
          <p
            role="alert"
            className="rounded-md border border-[var(--err)]/40 bg-[var(--err)]/10 px-3 py-2 text-xs text-[var(--err)]"
          >
            {formError}
          </p>
        )}

        <AuthSubmitButton loading={loading} loadingLabel="Creating account…">
          Create account
        </AuthSubmitButton>

        <SocialAuthButtons />
      </form>
    </AuthLayout>
  );
}
