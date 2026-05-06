'use client'

import { useState } from 'react'
import { formatNumber } from '@/lib/analytics'
import { thumb } from '@/lib/thumb'
import { ContentPost } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'

interface PostsGridProps {
  posts: ContentPost[]
  total: number
  onSortChange: (sort: string) => void
  onLoadMore: () => void
  loading?: boolean
}

const PLATFORM_STYLE: Record<string, { label: string; color: string }> = {
  instagram: { label: 'IG', color: 'bg-pink-600/20 text-pink-400 border border-pink-600/30' },
  youtube:   { label: 'YT', color: 'bg-red-600/20 text-red-400 border border-red-600/30' },
}

type Recommendation = 'REPOST' | 'REMIX HOOK' | 'NEW ANGLE' | null

function getRecommendation(post: ContentPost, avgViews: number, avgEngagement: number): Recommendation {
  if (avgViews === 0) return null
  const viewsRatio = post.views / avgViews
  const engRatio   = avgEngagement > 0 ? post.engagement_rate / avgEngagement : 0

  if (viewsRatio >= 1.5 && engRatio >= 1.5) return 'REPOST'
  if (viewsRatio >= 1.2 && engRatio < 1.0) return 'REMIX HOOK'
  if (engRatio   >= 1.2 && viewsRatio < 1.0) return 'NEW ANGLE'
  return null
}

const REC_STYLE: Record<string, { label: string; color: string; tip: string }> = {
  'REPOST':     { label: '🔁 Repost',     color: 'bg-green-500/15 text-green-400 border-green-600/30', tip: 'Hook + body both worked. Repost as-is.' },
  'REMIX HOOK': { label: '🎣 Remix Hook', color: 'bg-amber-500/15 text-amber-400 border-amber-600/30', tip: 'High reach but low engagement. Keep the hook, rewrite the body.' },
  'NEW ANGLE':  { label: '↗ New Angle',  color: 'bg-blue-500/15  text-blue-400  border-blue-600/30',  tip: 'Good engagement but low views. Try a stronger hook from a new angle.' },
}

export function PostsGrid({ posts, total, onSortChange, onLoadMore, loading }: PostsGridProps) {
  const [sort, setSort] = useState('views')
  const [tooltip, setTooltip] = useState<string | null>(null)

  function handleSort(val: string | null) {
    if (!val) return
    setSort(val)
    onSortChange(val)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })

  // Compute averages for recommendations + outlier score
  const avgViews      = posts.length ? posts.reduce((a, p) => a + p.views, 0) / posts.length : 0
  const avgEngagement = posts.length ? posts.reduce((a, p) => a + p.engagement_rate, 0) / posts.length : 0

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <h2 className="text-sm font-semibold text-white">Top Performing Posts</h2>
        <Select value={sort} onValueChange={handleSort}>
          <SelectTrigger className="w-44 h-8 text-xs bg-zinc-800 border-zinc-700 text-zinc-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs">
            <SelectItem value="views">Views</SelectItem>
            <SelectItem value="likes">Likes</SelectItem>
            <SelectItem value="shares">Shares</SelectItem>
            <SelectItem value="saves">Saves</SelectItem>
            <SelectItem value="engagement_rate">Engagement Rate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {posts.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-zinc-600 text-sm">
          No posts found — run a sync to load your data
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Post</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Views</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Likes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Eng%</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Outlier</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {posts.map((post, i) => {
                  const style  = PLATFORM_STYLE[post.platform] ?? PLATFORM_STYLE.instagram
                  const text   = post.title ?? post.caption ?? 'Untitled'
                  const rec    = getRecommendation(post, avgViews, avgEngagement)
                  const recMeta = rec ? REC_STYLE[rec] : null
                  const outlier = avgViews > 0 ? (post.views / avgViews) : 0
                  const outlierLabel = outlier.toFixed(1) + '×'
                  const outlierColor = outlier >= 2 ? 'text-green-400' : outlier >= 1 ? 'text-zinc-300' : 'text-zinc-600'

                  return (
                    <tr key={post.post_id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-4 py-3 text-zinc-600 text-xs">{i + 1}</td>

                      {/* Thumbnail + title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* 72px thumbnail */}
                          <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800 border border-zinc-700/50">
                            {post.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumb(post.thumbnail_url) ?? ''}
                                alt={text}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-zinc-700 text-xs">
                                {post.platform === 'youtube' ? '▶' : '📷'}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${style.color}`}>
                                {style.label}
                              </span>
                            </div>
                            {post.permalink ? (
                              <a
                                href={post.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-zinc-300 hover:text-white font-medium leading-snug line-clamp-2 max-w-[240px]"
                              >
                                {text.slice(0, 100)}{text.length > 100 ? '…' : ''}
                              </a>
                            ) : (
                              <span className="block text-xs text-zinc-300 font-medium leading-snug line-clamp-2 max-w-[240px]">
                                {text.slice(0, 100)}{text.length > 100 ? '…' : ''}
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-600">{formatDate(post.published_at)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right text-zinc-300 tabular-nums text-xs">{formatNumber(post.views)}</td>
                      <td className="px-4 py-3 text-right text-zinc-300 tabular-nums text-xs hidden sm:table-cell">{formatNumber(post.likes)}</td>
                      <td className="px-4 py-3 text-right text-zinc-300 tabular-nums text-xs">{post.engagement_rate.toFixed(1)}%</td>

                      {/* Outlier score */}
                      <td className={cn('px-4 py-3 text-right tabular-nums text-xs font-semibold', outlierColor)}>
                        {avgViews > 0 ? outlierLabel : '—'}
                      </td>

                      {/* Recommendation badge */}
                      <td className="px-4 py-3 text-right">
                        {recMeta ? (
                          <div className="relative inline-block">
                            <button
                              onMouseEnter={() => setTooltip(`${post.post_id}_rec`)}
                              onMouseLeave={() => setTooltip(null)}
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap',
                                recMeta.color
                              )}
                            >
                              {recMeta.label}
                            </button>
                            {tooltip === `${post.post_id}_rec` && (
                              <div className="absolute right-0 bottom-full mb-1 z-10 w-48 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 shadow-lg">
                                {recMeta.tip}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-700 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {posts.length < total && (
            <div className="border-t border-zinc-800 px-5 py-3">
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading…' : `Load more (${total - posts.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
