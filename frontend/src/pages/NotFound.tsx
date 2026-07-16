import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <div className="verdict-strip mb-3" style={{ color: "var(--err)" }}>404 / Not Found</div>
      <p className="text-sm text-[var(--text-dim)]">
        This route doesn't exist — like submitting to a problem that was never created.
      </p>
      <Link to="/" className="mt-4 inline-block text-sm text-[var(--info)]">← Back home</Link>
    </div>
  );
}
