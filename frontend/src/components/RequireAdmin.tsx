import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyProfile } from "../lib/api";

/**
 * UX gate for /admin. Also re-checks role via GET /api/profile/me so a spoofed
 * localStorage role cannot keep the admin shell open. Backend still enforces
 * hasRole("ADMIN") on mutating admin APIs.
 */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [state, setState] = useState<"loading" | "ok" | "deny">(() => {
    if (!user) return "deny";
    if (user.role !== "ADMIN") return "deny";
    return "loading";
  });

  useEffect(() => {
    if (!user) {
      setState("deny");
      return;
    }
    if (user.role !== "ADMIN") {
      setState("deny");
      return;
    }

    let cancelled = false;
    setState("loading");

    void getMyProfile()
      .then((profile) => {
        if (cancelled) return;
        if (profile.identity?.role !== "ADMIN") {
          logout();
          setState("deny");
          return;
        }
        setState("ok");
      })
      .catch(() => {
        if (cancelled) return;
        setState("deny");
      });

    return () => {
      cancelled = true;
    };
  }, [user, logout]);

  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }
  if (state === "deny") {
    return <Navigate to="/" replace />;
  }
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface-variant">
        Verifying admin access…
      </div>
    );
  }

  return <>{children}</>;
}
