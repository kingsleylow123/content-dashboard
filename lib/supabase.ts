import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anonKey)

export type Platform = 'instagram' | 'youtube'

export interface ContentPost {
  id: string
  platform: Platform
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
  video_type: string | null  // 'video' | 'short' (YouTube only)
  synced_at: string
  created_at: string
}

export interface ProfileSnapshot {
  id: string
  platform: Platform
  followers: number
  following: number | null
  post_count: number | null
  snapped_at: string
}
