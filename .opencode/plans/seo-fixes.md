# SEO Fix Implementation Plan

## Overview
Complete technical SEO fixes for fouri.in (Next.js 16 App Router)

## Affected URLs from Screaming Frog Audit
- 5 canonicalized URLs → all subpages canonically pointed to homepage
- 5 non-indexable canonical targets → same root cause
- 2 internal redirects → trailing slash inconsistency
- 2 blocked by robots.txt → discover and other public pages
- 1 noindex + 1 nofollow → /discover page
- 2 pages without internal outlinks → blog listing
- 1 HTTP URL → needs further investigation

## Files to Modify

### 1. `frontend/src/app/layout.tsx` — Remove global canonical
- **Action:** Delete lines 74-76
- **Before:**
```tsx
  alternates: {
    canonical: "https://fouri.in",
  },
```
- **After:** Remove those 3 lines entirely.

### 2. `frontend/src/app/about/page.tsx` — Add self-referencing canonical
- **Before:**
```tsx
export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about FOURI.IN...",
};
```
- **After:**
```tsx
export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about FOURI.IN...",
  alternates: {
    canonical: "https://fouri.in/about",
  },
};
```

### 3. `frontend/src/app/blog/page.tsx` — Add canonical + SSR links
- **Before:**
```tsx
export const metadata: Metadata = {
  title: "Blog",
  description: "Read the latest blogs...",
  openGraph: {
    title: "Blog | FOURI.IN",
    description: "Read the latest blogs...",
    type: "website",
  },
};
```
- **After:**
```tsx
export const metadata: Metadata = {
  title: "Blog",
  description: "Read the latest blogs...",
  openGraph: {
    title: "Blog | FOURI.IN",
    description: "Read the latest blogs...",
    type: "website",
  },
  alternates: {
    canonical: "https://fouri.in/blog",
  },
};
```

Also add inside the `<main>` JSX, before or after `<BlogListingClient />`:
```tsx
{/* SSR-only internal links for SEO */}
<nav className="sr-only" aria-hidden="true">
  <Link href="/">Home</Link>
  <Link href="/about">About</Link>
  <Link href="/discover">Discover Tests</Link>
  <Link href="/faq">FAQ</Link>
  <Link href="/contact">Contact</Link>
</nav>
<div className="hidden" aria-hidden="true">
  <Link href="/blog/10-proven-study-techniques-to-ace-competitive-exams">10 Proven Study Techniques to Ace Competitive Exams</Link>
  <Link href="/blog/how-ai-powered-mock-tests-can-improve-your-score-by-20">How AI-Powered Mock Tests Can Improve Your Score</Link>
  <Link href="/blog/mastering-time-management-a-guide-for-jee-neet-aspirants">Mastering Time Management for JEE & NEET</Link>
  <Link href="/blog/the-ultimate-guide-to-effective-revision-techniques">Ultimate Guide to Effective Revision Techniques</Link>
  <Link href="/blog/how-to-analyze-mock-test-results-and-improve-your-score">How to Analyze Mock Test Results</Link>
</div>
```

### 4. `frontend/src/app/faq/page.tsx` — Add self-referencing canonical
- **Before:**
```tsx
export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Find answers to commonly asked questions...",
};
```
- **After:**
```tsx
export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Find answers to commonly asked questions...",
  alternates: {
    canonical: "https://fouri.in/faq",
  },
};
```

### 5. `frontend/src/app/contact/page.tsx` — Add self-referencing canonical
- **Before:**
```tsx
export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with FOURI.IN...",
  openGraph: {
    title: "Contact FOURI.IN",
    description: "Get in touch with the FOURI.IN team...",
  },
};
```
- **After:**
```tsx
export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with FOURI.IN...",
  openGraph: {
    title: "Contact FOURI.IN",
    description: "Get in touch with the FOURI.IN team...",
  },
  alternates: {
    canonical: "https://fouri.in/contact",
  },
};
```

### 6. `frontend/src/app/privacy/page.tsx` — Add self-referencing canonical
- **Before:**
```tsx
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "FOURI.IN Privacy Policy...",
};
```
- **After:**
```tsx
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "FOURI.IN Privacy Policy...",
  alternates: {
    canonical: "https://fouri.in/privacy",
  },
};
```

### 7. `frontend/src/app/terms/page.tsx` — Add self-referencing canonical
- **Before:**
```tsx
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "FOURI.IN Terms of Service...",
};
```
- **After:**
```tsx
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "FOURI.IN Terms of Service...",
  alternates: {
    canonical: "https://fouri.in/terms",
  },
};
```

### 8. `frontend/src/app/disclaimer/page.tsx` — Add self-referencing canonical
- **Before:**
```tsx
export const metadata: Metadata = {
  title: "Disclaimer",
  description: "FOURI.IN Disclaimer...",
};
```
- **After:**
```tsx
export const metadata: Metadata = {
  title: "Disclaimer",
  description: "FOURI.IN Disclaimer...",
  alternates: {
    canonical: "https://fouri.in/disclaimer",
  },
};
```

### 9. `frontend/src/app/blog/[slug]/page.tsx` — Add dynamic canonical + OG URL
- **Before (lines 27-44 in generateMetadata):**
```tsx
return {
  title: blog.title,
  description: blog.excerpt || `Read ${blog.title} on FOURI.IN`,
  openGraph: {
    title: blog.title,
    description: blog.excerpt || "",
    type: "article",
    publishedTime: blog.publishedAt,
    authors: blog.authorName ? [blog.authorName] : undefined,
    images: blog.thumbnailUrl ? [{ url: blog.thumbnailUrl }] : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: blog.title,
    description: blog.excerpt || "",
    images: blog.thumbnailUrl ? [blog.thumbnailUrl] : undefined,
  },
};
```
- **After:**
```tsx
return {
  title: blog.title,
  description: blog.excerpt || `Read ${blog.title} on FOURI.IN`,
  alternates: {
    canonical: `https://fouri.in/blog/${slug}`,
  },
  openGraph: {
    title: blog.title,
    description: blog.excerpt || "",
    type: "article",
    publishedTime: blog.publishedAt,
    authors: blog.authorName ? [blog.authorName] : undefined,
    images: blog.thumbnailUrl ? [{ url: blog.thumbnailUrl }] : undefined,
    url: `https://fouri.in/blog/${slug}`,
  },
  twitter: {
    card: "summary_large_image",
    title: blog.title,
    description: blog.excerpt || "",
    images: blog.thumbnailUrl ? [blog.thumbnailUrl] : undefined,
  },
};
```

### 10. `frontend/src/app/(auth)/layout.tsx` — Remove metadata block entirely
- **Action:** Delete lines 1-7 entirely (the import + export const metadata block)
- **File becomes:**
```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

### 11. `frontend/src/app/(dashboard)/discover/page.tsx` — Remove noindex, add canonical
- **Before:**
```tsx
import type { Metadata } from "next";
import { DiscoverClient } from "./discover-client";

export const metadata: Metadata = {
  title: "Discover Tests",
  description: "Browse, search, and discover AI-powered mock tests for JEE, NEET, WBJEE, CUET and more. Practice with free mock tests created by the community.",
  robots: { index: false, follow: false },
};
```
- **After:**
```tsx
import type { Metadata } from "next";
import { DiscoverClient } from "./discover-client";

export const metadata: Metadata = {
  title: "Discover Tests",
  description: "Browse, search, and discover AI-powered mock tests for JEE, NEET, WBJEE, CUET and more. Practice with free mock tests created by the community.",
  alternates: {
    canonical: "https://fouri.in/discover",
  },
};
```

### 12. `frontend/src/app/robots.ts` — Update disallow rules
- **Before:**
```tsx
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/fouri-root-console/",
          "/dashboard/",
          "/discover/",
          "/upload/",
          "/history/",
          "/bookmarks/",
          "/progress/",
          "/results/",
          "/tests/",
          "/login",
          "/register",
          "/resume-tests/",
          "/analysis/",
          "/test/",
        ],
      },
    ],
    sitemap: "https://fouri.in/sitemap.xml",
  };
}
```
- **After:**
```tsx
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/fouri-root-console/",
          "/dashboard/",
          "/history/",
          "/bookmarks/",
          "/progress/",
          "/resume-tests/",
          "/analysis/",
          "/test/",
          "/attempt/",
        ],
      },
    ],
    sitemap: "https://fouri.in/sitemap.xml",
  };
}
```

### 13. `frontend/next.config.ts` — Add trailing slash normalization
- **Before:**
```tsx
async redirects() {
  return [
    {
      source: "/fouri-root-console/blogs",
      destination: "/fouri-root-console/blog",
      permanent: true,
    },
    {
      source: "/fouri-root-console/blogs/:path*",
      destination: "/fouri-root-console/blog/:path*",
      permanent: true,
    },
  ];
},
```
- **After:**
```tsx
async redirects() {
  return [
    {
      source: "/fouri-root-console/blogs",
      destination: "/fouri-root-console/blog",
      permanent: true,
    },
    {
      source: "/fouri-root-console/blogs/:path*",
      destination: "/fouri-root-console/blog/:path*",
      permanent: true,
    },
    {
      source: "/:path(.*)/",
      destination: "/:path",
      permanent: true,
    },
  ];
},
```

## Build & Verify

```bash
cd frontend
npm run build

# Verify no TypeScript errors
# Verify all routes compile
```

## Post-Deployment Validation

```bash
# Canonical checks
curl -s https://fouri.in/about | grep -oE 'canonical[^>]*href="[^"]*"'
curl -s https://fouri.in/blog | grep -oE 'canonical[^>]*href="[^"]*"'
curl -s https://fouri.in/faq | grep -oE 'canonical[^>]*href="[^"]*"'
curl -s https://fouri.in/contact | grep -oE 'canonical[^>]*href="[^"]*"'
curl -s https://fouri.in/privacy | grep -oE 'canonical[^>]*href="[^"]*"'
curl -s https://fouri.in/terms | grep -oE 'canonical[^>]*href="[^"]*"'
curl -s https://fouri.in/disclaimer | grep -oE 'canonical[^>]*href="[^"]*"'
curl -s https://fouri.in/discover | grep -oE 'canonical[^>]*href="[^"]*"'

# robots.txt
curl -s https://fouri.in/robots.txt

# Noindex check
curl -s https://fouri.in/discover | grep -oE 'robots[^>]*content="[^"]*"'

# Blog SSR links
curl -s https://fouri.in/blog | grep -oE '<a href="/blog/[^"]*"'

# Re-run Screaming Frog crawl
```
