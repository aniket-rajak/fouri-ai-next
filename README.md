# FOURI.IN — AI-Powered Mock Test Platform

An AI-driven education platform where students upload question papers, AI analyzes them, generates mock tests automatically, and provides detailed performance analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Lucide React, Recharts |
| Backend | Node.js, Express, TypeScript, JWT |
| Database | PostgreSQL (via Prisma ORM) |
| Auth | Firebase Authentication (Google + Email/Password) |
| File Storage | Cloudinary |
| OCR | Google Vision API |
| AI | OpenAI (GPT-4o-mini) |
| Deployment | Vercel (FE) / Railway (BE) / Neon (DB) |

## Architecture

```
fouri-ai-mocktest/
├── frontend/          # Next.js 16 + TypeScript + Tailwind
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Login, Register, Forgot Password
│   │   │   ├── (dashboard)/     # Dashboard, Upload, Tests, Results
│   │   │   ├── fouri-root-console/  # Hidden owner admin panel (login, dashboard, users, uploads, analytics, ads)
│   │   │   └── (test)/          # Test attempt interface
│   │   ├── components/
│   │   │   ├── landing/          # Navbar, Hero, Features, Footer (dark theme)
│   │   │   ├── ui/              # Button, Input, Card
│   │   │   ├── test/            # QuestionCard, QuestionPalette, Timer
│   │   │   ├── results/         # ScoreCard, AnswerReview, ExplanationPanel
│   │   │   └── ads/             # AdCard (student dashboard ad display)
│   │   ├── contexts/            # AuthContext
│   │   ├── hooks/               # useAuth, useTestTimer, useAutoSave
│   │   └── lib/                 # firebase, api, utils, validations, owner-auth (JWT context)
│   ├── public/
│   │   └── assets/images/       # Local Unsplash images (hero, showcase, testimonials, ai-analysis)
│   ├── .env.example
│   └── package.json
│
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/              # Environment config
│   │   ├── middleware/          # Auth, Admin, Rate Limiter, OwnerAuth (JWT middleware)
│   │   ├── routes/             # auth, upload, analyze, tests, attempts, results, owner, ads
│   │   ├── services/           # firebaseAdmin, cloudinary, ocr, openai
│   │   └── lib/                # Prisma client
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── .env.example
│   └── package.json
│
└── README.md
```

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

### Enums

- `Role`: USER, ADMIN
- `UploadStatus`: PROCESSING, ANALYZING, COMPLETED, FAILED
- `TestStatus`: DRAFT, PUBLISHED
- `AttemptStatus`: IN_PROGRESS, COMPLETED, TIMEOUT
- `Difficulty`: EASY, MEDIUM, HARD
- `QuestionType`: MCQ, SUBJECTIVE

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/sync` | Yes | Sync Firebase user to DB |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/upload` | Yes | Upload files to Cloudinary |
| GET | `/api/upload` | Yes | List user uploads |
| POST | `/api/analyze/:uploadId` | Yes | Start OCR + AI analysis |
| GET | `/api/analyze/:uploadId/status` | Yes | Poll analysis status |
| GET | `/api/tests` | Yes | List user's mock tests |
| GET | `/api/tests/:id` | Yes | Get test with questions |
| DELETE | `/api/tests/:id` | Yes | Delete a mock test (cascades to questions, attempts, explanations) |
| POST | `/api/attempts` | Yes | Start a test attempt |
| PUT | `/api/attempts/:id/save` | Yes | Save answers during test |
| POST | `/api/attempts/:id/submit` | Yes | Submit completed test (calculates score) |
| GET | `/api/attempts/:id` | Yes | Get attempt with questions + answers |
| GET | `/api/admin/stats` | Admin | Dashboard stats (users/uploads/tests/attempts) |
| GET | `/api/admin/users` | Admin | List all users with counts |
| PATCH | `/api/admin/users/:id/role` | Admin | Change user role (sets Firebase custom claims) |
| GET | `/api/admin/uploads` | Admin | All uploads with user + test info |
| GET | `/api/admin/tests` | Admin | All mock tests with creator + counts |
| GET | `/api/admin/analytics` | Admin | 30-day analytics + AI usage stats |
| GET | `/api/search` | Yes | Full-text search with filters (q, subject, examType, difficulty, sort, page) |
| GET | `/api/search/trending` | Yes | Top 10 tests by attempt count |
| GET | `/api/results` | Yes | List all attempts/results |
| GET | `/api/results/:id` | Yes | Get detailed result |
| POST | `/api/owner/login` | No | Owner login (email + password) → JWT |
| GET | `/api/owner/verify` | Owner | Verify owner JWT token |
| GET | `/api/owner/dashboard/stats` | Owner | Dashboard stats (users/uploads/tests/attempts/AI calls/OCR rate) |
| GET | `/api/owner/users` | Owner | List all users with search, sort, pagination |
| GET | `/api/owner/daily-stats` | Owner | 30-day daily signups/uploads/attempts |
| GET | `/api/owner/weekly-stats` | Owner | 8-week weekly signups/uploads/attempts |
| GET | `/api/owner/monthly-stats` | Owner | 12-month monthly signups/uploads/attempts |
| GET | `/api/owner/upload-stats` | Owner | Upload stats by type, status, subject |
| GET | `/api/owner/uploads` | Owner | All uploads with search, type/status/subject filters |
| GET | `/api/ads/active` | No | List active ads (public, used by student dashboard) |
| GET | `/api/ads` | No | List all ads |
| POST | `/api/ads` | Owner | Create ad |
| PUT | `/api/ads/:id` | Owner | Update ad |
| DELETE | `/api/ads/:id` | Owner | Delete ad |
| POST | `/api/ads/:id/click` | No | Track ad click |
| POST | `/api/ads/:id/impression` | No | Track ad impression |
| GET | `/api/ads/active` | No | List active ads (public, used by student dashboard) |
| GET | `/api/ads` | Yes | List all ads (admin) |
| POST | `/api/ads` | Yes | Create ad |
| PUT | `/api/ads/:id` | Yes | Update ad |
| DELETE | `/api/ads/:id` | Yes | Delete ad |
| POST | `/api/ads/:id/click` | No | Track ad click |
| POST | `/api/ads/:id/impression` | No | Track ad impression |

---

## Development Phases

### Phase 1 — Foundation ✅
- Scaffolded Next.js 16 frontend with TypeScript + Tailwind
- Initialized Express backend with TypeScript
- Set up Prisma schema (8 models, all enums)
- Created `.env.example` files for both repos
- Shared UI components (Button, Input, Card)
- Axios API client with auth interceptor

### Phase 2 — Authentication System ✅
- Firebase SDK setup (lazy-loaded, SSR-safe)
- AuthProvider context with `onAuthStateChanged` listener
- Login page (email/password + Google OAuth)
- Register page (email/password + Google OAuth)
- Forgot password page
- Form validation (react-hook-form + zod)
- Protected route wrapper (auth guard in dashboard layout)
- Firebase Admin SDK on backend for ID token verification
- `POST /api/auth/sync` — upserts user from Firebase to PostgreSQL

### Phase 3 — File Upload System ✅
- Cloudinary upload service (stream-based)
- `POST /api/upload` — multer memory storage, 20MB limit, JPG/PNG/JPEG/PDF
- Drag-and-drop zone (react-dropzone)
- File preview with type/size validation
- Upload progress bar
- Multiple file support

### Phase 4 — OCR Text Extraction ✅
- Google Vision API service (image + PDF text detection)
- 3x retry with exponential backoff
- Text cleaning (normalize unicode, remove artifacts)
- Async processing pipeline

### Phase 5 — AI Question Analyzer ✅
- OpenAI GPT-4o-mini integration with structured JSON output
- Detects: question text, MCQ options, correct answer, type, difficulty, subject, topic
- Auto-generates missing MCQ options
- Fixes OCR typos
- Creates MockTest + Question records in DB
- `generateExplanation()` for short/detailed explanations

### Phase 6 — Test Interface ✅
- Backend: Attempts route (`POST /api/attempts`, `PUT /:id/save`, `POST /:id/submit`, `GET /:id`)
- Score calculation on submit (correct count, accuracy percentage)
- Auto-increment attempt count on MockTest
- Fullscreen test interface (`/test/[id]/attempt`)
- `useTestTimer` hook — server-synced countdown, tab switch detection (warn → auto-submit), warning at 5min
- `useAutoSave` hook — saves to localStorage + backend every 30s, restores on reload
- `QuestionCard` — renders MCQ option buttons with selection state, plus `<textarea>` for subjective questions with internal state + blur-based save
- `QuestionPalette` — color-coded grid (answered/skipped/marked-for-review)
- Keyboard navigation: ← → for prev/next, 1-4 for options (skipped when typing in form elements)
- Submit confirmation modal with summary
- Mobile-responsive layout with collapsible bottom palette

### Phase 7 — Result Analytics ✅
- Results list page (`/results`) with score/accuracy cards
- Results detail page (`/results/[id]`)
- Score overview: total, correct, wrong, accuracy
- Answer review: green/red indicators per option
- Backend: `GET /api/results`, `GET /api/results/:id` with full answer details

### Phase 8 — Owner Console (Hidden Admin Panel) ✅
- Hidden route at `/fouri-root-console` — no public links, no registration
- Owner auth via JWT with credentials from backend `.env` (`OWNER_EMAIL`, `OWNER_PASSWORD`)
- Dedicated `ownerAuth` middleware (`middleware/ownerAuth.ts`) protecting all owner and ad write routes
- Login page with password show/hide toggle and error states, redirect via `useEffect` (no render-time navigation)
- Glass-effect dark sidebar with navigation: Dashboard, Users, Uploads, Analytics, Ad Manager
- Dashboard: 8 stat cards auto-refreshing every 30s, upload processing status bars, quick actions menu
- Users page: search by name/email, sort newest/oldest, paginated table, CSV export (all fields + emails-only)
- Uploads page: 4 summary stat cards, file type / status / **subject** filter dropdowns, search, download, delete
- Analytics page: 5 Recharts charts with **Daily / Weekly / Monthly** toggle buttons — AreaChart (signups), BarChart (uploads), LineChart (attempts), PieChart (file types), horizontal BarChart (top subjects)
- Ad Manager: create/edit form with image preview, toggle active/disabled, CTR display, delete

### Phase 9 — Search & Discovery ✅
- `GET /api/search` — PostgreSQL ILIKE search across title, subject, chapter
- Filters: subject, examType, difficulty, sort (newest/popular), pagination
- `GET /api/search/trending` — top 10 tests by attempt count
- Dynamic filter options returned from distinct DB values
- `SearchBar` component with form-based query submission
- `FilterPanel` with dropdowns for subject, exam type, difficulty, sort
- Discover page (`/discover`) with search + trending section
- Added Discover to dashboard sidebar navigation

### Phase 10 — SEO & Adsense ✅
- Dynamic metadata / OpenGraph
- Sitemap, robots.txt
- JSON-LD structured data
- Lazy-loaded ad slots

### Phase 11 — Performance & Security ✅
- Rate limiting: `express-rate-limit` with per-route limits (global: 200/15min, auth: 20/15min, upload: 30/hr, analyze: 15/hr)
- Input validation middleware (`validate.ts`) with Zod schemas for attempts, auth, role updates
- `helmet` security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- CORS hardened with credentials
- Security headers in `next.config.ts` via custom headers API
- `loading.tsx` pages for heavy routes (test attempt, results detail, discover)
- Image remote patterns configured for Cloudinary + Google
- `express.json` body size limit (50mb)

### Phase 12 — Deployment ✅
- GitHub Actions CI/CD: 4 workflows (frontend CI, backend CI, deploy frontend, deploy backend)
- `backend/Dockerfile` — multi-stage build (builder → runner) for Railway
- `backend/railway.json` — Railway deployment config with health check
- `frontend/vercel.json` — Vercel config with headers + regions
- Sentry error tracking: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Backend Sentry: `services/sentry.ts` with `captureError()` + global error handler
- Production env files: `.env.production.example` for both repos
- `DEPLOY.md` — full deployment guide (DB setup, env vars, deploy steps, CI/CD, monitoring, post-deploy)
- Google Search Console & AdSense post-deploy steps documented

---

## Project Status

**Overall Progress:** ~100% complete
**Current Phase:** All 14 phases complete
**Last Updated:** 2026-05-21

### Completed: 14/14 phases
- Phase 1: Foundation
- Phase 2: Authentication System
- Phase 3: File Upload System
- Phase 4: OCR Text Extraction
- Phase 5: AI Question Analyzer
- Phase 6: Test Interface
- Phase 7: Result Analytics
- Phase 8: Owner Console (Hidden Admin Panel)

### Project Complete 🎉

All 14 phases are complete. See below for the full project snapshot.

---

## Project Snapshot

**Last Updated:** 2026-05-21
**Overall Progress:** ~100% complete (14/14 phases done)

- Phase 1: Foundation (Next.js + Express + Prisma + PostgreSQL schema)
- Phase 2: Authentication (Firebase login/register/forgot-password, Google OAuth, JWT verification)
- Phase 3: File Upload (drag-and-drop, Cloudinary, progress bar, file validation, PDF raw upload fix)
- Phase 4: OCR (Google Vision text extraction, retry logic, text cleaning — verified working end-to-end)
- Phase 5: AI Analyzer (OpenAI GPT-4o-mini, question parsing, MCQ generation)
- Phase 6: Test Interface (fullscreen exam, question nav, timer, auto-save, keyboard shortcuts)
- Phase 7: Result Analytics (score cards, answer review, accuracy metrics)
- Phase 8: Owner Console (hidden JWT-protected admin panel, user management with CSV, upload intelligence Recharts analytics, ad manager)
- Phase 9: Search & Discovery (full-text search, filters, trending tests)
- Phase 10: SEO & Adsense (landing pages, sitemap, structured data, ad slots, metadata)
- Phase 11: Performance & Security (rate limiting, input validation, security headers, code splitting)
- Phase 12: Deployment (GitHub Actions CI/CD, Docker, Railway, Vercel, Sentry, deployment guide, `CORS_ORIGIN` set to `https://www.fouri.in`)
- Phase 13: Dark Theme & Hero Redesign (premium black theme, electric blue accents, glassmorphism cards, 6-slide animated hero with Framer Motion, dark gradients across all sections)
- Phase 14: Owner Console & Ad System (hidden `/fouri-root-console` admin panel with JWT auth, user management with CSV export, upload intelligence, Recharts analytics dashboard, ad CRUD manager, student dashboard ad display with impression/click tracking)

### What Is Working Now
- User registration/login with email/password and Google OAuth (with detailed Firebase error toasts instead of generic messages)
- Drag-and-drop file upload to Cloudinary (PDFs uploaded as raw resources for public access)
- Google Vision OCR — image and PDF text extraction (verified working end-to-end)
- AI analysis via OpenRouter (OpenAI-compatible) — question parsing, MCQ generation, explanations
- AI prompt rewritten for strict extraction (exact copy, no hallucination, no limit on question count)
- Subject detection via majority voting across all detected questions for accuracy
- max_tokens increased to 16384 to handle large exam papers (50+ questions)
- Full-screen mock test interface with countdown timer and auto-submit
- Tab-switch detection, auto-save (localStorage + server), keyboard navigation
- Score calculation, answer review with green/red indicators
- Admin dashboard with user/upload/test analytics
- Search with filters (subject, exam, difficulty, sort)
- SEO landing pages (JEE, NEET, WBJEE, CUET) with structured data + sitemap
- Neon PostgreSQL database connected and synced
- Firebase Auth + Admin SDK configured
- Prisma schema with relations referencing `firebaseUid` for consistent user ID handling
- Homepage redesigned with premium dark theme (#08080f black, #111118 charcoal, electric blue #3b82f6 accents), glassmorphism cards, dark gradients throughout
- cursor-pointer on all buttons (shared Button component + raw \<button\> elements)
- Question options normalized (string, object, or array) in QuestionCard + backend routes
- Responsive design across all pages (mobile/tablet/desktop)
- Dark mode removed (light-only) from globals.css to avoid style conflicts
- Subjective questions supported with dedicated `<textarea>` (resizable, internal state, blur-saved)
- Delete mock tests via trash icon with confirmation modal and loading state
- Dashboard header redesigned — clean alignment, rounded touch targets, Sign Out label on desktop, truncated email
- `DELETE /api/tests/:id` backend endpoint with ownership verification and cascade delete
- Frontend deployed on Vercel at https://www.fouri.in
- Backend deployed on Railway at https://brave-passion-production-d8a1.up.railway.app
- `CORS_ORIGIN` configured to `https://www.fouri.in` on Railway
- Firebase Auth authorized domains include `fouri.in`
- Hero section rebuilt as premium 6-slide animated carousel with auto-play, manual controls, pagination, and Framer Motion transitions (fade, slide, scale, stagger)
- 12 landing components in `src/components/landing/` — Navbar, HeroSection, FeatureBar, WhatFouriDoes, AIAnalysis, StatsSection, CTABanner, MockTestShowcase, HowItWorks, Testimonials, FAQSection, Footer
- Hidden owner console at `/fouri-root-console` with JWT-based login, sidebar navigation, and full-page guards
- Owner dashboard with 8 stat cards (users, uploads, tests, attempts, AI calls, OCR rate), upload processing status bars, and quick action buttons
- User management panel with search (name/email), sort (newest/oldest), paginated table, and CSV export (all fields + emails-only)
- Upload intelligence panel with 4 summary stat cards, type/status filter dropdowns, search, download, and delete actions
- Analytics dashboard with 5 Recharts charts (AreaChart daily signups, BarChart daily uploads, LineChart daily attempts, PieChart file types, horizontal BarChart top subjects) — all with dark theme styling
- Ad Manager with create/edit form, image preview, toggle active/disabled, CTR display, and delete
- Student dashboard right sidebar displaying active ads with glassmorphism cards, impression tracking, and click tracking
- All buttons have `cursor-pointer` across landing components (HeroSection dots/nav, Navbar hamburger, Testimonials dots/nav)
- Upload flow shows green "Start Mock Test" button immediately after AI analysis completes
- Animated loading loader for root app loading + consistent loading in discover, results detail, test attempt
- Local assets directory (`public/assets/images/`) with 14 downloaded Unsplash photos, all landing images reference local paths
- Weekly and monthly analytics endpoints + frontend toggle (Daily/Weekly/Monthly) in admin analytics
- Subject/topic filter on uploads intelligence page
- Real-time auto-refreshing dashboard (30s interval with manual refresh button)
- Owner JWT auth middleware protecting all admin API routes
- Password visibility toggle (eye/eye-off icons) on login and register forms
- Auth error handling improved — shows actual Firebase/backend error messages instead of generic "Registration failed" or "Request failed with status code 500"
- Backend `/api/auth/sync` returns specific error codes (409 for duplicate email, 503 for DB connection issues) with descriptive messages for easier debugging

### What Is Not Finished
- Google AdSense real integration (needs publisher ID in `AdSlot.tsx`)
- Google Search Console site verification (replace `your-google-site-verification` in `layout.tsx`)
- Sentry DSN (error tracking) — not yet configured
- Firebase Identity Platform (GCIP) upgrade — removes per-IP rate limits for production traffic (current free tier triggers `auth/too-many-requests` under high traffic)

### Next Steps
- Run `npx prisma db push` if schema changes
- Configure GitHub secrets for CI/CD
- Upgrade Firebase Auth to GCIP for production-scale rate limits
- Insert real Google AdSense publisher ID and Search Console verification tag

### Production URLs

| Service | URL |
|---------|-----|
| **Frontend** | https://www.fouri.in |
| **Backend API** | https://brave-passion-production-d8a1.up.railway.app/api |
| **Health Check** | https://brave-passion-production-d8a1.up.railway.app/api/health |
| **Database** | Neon PostgreSQL (managed) |

### Local Development

```bash
# Terminal 1 — Backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend
npm run dev
```

Visit **http://localhost:3000** (dev) or **https://www.fouri.in** (prod) to use the app. Login/register, upload a paper, and generate mock tests.

### Important Files

| File | Purpose |
|------|---------|
| `frontend/src/app/layout.tsx` | Root layout with metadata, JSON-LD, fonts |
| `frontend/src/app/page.tsx` | Homepage — composes 12 dark-themed landing components |
| `frontend/src/components/landing/HeroSection.tsx` | Premium 6-slide animated hero carousel with Framer Motion |
| `frontend/src/components/landing/Navbar.tsx` | Glass-effect dark navbar with blur on scroll |
| `frontend/src/components/landing/Footer.tsx` | Dark navy footer with watermark |
| `frontend/src/app/globals.css` | Tailwind CSS v4 dark theme, custom animations, glass utilities |
| `frontend/src/app/(test)/test/[id]/attempt/page.tsx` | Core test-taking interface |
| `frontend/src/components/FileUpload.tsx` | Drag-and-drop upload with progress |
| `frontend/src/components/ProcessingStatus.tsx` | Analysis polling with Start Mock Test button |
| `frontend/src/components/test/QuestionCard.tsx` | Question rendering with options normalization |
| `frontend/src/components/ui/Button.tsx` | Shared button component (cursor-pointer) |
| `frontend/src/lib/firebase.ts` | Firebase client SDK (SSR-safe) |
| `frontend/src/contexts/AuthContext.tsx` | Auth provider with session persistence |
| `frontend/src/app/globals.css` | Tailwind CSS v4 setup (light-only, responsive helpers) |
| `backend/src/services/ocr.ts` | Google Vision OCR with retry |
| `backend/src/services/openai.ts` | OpenAI question analysis + explanations |
| `backend/src/routes/attempts.ts` | Test attempt lifecycle (start/save/submit) |
| `backend/src/routes/tests.ts` | Test retrieval with options normalization |
| `backend/src/routes/results.ts` | Result details with options normalization |
| `backend/src/services/cloudinary.ts` | Cloudinary upload (PDF raw fix) |
| `frontend/src/lib/owner-auth.tsx` | Owner JWT context (OwnerProvider, useOwner, useOwnerApi) |
| `frontend/src/app/fouri-root-console/page.tsx` | Owner login page |
| `frontend/src/app/fouri-root-console/layout.tsx` | Admin shell with sidebar nav + auth guard |
| `frontend/src/app/fouri-root-console/dashboard/page.tsx` | Owner dashboard (stats cards, upload status, quick actions) |
| `frontend/src/app/fouri-root-console/users/page.tsx` | User management (search, sort, pagination, CSV export) |
| `frontend/src/app/fouri-root-console/uploads/page.tsx` | Upload intelligence (filters, stats, actions) |
| `frontend/src/app/fouri-root-console/analytics/page.tsx` | Recharts analytics dashboard (5 chart types) |
| `frontend/src/app/fouri-root-console/ads/page.tsx` | Ad manager (create, edit, toggle, delete) |
| `frontend/src/app/(dashboard)/layout.tsx` | Student dashboard layout with ad sidebar |
| `backend/src/routes/owner.ts` | Owner auth + management routes |
| `backend/src/routes/ads.ts` | Ad CRUD + tracking routes |
| `backend/src/config/env.ts` | Owner credentials + all env config |
| `backend/src/middleware/ownerAuth.ts` | JWT owner auth middleware for admin routes |
| `backend/prisma/schema.prisma` | Full database schema (11 models incl. Ad) |
| `frontend/src/app/loading.tsx` | Root animated loading loader (dark theme) |
| `frontend/public/assets/images/` | Local Unsplash images (hero, showcase, testimonials, ai-analysis) |
| `README.md` | This file |

### Known Issues & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Upload 500 error | Prisma `Upload.userId` referenced `User.id` (UUID), but route used `firebaseUid` | Changed schema to reference `User.firebaseUid` |
| Cloudinary PDF 401 | PDFs uploaded as `resource_type: "auto"` → blocked on `/image/upload/` path | Changed to `resource_type: "raw"` for PDFs |
| AI hallucinating options | Prompt instructed AI to "fix typos and generate options" | Rewrote prompt: "extract exactly as written, no hallucination, no generating options" |
| AI extracting wrong number of questions | `max_tokens: 4096` too small for large papers | Increased to `max_tokens: 16384` |
| Wrong subject detection | Used first detected question's subject | Changed to majority vote across all questions |
| Question options not rendering | Stored as string or object in DB, expected array | Added `normalizeOptions()` helper + backend normalization in routes |
| cursor-pointer missing on buttons | Not set on raw `<button>` elements | Added cursor-pointer to Button.tsx + all raw buttons (9 files) |
| Subjective questions missing input | Only showed placeholder text, no input field | Replaced with `<textarea>` — internal state, blur-saves to parent, resizable |
| Firebase Auth 400 on signup (intermittent) | Per-IP rate limiting on Firebase Auth free tier (~100 signups/hr/IP) | Upgrade to GCIP (Identity Platform) for project-wide quota; added user-friendly error toast on rate limit |

### Notes
- Framer Motion powers all animations across 12 landing components (slide transitions, stagger reveal, floating elements, animated counters)
- Dark theme palette: `#08080f` (bg), `#111118` (surface), `#3b82f6` (electric blue accent), `#f5f5f7` (text), `#888899` (muted)
- Firebase Admin SDK needs `FIREBASE_PRIVATE_KEY` and `FIREBASE_CLIENT_EMAIL` in backend `.env`
- Google Vision OCR is configured and verified working — needs Cloud Vision API enabled + billing on GCP project
- OpenAI/OpenRouter needs `OPENAI_API_KEY` in backend `.env`
- Cloudinary PDF uploads use `resource_type: "raw"` for public access (images use `"auto"`)
- Prisma `Upload.userId` and `TestAttempt.userId` reference `User.firebaseUid` (not `User.id`)
- Google AdSense needs real publisher ID in `AdSlot.tsx` (`data-ad-client`)
- Database needs PostgreSQL running with `DATABASE_URL` configured
- Run `npx prisma db push` to sync schema before first use
- Owner console available at `/fouri-root-console` — credentials hardcoded in `backend/src/config/env.ts`
- All landing page images are stored locally in `public/assets/images/` — no external image dependencies for landing
- Impression tracking deduplicates per session via a React `Set` ref to avoid counting refreshes
- All admin API calls use `useOwnerApi()` hook which injects the JWT Bearer token automatically
- Admin routes protected by `ownerAuth` middleware — every non-login owner endpoint verifies JWT + email match
