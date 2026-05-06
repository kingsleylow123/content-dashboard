// Instagram data via Apify instagram-scraper (no OAuth needed)
const APIFY_TOKEN = process.env.APIFY_API_TOKEN
const IG_USERNAME = process.env.IG_USERNAME
const ACTOR_ID = 'shu8hvrXbJbY3Eb9W' // apify/instagram-scraper

export interface IGPost {
  platform: 'instagram'
  post_id: string
  title: string | null
  caption: string | null
  thumbnail_url: string | null
  permalink: string | null
  published_at: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
  engagement_rate: number
}

export interface IGProfile {
  followers: number
  following: number
  post_count: number
}

async function runApifyActor(input: Record<string, unknown>): Promise<unknown[]> {
  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=120&memory=512`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Apify IG error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function fetchIGProfile(): Promise<IGProfile> {
  if (!APIFY_TOKEN || !IG_USERNAME) return { followers: 0, following: 0, post_count: 0 }

  try {
    const items = await runApifyActor({
      directUrls: [`https://www.instagram.com/${IG_USERNAME}/`],
      resultsLimit: 1,
      resultsType: 'details',
    }) as Record<string, unknown>[]

    const profile = items?.[0] ?? {}
    return {
      followers: Number(profile.followersCount ?? 0),
      following:  Number(profile.followsCount   ?? 0),
      post_count: Number(profile.postsCount      ?? 0),
    }
  } catch {
    return { followers: 0, following: 0, post_count: 0 }
  }
}

export async function fetchIGPosts(): Promise<IGPost[]> {
  if (!APIFY_TOKEN || !IG_USERNAME) return []

  const items = await runApifyActor({
    directUrls: [`https://www.instagram.com/${IG_USERNAME}/`],
    resultsLimit: 25,
    resultsType: 'posts',
  }) as Record<string, unknown>[]

  const valid = items.filter(i => !i.error)

  return valid.map(item => {
    const likes    = Number(item.likesCount    ?? item.likes    ?? 0)
    const comments = Number(item.commentsCount ?? item.comments ?? 0)
    // shares/saves not available from public scraping — stored as 0
    const views    = Number(item.videoViewCount ?? item.videoPlayCount ?? item.playCount ?? item.views ?? 0)
    const reach    = views || (likes > 0 ? likes * 10 : 0)
    const engagement_rate = reach > 0
      ? ((likes + comments) / reach) * 100
      : 0

    const shortCode = String(item.shortCode ?? item.id ?? '')
    const published_at =
      (item.timestamp as string) ??
      (item.takenAt   as string) ??
      (item.date      as string) ??
      new Date().toISOString()

    return {
      platform: 'instagram' as const,
      post_id: String((item.id ?? shortCode) || `ig_${Date.now()}_${Math.random()}`),
      title: null,
      caption: String(item.caption ?? item.text ?? '').slice(0, 500) || null,
      thumbnail_url: String(item.displayUrl ?? item.thumbnailUrl ?? item.previewUrl ?? '') || null,
      permalink: String(item.url ?? (shortCode ? `https://www.instagram.com/p/${shortCode}/` : '')) || null,
      published_at: new Date(published_at).toISOString(),
      views, likes, comments,
      shares: 0, saves: 0, // not available via public scraping
      reach,
      impressions: views || likes,
      engagement_rate: Math.round(engagement_rate * 100) / 100,
    }
  }).filter(p => !p.post_id.startsWith('ig_') || p.likes > 0)
}
