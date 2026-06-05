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
