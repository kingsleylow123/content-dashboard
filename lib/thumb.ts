// Returns proxied URL for external CDN images (avoids CORS)
export function thumb(url: string | null | undefined): string | null {
  if (!url) return null
  // YouTube thumbnails don't need proxy (no CORS issues)
  if (url.includes('ytimg.com') || url.includes('youtube.com')) return url
  // Proxy Instagram CDN URLs server-side
  return `/api/proxy-image?url=${encodeURIComponent(url)}`
}
