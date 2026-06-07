# Deployment Guide

## Prerequisites

- GitHub account
- Vercel account (for frontend)
- Render account (for backend)
- Neon account (for PostgreSQL)
- Sentry account (for error tracking)

## 1. Database Setup

1. Create a PostgreSQL database on [Neon](https://neon.tech)
2. Copy the connection string (starts with `postgresql://`)
3. Run migrations:
   ```bash
   cd backend
   npx prisma db push
   ```

## 2. Environment Variables

### Backend (Render)

Set these in Render dashboard:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK client email |
| `GROQ_API_KEY` | Groq API key (free, replaces OpenRouter) |
| `JWT_SECRET` | Random secret string |
| `OWNER_EMAIL` | Owner console email |
| `OWNER_PASSWORD` | Owner console password |
| `BREVO_API_KEY` | Brevo transactional email API key |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for file storage |
| `TELEGRAM_CHANNEL_ID` | Telegram channel ID for file storage |
| `CORS_ORIGIN` | Frontend URL (e.g., `https://fouri.in`) |
| `SENTRY_DSN` | Sentry DSN (optional) |

### Frontend (Vercel)

Set these in Vercel dashboard:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_API_URL` | Backend Render URL + `/api` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (optional) |

## 3. Deploy Backend (Render)

### Option A: Render Blueprint (Recommended)
1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → New + → Blueprint
3. Connect your GitHub repo — Render auto-detects `backend/render.yaml`
4. Fill in the secret environment variables in the Render dashboard
5. Deploy

### Option B: Manual Web Service
1. Go to [Render Dashboard](https://dashboard.render.com) → New + → Web Service
2. Connect your GitHub repo, set root directory to `backend`
3. Render auto-detects the Dockerfile
4. Add all environment variables in Render dashboard
5. Deploy

## 4. Deploy Frontend (Vercel)

### Option A: Vercel GitHub Integration (Recommended)
1. Push code to GitHub
2. Go to [Vercel](https://vercel.com) → Add New Project → Import GitHub Repo
3. Set root directory to `frontend`
4. Add all environment variables prefixed with `NEXT_PUBLIC_`
5. Deploy

### Option B: Vercel CLI
```bash
npm i -g vercel
cd frontend
vercel --prod
```

## 5. CI/CD (GitHub Actions)

The following workflows are configured:

| Workflow | Trigger | Action |
|----------|---------|--------|
| `frontend.yml` | PR/push to `frontend/` | Lint + typecheck + build |
| `backend.yml` | PR/push to `backend/` | Typecheck + Prisma generate |
| `deploy-frontend.yml` | Push to main in `frontend/` | Deploy to Vercel |
| `deploy-backend.yml` | Push to main in `backend/` | Deploy to Render |

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `RENDER_API_KEY` | Render API token |
| `RENDER_SERVICE_ID` | Render service ID |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase config for CI build |

## 6. Post-Deployment

1. **Verify health:** `GET https://fouri-ai-next-1.onrender.com/api/health`
2. **Sync DB:** Run `npx prisma db push` via Render Shell or locally
3. **Set domain:** Configure custom domain in Vercel + Render
4. **Google Search Console:** Add site, submit sitemap at `https://fouri.in/sitemap.xml`
5. **AdSense:** Update publisher ID in `AdSlot.tsx`

## 7. Monitoring

- **Errors:** [Sentry](https://sentry.io) — traces exceptions in both FE + BE
- **Uptime:** Render provides built-in health checks
- **Logs:** Available in Render dashboard for backend
- **Analytics:** Vercel Analytics or Google Analytics
