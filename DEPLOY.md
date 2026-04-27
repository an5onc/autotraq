# AutoTraQ — Railway Deployment Guide

## Architecture

Railway runs two services from this monorepo:

| Service | Directory | Port |
|---------|-----------|------|
| **Backend** (Express API) | `backend/` | `$PORT` (Railway-assigned) |
| **Frontend** (Vite/React) | `frontend/` | `$PORT` (Railway-assigned) |
| **MySQL** | Railway add-on | 3306 |

---

## Step 1 — Create Railway Project

1. Go to [railway.app](https://railway.app) and create a **New Project**.
2. Connect your GitHub repo.

---

## Step 2 — Provision MySQL

1. In the project dashboard, click **+ New** → **Database** → **MySQL**.
2. Railway auto-creates a `MYSQL_URL` variable. You'll reference this below.

---

## Step 3 — Deploy the Backend

1. Click **+ New** → **GitHub Repo** → select this repo.
2. Set **Root Directory** to `backend`.
3. Railway will detect `backend/railway.json` automatically.

### Environment Variables

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Copy from the MySQL service's `MYSQL_URL` (or use Railway's variable reference: `${{MySQL.MYSQL_URL}}`) |
| `JWT_SECRET` | Generate a random string (`openssl rand -hex 32`) |
| `FRONTEND_URL` | Your frontend URL, e.g. `https://cs490unco.org` |
| `ENABLE_STARTUP_SEED` | Optional. Set to `true` only for a fresh demo database that needs seed accounts. |
| `PORT` | Leave unset — Railway injects this automatically |
| `NODE_ENV` | `production` |

### What Happens on Deploy

Per `railway.json`:
- **Build:** `npm install` → `prisma generate` → `tsc`
- **Start:** `prisma db push` → `node dist/index.js`

This auto-applies schema changes to the database on every deploy.

---

## Step 4 — Deploy the Frontend

1. Click **+ New** → **GitHub Repo** → select this repo again.
2. Set **Root Directory** to `frontend`.

### Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your backend's Railway URL, e.g. `https://autotraq-backend-production.up.railway.app` |

> ⚠️ `VITE_` vars are baked in at **build time**. If you change the backend URL, redeploy the frontend.

### What Happens on Deploy

Per `railway.json`:
- **Build:** `npm install` → `tsc && vite build`
- **Start:** `vite preview --host 0.0.0.0 --port $PORT`

---

## Step 5 — Run Migrations & Seed

After the first successful backend deploy:

1. Open the backend service in Railway.
2. Go to the **Settings** tab → **Run Command** (or use Railway CLI).
3. Run one-off commands via Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli
railway login
railway link   # select your project

# Run from backend directory
cd backend
railway run npx prisma db push
railway run npm run db:seed-admins
railway run npm run db:seed-vehicles
```

Or trigger seeds by temporarily changing the start command:

```
npx prisma db push --accept-data-loss && npm run db:seed-admins && npm run start
```

Then revert after the first deploy.

---

## Step 6 — Generate Public URLs

1. For each service, go to **Settings** → **Networking** → **Generate Domain**.
2. Note both URLs. Set the backend URL as `VITE_API_URL` on the frontend service.

---

## Default Admin Accounts

After seeding (`npm run db:seed-admins`):

| Email | Password | Role |
|-------|----------|------|
| `acordeiro@autotraq.app` | `autotraq2026` | admin |
| `team1@autotraq.app` | `autotraq2026` | admin |
| `team2@autotraq.app` | `autotraq2026` | admin |
| `team3@autotraq.app` | `autotraq2026` | admin |
| `team4@autotraq.app` | `autotraq2026` | admin |

**Change these passwords immediately after first login.**

---

## Troubleshooting

- **Build fails on Prisma:** Make sure `DATABASE_URL` is set before build. Prisma generate doesn't need the DB, but `db push` does.
- **Frontend can't reach backend:** Check `VITE_API_URL` is correct and the backend has CORS configured for the frontend domain.
- **MySQL connection refused:** Ensure `DATABASE_URL` uses the Railway internal URL (not public) for service-to-service communication.
