type AuthSubmitButtonProps = {
  loading?: boolean;
  children: string;
  loadingLabel?: string;
};

export default function AuthSubmitButton({
  loading = false,
  children,
  loadingLabel = "Please wait…",
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="auth-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0a0d12] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0d12]/30 border-t-[#0a0d12]"
          aria-hidden
        />
      )}
      {loading ? loadingLabel : children}
    </button>
  );
}
