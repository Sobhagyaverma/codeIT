import { request } from "../../lib/api";
import type {
  CreateRoomPayload,
  Room,
  RoomMessage,
  SyncToken,
} from "./types";

export const createRoom = (data: CreateRoomPayload) =>
  request<Room>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const joinRoom = (inviteToken: string) =>
  request<Room>(`/api/rooms/join/${encodeURIComponent(inviteToken)}`, {
    method: "POST",
  });

export const getRoom = (roomId: string) =>
  request<Room>(`/api/rooms/${roomId}`);

export const updateMemberRole = (
  roomId: string,
  targetUserId: number,
  role: string
) =>
  request<Room>(`/api/rooms/${roomId}/members/${targetUserId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

export const removeMember = (roomId: string, targetUserId: number) =>
  request<Room>(`/api/rooms/${roomId}/members/${targetUserId}`, {
    method: "DELETE",
  });

export const transferHost = (roomId: string, newHostUserId: number) =>
  request<Room>(`/api/rooms/${roomId}/transfer-host`, {
    method: "POST",
    body: JSON.stringify({ newHostUserId }),
  });

export const updateWorkspace = (roomId: string, workspace: string) =>
  request<Room>(`/api/rooms/${roomId}/workspace`, {
    method: "PATCH",
    body: JSON.stringify({ workspace }),
  });

export const getRoomMessages = (roomId: string, limit = 50) =>
  request<RoomMessage[]>(`/api/rooms/${roomId}/messages?limit=${limit}`);

export const sendRoomMessage = (roomId: string, content: string) =>
  request<RoomMessage>(`/api/rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const getSyncToken = (roomId: string) =>
  request<SyncToken>(`/api/rooms/${roomId}/sync-token`);

export const runRoomCode = (
  roomId: string,
  data: { sourceCode: string; languageId: number; stdin?: string }
) =>
  request<Record<string, unknown>>(`/api/rooms/${roomId}/run`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const submitRoomCode = (
  roomId: string,
  data: { code: string; languageId: number }
) =>
  request<Record<string, unknown>>(`/api/rooms/${roomId}/submit`, {
    method: "POST",
    body: JSON.stringify(data),
  });
