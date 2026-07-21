import { useState } from "react";
import type { FormEvent } from "react";
import { Mail, MessageSquare, Phone, Send } from "lucide-react";

const CONTACT_EMAIL = "sobhagyaverma16@gmail.com";
const CONTACT_PHONE_DISPLAY = "+91 75002 51999";
const CONTACT_PHONE_TEL = "+917500251999";

const PARTICLES = [
  { size: 3, left: "10%", top: "20%", color: "rgba(245,166,35,0.7)", duration: "9s", delay: "0s", driftX: "12px", driftY: "-14px" },
  { size: 4, left: "78%", top: "28%", color: "rgba(91,168,255,0.6)", duration: "11s", delay: "1.2s", driftX: "-10px", driftY: "-16px" },
  { size: 2, left: "55%", top: "70%", color: "rgba(168,108,255,0.55)", duration: "10s", delay: "0.6s", driftX: "10px", driftY: "12px" },
  { size: 3, left: "88%", top: "62%", color: "rgba(245,166,35,0.55)", duration: "8s", delay: "2s", driftX: "-12px", driftY: "-10px" },
] as const;

export default function Contact() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleSend = (event: FormEvent) => {
    event.preventDefault();

    if (!message.trim()) {
      setStatus("Please type a message first.");
      return;
    }

    const mailSubject = subject.trim() || "CodeIT contact message";
    const bodyLines = [
      name.trim() ? `From: ${name.trim()}` : null,
      "",
      message.trim(),
      "",
      "— Sent via CodeIT Contact page",
    ].filter((line) => line !== null);

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailto;
    setStatus("Opening your email app to send the message…");
  };

  return (
    <div className="practice-shell min-h-[calc(100vh-3.5rem)]">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="hero-stage mb-8 overflow-hidden rounded-3xl border border-[var(--line)]/60 bg-[var(--bg-raised)]/30 px-6 py-10 text-center sm:px-10">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              aria-hidden
              className="hero-particle"
              style={{
                width: p.size,
                height: p.size,
                left: p.left,
                top: p.top,
                background: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                ["--duration" as string]: p.duration,
                ["--delay" as string]: p.delay,
                ["--drift-x" as string]: p.driftX,
                ["--drift-y" as string]: p.driftY,
              }}
            />
          ))}
          <div className="relative z-[1]">
            <p className="verdict-strip text-[var(--accent)]">/contact → reach out</p>
            <h1 className="display mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              Contact <span className="text-[var(--accent)]">Us</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-dim)] sm:text-base">
              Found a bug, have feedback, or want to suggest new problems? Reach
              out — we actually read this.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-3">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="practice-card flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 p-5 practice-glass hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]">
                <Mail className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-[var(--text-dim)]">
                  Email
                </p>
                <p className="mt-1 break-all text-sm font-medium text-[var(--accent)]">
                  {CONTACT_EMAIL}
                </p>
              </div>
            </a>

            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="practice-card flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 p-5 practice-glass hover:-translate-y-0.5 hover:border-[var(--info)]/40 hover:shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--info)]/30 bg-[var(--info)]/10 text-[var(--info)]">
                <Phone className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-dim)]">
                  Phone
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">
                  {CONTACT_PHONE_DISPLAY}
                </p>
              </div>
            </a>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/60 p-5 practice-glass">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <MessageSquare className="h-4 w-4" aria-hidden />
                <p className="verdict-strip">Quick tip</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
                Sending opens your email app with the message pre-filled to{" "}
                {CONTACT_EMAIL}. Hit send from there and it lands in the inbox.
              </p>
            </div>
          </aside>

          <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80 p-5 practice-glass sm:p-6">
            <h2 className="display text-xl font-semibold">Quick message</h2>
            <p className="mt-1 text-sm text-[var(--text-dim)]">
              Fill this in and we&apos;ll open a ready-to-send email for you.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleSend}>
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]"
                >
                  Your name (optional)
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]"
                >
                  Subject (optional)
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Bug report, feedback, feature idea…"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  placeholder="Type your message here…"
                  className="w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[#0a0d12] shadow-[0_8px_24px_rgba(245,166,35,0.22)] transition hover:-translate-y-0.5 hover:brightness-110"
              >
                <Send className="h-4 w-4" aria-hidden />
                Send message
              </button>

              {status && (
                <p className="text-center text-sm text-[var(--text-dim)]">
                  {status}
                </p>
              )}
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
