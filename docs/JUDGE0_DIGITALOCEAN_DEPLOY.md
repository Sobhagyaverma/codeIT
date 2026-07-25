# Judge0 on DigitalOcean Droplet — Complete Beginner Guide

This guide helps you put **Judge0** on a DigitalOcean **Droplet** so **CodeIT** can run and grade user code.

You do **not** need to be a programmer.  
Treat this like assembling furniture: follow each step in order, copy commands exactly, and check the “Did it work?” boxes before moving on.

---

## Plain-English picture (read this first)

Think of CodeIT as a restaurant:

| Part | Real-world analogy |
|------|--------------------|
| **CodeIT website** | The dining room (customers order food) |
| **CodeIT backend** | The kitchen manager (takes orders, sends work out) |
| **Judge0** | The actual cooking station (runs / “cooks” the code safely) |
| **DigitalOcean Droplet** | A small computer you rent in the cloud, 24/7 |

This guide only builds the **cooking station (Judge0)** on DigitalOcean.

When you finish, you will have a web address like:

```text
http://143.198.12.34:2358
```

You give that address to whoever configures CodeIT. CodeIT will call Judge0 at that URL.

---

## What you will need

| Item | Why |
|------|-----|
| A computer (Mac, Windows, or Linux) | To create the Droplet and type commands |
| An email + credit/debit card | DigitalOcean requires billing (they often give new-user credit) |
| About **45–90 minutes** | First time is slower; next time is faster |
| Patience | If something fails, stop and use the Troubleshooting section |

**Money note:** A Droplet like the one below usually costs roughly **$24–$48 / month**, depending on size. Check DigitalOcean’s pricing page for current numbers. You can destroy the Droplet anytime to stop billing.

---

## Words you will see (tiny glossary)

| Word | Meaning |
|------|---------|
| **Droplet** | A rented Linux computer in DigitalOcean’s cloud |
| **IP address** | The Droplet’s phone number on the internet, e.g. `143.198.12.34` |
| **SSH** | A secure way to “log into” that computer from your laptop |
| **Terminal** | A text window where you type commands |
| **Docker** | Software that runs Judge0’s pieces in neat boxes (“containers”) |
| **Port 2358** | The door number where Judge0 listens for requests |
| **sudo** | “Do this as administrator.” You may be asked for the Droplet password |

---

## Recommended Droplet size for CodeIT

| Setting | Minimum | Recommended |
|---------|---------|-------------|
| CPU | 2 vCPUs | **4 vCPUs** |
| RAM | 4 GB | **8 GB** |
| Disk | 50 GB | **80–160 GB SSD** |
| OS | Ubuntu | **Ubuntu 22.04 (LTS) x64** |

Bigger = faster judging when many people submit code at once.

---

# Part A — Create a DigitalOcean account and Droplet

## A1. Create an account

1. Open your browser and go to:  
   [https://www.digitalocean.com](https://www.digitalocean.com)
2. Click **Sign Up**.
3. Sign up with email (or Google/GitHub if offered).
4. Verify your email if they ask.
5. Add a payment method when prompted.

You should land in the DigitalOcean **Control Panel** (a dashboard with menus on the left).

---

## A2. (Recommended) Create an SSH key — easier & safer login

An SSH key is like a house key for your Droplet. Password login also works; keys are better.

### On a Mac

1. Open **Terminal** (Spotlight → type `Terminal` → Enter).
2. Paste this and press Enter:

```bash
ssh-keygen -t ed25519 -C "codeit-judge0"
```

3. When it asks for a file path, press **Enter** (accept the default).
4. When it asks for a passphrase:
   - Beginners may press **Enter** twice (no passphrase), **or**
   - Set a passphrase you will remember (safer).
5. Show your **public** key (safe to share with DigitalOcean):

```bash
cat ~/.ssh/id_ed25519.pub
```

6. You will see one long line starting with `ssh-ed25519 ...`.  
   Select the **entire line**, copy it.

### Add the key in DigitalOcean

1. In DigitalOcean, left menu → **Settings** → **Security** (wording may be **Account → Security**).
2. Under **SSH Keys**, click **Add SSH Key**.
3. Paste the long line into the box.
4. Name it something like `my-laptop`.
5. Save.

Keep this key selected when you create the Droplet in the next step.

---

## A3. Create the Droplet (the cloud computer)

1. In the Control Panel, click **Create** → **Droplets**.
2. Choose region: pick a city **close to you** (or close to where CodeIT will run). Example: Bangalore, Singapore, Frankfurt, New York.
3. **Image / OS:** choose **Ubuntu** → version **22.04 (LTS) x64**.  
   Do **not** pick Windows. Do **not** pick Docker “1-Click” unless you already know it — plain Ubuntu is clearer for this guide.
4. **Size:** choose a plan with at least **4 GB RAM**. Prefer **8 GB / 4 vCPU** for CodeIT.
5. **Authentication:**
   - Prefer **SSH key** (select the key you added).
   - Or choose **Password** and write the root password somewhere safe (password manager).
6. **Hostname:** optional name like `codeit-judge0`.
7. Leave other options default unless you know you need them.
8. Click **Create Droplet**.

Wait 30–60 seconds until the Droplet shows as **Active**.

---

## A4. Copy your Droplet’s IP address

On the Droplet card you will see something like:

```text
143.198.12.34
```

That is your Droplet IP. Write it down. In this guide we call it:

```text
YOUR_DROPLET_IP
```

Everywhere you see `YOUR_DROPLET_IP`, replace it with your real number.

---

## A5. Open the firewall door for Judge0 (important)

By default DigitalOcean may block many ports. Judge0 needs port **2358**.

### Option 1 — Cloud Firewall (recommended)

1. Left menu → **Networking** → **Firewalls** → **Create Firewall**.
2. Name: `judge0-firewall`.
3. **Inbound rules** (who may connect *to* your Droplet):

| Type | Protocol | Port Range | Sources | Purpose |
|------|----------|------------|---------|---------|
| SSH | TCP | 22 | Your IP (best) or All IPv4 | So you can log in |
| Custom | TCP | 2358 | All IPv4 **or** only CodeIT server IP | Judge0 API |

**Safer choice:** for port `2358`, allow only the IP of the machine that runs the CodeIT backend — not the whole internet.  
If you do not know that IP yet, you can temporarily allow **All IPv4**, then tighten later.

4. **Outbound rules:** leave default (allow all outbound).
5. Under **Apply to Droplets**, select your Judge0 Droplet.
6. Create / save the firewall.

### Option 2 — If you skip Cloud Firewall for now

You can still use Ubuntu’s own firewall later (Part F). Cloud Firewall is cleaner for beginners.

---

# Part B — Log into the Droplet from your laptop

## B1. Open Terminal / PowerShell

- **Mac:** Terminal app  
- **Windows:** PowerShell or Windows Terminal  
- **Linux:** any terminal

## B2. Connect with SSH

Replace `YOUR_DROPLET_IP` with your real IP:

```bash
ssh root@YOUR_DROPLET_IP
```

Examples:

```bash
ssh root@143.198.12.34
```

### First connection warnings

You may see:

```text
Are you sure you want to continue connecting (yes/no)?
```

Type:

```text
yes
```

and press Enter.

### If you used a password

Type the root password.  
**Note:** when you type a password in the terminal, characters often **do not appear**. That is normal. Type carefully and press Enter.

### If it worked

You should see a prompt similar to:

```text
root@codeit-judge0:~#
```

You are now “inside” the cloud computer. Everything you type next runs **on the Droplet**, not on your laptop.

### If SSH fails

| Problem | What to try |
|---------|-------------|
| `Connection timed out` | Wrong IP, Droplet not active, or firewall blocking port 22 |
| `Permission denied` | Wrong password, or SSH key not attached to this Droplet |
| `Connection refused` | Droplet still starting — wait 1 minute and retry |

---

# Part C — Prepare Ubuntu for Judge0

Stay logged in as `root` for this whole guide (simplest for beginners).

## C1. Update the system

Copy/paste this whole block, then press Enter:

```bash
apt update && apt upgrade -y
```

This can take several minutes. Wait until the prompt returns.

Install basic tools:

```bash
apt install -y curl wget unzip ca-certificates nano
```

**Did it work?** You should see no red error ending the command. The prompt returns.

---

## C2. Critical fix: switch to cgroup v1

Judge0’s sandbox often breaks on modern default settings. We must change one boot setting and reboot.

### Open the boot config file

```bash
nano /etc/default/grub
```

You are now in a simple text editor called **nano**.

### Find this line

Look for a line that looks like one of these:

```text
GRUB_CMDLINE_LINUX=""
```

or

```text
GRUB_CMDLINE_LINUX="something-already-here"
```

### Change it

Make sure it includes:

```text
systemd.unified_cgroup_hierarchy=0
```

**Examples:**

If the line was empty:

```text
GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"
```

If it already had text inside the quotes, put a space and add the new text inside the same quotes:

```text
GRUB_CMDLINE_LINUX="quiet systemd.unified_cgroup_hierarchy=0"
```

### Save and exit nano

1. Press **Ctrl + O** (letter O) to save  
2. Press **Enter** to confirm  
3. Press **Ctrl + X** to exit  

### Apply and reboot

```bash
update-grub
reboot
```

Your SSH session will disconnect. That is expected. Wait about **60–90 seconds**, then log in again:

```bash
ssh root@YOUR_DROPLET_IP
```

**Did it work?** You can log back in successfully.

---

# Part D — Install Docker (runs Judge0)

## D1. Install Docker

Paste:

```bash
curl -fsSL https://get.docker.com | sh
```

Wait until it finishes.

## D2. Check Docker works

```bash
docker --version
docker compose version
```

You should see version numbers for both.

**Note:** Older docs say `docker-compose` (with a hyphen). On modern Docker, `docker compose` (with a space) is normal. Both ideas are the same. This guide uses `docker compose`.

---

# Part E — Download and configure Judge0

## E1. Download Judge0 CE v1.13.1

```bash
cd ~
wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip
unzip judge0-v1.13.1.zip
cd judge0-v1.13.1
ls
```

You should see at least:

```text
docker-compose.yml
judge0.conf
```

Those two files are enough. You do **not** write a Dockerfile.

---

## E2. Create two strong passwords

Open this site on your laptop browser:

[https://www.random.org/passwords/?num=1&len=32&format=plain&rnd=new](https://www.random.org/passwords/?num=1&len=32&format=plain&rnd=new)

1. Copy password #1 → this will be `REDIS_PASSWORD`  
2. Refresh / generate again  
3. Copy password #2 → this will be `POSTGRES_PASSWORD`  

Paste both into a notes app temporarily. You will need them in the next step.

---

## E3. Edit Judge0 settings

Still in `~/judge0-v1.13.1`:

```bash
nano judge0.conf
```

### Find and set passwords

Find lines like:

```text
REDIS_PASSWORD=
POSTGRES_PASSWORD=
```

Set them to your generated passwords (no spaces around `=`):

```text
REDIS_PASSWORD=paste-password-1-here
POSTGRES_PASSWORD=paste-password-2-here
```

### Settings CodeIT needs

Find each setting (or add the line if missing) and set:

```text
COUNT=4

MAX_CPU_TIME_LIMIT=30
MAX_WALL_TIME_LIMIT=45

ENABLE_BATCHED_SUBMISSIONS=true
MAX_SUBMISSION_BATCH_SIZE=20

ENABLE_WAIT_RESULT=true
ENABLE_ADDITIONAL_FILES=true
```

What these mean in plain English:

| Setting | Meaning |
|---------|---------|
| `COUNT=4` | How many worker “chefs” can cook code at once |
| `MAX_CPU_TIME_LIMIT=30` | Allow longer jobs (CodeIT needs this) |
| `MAX_WALL_TIME_LIMIT=45` | Allow longer total wall-clock time |
| `ENABLE_BATCHED_SUBMISSIONS` | Allow several tests in one request |
| `ENABLE_WAIT_RESULT` | Needed for quick “Run” in the editor |
| `ENABLE_ADDITIONAL_FILES` | Needed for CodeIT’s multi-file judging (language 89) |

Optional (safer later):

```text
# ALLOW_IP=IP.of.CodeIT.backend.only
```

Leave `ALLOW_ORIGIN=` alone for now unless a developer asks you to change it.

### Save and exit nano

**Ctrl + O**, Enter, **Ctrl + X**.

---

# Part F — Start Judge0

From the folder `~/judge0-v1.13.1`:

```bash
cd ~/judge0-v1.13.1
```

## F1. Start database and Redis first

```bash
docker compose up -d db redis
```

Wait 10 seconds:

```bash
sleep 10
```

## F2. Start everything else

```bash
docker compose up -d
```

Wait a few more seconds:

```bash
sleep 5
```

## F3. Check that containers are running

```bash
docker compose ps
```

You want to see services like **server**, **workers**, **db**, **redis** in an **Up** / running state.

If something keeps restarting, jump to Troubleshooting.

---

# Part G — Prove it works

## G1. Check from inside the Droplet

```bash
curl -s http://127.0.0.1:2358/about
```

You should get JSON text mentioning Judge0 (not an empty error).

Check that language **89** exists (CodeIT needs this):

```bash
curl -s http://127.0.0.1:2358/languages | grep -E '"id":89'
```

You should see something with `"id":89`.

## G2. Run a tiny Python test

```bash
curl -s -X POST "http://127.0.0.1:2358/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(40+2)",
    "language_id": 71
  }'
```

Look for output similar to `"stdout":"42\n"` and a successful status.  
If you see sandbox / box / cgroup errors, go back to Part C2 (cgroup fix) and confirm after Docker:

```bash
docker info | grep -i cgroup
```

You want:

```text
Cgroup Version: 1
```

## G3. Check from your laptop browser

On your laptop, open:

```text
http://YOUR_DROPLET_IP:2358/docs
```

Example:

```text
http://143.198.12.34:2358/docs
```

If the docs page loads, Judge0 is reachable from the internet (or at least from your network).

Also try:

```text
http://YOUR_DROPLET_IP:2358/about
```

### If the browser cannot connect

Usually:

1. Cloud Firewall does not allow TCP **2358**
2. You typed the wrong IP
3. Judge0 containers are not running (`docker compose ps`)

---

# Part H — Give this to the CodeIT developer

Send them:

1. **Judge0 URL**

```text
http://YOUR_DROPLET_IP:2358
```

2. Confirmation checklist:

- [ ] `/about` works  
- [ ] Language **89** is present  
- [ ] Python smoke test printed `42`  
- [ ] Whether port 2358 is open to the whole internet or only specific IPs  

They will configure CodeIT like:

```bash
export JUDGE0_API_URL=http://YOUR_DROPLET_IP:2358
```

or in `application.properties`:

```properties
judge0.api.url=http://YOUR_DROPLET_IP:2358
```

**No API key is required** unless someone enables `AUTHN_TOKEN` in `judge0.conf`. CodeIT currently expects a reachable Judge0 URL (open or IP-restricted).

---

# Part I — Everyday operations (after it works)

Always go to the Judge0 folder first:

```bash
cd ~/judge0-v1.13.1
```

### Stop Judge0

```bash
docker compose down
```

### Start Judge0 again

```bash
docker compose up -d db redis
sleep 10
docker compose up -d
```

### Watch live logs (errors appear here)

```bash
docker compose logs -f server
```

Press **Ctrl + C** to stop watching (Judge0 keeps running).

Worker logs:

```bash
docker compose logs -f workers
```

### Change worker count later

1. Edit config:

```bash
nano judge0.conf
```

2. Change `COUNT=` (example: `COUNT=6`)  
3. Save, then recreate workers:

```bash
docker compose up -d --force-recreate workers
```

### Keep Ubuntu updated (monthly is fine)

```bash
apt update && apt upgrade -y
```

---

# Part J — Security (please read)

Judge0 runs other people’s code. Treat it carefully.

| Do this | Why |
|---------|-----|
| Prefer allowing only the CodeIT server IP on port **2358** | Stops random strangers from using your judge |
| Do not post your Droplet IP publicly if you can avoid it | Reduces abuse |
| Keep strong `REDIS_PASSWORD` / `POSTGRES_PASSWORD` | Required and safer |
| Use Ubuntu 22.04 + Judge0 **v1.13.1** | Older versions had serious security bugs |
| Do not enable network-from-code features unless a developer asks | Reduces risk |

**Important:** exposing Judge0 to the whole internet is convenient for demos, but riskier for production. Best practice is: only CodeIT’s backend can reach port 2358.

---

# Troubleshooting

| What you see | Likely cause | What to do |
|--------------|--------------|------------|
| Browser cannot open `:2358/docs` | Firewall / wrong IP / Judge0 down | Check Cloud Firewall TCP 2358; run `docker compose ps` |
| SSH timeout | Firewall blocking 22 or Droplet off | Allow SSH in firewall; confirm Droplet is Active |
| Containers exit immediately | Empty passwords in `judge0.conf` | Set both passwords, restart |
| Sandbox / `/box/` errors | cgroup still v2 | Redo Part C2; confirm `Cgroup Version: 1` |
| Submissions timeout | Droplet too small / `COUNT` too high | Use more RAM/CPU, or lower `COUNT` |
| Language 89 missing | Wrong Judge0 package | Use official Judge0 CE zip from this guide |
| `docker compose: command not found` | Docker install incomplete | Re-run Part D |
| `Permission denied` on Docker | Not running as root / group issue | Stay as `root`, or log out/in after adding user to `docker` group |

### Useful status commands

```bash
cd ~/judge0-v1.13.1
docker compose ps
docker compose logs --tail=100 server
docker compose logs --tail=100 workers
curl -s http://127.0.0.1:2358/about
docker info | grep -i cgroup
```

---

# How this fits CodeIT

```text
[ User browser → CodeIT frontend ]
                |
                v
[ CodeIT Spring Boot API ]
                |
                |  HTTP requests
                v
[ Judge0 on DigitalOcean Droplet :2358 ]
     ├── server   (receives jobs)
     ├── workers  (compile & run code safely)
     ├── postgres (Judge0’s own small database)
     └── redis    (Judge0’s job queue)
```

Judge0’s Postgres/Redis are **only for Judge0**.  
CodeIT has its **own** separate database. Do not mix them up.

---

# Final checklist

- [ ] DigitalOcean account created and billing added  
- [ ] Droplet created: **Ubuntu 22.04**, preferably **4 vCPU / 8 GB**  
- [ ] Noted `YOUR_DROPLET_IP`  
- [ ] Firewall allows **SSH (22)** and **Judge0 (2358)**  
- [ ] Can SSH: `ssh root@YOUR_DROPLET_IP`  
- [ ] cgroup v1 set + rebooted  
- [ ] Docker installed  
- [ ] Judge0 v1.13.1 downloaded and unzipped  
- [ ] `REDIS_PASSWORD` and `POSTGRES_PASSWORD` set  
- [ ] CodeIT limits set (`MAX_CPU_TIME_LIMIT=30`, `MAX_WALL_TIME_LIMIT=45`, etc.)  
- [ ] `docker compose up -d` healthy  
- [ ] `http://YOUR_DROPLET_IP:2358/about` works  
- [ ] Language **89** present  
- [ ] Python test returns `42`  
- [ ] URL shared with CodeIT developer  

---

## Short summary

1. Rent an Ubuntu 22.04 Droplet on DigitalOcean.  
2. Fix cgroup, install Docker, download Judge0.  
3. Set passwords + CodeIT limits in `judge0.conf`.  
4. Start with `docker compose`.  
5. Open port **2358**, test `/about`, send `http://YOUR_DROPLET_IP:2358` to CodeIT.

You do **not** need a custom Dockerfile.
