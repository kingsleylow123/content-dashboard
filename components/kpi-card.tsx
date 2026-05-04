'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { KpiMetric, formatNumber } from '@/lib/analytics'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  metric: KpiMetric
  format?: 'number' | 'percent'
  unavailable?: boolean
}

export function KpiCard({ label, metric, format = 'number', unavailable = false }: KpiCardProps) {
  const { current, change, sparkline } = metric

  const displayValue = unavailable ? '—' : format === 'percent'
    ? `${current.toFixed(1)}%`
    : formatNumber(current)

  const changePositive = change > 0
  const changeNegative = change < 0

  const sparkData = sparkline.map((v, i) => ({ i, v }))

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-3">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>

      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-bold text-white tabular-nums">{displayValue}</span>

        {!unavailable && (
          <div className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
            changePositive ? 'bg-green-500/15 text-green-400' :
            changeNegative ? 'bg-red-500/15 text-red-400' :
            'bg-zinc-700 text-zinc-400'
          )}>
            {changePositive ? <TrendingUp className="h-3 w-3" /> :
             changeNegative ? <TrendingDown className="h-3 w-3" /> :
             <Minus className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>

      {sparkline.length > 1 && !unavailable ? (
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={changePositive ? '#22c55e' : changeNegative ? '#ef4444' : '#71717a'}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-10" />
      )}
    </div>
  )
}
