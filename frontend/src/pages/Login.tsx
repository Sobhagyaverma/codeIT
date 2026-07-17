import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ErrorState } from "../components/Loading";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const auth = await login(identifier, password);

      setUser({
        id: auth.userId,
        name: auth.name,
        uniqueUserId: auth.uniqueUserId,
        email: auth.email,
        role: auth.role as "USER" | "ADMIN",
        token: auth.token,
      });

      localStorage.setItem("token", auth.token);

      navigate("/problems");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="display mb-1 text-2xl font-semibold">
        Log in
      </h1>

      <p className="mb-8 text-sm text-[var(--text-dim)]">
        Continue to CodeIT
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-[var(--text-dim)]">
            Email or unique user ID
          </label>

          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--text-dim)]">
            Password
          </label>

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
          />
        </div>

        {error && <ErrorState message={error} />}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[var(--accent)] py-2.5 text-sm font-medium text-[#0a0d12] transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-dim)]">
        No account?{" "}
        <Link to="/register" className="text-[var(--info)]">
          Sign up
        </Link>
      </p>
    </div>
  );
}
