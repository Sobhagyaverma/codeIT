import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../context/AuthContext";
import {
  cancelQuickContest,
  describeApiError,
  getFriends,
  getQuickContest,
  inviteToQuickContest,
  joinQuickContest,
  leaveQuickContest,
  readyQuickContest,
  startQuickContest,
  type QuickContest,
} from "../lib/api";

function difficultyTone(d?: string) {
  const x = (d || "").toUpperCase();
  if (x === "EASY") return "border-easy/30 bg-easy/10 text-easy";
  if (x === "MEDIUM")
    return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  if (x === "HARD") return "border-hard/30 bg-hard/10 text-hard";
  return "border-outline-variant/30 bg-surface-container text-on-surface-variant";
}

function statusTone(status: string, ready?: boolean) {
  if (status === "JOINED" && ready)
    return "border-easy/30 bg-easy/10 text-easy";
  if (status === "JOINED")
    return "border-primary/30 bg-primary/10 text-primary";
  if (status === "INVITED")
    return "border-outline-variant/40 text-on-surface-variant";
  if (status === "LEFT") return "border-error/30 bg-error/10 text-error";
  return "border-outline-variant/30 text-on-surface-variant";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

export default function QuickContestLobby() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [contest, setContest] = useState<QuickContest | null>(null);
  const [friends, setFriends] = useState<
    Array<{ user_id: number; name: string; unique_user_id: string }>
  >([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    const data = await getQuickContest(id);
    setContest(data);
    if (data.status === "LIVE") {
      navigate(`/competitions/quick/${id}/live`, { replace: true });
    }
    if (data.status === "CANCELLED" || data.status === "ENDED") {
      /* stay — show ended/cancelled state */
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    void reload().catch((err) =>
      setError(describeApiError(err, "Failed to load lobby"))
    );
    void getFriends()
      .then((f) =>
        setFriends(
          (f.friends || []).map((x) => ({
            user_id: x.user_id,
            name: x.name,
            unique_user_id: x.unique_user_id,
          }))
        )
      )
      .catch(() => undefined);

    const poll = window.setInterval(() => {
      void reload().catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(poll);
  }, [user, id, reload]);

  useEffect(() => {
    const invite = params.get("invite");
    if (!invite || !contest || !user) return;
    const uid = Number(invite);
    if (!Number.isFinite(uid) || uid === Number(user.id)) return;
    setSelected((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
  }, [params, contest, user]);

  const hostId = contest ? Number(contest.host_user_id) : 0;
  const meId = user ? Number(user.id) : 0;
  const isHost = hostId === meId;
  const myRow = useMemo(
    () =>
      (contest?.participants || []).find((p) => Number(p.user_id) === meId),
    [contest?.participants, meId]
  );
  const myStatus = String(myRow?.status || "");
  const joinedCount = contest?.joinedCount ?? 0;
  const readyCount = useMemo(
    () =>
      (contest?.participants || []).filter(
        (p) => p.status === "JOINED" && p.ready
      ).length,
    [contest?.participants]
  );
  const canStart =
    isHost &&
    contest?.status === "LOBBY" &&
    joinedCount >= 2 &&
    readyCount >= 2;

  const invitedFriendIds = useMemo(() => {
    const set = new Set<number>();
    for (const p of contest?.participants || []) {
      set.add(Number(p.user_id));
    }
    return set;
  }, [contest?.participants]);

  const inviteableFriends = friends.filter(
    (f) => !invitedFriendIds.has(f.user_id)
  );

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (err) {
      setError(describeApiError(err, "Something went wrong."));
    } finally {
      setBusy(null);
    }
  };

  const onInvite = () =>
    void run("invite", async () => {
      if (!contest || selected.length === 0) return;
      await inviteToQuickContest(contest.id, selected);
      setMessage(`Invited ${selected.length} friend(s).`);
      setSelected([]);
      await reload();
    });

  const copyLobbyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link.");
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  if (!contest) {
    return (
      <div className="relative min-h-screen bg-surface text-on-surface">
        <AppNav activeHint="/competitions/quick" />
        <div className="flex min-h-[60vh] items-center justify-center pt-24">
          <p className="font-body-md text-on-surface-variant">
            {error || "Loading lobby…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="problem-workspace relative min-h-screen overflow-x-hidden text-on-surface">
      <div className="pw-ambient" aria-hidden />
      <AppNav activeHint="/competitions/quick" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-margin-mobile pb-24 pt-24 md:px-margin-desktop md:pt-28">
        {/* Header */}
        <header className="pw-contest-header mb-8 flex flex-wrap items-end justify-between gap-4 px-5 py-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Link
                to="/competitions/quick"
                className="inline-flex items-center gap-1 font-label-md text-[12px] text-on-surface-variant transition-colors hover:text-primary"
              >
                <span className="material-symbols-outlined text-[16px]">
                  arrow_back
                </span>
                Quick Clash
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-label-md text-[11px] uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Lobby · {contest.status}
              </span>
              <span className="rounded-full border border-outline-variant/20 bg-surface-container px-2.5 py-0.5 font-label-md text-[11px] text-on-surface-variant">
                Private · Unrated
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-lg text-primary md:text-headline-xl [text-shadow:0_0_24px_rgba(221,183,255,0.25)]">
              {contest.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`rounded-md border px-2.5 py-1 font-label-md text-[11px] font-bold ${difficultyTone(contest.difficulty_tier)}`}
              >
                {contest.difficulty_tier}
              </span>
              <span className="rounded-md border border-outline-variant/25 bg-surface-container px-2.5 py-1 font-code-sm text-[11px] text-on-surface-variant">
                {contest.duration_minutes} min
              </span>
              <span className="rounded-md border border-outline-variant/25 bg-surface-container px-2.5 py-1 font-code-sm text-[11px] text-on-surface-variant">
                {joinedCount}/{contest.max_players} players
              </span>
              <span className="rounded-md border border-outline-variant/25 bg-surface-container px-2.5 py-1 font-code-sm text-[11px] text-on-surface-variant">
                {readyCount} ready
              </span>
            </div>
            {contest.description && (
              <p className="mt-3 max-w-2xl font-body-md text-body-md text-on-surface-variant">
                {contest.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copyLobbyLink()}
              className="picker flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 font-label-md text-[13px] text-on-surface-variant hover:border-primary/40 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copied ? "check" : "link"}
              </span>
              {copied ? "Copied" : "Copy lobby link"}
            </button>
            <Link
              to="/competitions/quick"
              className="picker rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 font-label-md text-[13px] text-on-surface-variant hover:text-primary"
            >
              New contest
            </Link>
          </div>
        </header>

        {(error || message) && (
          <p
            role="status"
            className={`mb-6 flex items-center gap-2 rounded-lg border px-3 py-2 font-body-md text-sm ${
              error
                ? "border-error/30 bg-error/10 text-error"
                : "border-primary/30 bg-primary/10 text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {error ? "error" : "check_circle"}
            </span>
            {error || message}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
          <div className="flex flex-col gap-6">
            {/* Players */}
            <section className="glass-panel overflow-hidden rounded-xl border border-outline-variant/20">
              <div className="flex items-center justify-between border-b border-outline-variant/15 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    groups
                  </span>
                  <h2 className="font-headline-lg-mobile text-[18px] font-bold text-on-surface">
                    Players
                  </h2>
                </div>
                <span className="font-code-sm text-[12px] text-on-surface-variant">
                  {joinedCount} joined · {readyCount} ready
                </span>
              </div>

              <ul className="divide-y divide-outline-variant/10">
                {(contest.participants || []).length === 0 ? (
                  <li className="px-5 py-10 text-center font-body-md text-sm text-on-surface-variant">
                    Waiting for players…
                  </li>
                ) : (
                  (contest.participants || []).map((p) => {
                    const uid = Number(p.user_id);
                    const status = String(p.status || "");
                    const ready = Boolean(p.ready);
                    const isMe = uid === meId;
                    const isRowHost = String(p.role) === "HOST" || uid === hostId;
                    return (
                      <li
                        key={String(p.user_id)}
                        className={`flex items-center gap-3 px-5 py-3.5 ${
                          isMe ? "bg-primary/6" : ""
                        }`}
                      >
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-outline-variant/40 bg-gradient-to-br from-primary/30 to-secondary-container/40 font-label-md text-sm font-bold text-primary">
                          {initials(String(p.name || "?"))}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-label-md text-sm font-semibold text-on-surface">
                            {String(p.name)}
                            {isMe && (
                              <span className="ml-1.5 font-normal text-primary">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="font-code-sm text-[11px] text-on-surface-variant">
                            @{String(p.unique_user_id)}
                            {isRowHost ? " · host" : ""}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 font-label-md text-[11px] uppercase tracking-wide ${statusTone(status, ready)}`}
                        >
                          {status === "JOINED"
                            ? ready
                              ? "Ready"
                              : "Joined"
                            : status.toLowerCase()}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>

            {/* Problems preview */}
            <section className="glass-panel overflow-hidden rounded-xl border border-outline-variant/20">
              <div className="flex items-center justify-between border-b border-outline-variant/15 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    list_alt
                  </span>
                  <h2 className="font-headline-lg-mobile text-[18px] font-bold text-on-surface">
                    Problems
                  </h2>
                </div>
                <span className="font-code-sm text-[12px] text-on-surface-variant">
                  unlocked when live
                </span>
              </div>
              <ul className="divide-y divide-outline-variant/10">
                {(contest.problems || []).map((p) => {
                  const letter = String.fromCharCode(64 + p.ordinal);
                  return (
                    <li
                      key={p.problem_id}
                      className="flex items-center gap-4 px-5 py-3.5"
                    >
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 font-headline-lg-mobile text-lg font-bold text-primary">
                        {letter}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-label-md text-sm font-semibold text-on-surface">
                          {p.title}
                        </p>
                      </div>
                      <span
                        className={`rounded-sm border px-2 py-0.5 font-label-md text-[11px] font-bold ${difficultyTone(p.difficulty)}`}
                      >
                        {p.difficulty}
                      </span>
                    </li>
                  );
                })}
                {(contest.problems || []).length === 0 && (
                  <li className="px-5 py-8 text-center text-sm text-on-surface-variant">
                    Problems appear once the lobby is ready.
                  </li>
                )}
              </ul>
            </section>
          </div>

          {/* Sticky side panel */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            {isHost && contest.status === "LOBBY" && (
              <section className="glass-panel overflow-hidden rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-2 border-b border-outline-variant/15 px-4 py-3">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    person_add
                  </span>
                  <h3 className="font-label-md text-label-md font-bold text-on-surface">
                    Invite friends
                  </h3>
                </div>
                <div className="max-h-56 space-y-1 overflow-y-auto p-3">
                  {inviteableFriends.length === 0 ? (
                    <p className="px-1 py-4 text-center font-body-md text-sm text-on-surface-variant">
                      {friends.length === 0 ? (
                        <>
                          Add friends on the{" "}
                          <Link to="/friends" className="text-primary hover:underline">
                            Friends
                          </Link>{" "}
                          page first.
                        </>
                      ) : (
                        "Everyone you can invite is already in this lobby."
                      )}
                    </p>
                  ) : (
                    inviteableFriends.map((f) => {
                      const checked = selected.includes(f.user_id);
                      return (
                        <label
                          key={f.user_id}
                          className={`picker flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${
                            checked
                              ? "border-primary/40 bg-primary/10"
                              : "border-transparent hover:bg-surface-container"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="accent-[var(--color-primary,#ddb7ff)]"
                            checked={checked}
                            onChange={(e) =>
                              setSelected((prev) =>
                                e.target.checked
                                  ? [...prev, f.user_id]
                                  : prev.filter((x) => x !== f.user_id)
                              )
                            }
                          />
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                            {initials(f.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-label-md text-sm text-on-surface">
                              {f.name}
                            </span>
                            <span className="block truncate font-code-sm text-[11px] text-on-surface-variant">
                              @{f.unique_user_id}
                            </span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-outline-variant/15 p-3">
                  <button
                    type="button"
                    disabled={selected.length === 0 || busy === "invite"}
                    onClick={onInvite}
                    className="picker w-full rounded-full bg-primary py-2.5 font-label-md text-[13px] text-on-primary shadow-[0_0_16px_rgba(168,85,247,0.35)] disabled:opacity-50"
                  >
                    {busy === "invite"
                      ? "Sending…"
                      : `Send invites${selected.length ? ` (${selected.length})` : ""}`}
                  </button>
                </div>
              </section>
            )}

            <section className="glass-panel rounded-xl border border-outline-variant/20 p-4">
              <h3 className="mb-3 font-label-md text-label-md font-bold text-on-surface">
                Actions
              </h3>
              <div className="flex flex-col gap-2">
                {(myStatus === "INVITED" || myStatus === "LEFT") && (
                  <button
                    type="button"
                    disabled={busy === "join"}
                    onClick={() =>
                      void run("join", async () => {
                        const c = await joinQuickContest(contest.id);
                        if (c.status === "LIVE") {
                          navigate(`/competitions/quick/${contest.id}/live`, {
                            replace: true,
                          });
                          return;
                        }
                        await reload();
                      })
                    }
                    className="picker flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-label-md text-[13px] text-on-primary shadow-[0_0_16px_rgba(168,85,247,0.35)] disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      login
                    </span>
                    {busy === "join"
                      ? "Joining…"
                      : myStatus === "LEFT"
                        ? "Rejoin lobby"
                        : "Join lobby"}
                  </button>
                )}

                {myStatus === "JOINED" && contest.status === "LIVE" && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/competitions/quick/${contest.id}/live`)
                    }
                    className="picker flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-label-md text-[13px] text-on-primary"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      play_arrow
                    </span>
                    Enter live contest
                  </button>
                )}

                {myStatus === "JOINED" && contest.status === "LOBBY" && (
                  <button
                    type="button"
                    disabled={busy === "ready"}
                    onClick={() =>
                      void run("ready", async () => {
                        await readyQuickContest(
                          contest.id,
                          !Boolean(myRow?.ready)
                        );
                        await reload();
                      })
                    }
                    className={`picker flex items-center justify-center gap-2 rounded-lg py-2.5 font-label-md text-[13px] disabled:opacity-60 ${
                      myRow?.ready
                        ? "border border-outline-variant/40 bg-surface-container text-on-surface-variant"
                        : "border border-easy/40 bg-easy/10 text-easy"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {myRow?.ready ? "radio_button_unchecked" : "check_circle"}
                    </span>
                    {busy === "ready"
                      ? "Updating…"
                      : myRow?.ready
                        ? "Unready"
                        : "Ready up"}
                  </button>
                )}

                {isHost && contest.status === "LOBBY" && (
                  <>
                    <button
                      type="button"
                      disabled={!canStart || busy === "start"}
                      title={
                        canStart
                          ? "Start the contest"
                          : "Need at least 2 joined & ready players"
                      }
                      onClick={() =>
                        void run("start", async () => {
                          await startQuickContest(contest.id);
                          navigate(`/competitions/quick/${contest.id}/live`);
                        })
                      }
                      className="picker flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-label-md text-[13px] text-on-primary shadow-[0_0_16px_rgba(168,85,247,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        swords
                      </span>
                      {busy === "start" ? "Starting…" : "Start Contest"}
                    </button>
                    {!canStart && (
                      <p className="px-1 font-code-sm text-[11px] text-on-surface-variant">
                        Need ≥2 players joined and ready to start.
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={busy === "cancel"}
                      onClick={() =>
                        void run("cancel", async () => {
                          await cancelQuickContest(contest.id);
                          navigate("/competitions/quick");
                        })
                      }
                      className="picker rounded-lg border border-error/30 bg-error/5 py-2.5 font-label-md text-[13px] text-error hover:bg-error/10 disabled:opacity-60"
                    >
                      {busy === "cancel" ? "Cancelling…" : "Cancel lobby"}
                    </button>
                  </>
                )}

                {myStatus === "JOINED" && !isHost && contest.status === "LOBBY" && (
                  <button
                    type="button"
                    disabled={busy === "leave"}
                    onClick={() =>
                      void run("leave", async () => {
                        await leaveQuickContest(contest.id);
                        await reload();
                      })
                    }
                    className="picker rounded-lg border border-outline-variant/30 py-2.5 font-label-md text-[13px] text-on-surface-variant hover:border-error/40 hover:text-error disabled:opacity-60"
                  >
                    {busy === "leave" ? "Leaving…" : "Leave lobby"}
                  </button>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
