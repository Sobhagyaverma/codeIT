import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";
import TurnstileWidget from "../components/TurnstileWidget";
import { ApiError, submitContact } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const CONTACT_EMAIL = "sobhagyaverma16@gmail.com";

export default function Contact() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!message.trim()) {
      setMessageError(true);
      return;
    }
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setMessageError(false);
    setLoading(true);
    try {
      const res = await submitContact({
        username: name.trim(),
        email: email.trim(),
        subject: subject.trim() || "CodeIT Contact Form",
        message: message.trim(),
        captchaToken: captchaToken || undefined,
      });
      setStatus(res.message);
      setMessage("");
      setSubject("");
      setCaptchaReset((n) => n + 1);
      setCaptchaToken(null);
    } catch (err) {
      if (err instanceof ApiError && err.code === "CAPTCHA_FAILED") {
        setCaptchaReset((n) => n + 1);
        setCaptchaToken(null);
      }
      setError(err instanceof ApiError ? err.message : "Could not send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-on-surface">
      <AppNav activeHint="/contact" />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -right-[10%] top-[10%] h-[40%] w-[40%] rounded-full bg-primary/15 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 items-start gap-6 px-4 pb-16 pt-28 md:px-12 lg:grid-cols-12">
        <div className="space-y-8 lg:sticky lg:top-28 lg:col-span-5">
          <div>
            <h1 className="mb-4 font-headline text-4xl font-extrabold tracking-tight text-on-surface">
              Contact Us
            </h1>
            <p className="font-body text-lg text-on-surface-variant">
              Found a bug, have feedback, or want to suggest new problems? Reach
              out — we actually read this.
            </p>
          </div>
          <div className="space-y-6">
            <a
              className="glass-panel group flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-surface-container-high"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              <div className="flex size-12 items-center justify-center rounded-lg border border-outline-variant/30 bg-white/5">
                <span className="material-symbols-outlined text-primary">mail</span>
              </div>
              <div>
                <div className="mb-1 font-label text-sm text-on-surface-variant">
                  Email us
                </div>
                <div className="font-body text-on-surface">{CONTACT_EMAIL}</div>
              </div>
            </a>
            <a
              className="glass-panel group flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-surface-container-high"
              href="https://www.linkedin.com/in/sobhagyaverma/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
            >
              <div className="flex size-12 items-center justify-center rounded-lg border border-outline-variant/30 bg-[#0A66C2]/15">
                <span className="material-symbols-outlined text-[#0A66C2]">link</span>
              </div>
              <div>
                <div className="mb-1 font-label text-sm text-on-surface-variant">
                  Connect
                </div>
                <div className="font-body text-on-surface">LinkedIn</div>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-8 lg:col-span-7 lg:mt-0">
          <div className="glass-panel relative overflow-hidden rounded-xl p-6 md:p-8">
            <form className="relative z-10 space-y-6" onSubmit={onSend}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-label text-sm text-on-surface" htmlFor="name">
                    Your name <span className="text-error">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-high py-3 px-4 text-on-surface outline-none focus:border-primary/50"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label text-sm text-on-surface" htmlFor="email">
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-high py-3 px-4 text-on-surface outline-none focus:border-primary/50"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label text-sm text-on-surface" htmlFor="subject">
                  Subject
                </label>
                <input
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-high py-3 px-4 text-on-surface outline-none focus:border-primary/50"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Bug report, feedback..."
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-sm text-on-surface" htmlFor="message">
                  Message <span className="text-error">*</span>
                </label>
                <textarea
                  className={`w-full resize-y rounded-lg border bg-surface-container-high p-4 text-on-surface outline-none ${
                    messageError ? "border-error" : "border-outline-variant/30 focus:border-primary/50"
                  }`}
                  id="message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (messageError) setMessageError(false);
                  }}
                  placeholder="How can we help?..."
                  required
                  rows={6}
                />
                {messageError && (
                  <p className="font-label text-sm text-error">Please type a message first.</p>
                )}
              </div>
              {error && <p className="text-sm text-error">{error}</p>}
              {status && <p className="text-sm text-primary">{status}</p>}
              <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />
              <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 pt-4 sm:flex-row">
                <p className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Sent to the CodeIT inbox (rate limited).
                </p>
                <button
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 font-label text-sm font-bold text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-70 sm:w-auto"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Sending…" : "Send message"}
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="mt-auto flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant/10 bg-surface-container-lowest px-4 py-8 opacity-80 md:flex-row md:px-12">
        <div className="text-sm font-bold text-on-surface">CodeIT</div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link className="font-label text-sm text-on-surface-variant hover:text-secondary" to="/privacy">
            Privacy Policy
          </Link>
          <Link className="font-label text-sm text-on-surface-variant hover:text-secondary" to="/terms">
            Terms of Service
          </Link>
          <Link className="font-label text-sm text-on-surface-variant hover:text-secondary" to="/help">
            Help
          </Link>
        </div>
        <div className="font-body text-sm text-tertiary">
          © {new Date().getFullYear()} CodeIT. All systems operational.
        </div>
      </footer>
    </div>
  );
}
