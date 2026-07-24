import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadLocalCode,
  loadLocalWhiteboard,
  loadLocalWorkspace,
  persistLocalCode,
  persistLocalWhiteboard,
  persistLocalWorkspace,
  type LocalCodePayload,
} from "../sync";
import type { WorkspaceType } from "../types";

/**
 * Centralizes local room persistence hydrate/save helpers.
 * Hydrate only when the remote Yjs doc is empty / first join.
 */
export function useLocalRoomPersistence(roomId: string | undefined) {
  const [workspaceHint, setWorkspaceHint] = useState<WorkspaceType | null>(
    null
  );

  useEffect(() => {
    if (!roomId) return;
    const local = loadLocalWorkspace(roomId);
    if (local === "CODE" || local === "WHITEBOARD") {
      setWorkspaceHint(local);
    }
  }, [roomId]);

  const loadCode = useCallback((): LocalCodePayload | null => {
    return roomId ? loadLocalCode(roomId) : null;
  }, [roomId]);

  const saveCode = useCallback(
    (payload: LocalCodePayload) => {
      if (roomId) persistLocalCode(roomId, payload);
    },
    [roomId]
  );

  const loadWhiteboard = useCallback(() => {
    return roomId ? loadLocalWhiteboard(roomId) : Promise.resolve(null);
  }, [roomId]);

  const saveWhiteboard = useCallback(
    (scene: unknown) => {
      if (roomId) void persistLocalWhiteboard(roomId, scene);
    },
    [roomId]
  );

  const saveWorkspace = useCallback(
    (workspace: WorkspaceType) => {
      if (!roomId) return;
      persistLocalWorkspace(roomId, workspace);
      setWorkspaceHint(workspace);
    },
    [roomId]
  );

  const resolveWorkspace = useCallback(
    (serverWorkspace?: WorkspaceType | null): WorkspaceType => {
      if (serverWorkspace === "CODE" || serverWorkspace === "WHITEBOARD") {
        return serverWorkspace;
      }
      return workspaceHint || "CODE";
    },
    [workspaceHint]
  );

  return useMemo(
    () => ({
      workspaceHint,
      loadCode,
      saveCode,
      loadWhiteboard,
      saveWhiteboard,
      saveWorkspace,
      resolveWorkspace,
    }),
    [
      workspaceHint,
      loadCode,
      saveCode,
      loadWhiteboard,
      saveWhiteboard,
      saveWorkspace,
      resolveWorkspace,
    ]
  );
}
