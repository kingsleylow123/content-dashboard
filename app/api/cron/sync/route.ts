import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchIGPosts, fetchIGProfile } from '@/lib/instagram'
import { fetchYTPosts, fetchYTProfile } from '@/lib/youtube'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runSync()
}

export async function POST() {
  return runSync()
}

async function runSync() {
  let synced = 0
  const errors: string[] = []

  const igEnabled = !!(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID)
  const ytEnabled = !!(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID)

  await Promise.all([
    igEnabled ? syncInstagram() : Promise.resolve(),
    ytEnabled ? syncYouTube() : Promise.resolve(),
  ])

  return NextResponse.json({ synced, errors })

  async function syncInstagram() {
    try {
      const [posts, profile] = await Promise.all([fetchIGPosts(), fetchIGProfile()])

      if (posts.length) {
        const { error } = await supabase
          .from('content_analytics')
          .upsert(
            posts.map(p => ({ ...p, synced_at: new Date().toISOString() })),
            { onConflict: 'post_id' }
          )
        if (error) throw error
        synced += posts.length
      }

      await supabase.from('profile_snapshots').insert({
        platform: 'instagram',
        followers: profile.followers,
        following: profile.following,
        post_count: profile.post_count,
      })
    } catch (e) {
      errors.push(`Instagram: ${(e as Error).message}`)
    }
  }

  async function syncYouTube() {
    try {
      const [posts, profile] = await Promise.all([fetchYTPosts(), fetchYTProfile()])

      if (posts.length) {
        const { error } = await supabase
          .from('content_analytics')
          .upsert(
            posts.map(p => ({ ...p, synced_at: new Date().toISOString() })),
            { onConflict: 'post_id' }
          )
        if (error) throw error
        synced += posts.length
      }

      await supabase.from('profile_snapshots').insert({
        platform: 'youtube',
        followers: profile.followers,
        post_count: profile.post_count,
      })
    } catch (e) {
      errors.push(`YouTube: ${(e as Error).message}`)
    }
  }
}
