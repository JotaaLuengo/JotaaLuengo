import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, RefreshCw, TrendingUp, Plus } from 'lucide-react'
import useFinanceStore from '../../store/financeStore'
import { formatCurrency } from '../../utils/dateUtils'

export default function MyInvestorAccount() {
  const navigate = useNavigate()
  const accounts = useFinanceStore((s) => s.accounts)
  const transactions = useFinanceStore((s) => s.transactions)
  const updateAccountBalance = useFinanceStore((s) => s.updateAccountBalance)
  const addTransaction = useFinanceStore((s) => s.addTransaction)

  const cartera = accounts.find((a) => a.id === 'myinvestor-cartera')
  const pension = accounts.find((a) => a.id === 'myinvestor-pension')
  const totalMyInvestor = (cartera?.balance ?? 0) + (pension?.balance ?? 0)

  const myInvestorTx = transactions.filter((t) =>
    t.accountId === 'myinvestor-cartera' || t.accountId === 'myinvestor-pension'
  ).slice(0, 6)

  const [editId, setEditId] = useState(null)
  const [newBalance, setNewBalance] = useState('')
  const [addModal, setAddModal] = useState(null) // 'cartera' | 'pension' | null
  const [addAmount, setAddAmount] = useState('')

  const startEdit = (id, balance) => { setEditId(id); setNewBalance(balance.toString()) }
  const saveEdit = () => {
    const val = parseFloat(newBalance.replace(',', '.'))
    if (!isNaN(val)) { updateAccountBalance(editId, val); setEditId(null) }
  }

  const handleAddInvestment = () => {
    const amount = parseFloat(addAmount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return
    addTransaction({
      type: 'transfer',
      amount,
      description: addModal === 'pension' ? 'Aportación plan de pensiones' : 'Aportación cartera indie MyInvestor',
      category: 'savings',
      accountId: 'bbva',
      toAccountId: addModal === 'pension' ? 'myinvestor-pension' : 'myinvestor-cartera',
      icon: '📈',
    })
    setAddModal(null)
    setAddAmount('')
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="mx-4 mt-4 rounded-3xl p-5" style={{ background: 'linear-gradient(135deg, #00b386 0%, #007a5e 100%)' }}>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full bg-white/10">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <span className="text-white/80 text-sm font-medium">MyInvestor · Inversiones</span>
        </div>
        <p className="text-white/70 text-sm mb-1">Patrimonio total</p>
        <p className="text-4xl font-extrabold text-white">{formatCurrency(totalMyInvestor)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-white/60 text-[10px]">Cartera indie</p>
            <p className="text-white font-bold">{formatCurrency(cartera?.balance ?? 0)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-white/60 text-[10px]">Plan pensiones S&P500</p>
            <p className="text-white font-bold">{formatCurrency(pension?.balance ?? 0)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-4">
        {/* Cartera indie */}
        <AccountBlock
          account={cartera}
          label="Cartera Indie Automatizada"
          description="Cartera indexada automatizada · Indexación global"
          icon="📈"
          editId={editId}
          newBalance={newBalance}
          onStartEdit={startEdit}
          onNewBalanceChange={setNewBalance}
          onSaveEdit={saveEdit}
          onAdd={() => setAddModal('myinvestor-cartera')}
        />

        {/* Plan de pensiones */}
        <AccountBlock
          account={pension}
          label="Plan de Pensiones"
          description="Indexado al S&P 500 · Ventaja fiscal IRPF"
          icon="🏛️"
          editId={editId}
          newBalance={newBalance}
          onStartEdit={startEdit}
          onNewBalanceChange={setNewBalance}
          onSaveEdit={saveEdit}
          onAdd={() => setAddModal('myinvestor-pension')}
        />

        {/* Info fiscal */}
        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-emerald-300 mb-1.5">💡 Ventaja fiscal pensiones</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Las aportaciones al plan de pensiones reducen tu base imponible del IRPF. Límite: <strong>1.500€/año</strong> con desgravación. Aportando el máximo puedes ahorrar entre 300€ y 600€ en la declaración de la renta.
          </p>
        </div>

        {/* Movimientos */}
        {myInvestorTx.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-white mb-3">Aportaciones</h3>
            <div className="space-y-2">
              {myInvestorTx.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-lg">{tx.icon || '📈'}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white truncate">{tx.description}</p>
                    <p className="text-xs text-slate-400">{tx.date}</p>
                  </div>
                  <p className="text-sm font-bold text-sky-400">+{formatCurrency(tx.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal aportación */}
      {addModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setAddModal(null)}>
          <div className="w-full max-w-md mx-auto bg-slate-900 rounded-t-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white mb-4">
              Añadir aportación a {addModal === 'pension' ? 'Plan de Pensiones' : 'Cartera Indie'}
            </h3>
            <p className="text-xs text-slate-400 mb-3">Se descontará de tu cuenta BBVA</p>
            <div className="relative mb-4">
              <input type="number" step="0.01" min="0" placeholder="0,00" value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-2xl font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-right pr-8"
                autoFocus />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-slate-500">€</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAddModal(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold">Cancelar</button>
              <button onClick={handleAddInvestment} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}

function AccountBlock({ account, label, description, icon, editId, newBalance, onStartEdit, onNewBalanceChange, onSaveEdit, onAdd }) {
  const isEditing = editId === account?.id
  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <button onClick={onSaveEdit} className="text-xs bg-emerald-700 text-white px-2 py-1 rounded-lg">✓</button>
          ) : (
            <>
              <button onClick={() => onStartEdit(account?.id, account?.balance)} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
                <RefreshCw size={13} className="text-slate-400" />
              </button>
              <button onClick={onAdd} className="p-1.5 rounded-lg bg-emerald-700/40 hover:bg-emerald-700/60 transition-colors">
                <Plus size={13} className="text-emerald-400" />
              </button>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <input type="number" step="0.01" value={newBalance} onChange={(e) => onNewBalanceChange(e.target.value)}
          className="w-full bg-slate-700 text-white text-xl font-bold rounded-xl px-3 py-2 focus:outline-none" autoFocus />
      ) : (
        <p className="text-2xl font-extrabold text-white">{formatCurrency(account?.balance ?? 0)}</p>
      )}
    </div>
  )
}
