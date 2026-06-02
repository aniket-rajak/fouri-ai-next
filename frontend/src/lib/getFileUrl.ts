/**
 * Resolves a stored file/image URL by replacing any hardcoded localhost hostname
 * with the current production API base URL. This fixes issues where old images
 * were uploaded via localhost during development and stored with broken URLs.
 */
export function getFileUrl(url: string): string {
  if (!url) return url;

  // Derive the API base from NEXT_PUBLIC_API_URL
  // e.g., "https://fouri-ai-next-1.onrender.com/api" → "https://fouri-ai-next-1.onrender.com"
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";
  const productionBase = apiBase || "https://fouri-ai-next-1.onrender.com";

  // Replace any hardcoded localhost hostname with the production base
  // Handles: http://localhost:4000, http://localhost:3000, etc.
  return url.replace(/https?:\/\/localhost:\d+/, productionBase);
}