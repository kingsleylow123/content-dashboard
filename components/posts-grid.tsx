'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatNumber } from '@/lib/analytics'
import { ContentPost } from '@/lib/supabase'
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
  youtube: { label: 'YT', color: 'bg-red-600/20 text-red-400 border border-red-600/30' },
}

export function PostsGrid({ posts, total, onSortChange, onLoadMore, loading }: PostsGridProps) {
  const [sort, setSort] = useState('views')

  function handleSort(val: string | null) {
    if (!val) return
    setSort(val)
    onSortChange(val)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <h2 className="text-sm font-semibold text-white">Top Performing Posts</h2>
        <Select value={sort} onValueChange={handleSort}>
          <SelectTrigger className="w-40 h-8 text-xs bg-zinc-800 border-zinc-700 text-zinc-300">
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
          No posts found — add your API credentials and run a sync
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider w-8">#</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Post</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Views</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Likes</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Shares</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Eng%</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {posts.map((post, i) => {
                  const style = PLATFORM_STYLE[post.platform] ?? PLATFORM_STYLE.instagram
                  const text = post.title ?? post.caption ?? 'Untitled'
                  return (
                    <tr key={post.post_id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-3 text-zinc-600 text-xs">{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {post.thumbnail_url ? (
                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                              <Image
                                src={post.thumbnail_url}
                                alt={text}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-zinc-800" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${style.color}`}>
                                {style.label}
                              </span>
                              {post.permalink && (
                                <a
                                  href={post.permalink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate text-zinc-200 hover:text-white font-medium max-w-[280px]"
                                >
                                  {text.slice(0, 60)}{text.length > 60 ? '…' : ''}
                                </a>
                              )}
                              {!post.permalink && (
                                <span className="truncate text-zinc-200 font-medium max-w-[280px]">
                                  {text.slice(0, 60)}{text.length > 60 ? '…' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-zinc-300 tabular-nums">{formatNumber(post.views)}</td>
                      <td className="px-5 py-3 text-right text-zinc-300 tabular-nums">{formatNumber(post.likes)}</td>
                      <td className="px-5 py-3 text-right text-zinc-300 tabular-nums">{formatNumber(post.shares)}</td>
                      <td className="px-5 py-3 text-right text-zinc-300 tabular-nums">{post.engagement_rate.toFixed(1)}%</td>
                      <td className="px-5 py-3 text-right text-zinc-500 text-xs tabular-nums">{formatDate(post.published_at)}</td>
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
