# Google AdSense Optimization & Resume Test Dashboard — Plan

---

## Part 1: AdSense-Friendly UI & UX

### Current State
- `AdSlot` component exists at `components/AdSlot.tsx` but has a placeholder `ca-pub-xxxxxxxxxxxxxxxx` and is **not imported anywhere**
- Custom ad system exists in the dashboard layout (fetches from `/ads/active` API) with a right sidebar (`hidden xl:block w-72`)
- No AdSense script is loaded on any page
- Tailwind v4 (no config file), using `@theme` in CSS

### Changes Required

#### 1a. Root Layout — Add AdSense Script
**File:** `frontend/src/app/layout.tsx`

Add the AdSense script to `<head>`:
```tsx
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx"
  crossOrigin="anonymous"
/>
```
The client ID should come from a `.env` variable: `NEXT_PUBLIC_ADSENSE_CLIENT`.

#### 1b. Update AdSlot Component
**File:** `frontend/src/components/AdSlot.tsx`

- Replace hardcoded `data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"` with `process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-xxxxxxxxxxxxxxxx"`
- Add `min-h` variants based on format:
  - `"horizontal"` → `min-h-[90px]`
  - `"rectangle"` → `min-h-[250px]`
  - `"vertical"` → `min-h-[600px]`
  - `"auto"` → `min-h-[90px]`
- Rename the wrapper container class for clarity

#### 1c. Dashboard Layout — Ad Placements
**File:** `frontend/src/app/(dashboard)/layout.tsx`

1. **Header Banner Ad**: Below the top navbar, before `<main>`:
   ```tsx
   <div className="hidden lg:block bg-zinc-50 border-b border-zinc-200">
     <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
       <AdSlot slot="header-banner" format="horizontal" className="mx-auto max-w-[728px]" />
     </div>
   </div>
   ```

2. **Sidebar Ad**: In the ads sidebar (`hidden xl:block w-72`), below the custom ads:
   ```tsx
   <AdSlot slot="sidebar" format="vertical" className="min-h-[250px]" />
   ```

3. The existing custom ad system (`/ads/active` API) remains for first-party ads; AdSense supplements it.

#### 1d. Content Pages — In-Content Ad Blocks

**File:** `frontend/src/app/(dashboard)/dashboard/page.tsx`
- Add an in-content AdSlot between the quick-action cards and the paused tests section

**File:** `frontend/src/app/(dashboard)/tests/page.tsx`
- Add an in-content AdSlot between test cards (after every 5th card, or at the bottom before the delete modal)

**File:** `frontend/src/app/(dashboard)/results/page.tsx`  
- Add an in-content AdSlot inside the results list (after the header, before the list)

**File:** `frontend/src/app/(dashboard)/discover/discover-client.tsx`
- Add an in-content AdSlot between featured/trending section and the search results

All in-content AdSlots should:
- Use `format="auto"` or `format="horizontal"`
- Have `min-h-[90px]` for CLS prevention
- Be wrapped with `my-6` for whitespace
- Be hidden on mobile if they cause layout issues (`hidden sm:block`)

#### 1e. Footer Ad Section
**File:** `frontend/src/app/(dashboard)/layout.tsx`

Inside the `<main>` area, before the closing `</main>`:
```tsx
<div className="border-t border-zinc-200 pt-6 mt-8">
  <AdSlot slot="footer" format="horizontal" className="mx-auto max-w-[728px]" />
</div>
```

---

## Part 2: Dedicated Resume Tests Page

### 2a. Backend — Update GET /attempts to Include More Data

**File:** `backend/src/routes/attempts.ts`

Update the `GET /` route handler to include `subject` in mockTest select and answered count:

```typescript
const attempts = await prisma.testAttempt.findMany({
  where,
  include: {
    mockTest: {
      select: { 
        id: true, title: true, subject: true, 
        totalQuestions: true, duration: true 
      },
    },
    answers: {
      where: { selectedOption: { not: null } },
      select: { id: true },
    },
  },
  orderBy: { startedAt: "desc" },
});
```

Now each attempt in the list has `answers.length` = answered count and `mockTest.subject`.

### 2b. Backend — Add DELETE /attempts/:id

**File:** `backend/src/routes/attempts.ts`

Add a new route handler:
```typescript
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const attemptId = req.params.id;
    const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.userId !== req.user!.uid) {
      return res.status(404).json({ error: "Attempt not found" });
    }
    await prisma.testAttempt.delete({ where: { id: attemptId } });
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete attempt" });
  }
});
```

### 2c. New Route — Resume Tests Page

**Create file:** `frontend/src/app/(dashboard)/resume-tests/page.tsx`

Full client component with:

**State:**
- `pausedAttempts: PausedAttempt[]` — fetched from API
- `loading`, `searchQuery`, `sortOrder` ("newest"/"oldest")
- `page`, `totalPages`, `perPage` (12 items per page)
- `confirmDeleteId` for delete confirmation modal
- `deleting` boolean

**Interfaces:**
```typescript
interface PausedAttempt {
  id: string;
  remainingTime: number | null;
  currentQuestionIndex: number | null;
  startedAt: string;
  mockTest: {
    id: string;
    title: string;
    subject: string | null;
    totalQuestions: number;
    duration: number;
  };
  answers: { id: string }[];
}
```

**Features:**
1. **Data Fetching**: `useEffect` on mount → `api.get("/attempts?status=PAUSED")`
2. **Search**: Filter `pausedAttempts` by `mockTest.title` or `mockTest.subject` matching `searchQuery` (case-insensitive)
3. **Sort**: Sort by `startedAt` — newest first (default), toggleable to oldest
4. **Pagination**: Client-side slice `filtered.slice(start, end)` where `start = (page - 1) * perPage`
5. **Delete**: `api.delete(\`/attempts/${id}\`)` with confirmation modal
6. **Resume**: Link to `/test/${mockTest.id}/attempt?resume=${id}&resumeRemaining=${remainingTime ?? duration}`

**Card Design (per paused test):**
```
┌──────────────────────────────────────────┐
│ Test Name                    [Delete]    │
│ Subject Category                         │
│ ████████████████░░░░░░░░░░ 60%           │ (progress bar)
│ Total: 50 | Answered: 30 | Left: 20      │
│ ⏱ 25:00 left | Paused: 12 May 2026     │
│                           [▶ Resume]     │
└──────────────────────────────────────────┘
```

**Layout:**
- Search bar at top with sort toggle
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Pagination at bottom (same pattern as discover page)
- Empty state: illustration + "No paused tests" message + link to discover tests

**Progress Bar Component (inline):**
```tsx
const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
<div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
</div>
```

**Format time helper:** Use `formatTime` from `lib/utils.ts` for MM:SS display, and format `startedAt` using `formatDate`.

### 2d. Update Dashboard Navigation

**File:** `frontend/src/app/(dashboard)/layout.tsx`

Add to `navItems`:
```typescript
import { RotateCcw } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume-tests", label: "Resume Tests", icon: RotateCcw },   // NEW
  { href: "/upload", label: "Upload Paper", icon: Upload },
  { href: "/discover", label: "Discover", icon: Search },
  { href: "/tests", label: "My Tests", icon: FileText },
  { href: "/results", label: "Results", icon: BarChart3 },
];
```

### 2e. Update Dashboard Page

**File:** `frontend/src/app/(dashboard)/dashboard/page.tsx`

Replace the inline paused tests list with a summary card that links to the new page:

```tsx
{pausedAttempts.length > 0 && (
  <Card>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
          <RotateCcw size={20} />
        </div>
        <div>
          <p className="font-semibold text-zinc-900">Paused Tests</p>
          <p className="text-sm text-zinc-500">{pausedAttempts.length} test(s) paused</p>
        </div>
      </div>
      <Link
        href="/resume-tests"
        className="h-9 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 inline-flex items-center"
      >
        View All
      </Link>
    </div>
  </Card>
)}
```

This keeps the dashboard clean while directing users to the dedicated page for full management.

---

## Files Changed Summary

| # | File | Change Type |
|---|------|-------------|
| 1 | `frontend/src/app/layout.tsx` | Edit — Add AdSense script to `<head>` |
| 2 | `frontend/src/components/AdSlot.tsx` | Edit — Dynamic client ID from env, min-height variants |
| 3 | `frontend/src/app/(dashboard)/layout.tsx` | Edit — Header banner ad, footer ad, sidebar ad slot, add `RotateCcw` to imports, add Resume Tests nav item |
| 4 | `frontend/src/app/(dashboard)/dashboard/page.tsx` | Edit — Replace inline paused tests with summary card + "View All" link |
| 5 | `frontend/src/app/(dashboard)/tests/page.tsx` | Edit — Add in-content AdSlot |
| 6 | `frontend/src/app/(dashboard)/results/page.tsx` | Edit — Add in-content AdSlot |
| 7 | `frontend/src/app/(dashboard)/discover/discover-client.tsx` | Edit — Add in-content AdSlot |
| 8 | `backend/src/routes/attempts.ts` | Edit — Include `subject` + answer count in GET /, add DELETE /:id |
| 9 | `frontend/src/app/(dashboard)/resume-tests/page.tsx` | **NEW** — Dedicated resume tests page with search, pagination, progress bars, delete |

**Total: 9 files (8 edits + 1 new)**
