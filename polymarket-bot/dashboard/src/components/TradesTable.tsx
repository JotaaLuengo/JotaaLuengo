import clsx from 'clsx'
import type { Trade } from '../types'

interface Props { trades: Trade[] }

const statusStyle: Record<string, string> = {
  open:   'text-blue  bg-blue/10',
  won:    'text-green bg-green/10',
  lost:   'text-red   bg-red/10',
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleString('en', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function TradesTable({ trades }: Props) {
  if (!trades.length) {
    return <p className="text-muted text-sm py-6 text-center">No trades yet</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted text-xs uppercase tracking-wider border-b border-border">
            <th className="pb-3 pr-4">Time</th>
            <th className="pb-3 pr-4">Market</th>
            <th className="pb-3 pr-4">Outcome</th>
            <th className="pb-3 pr-4">Side</th>
            <th className="pb-3 pr-4 text-right">Price</th>
            <th className="pb-3 pr-4 text-right">Size</th>
            <th className="pb-3 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {trades.map(t => (
            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="py-3 pr-4 text-muted whitespace-nowrap">{fmtDate(t.timestamp)}</td>
              <td className="py-3 pr-4 max-w-[220px] truncate" title={t.market}>
                {t.market}
                {t.dry_run === 1 && (
                  <span className="ml-2 text-[10px] text-yellow bg-yellow/10 px-1.5 py-0.5 rounded">
                    DRY
                  </span>
                )}
              </td>
              <td className="py-3 pr-4 font-medium">{t.outcome}</td>
              <td className={clsx('py-3 pr-4 font-medium', t.side === 'BUY' ? 'text-green' : 'text-red')}>
                {t.side}
              </td>
              <td className="py-3 pr-4 text-right tabular-nums">{t.price.toFixed(3)}</td>
              <td className="py-3 pr-4 text-right tabular-nums">${t.size_usdc.toFixed(2)}</td>
              <td className="py-3 text-right">
                <span className={clsx(
                  'text-xs px-2 py-0.5 rounded-full capitalize',
                  statusStyle[t.status] ?? 'text-muted bg-border',
                )}>
                  {t.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
