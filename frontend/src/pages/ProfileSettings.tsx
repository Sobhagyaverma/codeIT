import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/toast/ToastProvider";
import { ErrorState } from "../components/Loading";
import {
  loadProfileMeta,
  saveProfileMeta,
  type LocalProfileMeta,
} from "../features/profile/localProfileStorage";
import { initialsFromName } from "../features/profile/format";

export default function ProfileSettings() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState<LocalProfileMeta>({
    bio: "",
    location: "",
    avatarUrl: "",
    showEmail: false,
  });

  useEffect(() => {
    if (!user) return;
    setForm(loadProfileMeta(user.id));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <ErrorState message="Log in to edit your profile." />
      </div>
    );
  }

  const initials = initialsFromName(user.name);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileMeta(user.id, {
      bio: form.bio.trim(),
      location: form.location.trim(),
      avatarUrl: form.avatarUrl.trim(),
      showEmail: form.showEmail,
    });
    pushToast("Profile settings saved locally.", "success");
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
            Stored in your browser until backend profile APIs are ready.
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
          className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0a0d12] hover:brightness-110"
        >
          Save changes
        </button>
      </form>

      <section className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 opacity-80">
        <h2 className="text-sm font-semibold">Change password</h2>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          Password changes require a backend endpoint. This UI is reserved and
          currently disabled.
        </p>
        <button
          type="button"
          disabled
          className="mt-3 rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)]"
        >
          Coming soon
        </button>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
      />
    </div>
  );
}
