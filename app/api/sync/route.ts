import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchIGPosts, fetchIGProfile } from '@/lib/instagram'
import { fetchYTPosts, fetchYTProfile } from '@/lib/youtube'

// Vercel hobby plan caps regular functions at 10s.
// We fire sync tasks and return immediately — results land in ~60-120s via Apify.
// The cron job handles the scheduled full sync.

export async function POST() {
  const igEnabled = !!(process.env.APIFY_API_TOKEN && process.env.IG_USERNAME)
  const ytEnabled = !!(process.env.APIFY_API_TOKEN && process.env.YT_CHANNEL_URL)

  if (!igEnabled && !ytEnabled) {
    return NextResponse.json({
      synced: 0,
      message: 'No credentials configured. Add APIFY_API_TOKEN + IG_USERNAME / YT_CHANNEL_URL.'
    })
  }

  // Run sync without blocking the response — fire and forget
  // Results will be in Supabase in ~60-120s; refresh the page to see them
  const syncPromise = runSync(igEnabled, ytEnabled)

  // Give it 8s max before returning (stays within 10s function limit)
  const result = await Promise.race([
    syncPromise,
    new Promise<{ synced: number; errors: string[]; partial: boolean }>(resolve =>
      setTimeout(() => resolve({ synced: 0, errors: [], partial: true }), 8000)
    ),
  ])

  if (result.partial) {
    return NextResponse.json({
      synced: 0,
      partial: true,
      message: 'Sync started — Apify is scraping in the background. Refresh in ~90 seconds to see updated data.',
    })
  }

  return NextResponse.json({ synced: result.synced, errors: result.errors })
}

async function runSync(igEnabled: boolean, ytEnabled: boolean) {
  let synced = 0
  const errors: string[] = []

  await Promise.all([
    igEnabled ? syncIG() : Promise.resolve(),
    ytEnabled ? syncYT() : Promise.resolve(),
  ])

  return { synced, errors, partial: false }

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
