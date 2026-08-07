import { useState, type FormEvent } from "react";
import TurnstileWidget from "./TurnstileWidget";
import { useAuth } from "../context/AuthContext";
import { ApiError, describeApiError, submitContact } from "../lib/api";

type Mode = "closed" | "bug" | "feature";

/** Floating feedback control — posts to existing contact API. */
export default function FeedbackFab() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("closed");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const open = (next: Mode) => {
    setMode(next);
    setStatus("");
    setError("");
    setMessage("");
    setName(user?.name || "");
    setEmail(user?.email || "");
    setCaptchaReset((n) => n + 1);
    setCaptchaToken(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!message.trim() || !email.trim() || !name.trim()) {
      setError("Name, email, and message are required.");
      return;
    }
    const prefix =
      mode === "bug" ? "[Beta Bug Report] " : "[Beta Feature Suggestion] ";
    setLoading(true);
    try {
      await submitContact({
        username: name.trim(),
        email: email.trim(),
        subject: prefix + (mode === "bug" ? "Bug report" : "Feature suggestion"),
        message: message.trim(),
        captchaToken: captchaToken || undefined,
      });
      setStatus("Thanks — we got your feedback.");
      setMessage("");
      window.setTimeout(() => setMode("closed"), 1200);
    } catch (err) {
      if (err instanceof ApiError && err.code === "CAPTCHA_FAILED") {
        setCaptchaReset((n) => n + 1);
        setCaptchaToken(null);
      }
      setError(describeApiError(err, "Could not send feedback."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {mode !== "closed" && (
        <form
          onSubmit={onSubmit}
          className="w-[min(92vw,340px)] rounded-xl border border-outline-variant/40 bg-surface-container p-4 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-label-md text-sm font-semibold text-on-surface">
              {mode === "bug" ? "Report a bug" : "Suggest a feature"}
            </h3>
            <button
              type="button"
              onClick={() => setMode("closed")}
              className="text-on-surface-variant hover:text-on-surface"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          {!user && (
            <div className="mb-2 space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              />
            </div>
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Tell us what happened or what you'd like…"
            className="mb-2 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
          <div className="mb-2">
            <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />
          </div>
          {error && <p className="mb-2 text-xs text-error">{error}</p>}
          {status && <p className="mb-2 text-xs text-secondary">{status}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </form>
      )}

      {mode === "closed" ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => open("bug")}
            className="rounded-full border border-outline-variant/50 bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface shadow-lg hover:border-primary/40"
          >
            Report Bug
          </button>
          <button
            type="button"
            onClick={() => open("feature")}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-lg"
          >
            Feedback
          </button>
        </div>
      ) : null}
    </div>
  );
}
