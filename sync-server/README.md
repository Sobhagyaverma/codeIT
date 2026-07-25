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

## Docker

```bash
docker compose up sync-server --build
```

See `docs/COLLABORATION_ARCHITECTURE.md`.
