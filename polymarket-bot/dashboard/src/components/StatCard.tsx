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
  green:  'text-green  border-green/30  bg-green/5',
  red:    'text-red    border-red/30    bg-red/5',
  blue:   'text-blue   border-blue/30   bg-blue/5',
  yellow: 'text-yellow border-yellow/30 bg-yellow/5',
}

export default function StatCard({ label, value, sub, accent = 'green', icon }: Props) {
  return (
    <div className={clsx('rounded-xl border p-3 flex flex-col gap-2', accentMap[accent])}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted uppercase tracking-widest leading-none">{label}</span>
        <span className="opacity-50 scale-90">{icon}</span>
      </div>
      <p className="text-2xl font-display tracking-wide leading-none">{value}</p>
      {sub && <p className="text-[11px] text-muted leading-none">{sub}</p>}
    </div>
  )
}
