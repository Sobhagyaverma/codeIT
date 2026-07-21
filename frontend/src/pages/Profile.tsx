import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loading, ErrorState } from "../components/Loading";
import {
  loadOwnerProfile,
  loadPublicProfile,
} from "../features/profile/loadProfile";
import type { ProfileViewModel } from "../features/profile/types";
import ProfileDashboard from "../features/profile/components/ProfileDashboard";

export default function ProfilePage() {
  const { user } = useAuth();
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPublicRoute = Boolean(username);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isPublicRoute && !user) {
        setProfile(null);
        setLoading(false);
        setError(null);
        return;
      }

      if (isPublicRoute && !username) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let data: ProfileViewModel;
        if (isPublicRoute && username) {
          data = await loadPublicProfile(username);
          const owns =
            !!user &&
            user.uniqueUserId.toLowerCase() === username.toLowerCase();
          data = { ...data, isOwner: owns };
        } else {
          data = await loadOwnerProfile();
        }
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load profile."
          );
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user, isPublicRoute, username]);

  if (!isPublicRoute && !user) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <ErrorState message="Log in to view your profile." />
        <Link to="/login" className="mt-4 inline-block text-[var(--info)]">
          Go to login
        </Link>
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
