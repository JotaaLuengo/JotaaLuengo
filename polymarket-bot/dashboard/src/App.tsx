import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import StatCard from './components/StatCard'
import PnLChart from './components/PnLChart'
import TradesTable from './components/TradesTable'
import EventLog from './components/EventLog'
import WinRateBar from './components/WinRateBar'
import clsx from 'clsx'

// ---- icons ----------------------------------------------------------------
const IconDashboard = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
const IconTrades   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const IconLog      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>
const IconWallet   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/><circle cx="16" cy="14" r="1.5" fill="currentColor"/></svg>
const IconTrend    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const IconActivity = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
const IconTarget   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
const IconRefresh  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-2-7.9L23 10"/></svg>
// ---------------------------------------------------------------------------

type Tab = 'overview' | 'trades' | 'log'

export default function App() {
  const [tab, setTab] = useState<Tab>('overview')

  const { data: summary, isLoading } = useQuery({ queryKey: ['summary'], queryFn: api.summary })
  const { data: pnl     = []       } = useQuery({ queryKey: ['pnl'],     queryFn: api.pnl     })
  const { data: trades  = []       } = useQuery({ queryKey: ['trades'],  queryFn: api.trades  })
  const { data: events  = []       } = useQuery({ queryKey: ['events'],  queryFn: api.events  })

  const pnlPos = (summary?.total_pnl ?? 0) >= 0

  async function seed() {
    await api.seed()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest text-white">POLYMARKET BOT</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={seed}
            className="flex items-center gap-1 text-xs text-muted border border-border px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            <IconRefresh /> Demo
          </button>
          <span className="flex items-center gap-1.5 text-xs bg-green/10 text-green border border-green/30 px-2.5 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            Live
          </span>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4 space-y-4">

        {/* Stat cards — 2×2 on mobile, 4×1 on md+ */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Balance"   value={`$${(summary?.balance ?? 0).toFixed(2)}`}   sub="USDC" accent="green"  icon={<IconWallet />} />
            <StatCard label="PnL"       value={`${pnlPos ? '+' : ''}$${(summary?.total_pnl ?? 0).toFixed(2)}`} sub="total" accent={pnlPos ? 'green' : 'red'} icon={<IconTrend />} />
            <StatCard label="Posiciones" value={String(summary?.open_trades ?? 0)}          sub={`de ${summary?.total_trades ?? 0}`} accent="blue" icon={<IconActivity />} />
            <StatCard label="Win Rate"  value={`${(summary?.win_rate ?? 0).toFixed(1)}%`}  sub="cerradas" accent="yellow" icon={<IconTarget />} />
          </div>
        )}

        {/* Tab content */}
        {tab === 'overview' && (
          <>
            {/* PnL Chart */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs text-muted uppercase tracking-widest mb-3">Balance en el tiempo</p>
              <PnLChart data={pnl} />
            </div>

            {/* Win rate */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs text-muted uppercase tracking-widest mb-4">Rendimiento</p>
              <WinRateBar
                winRate={summary?.win_rate ?? 0}
                total={(summary?.total_trades ?? 0) - (summary?.open_trades ?? 0)}
              />
            </div>
          </>
        )}

        {tab === 'trades' && (
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-muted uppercase tracking-widest mb-4">Historial de trades</p>
            <TradesTable trades={trades} />
          </div>
        )}

        {tab === 'log' && (
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-muted uppercase tracking-widest mb-4">Log del bot</p>
            <EventLog events={events} />
          </div>
        )}
      </main>

      {/* Bottom navigation — fixed, full width */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex">
        {([
          { id: 'overview', label: 'Overview', icon: <IconDashboard /> },
          { id: 'trades',   label: 'Trades',   icon: <IconTrades />   },
          { id: 'log',      label: 'Log',      icon: <IconLog />      },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors',
              tab === item.id ? 'text-green' : 'text-muted'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
