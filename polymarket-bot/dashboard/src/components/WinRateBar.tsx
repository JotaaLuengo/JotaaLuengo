interface Props { winRate: number; total: number }

export default function WinRateBar({ winRate, total }: Props) {
  const clamped = Math.min(Math.max(winRate, 0), 100)
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted">
        <span>Win rate</span>
        <span>{total} closed trades</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-green rounded-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-green font-medium">{clamped.toFixed(1)}% wins</span>
        <span className="text-red">{(100 - clamped).toFixed(1)}% losses</span>
      </div>
    </div>
  )
}
