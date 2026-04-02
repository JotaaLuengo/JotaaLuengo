import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import StatCard from './components/StatCard'
import PnLChart from './components/PnLChart'
import TradesTable from './components/TradesTable'
import EventLog from './components/EventLog'
import WinRateBar from './components/WinRateBar'

// ---- tiny SVG icons -------------------------------------------------------
const IconWallet   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/><circle cx="16" cy="14" r="1.5" fill="currentColor"/></svg>
const IconTrend    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const IconActivity = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
const IconTarget   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
const IconRefresh  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-2-7.9L23 10"/></svg>
// ---------------------------------------------------------------------------

function useSeed() {
  const handleSeed = async () => {
    await api.seed()
    window.location.reload()
  }
  return handleSeed
}

export default function App() {
  const { data: summary, isLoading: loadSum } = useQuery({ queryKey: ['summary'], queryFn: api.summary })
  const { data: pnl    = []                  } = useQuery({ queryKey: ['pnl'],     queryFn: api.pnl     })
  const { data: trades = []                  } = useQuery({ queryKey: ['trades'],  queryFn: api.trades  })
  const { data: events = []                  } = useQuery({ queryKey: ['events'],  queryFn: api.events  })

  const seed = useSeed()
  const pnlColor = (summary?.total_pnl ?? 0) >= 0 ? 'text-green' : 'text-red'

  return (
    <div className="min-h-screen bg-bg text-slate-200 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl tracking-widest text-white">POLYMARKET BOT</h1>
          <p className="text-muted text-sm mt-0.5">Live trading dashboard · auto-refresh every 15s</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={seed}
            className="flex items-center gap-1.5 text-xs text-muted border border-border px-3 py-1.5 rounded-lg hover:border-muted transition-colors"
          >
            <IconRefresh /> Seed demo data
          </button>
          <span className="flex items-center gap-2 text-xs bg-green/10 text-green border border-green/30 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            Live
          </span>
        </div>
      </header>

      {/* Stat cards */}
      {loadSum ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Balance"
            value={`$${(summary?.balance ?? 0).toFixed(2)}`}
            sub="USDC available"
            accent="green"
            icon={<IconWallet />}
          />
          <StatCard
            label="Total PnL"
            value={`${(summary?.total_pnl ?? 0) >= 0 ? '+' : ''}$${(summary?.total_pnl ?? 0).toFixed(2)}`}
            sub="vs. initial balance"
            accent={(summary?.total_pnl ?? 0) >= 0 ? 'green' : 'red'}
            icon={<IconTrend />}
          />
          <StatCard
            label="Open Positions"
            value={String(summary?.open_trades ?? 0)}
            sub={`of ${summary?.total_trades ?? 0} total trades`}
            accent="blue"
            icon={<IconActivity />}
          />
          <StatCard
            label="Win Rate"
            value={`${(summary?.win_rate ?? 0).toFixed(1)}%`}
            sub="closed trades"
            accent="yellow"
            icon={<IconTarget />}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* PnL chart — 2/3 width */}
        <div className="md:col-span-2 bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium text-muted uppercase tracking-widest mb-4">
            Balance over time
          </h2>
          <PnLChart data={pnl} />
        </div>

        {/* Win rate panel — 1/3 width */}
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-6">
          <h2 className="text-sm font-medium text-muted uppercase tracking-widest">
            Performance
          </h2>
          <WinRateBar
            winRate={summary?.win_rate ?? 0}
            total={(summary?.total_trades ?? 0) - (summary?.open_trades ?? 0)}
          />
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Open trades</span>
              <span className="text-blue font-medium">{summary?.open_trades ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Total trades</span>
              <span className="font-medium">{summary?.total_trades ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Total PnL</span>
              <span className={`font-medium ${pnlColor}`}>
                {(summary?.total_pnl ?? 0) >= 0 ? '+' : ''}${(summary?.total_pnl ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trades table */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-muted uppercase tracking-widest mb-4">
          Trade History
        </h2>
        <TradesTable trades={trades} />
      </div>

      {/* Event log */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium text-muted uppercase tracking-widest mb-4">
          Bot Event Log
        </h2>
        <EventLog events={events} />
      </div>
    </div>
  )
}
