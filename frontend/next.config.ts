import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "http", hostname: "localhost", port: "4000" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://pagead2.googlesyndication.com https://apis.google.com`,
            "style-src 'self' 'unsafe-inline'",
            `img-src 'self' data: blob: https: http:${process.env.NODE_ENV === "development" ? " http://localhost:4000 http://127.0.0.1:4000" : ""}`,
            "font-src 'self' data:",
            `connect-src 'self' https://www.google-analytics.com https://brave-passion-production-d8a1.up.railway.app https://www.fouri.in https://apis.google.com https://accounts.google.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firebase.googleapis.com https://firebaseinstallations.googleapis.com https://fouri-ai-mocktest.firebaseapp.com https://*.firebaseapp.com${process.env.NODE_ENV === "development" ? " http://localhost:4000" : ""}`,
            "frame-src 'self' https://www.google.com https://www.googletagmanager.com https://apis.google.com https://accounts.google.com https://fouri-ai-mocktest.firebaseapp.com https://*.firebaseapp.com",
            "media-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ],
    },
    {
      source: "/images/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/fonts/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/_next/static/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
