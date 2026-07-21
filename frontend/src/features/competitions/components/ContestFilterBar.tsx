import SearchBar from "../../practice/components/SearchBar";
import FilterChips from "../../practice/components/FilterChips";
import type { ContestStatus, ContestType } from "../types";

export type ContestFilters = {
  q: string;
  status: ContestStatus | "ALL";
  contestType: ContestType | "ALL";
  sort: "newest" | "oldest";
};

export default function ContestFilterBar({
  filters,
  onChange,
  showTypeFilter,
}: {
  filters: ContestFilters;
  onChange: (next: Partial<ContestFilters>) => void;
  showTypeFilter: boolean;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/70 p-3 practice-glass sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchBar
          value={filters.q}
          onChange={(q) => onChange({ q })}
          placeholder="Search contests…"
          label="Search contests"
          className="flex-1"
        />
        <label className="sr-only" htmlFor="contest-sort">
          Sort contests
        </label>
        <select
          id="contest-sort"
          value={filters.sort}
          onChange={(e) =>
            onChange({ sort: e.target.value as ContestFilters["sort"] })
          }
          className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--info)] focus:outline-none"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      <FilterChips
        label="Status"
        value={filters.status}
        onChange={(status) => onChange({ status })}
        options={[
          { value: "ALL", label: "All" },
          { value: "ACTIVE", label: "Live" },
          { value: "UPCOMING", label: "Upcoming" },
          { value: "ENDED", label: "Past" },
        ]}
      />

      {showTypeFilter && (
        <FilterChips
          label="Contest type"
          value={filters.contestType ?? "ALL"}
          onChange={(contestType) =>
            onChange({
              contestType: contestType as ContestFilters["contestType"],
            })
          }
          options={[
            { value: "ALL", label: "All types" },
            { value: "WEEKLY", label: "Weekly" },
            { value: "BIWEEKLY", label: "Biweekly" },
            { value: "MONTHLY", label: "Monthly" },
            { value: "PRACTICE", label: "Practice" },
          ]}
        />
      )}
    </div>
  );
}
