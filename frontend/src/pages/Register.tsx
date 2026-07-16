import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../lib/api";
import { ErrorState } from "../components/Loading";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ ...form, role: "USER" });
      setDone(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="display mb-1 text-2xl font-semibold">Create account</h1>
      <p className="mb-8 text-sm text-[var(--text-dim)]">Join CodeIT</p>

      {done ? (
        <div className="rounded-lg border border-[var(--ok)]/40 bg-[var(--ok)]/5 p-4 text-sm text-[var(--ok)]">
          Account created. Redirecting to login...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-[var(--text-dim)]">Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-dim)]">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-dim)]">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
            />
          </div>

          {error && <ErrorState message={error} />}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--accent)] py-2.5 text-sm font-medium text-[#0a0d12] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--text-dim)]">
        Already have an account?{" "}
        <Link to="/login" className="text-[var(--info)]">Log in</Link>
      </p>
    </div>
  );
}
