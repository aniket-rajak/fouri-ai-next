export function getFileUrl(url: string): string {
  if (!url) return url;
  if (!url.includes('/api/')) return url;
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";
  if (!apiBase) return url;
  try {
    const urlObj = new URL(url);
    const currentHost = new URL(apiBase).host;
    if (urlObj.host !== currentHost) {
      urlObj.host = currentHost;
      urlObj.protocol = new URL(apiBase).protocol;
      return urlObj.toString();
    }
  } catch {}
  return url;
}