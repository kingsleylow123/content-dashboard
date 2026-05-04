import { supabase, ContentPost, Platform } from './supabase'

export interface KpiMetric {
  current: number
  previous: number
  change: number
  sparkline: number[]
}

export interface KpiData {
  views: KpiMetric
  reach: KpiMetric
  engagement_rate: KpiMetric
  followers: KpiMetric
  shares: KpiMetric
  saves: KpiMetric
}

export interface ChartPoint {
  date: string
  views: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export async function getPostsInRange(
  platform: Platform | 'all',
  days: number
): Promise<ContentPost[]> {
  let query = supabase
    .from('content_analytics')
    .select('*')
    .gte('published_at', daysAgo(days))
    .order('published_at', { ascending: false })

  if (platform !== 'all') {
    query = query.eq('platform', platform)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getPostsInPreviousRange(
  platform: Platform | 'all',
  days: number
): Promise<ContentPost[]> {
  let query = supabase
    .from('content_analytics')
    .select('*')
    .gte('published_at', daysAgo(days * 2))
    .lt('published_at', daysAgo(days))

  if (platform !== 'all') {
    query = query.eq('platform', platform)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100 * 10) / 10
}

function buildSparkline(posts: ContentPost[], field: keyof ContentPost, days: number): number[] {
  const buckets = Math.min(days, 7)
  const bucketSize = days / buckets
  const result: number[] = Array(buckets).fill(0)

  for (const post of posts) {
    const daysOld = (Date.now() - new Date(post.published_at).getTime()) / 86400000
    const idx = Math.min(buckets - 1, Math.floor(daysOld / bucketSize))
    const bucketIdx = buckets - 1 - idx
    result[bucketIdx] += (post[field] as number) ?? 0
  }

  return result
}

export async function getLatestFollowers(platform: Platform | 'all'): Promise<{ current: number; previous: number }> {
  const targetPlatform = platform === 'all' ? 'instagram' : platform

  const { data } = await supabase
    .from('profile_snapshots')
    .select('followers, snapped_at')
    .eq('platform', targetPlatform)
    .order('snapped_at', { ascending: false })
    .limit(2)

  const current = data?.[0]?.followers ?? 0
  const previous = data?.[1]?.followers ?? current
  return { current, previous }
}

export async function computeKpis(
  platform: Platform | 'all',
  days: number
): Promise<KpiData> {
  const [current, previous, followersData] = await Promise.all([
    getPostsInRange(platform, days),
    getPostsInPreviousRange(platform, days),
    getLatestFollowers(platform),
  ])

  const sum = (posts: ContentPost[], field: keyof ContentPost) =>
    posts.reduce((acc, p) => acc + ((p[field] as number) ?? 0), 0)

  const avgEngagement = (posts: ContentPost[]) => {
    if (!posts.length) return 0
    return Math.round((posts.reduce((a, p) => a + p.engagement_rate, 0) / posts.length) * 100) / 100
  }

  const curViews = sum(current, 'views')
  const curReach = sum(current, 'reach')
  const curShares = sum(current, 'shares')
  const curSaves = sum(current, 'saves')
  const curEngagement = avgEngagement(current)

  const prevViews = sum(previous, 'views')
  const prevReach = sum(previous, 'reach')
  const prevShares = sum(previous, 'shares')
  const prevSaves = sum(previous, 'saves')
  const prevEngagement = avgEngagement(previous)

  return {
    views: { current: curViews, previous: prevViews, change: calcChange(curViews, prevViews), sparkline: buildSparkline(current, 'views', days) },
    reach: { current: curReach, previous: prevReach, change: calcChange(curReach, prevReach), sparkline: buildSparkline(current, 'reach', days) },
    engagement_rate: { current: curEngagement, previous: prevEngagement, change: calcChange(curEngagement, prevEngagement), sparkline: buildSparkline(current, 'engagement_rate', days) },
    followers: { current: followersData.current, previous: followersData.previous, change: calcChange(followersData.current, followersData.previous), sparkline: [] },
    shares: { current: curShares, previous: prevShares, change: calcChange(curShares, prevShares), sparkline: buildSparkline(current, 'shares', days) },
    saves: { current: curSaves, previous: prevSaves, change: calcChange(curSaves, prevSaves), sparkline: buildSparkline(current, 'saves', days) },
  }
}

export async function computeChartData(
  platform: Platform | 'all',
  days: number
): Promise<ChartPoint[]> {
  const posts = await getPostsInRange(platform, days)

  const byDate: Record<string, ChartPoint> = {}

  for (const post of posts) {
    const date = post.published_at.slice(0, 10)
    if (!byDate[date]) {
      byDate[date] = { date, views: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    }
    byDate[date].views += post.views
    byDate[date].reach += post.reach
    byDate[date].likes += post.likes
    byDate[date].comments += post.comments
    byDate[date].shares += post.shares
    byDate[date].saves += post.saves
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}
