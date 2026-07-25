# Judge0 Homelab Deploy Guide (Proxmox + Docker)

This guide is for hosting **Judge0 CE** on a Proxmox VM so the **CodeIT** backend can run and judge user code.

You do **not** need a custom Dockerfile. Judge0 ships ready-made Docker images and a `docker-compose.yml`. Your job is to create a Linux VM, install Docker, download the official release, tune a few settings, and expose port `2358`.

---

## What is Judge0?

Judge0 is an open-source **code execution API**. CodeIT sends source code + test input to Judge0; Judge0 compiles/runs it in a sandbox and returns stdout, stderr, time, memory, and status (Accepted, Wrong Answer, Time Limit, etc.).

CodeIT talks to Judge0 at:

```text
http://<judge0-host>:2358
```

---

## What files do you need?

| File | Who provides it | Purpose |
|------|-----------------|--------|
| Official Judge0 release zip | You download it | Contains `docker-compose.yml` + `judge0.conf` |
| This document | CodeIT team | Deploy steps + CodeIT-required settings |
| Custom Dockerfile | **Not needed** | Do not write one |

Official release (recommended):

```text
https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip
```

After unzip you will have roughly:

```text
judge0-v1.13.1/
├── docker-compose.yml   # starts server, workers, postgres, redis
└── judge0.conf          # passwords + limits (edit this)
```

That is everything required to run Judge0.

---

## Proxmox VM requirements

### Guest OS

- **Ubuntu 22.04 LTS** (strongly recommended; Judge0 is tested on Linux)
- Not Windows, not a container LXC for this use case — use a normal **QEMU/KVM VM**

### Resources (minimum → better)

| Resource | Minimum | Recommended for CodeIT |
|----------|---------|------------------------|
| vCPU | 2 | 4+ |
| RAM | 4 GB | 8 GB |
| Disk | 20 GB | 40 GB SSD |
| Nested virtualization | Preferred | Enable if available |

Judge0 workers compile and run code in sandboxes. More CPU/RAM = faster judging under load.

### Proxmox notes

1. Create a **VM** (not LXC). Judge0 containers need `privileged` mode and cgroup access.
2. In Proxmox VM Options / CPU: enable **nested virtualization** if your host supports it (`host` CPU type often works).
3. Give the VM a stable LAN IP (static DHCP reservation or static IP), e.g. `192.168.1.50`.
4. Open firewall path so the CodeIT API machine can reach **TCP 2358** on this VM.

---

## Step 1 — Create and update the VM

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget unzip ca-certificates
```

---

## Step 2 — Critical cgroup fix (Ubuntu 22.04)

Judge0’s sandbox often fails on cgroup v2. Switch to **cgroup v1**:

```bash
sudo nano /etc/default/grub
```

Find `GRUB_CMDLINE_LINUX` and add:

```text
systemd.unified_cgroup_hierarchy=0
```

Example:

```bash
GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"
```

Apply and reboot:

```bash
sudo update-grub
sudo reboot
```

After reboot, verify Docker will see cgroup v1 (after Docker is installed):

```bash
docker info | grep -i cgroup
# Expect: Cgroup Version: 1
```

---

## Step 3 — Install Docker + Compose

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Log out and back in (or reboot), then:

```bash
docker --version
docker compose version
```

> Note: older Judge0 docs use `docker-compose` (hyphen). On modern Docker, `docker compose` (space) works. If `docker-compose` is missing, either install the plugin or use `docker compose` and adapt commands below.

If the release only has `docker-compose.yml` and your system only has `docker compose`, these are equivalent:

```bash
docker compose up -d
# same idea as
docker-compose up -d
```

---

## Step 4 — Download Judge0 CE

```bash
cd ~
wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip
unzip judge0-v1.13.1.zip
cd judge0-v1.13.1
ls
# should show: docker-compose.yml  judge0.conf
```

---

## Step 5 — Edit `judge0.conf` (required for CodeIT)

```bash
nano judge0.conf
```

### 5.1 Set passwords (required)

Generate two long random passwords and set:

```properties
REDIS_PASSWORD=change-me-redis-32chars-min
POSTGRES_PASSWORD=change-me-postgres-32chars-min
```

Do not leave these blank — Judge0 will not start correctly.

### 5.2 Settings CodeIT needs

CodeIT uses:

- Multi-file language **ID 89** (built into Judge0 CE — no extra install)
- Compile-once jobs that can need up to **~30s CPU / ~45s wall**
- Batch submissions and `wait=true`
- Languages: Java, Python, JS, TS, C++, C, Go, Rust, C#, Ruby, PHP

Tune these values in `judge0.conf`:

```properties
# Workers: start conservative; raise later if CPU allows
COUNT=4

# Allow CodeIT compile-once limits (defaults are too low: max CPU 15 / wall 20)
MAX_CPU_TIME_LIMIT=30
MAX_WALL_TIME_LIMIT=45

# Batches (CodeIT submits multiple test cases)
ENABLE_BATCHED_SUBMISSIONS=true
MAX_SUBMISSION_BATCH_SIZE=20

# Sync wait used by quick "Run" in the IDE
ENABLE_WAIT_RESULT=true

# Multi-file / extra files support (required for compile-once ZIP submissions)
ENABLE_ADDITIONAL_FILES=true
```

Optional but useful on a homelab LAN:

```properties
# Leave blank to allow all origins (fine for private LAN)
ALLOW_ORIGIN=

# Optional: lock API to only the CodeIT server IP
# ALLOW_IP=192.168.1.20
```

Save and exit.

---

## Step 6 — Start Judge0

From the `judge0-v1.13.1` directory:

```bash
# 1) Start database + redis first
docker compose up -d db redis
# or: docker-compose up -d db redis

sleep 10

# 2) Start API server + workers
docker compose up -d
# or: docker-compose up -d

sleep 5
```

Check containers:

```bash
docker compose ps
# Expect: server, workers, db, redis — all Up / healthy
```

---

## Step 7 — Verify it works

On the Judge0 VM:

```bash
# API up?
curl -s http://127.0.0.1:2358/about

# Docs UI
# open in browser: http://<vm-ip>:2358/docs

# Multi-file language 89 must exist (CodeIT requires this)
curl -s http://127.0.0.1:2358/languages | grep -E '"id":89|"name".*[Mm]ulti'
```

Quick Python smoke test:

```bash
curl -s -X POST "http://127.0.0.1:2358/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(40+2)",
    "language_id": 71
  }'
```

You should see `"stdout":"42\n"` (or similar) and a successful status.

From another machine on the LAN (the one that will run CodeIT):

```bash
curl -s http://<judge0-vm-ip>:2358/about
```

If that fails, fix Proxmox/VM firewall / security groups for **TCP 2358**.

---

## Step 8 — What to send back to the CodeIT developer

Reply with:

1. **Base URL**, e.g. `http://192.168.1.50:2358`
2. Confirmation that:
   - `/about` works
   - language **89** is present
   - Python `language_id: 71` smoke test passed
3. Whether the VM is reachable only on LAN or also via VPN / public IP
4. If you set `ALLOW_IP` or auth tokens, share those details

The CodeIT backend will be configured like:

```bash
export JUDGE0_API_URL=http://192.168.1.50:2358
```

or in `application.properties`:

```properties
judge0.api.url=http://192.168.1.50:2358
```

No Judge0 API key is required unless you enable auth in `judge0.conf` (`AUTHN_TOKEN`). CodeIT currently expects an open (or IP-restricted) Judge0 URL.

---

## Day-2 operations

### Stop / start

```bash
cd ~/judge0-v1.13.1
docker compose down
docker compose up -d db redis && sleep 10 && docker compose up -d
```

### Logs

```bash
docker compose logs -f server
docker compose logs -f workers
```

### Update worker count later

1. Edit `COUNT=` in `judge0.conf`
2. Restart workers:

```bash
docker compose up -d --force-recreate workers
```

### Persistence

Postgres data lives in a Docker volume. Do not delete volumes unless you intend to wipe Judge0’s internal DB (submission history inside Judge0 — CodeIT keeps its own submission records separately).

---

## Security recommendations (homelab)

- Keep Judge0 on a **private VLAN / LAN**; do not expose `2358` to the public internet unless you know what you are doing.
- Prefer firewall allowlist: only the CodeIT API host → TCP 2358.
- Optionally set `ALLOW_IP` to the CodeIT server IP.
- Optionally enable `AUTHN_TOKEN` in `judge0.conf` (then CodeIT must be updated to send that header — currently it does not, so coordinate before enabling).
- Keep the VM updated: `sudo apt update && sudo apt upgrade`.

---

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| Submissions fail with sandbox / `/box/...` errors | cgroup v1 not enabled; redo Step 2 and confirm `Cgroup Version: 1` |
| Containers exit immediately | Check `REDIS_PASSWORD` / `POSTGRES_PASSWORD` are set |
| Port unreachable from CodeIT | Firewall / wrong IP / bind issue — test with `curl` from CodeIT host |
| Timeouts on big Java/C++ submits | Raise `COUNT`, give VM more CPU/RAM, confirm `MAX_*_TIME_LIMIT` values |
| Language 89 missing | Wrong Judge0 flavor — use **Judge0 CE** (`judge0/judge0`), not a stripped custom image |
| `docker-compose: command not found` | Use `docker compose` or install compose plugin |

---

## Architecture (how it fits CodeIT)

```text
[ Browser / CodeIT frontend ]
            |
            v
[ CodeIT Spring Boot API :9091 ]
            |
            |  HTTP  (submit / batch / poll)
            v
[ Judge0 on Proxmox VM :2358 ]
   ├── server   (API)
   ├── workers  (compile + run sandboxes)
   ├── postgres (Judge0 internal DB)
   └── redis    (Judge0 job queue)
```

CodeIT’s own PostgreSQL/Redis are separate. This Judge0 stack’s Postgres/Redis are **only for Judge0**.

---

## Checklist for the host admin

- [ ] Ubuntu 22.04 VM on Proxmox (not LXC)
- [ ] Nested virt enabled if possible; 4+ vCPU / 8 GB RAM preferred
- [ ] cgroup v1 enabled + rebooted
- [ ] Docker + Compose installed
- [ ] Judge0 v1.13.1 zip downloaded and extracted
- [ ] `REDIS_PASSWORD` and `POSTGRES_PASSWORD` set
- [ ] `MAX_CPU_TIME_LIMIT=30`, `MAX_WALL_TIME_LIMIT=45`, `COUNT` tuned
- [ ] `docker compose up -d` healthy
- [ ] `curl http://127.0.0.1:2358/about` works
- [ ] Language ID **89** present
- [ ] LAN URL shared with CodeIT developer (e.g. `http://x.x.x.x:2358`)

---

## Short answer for “send me a Dockerfile”

> We don’t need a custom Dockerfile. Please deploy official **Judge0 CE v1.13.1** with their `docker-compose.yml`. Follow `docs/JUDGE0_HOMELAB_DEPLOY.md`. When done, send us the URL `http://<vm-ip>:2358`.
