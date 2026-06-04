# FOURI.IN — AI-Powered Mock Test Platform

An AI-driven education platform where students upload question papers, AI analyzes them, generates mock tests automatically, and provides detailed performance analytics.

**Production URL:** https://www.fouri.in  
**Last Updated:** 2026-06-04 (Phase 34 — ✅ Completed)

---

## Quick Snapshot

| Dimension | Status |
|-----------|--------|
| Frontend | Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, Framer Motion, TanStack Query, Three.js, GSAP |
| Backend | Node.js, Express, TypeScript, JWT, Helmet, express-rate-limit, Zod |
| Database | PostgreSQL (Neon via Prisma ORM) — 17 models, pooled, indexed |
| Auth | Firebase Authentication (Google + Email/Password) + Firebase Admin SDK |
| AI | OpenRouter (GPT-4o-mini, 65K tokens, **paid**) — **Planned:** Groq (free, Llama 3 70B), Tesseract.js OCR |
| AI Email Gen | GPT-4o-mini — generates branded, responsive HTML emails with CTA buttons (**Planned:** Groq) |
| Storage | Telegram Bot API (channels as file backend) |
| Email (SMTP) | Brevo HTTP API (free 300 emails/day, HTTPS) — replaces Hostinger SMTP (blocked on Render free tier) |
| Email Templates | DB-backed templates with branding images, per-user variable personalization |
| Media Library | File proxy with DB-based MIME resolution, paginated, TanStack Query caching |
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
| **TestAttempt** | userId, mockTestId, score, accuracy, status | User's attempt |
| **Answer** | testAttemptId, questionId, selectedOption, isCorrect | Individual answer |
| **Explanation** | questionId, shortExplanation, detailedExplanation | AI explanations |
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
| PUT | `/api/attempts/:id/save` | Save answers during test |
| POST | `/api/attempts/:id/submit` | Submit completed test (subjective scoring with semantic matching) |
| POST | `/api/attempts/:id/re-evaluate` | Re-evaluate subjective answers for existing attempts |
| POST | `/api/attempts/:id/suspicious-activity` | Log tab switch / blur events |
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
| Trust proxy | `app.set("trust proxy", 1)` — ensures Railway reverse-proxy headers are trusted for URL generation |

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

### What Is Not Finished
- Google Maps API key — embedded map uses placeholder key, needs real key for production
- Re-running AI analysis on existing tests to populate `correctAnswer` for subjective questions
- ~~Groq migration (Phase 34)~~ ✅ — AI analysis migrated from OpenRouter (paid) to Groq (free, Llama 3 70B) on 2026-06-04

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
| **OCR** (Tesseract.js) | Unlimited | Completely free, no API costs |
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
| Tesseract.js | No external API needed | Runs locally, no costs, no rate limits |
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
GitHub Actions CI/CD (4 workflows), Docker multi-stage build, Railway config with health check, Vercel config, Sentry error tracking, production env files, DEPLOY.md.

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

### Phase 23 — Railway + Neon Hardening
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
| `backend/prisma/schema.prisma` | Full database schema (17 models, indexes) |
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
| `backend/src/lib/resolveFileUrl.ts` | Backend URL sanitizer — replaces localhost with production base in stored template URLs |
| `frontend/src/components/blog/BlogImage.tsx` | CSP-safe image loader — fetches via blob URL to bypass `img-src` restrictions |