import { NextRequest, NextResponse } from 'next/server'

// Server-side image proxy — bypasses CORS on Instagram/YouTube CDN URLs
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  // Only proxy known CDN domains
  const allowed = [
    'cdninstagram.com',
    'instagram.com',
    'i.ytimg.com',
    'img.youtube.com',
    'scontent',
  ]
  const isAllowed = allowed.some(d => url.includes(d))
  if (!isAllowed) return new NextResponse('Forbidden', { status: 403 })

  try {
    const res = await fetch(url, {
      headers: {
        'Referer': 'https://www.instagram.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      next: { revalidate: 3600 }, // cache 1hr
    })

    if (!res.ok) return new NextResponse('Upstream error', { status: res.status })

    const blob = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse('Fetch failed', { status: 502 })
  }
}
