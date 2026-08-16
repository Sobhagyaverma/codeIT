import type { DsaTreeFolderDTO, DsaTreeProblemDTO } from "../../lib/api";
import type { ProblemPublicDTO, Submission } from "../../lib/authStorage";
import { buildPracticeCatalog } from "../practice/adapters";
import type {
  DifficultyProgress,
  PracticeCatalogData,
  PracticeModule,
  PracticeProblem,
  PracticeProblemStatus,
} from "../practice/types";
import { parseTopics } from "../practice/utils";

function isAccepted(submission: Submission): boolean {
  const raw = (submission.verdict || "").trim().toUpperCase();
  return raw === "ACCEPTED" || raw.startsWith("ACCEPTED");
}

function statusFor(submissions: Submission[]): PracticeProblemStatus {
  if (submissions.some(isAccepted)) return "SOLVED";
  return submissions.length > 0 ? "ATTEMPTED" : "NOT_STARTED";
}

function emptyDifficulty(): DifficultyProgress {
  return {
    easy: { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard: { solved: 0, total: 0 },
  };
}

function difficultyKey(
  difficulty: string
): "easy" | "medium" | "hard" | undefined {
  const key = difficulty.trim().toLowerCase();
  return key === "easy" || key === "medium" || key === "hard" ? key : undefined;
}

function collectProblems(folder: DsaTreeFolderDTO): DsaTreeProblemDTO[] {
  const out: DsaTreeProblemDTO[] = [...folder.problems];
  for (const child of folder.children) {
    out.push(...collectProblems(child));
  }
  return out;
}

function toPracticeProblem(
  node: DsaTreeProblemDTO,
  statusMap: Map<number, PracticeProblemStatus>
): PracticeProblem {
  return {
    id: node.id,
    title: node.title,
    difficulty: node.difficulty,
    topics: parseTopics(node.topics),
    status: statusMap.get(node.id) ?? "NOT_STARTED",
    bookmarked: false,
    lastAttemptAt: null,
    lastSolvedAt: null,
    acceptanceRate: null,
    solvedCount: null,
    submissionCount: null,
    createdAt: null,
    companyTags: null,
    isPremium: null,
    markedForRevision: false,
    notesAvailable: false,
  };
}

function buildModuleFromFolder(
  folder: DsaTreeFolderDTO,
  statusMap: Map<number, PracticeProblemStatus>
): PracticeModule {
  const seen = new Set<number>();
  const problems: PracticeProblem[] = [];
  for (const node of collectProblems(folder)) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    problems.push(toPracticeProblem(node, statusMap));
  }

  const difficulty = emptyDifficulty();
  let solved = 0;
  for (const problem of problems) {
    if (problem.status === "SOLVED") solved += 1;
    const key = difficultyKey(problem.difficulty);
    if (!key) continue;
    difficulty[key].total += 1;
    if (problem.status === "SOLVED") difficulty[key].solved += 1;
  }

  return {
    id: String(folder.id),
    title: folder.name,
    description: folder.description || "",
    problems,
    solved,
    total: problems.length,
    percent: problems.length ? Math.round((solved / problems.length) * 100) : 0,
    difficulty,
  };
}

/**
 * Build learner catalog from the persisted DSA sheet tree.
 * Falls back to topic-alias bucketing when the tree is empty.
 */
export function buildPracticeCatalogFromDsaTree(
  tree: DsaTreeFolderDTO[],
  allProblems: ProblemPublicDTO[],
  submissions: Submission[]
): PracticeCatalogData {
  const base = buildPracticeCatalog(allProblems, submissions);
  if (!tree.length) {
    return base;
  }

  const submissionsByProblem = new Map<number, Submission[]>();
  for (const submission of submissions) {
    const existing = submissionsByProblem.get(submission.problemId) ?? [];
    existing.push(submission);
    submissionsByProblem.set(submission.problemId, existing);
  }

  const statusMap = new Map<number, PracticeProblemStatus>();
  for (const problem of allProblems) {
    statusMap.set(problem.id, statusFor(submissionsByProblem.get(problem.id) ?? []));
  }

  const modules = tree.map((folder) => buildModuleFromFolder(folder, statusMap));

  // Prefer sheet modules; keep base stats/problems for filters & pattern section
  return {
    ...base,
    modules,
  };
}
