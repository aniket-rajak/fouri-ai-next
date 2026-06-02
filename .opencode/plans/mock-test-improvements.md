# Mock Test System Improvements - Implementation Plan

## Gap Analysis Summary

| Feature | Status | Work Needed |
|---------|--------|-------------|
| Tab Switching Detection | Mostly done (backend + hook + UI) | Fix warning text |
| Pause & Resume | Mostly done (DB schema, routes, UI, dashboard) | Restore `markedIds` on resume |
| Fix Duration Display | Backend correct; frontend ignores it | Use `test.duration` in instructions page |
| Full Responsiveness | All pages already responsive | Minor results list tweak |

---

## Step 1 — Fix Tab Switch Warning Text

**File:** `frontend/src/app/(test)/test/[id]/attempt/page.tsx`

- Line 383: Change `"auto-submit"` → `"automatically submit"`
- The warning banner reads: `"Do not switch tabs. A second switch will auto-submit the test."`
- Should read: `"Do not switch tabs. A second switch will automatically submit the test."`

## Step 2 — Restore markedIds During Resume

**File:** `frontend/src/app/(test)/test/[id]/attempt/page.tsx`

In the resume block (lines 67-117), after restoring answers from the server:

```typescript
// Restore markedIds from localStorage
const stored = localStorage.getItem(`fouri_attempt_${att.id}`);
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    if (parsed.markedIds?.length) {
      setMarkedIds(new Set(parsed.markedIds));
    }
  } catch { /* ignore corrupt data */ }
}
```

This mirrors the same logic already present in the "normal flow" (non-resume) at lines 132-145.

## Step 3 — Fix Default Test Duration on Instructions Page

**File:** `frontend/src/app/(test)/test/[id]/page.tsx`

Changes:
1. Delete `const DEFAULT_MINUTES = 30;` (line 10)
2. Replace `startWithDefault` to use `test.duration`:
   ```typescript
   const startWithDefault = () => {
     const mins = Math.floor(test!.duration / 60);
     router.push(`/test/${test!.id}/attempt`);
   };
   ```
   Note: No `?duration=` param needed — the attempt page already falls back to `test?.duration` when no param is provided (line 249)
3. Update button text: `Start Test (${Math.floor(test.duration / 60)} Minutes)`
4. Update `startEditing` to pre-fill with actual duration:
   ```typescript
   const startEditing = () => {
     setEditValue(String(Math.floor(test!.duration / 60)));
     setEditing(true);
   };
   ```

## Step 4 — Results List Responsiveness

**File:** `frontend/src/app/(dashboard)/results/page.tsx`

- Line 61: Change `className="flex items-center justify-between"` to `className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"`
- This prevents score and accuracy from being cramped on very small screens
