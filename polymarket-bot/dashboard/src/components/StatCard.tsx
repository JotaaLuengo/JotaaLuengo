import { type ReactNode } from 'react'
import clsx from 'clsx'

interface Props {
  label: string
  value: string
  sub?: string
  accent?: 'green' | 'red' | 'blue' | 'yellow'
  icon: ReactNode
}

const accentMap = {
  green:  'text-green border-green/30 bg-green/5',
  red:    'text-red   border-red/30   bg-red/5',
  blue:   'text-blue  border-blue/30  bg-blue/5',
  yellow: 'text-yellow border-yellow/30 bg-yellow/5',
}

export default function StatCard({ label, value, sub, accent = 'green', icon }: Props) {
  return (
    <div className={clsx(
      'rounded-xl border p-5 flex flex-col gap-3',
      accentMap[accent],
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted uppercase tracking-widest">{label}</span>
        <span className="opacity-60">{icon}</span>
      </div>
      <p className="text-3xl font-display tracking-wide">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  )
}
