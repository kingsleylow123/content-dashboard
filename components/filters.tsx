'use client'

import { cn } from '@/lib/utils'

export type PlatformFilter = 'all' | 'instagram' | 'youtube'
export type DaysFilter = 7 | 14 | 30 | 90

interface FiltersProps {
  platform: PlatformFilter
  days: DaysFilter
  onPlatformChange: (p: PlatformFilter) => void
  onDaysChange: (d: DaysFilter) => void
}

const platforms: { value: PlatformFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
]

const dayOptions: DaysFilter[] = [7, 14, 30, 90]

export function Filters({ platform, days, onPlatformChange, onDaysChange }: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {platforms.map(p => (
          <button
            key={p.value}
            onClick={() => onPlatformChange(p.value)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-all',
              platform === p.value
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {dayOptions.map(d => (
          <button
            key={d}
            onClick={() => onDaysChange(d)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-all',
              days === d
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {d}d
          </button>
        ))}
      </div>
    </div>
  )
}
