# Deploying EditMentor AI

Target architecture:

| Component | Platform | Notes |
| --- | --- | --- |
| Frontend (Next.js 14) | **Vercel** | Free tier is sufficient; no cold starts |
| Backend (FastAPI) | **Oracle Cloud** (Always Free VM) | Docker + Caddy TLS, single instance |
| Database (PostgreSQL 17) | **Supabase** | Already migrated — do not change |
| Scheduled jobs | **GitHub Actions** | `keepalive.yml` + `deploy-api.yml` |

The application contains no platform-specific SDKs. Everything below is
configuration: the frontend learns the API's address from one build-time
variable, and the backend learns the frontend's origin from two runtime
variables.

---

## Prerequisites

- The repo on GitHub (`simon-sudo-droid/media`, default branch `master`).
- The Supabase **session pooler** connection string
  (Supabase ▸ Project ▸ Connect ▸ Session pooler, port **5432**):
  `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
- A strong JWT secret: `openssl rand -hex 32`

> **Why the session pooler, not the direct connection?** It is
> IPv4-compatible and works with SQLAlchemy's connection pool. The app appends
> `sslmode=require` automatically for Supabase hosts
> (`backend/app/core/config.py`).

---

## Step 1 — Backend on an Oracle Cloud VM

Oracle Cloud is IaaS, so this is a real (but one-time) server setup. All the
assets live in `deploy/oracle/`.

### 1a. Create the VM

1. Sign up at <https://cloud.oracle.com> (Always Free; a card is required for
   identity verification but Always Free resources are never charged).
   **Your home region is permanent** — choose one close to Supabase
   (`ca-central-1`), e.g. *Canada Southeast (Toronto)*.
2. **Compute ▸ Instances ▸ Create instance**
   - **Image**: Canonical Ubuntu 22.04
   - **Shape**: `VM.Standard.A1.Flex` (Ampere ARM) — **1 OCPU / 6 GB RAM**.
     Always Free allows up to 4 OCPU / 24 GB total.
     *If you get "Out of host capacity", try another Availability Domain, retry
     later, or fall back to `VM.Standard.E2.1.Micro` (AMD, 1 GB).*
   - **Networking**: create a new VCN, **Assign a public IPv4 address**
   - **SSH keys**: paste your public key (`ssh-keygen -t ed25519` locally)
3. Note the **public IP** once it is running.

### 1b. Open the ports (both layers)

1. **Cloud firewall**: Instance ▸ Subnet ▸ Security List ▸ **Add Ingress Rules**
   — source `0.0.0.0/0`, TCP, destination ports **80** and **443**.
2. **Host firewall**: handled by `bootstrap.sh` below. Oracle's Ubuntu images
   `REJECT` everything but SSH in iptables, so opening the security list alone
   is not enough — this is the most common cause of "the server is unreachable".

### 1c. Point a hostname at the VM

TLS requires a real hostname; a bare IP cannot get a public certificate.
Free option: <https://www.duckdns.org> (sign in with GitHub/Google) → create a
subdomain, e.g. `editmentor-api` → set its IP to the VM's public IP. You now
have `editmentor-api.duckdns.org`.

### 1d. Bootstrap and run

SSH in (`ssh ubuntu@<VM-IP>`), then:

```bash
curl -fsSL https://raw.githubusercontent.com/simon-sudo-droid/media/master/deploy/oracle/bootstrap.sh | bash
# log out and back in so docker group membership applies
cd ~/editmentor/deploy/oracle
cp .env.example .env && nano .env      # fill in API_DOMAIN, DATABASE_URL, JWT_SECRET
docker compose -f docker-compose.prod.yml up -d --build
```

Verify (Caddy issues the certificate on first request — allow ~30 s):

```bash
curl https://<API_DOMAIN>/health     # → {"status":"ok","ai_provider":"mock"}
```

> **Keep one instance.** Video-generation jobs are held in process memory
> (`_VIDEO_JOBS` in `backend/app/services/ai_service.py`), so running a second
> container would make job polling fail intermittently.

### 1e. Automated deploys

`.github/workflows/deploy-api.yml` redeploys on every push to `master` that
touches `backend/**`. Add these repository secrets:

| Secret | Value |
| --- | --- |
| `OCI_HOST` | the VM's public IP |
| `OCI_USER` | `ubuntu` |
| `OCI_SSH_KEY` | the **private** key matching the VM's public key |

---

## Step 2 — Frontend on Vercel

1. Go to <https://vercel.com> and sign in with GitHub.
2. **Add New ▸ Project** ▸ import the repo.
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - Leave build and output settings at their defaults
4. **Environment Variables** ▸ add for all environments:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | `https://<your-duckdns-subdomain>.duckdns.org` from Step 1 |

5. **Deploy**, then note the production URL, e.g. `https://editmentor.vercel.app`.

> `NEXT_PUBLIC_*` variables are **inlined into the JavaScript bundle at build
> time**. Changing this value later requires a **redeploy** — setting the
> variable alone does nothing.

---

## Step 3 — Point the backend at the new frontend

On the VM, edit `~/editmentor/deploy/oracle/.env`:

| Variable | Value |
| --- | --- |
| `CORS_ORIGINS` | `https://<your-vercel-domain>` |
| `FRONTEND_URL` | `https://<your-vercel-domain>` |

then apply: `docker compose -f docker-compose.prod.yml up -d`

`CORS_ORIGINS` accepts a comma-separated list, so during a transition you can
allow several origins at once:

```
CORS_ORIGINS=https://editmentor.vercel.app,https://editmentor-web.onrender.com
```

Then verify from the Vercel site: sign in, open
the dashboard, and create/edit an item in Content Workspace.

---

## Step 4 — Repoint the scheduled jobs

`.github/workflows/keepalive.yml` runs every 10 minutes and:

1. warms both services,
2. calls `/industry/cron` so the daily Industry Monitoring digest is generated
   even if nobody opens the page,
3. redeploys a service that connects but never responds.

Update `WEB_URL` and `API_URL` to the Vercel and Oracle domains. Neither
platform sleeps the way Render's free tier did, so the warming and self-healing
steps become optional — the `/industry/cron` call is the part worth keeping.

> Scheduled workflows only run from the repository's **default branch**
> (`master`). Confirm runs appear under the repo's **Actions** tab.

---

## Local development (unchanged)

```powershell
docker compose up --build
```

- web → <http://localhost:3000>
- api → <http://localhost:8000> (docs at `/docs`)
- db  → local Postgres 16 in a container (not Supabase)

Copy `.env.example` to `.env` first; every value has a working default and the
app runs with no API keys (AI features fall back to deterministic output).

---

## Environment variable reference

**Backend (Oracle VM — `deploy/oracle/.env`)**

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | Supabase connection string |
| `JWT_SECRET` | **Yes** | Startup aborts if left at the dev default while `DEBUG` is false |
| `CORS_ORIGINS` | **Yes** | Comma-separated allowed browser origins |
| `FRONTEND_URL` | **Yes** | Used to build password-reset links |
| `DEBUG` | No | Defaults to `false` (production-safe) |
| `AI_PROVIDER` | No | `mock` (default) / `openai` / `claude` / `gemini` |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` | No | Only for the chosen provider |
| `ADMIN_EMAILS` | No | Comma-separated admin accounts |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | No | Real reset emails; unset = demo mode |

**Frontend (Vercel)**

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend base URL — baked in at build time |

---

## Notes

- **Uploads are never stored.** Images, video and Premiere XML arrive as base64
  in JSON, are analysed in memory, and discarded — so no object storage or
  persistent disk is needed. Mind the platform's request-body limit: Senior
  Editor accepts ~30 MB of base64 video, which exceeds the 4.5 MB limit on
  serverless functions. That is why the API needs a container host (the Oracle VM),
  not Vercel functions.
- **Schema management.** There is no Alembic. `Base.metadata.create_all()`
  creates new tables at startup and `backend/app/core/migrate.py` applies
  additive `ADD COLUMN IF NOT EXISTS` migrations, so repeat deploys are safe.
- **Seeding is idempotent** (`backend/app/seed.py`) — courses, quizzes,
  checklists, reference channels, FAQ and changelog are re-asserted on boot
  without duplicating rows.

---

## Appendix — Render (legacy, rollback only)

Render hosted both web services before this migration. `render.yaml` is kept
until the new stack has run cleanly for a few days; it provisions
`editmentor-api` and `editmentor-web` as Docker services and expects
`DATABASE_URL` (Supabase) to be set in the dashboard.

To fall back: set `NEXT_PUBLIC_API_URL` on the Render web service to the Render
API URL, redeploy both, and add the Render web origin to `CORS_ORIGINS`.

The Render **databases** are obsolete — the database is Supabase and nothing
reads Render Postgres.
