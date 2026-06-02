# Blog Management System — Implementation Plan

## Overview
Full blog system: admin CRUD (manual + AI generation), thumbnail management (upload/URL), scheduling, public blog pages, contact form integration, and navigation updates.

---

## 1. Backend — Prisma Schema (`backend/prisma/schema.prisma`)

### Add after `EmailCampaign` model (before closing `}`):

```prisma
model BlogCategory {
  id        String   @id @default(uuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())

  blogs Blog[]

  @@index([slug])
}

model BlogTag {
  id        String   @id @default(uuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())

  blogs BlogTagOnBlog[]

  @@index([slug])
}

model BlogTagOnBlog {
  blogId String
  tagId  String

  blog Blog    @relation(fields: [blogId], references: [id], onDelete: Cascade)
  tag  BlogTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([blogId, tagId])
}

model Blog {
  id           String       @id @default(uuid())
  title        String
  slug         String       @unique
  excerpt      String?
  content      String
  thumbnailUrl String?
  authorName   String?
  status       String       @default("DRAFT") // DRAFT | SCHEDULED | PUBLISHED
  scheduledAt  DateTime?
  publishedAt  DateTime?
  categoryId   String?
  category     BlogCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  tags         BlogTagOnBlog[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@index([status, publishedAt])
  @@index([slug])
  @@index([categoryId])
  @@index([createdAt])
}
```

### Run:
```bash
cd backend && npx prisma migrate dev --name add_blog_models
```

---

## 2. Backend — Zod Validation (`backend/src/middleware/validate.ts`)

Add to `schemas` object:

```typescript
blogCreate: z.object({
  title: z.string().min(1, "Title is required").max(500),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(1000).optional(),
  thumbnailUrl: z.string().max(2000).optional(),
  authorName: z.string().max(200).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
}),

blogUpdate: z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(1000).optional().nullable(),
  thumbnailUrl: z.string().max(2000).optional().nullable(),
  authorName: z.string().max(200).optional().nullable(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
}),

slugGenerate: z.object({
  title: z.string().min(1, "Title is required"),
}),
```

---

## 3. Backend — OpenAI Service (`backend/src/services/openai.ts`)

Add `generateBlogContent()`:

```typescript
export interface GeneratedBlog {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  category: string;
}

export async function generateBlogContent(
  instructions: string
): Promise<GeneratedBlog> {
  const prompt = `You are an expert blog writer for a SaaS platform called FOURI.IN — an AI-powered mock test platform for students.

Instructions: "${instructions}"

Respond with valid JSON only — no markdown, no code fences:
{
  "title": "SEO-friendly blog title (max 12 words)",
  "excerpt": "Compelling 2-3 sentence summary (max 50 words)",
  "content": "Full HTML blog post content (see formatting rules below)",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "One of: Study Tips, Exam Preparation, Technology, Education, Product Updates"
}

FORMATTING RULES FOR content:
- Use inline CSS on all elements
- Main heading: <h1 style="font-size: 28px; font-weight: 700; color: #f5f5f7; margin: 0 0 20px 0;">
- Subheadings: <h2 style="font-size: 22px; font-weight: 600; color: #f5f5f7; margin: 32px 0 16px 0;">
- Sub-subheadings: <h3 style="font-size: 18px; font-weight: 600; color: #e0e0e0; margin: 24px 0 12px 0;">
- Paragraphs: <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.8; color: #c0c0c0;">
- Strong/emphasis: <strong> or <em> inside <p> tags
- Bullet lists: <ul style="margin: 0 0 16px 0; padding-left: 24px;"> with <li style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.6; color: #c0c0c0;">
- Numbered lists: <ol style="margin: 0 0 16px 0; padding-left: 24px;"> with <li> similar
- Blockquotes: <blockquote style="border-left: 3px solid #3D81E3; margin: 24px 0; padding: 16px 24px; background: rgba(61,129,227,0.05); border-radius: 0 8px 8px 0;"><p style="margin: 0; font-style: italic; color: #d0d0d0;">
- Code inline: <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 4px; font-size: 14px;">
- Links: <a href="{{appUrl}}" style="color: #3D81E3; text-decoration: underline;">
- Images: <img src="{{imageUrl}}" alt="description" style="max-width: 100%; border-radius: 8px; margin: 24px 0;">
- Do NOT include <html>, <head>, <body>, or <!DOCTYPE>
- Wrap everything in <article style="max-width: 800px; margin: 0 auto;">
- Keep total under 1500 words
- Make it engaging, educational, and valuable for students preparing for competitive exams (JEE, NEET, etc.)
- Include practical tips and actionable advice`;

  const response = await callWithRetry(() =>
    client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during blog generation");

  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  const parsed = JSON.parse(cleaned);

  return {
    title: parsed.title || "",
    excerpt: parsed.excerpt || "",
    content: parsed.content || "",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    category: parsed.category || "Education",
  };
}
```

---

## 4. Backend — Blog Route (`backend/src/routes/blog.ts`)

Full file with these endpoints:

### Public (no auth):
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/blog` | Published/scheduled blogs (limit 3 for homepage, paginated otherwise, filterable by category/slug/search) |
| `GET` | `/api/blog/:slug` | Single published blog by slug |
| `GET` | `/api/blog/categories` | All categories |
| `GET` | `/api/blog/tags` | All tags |

### Owner (ownerAuth):
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/owner/blog` | List ALL blogs (any status) with pagination, status/category/search filters |
| `GET` | `/api/owner/blog/:id` | Single blog by ID |
| `POST` | `/api/owner/blog` | Create blog (auto-generates slug, upserts tags, if PUBLISHED sets publishedAt) |
| `PUT` | `/api/owner/blog/:id` | Update blog (regenerates slug if title changes, updates tags, if PUBLISHED sets publishedAt) |
| `DELETE` | `/api/owner/blog/:id` | Delete blog |
| `POST` | `/api/owner/blog/generate-ai` | AI generate blog |
| `POST` | `/api/owner/blog/upload-thumbnail` | Upload → Telegram → MediaFile → return URL |
| `POST` | `/api/owner/blog/categories` | Create category |
| `PUT` | `/api/owner/blog/categories/:id` | Update category |
| `DELETE` | `/api/owner/blog/categories/:id` | Delete category |
| `POST` | `/api/owner/blog/tags` | Create tag |
| `DELETE` | `/api/owner/blog/tags/:id` | Delete tag |

### Slug generation helper:
```typescript
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 200);
}
```

### Blog route outline (`backend/src/routes/blog.ts`):
```typescript
import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { validate, schemas } from "../middleware/validate.js";
import { ownerAuth } from "../middleware/ownerAuth.js";
import { uploadToTelegram } from "../services/telegramStorage.js";
import { generateBlogContent } from "../services/openai.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();
const ownerRouter = Router();

// --- PUBLIC ROUTES ---
// GET /api/blog — List published blogs
// GET /api/blog/:slug — Single blog by slug
// GET /api/blog/categories — All categories
// GET /api/blog/tags — All tags

// --- OWNER ROUTES ---
// GET /api/owner/blog — List all blogs
// GET /api/owner/blog/:id — Single blog by ID
// POST /api/owner/blog — Create blog
// PUT /api/owner/blog/:id — Update blog
// DELETE /api/owner/blog/:id — Delete blog
// POST /api/owner/blog/generate-ai — AI generate
// POST /api/owner/blog/upload-thumbnail — Upload thumbnail
// POST /api/owner/blog/categories — Create category
// PUT /api/owner/blog/categories/:id — Update category
// DELETE /api/owner/blog/categories/:id — Delete category
// POST /api/owner/blog/tags — Create tag
// DELETE /api/owner/blog/tags/:id — Delete tag

// Helper: include tags in blog response
const blogInclude = {
  category: true,
  tags: { include: { tag: true } },
};

export { router as blogRoutes, ownerRouter as ownerBlogRoutes };
```

---

## 5. Backend — Index Registration (`backend/src/index.ts`)

Add after media routes:

```typescript
import { blogRoutes, ownerBlogRoutes } from "./routes/blog.js";
app.use("/api/blog", standardLimiter, blogRoutes);
app.use("/api/owner/blog", ownerLimiter, ownerAuth, ownerBlogRoutes);
```

---

## 6. Frontend — Admin Pages

### 6a. Nav item — `fouri-root-console/layout.tsx`

Add to `navItems` array (after Media Library):
```typescript
{ href: "/fouri-root-console/blog", label: "Blog", icon: FileText },
```
Import `FileText` from `lucide-react` (already imported).

### 6b. `fouri-root-console/blog/page.tsx` — Blog List
- TanStack Query to fetch `/owner/blog` with pagination
- Table/grid with columns: thumbnail, title, status badge, category, author, date, actions
- Status badges: DRAFT (gray), SCHEDULED (yellow/amber), PUBLISHED (green)
- Search by title, filter by status/category
- Pagination component
- Actions: Edit (link to editor), Delete (confirm modal)
- "New Blog" button → links to `/fouri-root-console/blog/editor`
- Skeleton loading state
- Follows pattern of `media/page.tsx`

### 6c. `fouri-root-console/blog/editor/page.tsx` — Create/Edit Blog
- Determines edit vs create from search params or route
- Form fields:
  - **Title** — text input
  - **Excerpt** — textarea
  - **Content** — large textarea (HTML)
  - **Category** — dropdown (fetches categories)
  - **Tags** — multi-select / tag input
  - **Author Name** — text input
  - **Status** — dropdown: DRAFT / SCHEDULED / PUBLISHED
  - **Scheduled At** — datetime-local input (shown only when status=SCHEDULED)
- **"Generate with AI" button:**
  - Opens inline prompt input + loading state
  - Calls `POST /owner/blog/generate-ai`
  - Fills title, excerpt, content, tags fields on success
  - Uses same pattern as email-broadcast AI generation
- **Thumbnail section:**
  - `span` with guidance text: "Recommended Thumbnail Specifications — Size: 1200 × 630 px | Format: JPG, JPEG, PNG, or WebP | Maximum Size: 2 MB | Aspect Ratio: 1.91:1"
  - Two tabs: "Upload from Device" | "Image URL Input" (same toggle pattern as email templates branding)
  - Upload mode: file input + upload button → calls `POST /owner/blog/upload-thumbnail` (multer → Telegram → MediaFile)
  - URL mode: text input for image URL
  - Live preview via `fetch()` blob URL pattern (same as email templates)
  - "Select from Media Library" button → opens media picker modal (reuse from email-templates)
- **Save** button → POST/PUT to `/owner/blog`
- Loading states for AI generation and image upload

### 6d. `fouri-root-console/blog/categories/page.tsx` — Category Manager
- Simple list of categories with name + slug
- Create modal: name input → auto-generates slug
- Edit: inline or modal
- Delete: confirmation (only if no blogs attached)
- Follows minimal pattern, could be a sub-page

### 6e. `fouri-root-console/blog/tags/page.tsx` — Tag Manager
- Simple list of tags
- Inline create: input + add button
- Delete: confirmation
- Follows minimal pattern

---

## 7. Frontend — Public Pages

### 7a. `app/blog/page.tsx` — Blog Listing
- Server component with `generateMetadata` for SEO
- Client component for blog cards with search/filter
- Fetches from `GET /api/blog` with pagination
- Card grid: 1 col mobile, 2 col tablet, 3 col desktop
- Each card: thumbnail, title, excerpt, category badge, date, author
- Search input, category filter dropdown
- Pagination at bottom
- Empty state

### 7b. `app/blog/[slug]/page.tsx` — Single Blog Post
- Dynamic metadata via `generateMetadata({ params })` — fetches blog by slug, sets title, description, OpenGraph with thumbnail
- Hero section with title, author, date, category, tags, thumbnail
- Full HTML content rendered with `dangerouslySetInnerHTML`
- Share links
- **BlogContactForm at bottom**:
  - Name, Email, Subject (pre-filled: "Regarding: {blog title}"), Message
  - Posts to `POST /api/contact` (existing endpoint)
  - Success/error via sonner `toast`
  - Uses existing SMTP → sends to office@fouri.in
- JSON-LD `BlogPosting` structured data
- Loading state, not-found state

---

## 8. Frontend — Homepage Blog Section

### `components/BlogSection.tsx` — Latest Blogs
- Client component that fetches `GET /api/blog?limit=3`
- Displays 3 blog cards matching landing page dark aesthetic
- "View All Blogs" button → links to `/blog`
- Skeleton loading state
- Import in `app/page.tsx`:
```typescript
const BlogSection = dynamic(() => import("@/components/BlogSection"), { ssr: true });
```
- Place before `<Footer />` in the component tree

---

## 9. Navigation Updates

### `Navbar.tsx` — Add "Blog" link
```typescript
const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "/blog", label: "Blog" },     // ADD
  { href: "#faq", label: "FAQ" },
];
```

### `Footer.tsx` — Add "Blog" link
Add to `footerLinks.company`:
```typescript
{ label: "Blog", href: "/blog" },
```

---

## 10. Key Components

### `components/BlogCard.tsx`
```typescript
interface BlogCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  category: { name: string; slug: string } | null;
  authorName: string | null;
  publishedAt: string;
}
```
- Card with thumbnail, title, excerpt, category badge, date, author
- Links to `/blog/${slug}`
- Dark theme styled

### `components/BlogContactForm.tsx`
- Reusable form component for blog pages
- Fields: name, email, subject (pre-filled), message
- Posts to `POST /api/contact`
- Toast notifications via sonner
- Follows pattern from `contact-form.tsx`

---

## 11. Execution Order

1. Prisma schema + migration
2. Zod validation schemas
3. OpenAI service: `generateBlogContent`
4. Blog route file
5. Index.ts registration
6. Admin blog list page + nav item
7. Admin blog editor page
8. Admin category page
9. Admin tag page
10. Public blog listing page
11. Public single blog page + contact form
12. BlogSection component + homepage integration
13. Navbar + Footer updates
14. Verify build (both frontend + backend)

---

## 12. Verification Checklist

- [ ] `npx prisma migrate dev` succeeds
- [ ] Backend `npm run dev` starts without errors
- [ ] Frontend `npm run dev` starts without errors
- [ ] Can create blog via admin panel
- [ ] AI generation fills form fields
- [ ] Thumbnail upload works (Telegram + MediaFile)
- [ ] Thumbnail URL input shows preview
- [ ] Scheduling: blog only visible after scheduled time
- [ ] `/blog` page shows published blogs
- [ ] `/blog/[slug]` shows full blog with metadata
- [ ] Contact form on blog page sends email
- [ ] Navbar + Footer show Blog link
- [ ] Mobile responsive
- [ ] 36 routes (existing) + new blog routes = no build errors
