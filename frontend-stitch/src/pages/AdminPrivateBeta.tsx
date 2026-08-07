import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ApiError,
  approveBetaRequest,
  describeApiError,
  generateBetaInvite,
  getBetaAnalytics,
  listBetaInvites,
  listBetaRequests,
  rejectBetaRequest,
  resendBetaInvite,
  type BetaAccessRequest,
  type BetaAnalytics,
  type BetaInviteRow,
} from "../lib/api";

type Tab = "requests" | "generate" | "invites" | "analytics";

type Props = {
  onMessage: (msg: string | null) => void;
  onError: (msg: string | null) => void;
};

export default function AdminPrivateBeta({ onMessage, onError }: Props) {
  const [tab, setTab] = useState<Tab>("requests");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [requests, setRequests] = useState<BetaAccessRequest[]>([]);
  const [invites, setInvites] = useState<BetaInviteRow[]>([]);
  const [analytics, setAnalytics] = useState<BetaAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [lastRawCode, setLastRawCode] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    onError(null);
    try {
      setRequests(await listBetaRequests(statusFilter));
    } catch (err) {
      onError(describeApiError(err, "Failed to load requests"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, onError]);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    onError(null);
    try {
      setInvites(await listBetaInvites());
    } catch (err) {
      onError(describeApiError(err, "Failed to load invites"));
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    onError(null);
    try {
      setAnalytics(await getBetaAnalytics());
    } catch (err) {
      onError(describeApiError(err, "Failed to load analytics"));
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    if (tab === "requests") void loadRequests();
    else if (tab === "invites") void loadInvites();
    else if (tab === "analytics") void loadAnalytics();
  }, [tab, loadRequests, loadInvites, loadAnalytics]);

  const onApprove = async (id: number) => {
    setBusyId(id);
    onError(null);
    try {
      const res = await approveBetaRequest(id);
      setLastRawCode(res.inviteCode);
      onMessage(
        `Approved — invite ${res.inviteCode} (email ${
          res.emailSent ? "sent" : "not sent"
        }). Copy the code now; it won't be shown again.`
      );
      await loadRequests();
    } catch (err) {
      onError(describeApiError(err, "Approve failed"));
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (id: number) => {
    const reason = window.prompt("Reject reason (optional)") ?? undefined;
    setBusyId(id);
    onError(null);
    try {
      await rejectBetaRequest(id, reason || undefined);
      onMessage("Request rejected.");
      await loadRequests();
    } catch (err) {
      onError(describeApiError(err, "Reject failed"));
    } finally {
      setBusyId(null);
    }
  };

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    onError(null);
    setBusyId(-1);
    try {
      const res = await generateBetaInvite(email.trim(), fullName.trim() || undefined);
      setLastRawCode(res.inviteCode);
      onMessage(
        `Invite created for ${res.email}: ${res.inviteCode} (email ${
          res.emailSent ? "sent" : "not sent"
        })`
      );
      setEmail("");
      setFullName("");
    } catch (err) {
      onError(
        err instanceof ApiError
          ? err.message
          : describeApiError(err, "Generate failed")
      );
    } finally {
      setBusyId(null);
    }
  };

  const onResend = async (id: number) => {
    setBusyId(id);
    onError(null);
    try {
      const res = await resendBetaInvite(id);
      setLastRawCode(res.inviteCode);
      onMessage(
        `Re-issued invite ${res.inviteCode} (email ${
          res.emailSent ? "sent" : "not sent"
        })`
      );
      await loadInvites();
    } catch (err) {
      onError(describeApiError(err, "Resend failed"));
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "requests", label: "Invite Requests" },
    { id: "generate", label: "Generate Invite" },
    { id: "invites", label: "Invited Users" },
    { id: "analytics", label: "Beta Analytics" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-outline-variant/30 bg-gradient-to-br from-surface-container to-background p-8">
        <h2 className="font-headline-xl mb-2 text-[28px] font-bold text-on-surface md:text-[36px]">
          Private Beta
        </h2>
        <p className="max-w-2xl text-on-surface-variant">
          Review access requests, mint email-bound invite codes, and track beta
          usage. Raw invite codes are shown once.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-primary text-on-primary"
                : "border border-outline-variant/40 text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {lastRawCode && (
        <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          <span className="font-semibold text-primary">Latest invite code: </span>
          <code className="font-mono break-all text-on-surface">{lastRawCode}</code>
          <button
            type="button"
            className="ml-3 text-xs text-primary underline"
            onClick={() => {
              void navigator.clipboard?.writeText(lastRawCode);
              onMessage("Copied invite code.");
            }}
          >
            Copy
          </button>
        </div>
      )}

      {tab === "requests" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-3 py-1 text-xs font-bold ${
                  statusFilter === s
                    ? "bg-primary/20 text-primary"
                    : "text-on-surface-variant"
                }`}
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void loadRequests()}
              className="ml-auto text-xs text-primary underline"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No requests.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-surface-container text-on-surface-variant">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">College</th>
                    <th className="px-3 py-2">Year</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-outline-variant/20"
                    >
                      <td className="px-3 py-2">{r.fullName}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.email}</td>
                      <td className="px-3 py-2">{r.college}</td>
                      <td className="px-3 py-2">{r.year}</td>
                      <td className="px-3 py-2">{r.status}</td>
                      <td className="px-3 py-2">
                        {r.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => void onApprove(r.id)}
                              className="rounded bg-primary px-2 py-1 text-xs font-bold text-on-primary disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => void onReject(r.id)}
                              className="rounded border border-error/40 px-2 py-1 text-xs text-error disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "generate" && (
        <form
          onSubmit={onGenerate}
          className="max-w-md space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container/40 p-6"
        >
          <div>
            <label className="mb-1 block text-sm text-on-surface-variant">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface px-3"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-on-surface-variant">
              Full name (optional)
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface px-3"
            />
          </div>
          <button
            type="submit"
            disabled={busyId === -1}
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-60"
          >
            {busyId === -1 ? "Generating…" : "Generate & email invite"}
          </button>
        </form>
      )}

      {tab === "invites" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => void loadInvites()}
            className="text-xs text-primary underline"
          >
            Refresh
          </button>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading…</p>
          ) : invites.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No invites yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-surface-container text-on-surface-variant">
                  <tr>
                    <th className="px-3 py-2">Prefix</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Expires</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-t border-outline-variant/20"
                    >
                      <td className="px-3 py-2 font-mono text-xs">
                        {inv.codePrefix}…
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {inv.email}
                      </td>
                      <td className="px-3 py-2">{inv.status}</td>
                      <td className="px-3 py-2 text-xs">
                        {inv.expiresAt
                          ? new Date(inv.expiresAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {inv.status === "ACTIVE" && (
                          <button
                            type="button"
                            disabled={busyId === inv.id}
                            onClick={() => void onResend(inv.id)}
                            className="rounded border border-primary/40 px-2 py-1 text-xs text-primary disabled:opacity-50"
                          >
                            Resend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "analytics" && (
        <div>
          {loading || !analytics ? (
            <p className="text-sm text-on-surface-variant">Loading…</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {(
                [
                  ["Registered users", analytics.registeredUsers],
                  ["Pending requests", analytics.pendingRequests],
                  ["Approved requests", analytics.approvedRequests],
                  ["Rejected requests", analytics.rejectedRequests],
                  ["Active invites", analytics.activeInvites],
                  ["Used invites", analytics.usedInvites],
                  ["Expired invites", analytics.expiredInvites],
                  ["DAU (submissions)", analytics.dailyActiveUsers],
                  ["Accepted submissions", analytics.problemsSolved],
                  ["Quick Clash", analytics.quickClashCount],
                  ["Competitions", analytics.competitionCount],
                  ["CodeRooms", analytics.codeRoomsCreated],
                  ["AI sessions", analytics.aiRequests],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container/50 p-4"
                >
                  <p className="text-xs text-on-surface-variant">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-on-surface">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
