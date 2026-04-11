import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import useFinanceStore from '../../store/financeStore'
import {
  formatCurrency, getNextPaymentDate, getDaysUntilPayment, getDaysLabel, formatDate, getMonthlyCost
} from '../../utils/dateUtils'

export default function BBVAAccount() {
  const navigate = useNavigate()
  const accounts = useFinanceStore((s) => s.accounts)
  const subscriptions = useFinanceStore((s) => s.subscriptions)
  const transactions = useFinanceStore((s) => s.transactions)
  const updateAccountBalance = useFinanceStore((s) => s.updateAccountBalance)
  const markSubscriptionPaid = useFinanceStore((s) => s.markSubscriptionPaid)

  const account = accounts.find((a) => a.id === 'bbva')
  const bbvaSubs = subscriptions.filter((s) => s.accountId === 'bbva')
  const bbvaTx = transactions.filter((t) => t.accountId === 'bbva').slice(0, 10)
  const [editBalance, setEditBalance] = useState(false)
  const [newBalance, setNewBalance] = useState(account?.balance?.toString() || '')
  const monthlyCost = getMonthlyCost(bbvaSubs)

  const handleBalanceUpdate = () => {
    const val = parseFloat(newBalance.replace(',', '.'))
    if (!isNaN(val)) {
      updateAccountBalance('bbva', val)
      setEditBalance(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Card */}
      <div className="mx-4 mt-4 rounded-3xl p-5" style={{ background: 'linear-gradient(135deg, #004481 0%, #0066cc 100%)' }}>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full bg-white/10">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <span className="text-white/80 text-sm font-medium">BBVA · Cuenta principal</span>
        </div>
        <p className="text-white/70 text-sm mb-1">Saldo actual</p>
        {editBalance ? (
          <div className="flex gap-2 items-center">
            <input
              type="number"
              step="0.01"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="bg-white/20 text-white text-2xl font-bold rounded-xl px-3 py-1 w-40 focus:outline-none"
              autoFocus
            />
            <button onClick={handleBalanceUpdate} className="text-white/80 bg-white/20 rounded-lg px-3 py-1 text-sm">
              ✓ Guardar
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <p className="text-4xl font-extrabold text-white">{formatCurrency(account?.balance ?? 0)}</p>
            <button onClick={() => { setEditBalance(true); setNewBalance(account?.balance?.toString()) }}
              className="mb-1 p-1.5 rounded-full bg-white/10 hover:bg-white/20">
              <RefreshCw size={14} className="text-white/70" />
            </button>
          </div>
        )}
        <div className="mt-4 flex gap-3">
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/60 text-[10px]">Suscripciones/mes</p>
            <p className="text-white font-bold text-sm">{formatCurrency(monthlyCost)}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/60 text-[10px]">Suscripciones activas</p>
            <p className="text-white font-bold text-sm">{bbvaSubs.filter((s) => s.active).length}</p>
          </div>
        </div>
      </div>

      {/* Suscripciones */}
      <div className="px-4 mt-5">
        <h3 className="text-base font-bold text-white mb-3">Suscripciones y cuotas</h3>
        <div className="space-y-2">
          {bbvaSubs.map((sub) => {
            const nextDate = getNextPaymentDate(sub)
            const daysUntil = getDaysUntilPayment(sub)
            const urgent = daysUntil !== null && daysUntil <= 1
            const soon = daysUntil !== null && daysUntil <= 3
            return (
              <div
                key={sub.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  urgent ? 'bg-red-900/25 border-red-700/40'
                  : soon ? 'bg-amber-900/20 border-amber-700/30'
                  : 'bg-slate-800/60 border-slate-700/40'
                }`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: sub.color + '25' }}>
                  {sub.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{sub.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400">
                      {sub.frequency === 'every_4_weeks' ? 'Cada 4 semanas' : `Día ${sub.dayOfMonth} de cada mes`}
                    </p>
                    {nextDate && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        urgent ? 'bg-red-900/60 text-red-300'
                        : soon ? 'bg-amber-900/60 text-amber-300'
                        : 'bg-slate-700 text-slate-400'
                      }`}>
                        {getDaysLabel(daysUntil)} · {formatDate(nextDate, 'd MMM')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">{formatCurrency(sub.amount)}</p>
                  {sub.frequency === 'every_4_weeks' && (
                    <p className="text-[10px] text-slate-500">último: {formatDate(sub.lastPaymentDate, 'd MMM')}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Últimos movimientos */}
        {bbvaTx.length > 0 && (
          <div className="mt-5">
            <h3 className="text-base font-bold text-white mb-3">Últimos movimientos</h3>
            <div className="space-y-2">
              {bbvaTx.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-lg">{tx.icon || '💸'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{tx.description}</p>
                    <p className="text-xs text-slate-400">{tx.date}</p>
                  </div>
                  <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-400' : tx.type === 'transfer' ? 'text-sky-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '↔' : '−'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="h-6" />
    </div>
  )
}
