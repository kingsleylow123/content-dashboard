import { NextRequest, NextResponse } from 'next/server'
import { supabase, Platform } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const platform = (searchParams.get('platform') ?? 'all') as Platform | 'all'
  const days = parseInt(searchParams.get('days') ?? '30', 10)
  const sort = searchParams.get('sort') ?? 'views'
  const limit = parseInt(searchParams.get('limit') ?? '10', 10)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  const validSorts: Record<string, string> = {
    views: 'views',
    likes: 'likes',
    shares: 'shares',
    engagement_rate: 'engagement_rate',
    saves: 'saves',
  }
  const sortCol = validSorts[sort] ?? 'views'

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  try {
    let query = supabase
      .from('content_analytics')
      .select('*', { count: 'exact' })
      .gte('published_at', cutoff.toISOString())
      .order(sortCol, { ascending: false })
      .range(offset, offset + limit - 1)

    if (platform !== 'all') {
      query = query.eq('platform', platform)
    }

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ posts: data ?? [], total: count ?? 0 })
  } catch (err) {
    console.error('Posts error:', err)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
