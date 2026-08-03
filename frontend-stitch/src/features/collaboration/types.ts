export type RoomType = "PROBLEM_COLLAB" | "CODEROOM";
export type RoomRole = "HOST" | "EDITOR" | "VIEWER";
export type WorkspaceType = "CODE" | "WHITEBOARD";
export type RoomStatus = "ACTIVE" | "ARCHIVED";

export type RoomMember = {
  userId: number;
  username: string;
  role: RoomRole;
  joinedAt?: string;
};

export type Room = {
  id: string;
  type: RoomType;
  problemId: number | null;
  hostUserId: number;
  inviteToken: string;
  activeWorkspace: WorkspaceType;
  language: string;
  status: RoomStatus;
  createdAt?: string;
  updatedAt?: string;
  members: RoomMember[];
};

export type RoomMessage = {
  id: number;
  userId: number;
  username: string;
  content: string;
  createdAt?: string;
};

export type SyncToken = {
  token: string;
  expiresInMs: number;
  codeDocName: string;
  whiteboardDocName: string;
};

export type CreateRoomPayload = {
  type: RoomType;
  problemId?: number | null;
  language?: string;
};

export type RoomSummary = {
  id: string;
  type: RoomType;
  language: string;
  status: RoomStatus;
  activeWorkspace: WorkspaceType;
  inviteToken: string;
  role: RoomRole;
  joinedAt?: string;
  lastSeenAt?: string;
  updatedAt?: string;
};
