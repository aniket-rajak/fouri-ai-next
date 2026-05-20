# Deployment Guide

## Prerequisites

- GitHub account
- Vercel account (for frontend)
- Railway account (for backend)
- Neon or Supabase account (for PostgreSQL)
- Sentry account (for error tracking)

## 1. Database Setup

1. Create a PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com)
2. Copy the connection string (starts with `postgresql://`)
3. Run migrations:
   ```bash
   cd backend
   npx prisma db push
   ```

## 2. Environment Variables

### Backend (Railway)

Set these in Railway dashboard:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK client email |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GOOGLE_VISION_CREDENTIALS` | Full Google service account JSON |
| `OPENAI_API_KEY` | OpenAI API key |
| `SENTRY_DSN` | Sentry DSN (optional) |
| `JWT_SECRET` | Random secret string |
| `CORS_ORIGIN` | Frontend URL (e.g., `https://fouri.in`) |

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
| `NEXT_PUBLIC_API_URL` | Backend Railway URL + `/api` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (optional) |

## 3. Deploy Backend (Railway)

### Option A: GitHub Integration (Recommended)
1. Push code to GitHub
2. Go to [Railway](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo, set the root directory to `backend`
4. Add all environment variables in Railway dashboard
5. Railway auto-detects the Dockerfile and deploys

### Option B: Railway CLI
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

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
| `deploy-backend.yml` | Push to main in `backend/` | Deploy to Railway |

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `RAILWAY_TOKEN` | Railway API token |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase config for CI build |

## 6. Post-Deployment

1. **Verify health:** `GET https://your-backend.railway.app/api/health`
2. **Sync DB:** Run `npx prisma db push` via Railway dashboard
3. **Set domain:** Configure custom domain in Vercel + Railway
4. **Google Search Console:** Add site, submit sitemap at `https://fouri.in/sitemap.xml`
5. **AdSense:** Update publisher ID in `AdSlot.tsx`

## 7. Monitoring

- **Errors:** [Sentry](https://sentry.io) — traces exceptions in both FE + BE
- **Uptime:** Railway provides built-in health checks
- **Logs:** Available in Railway dashboard for backend
- **Analytics:** Vercel Analytics or Google Analytics
