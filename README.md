# EditMentor AI

> The AI-powered platform that helps video editors become world-class — Duolingo for editing, MasterClass for skills, Grammarly for editing decisions.

MVP v1. Built with a professional, scalable, containerized architecture.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) · React · TypeScript · Tailwind CSS · shadcn-style UI |
| Backend | FastAPI (Python 3.12) · SQLAlchemy 2 |
| Database | PostgreSQL 16 (Supabase-compatible) |
| Auth | JWT email/password (Clerk-ready) |
| AI | Provider-agnostic (OpenAI / Claude) with built-in mock fallback |
| Infra | Docker Compose |

The whole stack runs in Docker — **you do not need Node or Python installed locally.**

---

## Quick start

```bash
# 1. Configuration (already done if .env exists)
cp .env.example .env        # works out of the box, no keys required

# 2. Build & run everything
docker compose up --build
```

Then open:

- **Web app** → http://localhost:3000
- **API docs (Swagger)** → http://localhost:8000/docs
- **API health** → http://localhost:8000/health

Sign up with any email + password (6+ chars) and you're in. The database is
seeded automatically with courses, quizzes, challenges, and all 9 reference
channels on first boot.

To stop: `Ctrl+C`, then `docker compose down` (add `-v` to also wipe the DB).

---

## What's included (MVP v1)

- **Landing page** — hero, features, testimonials, pricing, FAQ, CTA, auth.
- **Auth** — real signup/login with JWT; share the link and people can register.
- **Dashboard** — XP, skill level, streak, level progress, courses completed,
  daily challenge, recent activity.
- **Learning Academy** — Foundations, Intermediate, Advanced, plus Color,
  Audio & Typography academies, with lessons you complete for XP.
- **Reference Channels** — all 9 channels with style, what-to-learn, and recs.
- **AI Tools** — Script→B-roll generator, Storytelling Coach, Slide Analyzer.
- **Quizzes** — 5 topic quizzes with scoring, explanations, and XP.
- **Challenges** — daily / b-roll / editing challenges with streaks.
- **Gamification** — XP, levels, streaks, leaderboard.

---

## Architecture

```
SImon's Project/
├── docker-compose.yml        # db + api + web
├── .env / .env.example       # all config (sane local defaults)
├── backend/                  # FastAPI
│   └── app/
│       ├── core/             # config, database, security (JWT)
│       ├── models/           # SQLAlchemy ORM
│       ├── schemas/          # Pydantic I/O
│       ├── api/routes/       # auth, content, quizzes, challenges, ai, dashboard
│       ├── services/         # gamification, ai_service (provider fallback)
│       ├── seed.py           # idempotent content seeding
│       └── main.py
└── frontend/                 # Next.js
    ├── app/                  # landing, login, signup, (app)/* protected pages
    ├── components/ui/        # shadcn-style primitives
    └── lib/                  # api client + auth context
```

---

## Plugging in real services (when you have keys)

Everything below is **optional** — the app is fully functional without it.

### AI (OpenAI or Claude)
In `.env`:
```
AI_PROVIDER=openai            # or: claude
OPENAI_API_KEY=sk-...         # or ANTHROPIC_API_KEY=sk-ant-...
```
Restart the `api` service. All three AI tools switch from mock to live; if a
call ever fails, they gracefully fall back to mock. See
`backend/app/services/ai_service.py`.

### Supabase (managed Postgres)
Point the backend at Supabase by setting `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql+psycopg://postgres:[password]@db.[ref].supabase.co:5432/postgres
```
No code changes needed.

### Clerk (managed auth)
The auth layer is isolated in `backend/app/core/security.py` +
`frontend/lib/auth.tsx`. To migrate: add Clerk keys, set `AUTH_PROVIDER=clerk`,
swap the frontend `AuthProvider` for Clerk's `<ClerkProvider>`, and verify the
Clerk JWT in `get_current_user`. The `users.external_id` column already exists
for mapping Clerk users.

---

## Deployment

Production stack (see **[DEPLOY.md](DEPLOY.md)** for step-by-step instructions):

| Component | Platform |
| --- | --- |
| Frontend (Next.js) | **Vercel** — root directory `frontend`, set `NEXT_PUBLIC_API_URL` |
| Backend (FastAPI) | **Railway** — root directory `backend`, builds `backend/Dockerfile` |
| Database (PostgreSQL) | **Supabase** — set `DATABASE_URL` to the session-pooler URL |
| Scheduled jobs | **GitHub Actions** — `.github/workflows/keepalive.yml` |

- The backend needs a **long-running container** (not serverless): uploads
  arrive as base64 up to ~30 MB and video jobs are held in process memory, so
  run it as a **single instance**.
- Set a strong `JWT_SECRET` (`openssl rand -hex 32`) and pin `CORS_ORIGINS` to
  your real frontend domain(s) — it accepts a comma-separated list.

---

## Roadmap (next phases)

- **Phase 2:** Video Critic (upload + AI scoring), badges/achievements engine,
  image upload for the Slide Analyzer (vision model), course lesson media.
- **Phase 3:** Clerk migration, Stripe billing for Pro/Teams, team dashboards,
  Supabase storage, email notifications, and analytics.
```
