export type DsaSheet = {
  id: number;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DsaTreeProblem = {
  id: number;
  title: string;
  difficulty: string;
  topics: string;
  position: number;
};

export type DsaTreeFolder = {
  id: number;
  sheetId: number;
  parentId: number | null;
  name: string;
  description: string | null;
  position: number;
  createdAt?: string;
  updatedAt?: string;
  directProblemCount: number;
  subfolderCount: number;
  totalProblemCount: number;
  children: DsaTreeFolder[];
  problems: DsaTreeProblem[];
};

export type AssignProblemsResult = {
  added: number;
  alreadyPresent: number[];
  missing: number[];
};

export type TreeSelection =
  | { type: "folder"; folderId: number }
  | { type: "problem"; folderId: number; problemId: number }
  | null;

export type DeleteFolderMode = "UNASSIGN" | "MOVE_TO_PARENT";
