import { useState } from "react";

export default function Contact() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  const handleSend = async () => {
    if (!message.trim()) {
      setStatus("Please type a message first.");
      return;
    }

    setSending(true);
    setStatus("");

    try {
      // Temporary frontend-only behavior
      // Replace this later with your real backend API call
      await new Promise((resolve) => setTimeout(resolve, 700));

      setStatus("Message sent successfully.");
      setMessage("");
    } catch (error) {
      setStatus("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-xl px-5">
      <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 shadow-sm">
        <h2 className="mb-4 text-center text-4xl font-bold text-[var(--text)]">
          Contact Us
        </h2>

        <p className="mb-4 text-center text-sm text-[var(--text-dim)]">
        Found a bug, have feedback, or want to suggest new problems?
          Reach out to us — we actually read this.
        </p>

        <div className="mb-5 space-y-2 text-center">
          <p className="text-sm text-[var(--text-dim)]">
            Email:{" "}
            <a
              href="mailto:yourmail@example.com"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              yourmail@example.com
            </a>
          </p>

          <p className="text-sm text-[var(--text-dim)]">
            Phone:{" "}
            <a
              href="tel:+919999999999"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              +91 99999 99999
            </a>
          </p>
        </div>

        <div className="border-t border-[var(--line)] pt-4">
          <h3 className="mb-2 text-center text-2xl font-bold text-[var(--text)]">
            Quick Message
          </h3>

          <p className="mb-4 text-center text-sm text-[var(--text-dim)]">
            Type your message here and send it instantly.
          </p>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Type your message here..."
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] p-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />

          <button
            onClick={handleSend}
            disabled={sending}
            className="mt-4 w-full rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[#0a0d12] transition hover:brightness-110 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send instantly"}
          </button>

          {status && (
            <p className="mt-3 text-center text-sm text-[var(--text-dim)]">
              {status}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}