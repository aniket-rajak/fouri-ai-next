/**
 * Resolves a stored file/image URL by replacing any hardcoded localhost hostname
 * with the production API base URL. This is used on the backend to sanitize URLs
 * that may have been stored in the database with localhost URLs from development.
 */
export function resolveFileUrl(url: string): string {
  if (!url) return url;

  const productionBase = process.env.API_BASE_URL || "https://fouri-ai-next-1.onrender.com";

  // Replace any hardcoded localhost hostname with the production base
  // Handles: http://localhost:4000, http://localhost:3000, etc.
  return url.replace(/https?:\/\/localhost:\d+/, productionBase);
}