import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Editor from "@monaco-editor/react";
import { createProblem } from "../lib/api";
import { CODEIT_THEME, defineCodeitTheme } from "../lib/monacoTheme";
import { useAuth } from "../context/AuthContext";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type ExampleRow = { input: string; output: string; explanation: string };
type TestRow = { input: string; output: string };
type Lang = "python" | "java" | "cpp";

const DRAFT_KEY = "codeit.stitch.problemStudio.draft";

const STARTER: Record<Lang, string> = {
  python: `class Solution:
    def solve(self):
        # Write your solution here
        pass
`,
  java: `class Solution {
    public void solve() {
        // Write your solution here
    }
}
`,
  cpp: `class Solution {
public:
    void solve() {
        // Write your solution here
    }
};
`,
};

type StudioDraft = {
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: ExampleRow[];
  hiddenTests: TestRow[];
  starters: Record<Lang, string>;
  activeLang: Lang;
  timeLimitMs: number;
  memoryMb: number;
};

const emptyDraft = (): StudioDraft => ({
  title: "",
  slug: "",
  difficulty: "MEDIUM",
  tags: [],
  description: "",
  inputFormat: "",
  outputFormat: "",
  constraints: [""],
  examples: [{ input: "", output: "", explanation: "" }],
  hiddenTests: [],
  starters: { ...STARTER },
  activeLang: "python",
  timeLimitMs: 1000,
  memoryMb: 256,
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

type Props = {
  onBack: () => void;
  onPublished: () => void;
};

export default function AdminProblemStudio({ onBack, onPublished }: Props) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<StudioDraft>(() => loadDraft());
  const [tagInput, setTagInput] = useState("");
  const [open, setOpen] = useState({
    info: true,
    statement: true,
    examples: true,
    code: true,
    hidden: true,
    judge: true,
  });
  const [statementMode, setStatementMode] = useState<"write" | "preview">(
    "write"
  );
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">(
    "saved"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  const saveTimer = useRef<number | null>(null);

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
    saveTimer.current = window.setTimeout(() => {
      persistDraft(draft);
    }, 900);
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

  const checklist = useMemo(() => {
    const meta = Boolean(draft.title.trim()) && Boolean(draft.difficulty);
    const content = draft.description.trim().length >= 20;
    const examplesOk = draft.examples.some(
      (ex) => ex.input.trim() && ex.output.trim()
    );
    const hiddenCount = draft.hiddenTests.filter(
      (t) => t.input.trim() && t.output.trim()
    ).length;
    const hiddenTarget = 10;
    const hiddenOk = hiddenCount >= hiddenTarget;
    const done = [meta, content, examplesOk, hiddenOk].filter(Boolean).length;
    const pct = Math.round((done / 4) * 100);
    return {
      meta,
      content,
      examplesOk,
      hiddenCount,
      hiddenOk,
      hiddenMissing: Math.max(0, hiddenTarget - hiddenCount),
      pct,
    };
  }, [draft]);

  const circumference = 2 * Math.PI * 72;
  const dashOffset =
    circumference - (checklist.pct / 100) * circumference;

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || draft.tags.includes(t)) return;
    patch({ tags: [...draft.tags, t] });
    setTagInput("");
  };

  const buildDescription = () => {
    let desc = draft.description.trim();
    if (draft.inputFormat.trim()) {
      desc += `\n\n### Input Format\n${draft.inputFormat.trim()}`;
    }
    if (draft.outputFormat.trim()) {
      desc += `\n\n### Output Format\n${draft.outputFormat.trim()}`;
    }
    return desc;
  };

  const publish = async () => {
    setError(null);
    setMessage(null);
    if (!draft.title.trim()) {
      setError("Problem title is required.");
      return;
    }
    if (!draft.description.trim()) {
      setError("Problem statement is required.");
      return;
    }
    setBusy(true);
    try {
      const examples = draft.examples
        .filter((ex) => ex.input.trim() || ex.output.trim())
        .map((ex) => ({
          input: ex.input,
          output: ex.output,
          explanation: ex.explanation || undefined,
        }));
      const constraints = draft.constraints
        .map((c) => c.trim())
        .filter(Boolean);
      const testCases = draft.hiddenTests
        .filter((t) => t.input.trim() && t.output.trim())
        .map((t) => ({ input: t.input, output: t.output }));

      // Problem entity fields only (JSONB columns expect JSON text)
      await createProblem({
        title: draft.title.trim(),
        description: buildDescription(),
        difficulty: draft.difficulty,
        topics: JSON.stringify(draft.tags),
        examples: JSON.stringify(examples),
        constraintsData: JSON.stringify(constraints),
        testCases: JSON.stringify(testCases),
      });

      localStorage.removeItem(DRAFT_KEY);
      dirtyRef.current = false;
      setDraft(emptyDraft());
      setSaveState("saved");
      setMessage("Problem published successfully.");
      onPublished();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  };

  const commitDraft = () => {
    persistDraft(draft);
    setMessage("Draft saved locally on this device.");
  };

  const toggle = (key: keyof typeof open) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const initials = (user?.name || "A")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sectionShell = (
    id: keyof typeof open,
    icon: string,
    title: string,
    iconClass: string,
    children: ReactNode,
    extraHeader?: ReactNode
  ) => (
    <section
      className={`obsidian-glass overflow-hidden rounded-xl ${
        open[id] ? "studio-accordion-open" : ""
      }`}
    >
      <div className="flex w-full items-center justify-between p-6">
        <button
          type="button"
          className={`flex items-center gap-4 ${iconClass}`}
          onClick={() => toggle(id)}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        </button>
        <div className="flex items-center gap-3">
          {extraHeader}
          <button type="button" onClick={() => toggle(id)}>
            <span className="material-symbols-outlined studio-chevron transition-transform duration-300">
              expand_more
            </span>
          </button>
        </div>
      </div>
      <div className="studio-accordion-content px-6">{children}</div>
    </section>
  );

  return (
    <div className="admin-problem-studio mx-auto w-full max-w-[1600px]">
      {/* Studio header strip */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <button
            type="button"
            onClick={onBack}
            className="material-symbols-outlined text-sm hover:text-primary"
            title="Back"
          >
            home
          </button>
          <span className="text-xs">/</span>
          <span className="text-xs font-medium">Content Studio</span>
          <span className="text-xs">/</span>
          <span className="text-xs font-bold text-[#a855f7]">
            Problem Architect
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-bold ${
              saveState === "saving"
                ? "border-[#a855f7]/40 bg-[#a855f7]/10 text-[#a855f7]"
                : "bg-surface-container"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                saveState === "dirty"
                  ? "bg-amber-400"
                  : saveState === "saving"
                    ? "bg-[#a855f7] animate-pulse"
                    : "bg-green-400 animate-pulse"
              }`}
            />
            <span>
              {saveState === "saving"
                ? "Saving modifications..."
                : saveState === "dirty"
                  ? "Unsaved changes"
                  : "Saved just now"}
            </span>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-xs font-bold leading-none text-on-surface">
                {user?.name ?? "Admin"}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                Lead Architect
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#a855f7]/50 bg-[#a855f7]/20 text-xs font-bold text-[#a855f7]">
              {initials}
            </div>
          </div>
        </div>
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

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-10">
        <div className="space-y-6 xl:col-span-7">
          {sectionShell(
            "info",
            "info",
            "Problem Information",
            "text-[#a855f7]",
            <div className="grid grid-cols-1 gap-6 pb-6 pt-2 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Problem Title
                </label>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-[#130b1a] px-4 py-3 font-medium text-on-surface outline-none transition-all focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7]"
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="Longest Substring Without Repeating Characters"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  URL Slug
                </label>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-[#130b1a]/50 px-4 py-3 font-mono text-sm text-on-surface-variant outline-none"
                  value={draft.slug}
                  onChange={(e) => patch({ slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                />
                <p className="text-[10px] text-outline">
                  Slug is UI-only (not stored by current Problem API).
                </p>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Difficulty Level
                </label>
                <div className="flex gap-3">
                  {(
                    [
                      ["EASY", "Easy", "bg-green-500", "hover:bg-green-500/10 hover:border-green-500/50"],
                      ["MEDIUM", "Medium", "bg-[#a855f7]", ""],
                      ["HARD", "Hard", "bg-rose-500", "hover:bg-rose-500/10 hover:border-rose-500/50"],
                    ] as const
                  ).map(([val, label, dot, hover]) => {
                    const active = draft.difficulty === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => patch({ difficulty: val })}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                          active
                            ? "border-2 border-[#a855f7] bg-[#a855f7]/10 font-black text-[#a855f7]"
                            : `border border-outline-variant ${hover}`
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${dot} ${
                            active && val === "MEDIUM"
                              ? "shadow-[0_0_8px_#a855f7]"
                              : ""
                          }`}
                        />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Topic Tags
                </label>
                <div className="flex min-h-[48px] flex-wrap items-center gap-2 rounded-lg border border-outline-variant bg-[#130b1a] p-2.5">
                  {draft.tags.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-2 rounded border border-[#a855f7]/30 bg-[#a855f7]/20 px-3 py-1 text-xs font-bold text-[#a855f7]"
                    >
                      {t}
                      <button
                        type="button"
                        className="material-symbols-outlined text-xs"
                        onClick={() =>
                          patch({ tags: draft.tags.filter((x) => x !== t) })
                        }
                      >
                        close
                      </button>
                    </span>
                  ))}
                  <input
                    className="bg-transparent px-2 py-1 text-sm outline-none placeholder:text-on-surface-variant/40"
                    placeholder="+ Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {sectionShell(
            "statement",
            "description",
            "Problem Statement",
            "text-[#a855f7]",
            <div className="space-y-4 pb-6">
              <div className="overflow-hidden rounded-lg border border-outline-variant">
                <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-high p-3">
                  <div className="flex gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined p-2 text-[20px]">
                      format_bold
                    </span>
                    <span className="material-symbols-outlined p-2 text-[20px]">
                      format_italic
                    </span>
                    <span className="material-symbols-outlined p-2 text-[20px]">
                      code
                    </span>
                  </div>
                  <div className="flex rounded-md bg-[#130b1a] p-1">
                    <button
                      type="button"
                      onClick={() => setStatementMode("write")}
                      className={`rounded px-4 py-1 text-[10px] font-black ${
                        statementMode === "write"
                          ? "bg-[#a855f7] text-white"
                          : "text-on-surface-variant"
                      }`}
                    >
                      WRITE
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatementMode("preview")}
                      className={`rounded px-4 py-1 text-[10px] font-black ${
                        statementMode === "preview"
                          ? "bg-[#a855f7] text-white"
                          : "text-on-surface-variant"
                      }`}
                    >
                      PREVIEW
                    </button>
                  </div>
                </div>
                {statementMode === "write" ? (
                  <textarea
                    className="h-64 w-full resize-none border-none bg-[#130b1a] p-6 font-mono text-sm outline-none"
                    placeholder="Enter problem markdown here..."
                    value={draft.description}
                    onChange={(e) => patch({ description: e.target.value })}
                  />
                ) : (
                  <pre className="h-64 overflow-auto whitespace-pre-wrap bg-[#130b1a] p-6 font-mono text-sm text-on-surface-variant">
                    {draft.description || "Nothing to preview."}
                  </pre>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Input Format
                  </label>
                  <textarea
                    rows={3}
                    className="w-full resize-y rounded-lg border border-outline-variant bg-[#130b1a] px-3 py-2 text-sm outline-none focus:border-[#a855f7]"
                    value={draft.inputFormat}
                    onChange={(e) => patch({ inputFormat: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Output Format
                  </label>
                  <textarea
                    rows={3}
                    className="w-full resize-y rounded-lg border border-outline-variant bg-[#130b1a] px-3 py-2 text-sm outline-none focus:border-[#a855f7]"
                    value={draft.outputFormat}
                    onChange={(e) => patch({ outputFormat: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Constraints
                </label>
                {draft.constraints.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-[#130b1a] px-3 py-2 text-sm outline-none focus:border-[#a855f7]"
                      value={c}
                      onChange={(e) => {
                        const next = [...draft.constraints];
                        next[i] = e.target.value;
                        patch({ constraints: next });
                      }}
                      placeholder="1 <= n <= 10^5"
                    />
                    <button
                      type="button"
                      className="rounded-lg border border-outline-variant px-2 text-outline hover:text-error"
                      onClick={() =>
                        patch({
                          constraints: draft.constraints.filter(
                            (_, idx) => idx !== i
                          ),
                        })
                      }
                    >
                      <span className="material-symbols-outlined text-lg">
                        delete
                      </span>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs font-bold text-[#a855f7]"
                  onClick={() =>
                    patch({ constraints: [...draft.constraints, ""] })
                  }
                >
                  + Add constraint
                </button>
              </div>
            </div>
          )}

          {sectionShell(
            "examples",
            "data_object",
            "Public Examples",
            "text-[#a855f7]",
            <div className="space-y-4 pb-6">
              {draft.examples.map((ex, index) => (
                <div
                  key={index}
                  className="group relative rounded-xl border border-outline-variant bg-surface-container/50 p-5 transition-all hover:border-[#a855f7]/50"
                >
                  <div className="absolute right-5 top-5 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-lg bg-surface-container-high p-2 hover:text-rose-500"
                      onClick={() =>
                        patch({
                          examples: draft.examples.filter((_, i) => i !== index),
                        })
                      }
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-lg">
                        delete
                      </span>
                    </button>
                  </div>
                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                        Input
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded border border-outline-variant/30 bg-[#130b1a] p-3 font-mono text-xs text-[#a855f7] outline-none"
                        value={ex.input}
                        onChange={(e) => {
                          const next = [...draft.examples];
                          next[index] = { ...ex, input: e.target.value };
                          patch({ examples: next });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                        Output
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded border border-outline-variant/30 bg-[#130b1a] p-3 font-mono text-xs text-[#a855f7] outline-none"
                        value={ex.output}
                        onChange={(e) => {
                          const next = [...draft.examples];
                          next[index] = { ...ex, output: e.target.value };
                          patch({ examples: next });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                      Explanation
                    </label>
                    <textarea
                      rows={2}
                      className="w-full resize-none rounded border border-outline-variant/30 bg-[#130b1a]/30 p-3 text-xs italic text-on-surface-variant outline-none"
                      value={ex.explanation}
                      onChange={(e) => {
                        const next = [...draft.examples];
                        next[index] = { ...ex, explanation: e.target.value };
                        patch({ examples: next });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>,
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/10 px-4 py-2 text-xs font-bold text-[#a855f7] transition-all hover:bg-[#a855f7] hover:text-white"
              onClick={() =>
                patch({
                  examples: [
                    ...draft.examples,
                    { input: "", output: "", explanation: "" },
                  ],
                })
              }
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Example
            </button>
          )}

          {sectionShell(
            "code",
            "terminal",
            "Starter Code Studio",
            "text-[#a855f7]",
            <div className="pb-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {(
                    [
                      ["python", "Python 3"],
                      ["java", "Java"],
                      ["cpp", "C++"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => patch({ activeLang: id })}
                      className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                        draft.activeLang === id
                          ? "border border-[#a855f7]/40 bg-[#a855f7]/20 text-[#a855f7]"
                          : "hover:bg-surface-container-highest"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Active Template
                </span>
              </div>
              <div className="min-h-[320px] overflow-hidden rounded-xl border border-outline-variant bg-[#0c0512]">
                <Editor
                  height="320px"
                  language={
                    draft.activeLang === "cpp" ? "cpp" : draft.activeLang
                  }
                  theme={CODEIT_THEME}
                  value={draft.starters[draft.activeLang]}
                  onChange={(value) =>
                    patch({
                      starters: {
                        ...draft.starters,
                        [draft.activeLang]: value ?? "",
                      },
                    })
                  }
                  beforeMount={(monaco) => defineCodeitTheme(monaco)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "JetBrains Mono, monospace",
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                  }}
                />
              </div>
              <p className="mt-2 text-[10px] text-outline">
                Starter templates are saved in local draft only — current Problem
                API has no starter-code field.
              </p>
            </div>
          )}

          {sectionShell(
            "hidden",
            "visibility_off",
            "Hidden Validation Suite",
            "text-rose-400",
            <div className="space-y-4 pb-6">
              {draft.hiddenTests.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-outline-variant p-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
                    <span className="material-symbols-outlined text-3xl opacity-30">
                      shield_lock
                    </span>
                  </div>
                  <p className="mb-1 font-bold text-on-surface">
                    No hidden tests configured.
                  </p>
                  <p className="max-w-xs text-xs text-on-surface-variant">
                    Add hidden test cases for judging. Backend stores them as{" "}
                    <code className="text-[#a855f7]">testCases</code>.
                  </p>
                </div>
              ) : (
                draft.hiddenTests.map((t, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-outline-variant p-4 md:grid-cols-[1fr_1fr_auto]"
                  >
                    <textarea
                      rows={3}
                      className="rounded border border-outline-variant/30 bg-[#130b1a] p-2 font-mono text-xs outline-none"
                      placeholder="Input"
                      value={t.input}
                      onChange={(e) => {
                        const next = [...draft.hiddenTests];
                        next[index] = { ...t, input: e.target.value };
                        patch({ hiddenTests: next });
                      }}
                    />
                    <textarea
                      rows={3}
                      className="rounded border border-outline-variant/30 bg-[#130b1a] p-2 font-mono text-xs outline-none"
                      placeholder="Output"
                      value={t.output}
                      onChange={(e) => {
                        const next = [...draft.hiddenTests];
                        next[index] = { ...t, output: e.target.value };
                        patch({ hiddenTests: next });
                      }}
                    />
                    <button
                      type="button"
                      className="text-outline hover:text-rose-500"
                      onClick={() =>
                        patch({
                          hiddenTests: draft.hiddenTests.filter(
                            (_, i) => i !== index
                          ),
                        })
                      }
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>,
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 transition-all hover:bg-rose-500 hover:text-white"
              onClick={() =>
                patch({
                  hiddenTests: [
                    ...draft.hiddenTests,
                    { input: "", output: "" },
                  ],
                })
              }
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Test Case
            </button>
          )}

          {sectionShell(
            "judge",
            "settings_suggest",
            "Judge Configuration",
            "text-[#a855f7]",
            <div className="grid grid-cols-1 gap-6 pb-6 md:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant bg-surface-container-high/50 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#a855f7]">
                      timer
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      Execution Timeout
                    </h3>
                  </div>
                  <span className="text-lg font-black text-[#a855f7]">
                    {draft.timeLimitMs}
                    <span className="ml-1 text-xs font-bold uppercase opacity-60">
                      ms
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  value={draft.timeLimitMs}
                  onChange={(e) =>
                    patch({ timeLimitMs: Number(e.target.value) })
                  }
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#130b1a] accent-[#a855f7]"
                />
                <p className="mt-3 text-[10px] text-outline">
                  UI preference only — not on Problem DTO.
                </p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-high/50 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#a855f7]">
                      memory
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      Memory Allocation
                    </h3>
                  </div>
                  <span className="text-lg font-black text-[#a855f7]">
                    {draft.memoryMb}
                    <span className="ml-1 text-xs font-bold uppercase opacity-60">
                      mb
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={64}
                  max={1024}
                  value={draft.memoryMb}
                  onChange={(e) => patch({ memoryMb: Number(e.target.value) })}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#130b1a] accent-[#a855f7]"
                />
                <p className="mt-3 text-[10px] text-outline">
                  UI preference only — not on Problem DTO.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mission Control */}
        <aside className="xl:col-span-3">
          <div className="sticky top-24 space-y-6">
            <div className="obsidian-glass neon-accent-border rounded-2xl p-6 shadow-xl">
              <div className="mb-8">
                <h3 className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#a855f7]">
                  Mission Control
                </h3>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  <span className="font-bold text-on-surface">
                    Architectural Draft
                  </span>
                </div>
              </div>

              <div className="mb-8 flex flex-col items-center">
                <div className="relative h-40 w-40">
                  <svg className="h-full w-full -rotate-90 transform">
                    <circle
                      className="text-surface-container-highest"
                      cx="80"
                      cy="80"
                      fill="transparent"
                      r="72"
                      stroke="currentColor"
                      strokeWidth="8"
                    />
                    <circle
                      className="text-[#a855f7] transition-all duration-700"
                      cx="80"
                      cy="80"
                      fill="transparent"
                      r="72"
                      stroke="currentColor"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      strokeWidth="10"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-on-surface">
                      {checklist.pct}%
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      Ready
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {(
                  [
                    ["Basic Meta Information", checklist.meta],
                    ["Content Specification", checklist.content],
                    ["Public Example Suite", checklist.examplesOk],
                  ] as const
                ).map(([label, ok]) => (
                  <div key={label} className="flex items-center gap-4">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        ok
                          ? "border-green-500/40 bg-green-500/20"
                          : "border-outline-variant bg-surface-container"
                      }`}
                    >
                      {ok ? (
                        <span
                          className="material-symbols-outlined text-sm text-green-500"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-on-surface-variant">
                          0
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        ok ? "text-on-surface" : "text-on-surface-variant"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-surface-container">
                    <span className="text-[10px] font-bold text-on-surface-variant">
                      {checklist.hiddenCount}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-on-surface-variant">
                      Hidden Test Matrix
                    </span>
                    {!checklist.hiddenOk && (
                      <p className="mt-0.5 text-[8px] font-bold uppercase tracking-tighter text-rose-400">
                        Missing {checklist.hiddenMissing} entries
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setStatementMode("preview");
                  setOpen((o) => ({ ...o, statement: true }));
                }}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container py-4 text-xs font-black text-on-surface transition-all hover:-translate-y-0.5 hover:border-[#a855f7]/50"
              >
                <span className="material-symbols-outlined text-lg">
                  visibility
                </span>
                PREVIEW WORKSPACE
              </button>
              <button
                type="button"
                onClick={commitDraft}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container py-4 text-xs font-black text-on-surface transition-all hover:-translate-y-0.5 hover:border-[#a855f7]/50"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                COMMIT TO DRAFT
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void publish()}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#a855f7] py-5 text-sm font-black text-white shadow-[0_10px_30px_rgba(168,85,247,0.3)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  rocket_launch
                </span>
                {busy ? "PUBLISHING…" : "PUBLISH ARCHITECTURE"}
              </button>
            </div>

            <div className="rounded-2xl border border-[#a855f7]/20 bg-[#a855f7]/5 p-6">
              <div className="mb-3 flex items-center gap-2 text-[#a855f7]">
                <span className="material-symbols-outlined text-lg">
                  feedback
                </span>
                <h4 className="text-[10px] font-black uppercase tracking-widest">
                  Architect&apos;s Note
                </h4>
              </div>
              <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
                Publish maps to{" "}
                <span className="text-[#a855f7]">POST /api/problems</span> using
                the Problem DTO. Draft/autosave is local until update/draft APIs
                exist.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
