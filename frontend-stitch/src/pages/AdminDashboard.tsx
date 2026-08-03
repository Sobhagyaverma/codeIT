import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import AppNav from "../components/AppNav";
import {
  addProblemsToCompetition,
  createCompetition,
  createProblem,
  getAllCompetitions,
  getProblems,
  type Competition,
} from "../lib/api";
import type { ProblemPublicDTO } from "../lib/authStorage";
import { useAuth } from "../context/AuthContext";

type Tab = "problem" | "competition";

function toIsoLocal(datetimeLocal: string): string {
  if (!datetimeLocal) return "";
  return new Date(datetimeLocal).toISOString();
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("problem");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [pTitle, setPTitle] = useState("");
  const [pSlug, setPSlug] = useState("");
  const [pDifficulty, setPDifficulty] = useState("EASY");
  const [pTags, setPTags] = useState("");
  const [pDescription, setPDescription] = useState("");
  const [pConstraints, setPConstraints] = useState("");
  const [pInputFormat, setPInputFormat] = useState("");
  const [pOutputFormat, setPOutputFormat] = useState("");
  const [pTimeLimit, setPTimeLimit] = useState("1000");
  const [pMemoryLimit, setPMemoryLimit] = useState("256");
  const [pSampleIn, setPSampleIn] = useState("");
  const [pSampleOut, setPSampleOut] = useState("");
  const [pHiddenIn, setPHiddenIn] = useState("");
  const [pHiddenOut, setPHiddenOut] = useState("");
  const [pStarter, setPStarter] = useState(
    "// Write your solution here\n"
  );

  const [cTitle, setCTitle] = useState("");
  const [cDescription, setCDescription] = useState("");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const [cDuration, setCDuration] = useState("120");
  const [cType, setCType] = useState("RATED");
  const [cDifficulty, setCDifficulty] = useState("INTERMEDIATE");
  const [cFeatured, setCFeatured] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState<number[]>([]);
  const [allProblems, setAllProblems] = useState<ProblemPublicDTO[]>([]);
  const [recentComps, setRecentComps] = useState<Competition[]>([]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    void getProblems()
      .then(setAllProblems)
      .catch(() => setAllProblems([]));
    void getAllCompetitions()
      .then((list) => setRecentComps(list.slice(0, 5)))
      .catch(() => setRecentComps([]));
  }, [user]);

  const problemOptions = useMemo(
    () =>
      allProblems.map((p) => ({
        id: p.id,
        label: `${p.id}. ${p.title}`,
      })),
    [allProblems]
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  const onCreateProblem = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const tags = pTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const created = await createProblem({
        title: pTitle.trim(),
        slug: pSlug.trim() || undefined,
        description: pDescription.trim(),
        difficulty: pDifficulty,
        tags,
        constraints: pConstraints.trim() || undefined,
        inputFormat: pInputFormat.trim() || undefined,
        outputFormat: pOutputFormat.trim() || undefined,
        timeLimitMs: Number(pTimeLimit) || 1000,
        memoryLimitMb: Number(pMemoryLimit) || 256,
        sampleInput: pSampleIn,
        sampleOutput: pSampleOut,
        hiddenInput: pHiddenIn || undefined,
        hiddenOutput: pHiddenOut || undefined,
        starterCode: pStarter,
      });
      setMessage(`Problem #${created.id} created: ${created.title}`);
      setPTitle("");
      setPSlug("");
      setPDescription("");
      setPTags("");
      setPConstraints("");
      setPInputFormat("");
      setPOutputFormat("");
      setPSampleIn("");
      setPSampleOut("");
      setPHiddenIn("");
      setPHiddenOut("");
      const refreshed = await getProblems();
      setAllProblems(refreshed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Create problem failed");
    } finally {
      setBusy(false);
    }
  };

  const onCreateCompetition = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const created = await createCompetition({
        title: cTitle.trim(),
        description: cDescription.trim(),
        startTime: toIsoLocal(cStart),
        endTime: toIsoLocal(cEnd),
        durationMinutes: Number(cDuration) || 120,
        contestType: cType,
        difficulty: cDifficulty,
        isFeatured: cFeatured,
      });
      if (selectedProblems.length > 0) {
        await addProblemsToCompetition(created.id, selectedProblems);
      }
      setMessage(`Competition #${created.id} created: ${created.title ?? cTitle}`);
      setCTitle("");
      setCDescription("");
      setCStart("");
      setCEnd("");
      setSelectedProblems([]);
      const list = await getAllCompetitions();
      setRecentComps(list.slice(0, 5));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Create competition failed"
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleProblem = (id: number) => {
    setSelectedProblems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-on-surface">
      <AppNav />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[20%] h-[50%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[5%] h-[40%] w-[30%] rounded-full bg-secondary/5 blur-[100px]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-10 pt-28 lg:px-10">
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">
              admin_panel_settings
            </span>
            <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
              Administration
            </span>
          </div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-white">
            Content Studio
          </h1>
          <p className="mt-2 max-w-xl font-body text-on-surface-variant">
            Create problems and competitions for the platform.
          </p>
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

        <div className="mb-8 flex gap-2 border-b border-outline-variant/20 pb-1">
          <button
            type="button"
            onClick={() => setTab("problem")}
            className={`rounded-t-lg px-5 py-2.5 font-label text-sm font-bold transition-all ${
              tab === "problem"
                ? "bg-primary/20 text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Create Problem
          </button>
          <button
            type="button"
            onClick={() => setTab("competition")}
            className={`rounded-t-lg px-5 py-2.5 font-label text-sm font-bold transition-all ${
              tab === "competition"
                ? "bg-primary/20 text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Create Competition
          </button>
        </div>

        {tab === "problem" ? (
          <form
            onSubmit={(e) => void onCreateProblem(e)}
            className="glass-panel space-y-6 rounded-xl p-8"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Title
                </label>
                <input
                  required
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Slug (optional)
                </label>
                <input
                  value={pSlug}
                  onChange={(e) => setPSlug(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Difficulty
                </label>
                <select
                  value={pDifficulty}
                  onChange={(e) => setPDifficulty(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Tags (comma-separated)
                </label>
                <input
                  value={pTags}
                  onChange={(e) => setPTags(e.target.value)}
                  placeholder="arrays, dp, graphs"
                  className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Description
                </label>
                <textarea
                  required
                  rows={6}
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  className="w-full resize-y rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Constraints
                </label>
                <textarea
                  rows={3}
                  value={pConstraints}
                  onChange={(e) => setPConstraints(e.target.value)}
                  className="w-full resize-y rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Input / Output format
                </label>
                <input
                  value={pInputFormat}
                  onChange={(e) => setPInputFormat(e.target.value)}
                  placeholder="Input format"
                  className="mb-2 w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
                <input
                  value={pOutputFormat}
                  onChange={(e) => setPOutputFormat(e.target.value)}
                  placeholder="Output format"
                  className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Time limit (ms)
                </label>
                <input
                  type="number"
                  value={pTimeLimit}
                  onChange={(e) => setPTimeLimit(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Memory limit (MB)
                </label>
                <input
                  type="number"
                  value={pMemoryLimit}
                  onChange={(e) => setPMemoryLimit(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Sample input
                </label>
                <textarea
                  rows={4}
                  value={pSampleIn}
                  onChange={(e) => setPSampleIn(e.target.value)}
                  className="w-full resize-y rounded-xl border-none bg-surface-container-highest px-4 py-3 font-mono text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Sample output
                </label>
                <textarea
                  rows={4}
                  value={pSampleOut}
                  onChange={(e) => setPSampleOut(e.target.value)}
                  className="w-full resize-y rounded-xl border-none bg-surface-container-highest px-4 py-3 font-mono text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Hidden input
                </label>
                <textarea
                  rows={3}
                  value={pHiddenIn}
                  onChange={(e) => setPHiddenIn(e.target.value)}
                  className="w-full resize-y rounded-xl border-none bg-surface-container-highest px-4 py-3 font-mono text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Hidden output
                </label>
                <textarea
                  rows={3}
                  value={pHiddenOut}
                  onChange={(e) => setPHiddenOut(e.target.value)}
                  className="w-full resize-y rounded-xl border-none bg-surface-container-highest px-4 py-3 font-mono text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Starter code
                </label>
                <textarea
                  rows={6}
                  value={pStarter}
                  onChange={(e) => setPStarter(e.target.value)}
                  className="w-full resize-y rounded-xl border-none bg-surface-container-highest px-4 py-3 font-mono text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="glow-primary rounded-xl bg-gradient-to-br from-primary to-primary-container px-8 py-3 font-label text-sm font-bold text-on-primary-fixed disabled:opacity-60"
            >
              {busy ? "Creating…" : "Publish Problem"}
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <form
              onSubmit={(e) => void onCreateCompetition(e)}
              className="glass-panel space-y-6 rounded-xl p-8 lg:col-span-2"
            >
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Title
                </label>
                <input
                  required
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={cDescription}
                  onChange={(e) => setCDescription(e.target.value)}
                  className="w-full resize-y rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Start
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={cStart}
                    onChange={(e) => setCStart(e.target.value)}
                    className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    End
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={cEnd}
                    onChange={(e) => setCEnd(e.target.value)}
                    className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={cDuration}
                    onChange={(e) => setCDuration(e.target.value)}
                    className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Type
                  </label>
                  <select
                    value={cType}
                    onChange={(e) => setCType(e.target.value)}
                    className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                  >
                    <option value="RATED">Rated</option>
                    <option value="UNRATED">Unrated</option>
                    <option value="PRACTICE">Practice</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Difficulty
                  </label>
                  <select
                    value={cDifficulty}
                    onChange={(e) => setCDifficulty(e.target.value)}
                    className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
                <label className="flex items-center gap-3 self-end pb-3">
                  <input
                    type="checkbox"
                    checked={cFeatured}
                    onChange={(e) => setCFeatured(e.target.checked)}
                    className="size-4 rounded text-primary"
                  />
                  <span className="text-sm text-on-surface-variant">
                    Featured contest
                  </span>
                </label>
              </div>
              <div className="space-y-3">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Attach problems ({selectedProblems.length} selected)
                </label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl bg-surface-container-highest/50 p-3 ring-1 ring-outline-variant/20">
                  {problemOptions.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      No problems available.
                    </p>
                  ) : (
                    problemOptions.map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-container-high"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProblems.includes(p.id)}
                          onChange={() => toggleProblem(p.id)}
                          className="size-4 rounded text-primary"
                        />
                        <span className="text-sm text-on-surface">{p.label}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="glow-primary rounded-xl bg-gradient-to-br from-primary to-primary-container px-8 py-3 font-label text-sm font-bold text-on-primary-fixed disabled:opacity-60"
              >
                {busy ? "Creating…" : "Launch Competition"}
              </button>
            </form>

            <aside className="space-y-4">
              <div className="glass-panel rounded-xl p-6">
                <h3 className="mb-4 font-headline text-lg font-bold text-white">
                  Recent competitions
                </h3>
                <ul className="space-y-3">
                  {recentComps.length === 0 ? (
                    <li className="text-sm text-on-surface-variant">None yet</li>
                  ) : (
                    recentComps.map((c) => (
                      <li key={c.id}>
                        <Link
                          to={`/competitions/${c.id}`}
                          className="block rounded-lg px-2 py-2 text-sm text-on-surface transition-colors hover:bg-surface-container-high hover:text-primary"
                        >
                          {c.title ?? c.name ?? `Contest #${c.id}`}
                          <span className="mt-0.5 block text-xs text-on-surface-variant">
                            {c.status}
                          </span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
