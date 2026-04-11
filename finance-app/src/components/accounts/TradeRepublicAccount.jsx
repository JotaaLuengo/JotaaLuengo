import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, RefreshCw, TrendingUp, Plus, Minus } from 'lucide-react'
import useFinanceStore from '../../store/financeStore'
import { formatCurrency } from '../../utils/dateUtils'

export default function TradeRepublicAccount() {
  const navigate = useNavigate()
  const accounts = useFinanceStore((s) => s.accounts)
  const transactions = useFinanceStore((s) => s.transactions)
  const updateAccountBalance = useFinanceStore((s) => s.updateAccountBalance)
  const addTransaction = useFinanceStore((s) => s.addTransaction)

  const account = accounts.find((a) => a.id === 'traderepublic')
  const trTx = transactions.filter((t) =>
    t.accountId === 'traderepublic' || t.toAccountId === 'traderepublic'
  ).slice(0, 8)

  const [editBalance, setEditBalance] = useState(false)
  const [newBalance, setNewBalance] = useState(account?.balance?.toString() || '')
  const [modal, setModal] = useState(null) // 'deposit' | 'withdraw' | null
  const [amount, setAmount] = useState('')

  const TAE = 0.02
  const monthlyInterest = ((account?.balance ?? 0) * TAE) / 12
  const yearlyInterest = (account?.balance ?? 0) * TAE

  const handleBalance = () => {
    const val = parseFloat(newBalance.replace(',', '.'))
    if (!isNaN(val)) { updateAccountBalance('traderepublic', val); setEditBalance(false) }
  }

  const handleMove = () => {
    const val = parseFloat(amount.replace(',', '.'))
    if (isNaN(val) || val <= 0) return
    if (modal === 'deposit') {
      addTransaction({ type: 'transfer', amount: val, description: 'Aportación Trade Republic', category: 'savings', accountId: 'bbva', toAccountId: 'traderepublic', icon: '💰' })
    } else {
      addTransaction({ type: 'transfer', amount: val, description: 'Retirada Trade Republic', category: 'transfer', accountId: 'traderepublic', toAccountId: 'bbva', icon: '💸' })
    }
    setModal(null)
    setAmount('')
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="mx-4 mt-4 rounded-3xl p-5" style={{ background: 'linear-gradient(135deg, #0dbd8b 0%, #0a9a72 100%)' }}>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full bg-white/10">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <span className="text-white/80 text-sm font-medium">Trade Republic · Ahorro</span>
        </div>
        <p className="text-white/70 text-sm mb-1">Saldo ahorro</p>
        {editBalance ? (
          <div className="flex gap-2 items-center">
            <input type="number" step="0.01" value={newBalance} onChange={(e) => setNewBalance(e.target.value)}
              className="bg-white/20 text-white text-2xl font-bold rounded-xl px-3 py-1 w-44 focus:outline-none" autoFocus />
            <button onClick={handleBalance} className="text-white/80 bg-white/20 rounded-lg px-3 py-1 text-sm">✓</button>
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
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-xl p-2.5">
            <p className="text-white/60 text-[10px]">TAE</p>
            <p className="text-white font-bold text-sm">2,00%</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <p className="text-white/60 text-[10px]">Interés/mes</p>
            <p className="text-white font-bold text-sm">{formatCurrency(monthlyInterest)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <p className="text-white/60 text-[10px]">Interés/año</p>
            <p className="text-white font-bold text-sm">{formatCurrency(yearlyInterest)}</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 mt-4">
          <button onClick={() => setModal('deposit')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-white text-sm font-semibold transition-colors">
            <Plus size={16} /> Ingresar
          </button>
          <button onClick={() => setModal('withdraw')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-white text-sm font-semibold transition-colors">
            <Minus size={16} /> Retirar
          </button>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-4">
        {/* Proyección */}
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-teal-400" />
            <h3 className="text-sm font-bold text-white">Proyección de intereses</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: '6 meses', months: 6 },
              { label: '1 año', months: 12 },
              { label: '2 años', months: 24 },
              { label: '5 años', months: 60 },
            ].map(({ label, months }) => {
              const projected = (account?.balance ?? 0) * Math.pow(1 + TAE / 12, months)
              const gain = projected - (account?.balance ?? 0)
              return (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{label}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white">{formatCurrency(projected)}</span>
                    <span className="text-xs text-teal-400 ml-2">+{formatCurrency(gain)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-2xl p-3">
          <p className="text-xs text-amber-300 leading-relaxed">
            💡 <strong>Consejo:</strong> Trade Republic paga un 2% TAE sobre tu saldo. Si quieres mayor rentabilidad a largo plazo, considera mover parte a fondos indexados (histórico S&P500 ~10%/año).
          </p>
        </div>

        {/* Movimientos */}
        {trTx.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-white mb-3">Movimientos</h3>
            <div className="space-y-2">
              {trTx.map((tx) => {
                const isIn = tx.toAccountId === 'traderepublic'
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                    <span className="text-lg">{tx.icon || '💰'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{tx.description}</p>
                      <p className="text-xs text-slate-400">{tx.date}</p>
                    </div>
                    <p className={`text-sm font-bold ${isIn ? 'text-teal-400' : 'text-red-400'}`}>
                      {isIn ? '+' : '−'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setModal(null)}>
          <div className="w-full max-w-md mx-auto bg-slate-900 rounded-t-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white mb-2">
              {modal === 'deposit' ? '💰 Ingresar en Trade Republic' : '💸 Retirar de Trade Republic'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {modal === 'deposit' ? 'Se descontará de tu cuenta BBVA' : 'Se añadirá a tu cuenta BBVA'}
            </p>
            <div className="relative mb-4">
              <input type="number" step="0.01" min="0" placeholder="0,00" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-2xl font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 text-right pr-8" autoFocus />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-slate-500">€</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold">Cancelar</button>
              <button onClick={handleMove} className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}
