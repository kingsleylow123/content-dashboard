'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { ChartPoint, formatNumber } from '@/lib/analytics'

interface ViewsReachChartProps {
  data: ChartPoint[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ViewsReachChart({ data }: ViewsReachChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-600 text-sm">
        No data for this period
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#a1a1aa', paddingTop: 8 }}
        />
        <Area type="monotone" dataKey="views" name="Views" stroke="#6366f1" fill="url(#gViews)" strokeWidth={2} />
        <Area type="monotone" dataKey="reach" name="Reach" stroke="#a855f7" fill="url(#gReach)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
