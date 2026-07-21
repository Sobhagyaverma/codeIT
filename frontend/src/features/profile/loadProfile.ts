import {
  getAllCompetitions,
  getLeaderboard,
  getProblems,
  getUserSubmissions,
} from "../../lib/api";
import type { LeaderboardEntry, User } from "../../lib/types";
import { buildProfileViewModel } from "./buildProfile";
import type { ProfileViewModel } from "./types";

export async function loadOwnerProfile(user: User): Promise<ProfileViewModel> {
  const [submissions, problems, competitions] = await Promise.all([
    getUserSubmissions(user.id).catch(() => []),
    getProblems().catch(() => []),
    getAllCompetitions().catch(() => []),
  ]);

  const competitionIds = competitions.slice(0, 12).map((c) => c.id);
  const boards = await Promise.all(
    competitionIds.map(async (id) => {
      try {
        const board = await getLeaderboard(id);
        return [id, board] as const;
      } catch {
        return [id, [] as LeaderboardEntry[]] as const;
      }
    })
  );

  const leaderboards: Record<number, LeaderboardEntry[]> = {};
  for (const [id, board] of boards) {
    leaderboards[id] = board;
  }

  return buildProfileViewModel({
    user,
    isOwner: true,
    submissions,
    problems,
    competitions,
    leaderboards,
  });
}
