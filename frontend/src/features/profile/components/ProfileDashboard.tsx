import { Link, useSearchParams } from "react-router-dom";
import type { ProfileTab, ProfileViewModel } from "../types";
import ProfileHeader from "./ProfileHeader";
import ProfileStatsGrid from "./ProfileStatsGrid";
import ContributionHeatmap from "./ContributionHeatmap";
import {
  ActivityBars,
  DifficultyProgress,
  LanguageBreakdown,
  TopicProgressList,
} from "./ProgressPanels";
import {
  AchievementsPanel,
  ContinuePanel,
  ContestHistoryPanel,
  PersonalBestsPanel,
  ProblemListPanel,
  RecentSubmissionsPanel,
} from "./HistoryPanels";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "submissions", label: "Submissions" },
  { id: "contests", label: "Contests" },
  { id: "saved", label: "Saved" },
];

export default function ProfileDashboard({
  profile,
}: {
  profile: ProfileViewModel;
}) {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as ProfileTab) || "overview";
  const active = TABS.some((t) => t.id === tab) ? tab : "overview";

  const setTab = (next: ProfileTab) => {
    const copy = new URLSearchParams(params);
    if (next === "overview") copy.delete("tab");
    else copy.set("tab", next);
    setParams(copy, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <div className="rounded-xl border border-[var(--warn)]/25 bg-[var(--warn)]/5 px-4 py-3 text-sm text-[var(--text-dim)]">
        <span className="font-medium text-[var(--warn)]">Demo analytics:</span>{" "}
        {profile.demoSections.join(", ")}. Real solved counts, acceptance, and
        language usage come from your submissions.
      </div>

      <ProfileHeader identity={profile.identity} isOwner={profile.isOwner} />
      <ProfileStatsGrid stats={profile.stats} />

      <div
        role="tablist"
        aria-label="Profile sections"
        className="flex flex-wrap gap-1 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              active === t.id
                ? "bg-[var(--bg-inset)] text-[var(--text)]"
                : "text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "overview" && (
        <div className="space-y-4">
          <ContinuePanel
            problem={profile.continueProblem}
            activeContest={profile.activeContest}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ContributionHeatmap days={profile.heatmap} demo />
            <DifficultyProgress difficulty={profile.stats.difficulty} />
            <ActivityBars
              title="Weekly activity"
              buckets={profile.weeklyActivity}
              demo
            />
            <ActivityBars
              title="Monthly activity"
              buckets={profile.monthlyActivity}
              demo
            />
            <TopicProgressList topics={profile.topics} />
            <LanguageBreakdown languages={profile.languages} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <PersonalBestsPanel bests={profile.personalBests} />
            <AchievementsPanel achievements={profile.achievements} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ProblemListPanel
              title="Recently solved"
              problems={profile.recentSolved}
              empty="Accepted problems will appear here."
            />
            <RecentSubmissionsPanel rows={profile.recentSubmissions.slice(0, 8)} />
          </div>
        </div>
      )}

      {active === "submissions" && (
        <RecentSubmissionsPanel rows={profile.recentSubmissions} />
      )}

      {active === "contests" && (
        <ContestHistoryPanel rows={profile.contestHistory} />
      )}

      {active === "saved" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ProblemListPanel
            title="Bookmarked problems"
            problems={profile.bookmarked}
            empty="Bookmark problems from the problem page."
          />
          <ProblemListPanel
            title="Recently viewed"
            problems={profile.recentlyViewed}
            empty="Open a problem to start your trail."
          />
          {profile.isOwner && (
            <div className="lg:col-span-2">
              <Link
                to="/settings/profile"
                className="text-sm text-[var(--info)] hover:underline"
              >
                Manage profile settings →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
