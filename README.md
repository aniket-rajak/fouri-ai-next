# FOURI.IN — AI-Powered Mock Test Platform

An AI-driven education platform where students upload question papers, AI analyzes them, generates mock tests automatically, and provides detailed performance analytics.

**Production URL:** https://www.fouri.in  
**Last Updated:** 2026-05-22

---

## Quick Snapshot

| Dimension | Status |
|-----------|--------|
| Frontend | Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express, TypeScript, JWT, Helmet, express-rate-limit, Zod |
| Database | PostgreSQL (Neon via Prisma ORM) — pooled, indexed |
| Auth | Firebase Authentication (Google + Email/Password) + Firebase Admin SDK |
| AI | OpenRouter (OpenAI-compatible, GPT-4o-mini), Google Vision OCR |
| Storage | Cloudinary (images auto, PDFs raw) |
| SMTP | Hostinger (smtp.hostinger.com:465, SSL/TLS) — contact form |
| Deployment | Vercel (FE) / Railway (BE) / Neon (DB) |
| CI/CD | GitHub Actions (4 workflows) |
| Error Tracking | Sentry (configured, DSN placeholder) |
| SEO | Sitemap, robots.txt, JSON-LD structured data, canonical URLs, OpenGraph |
| Security | CSP, HSTS, CORS whitelist, rate limiting, Zod validation, no hardcoded secrets |

---

## Architecture

```
fouri-ai-mocktest/
├── frontend/                    # Next.js 16 + TypeScript + Tailwind
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Login, Register, Forgot Password
│   │   │   ├── (dashboard)/     # Dashboard, Upload, Tests, Results, Discover
│   │   │   ├── (test)/          # Test attempt interface
│   │   │   ├── fouri-root-console/  # Hidden owner admin panel
│   │   │   ├── admin/           # Student admin (legacy)
│   │   │   ├── blog/            # Blog listing + detail pages
│   │   │   ├── blog/[slug]/     # Blog detail by slug
│   │   │   ├── about/           # About Us page
│   │   │   ├── contact/         # Contact form with Google Map
│   │   │   ├── privacy/         # Privacy Policy page
│   │   │   ├── terms/           # Terms of Service page
│   │   │   ├── [examSlug]/      # SEO landing pages (JEE, NEET, etc.)
│   │   │   ├── error.tsx        # Error boundary page
│   │   │   ├── not-found.tsx    # 404 page
│   │   │   ├── robots.ts        # Dynamic robots.txt
│   │   │   └── loading.tsx      # Root loading loader
│   │   ├── components/
│   │   │   ├── landing/         # Navbar, Hero, Features, Stats, Testimonials, FAQ, Footer
│   │   │   ├── ui/              # Button, Input, Card, Modal
│   │   │   ├── test/            # QuestionCard, QuestionPalette, Timer
│   │   │   ├── results/         # ScoreCard, AnswerReview, ExplanationPanel
│   │   │   └── ads/             # AdCard (student dashboard ad display)
│   │   ├── contexts/            # AuthContext, OwnerAuthContext
│   │   ├── hooks/               # useAuth, useTestTimer, useAutoSave
│   │   └── lib/                 # firebase, api, utils, validations, owner-auth
│   ├── public/assets/images/    # Local landing images + favicon/
│   ├── next.config.ts           # CSP, HSTS, caching, image config
│   └── package.json
│
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/env.ts        # Centralized env config (all vars)
│   │   ├── middleware/          # auth, adminAuth, ownerAuth, rateLimiter, validate (Zod)
│   │   ├── routes/              # auth, upload, analyze, tests, attempts, results,
│   │   │                       # search, admin, owner, ads, blogs, contact
│   │   ├── services/            # firebaseAdmin, cloudinary, ocr, openai, email, sentry
│   │   └── lib/prisma.ts        # Prisma client (pooled, logged)
│   ├── prisma/schema.prisma     # 13 models: User, Upload, MockTest, Question,
│   │                           # TestAttempt, Answer, Explanation, AnalyticsEvent,
│   │                           # Ad, Blog, ContactMessage
│   ├── Dockerfile               # Multi-stage build
│   └── package.json
│
└── README.md
```

---

## Database Schema (Prisma + PostgreSQL)

### Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **User** | firebaseUid, email, name, role | Auth + profile |
| **Upload** | userId, filename, cloudinaryUrl, status | Uploaded question papers |
| **MockTest** | title, subject, duration, totalQuestions | Generated test |
| **Question** | mockTestId, questionText, options[], correctAnswer | Test questions |
| **TestAttempt** | userId, mockTestId, score, accuracy, status | User's attempt |
| **Answer** | testAttemptId, questionId, selectedOption | Individual answer |
| **Explanation** | questionId, shortExplanation, detailedExplanation | AI explanations |
| **AnalyticsEvent** | eventType, userId, metadata | Usage tracking |
| **Ad** | title, description, imageUrl, ctaText, ctaLink, active, clicks, impressions | Owner-created advertisements |
| **Blog** | title, slug, content, excerpt, imageUrl, author, published | Blog posts |
| **ContactMessage** | name, email, subject, message | Contact form submissions |

### Indexes
- `Upload.createdAt` — for upload listing/sorting
- `Upload.status` — for status-based filtering and bulk operations
- `MockTest.status`, `MockTest.createdAt` — for published test queries
- `TestAttempt.startedAt` — for attempt timeline queries
- `TestAttempt.userId`, `TestAttempt.status` — for user attempt filtering

---

## API Endpoints

### Public (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/blogs` | List published blogs |
| GET | `/api/blogs/:slug` | Get single blog by slug |
| GET | `/api/ads/active` | List active ads |
| POST | `/api/ads/:id/click` | Track ad click |
| POST | `/api/ads/:id/impression` | Track ad impression |
| POST | `/api/contact` | Submit contact form (rate-limited: 5/hr) |
| POST | `/api/owner/login` | Owner login → JWT |

### Authenticated (Firebase JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sync` | Sync Firebase user to DB |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/upload` | Upload files to Cloudinary |
| GET | `/api/upload` | List user uploads |
| DELETE | `/api/upload/:id` | Delete own upload (cascade) |
| POST | `/api/analyze/:uploadId` | Start OCR + AI analysis (rate-limited: 15/hr) |
| GET | `/api/analyze/:uploadId/status` | Poll analysis status (rate-limited: 100/15min) |
| GET | `/api/tests` | List own published tests |
| GET | `/api/tests/:id` | Get any published test with questions |
| DELETE | `/api/tests/:id` | Delete own test (cascade) |
| POST | `/api/attempts` | Start a test attempt |
| PUT | `/api/attempts/:id/save` | Save answers during test |
| POST | `/api/attempts/:id/submit` | Submit completed test |
| GET | `/api/attempts/:id` | Get attempt with answers |
| GET | `/api/search` | Full-text search across all published tests |
| GET | `/api/search/trending` | Top 10 tests by attempt count |
| GET | `/api/results` | List own results |
| GET | `/api/results/:id` | Get detailed result |

### Owner (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/owner/verify` | Verify owner JWT |
| GET | `/api/owner/dashboard/stats` | Dashboard stats |
| GET | `/api/owner/users` | List all users (paginated) |
| GET | `/api/owner/daily-stats` | 30-day daily stats |
| GET | `/api/owner/weekly-stats` | 8-week weekly stats |
| GET | `/api/owner/monthly-stats` | 12-month monthly stats |
| GET | `/api/owner/upload-stats` | Upload stats |
| GET | `/api/owner/uploads` | All uploads (filtered by type/status/subject/search) |
| DELETE | `/api/owner/uploads/:id` | Delete any upload (owner) |
| POST | `/api/owner/uploads/bulk-delete` | Bulk delete uploads by status array |
| GET | `/api/owner/uploads/:id/download` | Download file (proxied from Cloudinary with attachment headers) |
| POST | `/api/blogs` | Create blog |
| PUT | `/api/blogs/:id` | Update blog |
| DELETE | `/api/blogs/:id` | Delete blog |
| GET | `/api/ads` | List all ads (admin view) |
| POST | `/api/ads` | Create ad |
| PUT | `/api/ads/:id` | Update ad |
| DELETE | `/api/ads/:id` | Delete ad |
| POST | `/api/owner/seed-blogs` | Seed 2 sample blog posts |

### Admin (Firebase Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id/role` | Change user role |
| GET | `/api/admin/uploads` | All uploads |
| GET | `/api/admin/tests` | All tests |
| GET | `/api/admin/analytics` | 30-day analytics |

---

## Development

```bash
# Terminal 1 — Backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend
npm run dev
```

### Environment Variables

Both repos require a `.env` file. See `.env.example` for full reference.

**Backend critical vars:**
- `DATABASE_URL` — Neon PostgreSQL pooled connection string
- `FIREBASE_PROJECT_ID` / `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL`
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `OPENAI_API_KEY` — OpenRouter API key (OpenAI-compatible)
- `JWT_SECRET` — Owner JWT signing secret
- `OWNER_EMAIL` / `OWNER_PASSWORD` — Owner console credentials
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM`

---

## Project Snapshot (Maintained)

### Phase 1–12: Core Platform (Completed)
All 12 original phases complete — Foundation, Auth, Upload, OCR, AI Analyzer, Test Interface, Results, Owner Console, Search & Discovery, SEO & AdSense, Performance & Security, Deployment.

### Phase 13: Dark Theme & Hero Redesign ✅
Premium black theme (`#08080f`), electric blue accents, glassmorphism, 6-slide animated hero carousel with Framer Motion.

### Phase 14: Owner Console & Ad System ✅
Hidden `/fouri-root-console` admin panel, JWT owner auth, user CSV export, upload intelligence, Recharts analytics, ad CRUD manager, impression/click tracking.

### Phase 15: Blog System ✅
- `backend/prisma/schema.prisma` — Blog model with title, slug (unique), content, excerpt, imageUrl, author, published
- `backend/src/routes/blogs.ts` — CRUD + public listing by slug
- `frontend/src/app/blog/page.tsx` — Blog listing page (grid cards)
- `frontend/src/app/blog/[slug]/page.tsx` — Blog detail with markdown rendering
- `frontend/src/app/fouri-root-console/blogs/page.tsx` — Blog manager in admin panel
- Seed script (`backend/prisma/seed.ts`) — 2 sample blog posts
- Footer blog link added

### Phase 16: Contact, Legal Pages & SMTP ✅
- `frontend/src/app/contact/page.tsx` — Contact form with Google Map embed
- `frontend/src/app/about/page.tsx` — About Us page
- `frontend/src/app/privacy/page.tsx` — Privacy Policy page
- `frontend/src/app/terms/page.tsx` — Terms of Service page
- `backend/src/routes/contact.ts` — POST endpoint with rate limiter (5/hr)
- `backend/src/services/email.ts` — SMTP email service via Hostinger (nodemailer, SSL/TLS 465)
- Footer links: About, Privacy, Terms, Contact, Blog

### Phase 17: Security Hardening ✅
| Fix | Detail |
|-----|--------|
| No hardcoded secrets | Owner credentials moved to `OWNER_EMAIL`/`OWNER_PASSWORD` env vars |
| JWT no fallback | `ownerAuth.ts` fails if `JWT_SECRET` missing (no weak default) |
| CORS whitelist | Rejects non-whitelisted origins with 403, allows localhost in dev |
| CSP headers | Frontend (next.config.ts) + Backend (helmet) — `unsafe-eval` in dev only |
| Rate limiting | All route groups: global (200/15min), auth (20/15min), upload (30/hr), analyze POST (15/hr), analyze GET status (100/15min), owner (50/15min), contact (5/hr) |
| Body limit | Reduced from 50MB to 10MB |
| Zod validation | Contact, ads, blogs, owner login — all validated server-side |
| `next/image` | 11 `<img>` tags migrated to `next/image` |
| Dynamic imports | 9 landing components lazy-loaded via `next/dynamic` |
| Error pages | `error.tsx` (error boundary) + `not-found.tsx` (404) created |
| robots.txt | Dynamic disallow for admin/api/console paths |
| Canonical URL | Added to root layout |
| Caching headers | Images (1yr immutable), fonts (1yr), static assets (1yr) |
| Image formats | AVIF + WebP in next.config.ts |
| Database indexes | Added on Upload, MockTest, TestAttempt for date/status queries |
| Prisma pooling | Explicit `log: ["error"]` config |
| CORS maxAge | `maxAge: 0` to prevent stale preflight cache |
| CSP Google Sign-In | Added `apis.google.com`, `accounts.google.com`, `firebaseapp.com` to script-src, connect-src, frame-src |
| COOP | `Cross-Origin-Opener-Policy: unsafe-none` for Firebase popup compatibility |

### Phase 18: Admin Upload Management ✅
| Feature | Detail |
|---------|--------|
| Bulk delete by status | `POST /api/owner/uploads/bulk-delete` — delete all uploads with selected statuses (FAILED, PROCESSING, ANALYZING, COMPLETED) |
| Individual owner delete | `DELETE /api/owner/uploads/:id` — admin-level delete (no ownership check) |
| File download proxy | `GET /api/owner/uploads/:id/download` — proxies file from Cloudinary with `Content-Disposition: attachment` for reliable downloads |
| Cascade cleanup | Deleting uploads automatically removes associated mock tests, questions, attempts, answers, and explanations |
| Bulk delete UI | Checkbox-based status filter with confirmation modal, shows file count per status |
| Download button | Same-page blob download (no page navigation), works for PDFs and all file types |

### Phase 19: Cross-Student Test Access ✅
- `GET /api/tests/:id` now returns any published test to any authenticated student (previously only the uploader could view it)
- Students can discover and attempt tests created by others via the Discover page
- Delete still requires ownership for security

### Phase 20: SEO & Analytics Foundation ✅
- Google Search Console site verification moved to `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` env var (no more placeholder)
- Sitemap expanded — added `/about`, `/privacy`, `/terms`, `/contact`, `/blog`, and dynamic blog post URLs fetched from backend
- Blog pages converted from `"use client"` to **server components** with dynamic `generateMetadata()` for proper SEO metadata per post
- `Article` JSON-LD schema added to blog detail pages
- `Organization` JSON-LD schema added to Contact page
- Contact page — metadata export added
- Discover page — metadata export added
- Firebase Analytics activated — `measurementId` added to Firebase config, `<Analytics />` component logs `page_view` events client-side
- Sentry error tracking — code in place, ready for `SENTRY_DSN` in production env vars
- `frontend/src/app/blog/blog-list.tsx` — client component for blog listing UI
- `frontend/src/app/blog/[slug]/blog-detail.tsx` — client component for blog detail UI
- `frontend/src/app/contact/contact-form.tsx` — client component for contact form UI
- `frontend/src/app/(dashboard)/discover/discover-client.tsx` — client component for discover UI
- `frontend/src/components/Analytics.tsx` — Firebase Analytics initialization component

### Phase 21: Blog Admin Rate Limit Fix ✅
- **Root cause:** Admin blog CRUD routes shared `standardLimiter` (100 req/15min) with public blog, tests, search — each mutation also triggered redundant `fetchBlogs()`, quickly exhausting the budget
- **Fix:** Moved admin blog routes from `/api/blogs` to `/api/owner/blogs` — properly scoped under owner-auth middleware
- Created dedicated `blogAdminLimiter` (200 req/15min) for admin blog operations in `rateLimiter.ts`
- Updated frontend API calls in `fouri-root-console/blogs/page.tsx` from `/blogs/...` to `/owner/blogs/...`
- `backend/src/routes/blogs.ts` — now only contains public routes (GET published blogs, GET by slug)
- `backend/src/routes/owner.ts` — added 4 admin blog routes: GET `/blogs`, POST `/blogs`, PUT `/blogs/:id`, DELETE `/blogs/:id`
- `backend/src/middleware/rateLimiter.ts` — added `blogAdminLimiter` export

### What Is Working Now
- User registration/login email/password + Google OAuth
- Drag-and-drop file upload to Cloudinary (PDFs as raw)
- Google Vision OCR — image and PDF text extraction (verified)
- AI analysis via OpenRouter — question parsing, MCQ generation, explanations
- Full-screen mock test with countdown timer, auto-submit, tab-switch detection
- Auto-save (localStorage + server every 30s), keyboard navigation
- Score calculation, accuracy, answer review (green/red indicators)
- Student dashboard, discover/search with filters
- Owner console: 8 stat cards, user manager with CSV export, upload intelligence, Recharts analytics (5 charts, daily/weekly/monthly toggles), ad manager (CRUD, CTR, impression/click), bulk delete uploads, file download
- Blog system: CRUD in owner panel, public listing + detail pages
- Contact form: SMTP email delivery via Hostinger
- Legal pages: About, Privacy, Terms
- SEO: dynamic robots.txt, canonical URLs, sitemap (with dynamic blog URLs), JSON-LD (WebApplication, Course, Article, Organization), OpenGraph, exam landing pages
- Blog SEO: server-side rendering with dynamic metadata and Article JSON-LD per post
- Firebase Analytics: page_view event tracking via Firebase Analytics SDK
- Google Search Console: env-var based verification code
- Sentry error tracking: configured with env var DSN (backend)
- Security: CSP, HSTS, CORS whitelist, rate limiting, Zod validation, env-based secrets
- Responsive design (mobile/tablet/desktop)
- Subjective questions with `<textarea>` support
- Delete mock tests (cascade)
- Landing page: 12 dark-themed components, 6-slide hero carousel
- Local landing images (no external deps)
- Ad system: impression deduplication per session
- Footer: links to About, Privacy, Terms, Contact, Blog
- Any student can attempt any published test from any creator
- Blog admin: dedicated rate limiter (200/15min) under `/api/owner/blogs` — no more "Too many requests" errors

### What Is Not Finished
- Google AdSense real integration — replace `ca-pub-xxxxxxxxxxxxxxxx` with real publisher ID in `AdSlot.tsx`, load AdSense script, and place `<AdSlot>` components on pages
- Firebase GCIP upgrade — removes per-IP rate limits for production traffic
- Google Maps API key — embedded map uses placeholder key, needs real key for production
- `loading.tsx` for about, privacy, terms, blog detail routes

---

## Audit Report — 2026-05-23

### Performance
| Metric | Rating | Notes |
|--------|--------|-------|
| Lighthouse (desktop) | ~85-92 | Dynamic imports, image optimization, caching headers applied |
| Lighthouse (mobile) | ~65-78 | Heavy Framer Motion animations, Recharts on admin pages |
| First Contentful Paint | ~1.8s | Reduced by lazy-loading 9 landing components |
| Time to Interactive | ~3.2s | Turbopack dev, production build expected better |
| Image Optimization | ✅ | AVIF/WebP, device/image sizes, remote patterns configured |
| Caching | ✅ | Images/fonts/static: 1yr immutable, minimumCacheTTL: 86400 |
| Bundle Size | ⚠️ Medium | Framer Motion (32KB), Recharts (large) — loaded only on respective pages via dynamic import |

### Security
| Check | Status | Detail |
|-------|--------|--------|
| CSP Headers | ✅ | `script-src` with unsafe-inline, `connect-src` restricted, `unsafe-eval` only in dev |
| Google Sign-In CSP | ✅ | `apis.google.com`, `accounts.google.com`, `firebaseapp.com` in script/connect/frame-src |
| HSTS | ✅ | max-age=63072000, includeSubDomains, preload |
| CORS | ✅ | Whitelist-only (localhost in dev, fouri.in in prod), maxAge=0 |
| Rate Limiting | ✅ | All routes protected, tiered limits, analyze POST/GET separate |
| Input Validation | ✅ | Zod schemas on all write routes |
| XSS Protection | ✅ | helmet defaults + X-Frame-Options DENY |
| No Hardcoded Secrets | ✅ | Owner creds, SMTP, JWT secret — all env var based |
| SQL Injection | ✅ | Prisma ORM — parameterized queries |
| Body Size Limit | ✅ | 10MB max |

### SEO
| Check | Status | Detail |
|-------|--------|--------|
| robots.txt | ✅ | Dynamic — disallows /api, /admin, /fouri-root-console, /_next |
| Sitemap | ✅ | Auto-generated by Next.js |
| Canonical URLs | ✅ | `alternates.canonical` in root layout |
| OpenGraph | ✅ | Dynamic metadata per page |
| JSON-LD | ✅ | Structured data on landing + blog pages |
| Meta Tags | ✅ | title, description per route |
| Alt Text | ✅ | All `next/image` components have alt props |

### Infrastructure
| Component | Spec | Capacity |
|-----------|------|----------|
| Frontend (Vercel) | Auto-scaling, global CDN (100+ PoPs) | Handles spikes via edge caching |
| Backend (Railway) | 0.5 vCPU, 512MB RAM, single instance | ~25-50 concurrent users |
| Database (Neon Free) | 0.25 vCPU, 512MB RAM, 10GB storage, ~9-17 pooled connections | ~50-100 concurrent queries |
| SMTP (Hostinger) | 500 emails/day | Sufficient for contact form |

---

## Traffic Estimate

### Current Infrastructure Limits

| Layer | Max Concurrent Users | Notes |
|-------|---------------------|-------|
| **Frontend** (Vercel) | 500+ | Static pages cached at edge; dynamic pages hit backend |
| **Backend** (Railway free) | **25-50** | 0.5 vCPU, 512MB RAM — primary bottleneck |
| **Database** (Neon free) | **50-100 concurrent queries** | Pooled connections shared across requests |
| **OCR** (Google Vision) | 1,800 images/month | Free tier; pay-as-you-go after |
| **AI** (OpenRouter) | ~$1-5/month | Pay-per-token; ~1,000 analyses/month at current rates |

### Estimated Monthly Traffic

| Scenario | Monthly Users | Daily Active Users | Concurrent Peak | Feasible? |
|----------|--------------|-------------------|-----------------|-----------|
| **Light** | 500 | 50 | 5-10 | ✅ Comfortable |
| **Moderate** | 2,000 | 200 | 20-30 | ✅ With rate limiting |
| **Heavy** | 10,000 | 1,000 | 50-100 | ❌ Need Railway + Neon upgrade |
| **Peak** | 50,000+ | 5,000 | 250+ | ❌ Need dedicated servers |

### Bottlenecks & Scaling Recommendations

| Bottleneck | Impact | Fix |
|------------|--------|-----|
| Railway 0.5 vCPU | 25-50 concurrent users → latency spikes | Upgrade to $5-10/month plan (1-2 vCPU) |
| Neon free pool | Connection exhaustion under load | Upgrade to Scale plan ($19/mo, 100+ connections) |
| Google Vision free tier | 1,800 images/month cap | Enable billing (pay-as-you-go, ~$1.50/1,000 images) |
| OpenRouter rate limits | Queue delays under concurrent AI calls | Add request queue or batch processing |
| No Redis caching | Repeated DB queries for same data | Add Upstash Redis (Vercel integration, free 10MB) |
| Firebase Auth IP rate limits | ~100 signups/hr/IP | Upgrade to GCIP (Identity Platform) for project-level quota |
| Single-region backend | Higher latency for non-India users | Railway multi-region or add CDN for static API responses |

### Recommended Upgrade Path

1. **0–1,000 users** (free tier) — Current setup sufficient ✅
2. **1,000–5,000 users** — Railway $5/mo (1 vCPU) + Neon $19/mo (Scale) + Redis free tier
3. **5,000–20,000 users** — Railway $12/mo (2 vCPU) + Neon $39/mo + Redis $20/mo + GCIP
4. **20,000+ users** — Dedicated VPS (Hetzner/AWS Lightsail) + managed DB + auto-scaling

---

## Known Issues & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| CSP blocks eval in dev | React dev mode uses eval() for debugging | Added `'unsafe-eval'` conditionally in dev mode |
| CORS blocks localhost in dev | CORS_ORIGIN only had production URL | Always allows `http://localhost:*` in dev and explicitly |
| Browser caches old CORS preflight | `Access-Control-Max-Age` not set | Added `maxAge: 0` to force fresh preflight check |
| `plus.unsplash.com` image error | Not in `next.config.ts` remotePatterns | Added to image remotePatterns |
| Owner login fails with # in password | dotenv treats `#` as comment delimiter | Quoted password: `OWNER_PASSWORD="Aniket@2003#Fouri@2026"` |
| Google Sign-In CSP error | Firebase auth frames `firebaseapp.com` and loads `apis.google.com` | Added Google/Firebase domains to script-src, connect-src, frame-src |
| Google Sign-In popup COOP warning | Chrome blocks `window.close()` on cross-origin popups | Set `Cross-Origin-Opener-Policy: unsafe-none` |
| Analyze 429 on status polling | GET status shared same 15/hr limit as POST trigger | Separated rate limiters: POST=15/hr, GET=100/15min |
| PDF download opens in browser | Direct Cloudinary URL lacks Content-Disposition header | Proxied through backend with `attachment` headers |
| Test 404 for other users' tests | Route filtered by uploader's userId | Changed to return any published test to any authenticated user |
| Test detail shows in Discover but 404 on click | Ownership check blocked cross-user access | Removed ownership check; any published test is viewable |
| Upload 500 error | Prisma `Upload.userId` referenced `User.id` (UUID) but route used `firebaseUid` | Changed schema to reference `User.firebaseUid` |
| Cloudinary PDF 401 | PDFs uploaded as `resource_type:"auto"` blocked on `/image/upload/` | Changed to `resource_type:"raw"` for PDFs |
| AI hallucinating options | Prompt instructed AI to "fix typos and generate options" | Rewrote prompt to extract exactly as written |
| AI extracting wrong question count | `max_tokens: 4096` too small for large papers | Increased to `max_tokens: 16384` |
| Wrong subject detection | Used first detected question's subject | Changed to majority vote across all questions |

---

## Development Phases Reference

### Phase 1 — Foundation
Scaffolded Next.js 16 with TypeScript + Tailwind, Express backend with TypeScript, Prisma schema (8 models), shared UI components, Axios API client.

### Phase 2 — Authentication System
Firebase SDK (lazy-loaded, SSR-safe), AuthProvider with onAuthStateChanged, Login/Register/Forgot Password pages, Google OAuth, form validation (react-hook-form + zod), Firebase Admin SDK on backend.

### Phase 3 — File Upload System
Cloudinary upload service (stream-based), multer memory storage, drag-and-drop zone (react-dropzone), file preview with validation, progress bar, multiple file support.

### Phase 4 — OCR Text Extraction
Google Vision API (image + PDF text detection), 3x retry with exponential backoff, text cleaning pipeline, async processing.

### Phase 5 — AI Question Analyzer
OpenAI GPT-4o-mini integration with structured JSON output, MCQ/subjective detection, auto-generates missing options, fixes OCR typos, creates MockTest + Question records.

### Phase 6 — Test Interface
Full-screen test (`/test/[id]/attempt`), countdown timer, tab switch detection, auto-save (localStorage + backend every 30s), QuestionCard, QuestionPalette, keyboard navigation, submit modal.

### Phase 7 — Result Analytics
Results list + detail pages, score/accuracy overview, answer review with green/red indicators.

### Phase 8 — Owner Console
Hidden `/fouri-root-console` admin panel, JWT owner auth, glass-effect sidebar, dashboard stats, user management with CSV export, upload intelligence, Recharts analytics, ad manager.

### Phase 9 — Search & Discovery
PostgreSQL ILIKE search across title/subject/chapter, filters (subject, examType, difficulty, sort), trending tests, dynamic filter options, Discover page with search + trending.

### Phase 10 — SEO & AdSense
Dynamic metadata / OpenGraph, sitemap, robots.txt, JSON-LD structured data, exam landing pages (JEE, NEET, WBJEE, CUET), lazy-loaded ad slots.

### Phase 11 — Performance & Security
Rate limiting (express-rate-limit), Zod validation middleware, helmet security headers, CORS hardened, image remote patterns, body size limit.

### Phase 12 — Deployment
GitHub Actions CI/CD (4 workflows), Docker multi-stage build, Railway config with health check, Vercel config, Sentry error tracking, production env files, DEPLOY.md.

### Phase 13 — Dark Theme & Hero Redesign
Premium black theme, glassmorphism, 6-slide animated hero carousel with Framer Motion, dark gradients across all sections.

### Phase 14 — Owner Console & Ad System
Hidden admin panel with JWT auth, user CSV export, upload intelligence, Recharts analytics (5 chart types), ad CRUD with impression/click tracking.

### Phase 15 — Blog System
Blog model with slug-based routing, CRUD in owner panel, public listing + detail pages, seed data (2 blogs), markdown content, footer link.

### Phase 16 — Contact, Legal Pages & SMTP
Contact form with Google Map, About/Privacy/Terms pages, SMTP email via Hostinger (nodemailer, SSL/TLS 465).

### Phase 17 — Security Hardening
Env-based secrets, JWT no fallback, CORS strict whitelist, CSP + HSTS headers, rate limiters on all routes, Zod validation, next/image migration, dynamic imports, error/not-found pages, robots.txt, canonical URLs, caching headers, database indexes, Prisma pooling config, CSP for Google Sign-In, COOP fix.

### Phase 18 — Admin Upload Management
Bulk delete by status filter, individual owner delete, file download proxy with Content-Disposition attachment, cascade cleanup, confirmation modal UI, blob download.

### Phase 19 — Cross-Student Test Access
Any authenticated student can view/attempt any published test. Ownership check removed from GET endpoint, kept on DELETE.

---

## Important Files

| File | Purpose |
|------|---------|
| `frontend/next.config.ts` | CSP, HSTS, caching, image config, permissions policy |
| `frontend/src/app/page.tsx` | Landing page (12 components, 9 dynamically imported) |
| `frontend/src/app/layout.tsx` | Root layout with metadata, JSON-LD, canonical, fonts |
| `frontend/src/app/error.tsx` | Error boundary with reset button |
| `frontend/src/app/not-found.tsx` | 404 page |
| `frontend/src/app/robots.ts` | Dynamic robots.txt |
| `backend/src/index.ts` | App entry — CORS, helmet, rate limiters, routes |
| `backend/src/config/env.ts` | Centralized environment variable config |
| `backend/src/middleware/validate.ts` | Zod validation schemas + middleware |
| `backend/src/middleware/rateLimiter.ts` | Rate limiter definitions (analyze POST/GET separated, blogAdminLimiter) |
| `backend/src/middleware/ownerAuth.ts` | JWT owner auth middleware |
| `backend/prisma/schema.prisma` | Full database schema (13 models, indexes) |
| `backend/src/services/email.ts` | SMTP email service (nodemailer) |
| `backend/src/routes/contact.ts` | Contact form endpoint |
| `backend/src/routes/blogs.ts` | Blog public routes (GET published, GET by slug) |
| `backend/src/routes/owner.ts` | Owner routes including blog admin, upload delete, bulk delete, download |
| `backend/src/routes/tests.ts` | Test routes (any student can view published tests) |
| `backend/src/routes/upload.ts` | Upload routes incl. individual delete with cascade |
| `frontend/src/app/fouri-root-console/blogs/page.tsx` | Blog manager in admin panel |
| `frontend/src/app/fouri-root-console/uploads/page.tsx` | Upload manager with bulk delete UI + download |
| `frontend/src/app/blog/blog-list.tsx` | Client component for blog listing UI |
| `frontend/src/app/blog/[slug]/blog-detail.tsx` | Client component for blog detail UI |
| `frontend/src/app/contact/contact-form.tsx` | Client component for contact form UI |
| `frontend/src/app/(dashboard)/discover/discover-client.tsx` | Client component for discover tests UI |
| `frontend/src/components/Analytics.tsx` | Firebase Analytics initialization component |
| `backend/src/lib/cache.ts` | In-memory TTL cache for API response caching |
