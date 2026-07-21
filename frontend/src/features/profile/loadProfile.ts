import {
  getMyProfile,
  getPublicProfile,
  type ProfileResponse,
} from "../../lib/api";
import type {
  Achievement,
  ProfileViewModel,
} from "./types";

function normalizeAchievements(raw: unknown[]): Achievement[] {
  return (raw || [])
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = typeof row.title === "string" ? row.title : null;
      if (!title) return null;
      return {
        id: typeof row.id === "string" ? row.id : `achievement-${index}`,
        title,
        description:
          typeof row.description === "string" ? row.description : "",
        earned: Boolean(row.earned ?? true),
      } satisfies Achievement;
    })
    .filter((a): a is Achievement => Boolean(a));
}

export function toProfileViewModel(
  response: ProfileResponse,
  isOwner: boolean
): ProfileViewModel {
  return {
    ...response,
    identity: {
      ...response.identity,
      role: response.identity.role === "ADMIN" ? "ADMIN" : "USER",
      showEmail: Boolean(response.identity.showEmail),
    },
    stats: {
      ...response.stats,
      rating: response.stats.rating ?? null,
      contestBestRank: response.stats.contestBestRank ?? null,
    },
    languages: (response.languages || []).map((lang) => ({
      ...lang,
      percent: Number(lang.percent) || 0,
    })),
    achievements: normalizeAchievements(response.achievements || []),
    personalBests: response.personalBests || {
      fastestAccepted: null,
      hardestSolved: null,
    },
    isOwner,
  };
}

export async function loadOwnerProfile(): Promise<ProfileViewModel> {
  const response = await getMyProfile();
  return toProfileViewModel(response, true);
}

export async function loadPublicProfile(
  username: string
): Promise<ProfileViewModel> {
  const response = await getPublicProfile(username);
  return toProfileViewModel(response, false);
}
