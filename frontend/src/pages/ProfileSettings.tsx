import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/toast/ToastProvider";
import { ErrorState, Loading } from "../components/Loading";
import {
  ApiError,
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
} from "../lib/api";
import { initialsFromName } from "../features/profile/format";

type ProfileForm = {
  bio: string;
  location: string;
  avatarUrl: string;
  showEmail: boolean;
};

export default function ProfileSettings() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState<ProfileForm>({
    bio: "",
    location: "",
    avatarUrl: "",
    showEmail: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        setForm({
          bio: profile.identity.bio || "",
          location: profile.identity.location || "",
          avatarUrl: profile.identity.avatarUrl || "",
          showEmail: Boolean(profile.identity.showEmail),
        });
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load profile."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <ErrorState message="Log in to edit your profile." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Loading label="Loading settings" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <ErrorState message={loadError} />
      </div>
    );
  }

  const initials = initialsFromName(user.name);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        showEmail: form.showEmail,
      });
      pushToast("Profile updated.", "success");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Failed to update profile.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      pushToast("New password must be at least 6 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      pushToast("New password and confirmation do not match.", "error");
      return;
    }

    setChangingPassword(true);
    try {
      await changeMyPassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      pushToast("Password updated.", "success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        pushToast(
          err.message || "Current password is incorrect.",
          "error"
        );
      } else {
        pushToast(
          err instanceof Error ? err.message : "Failed to change password.",
          "error"
        );
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="verdict-strip text-[var(--text-dim)]">
            /settings → profile
          </p>
          <h1 className="display mt-2 text-2xl font-semibold">
            Profile settings
          </h1>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            Update how you appear on CodeIT.
          </p>
        </div>
        <Link to="/profile" className="text-sm text-[var(--info)] hover:underline">
          View profile
        </Link>
      </div>

      <form
        onSubmit={onSave}
        className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 sm:p-6"
      >
        <div className="flex items-center gap-4">
          {form.avatarUrl ? (
            <img
              src={form.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--accent)] text-xl font-bold text-[#0a0d12]">
              {initials}
            </div>
          )}
          <div className="text-sm text-[var(--text-dim)]">
            <div className="font-medium text-[var(--text)]">{user.name}</div>
            <div>@{user.uniqueUserId}</div>
          </div>
        </div>

        <Field
          label="Avatar URL"
          value={form.avatarUrl}
          onChange={(v) => setForm((p) => ({ ...p, avatarUrl: v }))}
          placeholder="https://..."
        />
        <Field
          label="Location"
          value={form.location}
          onChange={(v) => setForm((p) => ({ ...p, location: v }))}
          placeholder="City, Country"
        />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            rows={4}
            maxLength={280}
            className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
            placeholder="What are you practicing?"
          />
          <p className="mt-1 text-[11px] text-[var(--text-dim)]">
            {form.bio.length}/280
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
          <input
            type="checkbox"
            checked={form.showEmail}
            onChange={(e) =>
              setForm((p) => ({ ...p, showEmail: e.target.checked }))
            }
          />
          Show email on my profile
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0a0d12] hover:brightness-110 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <form
        onSubmit={onChangePassword}
        className="mt-5 space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5"
      >
        <h2 className="text-sm font-semibold">Change password</h2>
        <Field
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          type="password"
          autoComplete="current-password"
        />
        <Field
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
        />
        <Field
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          type="password"
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={changingPassword}
          className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:border-[var(--info)] disabled:opacity-50"
        >
          {changingPassword ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
      />
    </div>
  );
}
