# Railway Deployment Guide (CodeTrack)

## 1. Requirements

- A GitHub repo with this project pushed
- A Railway account
- A Railway PostgreSQL service in the same project

## 2. Railway Services Setup

1. Create a new Railway project.
2. Add a **PostgreSQL** service.
3. Add a **GitHub Repo** service and select this repository.

## 3. Environment Variables (Web Service)

Set these in your Railway web service variables:

```bash
DATABASE_URL="${{Postgres.DATABASE_URL}}"
NEXTAUTH_SECRET="replace-with-a-long-random-string"
NEXTAUTH_URL="https://<your-railway-domain>"
NODE_ENV="production"
```

Notes:

- Use Railway's PostgreSQL reference variable for `DATABASE_URL`.
- After first deployment, replace `NEXTAUTH_URL` with your final custom domain if you attach one.
- If build logs show Node 18, add `NIXPACKS_NODE_VERSION=20` in the web service variables and redeploy.

How to set `DATABASE_URL` correctly:

- Do not paste a manual URL from GitHub.
- In Railway variable value, click **Add Reference** and select the PostgreSQL service `DATABASE_URL`.

How to get `NEXTAUTH_URL`:

- Open your Railway web service.
- Go to **Settings -> Networking**.
- Copy the generated public domain (for example, `your-app.up.railway.app`).
- Set `NEXTAUTH_URL` to `https://<that-domain>`.

## 4. Build and Start Commands

This repo already includes Railway-ready scripts and `railway.json`:

- Build command: `npm run railway:build`
- Start command: `npm run railway:start`

What they do:

- `railway:build` runs Prisma client generation + Next.js build.
- `railway:start` runs `prisma db push` before starting the server so schema stays in sync.

## 5. Deploy

1. Trigger deploy from Railway (or push to your default branch).
2. Open deployment logs and confirm:
    - Prisma client generated successfully
    - `prisma db push` succeeded
    - Next.js server started

## 6. Post-Deploy Checks

1. Open `<your-domain>/register` and create a test account.
2. Login through `<your-domain>/login`.
3. Verify API health quickly using:
    - `<your-domain>/api/stats`
    - `<your-domain>/api/leaderboard`

## 7. Troubleshooting

- `PrismaClientInitializationError`:
    - Confirm `DATABASE_URL` is set in the **web service** (not only Postgres service).
- NextAuth redirect/session issues:
    - Ensure `NEXTAUTH_URL` exactly matches deployed domain with `https://`.
- `db push` fails:
    - Check Postgres service is running and the reference variable resolves correctly.
