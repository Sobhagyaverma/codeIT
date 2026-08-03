# Sync server

Yjs WebSocket sidecar for real-time editor and whiteboard sync.

## Run locally

```bash
cd sync-server
cp .env.example .env
npm install
npm start
```

Health: `http://localhost:1234/health`

WebSocket: `ws://localhost:1234/sync?doc=room:{roomId}:code&token={syncToken}`

`CODEIT_JWT_SECRET` must match Spring `codeit.jwt.secret`.

## Connection limits (env)

| Variable | Default | Meaning |
|----------|---------|---------|
| `MAX_WS_CONNECTIONS` | 200 | Global active sockets |
| `MAX_WS_PER_ROOM` | 40 | Both `:code` + `:whiteboard` |
| `MAX_WS_PER_DOC` | 20 | One doc (`:code` or `:whiteboard`) |
| `MAX_TABS_PER_USER` | 2 | Browser tabs (×2 sockets for code+whiteboard) |
| `WS_IDLE_TIMEOUT_MS` | 240000 | Disconnect after 4 min with no activity |
| `WS_PING_INTERVAL_MS` | 30000 | Server ping interval |
| `MAX_WS_MESSAGE_BYTES` | 262144 | Max Yjs/whiteboard frame size (256 KiB) |

## Docker

```bash
docker compose up sync-server --build
```

See `docs/COLLABORATION_ARCHITECTURE.md`.
