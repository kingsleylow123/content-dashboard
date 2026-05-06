import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

export const maxDuration = 30

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const platform = searchParams.get('platform') ?? 'all'
  const days = parseInt(searchParams.get('days') ?? '90', 10)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  let query = supabase
    .from('content_analytics')
    .select('platform, views, likes, comments, shares, saves, reach, engagement_rate, published_at, caption, title')
    .gte('published_at', cutoff.toISOString())
    .order('views', { ascending: false })
    .limit(50)

  if (platform !== 'all') query = query.eq('platform', platform)

  const { data: posts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!posts?.length) return NextResponse.json({ error: 'No posts found. Run a sync first.' }, { status: 404 })

  const summary = posts.map(p => ({
    platform: p.platform,
    views: p.views,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    saves: p.saves,
    reach: p.reach,
    engagement_rate: p.engagement_rate,
    published_at: p.published_at,
    hook: (p.caption ?? p.title ?? '').slice(0, 80),
  }))

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You are a social media analytics expert. Analyze these ${posts.length} posts and return ONLY a valid JSON object (no markdown, no explanation):

${JSON.stringify(summary)}

Return exactly this shape:
{
  "avg_views": <number>,
  "avg_engagement_rate": <number, 2 decimal places>,
  "avg_likes": <number>,
  "top_platform": "<instagram|youtube|both>",
  "best_time_to_post": "<Day HH:MM — based on when top 5 posts by views were published, e.g. Tuesday 19:00>",
  "insight": "<2 punchy sentences about what content is working and what to do more of. Be specific, not generic.>",
  "hook_pattern": "<1 sentence describing the hook style of top-performing posts>"
}`
    }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  // Strip markdown code blocks if present
  const cleaned = raw.replace(/^```(?:json)?\n?/,'').replace(/\n?```$/,'').trim()

  try {
    const result = JSON.parse(cleaned)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw }, { status: 500 })
  }
}
