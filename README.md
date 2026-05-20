# FOURI.IN — AI-Powered Mock Test Platform

An AI-driven education platform where students upload question papers, AI analyzes them, generates mock tests automatically, and provides detailed performance analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript |
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
│   │   │   └── (test)/          # Test attempt interface
│   │   ├── components/
│   │   │   ├── ui/              # Button, Input, Card
│   │   │   ├── test/            # QuestionCard, QuestionPalette, Timer
│   │   │   └── results/         # ScoreCard, AnswerReview, ExplanationPanel
│   │   ├── contexts/            # AuthContext
│   │   ├── hooks/               # useAuth, useTestTimer, useAutoSave
│   │   └── lib/                 # firebase, api, utils, validations
│   ├── .env.example
│   └── package.json
│
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/              # Environment config
│   │   ├── middleware/          # Auth, Admin, Rate Limiter
│   │   ├── routes/             # auth, upload, analyze, tests, attempts, results
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

### Phase 8 — Admin Dashboard ✅
- Backend admin routes with `authenticate` + `requireAdmin` middleware
- `GET /api/admin/stats` — total users, uploads, tests, attempts
- `GET /api/admin/users` — list all users with upload/attempt counts
- `PATCH /api/admin/users/:id/role` — toggle USER/ADMIN + Firebase custom claims
- `GET /api/admin/uploads` — all uploads with user + test info
- `GET /api/admin/tests` — all mock tests with creator + attempt counts
- `GET /api/admin/analytics` — 30-day signups/uploads/attempts + AI call stats
- Dark-themed admin layout with sidebar navigation
- Admin dashboard: stats cards overview
- Users tab: role badges + promote/demote buttons
- Uploads tab: status icons (processing/analyzing/completed/failed)
- Tests tab: difficulty badges, question/attempt counts
- Analytics tab: 30-day metrics + upload status + difficulty distribution

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
**Current Phase:** All 12 phases complete
**Last Updated:** 2026-05-20

### Completed: 12/12 phases
- Phase 1: Foundation
- Phase 2: Authentication System
- Phase 3: File Upload System
- Phase 4: OCR Text Extraction
- Phase 5: AI Question Analyzer
- Phase 6: Test Interface
- Phase 7: Result Analytics
- Phase 8: Admin Dashboard
- Phase 9: Search & Discovery
- Phase 10: SEO & Adsense
- Phase 11: Performance & Security
- Phase 12: Deployment

### Project Complete 🎉

All 12 phases are complete. See below for the full project snapshot.

---

## Project Snapshot

**Last Updated:** 2026-05-20
**Overall Progress:** ~100% complete (12/12 phases done)

- Phase 1: Foundation (Next.js + Express + Prisma + PostgreSQL schema)
- Phase 2: Authentication (Firebase login/register/forgot-password, Google OAuth, JWT verification)
- Phase 3: File Upload (drag-and-drop, Cloudinary, progress bar, file validation, PDF raw upload fix)
- Phase 4: OCR (Google Vision text extraction, retry logic, text cleaning — verified working end-to-end)
- Phase 5: AI Analyzer (OpenAI GPT-4o-mini, question parsing, MCQ generation)
- Phase 6: Test Interface (fullscreen exam, question nav, timer, auto-save, keyboard shortcuts)
- Phase 7: Result Analytics (score cards, answer review, accuracy metrics)
- Phase 8: Admin Dashboard (user management, role control, analytics overview)
- Phase 9: Search & Discovery (full-text search, filters, trending tests)
- Phase 10: SEO & Adsense (landing pages, sitemap, structured data, ad slots, metadata)
- Phase 11: Performance & Security (rate limiting, input validation, security headers, code splitting)
- Phase 12: Deployment (GitHub Actions CI/CD, Docker, Railway, Vercel, Sentry, deployment guide)

### What Is Working Now
- User registration/login with email/password and Google OAuth
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
- Homepage redesigned with professional educational background image (Unsplash), dark gradient overlays, white-on-dark hero text, glass-morphism stats
- cursor-pointer on all buttons (shared Button component + raw \<button\> elements)
- Question options normalized (string, object, or array) in QuestionCard + backend routes
- Responsive design across all pages (mobile/tablet/desktop)
- Dark mode removed (light-only) from globals.css to avoid style conflicts
- Subjective questions supported with dedicated `<textarea>` (resizable, internal state, blur-saved)
- Delete mock tests via trash icon with confirmation modal and loading state
- Dashboard header redesigned — clean alignment, rounded touch targets, Sign Out label on desktop, truncated email
- `DELETE /api/tests/:id` backend endpoint with ownership verification and cascade delete

### What Is Not Finished
- Google AdSense real integration (needs publisher ID in `AdSlot.tsx`)
- Google Search Console site verification (replace `your-google-site-verification` in `layout.tsx`)
- Production deployment (Vercel + Railway)
- Sentry DSN (error tracking) — not yet configured

### Next Steps
- Run `npx prisma db push` if schema changes
- Deploy backend to Railway, frontend to Vercel
- Configure GitHub secrets for CI/CD

### Local Development

```bash
# Terminal 1 — Backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend
npm run dev
```

Visit **http://localhost:3000** to use the app. Login/register, upload a paper, and generate mock tests.

### Important Files

| File | Purpose |
|------|---------|
| `frontend/src/app/layout.tsx` | Root layout with metadata, JSON-LD, fonts |
| `frontend/src/app/page.tsx` | Homepage — redesigned with educational background image, hero, features, exam cards |
| `frontend/src/app/(test)/test/[id]/attempt/page.tsx` | Core test-taking interface |
| `frontend/src/components/FileUpload.tsx` | Drag-and-drop upload with progress |
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
| `backend/prisma/schema.prisma` | Full database schema (10 models) |
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

### Notes
- Firebase Admin SDK needs `FIREBASE_PRIVATE_KEY` and `FIREBASE_CLIENT_EMAIL` in backend `.env`
- Google Vision OCR is configured and verified working — needs Cloud Vision API enabled + billing on GCP project
- OpenAI/OpenRouter needs `OPENAI_API_KEY` in backend `.env`
- Cloudinary PDF uploads use `resource_type: "raw"` for public access (images use `"auto"`)
- Prisma `Upload.userId` and `TestAttempt.userId` reference `User.firebaseUid` (not `User.id`)
- Google AdSense needs real publisher ID in `AdSlot.tsx` (`data-ad-client`)
- Database needs PostgreSQL running with `DATABASE_URL` configured
- Run `npx prisma db push` to sync schema before first use
