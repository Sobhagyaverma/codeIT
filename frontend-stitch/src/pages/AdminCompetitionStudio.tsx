import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  addProblemsToCompetition,
  createCompetition,
  getProblems,
} from "../lib/api";
import type { ProblemPublicDTO } from "../lib/authStorage";

const DRAFT_KEY = "codeit.stitch.competitionStudio.draft";

type ContestType = "RATED" | "PRACTICE" | "UNRATED";
type ScoringModel = "progressive" | "equal";
type RankingRules = "icpc" | "codeforces";

type StudioDraft = {
  title: string;
  slug: string;
  description: string;
  contestType: ContestType;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  selectedIds: number[];
  scoringModel: ScoringModel;
  rankingRules: RankingRules;
  rules: {
    publicLeaderboard: boolean;
    penalty: boolean;
    aiCoach: boolean;
    liveDiscussions: boolean;
    strictAttempts: boolean;
  };
};

const emptyDraft = (): StudioDraft => ({
  title: "",
  slug: "",
  description: "",
  contestType: "RATED",
  startTime: "",
  endTime: "",
  durationMinutes: 120,
  selectedIds: [],
  scoringModel: "progressive",
  rankingRules: "icpc",
  rules: {
    publicLeaderboard: true,
    penalty: true,
    aiCoach: false,
    liveDiscussions: true,
    strictAttempts: true,
  },
});

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadDraft(): StudioDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    return { ...emptyDraft(), ...JSON.parse(raw) } as StudioDraft;
  } catch {
    return emptyDraft();
  }
}

function toIsoLocal(datetimeLocal: string): string {
  if (!datetimeLocal) return "";
  return new Date(datetimeLocal).toISOString();
}

function parseTopics(topics: string[] | string | undefined): string[] {
  if (!topics) return [];
  if (Array.isArray(topics)) return topics.map(String).filter(Boolean);
  const raw = topics.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    /* comma */
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function diffClass(d: string): string {
  const u = d.toUpperCase();
  if (u.startsWith("HARD")) return "text-error";
  if (u.startsWith("MED")) return "text-secondary";
  return "text-primary";
}

type Props = {
  onBack: () => void;
  onPublished: () => void;
};

export default function AdminCompetitionStudio({ onBack, onPublished }: Props) {
  const [draft, setDraft] = useState<StudioDraft>(() => loadDraft());
  const [problems, setProblems] = useState<ProblemPublicDTO[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [librarySearch, setLibrarySearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<"ALL" | "EASY" | "MEDIUM" | "HARD">(
    "ALL"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">(
    "saved"
  );
  const dirtyRef = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const dragIndex = useRef<number | null>(null);

  const patch = useCallback((partial: Partial<StudioDraft>) => {
    dirtyRef.current = true;
    setSaveState("dirty");
    setDraft((prev) => {
      const next = { ...prev, ...partial };
      if (partial.title !== undefined && !prev.slug) {
        next.slug = slugify(partial.title);
      }
      return next;
    });
  }, []);

  const persistDraft = useCallback((data: StudioDraft) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    dirtyRef.current = false;
    setSaveState("saved");
  }, []);

  useEffect(() => {
    if (!dirtyRef.current) return;
    setSaveState("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => persistDraft(draft), 900);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [draft, persistDraft]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProblems(true);
      try {
        const list = await getProblems();
        if (!cancelled) setProblems(list);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load problems"
          );
      } finally {
        if (!cancelled) setLoadingProblems(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const library = useMemo(() => {
    const q = librarySearch.trim().toLowerCase();
    return problems.filter((p) => {
      if (draft.selectedIds.includes(p.id)) return false;
      if (diffFilter !== "ALL") {
        const d = (p.difficulty || "").toUpperCase();
        if (!d.startsWith(diffFilter.slice(0, 3)) && d !== diffFilter)
          return false;
      }
      if (!q) return true;
      const topics = parseTopics(p.topics).join(" ").toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        topics.includes(q)
      );
    });
  }, [problems, draft.selectedIds, librarySearch, diffFilter]);

  const selectedProblems = useMemo(() => {
    const map = new Map(problems.map((p) => [p.id, p]));
    return draft.selectedIds
      .map((id) => map.get(id))
      .filter(Boolean) as ProblemPublicDTO[];
  }, [problems, draft.selectedIds]);

  const checklist = useMemo(() => {
    const basic = Boolean(draft.title.trim()) && Boolean(draft.description.trim());
    const schedule =
      Boolean(draft.startTime) &&
      Boolean(draft.endTime) &&
      draft.durationMinutes > 0;
    const rules = true; // UI-only toggles always "defined"
    const problemsOk = draft.selectedIds.length >= 1;
    const done = [basic, schedule, rules, problemsOk].filter(Boolean).length;
    const pct = Math.round((done / 4) * 100);
    return { basic, schedule, rules, problemsOk, pct };
  }, [draft]);

  const circumference = 2 * Math.PI * 58;
  const dashOffset =
    circumference - (checklist.pct / 100) * circumference;

  const durationPreview = useMemo(() => {
    if (!draft.startTime || !draft.endTime) return draft.durationMinutes;
    const ms =
      new Date(draft.endTime).getTime() - new Date(draft.startTime).getTime();
    if (Number.isNaN(ms) || ms <= 0) return draft.durationMinutes;
    return Math.round(ms / 60000);
  }, [draft.startTime, draft.endTime, draft.durationMinutes]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!draft.title.trim()) errs.title = "Competition name is required.";
    if (!draft.startTime) errs.startTime = "Start time is required.";
    if (!draft.endTime) errs.endTime = "End time is required.";
    if (draft.startTime && draft.endTime) {
      const s = new Date(draft.startTime).getTime();
      const e = new Date(draft.endTime).getTime();
      if (e <= s) errs.endTime = "End must be after start.";
    }
    if (!draft.durationMinutes || draft.durationMinutes <= 0) {
      errs.duration = "Duration must be positive.";
    }
    if (draft.selectedIds.length < 1) {
      errs.problems = "Select at least one problem.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const publish = async () => {
    setError(null);
    setMessage(null);
    if (!validate()) {
      setError("Fix validation errors before publishing.");
      return;
    }
    setBusy(true);
    try {
      const created = await createCompetition({
        title: draft.title.trim(),
        description: draft.description.trim(),
        startTime: toIsoLocal(draft.startTime),
        endTime: toIsoLocal(draft.endTime),
        durationMinutes: draft.durationMinutes || durationPreview || 120,
        contestType: draft.contestType,
      });
      if (draft.selectedIds.length > 0) {
        await addProblemsToCompetition(created.id, draft.selectedIds);
      }
      localStorage.removeItem(DRAFT_KEY);
      dirtyRef.current = false;
      setDraft(emptyDraft());
      setSaveState("saved");
      setMessage(`Competition #${created.id} published.`);
      onPublished();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  };

  const onDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const onDrop = (index: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from == null || from === index) return;
    const next = [...draft.selectedIds];
    const [item] = next.splice(from, 1);
    next.splice(index, 0, item);
    patch({ selectedIds: next });
  };

  const toggleRule = (key: keyof StudioDraft["rules"]) => {
    patch({
      rules: { ...draft.rules, [key]: !draft.rules[key] },
    });
  };

  const RuleToggle = ({
    icon,
    label,
    desc,
    active,
    onToggle,
  }: {
    icon: string;
    label: string;
    desc: string;
    active: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="group cursor-pointer rounded-xl border border-outline-variant/20 bg-surface-container-lowest/50 p-4 text-left transition-all hover:bg-surface-container-highest"
    >
      <div className="mb-2 flex items-start justify-between">
        <span
          className={`material-symbols-outlined ${
            active ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          {icon}
        </span>
        <div
          className={`relative h-4 w-8 rounded-full ${
            active ? "bg-primary/20" : "bg-outline-variant/20"
          }`}
        >
          <div
            className={`absolute top-0.5 h-3 w-3 rounded-full ${
              active
                ? "right-1 bg-primary"
                : "left-1 bg-outline-variant"
            }`}
          />
        </div>
      </div>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-1 text-xs text-on-surface-variant/70">{desc}</p>
    </button>
  );

  return (
    <div className="admin-comp-studio relative pb-28">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant/40">
            <button
              type="button"
              onClick={onBack}
              className="hover:text-primary"
            >
              /admin/competitions/
            </button>
            <span className="font-bold text-primary">studio</span>
          </div>
          <h2 className="font-headline-lg text-on-surface">
            Competition Studio
          </h2>
          <p className="text-on-surface-variant">
            Design high-stakes challenges for the next generation of engineers.
          </p>
        </div>
        <span className="rounded-full border border-outline-variant/20 bg-surface-container-highest px-3 py-1 text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
          Draft Mode
        </span>
      </div>

      {(error || message) && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-error/40 bg-error/10 text-error"
              : "border-secondary/40 bg-secondary/10 text-secondary"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          {/* Basic Information */}
          <section className="comp-glass-card space-y-6 rounded-2xl p-6 sm:p-8">
            <div className="mb-2 flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined">info</span>
              <h3 className="text-lg font-bold uppercase tracking-wider">
                Basic Information
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-on-surface-variant">
                  Competition Name
                </label>
                <input
                  className="comp-input w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 font-body-md"
                  placeholder="e.g., CodeIT Summer Sprint 2024"
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                />
                {fieldErrors.title && (
                  <p className="text-xs text-error">{fieldErrors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-on-surface-variant">
                  URL Slug
                </label>
                <div className="flex items-center overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest focus-within:border-primary/50">
                  <span className="pl-4 text-sm text-on-surface-variant/40">
                    codeit.io/c/
                  </span>
                  <input
                    className="flex-1 border-none bg-transparent px-2 py-3 font-mono text-sm outline-none"
                    placeholder="summer-sprint-24"
                    value={draft.slug}
                    onChange={(e) => patch({ slug: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-outline">
                  UI-only — not on Competition DTO.
                </p>
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-on-surface-variant">
                  Contest Type
                </label>
                <select
                  className="comp-input w-full appearance-none rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3"
                  value={draft.contestType}
                  onChange={(e) =>
                    patch({ contestType: e.target.value as ContestType })
                  }
                >
                  <option value="PRACTICE">Practice</option>
                  <option value="RATED">Rated (Global)</option>
                  <option value="UNRATED">Unrated</option>
                </select>
                <p className="text-[10px] text-outline">
                  Sent on create; backend entity may ignore if column missing.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-on-surface-variant">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="comp-input w-full resize-none rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 font-body-md"
                  placeholder="Briefly describe the competition goals and rewards..."
                  value={draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="comp-glass-card space-y-6 rounded-2xl p-6 sm:p-8">
            <div className="mb-2 flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined">calendar_today</span>
              <h3 className="text-lg font-bold uppercase tracking-wider">
                Schedule &amp; Timeline
              </h3>
            </div>
            <div className="relative space-y-10 border-l-2 border-outline-variant/20 pl-8">
              <div className="relative">
                <span className="absolute -left-[41px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-primary/20" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-primary">
                      Competition Start
                    </p>
                    <input
                      type="datetime-local"
                      className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={draft.startTime}
                      onChange={(e) => patch({ startTime: e.target.value })}
                    />
                    {fieldErrors.startTime && (
                      <p className="text-xs text-error">
                        {fieldErrors.startTime}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-on-surface-variant">
                      Competition End
                    </p>
                    <input
                      type="datetime-local"
                      className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={draft.endTime}
                      onChange={(e) => patch({ endTime: e.target.value })}
                    />
                    {fieldErrors.endTime && (
                      <p className="text-xs text-error">{fieldErrors.endTime}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative">
                <span className="absolute -left-[41px] top-0 h-4 w-4 rounded-full bg-secondary-container ring-4 ring-secondary-container/20" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-secondary">
                      Duration (minutes)
                    </p>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={draft.durationMinutes}
                      onChange={(e) =>
                        patch({
                          durationMinutes: Number(e.target.value) || 0,
                        })
                      }
                    />
                    {fieldErrors.duration && (
                      <p className="text-xs text-error">
                        {fieldErrors.duration}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-on-surface-variant">
                      Computed window
                    </p>
                    <p className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface-variant">
                      {durationPreview}m from start→end
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-outline">
                  Registration open/close &amp; timezone are not on the
                  Competition API.
                </p>
              </div>
            </div>
          </section>

          {/* Rules — UI only */}
          <section className="comp-glass-card space-y-6 rounded-2xl p-6 sm:p-8">
            <div className="mb-2 flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined">gavel</span>
              <h3 className="text-lg font-bold uppercase tracking-wider">
                Competition Rules
              </h3>
            </div>
            <p className="text-[10px] text-outline">
              Toggles are UI/draft only — no rules fields on Competition DTO.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <RuleToggle
                icon="leaderboard"
                label="Public Leaderboard"
                desc="Real-time rank updates."
                active={draft.rules.publicLeaderboard}
                onToggle={() => toggleRule("publicLeaderboard")}
              />
              <RuleToggle
                icon="history"
                label="Penalty System"
                desc="-20 mins per wrong sub."
                active={draft.rules.penalty}
                onToggle={() => toggleRule("penalty")}
              />
              <RuleToggle
                icon="psychology"
                label="AI Coach"
                desc="Hint system for participants."
                active={draft.rules.aiCoach}
                onToggle={() => toggleRule("aiCoach")}
              />
              <RuleToggle
                icon="forum"
                label="Live Discussions"
                desc="Moderated chat channel."
                active={draft.rules.liveDiscussions}
                onToggle={() => toggleRule("liveDiscussions")}
              />
              <RuleToggle
                icon="edit"
                label="Strict Attempts"
                desc="Limit to 5 submissions."
                active={draft.rules.strictAttempts}
                onToggle={() => toggleRule("strictAttempts")}
              />
            </div>
          </section>

          {/* Problem Selection */}
          <section className="comp-glass-card space-y-6 rounded-2xl p-6 sm:p-8">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-primary">
                <span className="material-symbols-outlined">extension</span>
                <h3 className="text-lg font-bold uppercase tracking-wider">
                  Problem Selection
                </h3>
              </div>
            </div>
            {fieldErrors.problems && (
              <p className="text-xs text-error">{fieldErrors.problems}</p>
            )}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="space-y-4 lg:col-span-3">
                <div className="flex flex-wrap gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">
                      search
                    </span>
                    <input
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="Filter library..."
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm outline-none"
                    value={diffFilter}
                    onChange={(e) =>
                      setDiffFilter(
                        e.target.value as typeof diffFilter
                      )
                    }
                  >
                    <option value="ALL">All diffs</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
                  {loadingProblems ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-lg bg-surface-container-low"
                      />
                    ))
                  ) : library.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      No problems available to add.
                    </p>
                  ) : (
                    library.map((p) => {
                      const topics = parseTopics(p.topics).slice(0, 3);
                      return (
                        <div
                          key={p.id}
                          className="group flex cursor-pointer items-center justify-between rounded-lg border border-outline-variant/10 bg-surface-container-low p-3 transition-all hover:border-primary/30"
                        >
                          <div>
                            <h4 className="text-sm font-bold">{p.title}</h4>
                            <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                              <span
                                className={`font-bold ${diffClass(
                                  p.difficulty || ""
                                )}`}
                              >
                                {(p.difficulty || "—").toUpperCase()}
                              </span>
                              {topics.length > 0 && (
                                <span className="text-on-surface-variant/60">
                                  {topics.join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-on-primary"
                            onClick={() =>
                              patch({
                                selectedIds: [...draft.selectedIds, p.id],
                              })
                            }
                          >
                            <span className="material-symbols-outlined text-sm">
                              add
                            </span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex flex-col rounded-xl border border-outline-variant/10 bg-surface-container-highest/30 p-4 lg:col-span-2">
                <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">sort</span>
                  Selected Sequence ({selectedProblems.length})
                </h4>
                <div className="flex-1 space-y-3">
                  {selectedProblems.length === 0 ? (
                    <p className="text-xs text-on-surface-variant">
                      Add problems from the library.
                    </p>
                  ) : (
                    selectedProblems.map((p, index) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => onDragStart(index)}
                        onDragOver={(e: DragEvent) => e.preventDefault()}
                        onDrop={() => onDrop(index)}
                        className="flex items-center gap-3 rounded-lg border border-primary/20 bg-surface-container p-3"
                      >
                        <span className="material-symbols-outlined cursor-grab text-on-surface-variant/40">
                          drag_indicator
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold">
                            {index + 1}. {p.title}
                          </p>
                          <p className="text-[10px] text-primary">
                            {(p.difficulty || "—").toUpperCase()}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-on-surface-variant hover:text-error"
                          onClick={() =>
                            patch({
                              selectedIds: draft.selectedIds.filter(
                                (id) => id !== p.id
                              ),
                            })
                          }
                        >
                          <span className="material-symbols-outlined text-sm">
                            close
                          </span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 border-t border-outline-variant/10 pt-4 text-center">
                  <p className="text-xs text-on-surface-variant">
                    Total problems:{" "}
                    <span className="font-bold text-primary">
                      {selectedProblems.length}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Scoring — UI only */}
          <section className="comp-glass-card rounded-2xl p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined">analytics</span>
              <h3 className="text-lg font-bold uppercase tracking-wider">
                Scoring &amp; Ranking
              </h3>
            </div>
            <p className="mb-4 text-[10px] text-outline">
              UI preference only — backend uses fixed ICPC-style ranking.
            </p>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <label className="font-label-md block font-bold text-on-surface-variant">
                  Scoring Model
                </label>
                {(
                  [
                    ["progressive", "Progressive Points", "Points decay over time."],
                    ["equal", "Equal Distribution", "Fixed points per problem."],
                  ] as const
                ).map(([id, title, desc]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => patch({ scoringModel: id })}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      draft.scoringModel === id
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant/20 hover:bg-surface-variant/10"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${
                        draft.scoringModel === id
                          ? "text-primary"
                          : "text-on-surface-variant/40"
                      }`}
                    >
                      {draft.scoringModel === id
                        ? "check_circle"
                        : "radio_button_unchecked"}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{title}</p>
                      <p className="text-[11px] text-on-surface-variant">
                        {desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="font-label-md block font-bold text-on-surface-variant">
                  Ranking Rules
                </label>
                {(
                  [
                    ["icpc", "ICPC Style", "Submission time + Penalty."],
                    [
                      "codeforces",
                      "Codeforces Style",
                      "Dynamic points based on solve count.",
                    ],
                  ] as const
                ).map(([id, title, desc]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => patch({ rankingRules: id })}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      draft.rankingRules === id
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant/20 hover:bg-surface-variant/10"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${
                        draft.rankingRules === id
                          ? "text-primary"
                          : "text-on-surface-variant/40"
                      }`}
                    >
                      {draft.rankingRules === id
                        ? "check_circle"
                        : "radio_button_unchecked"}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{title}</p>
                      <p className="text-[11px] text-on-surface-variant">
                        {desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Preview */}
          <section className="comp-glass-card overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-highest/30 px-6 py-4 sm:px-8">
              <div className="flex items-center gap-3 text-on-surface">
                <span className="material-symbols-outlined">visibility</span>
                <h3 className="text-sm font-bold uppercase tracking-widest">
                  Platform Live Preview
                </h3>
              </div>
            </div>
            <div className="flex justify-center bg-[radial-gradient(circle_at_center,rgba(37,28,44,0.4),transparent)] p-8 sm:p-12">
              <div className="comp-glass-card w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl">
                <div className="relative h-28 bg-gradient-to-br from-primary-container via-primary to-surface">
                  <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <span className="rounded border border-primary/40 bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary backdrop-blur-sm">
                      {draft.contestType}
                    </span>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <h4 className="font-headline-lg text-xl font-bold text-on-surface">
                      {draft.title.trim() || "Untitled Contest"}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
                      {draft.description.trim() ||
                        "Your description will appear here."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-y border-outline-variant/10 py-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">
                        schedule
                      </span>
                      <div className="text-[10px]">
                        <p className="font-bold uppercase text-on-surface-variant/60">
                          Duration
                        </p>
                        <p className="font-bold">{durationPreview}m</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">
                        extension
                      </span>
                      <div className="text-[10px]">
                        <p className="font-bold uppercase text-on-surface-variant/60">
                          Problems
                        </p>
                        <p className="font-bold">{selectedProblems.length}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-xl bg-primary py-3 font-bold text-on-primary shadow-lg shadow-primary/20"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Mission Control */}
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="space-y-6">
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">
                Mission Control
              </h4>
              <div className="comp-glass-card rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold">Contest Status</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    DRAFTING
                  </span>
                </div>
                <div className="relative flex justify-center py-4">
                  <svg className="h-32 w-32 -rotate-90 transform">
                    <circle
                      className="text-surface-container"
                      cx="64"
                      cy="64"
                      fill="transparent"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                    />
                    <circle
                      className="text-primary transition-all duration-700"
                      cx="64"
                      cy="64"
                      fill="transparent"
                      r="58"
                      stroke="currentColor"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-headline-lg text-2xl font-bold">
                      {checklist.pct}%
                    </span>
                    <span className="text-[10px] uppercase text-on-surface-variant">
                      Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-[10px] font-bold uppercase text-on-surface-variant/60">
                Progress Checklist
              </h5>
              {(
                [
                  ["Basic Info Completed", checklist.basic],
                  ["Schedule Configured", checklist.schedule],
                  ["Rules Defined", checklist.rules],
                  ["Problem Set Verified", checklist.problemsOk],
                ] as const
              ).map(([label, ok]) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 ${ok ? "" : "opacity-50"}`}
                >
                  <span
                    className={`material-symbols-outlined text-xl ${
                      ok ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {ok ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  <span className="text-sm text-on-surface">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 opacity-50">
                <span className="material-symbols-outlined text-xl text-on-surface-variant">
                  radio_button_unchecked
                </span>
                <span className="text-sm text-on-surface">
                  Language Overrides
                </span>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <span className="material-symbols-outlined text-xl text-on-surface-variant">
                  radio_button_unchecked
                </span>
                <span className="text-sm text-on-surface">Publicity Policy</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-3 text-center">
                <p className="mb-1 text-[10px] uppercase text-on-surface-variant/60">
                  Problems
                </p>
                <p className="font-bold text-on-surface">
                  {selectedProblems.length}
                </p>
              </div>
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-3 text-center">
                <p className="mb-1 text-[10px] uppercase text-on-surface-variant/60">
                  Duration
                </p>
                <p className="font-bold text-on-surface">{durationPreview}m</p>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-high p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant/60">
                  Save state
                </span>
                <span className="text-[10px] font-bold text-secondary">
                  {saveState === "saving"
                    ? "SAVING"
                    : saveState === "dirty"
                      ? "UNSAVED"
                      : "LOCAL DRAFT"}
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant">
                Publish → POST /api/competitions/create + addProblems. No draft
                endpoint.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom action bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-20 items-center justify-between border-t border-outline-variant/10 bg-surface/90 px-4 backdrop-blur-2xl lg:left-64">
        <div className="flex items-center gap-3 text-on-surface-variant/60">
          <span className="material-symbols-outlined text-sm">
            {saveState === "saved" ? "cloud_done" : "cloud_upload"}
          </span>
          <span className="text-xs">
            {saveState === "saving"
              ? "Saving draft…"
              : saveState === "dirty"
                ? "Unsaved changes"
                : "Draft saved locally"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl px-4 py-2.5 font-label-md text-on-surface-variant transition-all hover:bg-surface-variant/10 sm:px-6"
          >
            Cancel Workspace
          </button>
          <button
            type="button"
            onClick={() => {
              persistDraft(draft);
              setMessage("Draft saved on this device.");
            }}
            className="rounded-xl border border-outline-variant/30 px-4 py-2.5 font-label-md text-on-surface transition-all hover:bg-surface-variant/20 sm:px-6"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void publish()}
            className="rounded-xl bg-primary px-6 py-2.5 font-label-md font-bold text-on-primary shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-60 sm:px-8"
          >
            {busy ? "Publishing…" : "Finalize & Publish"}
          </button>
        </div>
      </footer>
    </div>
  );
}
