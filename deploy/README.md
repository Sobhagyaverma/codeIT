# CodeIT production deploy (Docker Compose + Nginx + Cloudflare)

## Services

| Service | Role |
| --- | --- |
| `nginx` | Static Stitch UI + reverse proxy `/api`, `/ws`, `/sync` |
| `api` | Spring Boot (prod profile) |
| `sync` | Yjs sync-server |
| `postgres` | Database (init from `schema/schema.sql`, then Flyway) |
| `redis` | Rate limits / OTP / cache |

Judge0 is **not** in Compose — set `JUDGE0_API_URL` to your homelab.

## Quick start

```bash
cp .env.example .env
# edit secrets: POSTGRES_PASSWORD, CODEIT_JWT_SECRET, CODEIT_OTP_PEPPER, Turnstile keys

docker compose up -d --build
```

Open http://localhost (or your Cloudflare hostname pointed at this host:80).

## Cloudflare

- Proxied DNS A/AAAA → this VPS
- SSL/TLS mode: **Full** (origin serves HTTP on :80; Cloudflare terminates HTTPS)
- Optionally restrict origin firewall to Cloudflare IPs only

## Same-origin paths

- UI: `/`
- API: `/api/*`
- STOMP: `/ws`, `/ws/*`
- Yjs: `/sync/{doc}` (Nginx strips `/sync` before the sync container)

## Health

- `GET /healthz` (Nginx)
- `GET /api/health` (API)
- `GET http://sync:1234/health` (internal)

## Graceful stop

```bash
docker compose stop api   # uses server.shutdown=graceful (30s)
```

## Full checklist

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for firewall, secrets, smoke tests, and backups.
