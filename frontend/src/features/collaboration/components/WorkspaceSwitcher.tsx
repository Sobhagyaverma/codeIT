type Props = {
  workspace: "CODE" | "WHITEBOARD";
  isHost: boolean;
  onChange: (workspace: "CODE" | "WHITEBOARD") => void;
};

export default function WorkspaceSwitcher({
  workspace,
  isHost,
  onChange,
}: Props) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] p-0.5 text-sm">
      {(["CODE", "WHITEBOARD"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          disabled={!isHost && tab !== workspace}
          onClick={() => isHost && onChange(tab)}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            workspace === tab
              ? "bg-[var(--accent)] text-[#0a0d12]"
              : "text-[var(--text-dim)] hover:text-[var(--text)]"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {tab === "CODE" ? "Code" : "Whiteboard"}
        </button>
      ))}
      {!isHost && (
        <span className="ml-2 self-center text-[10px] text-[var(--text-dim)]">
          Host controls view
        </span>
      )}
    </div>
  );
}
