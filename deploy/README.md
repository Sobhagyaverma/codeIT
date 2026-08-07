# CodeIT production deploy (Docker Compose + Nginx + Cloudflare)

## Profile / properties (homelab VM)

| Layer | What to use |
| --- | --- |
| Spring profile | **`prod`** (`SPRING_PROFILES_ACTIVE=prod` — set by Compose) |
| Property files | `application.properties` + `application-prod.properties` |
| Do **not** use | `local` profile / `application-local.properties` (dev-only, gitignored) |

All secrets and host-specific values come from **environment** / root `.env` (datasource, Redis, JWT, OTP pepper, Turnstile, CORS, public URL, Judge0 URL, mail). Never commit real secrets.

### Homelab layout (typical)

| Dependency | Where |
| --- | --- |
| Postgres | **Supabase** (not compose `postgres`) |
| Redis | **CodeIT compose `redis`** (not Judge0’s Redis) |
| Judge0 | Same host: `JUDGE0_API_URL=http://host.docker.internal:2358` |
| API / sync / nginx / UI | This Compose stack |

## Services

| Service | Role |
| --- | --- |
| `nginx` | Static UI (`frontend/`) + reverse proxy `/api`, `/ws`, `/sync` |
| `api` | Spring Boot (prod profile) |
| `sync` | Yjs sync-server |
| `postgres` | Optional local DB (skipped with Supabase override) |
| `redis` | Rate limits / OTP / cache |

Judge0 is **not** in Compose — set `JUDGE0_API_URL` to your homelab.

## Quick start

### A) Homelab + Supabase (recommended on the VM)

```bash
cp .env.example .env
# Required: SPRING_DATASOURCE_URL/USERNAME/PASSWORD (Supabase pooler),
# REDIS_PASSWORD, CODEIT_JWT_SECRET, CODEIT_OTP_PEPPER, SYNC_INTERNAL_SECRET,
# TURNSTILE_*, CODEIT_CORS_ORIGINS, CODEIT_PUBLIC_BASE_URL, JUDGE0_API_URL

docker compose -f docker-compose.yml -f docker-compose.supabase.yml up -d --build
```

### B) Full stack with local Postgres

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
