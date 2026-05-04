import { NextRequest, NextResponse } from 'next/server'
import { computeKpis, computeChartData } from '@/lib/analytics'
import { Platform } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const platform = (searchParams.get('platform') ?? 'all') as Platform | 'all'
  const days = parseInt(searchParams.get('days') ?? '30', 10)

  try {
    const [kpis, viewsChart, engagementChart] = await Promise.all([
      computeKpis(platform, days),
      computeChartData(platform, days),
      computeChartData(platform, days),
    ])

    return NextResponse.json({ kpis, viewsChart, engagementChart })
  } catch (err) {
    console.error('Analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
