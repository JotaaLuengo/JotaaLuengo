import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { PnlSnapshot } from '../types'

interface Props {
  data: PnlSnapshot[]
}

function fmt(ts: string) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
}

export default function PnLChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-sm">
        No data yet
      </div>
    )
  }

  const initial = data[0]?.balance ?? 0
  const chartData = data.map(d => ({
    time: fmt(d.timestamp),
    balance: +d.balance.toFixed(2),
    pnl: +(d.balance - initial).toFixed(2),
  }))

  const isProfit = (chartData.at(-1)?.pnl ?? 0) >= 0
  const lineColor = isProfit ? '#00e87a' : '#ff4d6d'

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={lineColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1c2030" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#5a6380', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#5a6380', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `$${v}`}
        />
        <Tooltip
          contentStyle={{ background: '#0e1117', border: '1px solid #1c2030', borderRadius: 8 }}
          labelStyle={{ color: '#5a6380', fontSize: 11 }}
          itemStyle={{ color: lineColor }}
          formatter={(v: number) => [`$${v}`, 'Balance']}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke={lineColor}
          strokeWidth={2}
          fill="url(#pnlGrad)"
          dot={false}
          activeDot={{ r: 4, fill: lineColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
