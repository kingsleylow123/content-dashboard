import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchIGPosts, fetchIGProfile } from '@/lib/instagram'
import { fetchYTPosts, fetchYTProfile } from '@/lib/youtube'

export const maxDuration = 60

export async function POST() {
  let synced = 0
  const errors: string[] = []

  const igEnabled = !!(process.env.APIFY_API_TOKEN && process.env.IG_USERNAME)
  const ytEnabled = !!(process.env.APIFY_API_TOKEN && process.env.YT_CHANNEL_URL)

  if (!igEnabled && !ytEnabled) {
    return NextResponse.json({ synced: 0, message: 'No credentials configured. Add APIFY_API_TOKEN + IG_USERNAME and/or YT_CHANNEL_URL to .env.local' })
  }

  await Promise.all([
    igEnabled ? syncIG() : Promise.resolve(),
    ytEnabled ? syncYT() : Promise.resolve(),
  ])

  return NextResponse.json({ synced, errors })

  async function syncIG() {
    try {
      const [posts, profile] = await Promise.all([fetchIGPosts(), fetchIGProfile()])
      if (posts.length) {
        const { error } = await supabase
          .from('content_analytics')
          .upsert(posts.map(p => ({ ...p, synced_at: new Date().toISOString() })), { onConflict: 'post_id' })
        if (error) throw error
        synced += posts.length
      }
      await supabase.from('profile_snapshots').insert({
        platform: 'instagram', followers: profile.followers,
        following: profile.following, post_count: profile.post_count,
      })
    } catch (e) { errors.push(`Instagram: ${(e as Error).message}`) }
  }

  async function syncYT() {
    try {
      const [posts, profile] = await Promise.all([fetchYTPosts(), fetchYTProfile()])
      if (posts.length) {
        const { error } = await supabase
          .from('content_analytics')
          .upsert(posts.map(p => ({ ...p, synced_at: new Date().toISOString() })), { onConflict: 'post_id' })
        if (error) throw error
        synced += posts.length
      }
      await supabase.from('profile_snapshots').insert({
        platform: 'youtube', followers: profile.followers, post_count: profile.post_count,
      })
    } catch (e) { errors.push(`YouTube: ${(e as Error).message}`) }
  }
}
