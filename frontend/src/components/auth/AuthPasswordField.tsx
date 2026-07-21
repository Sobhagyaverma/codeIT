import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

type AuthPasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
  error?: string;
  hint?: ReactNode;
};

const AuthPasswordField = forwardRef<HTMLInputElement, AuthPasswordFieldProps>(
  function AuthPasswordField(
    { label, error, hint, id, className = "", ...props },
    ref
  ) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const [visible, setVisible] = useState(false);
    const describedBy = [
      error ? errorId : null,
      hint ? hintId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-[var(--text-dim)]"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`auth-input w-full rounded-md border bg-[var(--bg-inset)] px-3 py-2.5 pr-16 text-sm text-[var(--text)] transition placeholder:text-[var(--text-dim)]/70 focus:outline-none ${
              error
                ? "border-[var(--err)] focus:border-[var(--err)]"
                : "border-[var(--line)] focus:border-[var(--info)]"
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-[var(--text-dim)] transition hover:text-[var(--info)]"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>
        {hint && (
          <div id={hintId} className="text-xs text-[var(--text-dim)]">
            {hint}
          </div>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-[var(--err)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

export default AuthPasswordField;
