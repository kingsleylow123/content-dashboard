'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, BarChart2 } from 'lucide-react'
import { Filters, PlatformFilter, DaysFilter } from '@/components/filters'
import { KpiCard } from '@/components/kpi-card'
import { ViewsReachChart } from '@/components/views-reach-chart'
import { EngagementChart } from '@/components/engagement-chart'
import { PostsGrid } from '@/components/posts-grid'
import { AnalyzePanel } from '@/components/analyze-panel'
import { KpiData, ChartPoint } from '@/lib/analytics'
import { ContentPost } from '@/lib/supabase'

const EMPTY_KPI: KpiData = {
  views: { current: 0, previous: 0, change: 0, sparkline: [] },
  reach: { current: 0, previous: 0, change: 0, sparkline: [] },
  engagement_rate: { current: 0, previous: 0, change: 0, sparkline: [] },
  followers: { current: 0, previous: 0, change: 0, sparkline: [] },
  shares: { current: 0, previous: 0, change: 0, sparkline: [] },
  saves: { current: 0, previous: 0, change: 0, sparkline: [] },
}

export default function Dashboard() {
  const [platform, setPlatform] = useState<PlatformFilter>('all')
  const [days, setDays] = useState<DaysFilter>(90)
  const [sort, setSort] = useState('views')
  const [postOffset, setPostOffset] = useState(0)

  const [kpis, setKpis] = useState<KpiData>(EMPTY_KPI)
  const [viewsChart, setViewsChart] = useState<ChartPoint[]>([])
  const [engagementChart, setEngagementChart] = useState<ChartPoint[]>([])
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [totalPosts, setTotalPosts] = useState(0)

  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch(`/api/analytics?platform=${platform}&days=${days}`)
      const data = await res.json()
      setKpis(data.kpis ?? EMPTY_KPI)
      setViewsChart(data.viewsChart ?? [])
      setEngagementChart(data.engagementChart ?? [])
    } catch {
      // keep current state
    } finally {
      setAnalyticsLoading(false)
    }
  }, [platform, days])

  const fetchPosts = useCallback(async (offset = 0, append = false) => {
    setPostsLoading(true)
    try {
      const res = await fetch(`/api/posts?platform=${platform}&days=${days}&sort=${sort}&limit=10&offset=${offset}`)
      const data = await res.json()
      setPosts(prev => append ? [...prev, ...(data.posts ?? [])] : (data.posts ?? []))
      setTotalPosts(data.total ?? 0)
    } catch {
      // keep current state
    } finally {
      setPostsLoading(false)
    }
  }, [platform, days, sort])

  useEffect(() => {
    setPostOffset(0)
    fetchAnalytics()
    fetchPosts(0, false)
  }, [platform, days, fetchAnalytics, fetchPosts])

  useEffect(() => {
    setPostOffset(0)
    fetchPosts(0, false)
  }, [sort, fetchPosts])

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (data.message) {
        setSyncMsg(data.message)
      } else {
        setSyncMsg(`Synced ${data.synced ?? 0} posts${data.errors?.length ? ` (${data.errors.join(', ')})` : ''}`)
        await Promise.all([fetchAnalytics(), fetchPosts(0, false)])
      }
    } catch {
      setSyncMsg('Sync failed')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(''), 6000)
    }
  }

  function handleLoadMore() {
    const next = postOffset + 10
    setPostOffset(next)
    fetchPosts(next, true)
  }

  const isYT = platform === 'youtube'

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white">Content Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <Filters
              platform={platform}
              days={days}
              onPlatformChange={p => { setPlatform(p); setPostOffset(0) }}
              onDaysChange={d => { setDays(d); setPostOffset(0) }}
            />
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* AI Analyze panel */}
        <AnalyzePanel platform={platform} days={days} />

        {syncMsg && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-400">
            {syncMsg}
          </div>
        )}

        {/* KPI Cards */}
        <div className={`grid gap-4 ${analyticsLoading ? 'opacity-60' : ''} grid-cols-2 md:grid-cols-3 lg:grid-cols-6`}>
          <KpiCard label="Views"      metric={kpis.views} />
          <KpiCard label="Reach"      metric={kpis.reach} />
          <KpiCard label="Eng. Rate"  metric={kpis.engagement_rate} format="percent" />
          <KpiCard label="Followers"  metric={kpis.followers} />
          {/* Shares & Saves: not available via public scraping — require official IG API */}
          <KpiCard label="Shares" metric={kpis.shares} unavailable={platform !== 'youtube'} />
          <KpiCard label="Saves"  metric={kpis.saves}  unavailable={platform !== 'youtube'} />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Views &amp; Reach</h2>
            <ViewsReachChart data={viewsChart} />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Engagement Breakdown</h2>
            <EngagementChart data={engagementChart} />
          </div>
        </div>

        {/* Posts Grid */}
        <PostsGrid
          posts={posts}
          total={totalPosts}
          onSortChange={setSort}
          onLoadMore={handleLoadMore}
          loading={postsLoading}
        />

        {/* Footer */}
        <p className="text-center text-xs text-zinc-700">
          Syncs every 6 hours automatically · Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  )
}
