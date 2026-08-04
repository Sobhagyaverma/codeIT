import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  createQuickContest,
  getQuickClashHistory,
  joinQuickContest,
} from "../lib/api";

const DURATIONS = [15, 30, 45, 60, 90, 120];
const NAME_MAX = 60;

type Tier = "EASY" | "MEDIUM" | "HARD";

const TIERS: Array<{
  key: Tier;
  label: string;
  blurb: string;
  icon: string;
  accent: string;
  count: number;
  short: string;
}> = [
  {
    key: "EASY",
    label: "Easy",
    blurb: "3 Easy Problems",
    icon: "signal_cellular_alt_1_bar",
    accent: "text-tertiary-container",
    count: 3,
    short: "3E",
  },
  {
    key: "MEDIUM",
    label: "Medium",
    blurb: "1 Easy, 2 Medium",
    icon: "signal_cellular_alt_2_bar",
    accent: "text-primary",
    count: 3,
    short: "1E, 2M",
  },
  {
    key: "HARD",
    label: "Hard",
    blurb: "2 Medium, 2 Hard",
    icon: "signal_cellular_alt",
    accent: "text-error",
    count: 4,
    short: "2M, 2H",
  },
];

export default function QuickContestCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState("Midnight Sprint");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<Tier>("MEDIUM");
  const [duration, setDuration] = useState(45);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState<Array<Record<string, unknown>>>([]);
  const [rejoiningId, setRejoiningId] = useState<number | null>(null);

  const activeTier = useMemo(
    () => TIERS.find((t) => t.key === tier) ?? TIERS[1],
    [tier]
  );

  useEffect(() => {
    if (!user) return;
    void getQuickClashHistory()
      .then((data) => setActive(data.active || []))
      .catch(() => setActive([]));
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const enterActive = async (row: Record<string, unknown>) => {
    const contestId = Number(row.id);
    if (!Number.isFinite(contestId)) return;
    const status = String(row.status || "");
    const myStatus = String(row.my_status || "");
    setRejoiningId(contestId);
    setError("");
    try {
      if (myStatus === "LEFT" || myStatus === "INVITED") {
        const c = await joinQuickContest(contestId);
        if (c.status === "LIVE" || status === "LIVE") {
          navigate(`/competitions/quick/${contestId}/live`);
          return;
        }
        navigate(`/competitions/quick/${contestId}`);
        return;
      }
      if (status === "LIVE") {
        navigate(`/competitions/quick/${contestId}/live`);
      } else {
        navigate(`/competitions/quick/${contestId}`);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not join that contest."
      );
    } finally {
      setRejoiningId(null);
    }
  };

  const onCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const contest = await createQuickContest({
        name: name.trim() || "Quick Clash",
        description: description.trim(),
        difficultyTier: tier,
        durationMinutes: duration,
        maxPlayers,
      });
      const invite = params.get("invite");
      const qs = invite ? `?invite=${encodeURIComponent(invite)}` : "";
      navigate(`/competitions/quick/${contest.id}${qs}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create contest.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="problem-workspace quick-contest relative min-h-screen overflow-x-hidden text-on-surface">
      <div className="pw-ambient" aria-hidden />
      <AppNav activeHint="/competitions/quick" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-margin-mobile pb-20 pt-24 md:px-margin-desktop md:pt-28">
        <header className="mb-10 flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-label-md text-[11px] tracking-widest text-primary uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Private · Unrated
          </span>
          <h1 className="font-headline-xl text-headline-lg-mobile text-primary md:text-headline-xl [text-shadow:0_0_24px_rgba(221,183,255,0.25)]">
            Quick Clash
          </h1>
          <p className="max-w-xl font-body-lg text-body-md text-on-surface-variant md:text-body-lg">
            Configure a rapid, low-stakes coding sprint. Invite friends, race the
            clock, keep your rating untouched.
          </p>
        </header>

        {active.length > 0 && (
          <section className="mb-8 overflow-hidden rounded-xl border border-primary/25 bg-primary/5">
            <div className="flex items-center justify-between border-b border-primary/15 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  login
                </span>
                <h2 className="font-label-md text-label-md font-bold text-on-surface">
                  Join current Quick Clash
                </h2>
              </div>
              <span className="font-code-sm text-[11px] text-on-surface-variant">
                left by mistake? rejoin here
              </span>
            </div>
            <ul className="divide-y divide-outline-variant/10">
              {active.map((row) => {
                const contestId = Number(row.id);
                const status = String(row.status || "");
                const myStatus = String(row.my_status || "");
                const label =
                  myStatus === "LEFT"
                    ? status === "LIVE"
                      ? "Rejoin live"
                      : "Rejoin lobby"
                    : status === "LIVE"
                      ? "Enter live"
                      : myStatus === "INVITED"
                        ? "Join lobby"
                        : "Open lobby";
                return (
                  <li
                    key={String(row.id)}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-label-md text-sm font-semibold text-on-surface">
                        {String(row.name || "Quick Contest")}
                      </p>
                      <p className="font-code-sm text-[11px] text-on-surface-variant">
                        {status}
                        {myStatus === "LEFT" ? " · you left" : ""}
                        {" · "}
                        {String(row.difficulty_tier || "")} ·{" "}
                        {String(row.duration_minutes || "")} min
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={rejoiningId === contestId}
                      onClick={() => void enterActive(row)}
                      className="picker rounded-lg bg-primary px-4 py-2 font-label-md text-[13px] text-on-primary disabled:opacity-60"
                    >
                      {rejoiningId === contestId ? "Joining…" : label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <section className="glass-panel flex flex-col gap-6 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">
                  edit_note
                </span>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  General Details
                </h2>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <label
                    className="font-label-md text-label-md text-on-surface-variant"
                    htmlFor="contest-name"
                  >
                    Contest Name
                  </label>
                  <span className="font-code-sm text-code-sm text-outline">
                    {name.length}/{NAME_MAX}
                  </span>
                </div>
                <input
                  id="contest-name"
                  type="text"
                  maxLength={NAME_MAX}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Midnight Sprint #42"
                  className="input-glow w-full rounded-lg border border-outline-variant bg-surface-container px-4 py-3 font-body-md text-on-surface transition-all duration-200 placeholder:text-outline focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className="font-label-md text-label-md text-on-surface-variant"
                  htmlFor="contest-desc"
                >
                  Optional Description
                </label>
                <textarea
                  id="contest-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief details about this sprint..."
                  className="input-glow w-full resize-none rounded-lg border border-outline-variant bg-surface-container px-4 py-3 font-body-md text-on-surface transition-all duration-200 placeholder:text-outline focus:outline-none"
                />
              </div>
            </section>

            <section className="glass-panel flex flex-col gap-6 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">
                  bolt
                </span>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  Difficulty Tier
                </h2>
              </div>

              <div
                role="radiogroup"
                aria-label="Difficulty tier"
                className="grid grid-cols-1 gap-4 md:grid-cols-3"
              >
                {TIERS.map((t) => {
                  const selected = tier === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setTier(t.key)}
                      className={`picker relative flex flex-col gap-2 rounded-lg border bg-surface-container p-4 text-left ${
                        selected
                          ? "active-glow border-primary"
                          : "border-outline-variant hover:border-primary/40 hover:bg-surface-container-high"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className={`font-label-md text-label-md ${t.accent}`}
                        >
                          {t.label}
                        </span>
                        <span
                          className={`material-symbols-outlined ${
                            selected ? "text-primary" : "text-outline-variant"
                          }`}
                        >
                          {t.icon}
                        </span>
                      </div>
                      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                        {t.blurb}
                      </p>
                      {selected && (
                        <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="glass-panel flex flex-col gap-6 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">
                  tune
                </span>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  Parameters
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <label className="font-label-md text-label-md text-on-surface-variant">
                    Duration (Mins)
                  </label>
                  <div
                    role="radiogroup"
                    aria-label="Duration in minutes"
                    className="grid grid-cols-3 gap-2"
                  >
                    {DURATIONS.map((d) => {
                      const selected = duration === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setDuration(d)}
                          className={`picker rounded-md border bg-surface-container py-2 text-center font-label-md text-label-md ${
                            selected
                              ? "active-glow border-primary text-primary"
                              : "border-outline-variant text-on-surface-variant hover:border-primary/40 hover:bg-surface-container-high"
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <label className="font-label-md text-label-md text-on-surface-variant">
                    Max Participants
                  </label>
                  <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container p-2">
                    <button
                      type="button"
                      aria-label="Decrease max participants"
                      disabled={maxPlayers <= 2}
                      onClick={() => setMaxPlayers((n) => Math.max(2, n - 1))}
                      className="picker flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-high text-on-surface hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <span className="w-16 text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                      {maxPlayers}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase max participants"
                      disabled={maxPlayers >= 10}
                      onClick={() => setMaxPlayers((n) => Math.min(10, n + 1))}
                      className="picker flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-high text-on-surface hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                  <p className="-mt-2 text-center font-code-sm text-code-sm text-outline">
                    Range: 2 - 10
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="glass-panel sticky top-24 flex h-fit flex-col gap-6 rounded-xl p-6">
            <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
              <span className="material-symbols-outlined text-primary">
                data_object
              </span>
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Contest Summary
              </h3>
            </div>

            <dl className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <dt className="font-body-md text-body-md text-on-surface-variant">
                  Difficulty
                </dt>
                <dd className="rounded bg-primary/10 px-2 py-1 font-label-md text-label-md text-primary">
                  {activeTier.label}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-body-md text-body-md text-on-surface-variant">
                  Duration
                </dt>
                <dd className="font-body-md text-body-md text-on-surface">
                  {duration} Mins
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-body-md text-body-md text-on-surface-variant">
                  Problems
                </dt>
                <dd className="font-body-md text-body-md text-on-surface">
                  {activeTier.count} ({activeTier.short})
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-body-md text-body-md text-on-surface-variant">
                  Max Players
                </dt>
                <dd className="font-body-md text-body-md text-on-surface">
                  {maxPlayers}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-3 border-t border-outline-variant/30 pt-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-outline">
                  smart_toy
                </span>
                <span className="font-label-md text-label-md text-outline">
                  AI Coach: Disabled
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-outline">
                  trending_flat
                </span>
                <span className="font-label-md text-label-md text-outline">
                  Rating: Not Affected
                </span>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 font-body-md text-sm text-error"
              >
                {error}
              </p>
            )}

            <div className="mt-auto flex flex-col gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => void onCreate()}
                className="btn-glow flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-label-md text-label-md text-on-primary shadow-[0_0_24px_rgba(168,85,247,0.4)] transition-all hover:shadow-[0_0_36px_rgba(168,85,247,0.55)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && (
                  <span className="material-symbols-outlined animate-spin-fast text-lg">
                    progress_activity
                  </span>
                )}
                {loading ? "Creating…" : "Create Lobby"}
              </button>
              <Link
                to="/competitions"
                className="w-full rounded-lg border border-outline-variant py-3 text-center font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
              >
                Cancel
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
