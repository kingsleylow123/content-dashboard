'use client'

import { cn } from '@/lib/utils'

export type PlatformFilter = 'all' | 'instagram' | 'youtube'
export type DaysFilter = 7 | 14 | 30 | 90

interface FiltersProps {
  platform: PlatformFilter
  days: DaysFilter
  includeShorts: boolean
  onPlatformChange: (p: PlatformFilter) => void
  onDaysChange: (d: DaysFilter) => void
  onShortsToggle: (v: boolean) => void
}

const platforms: { value: PlatformFilter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube',   label: 'YouTube' },
]

const dayOptions: DaysFilter[] = [7, 14, 30, 90]

export function Filters({
  platform, days, includeShorts,
  onPlatformChange, onDaysChange, onShortsToggle,
}: FiltersProps) {
  const showShortsToggle = platform === 'youtube' || platform === 'all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Platform */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {platforms.map(p => (
          <button
            key={p.value}
            onClick={() => onPlatformChange(p.value)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-all',
              platform === p.value ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Time range */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {dayOptions.map(d => (
          <button
            key={d}
            onClick={() => onDaysChange(d)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-all',
              days === d ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Shorts toggle — only visible when YouTube is in scope */}
      {showShortsToggle && (
        <button
          onClick={() => onShortsToggle(!includeShorts)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
            includeShorts
              ? 'border-red-700/50 bg-red-950/30 text-red-400'
              : 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300'
          )}
        >
          <span className="text-base leading-none">▶</span>
          Shorts {includeShorts ? 'On' : 'Off'}
        </button>
      )}
    </div>
  )
}
