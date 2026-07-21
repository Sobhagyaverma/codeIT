import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loading, ErrorState, EmptyState } from "../components/Loading";
import { loadOwnerProfile } from "../features/profile/loadProfile";
import type { ProfileViewModel } from "../features/profile/types";
import ProfileDashboard from "../features/profile/components/ProfileDashboard";

export default function ProfilePage() {
  const { user } = useAuth();
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPublicRoute = Boolean(username);
  const isSelfPublic =
    !!user &&
    !!username &&
    user.uniqueUserId.toLowerCase() === username.toLowerCase();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user) {
        setLoading(false);
        return;
      }

      if (isPublicRoute && !isSelfPublic) {
        setProfile(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await loadOwnerProfile(user);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load profile."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user, isPublicRoute, isSelfPublic]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <ErrorState message="Log in to view your profile." />
        <Link to="/login" className="mt-4 inline-block text-[var(--info)]">
          Go to login
        </Link>
      </div>
    );
  }

  if (isPublicRoute && !isSelfPublic) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <EmptyState
          message={`Public profile for @${username} is not available yet.`}
        />
        <p className="mt-3 text-center text-sm text-[var(--text-dim)]">
          Backend public profile APIs are pending. Your own profile is ready at{" "}
          <Link to="/profile" className="text-[var(--info)] hover:underline">
            /profile
          </Link>
          .
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Loading label="Loading profile" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <ErrorState message={error || "Profile unavailable."} />
      </div>
    );
  }

  return <ProfileDashboard profile={profile} />;
}
