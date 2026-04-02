import clsx from 'clsx'
import type { BotEvent } from '../types'

interface Props { events: BotEvent[] }

const levelStyle: Record<string, string> = {
  INFO:    'text-blue',
  WARNING: 'text-yellow',
  ERROR:   'text-red',
  DEBUG:   'text-muted',
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export default function EventLog({ events }: Props) {
  if (!events.length) {
    return <p className="text-muted text-sm py-6 text-center">No events yet</p>
  }

  return (
    <div className="space-y-1 max-h-72 overflow-y-auto font-mono text-xs">
      {events.map(e => (
        <div key={e.id} className="flex gap-3 py-1 border-b border-border/50 last:border-0">
          <span className="text-muted shrink-0">{fmtTime(e.timestamp)}</span>
          <span className={clsx('shrink-0 w-16', levelStyle[e.level] ?? 'text-muted')}>
            [{e.level}]
          </span>
          <span className="text-slate-300 break-all">{e.message}</span>
        </div>
      ))}
    </div>
  )
}
