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

/** Global active WebSocket cap (code + whiteboard combined). */
const MAX_WS_CONNECTIONS = Number(process.env.MAX_WS_CONNECTIONS || 200);
/** Max sockets across both docs for one room. */
const MAX_WS_PER_ROOM = Number(process.env.MAX_WS_PER_ROOM || 40);
/** Max sockets on one doc (room:{id}:code OR :whiteboard). */
const MAX_WS_PER_DOC = Number(process.env.MAX_WS_PER_DOC || 20);
/**
 * Max tabs per user (each tab usually opens :code + :whiteboard).
 * Default 2 tabs → up to 4 sockets per user per room.
 */
const MAX_TABS_PER_USER = Number(process.env.MAX_TABS_PER_USER || 2);
const MAX_WS_PER_USER_PER_DOC = MAX_TABS_PER_USER;
const MAX_WS_PER_USER_PER_ROOM = MAX_TABS_PER_USER * 2;

/** Idle timeout without any activity (ms). Default 4 minutes. */
const WS_IDLE_TIMEOUT_MS = Number(process.env.WS_IDLE_TIMEOUT_MS || 4 * 60 * 1000);
/** How often the server sends a WS ping (ms). */
const WS_PING_INTERVAL_MS = Number(process.env.WS_PING_INTERVAL_MS || 30_000);
/** Max single WebSocket frame / Yjs update size (bytes). Default 256 KiB. */
const MAX_WS_MESSAGE_BYTES = Number(process.env.MAX_WS_MESSAGE_BYTES || 256 * 1024);
/** Whiteboard draw/update rate: max messages per window per user. */
const WB_MSG_LIMIT = Number(process.env.WB_MSG_LIMIT || 40);
const WB_MSG_WINDOW_MS = Number(process.env.WB_MSG_WINDOW_MS || 1000);

if (!JWT_SECRET) {
  console.error("CODEIT_JWT_SECRET is required (must match Spring codeit.jwt.secret)");
  process.exit(1);
}

const messageSync = 0;
const messageAwareness = 1;

/**
 * @typedef {{ doc: Y.Doc, awareness: awarenessProtocol.Awareness, conns: Set<import('ws').WebSocket>, meta: Map<import('ws').WebSocket, { userId: number|string, roomId: string, lastActive: number, alive: boolean, pingTimer?: NodeJS.Timeout, idleTimer?: NodeJS.Timeout }> }} DocEntry
 */

/** @type {Map<string, DocEntry>} */
const docs = new Map();

let globalConnCount = 0;

/** Fixed-window counters for whiteboard draw spam: key = `${userId}:${roomId}` */
const wbRate = new Map();

/**
 * @returns {boolean} true if allowed
 */
function allowWhiteboardMessage(userId, roomId) {
  const key = `${userId}:${roomId}`;
  const now = Date.now();
  let entry = wbRate.get(key);
  if (!entry || now - entry.windowStart >= WB_MSG_WINDOW_MS) {
    entry = { windowStart: now, count: 0 };
    wbRate.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > WB_MSG_LIMIT) {
    return false;
  }
  return true;
}

// Periodic cleanup of stale rate windows
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of wbRate) {
    if (now - entry.windowStart > WB_MSG_WINDOW_MS * 4) {
      wbRate.delete(key);
    }
  }
}, 60_000);

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
  return claims;
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

/**
 * @returns {{ ok: true } | { ok: false, status: number, reason: string }}
 */
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

function setupConnection(ws, docName, claims) {
  const { doc, awareness, conns, meta } = getOrCreateDoc(docName);
  const metaEntry = {
    userId: claims.userId,
    roomId: String(claims.roomId),
    lastActive: Date.now(),
    alive: true,
  };
  conns.add(ws);
  meta.set(ws, metaEntry);
  globalConnCount += 1;
  ws.binaryType = "arraybuffer";
  setupHeartbeat(ws, metaEntry);

  console.log(
    `[sync] connect user=${claims.userId} room=${claims.roomId} doc=${docName} global=${globalConnCount}`
  );

  // Send sync step 1
  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    ws.send(encoding.toUint8Array(encoder));
  }

  // Send awareness states of others
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
      const size = byteLength(data);
      if (size > MAX_WS_MESSAGE_BYTES) {
        console.warn(
          `[sync] dropping oversized message user=${claims.userId} doc=${docName} bytes=${size}`
        );
        ws.close(1009, "message too large");
        return;
      }

      const isWhiteboard = docName.endsWith(":whiteboard");
      if (isWhiteboard && !allowWhiteboardMessage(claims.userId, claims.roomId)) {
        console.warn(
          `[sync] whiteboard rate limit user=${claims.userId} room=${claims.roomId}`
        );
        // Drop spam without closing — keep the socket for later draws
        return;
      }

      touch(metaEntry);

      const decoder = decoding.createDecoder(new Uint8Array(data));
      const messageType = decoding.readVarUint(decoder);
      switch (messageType) {
        case messageSync: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageSync);
          syncProtocol.readSyncMessage(decoder, encoder, doc, ws);
          if (encoding.length(encoder) > 1) {
            ws.send(encoding.toUint8Array(encoder));
          }
          break;
        }
        case messageAwareness: {
          awarenessProtocol.applyAwarenessUpdate(
            awareness,
            decoding.readVarUint8Array(decoder),
            ws
          );
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
    clearHeartbeat(meta.get(ws));
    conns.delete(ws);
    meta.delete(ws);
    globalConnCount = Math.max(0, globalConnCount - 1);
    awarenessProtocol.removeAwarenessStates(
      awareness,
      [doc.clientID],
      "connection closed"
    );
    console.log(
      `[sync] disconnect user=${claims.userId} doc=${docName} remaining=${conns.size} global=${globalConnCount}`
    );
  });
}

const server = http.createServer((req, res) => {
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
          perUserPerDoc: MAX_WS_PER_USER_PER_DOC,
          perUserPerRoom: MAX_WS_PER_USER_PER_ROOM,
          idleTimeoutMs: WS_IDLE_TIMEOUT_MS,
          maxMessageBytes: MAX_WS_MESSAGE_BYTES,
          wbMsgLimit: WB_MSG_LIMIT,
          wbMsgWindowMs: WB_MSG_WINDOW_MS,
        },
      })
    );
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({
  noServer: true,
  maxPayload: MAX_WS_MESSAGE_BYTES,
});

server.on("upgrade", (req, socket, head) => {
  try {
    const host = req.headers.host || "localhost";
    const url = new URL(req.url || "/", `http://${host}`);
    let docName = url.searchParams.get("doc");
    const token = url.searchParams.get("token");
    if (!docName && url.pathname && url.pathname !== "/") {
      docName = decodeURIComponent(url.pathname.replace(/^\//, ""));
    }
    if (!docName || !token) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    const claims = verifySyncToken(token);
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
  } catch (err) {
    console.warn("[sync] upgrade rejected:", err.message);
    rejectUpgrade(socket, 401, "Unauthorized");
  }
});

server.listen(PORT, () => {
  console.log(
    `codeit sync-server listening on :${PORT} (tabs/user=${MAX_TABS_PER_USER} idle=${WS_IDLE_TIMEOUT_MS}ms maxMsg=${MAX_WS_MESSAGE_BYTES}B)`
  );
});
