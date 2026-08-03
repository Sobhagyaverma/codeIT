import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import AppNav from "../components/AppNav";
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
  type ProfileResponse,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function ProfileSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showEmail, setShowEmail] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void getMyProfile()
      .then((p) => {
        setProfile(p);
        setBio(p.identity.bio ?? "");
        setLocation(p.identity.location ?? "");
        setAvatarUrl(p.identity.avatarUrl ?? "");
        setShowEmail(p.identity.showEmail ?? true);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load profile")
      );
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const identity = profile?.identity;
  const username = identity?.username ?? user.uniqueUserId;
  const email = identity?.email ?? user.email;
  const displayName = identity?.name ?? user.name;

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateMyProfile({
        bio: bio.trim() || null,
        location: location.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        showEmail,
      });
      const refreshed = await getMyProfile();
      setProfile(refreshed);
      setMessage("Profile saved.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdSaving(true);
    setMessage(null);
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setPwdSaving(false);
      return;
    }
    try {
      await changeMyPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-on-surface">
      <AppNav />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-[5%] -right-[5%] h-[30%] w-[30%] rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 py-10 pt-28 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <nav className="mb-2 flex items-center gap-2 font-label text-xs uppercase tracking-widest text-on-surface-variant">
              <Link className="transition-colors hover:text-primary" to="/profile">
                Profile
              </Link>
              <span className="material-symbols-outlined text-[10px]">
                chevron_right
              </span>
              <span className="text-primary">Settings</span>
            </nav>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-white">
              Account Settings
            </h1>
            <p className="mt-2 font-body text-on-surface-variant">
              Manage your identity, security preferences, and public presence.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/profile"
              className="rounded-xl border border-outline-variant/30 px-6 py-2.5 font-label text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-high"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="profile-settings-form"
              disabled={saving}
              className="glow-primary rounded-xl bg-gradient-to-br from-primary to-primary-container px-8 py-2.5 font-label text-sm font-bold text-on-primary-fixed transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {(message || error) && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-error/40 bg-error/10 text-error"
                : "border-secondary/40 bg-secondary/10 text-secondary"
            }`}
          >
            {error ?? message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <form
              id="profile-settings-form"
              onSubmit={(e) => void onSaveProfile(e)}
              className="glass-panel space-y-8 rounded-xl p-8"
            >
              <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                <span className="material-symbols-outlined text-primary">
                  person
                </span>
                <h2 className="font-headline text-xl font-bold text-white">
                  Personal Information
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Display Name
                  </label>
                  <input
                    className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20"
                    type="text"
                    value={displayName}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                      @
                    </span>
                    <input
                      className="w-full rounded-xl border-none bg-surface-container-highest py-3 pl-8 pr-4 text-on-surface outline-none ring-1 ring-outline-variant/20"
                      type="text"
                      value={username}
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="ml-1 font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Email Address
                  </label>
                  <input
                    className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20"
                    type="email"
                    value={email ?? ""}
                    disabled
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="ml-1 font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Bio
                  </label>
                  <textarea
                    className="w-full resize-none rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 transition-all focus:ring-2 focus:ring-primary"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about yourself..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Location
                  </label>
                  <input
                    className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 transition-all focus:ring-2 focus:ring-primary"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Avatar URL
                  </label>
                  <input
                    className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 transition-all focus:ring-2 focus:ring-primary"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <label className="flex items-center gap-3 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={showEmail}
                    onChange={(e) => setShowEmail(e.target.checked)}
                    className="size-4 rounded border-outline-variant bg-surface-container-highest text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-on-surface-variant">
                    Show email on public profile
                  </span>
                </label>
              </div>
            </form>

            <form
              onSubmit={(e) => void onChangePassword(e)}
              className="glass-panel space-y-8 rounded-xl p-8"
            >
              <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                <span className="material-symbols-outlined text-primary">
                  lock
                </span>
                <h2 className="font-headline text-xl font-bold text-white">
                  Security
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="ml-1 font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Current Password
                  </label>
                  <input
                    className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 transition-all focus:ring-2 focus:ring-primary"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="ml-1 font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      New Password
                    </label>
                    <input
                      className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 transition-all focus:ring-2 focus:ring-primary"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Confirm New Password
                    </label>
                    <input
                      className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 transition-all focus:ring-2 focus:ring-primary"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={pwdSaving}
                  className="w-fit rounded-xl border border-outline-variant/30 px-6 py-2.5 font-label text-sm font-bold text-on-surface transition-all hover:bg-surface-container-high disabled:opacity-60"
                >
                  {pwdSaving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-8 lg:col-span-4">
            <div className="glass-panel flex flex-col items-center rounded-xl p-8 text-center">
              <div className="group relative mb-6">
                <div className="absolute inset-0 scale-110 rounded-full bg-primary/20 blur-xl transition-all group-hover:bg-primary/40" />
                <img
                  alt="Avatar"
                  className="relative size-32 rounded-full border-4 border-surface-container-highest object-cover shadow-2xl"
                  src={
                    avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || "U")}&background=4f378a&color=fff`
                  }
                />
                <div className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border-2 border-surface-container-low bg-primary text-on-primary-fixed shadow-lg">
                  <span className="material-symbols-outlined text-sm">
                    photo_camera
                  </span>
                </div>
              </div>
              <h3 className="mb-1 font-headline text-xl font-bold text-white">
                {username}
              </h3>
              <p className="mb-6 font-label text-sm text-primary">
                {identity?.role === "ADMIN" || user.role === "ADMIN"
                  ? "Admin"
                  : "Member"}
              </p>
              <p className="text-left text-xs text-on-surface-variant">
                Paste an image URL above and save to update your avatar.
              </p>
            </div>

            <div className="glass-panel space-y-6 rounded-xl p-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error">
                  warning
                </span>
                <h2 className="font-headline text-lg font-bold text-white">
                  Danger Zone
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Account deletion is not available from this screen yet. Contact
                support if you need help.
              </p>
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-error/20 bg-error/10 py-3 font-label text-sm font-bold text-error opacity-60"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
