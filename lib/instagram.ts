const BASE = 'https://graph.instagram.com/v21.0'
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
const USER_ID = process.env.INSTAGRAM_USER_ID

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

async function igFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('access_token', TOKEN!)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`IG API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function fetchIGProfile(): Promise<IGProfile> {
  const data = await igFetch(`/${USER_ID}`, {
    fields: 'followers_count,follows_count,media_count',
  })
  return {
    followers: data.followers_count ?? 0,
    following: data.follows_count ?? 0,
    post_count: data.media_count ?? 0,
  }
}

export async function fetchIGPosts(): Promise<IGPost[]> {
  const mediaData = await igFetch(`/${USER_ID}/media`, {
    fields: 'id,caption,timestamp,thumbnail_url,media_url,permalink,media_type',
    limit: '25',
  })

  const posts: IGPost[] = []
  for (const item of mediaData.data ?? []) {
    try {
      const insights = await igFetch(`/${item.id}/insights`, {
        metric: 'views,reach,impressions,likes,comments,shares,saved',
      })

      const metricMap: Record<string, number> = {}
      for (const m of insights.data ?? []) {
        metricMap[m.name] = m.values?.[0]?.value ?? m.value ?? 0
      }

      const likes = metricMap.likes ?? 0
      const comments = metricMap.comments ?? 0
      const shares = metricMap.shares ?? 0
      const saves = metricMap.saved ?? 0
      const reach = metricMap.reach ?? 0
      const views = metricMap.views ?? 0
      const impressions = metricMap.impressions ?? 0
      const engagement_rate = reach > 0
        ? ((likes + comments + shares + saves) / reach) * 100
        : 0

      posts.push({
        platform: 'instagram',
        post_id: item.id,
        title: null,
        caption: item.caption ?? null,
        thumbnail_url: item.thumbnail_url ?? item.media_url ?? null,
        permalink: item.permalink ?? null,
        published_at: item.timestamp,
        views,
        likes,
        comments,
        shares,
        saves,
        reach,
        impressions,
        engagement_rate: Math.round(engagement_rate * 100) / 100,
      })
    } catch {
      // skip posts where insights fail (e.g. too recent)
    }
  }

  return posts
}
