import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, AlertTriangle, TrendingUp } from 'lucide-react'
import useFinanceStore from '../store/financeStore'
import { formatCurrency, getUpcomingPayments, getDaysLabel, formatDateShort, getMonthlyCost } from '../utils/dateUtils'

const ACCOUNT_ROUTES = {
  bbva: '/bbva',
  revolut: '/revolut',
  'myinvestor-cartera': '/myinvestor',
  'myinvestor-pension': '/myinvestor',
  traderepublic: '/traderepublic',
}

export default function Dashboard() {
  const accounts = useFinanceStore((s) => s.accounts)
  const subscriptions = useFinanceStore((s) => s.subscriptions)
  const transactions = useFinanceStore((s) => s.transactions)
  const notifications = useFinanceStore((s) => s.notifications)
  const navigate = useNavigate()

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const savingsTotal =
    (accounts.find((a) => a.id === 'traderepublic')?.balance ?? 0) +
    (accounts.find((a) => a.id === 'myinvestor-cartera')?.balance ?? 0) +
    (accounts.find((a) => a.id === 'myinvestor-pension')?.balance ?? 0)
  const liquidBalance = accounts
    .filter((a) => a.type === 'checking')
    .reduce((sum, a) => sum + a.balance, 0)

  const upcoming = getUpcomingPayments(subscriptions, 7)
  const recentTx = transactions.slice(0, 4)
  const unreadAlerts = notifications.filter((n) => !n.read)
  const monthlySubsCost = getMonthlyCost(subscriptions)

  return (
    <div className="px-4 py-4 space-y-5 animate-fade-in">

      {/* ── Alertas de pagos inminentes ── */}
      {unreadAlerts.length > 0 && (
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
            <AlertTriangle size={15} /> {unreadAlerts.length} aviso{unreadAlerts.length > 1 ? 's' : ''} pendiente{unreadAlerts.length > 1 ? 's' : ''}
          </div>
          {unreadAlerts.slice(0, 2).map((n) => (
            <p key={n.id} className="text-xs text-amber-200/80">{n.icon} {n.title}</p>
          ))}
        </div>
      )}

      {/* ── Patrimonio total ── */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-900/60 to-slate-800/60 border border-indigo-800/40 p-5">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Patrimonio total</p>
        <p className="text-4xl font-extrabold text-white mb-3">{formatCurrency(totalBalance)}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-xs text-slate-500">Disponible</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(liquidBalance)}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-xs text-slate-500">Ahorro / Inversión</p>
            <p className="text-lg font-bold text-sky-400">{formatCurrency(savingsTotal)}</p>
          </div>
        </div>
      </div>

      {/* ── Cuentas ── */}
      <section>
        <SectionHeader title="Mis cuentas" onMore={() => {}} />
        <div className="space-y-2">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              onClick={() => navigate(ACCOUNT_ROUTES[account.id] || '/')}
            />
          ))}
          {/* Gastos compartidos */}
          <button
            onClick={() => navigate('/shared')}
            className="w-full flex items-center gap-3 p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 hover:bg-slate-700/60 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-700">
              👫
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Gastos compartidos</p>
              <p className="text-xs text-slate-400">Parking · Coche · Alquiler</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-300">{formatCurrency(721.50)}</p>
              <p className="text-xs text-slate-500">mi parte/mes</p>
            </div>
            <ChevronRight size={16} className="text-slate-500" />
          </button>
        </div>
      </section>

      {/* ── Próximos cobros (7 días) ── */}
      {upcoming.length > 0 && (
        <section>
          <SectionHeader title="Próximos cobros" onMore={() => navigate('/bbva')} />
          <div className="space-y-2">
            {upcoming.map((sub) => {
              const urgent = sub.daysUntil <= 1
              return (
                <div
                  key={sub.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border ${
                    urgent
                      ? 'bg-red-900/25 border-red-700/40'
                      : 'bg-slate-800/50 border-slate-700/40'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: sub.color + '30' }}>
                    {sub.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{sub.name}</p>
                    <p className="text-xs text-slate-400">{formatDateShort(sub.nextDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{formatCurrency(sub.amount)}</p>
                    <p className={`text-xs font-medium ${urgent ? 'text-red-400' : 'text-slate-400'}`}>
                      {getDaysLabel(sub.daysUntil)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Resumen de suscripciones ── */}
      <section>
        <div className="flex items-center gap-2 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/40">
          <TrendingUp size={18} className="text-violet-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Coste mensual en suscripciones</p>
            <p className="text-xs text-slate-400">Gym + Claude + Finetwork + HBO + Higgsfield + ElevenLabs</p>
          </div>
          <p className="text-base font-bold text-violet-400">{formatCurrency(monthlySubsCost)}</p>
        </div>
      </section>

      {/* ── Últimos movimientos ── */}
      {recentTx.length > 0 && (
        <section>
          <SectionHeader title="Últimos movimientos" onMore={() => navigate('/transactions')} />
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} accounts={accounts} />
            ))}
          </div>
        </section>
      )}

      {recentTx.length === 0 && (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-slate-400 text-sm">Añade tu primer movimiento</p>
          <p className="text-slate-500 text-xs mt-1">Pulsa el botón + para registrar ingresos y gastos</p>
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}

function SectionHeader({ title, onMore }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {onMore && (
        <button onClick={onMore} className="text-xs text-indigo-400 flex items-center gap-0.5">
          Ver todo <ChevronRight size={13} />
        </button>
      )}
    </div>
  )
}

function AccountRow({ account, onClick }) {
  const typeLabel = {
    checking: 'Cuenta corriente',
    savings: 'Ahorro',
    investment: 'Inversión',
    pension: 'Pensiones',
  }
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 hover:bg-slate-700/60 transition-colors"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
        style={{ background: account.color + '30' }}
      >
        {account.icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-white">{account.name}</p>
        <p className="text-xs text-slate-400">{typeLabel[account.type] || account.type}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-white">{formatCurrency(account.balance)}</p>
      </div>
      <ChevronRight size={16} className="text-slate-500" />
    </button>
  )
}

function TransactionRow({ tx, accounts }) {
  const account = accounts.find((a) => a.id === tx.accountId)
  const isIncome = tx.type === 'income'
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
      <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-lg">
        {tx.icon || (isIncome ? '💵' : '💸')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{tx.description}</p>
        <p className="text-xs text-slate-400">{account?.name || tx.accountId} · {tx.date}</p>
      </div>
      <p className={`text-sm font-bold ${isIncome ? 'text-emerald-400' : tx.type === 'transfer' ? 'text-sky-400' : 'text-red-400'}`}>
        {isIncome ? '+' : tx.type === 'transfer' ? '↔' : '−'}{formatCurrency(tx.amount)}
      </p>
    </div>
  )
}
