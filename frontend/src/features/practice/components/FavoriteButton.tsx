import { Star } from "lucide-react";
import { useState } from "react";

export default function FavoriteButton({
  bookmarked,
  disabled,
  onToggle,
}: {
  bookmarked: boolean;
  disabled?: boolean;
  onToggle: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      aria-label={bookmarked ? "Remove favorite" : "Add favorite"}
      aria-pressed={bookmarked}
      disabled={disabled || busy}
      title={disabled ? "Sign in to favorite" : bookmarked ? "Unfavorite" : "Favorite"}
      onClick={async () => {
        if (busy || disabled) return;
        setBusy(true);
        try {
          await onToggle();
        } finally {
          setBusy(false);
        }
      }}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${
        bookmarked
          ? "border-[var(--warn)]/40 bg-[var(--warn)]/10 text-[var(--warn)]"
          : "border-[var(--line)] bg-[var(--bg-inset)] text-[var(--text-dim)] hover:border-[var(--warn)]/40 hover:text-[var(--warn)]"
      }`}
    >
      <Star
        className="h-4 w-4"
        fill={bookmarked ? "currentColor" : "none"}
        strokeWidth={2}
      />
    </button>
  );
}
