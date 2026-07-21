export type FilterChipOption<T extends string = string> = {
  value: T;
  label: string;
  count?: number;
};

type FilterChipsProps<T extends string> = {
  options: readonly FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
};

export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label = "Filters",
  className = "",
}: FilterChipsProps<T>) {
  return (
    <div
      aria-label={label}
      className={`flex max-w-full gap-2 overflow-x-auto pb-1 ${className}`}
      role="group"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            aria-pressed={selected}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
              selected
                ? "border-[var(--accent)] bg-[var(--accent)] text-[#0a0d12]"
                : "border-[var(--line)] bg-[var(--bg-raised)] text-[var(--text-dim)] hover:border-[var(--accent)]/50 hover:text-[var(--text)]"
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
            {option.count != null && (
              <span className="ml-1 opacity-75">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
