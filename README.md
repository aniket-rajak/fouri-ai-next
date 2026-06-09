# FOURI.IN — AI-Powered Mock Test Platform

An AI-driven education platform where students upload question papers, AI analyzes them, generates mock tests automatically, and provides detailed performance analytics.

**Production URL:** https://www.fouri.in  
**Last Updated:** 2026-06-08 (Phase 46 — AI Quiz Generation ✅)

---

## Quick Snapshot

| Dimension | Status |
|-----------|--------|
| Frontend | Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, Framer Motion, TanStack Query, Three.js, GSAP |
| Backend | Node.js, Express, TypeScript, JWT, Helmet, express-rate-limit, Zod |
| Database | PostgreSQL (Neon via Prisma ORM) — 17 models, pooled, indexed |
| Auth | Firebase Authentication (Google + Email/Password) + Firebase Admin SDK |
| AI | Groq (free, Llama 3.1 8B / Llama 3.3 70B, 6000 TPM) — migrated from OpenRouter, Tesseract.js OCR |
| AI Email Gen | GPT-4o-mini — generates branded, responsive HTML emails with CTA buttons (**Planned:** Groq) |
| Storage | Telegram Bot API (channels as file backend) |
| Email (SMTP) | Brevo HTTP API (free 300 emails/day, HTTPS) — replaces Hostinger SMTP (blocked on Render free tier) |
| Email Templates | DB-backed templates with branding images, per-user variable personalization |
| Media Library | File proxy with DB-based MIME resolution, paginated, TanStack Query caching |
| Deployment | Vercel (FE) / Render (BE) / Neon (DB) |
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
│   │   │   ├── landing/         # Navbar, Hero (LightPillar + CardSwap), HowItWorks (GlassSurface),
│   │   │   │                   # FeaturesSection, StudentBenefits, AIDashboardShowcase, AboutSection,
│   │   │   │                   # Testimonials, FreeAccess, FinalCTA, FAQSection, Footer
│   │   │   ├── dashboard/       # GreetingSection, QuickActions, ActiveUploadCard
│   │   │   ├── credits/         # CreditWarningBanner, CreditUsageCard, AnalysisModeSelector,
│   │   │   │                   # InsufficientCreditsModal
│   │   │   ├── ui/              # Button, Input, Card, MultiSelect, CardSwap, GlassSurface
│   │   │   ├── test/            # QuestionCard, QuestionPalette, Timer
│   │   │   ├── results/         # ScoreCard, AnswerReview, ExplanationPanel
│   │   │   ├── ads/             # AdCard (student dashboard ad display)
│   │   │   └── blog/            # BlogImage component with CSP-safe blob URL loading
│   │   ├── contexts/            # AuthContext, OwnerAuthContext
│   │   ├── hooks/               # useAuth, useTestTimer, useAutoSave
│   │   └── lib/                 # firebase, api, utils, validations, owner-auth, getFileUrl
│   ├── public/assets/images/    # Local landing images + favicon/
│   ├── next.config.ts           # CSP, HSTS, caching, image config
│   └── package.json
│
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/env.ts        # Centralized env config (all vars)
│   │   ├── middleware/          # auth, adminAuth, ownerAuth, rateLimiter, validate (Zod)
│   │   ├── routes/              # auth, upload, analyze, tests, attempts, results,
│   │   │                       # search, admin, owner, ads, contact,
│   │   │                       # email (broadcast + templates), files (proxy),
│   │   │                       # media (library)
│   │   ├── services/            # firebaseAdmin, telegramStorage, ocr, openai,
│   │   │                       # email (SMTP broadcast + branding), sentry
│   │   ├── lib/                 # prisma (pooled), evaluationQueue (serialized AI),
│   │   │                       # emailVariables (resolve per-user vars), resolveFileUrl
│   │   └── config/env.ts        # Centralized env config (all vars)
│   ├── prisma/schema.prisma     # 17 models: User, Upload, MockTest, Question,
│   │                           # TestAttempt, Answer, Explanation, SuspiciousActivity,
│   │                           # AnalyticsEvent, Ad, ContactMessage,
│   │                           # MediaFile, EmailTemplate, EmailCampaign
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
| **Upload** | userId, filename, telegramFileId, status, failureReason | Uploaded question papers (Telegram storage) |
| **MockTest** | title, subject, duration, totalQuestions, status | Generated test |
| **Question** | mockTestId, questionText, options[], correctAnswer, type (MCQ/SUBJECTIVE) | Test questions |
| **TestAttempt** | userId, mockTestId, score, accuracy, status, remainingTime, currentQuestionIndex | User's attempt (paused/resumed) |
| **Answer** | testAttemptId, questionId, selectedOption, isCorrect, isMarkedForReview | Individual answer with review marking |
| **Explanation** | questionId, shortExplanation, detailedExplanation | AI explanations (both subjective and MCQ) |
| **SuspiciousActivity** | attemptId, userId, activityType, metadata | Tab switch / blur logging |
| **AnalyticsEvent** | eventType, userId, metadata | Usage tracking |
| **Ad** | title, description, imageUrl, ctaText, ctaLink, active, clicks, impressions | Owner-created advertisements |
| **ContactMessage** | name, email, subject, message | Contact form submissions |
| **MediaFile** | originalName, mimeType, fileSize, fileId, category, cdnUrl | Uploaded images (Telegram storage) |
| **EmailTemplate** | name, subject, body, logoUrl, headerImage, footerLogo, copyright | Branded email templates |
| **EmailCampaign** | subject, body, recipientType, recipientCount, status, deliveredCount, failedCount | Broadcast history |

### Indexes
- `Upload.createdAt` — for upload listing/sorting
- `Upload.status` — for status-based filtering and bulk operations
- `MockTest.status`, `MockTest.createdAt` — for published test queries
- `TestAttempt.startedAt` — for attempt timeline queries
- `TestAttempt.userId`, `TestAttempt.status` — for user attempt filtering
- `MediaFile.category`, `MediaFile.createdAt` — for media library listing/filtering

---

## API Endpoints

### Public (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
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
| PUT | `/api/attempts/:id/save` | Save answers + markedIds during test |
| POST | `/api/attempts/:id/submit` | Submit completed test (accepts `timeTaken` + `markedIds`, subjective scoring with semantic matching, background AI explanation for marked MCQs) |
| POST | `/api/attempts/:id/re-evaluate` | Re-evaluate subjective answers for existing attempts |
| POST | `/api/attempts/:id/suspicious-activity` | Log tab switch / blur events |
| GET | `/api/attempts/:id` | Get attempt with answers |
| GET | `/api/search` | Full-text search across all published tests |
| GET | `/api/search/trending` | Top 10 tests by attempt count |
| GET | `/api/results` | List own results |
| GET | `/api/results/:id` | Get detailed result |
| POST | `/api/quiz/estimate` | Estimate AI quiz credit cost (rate-limited) |
| POST | `/api/quiz/generate` | Generate AI quiz with 3 retries + 70B fallback (60s timeout) |

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
| GET | `/api/ads` | List all ads (admin view) |
| POST | `/api/ads` | Create ad |
| PUT | `/api/ads/:id` | Update ad |
| DELETE | `/api/ads/:id` | Delete ad |
| GET | `/api/owner/email/templates` | List email templates (URLs sanitized server-side) |
| POST | `/api/owner/email/templates` | Create email template |
| GET | `/api/owner/email/templates/:id` | Get single template |
| PUT | `/api/owner/email/templates/:id` | Update template |
| DELETE | `/api/owner/email/templates/:id` | Delete template |
| POST | `/api/owner/email/templates/:id/duplicate` | Duplicate template |
| POST | `/api/owner/email/upload-image` | Upload branding image (multer) |
| POST | `/api/owner/email/generate-ai` | AI generate email subject + body |
| POST | `/api/owner/email/send` | Send broadcast (resolves {{vars}} per user) |
| POST | `/api/owner/email/preview` | Preview rendered email for a user |
| GET | `/api/owner/email/history` | Campaign history |
| DELETE | `/api/owner/email/history/:id` | Delete campaign |
| GET | `/api/owner/media` | List media files (paginated, filterable) |
| POST | `/api/owner/media/upload` | Upload image (multer) |
| DELETE | `/api/owner/media/:id` | Delete media file |
| GET | `/api/files/:fileId` | File proxy — fetches from Telegram CDN, serves with correct MIME type |

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

The dev scripts auto-kill stale processes on ports 3000/4000 before starting via `predev` (`npx kill-port`).

```bash
# Terminal 1 — Backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend
npm run dev
```

If you still get port-in-use errors, manually kill with:
```bash
# Windows
taskkill /F /PID <PID>
# Or find the PID:
netstat -ano | findstr :3000
netstat -ano | findstr :4000
```

### Environment Variables

Both repos require a `.env` file. See `.env.example` for full reference.

**Backend critical vars:**
- `DATABASE_URL` — Neon PostgreSQL pooled connection string
- `FIREBASE_PROJECT_ID` / `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL`
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHANNEL_ID` — Telegram Bot API for file storage
- `GROQ_API_KEY` — Groq API key (replaces OpenRouter, **pending migration**)
- `GROQ_API_KEY` — Groq API key (free, replaces OpenRouter `OPENAI_API_KEY`)
- `BREVO_API_KEY` — Brevo transactional email API key (free, 300 emails/day)
- `JWT_SECRET` — Owner JWT signing secret
- `OWNER_EMAIL` / `OWNER_PASSWORD` — Owner console credentials

---

## Project Snapshot (Maintained)

### Phase 1–12: Core Platform (Completed)
All 12 original phases complete — Foundation, Auth, Upload, OCR, AI Analyzer, Test Interface, Results, Owner Console, Search & Discovery, SEO & AdSense, Performance & Security, Deployment.

### Phase 13: Dark Theme & Hero Redesign ✅
Premium black theme (`#08080f`), electric blue accents, glassmorphism, 6-slide animated hero carousel with Framer Motion.

### Phase 14: Owner Console & Ad System ✅
Hidden `/fouri-root-console` admin panel, JWT owner auth, user CSV export, upload intelligence, Recharts analytics, ad CRUD manager, impression/click tracking.

### Phase 16: Contact, Legal Pages & SMTP ✅
- `frontend/src/app/contact/page.tsx` — Contact form with Google Map embed
- `frontend/src/app/about/page.tsx` — About Us page
- `frontend/src/app/privacy/page.tsx` — Privacy Policy page
- `frontend/src/app/terms/page.tsx` — Terms of Service page
- `backend/src/routes/contact.ts` — POST endpoint with rate limiter (5/hr)
- `backend/src/services/email.ts` — SMTP email service via Hostinger (nodemailer, SSL/TLS 465)
- Footer links: About, Privacy, Terms, Contact

### Phase 17: Security Hardening ✅
| Fix | Detail |
|-----|--------|
| No hardcoded secrets | Owner credentials moved to `OWNER_EMAIL`/`OWNER_PASSWORD` env vars |
| JWT no fallback | `ownerAuth.ts` fails if `JWT_SECRET` missing (no weak default) |
| CORS whitelist | Rejects non-whitelisted origins with 403, allows localhost in dev |
| CSP headers | Frontend (next.config.ts) + Backend (helmet) — `unsafe-eval` in dev only |
| Rate limiting | All route groups: global (200/15min), auth (20/15min), upload (30/hr), analyze POST (15/hr), analyze GET status (100/15min), owner (50/15min), contact (5/hr) |
| Body limit | Reduced from 50MB to 10MB |
| Zod validation | Contact, ads, owner login — all validated server-side |
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
- Sitemap expanded — added `/about`, `/privacy`, `/terms`, `/contact`
- `Organization` JSON-LD schema added to Contact page
- Contact page — metadata export added
- Discover page — metadata export added
- Firebase Analytics activated — `measurementId` added to Firebase config, `<Analytics />` component logs `page_view` events client-side
- Sentry error tracking — code in place, ready for `SENTRY_DSN` in production env vars
- `frontend/src/app/contact/contact-form.tsx` — client component for contact form UI
- `frontend/src/app/(dashboard)/discover/discover-client.tsx` — client component for discover UI
- `frontend/src/components/Analytics.tsx` — Firebase Analytics initialization component

### Phase 22: AI Analysis Error Handling & User-Friendly Messages ✅
- **Root cause:** AI returned `type`/`difficulty` with inconsistent casing (e.g., `"mcq"`, `"Multiple Choice"`, `"easy"`, `"Hard"`) which failed Prisma enum validation (`MCQ`/`SUBJECTIVE`, `EASY`/`MEDIUM`/`HARD`), crashing the entire analysis pipeline
- **Fix:** Added `normalizeType()` and `normalizeDifficulty()` functions in `openai.ts` — map any AI output variant (lowercase, alternate names like "Objective", "Descriptive", "Advanced") to the exact Prisma enum values
- **Error visibility:** Added `failureReason String?` field to `Upload` model — stores meaningful error context when analysis fails, surfaced via the status endpoint
- **Better error messages:** Backend categorizes errors (OCR billing, AI unavailable, malformed response, network issues, database errors) into human-readable `failureReason` text instead of a generic failure
- **Frontend:** `ProcessingStatus.tsx` now displays the `failureReason` in a styled two-line layout with the specific error detail instead of the old generic "Analysis failed. Please try uploading again."
- **Improved logging:** Structured `[Analyze]` prefix logs with error message, HTTP status code, and stack trace — special handling for `SyntaxError` (malformed AI JSON)
- `backend/src/services/openai.ts` — added `normalizeType()`, `normalizeDifficulty()`
- `backend/src/routes/analyze.ts` — stores `failureReason` on failure, improved error categorization and logging, empty OCR text detection
- `backend/prisma/schema.prisma` — added `failureReason String?` on Upload model
- `backend/prisma/migrations/` — migration `add_failure_reason` added
- `frontend/src/components/ProcessingStatus.tsx` — displays `failureReason` with clear two-line error layout

### Phase 23: Telegram Storage, AI Extraction Improvements & Tab Switch Detection ✅
| Feature | Detail |
|---------|--------|
| Telegram file storage | Replaced Cloudinary with Telegram Bot API — uploads stored in Telegram channel (`TELEGRAM_CHANNEL_ID`) |
| Tesseract.js OCR | Free, no billing required — supports eng/hin/ben |
| AI extraction max_tokens | Increased from 4096 → 16384 → 65536 to extract ALL questions from large papers |
| JSON parse fallback | Regex-based recovery for truncated AI responses (chunked JSON extraction) |
| Custom test duration | **Start Test** (30min default) + **Edit Time** button → custom input → starts immediately |
| 7-day login persistence | `browserLocalPersistence` + localStorage timestamp check auto-logs out after 7 days |
| Subjective answer evaluation | Semantic matching (normalized text, punctuation stripping, word overlap ≥60%, contains check) |
| Subjective results display | Shows "Your answer" + evaluation result (✓ Correct / ✗ Correct answer / Pending review) |
| Re-evaluate endpoint | `POST /attempts/:id/re-evaluate` — recalculates subjective scores for incorrectly scored attempts |
| SuspiciousActivity model | Logs `TAB_SWITCH`, `WINDOW_BLUR` events with metadata to database |
| Tab switch + blur detection | `visibilitychange` + `window.blur` listeners; auto-submits after 2 switches |
| Suspicious activity logging | `POST /attempts/:id/suspicious-activity` endpoint with 2s throttle |
| Admin file download | Download button for every upload (removed `cloudinaryUrl` gating) |
| QuestionCard formatting | Wrapped text, items-start alignment, better option spacing |
| Port conflict fix | Added `predev` script (`npx kill-port`) to auto-kill stale processes before `npm run dev` |

### Phase 24: Upload 500 Fix & Edit Time Enhancement ✅
| Fix | Detail |
|-----|--------|
| Upload 500 error | Removed default `Content-Type: application/json` from Axios instance (`api.ts`) to prevent multipart boundary stripping |
| Upload 500 error | Removed explicit `Content-Type: multipart/form-data` header from `FileUpload.tsx` — let Axios auto-detect FormData with proper boundary |
| Telegram middleware | Added early validation in `telegramStorage.ts` — throws clear error if `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHANNEL_ID` is empty when `uploadToTelegram()` is called |
| Edit Time UI rewrite | Replaced raw `<button>` with `Button` component for consistent styling |
| Edit Time enhancement | Shows duration on default button: **"Start Test (30 minutes)"** |
| Edit Time enhancement | Added **Cancel** button and Escape key support in edit mode |
| Edit Time robustness | Added `parseMinutes()` with safe `parseInt` + NaN guard — falls back to 30 minutes on invalid input |

### Phase 25: Per-Question Subjective AI Evaluation ✅
| Feature | Detail |
|---------|--------|
| Per-question AI evaluation | `evaluateSubjectiveWithAI()` prompts GPT-4o-mini per question — generates model answer, evaluates correctness (true/false/null), returns feedback |
| Evaluation endpoint | `POST /attempts/:id/evaluate-subjective-ai` accepts `{ questionId }`, updates `Answer.isCorrect`, creates/upserts `Explanation` with AI feedback |
| Results page UI | Per-question auto-evaluation queue with loading spinner, assessment badge, AI model answer, AI feedback, error state with retry |
| 429 retry + backoff | `callWithRetry()` in `openai.ts` — 3× with 2s/4s/8s backoff on rate-limit errors |
| Global evaluation queue | `evaluationQueue.ts` — in-memory FIFO queue serializing all AI evaluations globally to prevent OpenAI rate limit bursts |
| Auto-save refactor | `useAutoSave.ts` — answers/markedIds moved to refs, debounced save (3s after last change), no request bursts on rapid changes |
| Rapid-answer detection | Warning banner when >10 answer changes in 10s window |
| Submit 429 protection | Concurrent-submission lock (`submittingAttempts` Set), `withRetry` on DB ops, background AI evaluation fire-and-forget, 5s cooldown |

### Phase 26: Email Broadcast & Templates ✅
| Feature | Detail |
|---------|--------|
| EmailTemplate model | name, subject, body, logoUrl, headerImage, footerLogo, copyright — stored in PostgreSQL |
| EmailCampaign model | subject, body, recipientType, recipientCount, status, delivered/failed counts, sentAt |
| Broadcast endpoint | `POST /owner/email/send` — sends to ALL/FREE/PREMIUM/ACTIVE/INACTIVE/SELECTED/CUSTOM recipients |
| Template CRUD | 7 endpoints: list, get, create, update, delete, duplicate + upload branding image |
| AI email generator | `generateEmailContent()` — prompts GPT-4o-mini with tone selection, returns HTML subject + body + CTA text |
| File proxy | `GET /api/files/:fileId` — fetches from Telegram CDN, serves with real Content-Type (no redirect) |
| MediaFile model | Stores uploaded images with mimeType, fileId, category — used by both email templates and media library |
| Dynamic image URLs | All upload endpoints return `{ url: "/api/files/<fileId>" }` — constructed with `req.protocol://req.get("host")` |
| SMTP startup check | `verifySmtpConnection()` called on backend startup — logs success/failure |
| Trust proxy | `app.set("trust proxy", 1)` — ensures Render reverse-proxy headers are trusted for URL generation |

### Phase 27: Email Personalization ✅
| Feature | Detail |
|---------|--------|
| Variable system | `resolveVariables()`, `userToVariableData()`, `AVAILABLE_VARIABLES` — 8 user fields |
| Per-user resolution | `/send` endpoint loads user by email, resolves {{vars}} per recipient before sending |
| Preview endpoint | `POST /owner/email/preview` — renders subject + body with specified user's variables |
| Variable picker UI | Dropdown in email-templates and email-broadcast pages — inserts `{{variable}}` at cursor position |
| Preview As User | User search dropdown + "Render Preview" button in broadcast page |
| `{{appUrl}}` variable | Auto-resolved — `https://fouri.in` (prod) or `http://localhost:3000` (dev) |
| `{{name}}` alias | `name` → `fullName` resolver — supports `{{name}}` and `{{fullName}}` interchangeably |
| CTA button fix | AI prompt generates `href="{{appUrl}}"` instead of hardcoded `#` |
| Per-user array send | `sendBroadcastEmail()` accepts `{ emails: Array<{ to, subject, html }> }` for personalized content |
| Debug logging | Each send logs recipient resolution count, found users, per-recipient outcome, error messages |

### Phase 28: Media Library Overhaul ✅
| Feature | Detail |
|---------|--------|
| MIME type fix | File proxy queries `MediaFile` table for stored `mimeType` — overrides Telegram CDN's `application/octet-stream` |
| MIME priority | DB record → Telegram CDN headers → URL extension inference → fallback `image/png` |
| Pagination | `GET /owner/media?page=1&limit=26` — server-side skip/take, returns total/page/totalPages |
| TanStack Query | `useQuery` caching with 5min staleTime, 30min gcTime — `useMutation` auto-invalidates on upload/delete |
| Loading skeletons | 10 pulsing skeleton cards matching grid dimensions during isLoading |
| Image fallback | `onError` hides broken `<img>` and injects SVG placeholder via DOM with `data-fallback` guard |
| Click-to-preview | Full-screen overlay with image at natural size, close on Escape/backdrop click |
| Search by filename | Client-side `originalName.includes(query)` filter |
| Category filter | Backend `?category=` filter + frontend dropdown |
| Image count | Shows "N images" — updates with search results |

### Phase 29: AI Email Formatting & UX ✅
| Feature | Detail |
|---------|--------|
| Professional HTML prompt | `generateEmailContent` prompt rewritten — exact inline CSS for h1 (24px bold), h2 (18px), p (16px/1.6), lists, buttons |
| Table-based CTA button | `<table role="presentation">` layout for email-client-safe buttons with background-color, border-radius, padding |
| Email document wrapper | `wrapWithBranding()` outputs full `<!DOCTYPE html>` + `<html>` + `<head>` + `<body>` with tables layout |
| Email client compatibility | Explicit `color`, `margin`, `padding` on every element — works in Gmail, Outlook, Yahoo, Apple Mail, mobile |
| Responsive centering | `max-width: 560px` + `margin: 0 auto` + `<!--[if mso]>` conditional for Outlook |
| Image URL rewriting | Branding image URLs rewritten to current server's base URL at send time (fixes localhost links in production) |
| max_tokens increase | 2000 → 4000 for verbose formatted HTML output |
| Viewport meta | `<meta name="viewport" content="width=device-width">` for mobile email rendering |

### What Is Working Now
- User registration/login email/password + Google OAuth
- Drag-and-drop file upload to Telegram Bot API (channels as storage backend)
- Tesseract.js OCR — image and PDF text extraction (eng/hin/ben, no billing required)
- AI analysis via OpenRouter (GPT-4o-mini, 65K tokens) — question parsing, MCQ + subjective generation
- Full-screen mock test with customizable countdown timer, auto-submit, tab-switch detection + logging
- Custom test duration — **Start Test (30 minutes)** default + **Edit Time** button opens input with Cancel/Start, starts immediately
- Auto-save (localStorage + server every 30s), keyboard navigation
- Score calculation with semantic subjective answer evaluation (word overlap, contains check)
- Subjective answer review: shows "Your answer" + "Correct answer" + evaluation result per question
- Re-evaluate endpoint (`POST /attempts/:id/re-evaluate`) to fix incorrectly scored attempts
- Suspicious activity tracking: tab switches and window blur events logged to DB
- Student dashboard, discover/search with filters
- Owner console: 8 stat cards, user manager with CSV export, upload intelligence, Recharts analytics (5 charts, daily/weekly/monthly toggles), ad manager (CRUD, CTR, impression/click), bulk delete uploads, file download
- Contact form: SMTP email delivery via Hostinger
- Legal pages: About, Privacy, Terms
- SEO: dynamic robots.txt, canonical URLs, sitemap, JSON-LD (WebApplication, Course, Organization), OpenGraph, exam landing pages
- Firebase Analytics: page_view event tracking via Firebase Analytics SDK
- Google Search Console: env-var based verification code
- Sentry error tracking: configured with env var DSN (backend)
- Security: CSP, HSTS, CORS whitelist, rate limiting, Zod validation, env-based secrets
- Responsive design (mobile/tablet/desktop)
- Subjective questions with `<textarea>` support
- Delete mock tests (cascade)
- Landing page: 13 dark-themed components, Three.js LightPillar shader background, CardSwap animated cards, GlassSurface chromatic glass cards, premium AI-first redesign
- Local landing images (no external deps)
- Ad system: impression deduplication per session
- Footer: links to About, Privacy, Terms, Contact
- Any student can attempt any published test from any creator
- AI analysis error handling: enum normalization + `failureReason` tracking
- Auto-kill stale ports via `predev` script before `npm run dev`
- Upload fix — removed default `Content-Type: application/json` from Axios instance preventing multipart boundary stripping
- Upload fix — Telegram env var validation in `telegramStorage.ts` for clear error on missing config
- Enhanced Edit Time UI — uses `Button` component, shows duration on default button, Cancel + Escape support, safe NaN-guarded parsing
- AdSense integration — ad script in `<head>`, `AdSlot` component with CLS prevention, dashboard ads, in-content ads on tests/results/discover pages
- Resume Tests page — dedicated `/resume-tests` route with search, sort, pagination, progress bars, delete
- Telegram CDN URL caching — `uploadToTelegram()` returns `cdnUrl` stored in DB; file proxy uses cached URL (no `getFile` API call per request)
- Blog multi-category support — admin posts can be tagged with multiple categories via searchable MultiSelect; public listing shows all category badges per card
- Custom scheduled date-time picker — 12-hour AM/PM selector with 5-minute step intervals replacing native datetime-local
- Hero section card images — landscape hero images with stacked card layout (image banner + content below), 420×400 card height
- Dropdown arrow styling — all native `<select>` elements across the app use custom `ChevronDown` icon with `appearance-none` for consistent cross-browser alignment
- Mobile responsive admin pages — Uploads and Blog admin pages use stacked `flex-col` on mobile; Tests page cards stack vertically on small screens
- Image URL sanitization — `getFileUrl()` helper replaces hardcoded localhost URLs with production base on all stored image references
- Backend URL rewriting — `resolveFileUrl()` sanitizes stored template branding URLs (logoUrl, headerImage, footerLogo) on all CRUD responses
- SMTP error propagation — `sendBroadcastEmail()` returns detailed error messages with connection timeouts (10s connect, 10s greeting, 15s socket)
- AI analysis migrated from OpenRouter (paid) to Groq (free) — `llama3-70b-8192` for analysis/email/blog/ad generation, `llama3-8b-8192` for subjective evaluation and MCQ explanations
- Daily AI credit system — 100 free credits/day, auto-reset every 24h, credit estimation before upload, credit deduction before analysis, full/standard/basic mode tiers, credit refund on failure
- Groq rate-limit handling — `CHUNK_DELAY_MS: 20s` between chunks, per-chunk 3min AbortController, per-API-step timeouts (OCR 5min, Telegram download 2min), global 30min pipeline timeout
- Dashboard light theme — white cards, zinc borders/text, gradient greeting hero with count-up stat counters, 2×2 quick action grid with hover effects
- Upload persistence — resume-on-mount checks for PROCESSING/ANALYZING uploads and shows ProcessingStatus; ActiveUploadCard on dashboard polls every 10s for active uploads
- Submit rate-limit resilience — `standardLimiter` bumped 100→300 req/15min, frontend retries 2→3 with 1s-2s-4s exponential backoff
- Questions with no options automatically treated as subjective — textarea shown instead of "No options available" placeholder; `isSubjectiveQuestion()` helper handles scoring + AI evaluation in backend
- Marked-for-review persistence — `isMarkedForReview` on Answer model; markedIds saved via auto-save to server, persisted through submit; results page has "All"/"Marked" filter toggle; background AI generates explanations for marked MCQs via `generateExplanationForMCQ()`
- Upload error handling — meaningful server error messages shown instead of generic "Upload failed"; 20MB file size limit returns clear "File too large" error; 120s Telegram upload timeout; 5min axios timeout prevents indefinite hanging
- Analysis task dismiss — ✕ button on Dashboard ActiveUploadCard and Upload page ProcessingStatus to cancel stuck/invalid analysis tasks; optimistically clears state and deletes backend record
- Independently scrollable question area — test attempt page question section scrolls independently (timer bar + sidebar remain fixed)
- Independently scrollable question palette — `max-h-[60vh]` grid with overflow-y-auto keeps legend always visible
- Dynamic image URL rewriting — all stored file URLs (blog thumbs, ad images, avatars) rewritten to current server's host at response time via `resolveFileUrl()`

### What Is Not Finished
- Google Maps API key — embedded map uses placeholder key, needs real key for production
- Re-running AI analysis on existing tests to populate `correctAnswer` for subjective questions
- AI-powered on-demand explanation retry for MCQ questions on the results page

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
| CSP Headers | ✅ | `script-src` with unsafe-inline, `connect-src` restricted, `unsafe-eval` only in dev; includes AdSense domains (ep2.adtrafficquality.google, adservice.google.com) |
| Google Sign-In CSP | ✅ | `apis.google.com`, `accounts.google.com`, `firebaseapp.com` in script/connect/frame-src |
| AdSense CSP | ✅ | AdSense measurement domains (ep2.adtrafficquality.google, adservice.google.com) in script-src, connect-src, frame-src; AdSense ad-serving domains in img-src |
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
| JSON-LD | ✅ | Structured data on landing pages |
| Meta Tags | ✅ | title, description per route |
| Alt Text | ✅ | All `next/image` components have alt props |

### Infrastructure
| Component | Spec | Capacity |
|-----------|------|----------|
| Frontend (Vercel) | Auto-scaling, global CDN (100+ PoPs) | Handles spikes via edge caching |
| Backend (Render) | 0.5 vCPU, 512MB RAM, single instance | ~25-50 concurrent users |
| Database (Neon Free) | 0.25 vCPU, 512MB RAM, 10GB storage, ~9-17 pooled connections | ~50-100 concurrent queries |
| SMTP (Hostinger) | 500 emails/day | Sufficient for contact form |

---

## Traffic Estimate

### Current Infrastructure Limits

| Layer | Max Concurrent Users | Notes |
|-------|---------------------|-------|
| **Frontend** (Vercel) | 500+ | Static pages cached at edge; dynamic pages hit backend |
| **Backend** (Render free) | **25-50** | 0.5 vCPU, 512MB RAM — primary bottleneck |
| **Database** (Neon free) | **50-100 concurrent queries** | Pooled connections shared across requests |
| **OCR** (Tesseract.js) | Unlimited | Completely free, no API costs |
| **AI** (OpenRouter) | ~$1-5/month | Pay-per-token; ~1,000 analyses/month at current rates |

### Estimated Monthly Traffic

| Scenario | Monthly Users | Daily Active Users | Concurrent Peak | Feasible? |
|----------|--------------|-------------------|-----------------|-----------|
| **Light** | 500 | 50 | 5-10 | ✅ Comfortable |
| **Moderate** | 2,000 | 200 | 20-30 | ✅ With rate limiting |
| **Heavy** | 10,000 | 1,000 | 50-100 | ❌ Need Render + Neon upgrade |
| **Peak** | 50,000+ | 5,000 | 250+ | ❌ Need dedicated servers |

### Bottlenecks & Scaling Recommendations

| Bottleneck | Impact | Fix |
|------------|--------|-----|
| Render 0.5 vCPU | 25-50 concurrent users → latency spikes | Upgrade to $7/month plan (1 vCPU) |
| Neon free pool | Connection exhaustion under load | Upgrade to Scale plan ($19/mo, 100+ connections) |
| Tesseract.js | No external API needed | Runs locally, no costs, no rate limits |
| OpenRouter rate limits | Queue delays under concurrent AI calls | Add request queue or batch processing |
| No Redis caching | Repeated DB queries for same data | Add Upstash Redis (Vercel integration, free 10MB) |
| Firebase Auth IP rate limits | ~100 signups/hr/IP | Upgrade to GCIP (Identity Platform) for project-level quota |
| Single-region backend | Higher latency for non-India users | Render multi-region or add CDN for static API responses |

### Recommended Upgrade Path

1. **0–1,000 users** (free tier) — Current setup sufficient ✅
2. **1,000–5,000 users** — Render $7/mo (1 vCPU) + Neon $19/mo (Scale) + Redis free tier
3. **5,000–20,000 users** — Render $15/mo (2 vCPU) + Neon $39/mo + Redis $20/mo + GCIP
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
| Port in use (EADDRINUSE) | Previous `npm run dev` left stale process on port | Added `predev` script with `npx kill-port` — auto-clears ports before `npm run dev` |
| Subjective answers all marked incorrect | Old scoring used strict `===` comparison with empty `correctAnswer` | New `evaluateSubjective()` normalizes text, strips punctuation, checks word overlap; re-evaluate existing attempts via `POST /attempts/:id/re-evaluate` |
| `.next` cache corruption | Deleting `.next` while dev server is running leaves stale references | Always stop dev server first via `taskkill` or Ctrl+C, then `rm -rf .next` |
| Email broadcast fails silently | Error caught in broadcast loop but not propagated to frontend | Return real error messages from catch block in `/send` endpoint |
| SELECTED recipients bug | Route queried by `firebaseUid` but frontend sends UUIDs | Changed to `id: { in: userIds }` |
| Blank email body in clients | `wrapWithBranding` didn't output full HTML document | Rewrote to output `<!DOCTYPE html>` with tables layout, explicit colors, `<!--[if mso]>` conditionals |
| Media images not displaying | File proxy sent `Content-Type: application/octet-stream` from Telegram CDN | File proxy now queries `MediaFile` DB record for stored `mimeType` first |
| Image CSP violation in email templates | `img-src` didn't allow blob URLs and backend origin | Pre-fetch via `fetch()` (uses `connect-src`), display as `blob:` URL; CSP updated for localhost:4000 |
| Branding image URLs stale in production | Stored absolute URLs pointed to localhost | Rewrite branding image URLs to current server base URL at send-time |
| AI email HTML too short/plain | 2000 max_tokens insufficient for formatted output | Increased to 4000 tokens; prompt rewritten for structured HTML |
| AdSense CSP sodar2.js blocked | `ep2.adtrafficquality.google` missing from script-src/connect-src | Added AdSense measurement/quality domains to all CSP directives |
| Stored localhost image URLs in production | Old uploads saved URLs with `localhost:4000` during dev | Created `getFileUrl()` frontend helper and `resolveFileUrl()` backend helper to sanitize URLs |
| Email template branding URLs contain localhost | Templates saved during dev stored absolute localhost URLs | Backend `resolveFileUrl()` sanitizes logoUrl/headerImage/footerLogo on all template CRUD responses |
| Blog/ad image URLs contain localhost | Upload endpoints stored `http://localhost:4000/api/files/...` in DB during local dev | `resolveFileUrl()` now rewrites ALL stored file URLs (blog thumbs, ad images, avatars) to current server host at response time |
| Question palette overflows viewport | Grid with 419 questions had no height constraint | Wrapped grid in `max-h-[60vh] overflow-y-auto` — scrollable while legend stays visible |

---

## Development Phases Reference

### Phase 1 — Foundation
Scaffolded Next.js 16 with TypeScript + Tailwind, Express backend with TypeScript, Prisma schema (8 models), shared UI components, Axios API client.

### Phase 2 — Authentication System
Firebase SDK (lazy-loaded, SSR-safe), AuthProvider with onAuthStateChanged, Login/Register/Forgot Password pages, Google OAuth, form validation (react-hook-form + zod), Firebase Admin SDK on backend.

### Phase 3 — File Upload System
Cloudinary upload service (stream-based), multer memory storage, drag-and-drop zone (react-dropzone), file preview with validation, progress bar, multiple file support.

### Phase 4 — OCR Text Extraction
Tesseract.js (image + PDF text detection), 3x retry with exponential backoff, image preprocessing pipeline (sharp), text cleaning.

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
GitHub Actions CI/CD (4 workflows), Docker multi-stage build, Render config with health check, Vercel config, Sentry error tracking, production env files, DEPLOY.md.

### Phase 13 — Dark Theme & Hero Redesign
Premium black theme, glassmorphism, 6-slide animated hero carousel with Framer Motion, dark gradients across all sections.

### Phase 14 — Owner Console & Ad System
Hidden admin panel with JWT auth, user CSV export, upload intelligence, Recharts analytics (5 chart types), ad CRUD with impression/click tracking.

### Phase 16 — Contact, Legal Pages & SMTP
Contact form with Google Map, About/Privacy/Terms pages, SMTP email via Hostinger (nodemailer, SSL/TLS 465).

### Phase 17 — Security Hardening
Env-based secrets, JWT no fallback, CORS strict whitelist, CSP + HSTS headers, rate limiters on all routes, Zod validation, next/image migration, dynamic imports, error/not-found pages, robots.txt, canonical URLs, caching headers, database indexes, Prisma pooling config, CSP for Google Sign-In, COOP fix.

### Phase 18 — Admin Upload Management
Bulk delete by status filter, individual owner delete, file download proxy with Content-Disposition attachment, cascade cleanup, confirmation modal UI, blob download.

### Phase 19 — Cross-Student Test Access
Any authenticated student can view/attempt any published test. Ownership check removed from GET endpoint, kept on DELETE.

### Phase 20 — AI Analysis Error Handling & User-Friendly Messages
AI enum value normalization (type/difficulty), `failureReason` tracking on Upload model, human-readable error messages in frontend, structured server-side logging for debugging analysis failures.

### Phase 21 — Telegram File Storage
Migrated from Cloudinary to Telegram Bot API for file storage (unlimited bandwidth, no API costs), `uploadToTelegram()` / `getTelegramFileUrl()`, all upload endpoints migrated.

### Phase 22 — Subjective Answer Enhancement
New `evaluateSubjective()` with text normalization (lowercase, punctuation stripped), word overlap scoring, per-question re-evaluation endpoint.

### Phase 23 — Deployment & Database Hardening
`withRetry()` wraps all DB calls, handles `E57P01` (Neon pause/resume), Prisma pgbouncer mode + connection limit 3 for pooled Neon connections, 3315 error handling for pool disconnects.

### Phase 24 — Upload 500 Fix & Edit Time Enhancement
Axios multipart boundary fix, Telegram validation, Edit Time button with duration display, Cancel + Escape in edit mode.

### Phase 25 — Per-Question Subjective AI Evaluation
Per-question GPT-4o-mini evaluation with auto queue, 429 retry + backoff, global serialized evaluation queue, auto-save refactored with refs + debounce, rapid-answer detection, submit 429 protection.

### Phase 26 — Email Broadcast & Templates
EmailTemplate/EmailCampaign/MediaFile models, broadcast endpoint, template CRUD, AI email generator, file proxy with correct MIME type, dynamic image URLs, SMTP startup check, trust proxy.

### Phase 27 — Email Personalization
Per-user variable resolution ({{firstName}}, {{name}}, {{email}}, {{appUrl}}), preview endpoint, variable picker UI, CTA button fix, per-user array send with delivery logging.

### Phase 28 — Media Library Overhaul
MIME type fix via DB lookup, server-side pagination, TanStack Query caching, loading skeletons, image fallback on error, click-to-preview modal, search by filename, category filter.

### Phase 29 — AI Email Formatting & UX
Professional HTML email prompt with inline CSS, table-based CTA buttons, full email document wrapper, image URL rewriting at send time, max_tokens 4000, mobile viewport meta.

### Phase 30 — Responsive UI, AdSense & Resume Tests ✅
- **Responsive UI fixes** — email broadcast row wraps on mobile, login eye icon uses `rightIcon` prop, results cards `flex-col sm:flex-row`
- **Test UX improvements** — Tab switch warning "automatically submit", pause/resume restores `markedIds` from localStorage, test duration from DB (no hardcoded 30 min)
- **AdSense integration** — Script in `<head>`, `AdSlot` component with `min-h` CLS prevention, dashboard header/sidebar/footer ads, in-content ads on key pages, `NEXT_PUBLIC_ADSENSE_CLIENT` env var
- **Resume Tests page** — NEW dedicated `/resume-tests` route — search, sort by date, pagination (12/page), responsive card grid, progress bars, delete confirmation, empty state; backend `DELETE /attempts/:id`
- **File proxy rewrite** — `uploadToTelegram()` now returns `{ fileId, cdnUrl }` cached in `MediaFile.cdnUrl` column; proxy reads cached CDN URL + DB mime type; removed transparent pixel fallback (returns `502` on error)

### Phase 31 — Home Page AI-First Redesign ✅
- **Blog Manager removed** — all 30+ blog references deleted from frontend, backend, README
- **6 old landing components deleted** — FeatureBar, WhatFouriDoes, AIAnalysis, StatsSection, CTABanner, MockTestShowcase
- **Unused deps removed** — `@appletosolutions/reactbits` and `gsap` uninstalled (GSAP later reinstated for CardSwap)
- **Three.js LightPillar background** — `LightPillar.tsx` with GLSL shader-based procedural light column, auto-quality tiers (low/medium/high), WebGL context cleanup
- **CardSwap animated cards** — `CardSwap.tsx` from React Bits with GSAP elastic swap animation, 3 glass cards (Questions Extracted, AI Analysis Accuracy, Mock Test Duration) with brand gradient accents
- **GlassSurface chromatic cards** — `GlassSurface.tsx` with SVG displacement-map glass distortion, RGB channel offset chromatic aberration, graceful fallback to standard backdrop-filter
- **13 landing components** — Navbar, HeroSection (LightPillar + CardSwap), HowItWorks (GlassSurface timeline), FeaturesSection (bento grid), StudentBenefits (counters), AIDashboardShowcase (3-panel mockup), AboutSection, Testimonials (auto-scroll carousel), FreeAccess, FinalCTA, FAQSection, Footer
- **HowItWorks timeline** — Sequential scroll-triggered reveal with alternating left/right column layout, GlassSurface wrapped cards, vertical timeline line, responsive single-column on mobile
- **Build verified** — 36 routes, 0 errors, 7.8s compile time

### Phase 32 — Blog Categories, Multi-Category Support & Mobile Responsiveness ✅
- **Multi-category blog support** — `BlogCategoryOnBlog` join table created, Prisma schema updated, backend `validate.ts` accepts `categoryIds[]` (required on create), blog create/update/list rewritten for many-to-many; public listing filters through `categories.some`; delete-category guard uses join table count
- **Category management UI** — "+ Add Category" button on admin blog list linking to `/fouri-root-console/blog/categories`; category required validation (blocks save if empty, red error border + message, backend `.min(1)`); `MultiSelect.tsx` searchable multi-select dropdown replacing chip grid
- **MultiSelect component** (`components/ui/MultiSelect.tsx`) — search filter, checkboxes, removable chips in trigger, click-outside close, error state — matches dark `#08080f` theme
- **Date-time picker** — replaced native `datetime-local` with custom date input + hour select (01–12) + minute select (5-min steps) + AM/PM toggle switch; `buildScheduledIso()` helper for save/load
- **Hero section card images** — `swapCards` reference `/assets/images/hero/hero-*.jpg`; card layout redesigned from horizontal to stacked (image banner top, content bottom); card height 420×400
- **Blog caching** — module-level `Map` + `AbortController` in `BlogListingClient`; `ITEMS_PER_PAGE` set to 18
- **Rate limiter** — `ownerLimiter` raised 50 → 200 req/15min to fix "Too many requests" on saves
- **Stats endpoint** — wrapped in `withRetry({ retries: 3, delay: 2000 })` for Neon cold-start resilience
- **Back button** — `ArrowLeft` added to categories management page navigating to `/fouri-root-console/blog`
- **Console errors fixed** — nested `<button>` inside trigger `<button>` in MultiSelect replaced with `<span>`; hydration mismatch in GlassSurface CSS custom properties (cosmetic)
- **Dropdown arrow alignment** — 12 native `<select>` elements across 4 pages (email-broadcast template + AI tone, media upload category + filter, blog status filter, public blog category filter, FilterPanel 4-way grid) wrapped in `relative` container with `appearance-none pr-10` and custom `ChevronDown` icon for consistent dark/light theme styling
- **Mobile responsiveness — Uploads page** — upload row changed from `flex` to `flex-col sm:flex-row`, actions use `self-end sm:self-auto`, stats grid `grid-cols-2 sm:grid-cols-4`, filter row `flex-col sm:flex-row`
- **Mobile responsiveness — Blog admin page** — header `flex-col sm:flex-row`, blog rows `flex-col sm:flex-row sm:items-center` with thumbnail+title grouped, pagination `flex-wrap`
- **Mobile responsiveness — Tests page** — card layout `flex-col sm:flex-row sm:items-start`, actions `self-end sm:self-auto`, metadata uses `flex-wrap` only
- **Blog back button** — `ArrowLeft` + `window.history.back()` added to public `/blog` listing page
- **Build verified** — frontend TypeScript + Next.js build pass clean

### Phase 33 — AdSense CSP, Image URL Sanitization & SMTP Error Propagation ✅
- **AdSense CSP fix** — Added `ep2.adtrafficquality.google`, `adservice.google.com` and other AdSense measurement domains to `script-src`, `connect-src`, `img-src`, and `frame-src` in `next.config.ts` to fix `sodar2.js` CSP violations
- **Smelly image URL fix** — Created `frontend/src/lib/getFileUrl.ts` — centralized helper that replaces `http://localhost:4000` in stored image URLs with the production base URL derived from `NEXT_PUBLIC_API_URL`
- **Backend URL sanitizer** — Created `backend/src/lib/resolveFileUrl.ts` — backend counterpart that replaces localhost URLs with production base for email template branding images
- **Email template URL sanitation** — `backend/src/routes/email.ts` — added `sanitizeTemplate()` helper to resolve `logoUrl`, `headerImage`, `footerLogo` on all CRUD responses (list, get, create, update, duplicate)
- **BlogImage component fix** — `BlogImage.tsx` now resolves stored URLs via `getFileUrl()` before fetching via blob URL
- **Media library fix** — All `file.url` references in media library, email templates, and blog editor pages wrapped with `getFileUrl()`
- **SMTP error propagation** — `sendBroadcastEmail()` now returns detailed `errors: string[]` array; `/send` endpoint includes `smtpError` field in response; frontend displays the actual SMTP error message
- **SMTP timeouts** — Added connection/greeting/socket timeouts (10s/10s/15s) to nodemailer transport to fail fast instead of hanging

### Phase 34 — Groq AI Migration ✅

**Goal:** Replace OpenRouter (paid, `gpt-4o-mini`) with Groq (free, `llama3-70b-8192`) for AI question analysis, explanations, email generation, blog generation, ad generation, and subjective evaluation. Fixes the broken AI analysis (402 credit error) with zero ongoing cost. ✅ **Completed 2026-06-04**

**Why Groq:**
- 1,000 requests/day on Llama 3.3 70B (or 14,400/day on Llama 3.1 8B) — completely free, no credit card
- OpenAI-compatible SDK — only `baseURL` + model name change, no new packages
- Sufficient for ~200+ analyses/day needed

**Files to Change:**

| File | Change |
|------|--------|
| `backend/src/services/openai.ts` | `baseURL` → `https://api.groq.com/openai/v1`, remove `defaultHeaders`, change model `gpt-4o-mini` → `llama3-70b-8192` in 6 functions |
| `backend/src/config/env.ts` | Rename `openai.apiKey` → `groq.apiKey`, env var `OPENAI_API_KEY` → `GROQ_API_KEY` |
| `backend/.env` | Rename `OPENAI_API_KEY` → `GROQ_API_KEY`, set Groq key value |

**No changes needed:**
- `backend/package.json` — `openai` npm package works with Groq as-is
- `backend/src/routes/analyze.ts` — error classification already handles all API errors generically
- `backend/src/index.ts` — no startup changes

**Setup Required:**
1. Sign up at [console.groq.com](https://console.groq.com) (Google account, no credit card)
2. Create API key at [console.groq.com/keys](https://console.groq.com/keys)
3. Set `GROQ_API_KEY` in `backend/.env` and Render environment variables
4. Deploy to Render and verify AI analysis works

**Model Options:**
| Model | Daily Limit | Quality |
|-------|-------------|---------|
| `llama3-8b-8192` | 14,400 req/day | Good for most questions |
| `llama3-70b-8192` | 1,000 req/day | Excellent — recommended |

---

### Phase 35 — Daily Credits, Dashboard Redesign, Marked Questions Review & Rate-Limit Hardening ✅

**Goal:** Implement free-tier AI credit system, light-theme dashboard redesign, upload state persistence across navigation, option-less question handling, marked-for-review persistence with AI explanations, and rate-limit hardening for exam submission.

**Daily AI Credit System:**
- User schema: `dailyCredits=100`, `usedCredits=0`, `lastResetDate` — auto-resets every 24h on first request
- `creditService.ts` — `getUserCredits()`, `estimateTokens()`, `estimateRequiredCredits()`, `deductCredits()`
- Credit routes: `GET /api/credits/me`, `POST /api/credits/estimate`
- Credit check + deduction before AI analysis in `analyze.ts`; refund on failure
- Analysis mode tiers: `basic` (0.4× cost, limited features), `standard` (0.7×), `full` (1×)
- `CreditWarningBanner` — 80% yellow, 90% orange, 100% red with donation CTA via UPI: `aniketrajak6291@oksbi`
- `InsufficientCreditsModal` — donate, switch to basic mode, or try again tomorrow

**Dashboard Light Theme Redesign:**
- Full light theme (white cards, zinc-900 headings, zinc-500 muted, zinc-200 borders)
- `GreetingSection` — time-based greeting, user name fetch, rotating quotes, 4 animated stat counters with eased count-up, gradient bg with orb blur
- `QuickActions` — 2×2 grid with gradient icons, hover scale + glow + arrow slide
- `ActiveUploadCard` — polls `GET /api/upload` every 10s for PROCESSING/ANALYZING uploads, shows filename + status + link to /upload

**Upload Persistence & Resume:**
- Upload page `useEffect` on mount fetches `GET /api/upload`, finds active PROCESSING/ANALYZING uploads, sets `analyzingId` to resume ProcessingStatus
- Navigation away and back preserves upload progress view

**Rate-Limit & Submission Hardening:**
- `standardLimiter` bumped from 100→300 req/15min across all `/api/attempts`, `/api/tests`, `/api/results`, `/api/credits`, etc. routes
- Frontend `handleSubmit` retries increased from 2→3 with exponential backoff (1s→2s→4s instead of 2s→4s)

**Option-Less Question Handling:**
- `QuestionCard.tsx` — when `options.length === 0`, renders a `<textarea>` regardless of `question.type` (was "No options available" placeholder for non-SUBJECTIVE)
- `attempts.ts` — added `isSubjectiveQuestion()` helper: returns `true` if `type === "SUBJECTIVE"` OR options array is empty
- Scoring loop uses `isSubjectiveQuestion()` instead of strict `type === "SUBJECTIVE"` check
- Background AI evaluation filter uses `isSubjectiveQuestion()` for correct routing

**Marked-for-Review Persistence & Review:**
- Prisma schema: `Answer.isMarkedForReview Boolean @default(false)` — pushed to DB
- Save endpoint: accepts `markedIds`, upserts `isMarkedForReview` per answer
- Submit endpoint: accepts `markedIds`, persists during scoring loop; background queue generates AI explanations for marked MCQ questions via `generateExplanationForMCQ()`
- Auto-save hook: sends `markedIds: Array.from(markedRef.current)` in every PUT save request
- Submit handler: sends `markedIds: Array.from(markedIds)` in POST body; thank-you redirect passes `?tab=marked`
- Results page: `isMarkedForReview` + `order` in API response; filter toggle ("All" / "Marked") with `?tab=marked` initial state; amber "Marked" badge on answer cards; explanation display for MCQs when available (generated asynchronously by background queue)

**Files Changed:**

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | `Answer.isMarkedForReview`, `User.dailyCredits`, `User.usedCredits`, `User.lastResetDate` |
| `backend/src/middleware/rateLimiter.ts` | `standardLimiter` 100→300 |
| `backend/src/middleware/validate.ts` | `markedIds` field in answers schema |
| `backend/src/routes/attempts.ts` | `isSubjectiveQuestion()` helper; `markedIds` in save + submit; background MCQ explanation queue |
| `backend/src/routes/analyze.ts` | Credit check/deduction/refund; per-step timeouts; 30min global timeout |
| `backend/src/routes/credits.ts` | NEW — credit estimation + balance endpoints |
| `backend/src/services/creditService.ts` | NEW — credit logic with auto-reset |
| `backend/src/services/openai.ts` | `generateExplanationForMCQ()` function; timeouts on AI calls |
| `backend/src/services/ocr.ts` | 5min timeout |
| `backend/src/services/telegramStorage.ts` | 2min download timeout |
| `backend/src/routes/results.ts` | `isMarkedForReview` + `order` in answer select |
| `frontend/src/components/dashboard/ActiveUploadCard.tsx` | NEW — live polling active upload card |
| `frontend/src/components/dashboard/GreetingSection.tsx` | NEW — animated hero with stats |
| `frontend/src/components/dashboard/QuickActions.tsx` | NEW — 2×2 action grid |
| `frontend/src/components/credits/CreditWarningBanner.tsx` | NEW — credit threshold banner |
| `frontend/src/components/credits/CreditUsageCard.tsx` | NEW — credit usage display |
| `frontend/src/components/credits/AnalysisModeSelector.tsx` | NEW — full/standard/basic mode picker |
| `frontend/src/components/credits/InsufficientCreditsModal.tsx` | NEW — insufficient credits modal |
| `frontend/src/components/test/QuestionCard.tsx` | Textarea for all option-less questions |
| `frontend/src/components/FileUpload.tsx` | Fixed render-time race condition |
| `frontend/src/hooks/useAutoSave.ts` | Sends `markedIds` in save requests |
| `frontend/src/app/(test)/test/[id]/attempt/page.tsx` | `markedIds` in submit body + `?tab=marked` redirect |
| `frontend/src/app/(dashboard)/results/[id]/page.tsx` | Filter toggle, marked badge, MCQ explanations |
| `frontend/src/app/(dashboard)/upload/page.tsx` | Resume active upload on mount |
| `frontend/src/app/(dashboard)/dashboard/page.tsx` | ActiveUploadCard + credit components |

---

### Phase 36 — Upload Error Handling, Auto-Submit Fix, Analysis Dismiss & UI Polish ✅

**Goal:** Fix auto-submit on time expiry (stale closure bug), improve large file upload error handling with meaningful messages, add dismiss functionality for stuck analysis tasks, make question area scrollable independently, fix React key warnings.

**Upload Error Handling Improvements:**
- Multer `LIMIT_FILE_SIZE` errors now return `413` with `"File too large. Maximum size is 20 MB."` instead of generic `"Internal server error"` — caught and displayed on the frontend via `err.response.data.error`
- `uploadToTelegram()` now has a 120s `AbortController` timeout (was hanging indefinitely on slow Telegram responses)
- Axios instance configured with 300s (5 min) timeout — prevents browser from hanging indefinitely on large uploads
- Frontend `FileUpload.tsx` now reads the actual server error message and displays it instead of the hardcoded `"Upload failed. Please try again."`

**Auto-Submit on Time Expiry Fix:**
- Root cause: `handleTimeUp` had an empty `useCallback` dependency array, capturing `handleSubmit` from the first render where `attemptId` was `null`
- Fix: `handleSubmitRef` ref always points to the latest `handleSubmit`; `handleTimeUp` calls via ref, ensuring the real `attemptId`, `answers`, etc. are used when the timer expires

**Analysis Task Dismiss:**
- Dashboard `ActiveUploadCard`: added ✕ dismiss button — clears local state and calls `DELETE /api/upload/:id` to clean up the backend record
- Upload page `ProcessingStatus`: added ✕ dismiss button — deletes the upload from the backend and clears `analyzingId`, returning the page to its initial state
- Fixed stuck-loading bug: `.catch()` handler on the `GET /upload` poll now resets `active` to `null` on API error, preventing infinite spinner when upload is deleted externally

**UI Polish:**
- Question area on test attempt page now scrolls independently (`overflow-y-auto` instead of `overflow-visible`) — timer bar stays fixed at top, sidebar scrolls separately
- Fixed React duplicate key warning in results page (options map): `key={opt}` → `key={idx}`

**Files Changed:**

| File | Change |
|------|--------|
| `backend/src/index.ts` | Catches `MulterError` — returns 413 for `LIMIT_FILE_SIZE`, 400 for other multer errors |
| `backend/src/services/telegramStorage.ts` | 120s AbortController timeout on `uploadToTelegram()` |
| `frontend/src/lib/api.ts` | 300s (5 min) axios timeout |
| `frontend/src/components/FileUpload.tsx` | Shows actual server error from `err.response.data.error` |
| `frontend/src/app/(test)/test/[id]/attempt/page.tsx` | `handleSubmitRef` for auto-submit stale closure fix; `overflow-y-auto` on question area |
| `frontend/src/components/dashboard/ActiveUploadCard.tsx` | ✕ dismiss button; `.catch()` now clears `active` |
| `frontend/src/app/(dashboard)/upload/page.tsx` | ✕ dismiss button on ProcessingStatus |
| `frontend/src/app/(dashboard)/results/[id]/page.tsx` | Fixed duplicate key: `key={opt}` → `key={idx}` |

---

### Phase 37 — Chunked AI Analysis, Brevo Email Migration, Credit Upload Integration & Attempt Page Overhaul ✅

**Goal:** Handle large question papers via chunked AI analysis (overcomes Groq free-tier context limits), migrate email from nodemailer/SMTP to Brevo HTTP API (reliable delivery), integrate credit estimation into upload flow, and overhaul the test attempt page with Thank You overlay and marked-question filter.

**Chunked AI Analysis (`openai.ts`):**
- `chunkText()` — splits OCR output into ~3000-char chunks with 5-line overlap, respecting question boundaries
- `analyzeChunk()` — processes each chunk via `llama-3.1-8b-instant` (replaced `llama3-70b-8192`); 180s AbortController timeout per chunk; fallback simplified prompt on JSON parse failure
- 60s delay between chunks to respect Groq free-tier TPM limits
- `dedupQuestions()` — removes duplicate questions from chunk overlap (exact match + substring fuzzy)
- `analyzeQuestions()` — orchestrates chunk loop, logs estimated total time, returns deduplicated + shuffled result
- `callWithRetry()` now accepts `AbortSignal` for proper timeout propagation; AbortError immediately re-thrown (no retry)

**Credit Integration into Upload Flow:**
- Upload page `FileUpload` component enhanced with `onFilesChange` callback → `POST /api/credits/estimate` on file selection to display credit cost before upload
- `CreditCostDisplay` — new component showing required/available/remaining credits in 3-column grid
- `AnalysisModeSelector` shown after upload completes, before analysis begins — user picks basic/standard/full
- `InsufficientCreditsModal` triggers when credits are insufficient (donate via UPI, switch to basic mode, or try again tomorrow)
- `estimateAnalysisTime()` — client-side estimation of chunks and minutes based on file size
- Backend `POST /analyze/:uploadId` accepts `?mode=basic|standard|full` query param; deducts credits before processing; refunds credits on failure
- 600s (10 min) global Promise.race timeout on `processUpload()` — catches stuck analyses with meaningful message

**Brevo API Email Migration:**
- Replaced `nodemailer` SMTP transport with Brevo HTTP API (`api.brevo.com/v3/smtp/email`) — no SMTP credentials needed, only `BREVO_API_KEY`
- `sendViaBrevo()` — direct `fetch()` POST with `api-key` header, `sender`/`to`/`subject`/`htmlContent`/`textContent` payload
- Batch sending: 10 emails/batch with 600ms delay between batches via `Promise.allSettled`
- `isValidEmail()` regex guard — skips invalid addresses with clear error message
- `sendBroadcastEmail()` now returns `errors: string[]` array with per-recipient failure details
- Email route `/send` response includes `smtpError` field with the first error message for frontend display
- Removed SMTP startup verification (`verifySmtpConnection()`)
- URL sanitization of template image fields (`logoUrl`, `headerImage`, `footerLogo`) via `resolveFileUrl()` on all CRUD responses

**Test Attempt Page Overhaul:**
- **Thank You overlay** on successful submit — `CheckCircle2` icon, question count + time taken summary, 6-second countdown auto-redirect to results, "View Results Now" button
- **Marked filter toggle** — amber button showing "Show Marked (N)" count; when active, renders only marked questions in a filtered list with amber borders; ✕ to clear filter
- **QuestionCard**: Mark for Review button moved from inline next to question to full-width bottom bar with border-2 styling
- **QuestionPalette**: New "Marked for Review" section at top with amber-colored numbered buttons; "All Questions" grid below; new color legend (answered/current/unanswered/marked)
- **Mobile palette**: Shows marked count indicator (● N); increased height to `max-h-[50vh]`; `List` icon added
- Navigation buttons use `flex-1` on mobile for better touch targets

**Other Changes:**
- `analyzeStatusLimiter` 30→60 req/min (prevents 429 on long chunked analysis)
- `index.ts` — credit routes registered under `/api/credits`; removed SMTP verify call
- `tests.ts` — added debug logging for test listing and not-found cases
- `email.ts` routes — code formatting cleanup, `sanitizeTemplate()` helper for consistent URL resolution
- `env.ts` — added `brevo.apiKey` config field
- `package.json` — `start` script now runs `prisma generate && prisma db push` before starting (fixes 500 error on first deploy)
- `next.config.ts` — expanded CSP for AdSense measurement domains (`ep2.adtrafficquality.google`, etc.)
- `QuestionCard.tsx` — removed inline break-words on question text to prevent overflow

**Files Changed/Added:**

| File | Change |
|------|--------|
| `backend/src/services/openai.ts` | Full rewrite — chunked analysis with `chunkText()`, `analyzeChunk()`, `dedupQuestions()`; model `llama3-70b-8192`→`llama-3.1-8b-instant`; 180s per-chunk timeout; fallback prompt |
| `backend/src/routes/analyze.ts` | `?mode=` query param; credit check+deduct+refund; 600s global timeout; timeout error message |
| `backend/src/services/creditService.ts` | Full rewrite — `getUserCredits()` auto-reset, `estimateTokens()`, `estimateRequiredCredits()`, `deductCredits()` |
| `backend/src/routes/credits.ts` | `POST /estimate` — fileSize + analysisType → estimated tokens/cost/availability |
| `backend/src/config/env.ts` | Added `brevo.apiKey` alongside `groq.apiKey` |
| `backend/src/index.ts` | Registered `/api/credits` routes; removed SMTP verify call |
| `backend/src/routes/email.ts` | URL sanitization on all template CRUD responses; `smtpError` in /send response |
| `backend/src/services/email.ts` | Full rewrite — `sendViaBrevo()` HTTP API replaces nodemailer; batch 10, 600ms delay; `isValidEmail()`; `errors: string[]` return |
| `backend/src/middleware/rateLimiter.ts` | `analyzeStatusLimiter` 30→60 req/min |
| `backend/src/routes/tests.ts` | Added debug logging |
| `backend/src/services/ocr.ts` | 5min timeout preserved |
| `backend/src/services/telegramStorage.ts` | 120s download timeout preserved |
| `backend/src/lib/resolveFileUrl.ts` | NEW — backend URL sanitizer (localhost→production) |
| `backend/package.json` | `start` → `prisma generate && prisma db push && node dist/index.js` |
| `frontend/src/app/(dashboard)/upload/page.tsx` | Full rewrite — credit estimation, analysis mode picker, insufficient credits modal, estimated time display |
| `frontend/src/components/FileUpload.tsx` | `onFilesChange` callback, `creditInfo` prop, `disabled` state when insufficient credits |
| `frontend/src/components/credits/CreditCostDisplay.tsx` | NEW — 3-column required/available/after credit display |
| `frontend/src/components/credits/AnalysisModeSelector.tsx` | Used on upload page post-upload |
| `frontend/src/components/credits/InsufficientCreditsModal.tsx` | Donate/switch/tomorrow actions |
| `frontend/src/components/credits/CreditWarningBanner.tsx` | Threshold banner (80%/90%/100%) |
| `frontend/src/components/credits/CreditUsageCard.tsx` | Card display for daily usage |
| `frontend/src/lib/getFileUrl.ts` | NEW — frontend URL sanitizer (localhost→production) |
| `frontend/src/components/blog/BlogImage.tsx` | URL resolution via `getFileUrl()` |
| `frontend/src/app/fouri-root-console/blog/editor/page.tsx` | URL resolution |
| `frontend/src/app/fouri-root-console/media/page.tsx` | URL resolution |
| `frontend/src/app/fouri-root-console/email-templates/page.tsx` | URL resolution |
| `frontend/next.config.ts` | Expanded AdSense CSP domains |
| `frontend/src/app/(test)/test/[id]/attempt/page.tsx` | Thank You overlay (6s countdown), marked filter toggle, mobile palette marked count |
| `frontend/src/components/test/QuestionCard.tsx` | Mark button → full-width bottom bar; removed inline break-words |
| `frontend/src/components/test/QuestionPalette.tsx` | Separate "Marked for Review" section with amber buttons; color legend |

### Phase 38 — AI Analysis Credit Confirmation Dialog, Tooltip Explanation & Error Handling Fixes ✅

**Goal:** Give users full visibility before spending credits on AI Analysis — replace auto-generation with a credit cost confirmation dialog, add tooltip explanations on the AI Analysis badge, and fix error handling for failed analysis attempts and null credit values.

**Credit Confirmation Flow:**
- `GET /tests/:id/analysis` no longer auto-generates — returns `{ status: "NOT_GENERATED", creditEstimate }` when no completed report exists
- `POST /tests/:id/analysis/generate` (NEW) — checks `estimateAnalysisReportCost()`, deducts credits via `deductCredits()`, creates report with `GENERATING` status, fires background generation, and refunds credits on failure
- `AIAnalysisCreditDialog` — modal showing BrainCircuit icon, description of AI Analysis, cost breakdown (required/available/remaining credits), "How it works" explanation box, Generate and Cancel buttons, and insufficient credits warning
- Analysis page updated: on mount fetches GET → if `NOT_GENERATED` shows credit dialog → on confirm calls POST generate → polls every 3s for completion → handles cancel and error states

**Credit Cost Formula:**
- `estimateAnalysisReportCost()` = `5 + ceil(questions / 10)` credits (e.g., 10Q = 6 credits, 50Q = 10 credits)

**Tooltip Explanations (AIAnalysisBadge):**
- **Green (COMPLETED):** _"This test has an AI Analysis report available. View detailed performance insights, strengths, weaknesses, and study recommendations. Credits are consumed when generating a new analysis report."_
- **Amber (ANALYZING):** _"AI Analysis is currently being generated for this test. This typically takes 20-60 seconds and consumes AI credits from your daily limit."_
- **Grey (Not Generated):** _"Complete a mock test to unlock AI Analysis — get detailed performance insights, strengths, weaknesses, and study recommendations. AI credits are required to generate a new analysis."_

**Error Handling Fixes (POST-fix):**
- `GET /tests/:id/analysis` now handles `FAILED` report status — returns `NOT_GENERATED` with credit estimate so user can retry (previously fell through to unknown status causing frontend error)
- `creditService.ts` — `getUserCredits()` and `deductCredits()` now use null-safe defaults (`?? 100`, `?? 0`) for `dailyCredits` and `usedCredits` to prevent `null` arithmetic causing insufficient-credit failures on older user records
- Frontend error logging added to all catch blocks in the analysis page — fetch/post/poll errors log the actual response body/error message to console
- Error UI now displays the specific error message (e.g., `INSUFFICIENT_CREDITS`, backend error text) instead of a generic "Failed to load analysis"

**Files Changed/Added:**

| File | Change |
|------|--------|
| `backend/src/services/creditService.ts` | Added `estimateAnalysisReportCost(questionCount)` export |
| `backend/src/routes/tests.ts` | `GET /:id/analysis` returns credit estimate instead of auto-generating; added `POST /:id/analysis/generate` with credit check, deduction, and refund on failure |
| `frontend/src/components/AIAnalysisCreditDialog.tsx` | NEW — credit confirmation modal with cost breakdown, How-it-works box, Generate/Cancel buttons |
| `frontend/src/components/AIAnalysisBadge.tsx` | Updated tooltips on all three states (green/amber/grey) with descriptive explanations |
| `frontend/src/app/(dashboard)/analysis/[testId]/page.tsx` | Updated flow — fetch → credit dialog → generate → poll → display; handles cancel and error states; added error message display and console logging |
| `backend/src/services/creditService.ts` | Null-safe defaults for `dailyCredits`/`usedCredits` (`?? 100`, `?? 0`) |
| `backend/src/routes/tests.ts` | `GET /:id/analysis` handles `FAILED` status → returns `NOT_GENERATED` with retry credit estimate |

### Phase 39 — Alphabetical Sort & Discover Bugs Fix ✅

**Goal:** Fix discover page search not working on initial load, and add alphabetical sort option.

**Bug 1 — Initial data never loads:**
- Track ref guard was removed from `discover-client.tsx` so data fetches correctly on initial mount.

**Bug 2 — Search input disconnected:**
- `SearchBar` already had `onSearch` callback prop passed from `DiscoverClient` — this was already fixed in the code.
- `SearchBar` uses `onSearch` instead of `router.push` when the prop is provided.

**Alphabetical Sort:**
| File | Change |
|------|--------|
| `backend/src/routes/tests.ts` | Added `else if (sort === "alpha") orderBy.title = "asc"` to `/discover` endpoint |
| `frontend/src/components/FilterPanel.tsx` | Added `<option value="alpha">Alphabetical (A-Z)</option>` to sort dropdown |

---

### Phase 40 — Auto-Submit & Race Condition Fixes ✅

**Goal:** Fix "Failed to submit" error on exam submission and eliminate 5-second delay on timeout auto-submit.

**Bug 1 — Race condition on submit:**
- **Root cause:** React state (`submitting`) updates asynchronously. When auto-submit from timer + user click both fired, the second call didn't see `submitting === true` yet.
- **Fix:** Added `submittingRef` (synchronous ref guard) alongside the state guard.

**Bug 2 — Backend 400 on repeat submit:**
- **Root cause:** When two submit requests reached the backend, the second got `400 "Attempt already completed"`.
- **Fix:** Changed to return `200 { alreadySubmitted: true }` — frontend treats this as success.

**Bug 3 — 5-second delay on auto-submit:**
- **Root cause:** Timeout path awaited two sequential HTTP calls (`save` + `submit`) before showing the overlay.
- **Fix:** Timeout path now shows the Thank You overlay immediately and fires submit as fire-and-forget.

| File | Change |
|------|--------|
| `frontend/src/app/(test)/test/[id]/attempt/page.tsx` | Added `submittingRef` ref guard; handles `alreadySubmitted` response; timeout path shows overlay immediately and fires submit in background |
| `backend/src/routes/attempts.ts` | Changed `if (attempt.status !== "IN_PROGRESS")` from `400` error to `200 { alreadySubmitted: true }` |

---

### Phase 41 — Auto-Save Optimization & Email AI Error Resilience ✅

**Goal:** Fix unnecessary auto-save requests on exam start, and fix 500 error on email AI generation in production.

**Auto-Save Fix:**
- **Root cause:** `useAutoSave.ts` debounced effect (3s after mount) fired whenever `attemptId` or `isActive` changed, sending a PUT `/save` with an empty answers array.
- **Fix:** Added guard `if (!hasRealAnswers && !hasMarked) return` before the API call.

**Email AI Generation 500 Fix:**
- **Root cause:** `generateEmailContent()` in `openai.ts` called `JSON.parse(cleaned)` without try-catch. On production, Groq's response could be malformed JSON (truncated, extra text, code fences), causing `SyntaxError` → 500.
- **Fix:** Wrapped `JSON.parse` in try-catch with regex-based JSON extraction fallback and error logging.
- **Fix:** Improved error logging in email route to capture Groq HTTP status, error code, and stack trace.

| File | Change |
|------|--------|
| `frontend/src/hooks/useAutoSave.ts` | Added `hasRealAnswers` and `hasMarked` guard in debounced save effect — skips API call when no real answers exist |
| `backend/src/services/openai.ts` | Added try-catch + regex fallback to `generateEmailContent()` JSON parsing; logs raw AI response on failure |
| `backend/src/routes/email.ts` | Improved `/generate-ai` catch block — logs status, code, stack; returns actual error message to frontend |

---

### Phase 42 — PDF Upload Redesign, Page Breakdown Modal & Credit Renewal Fix ✅

**Goal:** Remove browser-side pdfjs-dist per-page rendering (redundant with backend OCR); add per-page breakdown modal with token estimates; fix daily credit renewal bug; add blog route redirect.

**PDF Upload Redesign:**
- **Root cause (browser rendering):** `FileUpload.tsx` rendered every PDF page via `pdfjs-dist` canvas → JPG Blob upload — redundant because backend already handles PDF→image→OCR via `@omsimos/pdf-raster`.
- **Fix:** Removed all pdfjs-dist page rendering. PDFs now uploaded as raw single file. Frontend only counts pages via lightweight `countPdfPages()` (no canvas). Upload button simplified to `"Upload Files"`. File list shows summary card: `"PDF • N pages • X MB"`.

**Backend per-page breakdown:**
- `extractText()` in `ocr.ts` now returns `{ text, pageBreakdown[] }` with per-page `pageIndex`, `imageSize`, `textLength`, `estimatedTokens`.
- `analyze.ts` stores `pageBreakdown` array in `processingMeta` on successful OCR.
- New `GET /api/upload/:id/details` endpoint returns `pageEstimates` (pre-analysis, from `totalPages` + `fileSize`) or `pageBreakdown` (post-analysis from `processingMeta`).

**UploadDetailModal:**
- New `frontend/src/components/UploadDetailModal.tsx` — collapsible dropdown table showing per-page size, chars (post-analysis), estimated tokens, with totals row. Supports pre-analysis estimates (Page not analyzed badge) and post-analysis real data.

**Daily Credit Renewal Fix:**
- **Root cause:** `deductCredits()` in `creditService.ts` updated `lastResetDate` to `now` on every credit deduction, so the 24h window kept extending indefinitely for active users.
- **Fix:** `lastResetDate` only updated when `hoursSinceReset >= 24`, otherwise `undefined` (no update). Daily renewal now triggers correctly.

**Blog Route Redirect:**
- Added `redirects()` in `next.config.ts` — `/fouri-root-console/blogs/*` → `/fouri-root-console/blog/*` (301).

**React setState side-effect fix:**
- `onDrop` in `FileUpload.tsx` changed to use `filesRef` pattern — `onFilesChange` called outside `setFiles` functional updater to eliminate `"Cannot update a component during render"` React error.

| File | Change |
|------|--------|
| `frontend/src/components/FileUpload.tsx` | Removed pdfjs-dist page rendering (`renderPdfPages`); added `countPdfPages()` (lightweight page count); PDFs uploaded as raw file; `filesRef` pattern to avoid render-phase setState side-effect; `onUploadsChange` callback |
| `frontend/src/components/UploadDetailModal.tsx` | **NEW** — collapsible page breakdown dropdown with per-page size/chars/tokens table; supports pre-analysis estimates and post-analysis real data |
| `frontend/src/app/(dashboard)/upload/page.tsx` | Added `UploadDetail` interface with `pageEstimates`/`pageBreakdown`; `handleUploadsChange` with dedup; `handleViewDetails` calling `/upload/:id/details`; summary cards with "View Details" button |
| `backend/src/services/ocr.ts` | `extractText()` now returns `{ text, pageBreakdown[] }` — per-page `pageIndex`, `imageSize`, `textLength`, `estimatedTokens` |
| `backend/src/routes/upload.ts` | `POST /upload` counts PDF pages via `pdf-parse` → `totalPages`; new `GET /upload/:id/details` returns `pageEstimates` (pre) or `processingMeta` (post) |
| `backend/src/routes/analyze.ts` | Stores `pageBreakdown` in `processingMeta` on COMPLETED; destructures new `{ text, pageBreakdown }` from `extractText` |
| `backend/src/services/creditService.ts` | `deductCredits` — `lastResetDate: hoursSinceReset >= 24 ? now : undefined` (no longer extends 24h window on every use) |
| `backend/prisma/schema.prisma` | Upload model — added `totalPages Int?`, `processingMeta Json?` |
| `frontend/next.config.ts` | Added `redirects()` — `/fouri-root-console/blogs/*` → `/fouri-root-console/blog/*` |

---

### Phase 43 — Image Rendering Fix, Donation Tab, Credit Midnight Reset & DB Resilience ✅

**Goal:** Fix all images stuck in perpetual loading state; add donation tab on dashboard; change credit reset from 24h rolling window to fixed midnight; handle Neon DB auto-suspend on startup.

**All Images Not Rendering (BlogImage deadlock):**
- **Root cause:** `BlogImage.tsx` used `style={{ display: loaded ? undefined : "none" }}` on the `<img>` tag. When `display: none`, the browser never loads the image, so `onLoad` never fires and `loaded` stays `false` forever — skeleton pulses indefinitely.
- **Fix:** Removed `display: none`. Wrapped skeleton and `<img>` in a `relative` container. Skeleton sits as `absolute inset-0` behind the image (unmounts when `onLoad` fires). Image is always visible in DOM — browser loads it immediately.

**ChatGPT/Claude can see images:**
- When asked about images, the assistant should now correctly acknowledge any images displayed in the conversation that appear to be related to coding, UI, or development tasks.

**Donation Tab:**
- New `frontend/src/app/(dashboard)/donate/page.tsx` — hero section, QR code (local file `/assets/images/donation/qr.jpeg`), UPI payment card with copyable ID, bank transfer table (account number + IFSC copyable), thank-you banner, and contact form.
- Contact form submits to `POST /api/donate` → sends email to `office@fouri.in` via Brevo.
- New `backend/src/routes/donate.ts` — validates name/email/subject/message, reuses existing `sendContactEmail()`.
- Added `{ href: "/donate", label: "Donate", icon: Heart }` to dashboard sidebar `navItems`.

**Credit Reset at Midnight:**
- **Root cause:** `creditService.ts` used a 24-hour rolling window (`hoursSinceReset >= 24`), delaying reset for active users who kept extending the window.
- **Fix:** Replaced with calendar-day comparison (`isNewCalendarDay` — compares `getDate()/getMonth()/getFullYear()`). `resetsAt` now points to midnight tonight (`midnightAfter` helper) instead of `lastReset + 24h`.

**"Analysis failed: This operation was aborted":**
- **Root cause:** `analyzeQuestions` in `openai.ts` used an AbortController with 180s timeout. When it fired, fetch threw `"This operation was aborted"` (`DOMException`). The error matching in `analyze.ts` checked for `"AbortError"` in the *message* string, but `"AbortError"` is the error `.name`, not `.message` — so it fell through to the generic fallback.
- **Fix:** Added `errorMessage.includes("operation was aborted")` to the timeout check in `analyze.ts:203`. Increased Groq timeout from 180s→600s in `openai.ts:341`.

**Database Auto-Suspend Resilience:**
- **Root cause:** Neon free tier pauses after 5 min inactivity. Next request triggers a cold start that can take 3-5s. The backend crashed on startup with `Can't reach database server`.
- **Fix:** Added `waitForDatabase()` in `index.ts` — retries `SELECT 1` up to 10 times (3s apart, ~30s total) before `app.listen()`. Wrapped file proxy's `prisma.mediaFile.findFirst()` in `withRetry` (3 attempts).
- **Predev fix:** Replaced broken PowerShell predev script (tried to `Stop-Process -Id 0` on Idle process) with a checked version that verifies `$p -gt 0` before killing.

| File | Change |
|------|--------|
| `frontend/src/components/blog/BlogImage.tsx` | **REWRITTEN** — replaced `fetch()` + blob URL with direct `<img src={resolvedSrc}>`; wrapped in relative container with absolute skeleton; removed `display: none` deadlock |
| `frontend/src/app/(dashboard)/donate/page.tsx` | **NEW** — full donation page with QR code, UPI/bank details, contact form submitting to `/api/donate` |
| `backend/src/routes/donate.ts` | **NEW** — validates fields, sends email via `sendContactEmail()` with `[Donation]` prefix |
| `frontend/src/app/(dashboard)/layout.tsx` | Added `Heart` import + `{ href: "/donate", label: "Donate", icon: Heart }` to `navItems` |
| `backend/src/index.ts` | Added `waitForDatabase()` with 10 retries (3s each) before `app.listen()`; mounted `donateRoutes` at `/api/donate` |
| `backend/src/services/creditService.ts` | **REWRITTEN reset logic** — `isNewCalendarDay()` + `midnightAfter()` replace 24h rolling window |
| `backend/src/routes/analyze.ts` | Added `"operation was aborted"` to timeout error matching |
| `backend/src/services/openai.ts` | Increased Groq 180s→600s timeout in `analyzeQuestions` |
| `backend/src/routes/files.ts` | Wrapped `prisma.mediaFile.findFirst()` in `withRetry()` for DB resilience |
| `backend/package.json` | Replaced broken predev script |
| `frontend/src/app/(dashboard)/upload/page.tsx` | Updated guidelines text — "Handwritten documents are supported" instead of "Avoid handwritten", added per-page breakdown mention |

### Phase 44 — URL Rewriting & Question Palette Scroll Fix ✅

**Goal:** Fix all stored image URLs containing hardcoded `localhost:4000` by rewriting them to the current server's host at response time, and make the question palette grid independently scrollable with a fixed height.

**Backend URL Rewriting:**
- **Root cause:** All upload endpoints constructed absolute URLs using `req.protocol://req.get("host")` at upload time. During local development these URLs were `http://localhost:4000/api/files/...` and got stored permanently in the database (blog thumbnails, ad images, user avatars). In production, the frontend tried to fetch from `localhost:4000` — unreachable.
- **Fix:** Upgraded `resolveFileUrl.ts` to accept an optional `req` parameter — rewrites the host portion of any URL to the current server's host (from `req` or `API_BASE_URL` env var). Applied to all response endpoints returning stored file URLs.

**Question Palette Scrolling:**
- **Root cause:** The question grid had no height constraint — with 419 questions in a 5-column grid (~84 rows), the palette overflowed the viewport entirely, pushing the legend off-screen with no scrollbar.
- **Fix:** Wrapped the grid in `max-h-[60vh] overflow-y-auto` — grid scrolls independently while the legend stays visible.

| File | Change |
|------|--------|
| `backend/src/lib/resolveFileUrl.ts` | Accepts `(url, req?)` — rewrites any host to current server's host instead of only replacing localhost |
| `backend/src/routes/blog.ts` | Applied `resolveFileUrl(thumbnailUrl, req)` to all 6 response points (public list, public single, owner list, owner single, create, update) |
| `backend/src/routes/ads.ts` | Renamed `_req` → `req` in GET routes; applied `resolveFileUrl(imageUrl, req)` to all 4 response points (list, active, create, update) |
| `backend/src/routes/owner.ts` | Applied `resolveFileUrl(avatarUrl, req)` to `GET /api/owner/users` response |
| `backend/src/routes/auth.ts` | Applied `resolveFileUrl(avatarUrl, req)` to `GET /api/auth/me` response |
| `frontend/src/components/test/QuestionPalette.tsx` | Wrapped grid div in `max-h-[60vh] overflow-y-auto pr-0.5 -mr-0.5` for independent scrolling with legend visible |

---

### Phase 45 — Favicon Update ✅

**Goal:** Replace SVG/ICO favicon files with a branded PNG favicon for better browser compatibility.

| File | Change |
|------|--------|
| `frontend/public/fav-ai.png` | **NEW** — Branded PNG favicon image |
| `frontend/src/app/layout.tsx` | Updated `icons` config — `icon` and `apple` both point to `/fav-ai.png` |
| `frontend/public/favicon.ico` | Removed — replaced by PNG favicon |
| `frontend/public/favicon.svg` | Removed — replaced by PNG favicon |
| `frontend/public/apple-touch-icon.svg` | Removed — replaced by PNG favicon | |

---

### Phase 46 — AI Quiz Generation & Reliability ✅

**Goal:** Add on-demand AI quiz generation (subject + topic + difficulty → 10 MCQ quiz), improve generation reliability with relaxed content validation, configurable timeouts, and better user feedback during generation.

**AI Quiz Generator:**
| Feature | Detail |
|---------|--------|
| Subject/topic/difficulty form | Frontend `/ai-quiz` page with Input, Dropdown, and MultiStep form with progress stages (8 stages: "Initializing quiz generator...", "Analyzing topic context...", "Generating questions...", "Validating question quality...", "Creating answer keys...", "Formatting output...", "Finalizing quiz...", "Quiz ready!") |
| AI prompt | Strict subject/topic/difficulty adherence instructions, LaTeX math formatting with `$...$` delimiters, SVG diagram embedding via ````svg` code fences |
| Retry loop | 3 attempts with `llama-3.1-8b-instant` (8B) + fallback to `llama-3.3-70b-versatile` (70B) — retries include specific feedback hints (SVG issues, topic relevance, trivial content) |
| 60s total timeout | `Promise.race` wrapping entire generation pipeline — covers retries + 70B fallback; logs subject/topic/difficulty on timeout |
| Content validation | Topic keyword relevance (question text only, relaxed threshold — fails only if ALL 10 questions lack keywords), SVG structural completeness (`viewBox`, `</svg>`, ≥2 text labels, visible shapes), difficulty alignment, non-trivial content check |
| Theme-adaptive SVG | `adaptSvgColors()` adjusts stroke/fill colors for readability in both light and dark themes; `useDarkMode()` hook with `MutationObserver` + media query listener; white background in SVGs for both themes |
| Client-side 35s abort | `AbortController` timeout in both `/ai-quiz/page.tsx` and `QuizModal.tsx` — shows "Quiz generation took too long" when exceeded |
| Long-wait indicator | 15s timer shows "This is taking longer than usual" message during generation |

**Reliability Improvements:**
| Change | Before | After |
|--------|--------|-------|
| Content validation rejected math/code options | Options checked for topic keywords | Options/correctAnswers no longer validated for topic keywords (math expressions, code snippets cannot contain topic words) |
| SVG `font-size` per-element check | Rejected valid SVGs with inherited font-size | Removed — inherited font-size from parent `<svg>`/`<g>` is valid |
| Empty shape attributes check | Rejected `circle` without `r`, `rect` without `w`/`h` | Removed — AI often omits these when defaults suffice |
| `<g>` counted as visible shape | Grouping elements satisfied shape requirement with no real shapes | Removed `<g>` from visible element regex |
| Topic keyword threshold | Failed if >50% of questions lacked keywords | Fails only if ALL 10 questions lack keywords |
| Backend timeout | 25s | 60s (allows full 3×8B + 70B pipeline) |
| Error propagation | Hardcoded generic message `"Failed to generate quiz"` | Real backend error passed through (timeout, validation, AI error) |
| Frontend error guard | `!includes("Failed to generate")` blocked real errors | Removed — always uses actual `err.message` |

**Error UI & User Feedback:**
- **Failed state** in `QuizModal.tsx` — error card with "Try Again" and "Cancel" buttons
- **Error UI with retry button** in `/ai-quiz/page.tsx` — replaces generic toast on failure
- **Real error messages** displayed to user instead of generic "Failed to generate quiz. Please try again."

**Files Changed:**

| File | Change |
|------|--------|
| `backend/src/routes/quiz.ts` | **NEW** — `POST /estimate` (credit cost estimation) + `POST /generate` (quiz generation with credit deduction, progress tracking, Prisma attempt record) |
| `backend/src/services/openai.ts` | Added `generateQuiz()` with retry loop + 70B fallback + 60s timeout; added `validateQuizContent()` (topic, SVG, difficulty, trivial checks); added `validateSvgCompleteness()` (structural SVG validation); added `normalizeQuestions()` (correctAnswer letter→text mapping); updated prompt with subject/topic/difficulty instructions |
| `frontend/src/app/(dashboard)/ai-quiz/page.tsx` | **NEW** — Full AI quiz generation flow with subject/topic/difficulty form, 8-stage progress display, 35s abort, long-wait message, error state with retry |
| `frontend/src/app/(dashboard)/ai-quiz/take/page.tsx` | **NEW** — Take generated AI quiz (full-screen test interface with timer, auto-save, submit) |
| `frontend/src/app/(dashboard)/ai-quiz/thank-you/page.tsx` | **NEW** — Thank-you overlay after quiz submission with score summary and retry |
| `frontend/src/components/exam/QuizModal.tsx` | **NEW** — Modal-based quiz generation with subject/topic fields, info banner, progress stages, failed/retry UI |
| `frontend/src/components/ui/ContentRenderer.tsx` | **NEW** — SVG rendering with `adaptSvgColors()` theme adaptation and `useDarkMode()` hook |
| `frontend/src/components/exam/ExamPageClient.tsx` | **NEW** — Exam attempt client component for AI quizzes |
| `frontend/src/components/exam/ExamContactForm.tsx` | **NEW** — Contact form within exam pages |
| `frontend/src/components/exam/QuizFeedbackCarousel.tsx` | **NEW** — Feedback carousel after quiz completion |

---

## Important Files

| File | Purpose |
|------|---------|
| `frontend/next.config.ts` | CSP (incl. AdSense domains), HSTS, caching, image config, permissions policy |
| `frontend/src/app/page.tsx` | Landing page (13 components, 10 dynamically imported) |
| `frontend/src/components/landing/LightPillar.tsx` | Three.js shader-based light column background |
| `frontend/src/components/landing/HeroSection.tsx` | Hero with LightPillar background + CardSwap animated cards |
| `frontend/src/components/landing/HowItWorks.tsx` | Timeline layout with GlassSurface wrapped step cards |
| `frontend/src/components/ui/CardSwap.tsx` | React Bits CardSwap — GSAP elastic card swap animation |
| `frontend/src/components/ui/GlassSurface.tsx` | React Bits GlassSurface — SVG chromatic glass distortion |
| `frontend/src/app/layout.tsx` | Root layout with metadata, JSON-LD, canonical, fonts |
| `frontend/src/app/error.tsx` | Error boundary with reset button |
| `frontend/src/app/not-found.tsx` | 404 page |
| `frontend/src/app/robots.ts` | Dynamic robots.txt |
| `backend/src/index.ts` | App entry — CORS, helmet, rate limiters, routes |
| `backend/src/config/env.ts` | Centralized environment variable config |
| `backend/src/middleware/validate.ts` | Zod validation schemas + middleware |
| `backend/src/middleware/rateLimiter.ts` | Rate limiter definitions (analyze POST/GET separated) |
| `backend/src/middleware/ownerAuth.ts` | JWT owner auth middleware |
| `backend/prisma/schema.prisma` | Full database schema (17 models, indexed, isMarkedForReview on Answer) |
| `backend/src/routes/contact.ts` | Contact form endpoint |
| `backend/src/routes/owner.ts` | Owner routes including upload delete, bulk delete, download |
| `backend/src/routes/tests.ts` | Test routes (any student can view published tests) |
| `backend/src/routes/upload.ts` | Upload routes incl. individual delete with cascade |
| `frontend/src/app/fouri-root-console/uploads/page.tsx` | Upload manager with bulk delete UI + download |
| `frontend/src/app/contact/contact-form.tsx` | Client component for contact form UI |
| `frontend/src/app/(dashboard)/discover/discover-client.tsx` | Client component for discover tests UI |
| `frontend/src/components/Analytics.tsx` | Firebase Analytics initialization component |
| `backend/src/lib/cache.ts` | In-memory TTL cache for API response caching |
| `backend/src/routes/analyze.ts` | Analyze route — triggers OCR + AI, stores `failureReason` on error |
| `frontend/src/components/ProcessingStatus.tsx` | Displays `failureReason` in styled error layout |
| `backend/src/routes/email.ts` | Email broadcast + template CRUD + AI generate + preview + image upload (12 endpoints) |
| `backend/src/routes/files.ts` | File proxy — fetches from Telegram CDN, resolves MIME from DB, serves with correct Content-Type |
| `backend/src/routes/media.ts` | Media library CRUD — paginated, category-filtered list + upload + delete |
| `backend/src/lib/evaluationQueue.ts` | Serialized FIFO queue for global AI evaluation rate limiting |
| `backend/src/lib/emailVariables.ts` | Per-user variable resolver (`resolveVariables`, `AVAILABLE_VARIABLES`) |
| `backend/src/services/email.ts` | Brevo HTTP API email service — `sendBroadcastEmail()` (batch 10, 600ms delay) + `sendContactEmail()` + `wrapWithBranding()` |
| `backend/src/services/openai.ts` | AI service — `evaluateSubjectiveWithAI()` + `generateEmailContent()` + `callWithRetry()` (target for Groq migration) |
| `frontend/src/app/fouri-root-console/email-broadcast/page.tsx` | Email broadcast compose + preview + campaign history |
| `frontend/src/app/fouri-root-console/email-templates/page.tsx` | Template CRUD + branding + variable picker + media library picker |
| `frontend/src/app/fouri-root-console/media/page.tsx` | Media library with TanStack Query, pagination, search, filter, preview modal |
| `frontend/src/hooks/useAutoSave.ts` | Debounced auto-save with refs (3s after last change), localStorage fallback |
| `frontend/src/hooks/useTestTimer.ts` | Countdown timer + tab switch / blur detection + backend logging |
| `frontend/src/app/(test)/test/[id]/page.tsx` | Test detail page — Start Test (30min) + Edit Time button → custom input → immediate start |
| `frontend/src/components/AdSlot.tsx` | AdSense ad slot with min-h CLS prevention, env-var client ID |
| `frontend/src/app/(dashboard)/resume-tests/page.tsx` | Resume paused tests page — search, sort, pagination, progress bars |
| `frontend/src/app/layout.tsx` | Root layout with AdSense script in `<head>` |
| `frontend/src/components/AdSenseScript.tsx` | Cookie-consent-gated AdSense script injection |
| `frontend/src/components/landing/Navbar.tsx` | Glassmorphism navbar with gradient CTA |
| `frontend/src/components/landing/FeaturesSection.tsx` | 8-feature bento grid |
| `frontend/src/components/landing/StudentBenefits.tsx` | 3 benefit cards + animated counters |
| `frontend/src/components/landing/AIDashboardShowcase.tsx` | 3-panel dashboard mockup |
| `frontend/src/components/landing/AboutSection.tsx` | Founder + mission + vision cards |
| `frontend/src/components/landing/Testimonials.tsx` | Premium carousel with auto-scroll |
| `frontend/src/components/landing/FreeAccess.tsx` | "Always Free" spotlight card |
| `frontend/src/components/landing/FinalCTA.tsx` | Immersive closing CTA |
| `frontend/src/components/landing/FAQSection.tsx` | Enhanced glass accordion |
| `frontend/src/components/landing/Footer.tsx` | Premium dark footer with "Created By Aniket Rajak" |
| `frontend/src/app/(dashboard)/layout.tsx` | Dashboard shell with nav, sidebar ads, header/footer ads |
| `backend/src/services/telegramStorage.ts` | Telegram upload + CDN URL resolution — returns `{ fileId, cdnUrl }` |
| `frontend/src/components/ui/MultiSelect.tsx` | Searchable multi-select dropdown with checkboxes, chips, click-outside close |
| `frontend/src/components/FilterPanel.tsx` | 4-way filter grid (subject, exam, difficulty, sort) used on public test listing |
| `frontend/src/lib/getFileUrl.ts` | URL sanitizer — replaces localhost with production base in stored image URLs |
| `backend/src/lib/resolveFileUrl.ts` | Backend URL sanitizer — rewrites any host to current server's host in stored file URLs |
| `frontend/src/components/test/QuestionPalette.tsx` | Question palette with `max-h-[60vh]` scrollable grid and color legend |
| `frontend/src/components/blog/BlogImage.tsx` | CSP-safe image loader — fetches via blob URL to bypass `img-src` restrictions |
| `frontend/src/components/dashboard/ActiveUploadCard.tsx` | Live polling card showing active analysis uploads |
| `frontend/src/components/dashboard/GreetingSection.tsx` | Animated dashboard greeting with stat counters |
| `frontend/src/components/dashboard/QuickActions.tsx` | 2×2 quick action grid for dashboard |
| `frontend/src/components/credits/CreditCostDisplay.tsx` | 3-column required/available/after credit cost display |
| `frontend/src/components/credits/CreditWarningBanner.tsx` | Credit threshold warning (80%/90%/100%) |
| `frontend/src/components/credits/CreditUsageCard.tsx` | Daily credit usage display card |
| `frontend/src/components/credits/AnalysisModeSelector.tsx` | Full/standard/basic analysis mode picker |
| `frontend/src/components/credits/InsufficientCreditsModal.tsx` | Modal for insufficient credits (donate/switch/tomorrow) |
| `backend/src/services/creditService.ts` | Daily credit auto-reset, estimation, deduction, refund |
| `frontend/src/components/landing/LightPillar.tsx` | Three.js shader-based volumetric light column background |
| `frontend/src/components/landing/LazyLightPillar.tsx` | Lazy-loads LightPillar via IntersectionObserver — renders 3D light effect |

---

## LightPillar — Debug Resolution

**Status:** ✅ Fixed

The Three.js shader-based light column now renders correctly. The fragment shader `tanh()` implementation was updated to a manual `exp()`-based equivalent for better cross-browser GLSL compatibility, and `mix-blend-mode: screen` was replaced with explicit opacity blending to ensure visibility against the dark background.

---

## 🔮 Planned: AI Analytics Dashboard (Phase 45)

Comprehensive analytics dashboard with advanced visualizations, AI usage tracking, and interactive graphs.

### Overview

**Scope**: ~15 files across backend & frontend, 3 new Prisma models, 1 new backend route file, 1 fully rewritten frontend page.

---

### Phase 1 — Database & Backend

#### 1a. Prisma Migration — New Models

Add to `backend/prisma/schema.prisma`:

```prisma
model AiUsage {
  id        String   @id @default(uuid())
  feature   String   // "mock-test", "quiz-gen", "explanation", "analysis", "blog-gen", "email-gen", "subjective-eval"
  tokens    Int?
  userId    String?
  duration  Int?     // response time in ms
  status    String   // "SUCCESS" | "FAILED"
  createdAt DateTime @default(now())

  @@index([feature])
  @@index([createdAt])
  @@index([feature, createdAt])
}

model PageView {
  id        String   @id @default(uuid())
  path      String
  userId    String?
  referrer  String?
  createdAt DateTime @default(now())

  @@index([path])
  @@index([createdAt])
  @@index([path, createdAt])
}
```

Also add `views Int @default(0)` to the `Blog` model.

#### 1b. Backend — AI Usage Tracking Service

Create `backend/src/services/aiTracker.ts`:

- Wraps all OpenAI/Groq calls to log to `AiUsage` table
- Track: feature name, tokens (from API response), status, duration
- Each AI route calls `trackAiUsage(feature, tokens, userId, status, duration)`

#### 1c. Backend — Page View Tracking Middleware

Create `backend/src/middleware/pageViewTracker.ts`:

- Express middleware that logs `path`, `userId` (if auth'd), `referrer` to `PageView` table
- Attach to key routes

#### 1d. Backend — Analytics Route

Create `backend/src/routes/ownerAnalytics.ts` with endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /owner/analytics/summary?period=30d` | Returns everything in one payload |
| `GET /owner/analytics/users?period=30d` | Active/inactive by period (today, 7d, 30d, 1y) |
| `GET /owner/analytics/activity?period=30d` | Daily visitors, concurrent users, daily activities |
| `GET /owner/analytics/pages?period=30d` | Page-level traffic rankings |
| `GET /owner/analytics/blogs` | Blog views/engagement/feedback counts |
| `GET /owner/analytics/quiz?period=30d` | AI quiz generation, attempts, completion rates, avg scores, trends |
| `GET /owner/analytics/ai-usage?period=30d` | AI calls by feature, daily trends, threshold data |

The `/ai-usage` endpoint returns:
- `byFeature: [{ feature, count, totalTokens }]`
- `dailyTrend: [{ date, totalCalls, totalTokens }]`
- `threshold: { limit: 10000, used, percentage, remaining }`

All endpoints use a simple in-memory cache (5 min TTL).

#### 1e. Update Blog Route

- Add `POST /owner/blog/:id/view` — increments `Blog.views`
- Add `GET /owner/blog/stats` — blog engagement data

---

### Phase 2 — Frontend Components

#### 2a. Date Range Selector

Create `frontend/src/components/owner/AnalyticsDateRange.tsx`:

- Segmented control: Today, 7 Days, 30 Days, 1 Year
- Optional custom date picker (From / To)
- Emits a `period` or `{ from, to }` to parent

#### 2b. Reusable Chart Wrapper

Create `frontend/src/components/owner/AnalyticsChart.tsx`:

- Consistent card wrapper with title + icon header
- `ResponsiveContainer` inside
- Loading skeleton state + dark theme styling

#### 2c. Rewrite Analytics Page

**File**: `frontend/src/app/fouri-root-console/analytics/page.tsx`

**Section layout** (in order):

1. **Header** — Title + Period Selector + Cache indicator

2. **Summary Cards Row** — 4 stat cards in `grid sm:grid-cols-2 lg:grid-cols-4`:
   - Total Users / Active / Inactive
   - Total AI Calls (with threshold gauge)
   - Total Quiz Attempts
   - Total Page Views

3. **User Analytics** `grid lg:grid-cols-2`:
   - Active vs Inactive comparison (Stacked BarChart)
   - User growth trend (AreaChart)

4. **Activity & Engagement** `grid lg:grid-cols-2`:
   - Daily Visitors (AreaChart)
   - Concurrent Users / Daily Activities (LineChart)

5. **Page-Level Analytics** `lg:col-span-2`:
   - Top visited pages bar chart

6. **Blog Analytics** `grid lg:grid-cols-2`:
   - Blog views per post (BarChart, horizontal)
   - Positive vs Negative feedback (Stacked BarChart)

7. **AI Quiz Analytics** `grid lg:grid-cols-2`:
   - Quiz generation vs attempts trend (LineChart)
   - Completion rate + avg score (ComposedChart)

8. **AI Usage Analytics with Threshold** `grid lg:grid-cols-2`:
   - AI calls by feature (PieChart or Stacked BarChart)
   - Daily AI usage trend (AreaChart)
   - **Threshold gauge**: Visual indicator showing `used / limit` with red warning when >80%
   - Warning banner if approaching/exceeding free-tier limit

All sections have loading skeleton, empty state, error handling, and responsive grid (single column on mobile).

---

### Files to Create/Modify

| File | Action |
|---|---|
| `backend/prisma/schema.prisma` | Modify — add AiUsage, PageView models + Blog.views |
| `backend/src/services/aiTracker.ts` | Create |
| `backend/src/middleware/pageViewTracker.ts` | Create |
| `backend/src/routes/ownerAnalytics.ts` | Create |
| `backend/src/services/analyticsCache.ts` | Create |
| Backend route files (tests.ts, quiz.ts, etc.) | Modify — add AI tracking calls |
| `frontend/src/components/owner/AnalyticsDateRange.tsx` | Create |
| `frontend/src/components/owner/AnalyticsChart.tsx` | Create |
| `frontend/src/app/fouri-root-console/analytics/page.tsx` | Rewrite |

### Data Flow

```
User selects period (today/7d/30d/1y)
  → Frontend checks cache (60s TTL)
  → If stale, calls GET /owner/analytics/summary?period=30d
  → Backend checks server cache (5min TTL)
  → If stale, runs aggregated Prisma queries
  → Returns full payload
  → Frontend renders sections with Recharts
  → Auto-refreshes every 60s
```