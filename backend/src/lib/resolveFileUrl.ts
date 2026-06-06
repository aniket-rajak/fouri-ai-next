import type { Request } from "express";

/**
 * Resolves a stored file/image URL by replacing its host with the current
 * server's host (from the request or API_BASE_URL env var). This sanitizes
 * URLs that may have been stored in the database with stale hosts (e.g.
 * localhost:4000 from development).
 */
export function resolveFileUrl(url: string | null, req?: Request): string | null {
  if (!url) return url;

  const currentBase = req
    ? `${req.protocol}://${req.get("host")}`
    : process.env.API_BASE_URL || "https://fouri-ai-next-1.onrender.com";

  // Replace any existing host (http://... or https://...) with the current base
  return url.replace(/https?:\/\/[^\/]+/, currentBase);
}