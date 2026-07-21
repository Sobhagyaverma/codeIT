type SocialAuthButtonsProps = {
  disabledReason?: string;
};

export default function SocialAuthButtons({
  disabledReason = "Coming soon",
}: SocialAuthButtonsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--line)]" />
        <span className="verdict-strip text-[var(--text-dim)]">or continue with</span>
        <div className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled
          title={disabledReason}
          aria-disabled="true"
          className="auth-btn-secondary inline-flex items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2.5 text-sm text-[var(--text-dim)] opacity-60"
        >
          <GoogleIcon />
          Google
        </button>
        <button
          type="button"
          disabled
          title={disabledReason}
          aria-disabled="true"
          className="auth-btn-secondary inline-flex items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2.5 text-sm text-[var(--text-dim)] opacity-60"
        >
          <GitHubIcon />
          GitHub
        </button>
      </div>
      <p className="text-center text-[11px] text-[var(--text-dim)]">
        Google and GitHub sign-in are coming soon.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.18v2.96h5.27c-.23 1.25-1.4 3.66-5.27 3.66-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.84 3.69 14.86 2.8 12.17 2.8 6.98 2.8 2.8 6.98 2.8 12.17S6.98 21.54 12.17 21.54c5.3 0 8.8-3.72 8.8-8.96 0-.6-.07-1.05-.17-1.48z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.32.1-2.75 0 0 .84-.27 2.75 1.05a9.2 9.2 0 0 1 2.5-.35c.85 0 1.71.12 2.5.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.43.2 2.49.1 2.75.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.59.69.48A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"
      />
    </svg>
  );
}
