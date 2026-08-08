# CodeT production deploy

## Split deploy (recommended): Vercel UI + homelab API

| Piece | Where |
| --- | --- |
| Frontend (`frontend/`) | **Vercel** → `https://codet.in` |
| API + sync + Redis + Nginx | **Homelab VM** → `https://api.codet.in` (Cloudflare Tunnel) |
| Postgres | **Supabase** |
| Judge0 | Homelab `:2358` (LAN only) |

Browser → `codet.in` (Vercel) → API calls → `api.codet.in` → Tunnel → `vishu:80` (Nginx → api / ws / sync).

### Step 1 — Homelab stack (API)

On `vishu`:

```bash
cd ~/CodeIT   # your clone
git pull origin main
cp -n .env.example .env
```

Set at least:

```env
CODEIT_PUBLIC_BASE_URL=https://codet.in
CODEIT_CORS_ORIGINS=https://codet.in,https://www.codet.in
JUDGE0_API_URL=http://host.docker.internal:2358
# + Supabase SPRING_DATASOURCE_*, REDIS_PASSWORD, JWT, OTP, SYNC, Turnstile
```

```bash
docker compose -f docker-compose.yml -f docker-compose.supabase.yml up -d --build
curl -sS http://127.0.0.1/healthz
curl -sS http://127.0.0.1/api/health
```

### Step 2 — Expose API with Cloudflare Tunnel

On `vishu` (install `cloudflared` once):

```bash
cloudflared tunnel login
cloudflared tunnel create codet-api
cloudflared tunnel route dns codet-api api.codet.in
```

Config (`~/.cloudflared/config.yml`):

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/<user>/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: api.codet.in
    service: http://127.0.0.1:80
  - service: http_status:404
```

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

If `api.codet.in` DNS is on Hostinger (not Cloudflare), add **CNAME** `api` → `<TUNNEL_ID>.cfargotunnel.com`.

### Step 3 — Hostinger DNS (leave parking)

1. Domain → **DNS / Nameservers** → **Change Nameservers** → **Hostinger nameservers** (not `dns-parking`).
2. Wait until Hostinger NS are active, then add Vercel + `api` records.

### Step 4 — Vercel frontend

```bash
cd frontend
npx vercel
```

Vercel → Project → **Settings → Environment Variables** (Production):

| Name | Value |
| --- | --- |
| `VITE_API_URL` | `https://api.codet.in` |
| `VITE_SYNC_WS_URL` | `wss://api.codet.in/sync` |

Redeploy (Vite bakes env at build time):

```bash
npx vercel --prod
```

### Step 5 — Attach `codet.in` on Vercel

1. Vercel → Project → **Domains** → Add `codet.in` and `www.codet.in`.
2. Copy the DNS records Vercel shows into Hostinger **DNS records**.
3. Optional: CNAME `api` → Cloudflare tunnel target.

### Step 6 — Smoke test

- `https://codet.in` loads
- Network tab: API calls hit `https://api.codet.in`
- Login / register (Turnstile hostnames include `codet.in`)
- CodeRoom WSS works

---

## Profile / properties (homelab VM)

| Layer | What to use |
| --- | --- |
| Spring profile | **`prod`** (`SPRING_PROFILES_ACTIVE=prod`) |
| Property files | `application.properties` + `application-prod.properties` |
| Do **not** use | `local` / `application-local.properties` on the VM |

Secrets come from root `.env` only.

### Homelab layout

| Dependency | Where |
| --- | --- |
| Postgres | **Supabase** |
| Redis | Compose `redis` |
| Judge0 | `JUDGE0_API_URL=http://host.docker.internal:2358` |
| API / sync / nginx | Compose on VM |
| UI | Vercel |

## Services

| Service | Role |
| --- | --- |
| `nginx` | Proxy `/api`, `/ws`, `/sync` |
| `api` | Spring Boot (prod) |
| `sync` | Yjs |
| `redis` | Rate limits / OTP / cache |

## Quick start (API on VM)

```bash
cp .env.example .env
# fill Supabase + secrets + CORS for https://codet.in
docker compose -f docker-compose.yml -f docker-compose.supabase.yml up -d --build
```

## Health

- `GET /healthz` (Nginx)
- `GET /api/health` (API)

## Full checklist

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).
