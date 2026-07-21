import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: ReactNode;
};

const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField(
    { label, error, hint, id, className = "", ...props },
    ref
  ) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
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
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`auth-input w-full rounded-md border bg-[var(--bg-inset)] px-3 py-2.5 text-sm text-[var(--text)] transition placeholder:text-[var(--text-dim)]/70 focus:outline-none ${
            error
              ? "border-[var(--err)] focus:border-[var(--err)]"
              : "border-[var(--line)] focus:border-[var(--info)]"
          } ${className}`}
          {...props}
        />
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

export default AuthField;
