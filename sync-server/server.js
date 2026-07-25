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

if (!JWT_SECRET) {
  console.error("CODEIT_JWT_SECRET is required (must match Spring codeit.jwt.secret)");
  process.exit(1);
}

const messageSync = 0;
const messageAwareness = 1;

/** @type {Map<string, { doc: Y.Doc, awareness: awarenessProtocol.Awareness, conns: Set<import('ws').WebSocket> }>} */
const docs = new Map();

function getOrCreateDoc(docName) {
  let entry = docs.get(docName);
  if (entry) return entry;

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  const conns = new Set();

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

  entry = { doc, awareness, conns };
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

function setupConnection(ws, docName, claims) {
  const { doc, awareness, conns } = getOrCreateDoc(docName);
  conns.add(ws);
  ws.binaryType = "arraybuffer";

  console.log(
    `[sync] connect user=${claims.userId} room=${claims.roomId} doc=${docName}`
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
    conns.delete(ws);
    awarenessProtocol.removeAwarenessStates(
      awareness,
      [doc.clientID],
      "connection closed"
    );
    console.log(
      `[sync] disconnect user=${claims.userId} doc=${docName} remaining=${conns.size}`
    );
    if (conns.size === 0) {
      // Keep doc in memory so switching Code/Whiteboard does not lose state.
      // Docs can be GC'd later via snapshots / TTL if needed.
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "codeit-sync-server", docs: docs.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  try {
    const host = req.headers.host || "localhost";
    const url = new URL(req.url || "/", `http://${host}`);
    // y-websocket client connects to ws://host/{docName}?token=...
    // Also accept legacy /sync?doc=...&token=...
    let docName = url.searchParams.get("doc");
    const token = url.searchParams.get("token");
    if (!docName && url.pathname && url.pathname !== "/") {
      docName = decodeURIComponent(url.pathname.replace(/^\//, ""));
    }
    if (!docName || !token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const claims = verifySyncToken(token);
    const expectedPrefix = `room:${claims.roomId}:`;
    if (!docName.startsWith(expectedPrefix)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }
    if (!docName.endsWith(":code") && !docName.endsWith(":whiteboard")) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      setupConnection(ws, docName, claims);
    });
  } catch (err) {
    console.warn("[sync] upgrade rejected:", err.message);
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`codeit sync-server listening on :${PORT}`);
});
