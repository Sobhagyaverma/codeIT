import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";

const CONTACT_EMAIL = "sobhagyaverma16@gmail.com";

export default function Contact() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);

  const onSend = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setMessageError(true);
      return;
    }
    setMessageError(false);
    let body = message.trim();
    if (name.trim()) body += `\n\nFrom: ${name.trim()}`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject.trim() || "CodeIT Contact Form"
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
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
              <div className="flex size-12 items-center justify-center rounded-lg border border-outline-variant/30 bg-white/5 transition-colors group-hover:border-[#EA4335]/40">
                <svg
                  viewBox="52 42 88 66"
                  className="size-6"
                  aria-hidden
                >
                  <path
                    fill="#4285F4"
                    d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6"
                  />
                  <path
                    fill="#34A853"
                    d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15"
                  />
                  <path
                    fill="#FBBC04"
                    d="M120 51v23l20-15v-8c0-7.42-8.47-11.65-14.4-7.2"
                  />
                  <path
                    fill="#EA4335"
                    d="M72 74V51l24 18 24-18v23L96 92"
                  />
                  <path
                    fill="#C5221F"
                    d="M52 51v8l20 15V51l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"
                  />
                </svg>
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
              <div className="flex size-12 items-center justify-center rounded-lg border border-outline-variant/30 bg-[#0A66C2]/15 transition-colors group-hover:border-[#0A66C2]/50">
                <svg
                  viewBox="0 0 24 24"
                  className="size-6 fill-[#0A66C2]"
                  aria-hidden
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
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
            <div className="pointer-events-none absolute -right-24 -top-24 size-48 rounded-full bg-primary/10 blur-3xl" />
            <form className="relative z-10 space-y-6" onSubmit={onSend}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-label text-sm text-on-surface" htmlFor="name">
                    Your name{" "}
                    <span className="font-normal text-on-surface-variant/50">
                      (optional)
                    </span>
                  </label>
                  <div className="relative rounded-lg border border-outline-variant/30 bg-surface-container-high transition-all focus-within:border-primary/50">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="material-symbols-outlined text-on-surface-variant">
                        person
                      </span>
                    </div>
                    <input
                      className="w-full rounded-lg border-none bg-transparent py-3 pl-10 text-on-surface outline-none"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      type="text"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    className="font-label text-sm text-on-surface"
                    htmlFor="subject"
                  >
                    Subject{" "}
                    <span className="font-normal text-on-surface-variant/50">
                      (optional)
                    </span>
                  </label>
                  <div className="relative rounded-lg border border-outline-variant/30 bg-surface-container-high transition-all focus-within:border-primary/50">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="material-symbols-outlined text-on-surface-variant">
                        subject
                      </span>
                    </div>
                    <input
                      className="w-full rounded-lg border-none bg-transparent py-3 pl-10 text-on-surface outline-none"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Bug report, feedback..."
                      type="text"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="font-label text-sm text-on-surface"
                  htmlFor="message"
                >
                  Message <span className="text-error">*</span>
                </label>
                <div
                  className={`relative rounded-lg border bg-surface-container-high transition-all ${
                    messageError
                      ? "border-error"
                      : "border-outline-variant/30 focus-within:border-primary/50"
                  }`}
                >
                  <textarea
                    className="w-full resize-y rounded-lg border-none bg-transparent p-4 text-on-surface outline-none"
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
                </div>
                {messageError && (
                  <p className="font-label text-sm text-error">
                    Please type a message first.
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 pt-4 sm:flex-row">
                <p className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">
                    info
                  </span>
                  Opens your default email client.
                </p>
                <button
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 font-label text-sm font-bold text-on-primary transition-colors hover:bg-primary-fixed sm:w-auto"
                  type="submit"
                >
                  Send message
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                    send
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="mt-auto flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant/10 bg-surface-container-lowest px-4 py-8 opacity-80 transition-opacity hover:opacity-100 md:flex-row md:px-12">
        <div className="text-sm font-bold text-on-surface">CodeIT</div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link
            className="font-label text-sm text-on-surface-variant transition-colors hover:text-secondary"
            to="/privacy"
          >
            Privacy Policy
          </Link>
          <Link
            className="font-label text-sm text-on-surface-variant transition-colors hover:text-secondary"
            to="/terms"
          >
            Terms of Service
          </Link>
          <Link
            className="font-label text-sm text-on-surface-variant transition-colors hover:text-secondary"
            to="/help"
          >
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
