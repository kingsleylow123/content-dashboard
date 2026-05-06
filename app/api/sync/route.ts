import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchIGPosts, fetchIGProfile } from '@/lib/instagram'
import { fetchYTPosts, fetchYTProfile } from '@/lib/youtube'

// Strategy:
// 1. Profile fetches are FAST (~2s) — always complete within timeout → followers update every sync
// 2. Post fetches are SLOW (~60-120s) — fire in background, return partial:true
// This ensures Sync Now always updates followers + triggers post refresh in background

export async function POST() {
  const igEnabled = !!(process.env.APIFY_API_TOKEN && process.env.IG_USERNAME)
  const ytEnabled = !!(process.env.APIFY_API_TOKEN && process.env.YT_CHANNEL_URL)

  if (!igEnabled && !ytEnabled) {
    return NextResponse.json({ synced: 0, message: 'No credentials configured.' })
  }

  const errors: string[] = []

  // Step 1: Profile fetches first (fast ~2s each) — always complete within 10s limit
  const [igProfile, ytProfile] = await Promise.all([
    igEnabled ? fetchIGProfile().catch(() => null) : Promise.resolve(null),
    ytEnabled ? fetchYTProfile().catch(() => null) : Promise.resolve(null),
  ])

  // Persist follower counts immediately
  if (igProfile?.followers) {
    await supabase.from('profile_snapshots').insert({
      platform: 'instagram',
      followers: igProfile.followers,
      following: igProfile.following,
      post_count: igProfile.post_count,
    }).then(() => null, () => null)
  }
  if (ytProfile?.followers) {
    await supabase.from('profile_snapshots').insert({
      platform: 'youtube',
      followers: ytProfile.followers,
      post_count: ytProfile.post_count,
    }).then(() => null, () => null)
  }

  // Step 2: Posts are slow — race against 4s, fire in background either way
  const postsPromise = syncPosts(igEnabled, ytEnabled, errors)
  const postsResult = await Promise.race([
    postsPromise,
    new Promise<{ synced: number; partial: boolean }>(resolve =>
      setTimeout(() => resolve({ synced: 0, partial: true }), 4000)
    ),
  ])

  return NextResponse.json({
    synced: postsResult.synced,
    followers: {
      instagram: igProfile?.followers ?? null,
      youtube: ytProfile?.followers ?? null,
    },
    partial: postsResult.partial,
    errors,
    message: postsResult.partial
      ? `Followers updated ✓ — Posts syncing in background (~90s). Refresh to see new posts.`
      : `Synced ${postsResult.synced} posts + updated followers ✓`,
  })
}

async function syncPosts(igEnabled: boolean, ytEnabled: boolean, errors: string[]) {
  let synced = 0

  await Promise.all([
    igEnabled ? syncIG() : Promise.resolve(),
    ytEnabled ? syncYT() : Promise.resolve(),
  ])

  return { synced, partial: false }

  async function syncIG() {
    try {
      const posts = await fetchIGPosts()
      if (posts.length) {
        const { error } = await supabase
          .from('content_analytics')
          .upsert(posts.map(p => ({ ...p, synced_at: new Date().toISOString() })), { onConflict: 'post_id' })
        if (error) throw error
        synced += posts.length
      }
    } catch (e) { errors.push(`Instagram posts: ${(e as Error).message}`) }
  }

  async function syncYT() {
    try {
      const posts = await fetchYTPosts()
      if (posts.length) {
        const { error } = await supabase
          .from('content_analytics')
          .upsert(posts.map(p => ({ ...p, synced_at: new Date().toISOString() })), { onConflict: 'post_id' })
        if (error) throw error
        synced += posts.length
      }
    } catch (e) { errors.push(`YouTube posts: ${(e as Error).message}`) }
  }
}
