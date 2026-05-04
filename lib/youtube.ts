const BASE = 'https://www.googleapis.com/youtube/v3'
const KEY = process.env.YOUTUBE_API_KEY
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID

export interface YTPost {
  platform: 'youtube'
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
  watch_time_mins: number
}

export interface YTProfile {
  followers: number
  post_count: number
}

async function ytFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}/${endpoint}`)
  url.searchParams.set('key', KEY!)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`YT API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function fetchYTProfile(): Promise<YTProfile> {
  const data = await ytFetch('channels', {
    part: 'statistics',
    id: CHANNEL_ID!,
  })
  const stats = data.items?.[0]?.statistics ?? {}
  return {
    followers: parseInt(stats.subscriberCount ?? '0', 10),
    post_count: parseInt(stats.videoCount ?? '0', 10),
  }
}

async function getUploadsPlaylistId(): Promise<string> {
  const data = await ytFetch('channels', {
    part: 'contentDetails',
    id: CHANNEL_ID!,
  })
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? ''
}

export async function fetchYTPosts(): Promise<YTPost[]> {
  const playlistId = await getUploadsPlaylistId()
  if (!playlistId) return []

  const playlistData = await ytFetch('playlistItems', {
    part: 'contentDetails',
    playlistId,
    maxResults: '25',
  })

  const videoIds: string[] = (playlistData.items ?? []).map(
    (i: { contentDetails: { videoId: string } }) => i.contentDetails.videoId
  )
  if (!videoIds.length) return []

  const videoData = await ytFetch('videos', {
    part: 'snippet,statistics',
    id: videoIds.join(','),
  })

  return (videoData.items ?? []).map((v: {
    id: string
    snippet: { title: string; description: string; publishedAt: string; thumbnails: { high?: { url: string }; medium?: { url: string } } }
    statistics: { viewCount?: string; likeCount?: string; commentCount?: string }
  }) => {
    const stats = v.statistics ?? {}
    const views = parseInt(stats.viewCount ?? '0', 10)
    const likes = parseInt(stats.likeCount ?? '0', 10)
    const comments = parseInt(stats.commentCount ?? '0', 10)
    const engagement_rate = views > 0
      ? ((likes + comments) / views) * 100
      : 0

    return {
      platform: 'youtube' as const,
      post_id: `yt_${v.id}`,
      title: v.snippet?.title ?? null,
      caption: v.snippet?.description?.slice(0, 500) ?? null,
      thumbnail_url: v.snippet?.thumbnails?.high?.url ?? v.snippet?.thumbnails?.medium?.url ?? null,
      permalink: `https://www.youtube.com/watch?v=${v.id}`,
      published_at: v.snippet?.publishedAt,
      views,
      likes,
      comments,
      shares: 0,
      saves: 0,
      reach: views,
      impressions: views,
      engagement_rate: Math.round(engagement_rate * 100) / 100,
      watch_time_mins: 0,
    }
  })
}
