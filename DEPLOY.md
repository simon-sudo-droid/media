# Deploying EditMentor AI to a public URL (Render)

This deploys the **whole stack** — Postgres + FastAPI API + Next.js web — to
[Render](https://render.com) using the `render.yaml` blueprint in this repo.
The result is a stable, always-reachable link you can send to anyone.

> The app is already configured for this. You only need to do the account
> steps below (GitHub + Render), which require your login.

---

## Step 1 — Put the code on GitHub

Render deploys from a Git repo. The project is already a local git repo with a
commit. Create an **empty** GitHub repo (no README), then push:

```powershell
cd "C:\Users\Simon Chao\Downloads\SImon's Project 2"
git remote add origin https://github.com/<your-username>/editmentor-ai.git
git branch -M main
git push -u origin main
```

(If you don't have a GitHub account, create one free at https://github.com/signup.)

---

## Step 2 — Deploy on Render

1. Sign up / log in at **https://dashboard.render.com** (free; "Sign in with GitHub" is easiest).
2. Click **New ▸ Blueprint**.
3. Select your **editmentor-ai** repo and click **Connect**.
4. Render reads `render.yaml` and shows 3 resources to create:
   - `editmentor-db` (Postgres)
   - `editmentor-api` (FastAPI)
   - `editmentor-web` (Next.js)
5. Click **Apply**. First build takes ~5–10 min.

When it finishes, your shareable link is the **editmentor-web** service URL:

```
https://editmentor-web.onrender.com
```

(Render shows the exact URL on the service page — names may get a suffix if
taken. Send that link to anyone; sign-up works for them too.)

---

## Notes

- **Free tier:** services sleep after ~15 min idle, so the first visit after
  inactivity takes ~50 s to wake (then it's fast). The free Postgres expires
  after 90 days — fine for demos. Upgrade to paid for always-on.
- **AI tools** run in `mock` mode. To go live, set `AI_PROVIDER=openai` (or
  `claude`) and add the API key in the `editmentor-api` service ▸ Environment.
- **Database is wired automatically** via the blueprint; no manual config.
- **CORS** is set to `*` (the app uses Bearer-token auth, so this is safe). To
  lock it down, set `CORS_ORIGINS` on the API to your exact web URL.

## Alternative: Vercel (frontend) + Render (API + DB)

If you prefer Vercel for the frontend: deploy `backend/` on Render (or Railway),
then import `frontend/` on Vercel and set `NEXT_PUBLIC_API_URL` to your API's
public URL. The code already supports this — no changes needed.
