'use client'

import { useState } from 'react'
import { Sparkles, Clock, TrendingUp, X } from 'lucide-react'
import { formatNumber } from '@/lib/analytics'
import { cn } from '@/lib/utils'

interface AnalysisResult {
  avg_views: number
  avg_engagement_rate: number
  avg_likes: number
  top_platform: string
  best_time_to_post: string
  insight: string
  hook_pattern: string
}

interface AnalyzePanelProps {
  platform: string
  days: number
}

export function AnalyzePanel({ platform, days }: AnalyzePanelProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  async function handleAnalyze() {
    setLoading(true)
    setError('')
    setOpen(true)
    try {
      const res = await fetch(`/api/analyze?platform=${platform}&days=${days}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Analysis failed'); return }
      setResult(data)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
          'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60'
        )}
      >
        <Sparkles className={`h-3 w-3 ${loading ? 'animate-pulse' : ''}`} />
        {loading ? 'Analyzing…' : 'AI Analyze'}
      </button>

      {open && (
        <div className="mt-4 rounded-xl border border-indigo-800/40 bg-indigo-950/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">AI Analysis</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-4 rounded bg-zinc-800 animate-pulse" style={{ width: `${60 + i * 10}%` }} />
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          {result && !loading && (
            <div className="space-y-4">
              {/* Stat row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Avg Views" value={formatNumber(result.avg_views)} />
                <Stat label="Avg Engagement" value={`${result.avg_engagement_rate}%`} />
                <Stat label="Avg Likes" value={formatNumber(result.avg_likes)} />
                <Stat label="Top Platform" value={result.top_platform.charAt(0).toUpperCase() + result.top_platform.slice(1)} />
              </div>

              {/* Best time badge */}
              <div className="flex items-center gap-2 rounded-lg border border-amber-700/40 bg-amber-950/30 px-3 py-2">
                <Clock className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-xs text-amber-300">
                  <span className="font-semibold">Best time to post:</span> {result.best_time_to_post}
                </span>
              </div>

              {/* Hook pattern */}
              <div className="flex items-start gap-2 rounded-lg border border-green-800/30 bg-green-950/20 px-3 py-2">
                <TrendingUp className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-green-300">
                  <span className="font-semibold">Hook pattern: </span>{result.hook_pattern}
                </span>
              </div>

              {/* Insight */}
              <p className="text-sm text-zinc-300 leading-relaxed border-t border-zinc-800 pt-3">
                {result.insight}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
      <div className="text-xs text-zinc-500 mb-0.5">{label}</div>
      <div className="text-base font-bold text-white">{value}</div>
    </div>
  )
}
