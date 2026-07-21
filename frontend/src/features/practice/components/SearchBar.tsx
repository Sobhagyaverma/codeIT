import { Search, X } from "lucide-react";
import { useId, type ChangeEventHandler } from "react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
};

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search problems",
  label = "Search problems",
  className = "",
}: SearchBarProps) {
  const inputId = useId();
  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onChange(event.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-dim)]"
      />
      <input
        id={inputId}
        className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] py-2.5 pl-9 pr-9 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        onChange={handleChange}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {value && (
        <button
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-[var(--text-dim)] hover:bg-[var(--bg-raised)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          onClick={() => onChange("")}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}
