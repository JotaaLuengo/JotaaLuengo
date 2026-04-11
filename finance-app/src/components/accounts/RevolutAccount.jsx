import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, RefreshCw, CreditCard, CheckCircle } from 'lucide-react'
import useFinanceStore from '../../store/financeStore'
import { formatCurrency, formatDate } from '../../utils/dateUtils'

export default function RevolutAccount() {
  const navigate = useNavigate()
  const accounts = useFinanceStore((s) => s.accounts)
  const creditCards = useFinanceStore((s) => s.creditCards)
  const transactions = useFinanceStore((s) => s.transactions)
  const updateAccountBalance = useFinanceStore((s) => s.updateAccountBalance)
  const markCreditChargePaid = useFinanceStore((s) => s.markCreditChargePaid)

  const account = accounts.find((a) => a.id === 'revolut')
  const card = creditCards.find((c) => c.accountId === 'revolut')
  const revTx = transactions.filter((t) => t.accountId === 'revolut').slice(0, 8)

  const [editBalance, setEditBalance] = useState(false)
  const [newBalance, setNewBalance] = useState(account?.balance?.toString() || '')

  const totalOwed = card?.pendingCharges
    .filter((c) => !c.paid)
    .reduce((s, c) => s + c.amount, 0) ?? 0

  const handleBalanceUpdate = () => {
    const val = parseFloat(newBalance.replace(',', '.'))
    if (!isNaN(val)) { updateAccountBalance('revolut', val); setEditBalance(false) }
  }

  const MONTH_LABELS = {
    '2026-03': 'Marzo 2026',
    '2026-04': 'Abril 2026',
    '2026-05': 'Mayo 2026',
  }
  const DUE_LABELS = {
    '2026-04': 'Pagar en abril',
    '2026-05': 'Pagar en mayo',
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="mx-4 mt-4 rounded-3xl p-5" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid #2d3139' }}>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full bg-white/10">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <span className="text-white/80 text-sm font-medium">Revolut · Vacaciones</span>
        </div>
        <p className="text-white/70 text-sm mb-1">Saldo disponible</p>
        {editBalance ? (
          <div className="flex gap-2 items-center">
            <input type="number" step="0.01" value={newBalance} onChange={(e) => setNewBalance(e.target.value)}
              className="bg-white/20 text-white text-2xl font-bold rounded-xl px-3 py-1 w-40 focus:outline-none" autoFocus />
            <button onClick={handleBalanceUpdate} className="text-white/80 bg-white/20 rounded-lg px-3 py-1 text-sm">✓</button>
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
        {totalOwed > 0 && (
          <div className="mt-3 bg-red-900/30 border border-red-700/40 rounded-xl px-3 py-2">
            <p className="text-red-300 text-xs">⚠️ Deuda pendiente tarjeta: <span className="font-bold">{formatCurrency(totalOwed)}</span></p>
          </div>
        )}
      </div>

      {/* Tarjeta de crédito */}
      {card && (
        <div className="px-4 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-slate-400" />
            <h3 className="text-base font-bold text-white">Tarjeta de crédito</h3>
          </div>
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/40 p-4 mb-3">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-slate-400">Límite</span>
              <span className="text-xs font-semibold text-white">{formatCurrency(card.limit)}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-xs text-slate-400">Pendiente total</span>
              <span className="text-sm font-bold text-red-400">{formatCurrency(totalOwed)}</span>
            </div>
            {/* Barra de uso */}
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-red-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min((totalOwed / card.limit) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{((totalOwed / card.limit) * 100).toFixed(1)}% del límite usado</p>
          </div>

          <div className="space-y-2">
            {card.pendingCharges.map((charge) => (
              <div
                key={charge.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  charge.paid
                    ? 'bg-slate-800/30 border-slate-700/30 opacity-60'
                    : 'bg-slate-800/60 border-slate-700/40'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${charge.paid ? 'bg-emerald-900/40' : 'bg-red-900/30'}`}>
                  {charge.paid ? <CheckCircle size={18} className="text-emerald-400" /> : <CreditCard size={18} className="text-red-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{charge.concept}</p>
                  <p className="text-xs text-slate-400">
                    {MONTH_LABELS[charge.billingMonth] || charge.billingMonth} ·{' '}
                    <span className={charge.paid ? 'text-emerald-400' : 'text-amber-400'}>
                      {charge.paid ? 'Pagado' : DUE_LABELS[charge.dueMonth] || charge.dueMonth}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${charge.paid ? 'text-slate-400' : 'text-red-400'}`}>
                    {formatCurrency(charge.amount)}
                  </p>
                  {!charge.paid && (
                    <button
                      onClick={() => markCreditChargePaid(card.id, charge.id)}
                      className="text-[10px] bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded-lg font-semibold transition-colors"
                    >
                      Pagado
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movimientos */}
      {revTx.length > 0 && (
        <div className="px-4 mt-5">
          <h3 className="text-base font-bold text-white mb-3">Últimos movimientos</h3>
          <div className="space-y-2">
            {revTx.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <span className="text-lg">{tx.icon || '💸'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{tx.description}</p>
                  <p className="text-xs text-slate-400">{tx.date}</p>
                </div>
                <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="h-6" />
    </div>
  )
}
