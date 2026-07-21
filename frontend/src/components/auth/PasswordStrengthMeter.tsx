export type PasswordStrength = {
  score: number;
  label: "Weak" | "Fair" | "Good" | "Strong";
  checks: {
    length: boolean;
    mixedCase: boolean;
    number: boolean;
    symbol: boolean;
  };
};

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const label =
    score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";

  return { score, label, checks };
}

type PasswordStrengthMeterProps = {
  password: string;
};

export default function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const width = `${(strength.score / 4) * 100}%`;
  const color =
    strength.score <= 1
      ? "var(--err)"
      : strength.score === 2
        ? "var(--warn)"
        : strength.score === 3
          ? "var(--info)"
          : "var(--ok)";

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-dim)]">Password strength</span>
        <span style={{ color }} className="font-medium">
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-inset)]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width, background: color }}
        />
      </div>
      <ul className="grid grid-cols-2 gap-1 text-[11px] text-[var(--text-dim)]">
        <li className={strength.checks.length ? "text-[var(--ok)]" : undefined}>
          8+ characters
        </li>
        <li
          className={strength.checks.mixedCase ? "text-[var(--ok)]" : undefined}
        >
          Upper &amp; lower case
        </li>
        <li className={strength.checks.number ? "text-[var(--ok)]" : undefined}>
          A number
        </li>
        <li className={strength.checks.symbol ? "text-[var(--ok)]" : undefined}>
          A symbol
        </li>
      </ul>
    </div>
  );
}
