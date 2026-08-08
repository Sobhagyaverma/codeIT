# CodeT production deployment checklist

Use with `docker compose` (see [README.md](./README.md) and root `.env.example`).

## Server

- [ ] Ubuntu 22.04+ VPS / homelab VM, **2 vCPU / 4 GB RAM** recommended (2 GB absolute minimum with Judge0 off-box)
- [ ] Docker + Docker Compose plugin installed
- [ ] Firewall: allow **80/443** (Cloudflare), **22** (your IP only); block public **5432/6379/9091/1234/2358**
- [ ] Optional: UFW + Fail2Ban on SSH

## DNS / TLS

- [ ] Domain A/AAAA → VPS (Cloudflare proxied)
- [ ] Cloudflare SSL mode **Full** (origin HTTP :80)
- [ ] Restrict origin to Cloudflare IPs if possible

## Secrets (`.env`)

- [ ] **Supabase path:** `SPRING_DATASOURCE_URL` / `USERNAME` / `PASSWORD` (pooler + `sslmode=require`); use `docker-compose.supabase.yml`
- [ ] **Local Postgres path:** `POSTGRES_PASSWORD` strong, not `ROOT`
- [ ] `REDIS_PASSWORD` set (CodeT compose Redis AUTH — not Judge0 Redis)
- [ ] `CODEIT_JWT_SECRET` ≥ 32 chars, unique
- [ ] `CODEIT_OTP_PEPPER` ≥ 16 chars, unique
- [ ] `SYNC_INTERNAL_SECRET` set (API→sync revoke on kick/leave/archive)
- [ ] `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` (prod captcha required)
- [ ] `CODEIT_CORS_ORIGINS=https://your.domain`
- [ ] `CODEIT_PUBLIC_BASE_URL=https://your.domain` (invite / email links)
- [ ] `CODEIT_REGISTRATION_MODE` (`INVITE_ONLY` default, or `OPEN` / `COLLEGE_ONLY`)
- [ ] `JUDGE0_API_URL` reachable **only** from API host (e.g. `http://host.docker.internal:2358`). **Never** publish `:2358` publicly or via Cloudflare.
- [ ] Optional: `GROQ_API_KEY`, Brevo mail vars (`CODEIT_MAIL_*`, `SPRING_MAIL_USERNAME`, `BREVO_SMTP_KEY`)

## Boot

```bash
cp .env.example .env   # fill values

# Homelab + Supabase:
docker compose -f docker-compose.yml -f docker-compose.supabase.yml up -d --build

# Or local Postgres:
# docker compose up -d --build

curl -s http://127.0.0.1/healthz
curl -s http://127.0.0.1/api/health
```

- [ ] Spring profile is **`prod`** (Compose sets `SPRING_PROFILES_ACTIVE=prod`)
- [ ] Flyway applied (check API logs for V1–V9)
- [ ] API RSA key volume (`api_data`) persists across restarts
- [ ] Postgres: Supabase project persists (or local `postgres_data` volume if using compose postgres)

## Smoke test

- [ ] Register → verify email → login
- [ ] Run sample + submit practice (no competitionId on practice submit)
- [ ] Join contest → problems list only after join → submit in-contest problem only
- [ ] CodeRoom create/join (body invite) → editor sync over `/sync`
- [ ] Admin route requires ADMIN (server role)
- [ ] Demote ADMIN in DB → next request loses admin (role-from-DB)

## Backups / ops

- [ ] Nightly backup of Postgres (Supabase backups or `pg_dump`)
- [ ] Log rotation for Docker (`json-file` max-size) or ship to host journal
- [ ] Monitor disk; prune unused images
- [ ] Document Judge0 upgrade/restart separately

## Security reminders

- Judge0 must **not** be public; only API → Judge0
- Prod profile fails closed without secrets / captcha keys
- Auth rate limits fail closed if Redis is down
- Nginx strips spoofed XFF and sets `X-Real-IP` from Cloudflare when present
