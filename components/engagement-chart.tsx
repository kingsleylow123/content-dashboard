'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { ChartPoint, formatNumber } from '@/lib/analytics'

interface EngagementChartProps {
  data: ChartPoint[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function EngagementChart({ data }: EngagementChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-600 text-sm">
        No data for this period
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatNumber}
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
          labelStyle={{ color: '#a1a1aa', fontSize: 12 }}
          itemStyle={{ color: '#fff', fontSize: 12 }}
          labelFormatter={(label: unknown) => formatDate(label as string)}
          formatter={(val: unknown) => formatNumber(val as number)}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa', paddingTop: 8 }} />
        <Bar dataKey="likes" name="Likes" fill="#e1306c" radius={[2, 2, 0, 0]} />
        <Bar dataKey="comments" name="Comments" fill="#6366f1" radius={[2, 2, 0, 0]} />
        <Bar dataKey="shares" name="Shares" fill="#22c55e" radius={[2, 2, 0, 0]} />
        <Bar dataKey="saves" name="Saves" fill="#f59e0b" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
