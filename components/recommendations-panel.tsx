'use client'

import { ContentPost } from '@/lib/supabase'
import { formatNumber } from '@/lib/analytics'
import { Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecommendationsPanelProps {
  posts: ContentPost[]
}

type RecType = 'REPOST' | 'REMIX HOOK' | 'NEW ANGLE'

interface Rec {
  type: RecType
  post: ContentPost
  why: string
  action: string
}

const REC_META: Record<RecType, { emoji: string; color: string; label: string }> = {
  'REPOST':     { emoji: '🔁', label: 'Repost',     color: 'border-green-700/40 bg-green-950/30' },
  'REMIX HOOK': { emoji: '🎣', label: 'Remix Hook', color: 'border-amber-700/40 bg-amber-950/30' },
  'NEW ANGLE':  { emoji: '↗',  label: 'New Angle',  color: 'border-blue-700/40  bg-blue-950/30'  },
}

const BADGE_COLOR: Record<RecType, string> = {
  'REPOST':     'bg-green-500/15 text-green-400 border-green-600/30',
  'REMIX HOOK': 'bg-amber-500/15 text-amber-400 border-amber-600/30',
  'NEW ANGLE':  'bg-blue-500/15  text-blue-400  border-blue-600/30',
}

function buildRecommendations(posts: ContentPost[]): Rec[] {
  if (posts.length < 3) return []

  const avgViews = posts.reduce((a, p) => a + p.views, 0) / posts.length
  const avgEng   = posts.reduce((a, p) => a + p.engagement_rate, 0) / posts.length

  let repost:    ContentPost | null = null
  let remixHook: ContentPost | null = null
  let newAngle:  ContentPost | null = null

  for (const p of posts) {
    const vr = avgViews > 0 ? p.views / avgViews : 0
    const er = avgEng   > 0 ? p.engagement_rate / avgEng : 0

    if (!repost    && vr >= 1.5 && er >= 1.3) repost    = p
    if (!remixHook && vr >= 1.2 && er <  0.9) remixHook = p
    if (!newAngle  && er >= 1.3 && vr <  0.9) newAngle  = p
  }

  // Fallback: pick best of each type if thresholds not met
  if (!repost) {
    repost = [...posts].sort((a, b) => b.views - a.views)[0]
  }
  if (!remixHook) {
    remixHook = [...posts]
      .sort((a, b) => b.views - a.views)
      .find(p => p !== repost) ?? null
  }
  if (!newAngle) {
    newAngle = [...posts]
      .sort((a, b) => b.engagement_rate - a.engagement_rate)
      .find(p => p !== repost && p !== remixHook) ?? null
  }

  const recs: Rec[] = []

  if (repost) {
    const outlier = avgViews > 0 ? (repost.views / avgViews).toFixed(1) : '?'
    recs.push({
      type: 'REPOST',
      post: repost,
      why: `${formatNumber(repost.views)} views · ${repost.engagement_rate.toFixed(1)}% eng · ${outlier}× your average`,
      action: 'Post the same content again this week. Different time, same hook — algorithm will push it to a fresh audience.',
    })
  }

  if (remixHook) {
    recs.push({
      type: 'REMIX HOOK',
      post: remixHook,
      why: `${formatNumber(remixHook.views)} views but only ${remixHook.engagement_rate.toFixed(1)}% eng — reach didn't convert`,
      action: 'Keep the body identical. Rewrite the first line to be a stronger pattern interrupt with a specific number or result.',
    })
  }

  if (newAngle) {
    recs.push({
      type: 'NEW ANGLE',
      post: newAngle,
      why: `${newAngle.engagement_rate.toFixed(1)}% engagement rate but only ${formatNumber(newAngle.views)} views — great content, weak hook`,
      action: 'The body is working. Try a bolder, more specific hook — lead with the result, not the process.',
    })
  }

  return recs
}

export function RecommendationsPanel({ posts }: RecommendationsPanelProps) {
  const recs = buildRecommendations(posts)
  if (!recs.length) return null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-4 w-4 text-yellow-400" />
        <h2 className="text-sm font-semibold text-white">Content Recommendations</h2>
        <span className="text-xs text-zinc-500 ml-1">— updates with each sync</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {recs.map((rec) => {
          const meta = REC_META[rec.type]
          const text = rec.post.title ?? rec.post.caption ?? 'Untitled'

          return (
            <div
              key={rec.type}
              className={cn('rounded-xl border p-4 flex flex-col gap-3', meta.color)}
            >
              {/* Badge */}
              <div>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', BADGE_COLOR[rec.type])}>
                  {meta.emoji} {meta.label}
                </span>
              </div>

              {/* Thumbnail + title */}
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800 border border-zinc-700/50">
                  {rec.post.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rec.post.thumbnail_url}
                      alt={text}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-zinc-600 text-xl">
                      {rec.post.platform === 'youtube' ? '▶' : '📷'}
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-300 font-medium leading-snug line-clamp-3">
                  {text.slice(0, 80)}{text.length > 80 ? '…' : ''}
                </p>
              </div>

              {/* Why */}
              <p className="text-[11px] text-zinc-500 leading-relaxed">{rec.why}</p>

              {/* Action */}
              <div className="border-t border-zinc-700/50 pt-2.5 mt-auto">
                <p className="text-xs text-zinc-300 leading-relaxed">{rec.action}</p>
              </div>

              {/* Link */}
              {rec.post.permalink && (
                <a
                  href={rec.post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  View post →
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
