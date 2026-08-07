import "dotenv/config";
import http from "http";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import jwt from "jsonwebtoken";

const PORT = Number(process.env.PORT || 1234);
const JWT_SECRET = process.env.CODEIT_JWT_SECRET;
const INTERNAL_SECRET = process.env.SYNC_INTERNAL_SECRET || "";

/** Global active WebSocket cap (code + whiteboard combined). */
const MAX_WS_CONNECTIONS = Number(process.env.MAX_WS_CONNECTIONS || 200);
const MAX_WS_PER_ROOM = Number(process.env.MAX_WS_PER_ROOM || 40);
const MAX_WS_PER_DOC = Number(process.env.MAX_WS_PER_DOC || 20);
const MAX_TABS_PER_USER = Number(process.env.MAX_TABS_PER_USER || 2);
const MAX_WS_PER_USER_PER_DOC = MAX_TABS_PER_USER;
const MAX_WS_PER_USER_PER_ROOM = MAX_TABS_PER_USER * 2;

const WS_IDLE_TIMEOUT_MS = Number(process.env.WS_IDLE_TIMEOUT_MS || 4 * 60 * 1000);
const WS_PING_INTERVAL_MS = Number(process.env.WS_PING_INTERVAL_MS || 30_000);
const MAX_WS_MESSAGE_BYTES = Number(process.env.MAX_WS_MESSAGE_BYTES || 256 * 1024);

/** Draw/code update rate: max messages per window per user. */
const DOC_MSG_LIMIT = Number(process.env.DOC_MSG_LIMIT || 40);
const DOC_MSG_WINDOW_MS = Number(process.env.DOC_MSG_WINDOW_MS || 1000);

/** y-protocols/sync message subtypes */
const messageYjsSyncStep1 = 0;
const messageYjsSyncStep2 = 1;
const messageYjsUpdate = 2;

if (!JWT_SECRET) {
  console.error("CODEIT_JWT_SECRET is required (must match Spring codeit.jwt.secret)");
  process.exit(1);
}

const messageSync = 0;
const messageAwareness = 1;

/**
 * @typedef {{
 *   doc: Y.Doc,
 *   awareness: awarenessProtocol.Awareness,
 *   conns: Set<import('ws').WebSocket>,
 *   meta: Map<import('ws').WebSocket, {
 *     userId: number|string,
 *     roomId: string,
 *     canEdit: boolean,
 *     lastActive: number,
 *     alive: boolean,
 *     awarenessClientIds: Set<number>,
 *     pingTimer?: NodeJS.Timeout,
 *     idleTimer?: NodeJS.Timeout
 *   }>
 * }} DocEntry
 */

/** @type {Map<string, DocEntry>} */
const docs = new Map();

/** roomId → Set(userId string) denied until TTL */
const revokeDeny = new Map();
/** roomId → true when whole room revoked (archive) */
const revokeRooms = new Map();

let globalConnCount = 0;

/** Fixed-window counters: key = `${userId}:${roomId}:${docKind}` */
const docRate = new Map();

function allowDocMessage(userId, roomId, docKind) {
  const key = `${userId}:${roomId}:${docKind}`;
  const now = Date.now();
  let entry = docRate.get(key);
  if (!entry || now - entry.windowStart >= DOC_MSG_WINDOW_MS) {
    entry = { windowStart: now, count: 0 };
    docRate.set(key, entry);
  }
  entry.count += 1;
  return entry.count <= DOC_MSG_LIMIT;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of docRate) {
    if (now - entry.windowStart > DOC_MSG_WINDOW_MS * 4) {
      docRate.delete(key);
    }
  }
  for (const [roomId, users] of revokeDeny) {
    for (const [userId, until] of users) {
      if (until <= now) users.delete(userId);
    }
    if (users.size === 0) revokeDeny.delete(roomId);
  }
  for (const [roomId, until] of revokeRooms) {
    if (until <= now) revokeRooms.delete(roomId);
  }
}, 60_000);

function isRevoked(roomId, userId) {
  const roomUntil = revokeRooms.get(String(roomId));
  if (roomUntil && roomUntil > Date.now()) return true;
  const users = revokeDeny.get(String(roomId));
  if (!users) return false;
  const until = users.get(String(userId));
  return Boolean(until && until > Date.now());
}

function markRevoked(roomId, userId, ttlMs) {
  const until = Date.now() + ttlMs;
  const rid = String(roomId);
  if (userId == null) {
    revokeRooms.set(rid, until);
    revokeDeny.delete(rid);
    return;
  }
  let users = revokeDeny.get(rid);
  if (!users) {
    users = new Map();
    revokeDeny.set(rid, users);
  }
  users.set(String(userId), until);
}

function closeMatchingSockets(roomId, userId) {
  const prefix = `room:${roomId}:`;
  let closed = 0;
  for (const [name, entry] of docs) {
    if (!name.startsWith(prefix)) continue;
    for (const [ws, info] of entry.meta) {
      if (userId == null || String(info.userId) === String(userId)) {
        try {
          ws.close(4001, "sync access revoked");
        } catch {
          try {
            ws.terminate();
          } catch {
            /* ignore */
          }
        }
        closed += 1;
      }
    }
  }
  return closed;
}

function getOrCreateDoc(docName) {
  let entry = docs.get(docName);
  if (entry) return entry;

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  const conns = new Set();
  /** @type {DocEntry['meta']} */
  const meta = new Map();

  doc.on("update", (update, origin) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);
    for (const conn of conns) {
      if (conn !== origin && conn.readyState === 1) {
        conn.send(message);
      }
    }
  });

  awareness.on("update", ({ added, updated, removed }, origin) => {
    const changed = added.concat(updated, removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, changed)
    );
    const message = encoding.toUint8Array(encoder);
    for (const conn of conns) {
      if (conn !== origin && conn.readyState === 1) {
        conn.send(message);
      }
    }
  });

  entry = { doc, awareness, conns, meta };
  docs.set(docName, entry);
  return entry;
}

function verifySyncToken(token) {
  const claims = jwt.verify(token, JWT_SECRET);
  if (claims.typ !== "sync" || !claims.roomId || claims.userId == null) {
    throw new Error("invalid sync token claims");
  }
  // Default canEdit false if claim missing (old tokens) — fail closed for writes
  claims.canEdit = claims.canEdit === true;
  return claims;
}

function extractToken(req, url) {
  const protocols = req.headers["sec-websocket-protocol"];
  if (protocols) {
    const parts = String(protocols)
      .split(",")
      .map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith("bearer.")) {
        return { token: p.slice("bearer.".length), protocol: p };
      }
    }
  }
  return { token: url.searchParams.get("token"), protocol: null };
}

function countRoomConns(roomId) {
  const prefix = `room:${roomId}:`;
  let n = 0;
  for (const [name, entry] of docs) {
    if (name.startsWith(prefix)) n += entry.conns.size;
  }
  return n;
}

function countUserRoomConns(roomId, userId) {
  const prefix = `room:${roomId}:`;
  let n = 0;
  for (const [name, entry] of docs) {
    if (!name.startsWith(prefix)) continue;
    for (const info of entry.meta.values()) {
      if (String(info.userId) === String(userId)) n += 1;
    }
  }
  return n;
}

function countUserDocConns(docName, userId) {
  const entry = docs.get(docName);
  if (!entry) return 0;
  let n = 0;
  for (const info of entry.meta.values()) {
    if (String(info.userId) === String(userId)) n += 1;
  }
  return n;
}

function checkConnectionLimits(docName, claims) {
  const roomId = String(claims.roomId);
  const userId = claims.userId;

  if (globalConnCount >= MAX_WS_CONNECTIONS) {
    return { ok: false, status: 503, reason: "global connection limit reached" };
  }
  const entry = docs.get(docName);
  if (entry && entry.conns.size >= MAX_WS_PER_DOC) {
    return { ok: false, status: 503, reason: "doc connection limit reached" };
  }
  if (countRoomConns(roomId) >= MAX_WS_PER_ROOM) {
    return { ok: false, status: 503, reason: "room connection limit reached" };
  }
  if (countUserDocConns(docName, userId) >= MAX_WS_PER_USER_PER_DOC) {
    return { ok: false, status: 429, reason: "too many tabs on this doc" };
  }
  if (countUserRoomConns(roomId, userId) >= MAX_WS_PER_USER_PER_ROOM) {
    return { ok: false, status: 429, reason: "user room connection limit reached" };
  }
  return { ok: true };
}

function rejectUpgrade(socket, status, reason) {
  console.warn(`[sync] upgrade rejected (${status}): ${reason}`);
  socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function byteLength(data) {
  if (typeof data === "string") return Buffer.byteLength(data);
  if (Buffer.isBuffer(data)) return data.length;
  if (data instanceof ArrayBuffer) return data.byteLength;
  if (ArrayBuffer.isView(data)) return data.byteLength;
  return 0;
}

function touch(metaEntry) {
  metaEntry.lastActive = Date.now();
  metaEntry.alive = true;
}

function setupHeartbeat(ws, metaEntry) {
  metaEntry.alive = true;
  metaEntry.lastActive = Date.now();

  metaEntry.pingTimer = setInterval(() => {
    if (ws.readyState !== 1) return;
    if (metaEntry.alive === false) {
      console.warn("[sync] terminating idle socket (missed pong)");
      ws.terminate();
      return;
    }
    metaEntry.alive = false;
    try {
      ws.ping();
    } catch {
      ws.terminate();
    }
  }, WS_PING_INTERVAL_MS);

  metaEntry.idleTimer = setInterval(() => {
    if (Date.now() - metaEntry.lastActive > WS_IDLE_TIMEOUT_MS) {
      console.warn(
        `[sync] terminating idle socket (no activity for ${WS_IDLE_TIMEOUT_MS}ms)`
      );
      ws.terminate();
    }
  }, Math.min(60_000, WS_IDLE_TIMEOUT_MS));

  ws.on("pong", () => touch(metaEntry));
}

function clearHeartbeat(metaEntry) {
  if (metaEntry?.pingTimer) clearInterval(metaEntry.pingTimer);
  if (metaEntry?.idleTimer) clearInterval(metaEntry.idleTimer);
}

function peekSyncSubtype(data) {
  const decoder = decoding.createDecoder(new Uint8Array(data));
  decoding.readVarUint(decoder); // messageSync
  return decoding.readVarUint(decoder);
}

function setupConnection(ws, docName, claims) {
  const { doc, awareness, conns, meta } = getOrCreateDoc(docName);
  const canEdit = claims.canEdit === true;
  const metaEntry = {
    userId: claims.userId,
    roomId: String(claims.roomId),
    canEdit,
    lastActive: Date.now(),
    alive: true,
    awarenessClientIds: new Set(),
  };
  conns.add(ws);
  meta.set(ws, metaEntry);
  globalConnCount += 1;
  ws.binaryType = "arraybuffer";
  setupHeartbeat(ws, metaEntry);

  console.log(
    `[sync] connect user=${claims.userId} room=${claims.roomId} canEdit=${canEdit} doc=${docName} global=${globalConnCount}`
  );

  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    ws.send(encoding.toUint8Array(encoder));
  }

  const awarenessStates = Array.from(awareness.getStates().keys());
  if (awarenessStates.length > 0) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, awarenessStates)
    );
    ws.send(encoding.toUint8Array(encoder));
  }

  ws.on("message", (data) => {
    try {
      if (isRevoked(claims.roomId, claims.userId)) {
        ws.close(4001, "sync access revoked");
        return;
      }

      const size = byteLength(data);
      if (size > MAX_WS_MESSAGE_BYTES) {
        console.warn(
          `[sync] dropping oversized message user=${claims.userId} doc=${docName} bytes=${size}`
        );
        ws.close(1009, "message too large");
        return;
      }

      const docKind = docName.endsWith(":whiteboard") ? "whiteboard" : "code";
      if (!allowDocMessage(claims.userId, claims.roomId, docKind)) {
        console.warn(
          `[sync] rate limit user=${claims.userId} room=${claims.roomId} kind=${docKind}`
        );
        return;
      }

      touch(metaEntry);

      const decoder = decoding.createDecoder(new Uint8Array(data));
      const messageType = decoding.readVarUint(decoder);
      switch (messageType) {
        case messageSync: {
          if (!canEdit) {
            const subtype = peekSyncSubtype(data);
            // Viewers may request state (Step1) so the server can push the doc.
            // Step2 and Update both apply client bytes into the shared Doc — reject.
            if (subtype !== messageYjsSyncStep1) {
              return;
            }
          }
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageSync);
          syncProtocol.readSyncMessage(decoder, encoder, doc, ws);
          if (encoding.length(encoder) > 1) {
            ws.send(encoding.toUint8Array(encoder));
          }
          break;
        }
        case messageAwareness: {
          if (!canEdit) {
            // VIEWER: no cursor / presence writes
            return;
          }
          const update = decoding.readVarUint8Array(decoder);
          try {
            const before = new Set(awareness.getStates().keys());
            awarenessProtocol.applyAwarenessUpdate(awareness, update, ws);
            for (const clientId of awareness.getStates().keys()) {
              if (!before.has(clientId)) {
                metaEntry.awarenessClientIds.add(clientId);
              }
            }
          } catch (err) {
            console.warn("[sync] awareness apply error", err.message);
          }
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error("[sync] message error", err);
    }
  });

  ws.on("close", () => {
    const closedMeta = meta.get(ws);
    clearHeartbeat(closedMeta);
    conns.delete(ws);
    meta.delete(ws);
    globalConnCount = Math.max(0, globalConnCount - 1);

    try {
      const ids = closedMeta?.awarenessClientIds
        ? Array.from(closedMeta.awarenessClientIds)
        : [];
      if (ids.length > 0) {
        awarenessProtocol.removeAwarenessStates(awareness, ids, "connection closed");
      } else if (conns.size === 0) {
        const all = Array.from(awareness.getStates().keys());
        if (all.length > 0) {
          awarenessProtocol.removeAwarenessStates(awareness, all, "connection closed");
        }
      }
    } catch (err) {
      console.warn("[sync] awareness cleanup error", err.message);
    }

    console.log(
      `[sync] disconnect user=${claims.userId} doc=${docName} remaining=${conns.size} global=${globalConnCount}`
    );

    if (conns.size === 0) {
      try {
        awareness.destroy();
      } catch {
        /* ignore */
      }
      try {
        doc.destroy();
      } catch {
        /* ignore */
      }
      docs.delete(docName);
      console.log(`[sync] gc empty doc=${docName} remainingDocs=${docs.size}`);
    }
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "codeit-sync-server",
        docs: docs.size,
        connections: globalConnCount,
        limits: {
          global: MAX_WS_CONNECTIONS,
          perRoom: MAX_WS_PER_ROOM,
          perDoc: MAX_WS_PER_DOC,
          tabsPerUser: MAX_TABS_PER_USER,
          idleTimeoutMs: WS_IDLE_TIMEOUT_MS,
          maxMessageBytes: MAX_WS_MESSAGE_BYTES,
          docMsgLimit: DOC_MSG_LIMIT,
          docMsgWindowMs: DOC_MSG_WINDOW_MS,
        },
      })
    );
    return;
  }

  if (req.method === "POST" && req.url === "/internal/revoke") {
    if (!INTERNAL_SECRET || req.headers["x-sync-internal-secret"] !== INTERNAL_SECRET) {
      res.writeHead(401);
      res.end("unauthorized");
      return;
    }
    try {
      const body = await readJsonBody(req);
      const roomId = body.roomId;
      const userId = body.userId;
      if (!roomId) {
        res.writeHead(400);
        res.end("roomId required");
        return;
      }
      const ttlMs = 35 * 60 * 1000;
      markRevoked(roomId, userId ?? null, ttlMs);
      const closed = closeMatchingSockets(roomId, userId ?? null);
      console.log(
        `[sync] revoke room=${roomId} user=${userId ?? "*"} closed=${closed}`
      );
      res.writeHead(204);
      res.end();
    } catch (err) {
      console.warn("[sync] revoke error", err.message);
      res.writeHead(400);
      res.end("bad request");
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({
  noServer: true,
  maxPayload: MAX_WS_MESSAGE_BYTES,
  handleProtocols: (protocols) => {
    for (const p of protocols) {
      if (String(p).startsWith("bearer.")) return p;
    }
    return false;
  },
});

server.on("upgrade", (req, socket, head) => {
  try {
    const host = req.headers.host || "localhost";
    const url = new URL(req.url || "/", `http://${host}`);
    let docName = url.searchParams.get("doc");
    const { token, protocol } = extractToken(req, url);
    if (!docName && url.pathname && url.pathname !== "/") {
      docName = decodeURIComponent(url.pathname.replace(/^\//, ""));
    }
    if (!docName || !token) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    const claims = verifySyncToken(token);
    if (isRevoked(claims.roomId, claims.userId)) {
      rejectUpgrade(socket, 403, "Forbidden");
      return;
    }

    const expectedPrefix = `room:${claims.roomId}:`;
    if (!docName.startsWith(expectedPrefix)) {
      rejectUpgrade(socket, 403, "Forbidden");
      return;
    }
    if (!docName.endsWith(":code") && !docName.endsWith(":whiteboard")) {
      rejectUpgrade(socket, 400, "Bad Request");
      return;
    }

    const limits = checkConnectionLimits(docName, claims);
    if (!limits.ok) {
      rejectUpgrade(socket, limits.status, limits.reason);
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      setupConnection(ws, docName, claims);
    });
    // If client offered a bearer protocol, acknowledge it (ws library handles via handleUpgrade options)
    void protocol;
  } catch (err) {
    console.warn("[sync] upgrade rejected:", err.message);
    rejectUpgrade(socket, 401, "Unauthorized");
  }
});

server.listen(PORT, () => {
  console.log(
    `codeit sync-server listening on :${PORT} (tabs/user=${MAX_TABS_PER_USER} idle=${WS_IDLE_TIMEOUT_MS}ms maxMsg=${MAX_WS_MESSAGE_BYTES}B revoke=${INTERNAL_SECRET ? "on" : "off"})`
  );
});
