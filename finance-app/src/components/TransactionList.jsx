import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Bell, BellOff } from 'lucide-react'
import useFinanceStore from '../store/financeStore'
import { CATEGORIES } from '../data/initialData'
import { formatCurrency } from '../utils/dateUtils'

export default function TransactionList() {
  const transactions = useFinanceStore((s) => s.transactions)
  const notifications = useFinanceStore((s) => s.notifications)
  const accounts = useFinanceStore((s) => s.accounts)
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction)
  const markNotificationRead = useFinanceStore((s) => s.markNotificationRead)
  const markAllRead = useFinanceStore((s) => s.markAllRead)
  const [tab, setTab] = useState('transactions') // 'transactions' | 'alerts'
  const navigate = useNavigate()

  const unreadAlerts = notifications.filter((n) => !n.read)

  return (
    <div className="px-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Actividad</h2>
        <button
          onClick={() => navigate('/add')}
          className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          + Añadir
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800 rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab('transactions')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'transactions' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Movimientos ({transactions.length})
        </button>
        <button
          onClick={() => setTab('alerts')}
          className={`relative flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'alerts' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Alertas
          {unreadAlerts.length > 0 && (
            <span className="absolute top-1 right-4 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadAlerts.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'transactions' && (
        <div className="space-y-2">
          {transactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-slate-400 text-sm">Aún no hay movimientos registrados</p>
            </div>
          )}
          {transactions.map((tx) => {
            const account = accounts.find((a) => a.id === tx.accountId)
            const category = CATEGORIES.find((c) => c.id === tx.category)
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-2xl border border-slate-700/40 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-lg shrink-0">
                  {tx.icon || category?.icon || (tx.type === 'income' ? '💵' : '💸')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                  <p className="text-xs text-slate-400">
                    {account?.name || tx.accountId}
                    {tx.type === 'transfer' && tx.toAccountId && ` → ${accounts.find((a) => a.id === tx.toAccountId)?.name || tx.toAccountId}`}
                    {' · '}{tx.date}
                  </p>
                  {category && (
                    <span className="text-[10px] text-slate-500">{category.icon} {category.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      tx.type === 'income' ? 'text-emerald-400' :
                      tx.type === 'transfer' ? 'text-sky-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '↔' : '−'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-900/40"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'alerts' && (
        <div className="space-y-3">
          {notifications.length > 0 && unreadAlerts.length > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Marcar todas como leídas
            </button>
          )}
          {notifications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔔</p>
              <p className="text-slate-400 text-sm">No hay alertas</p>
              <p className="text-slate-500 text-xs mt-1">Te avisaremos un día antes de cada cobro</p>
            </div>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-colors ${
                n.read
                  ? 'bg-slate-800/30 border-slate-700/30 opacity-60'
                  : 'bg-amber-900/25 border-amber-700/40'
              }`}
            >
              <span className="text-2xl shrink-0">{n.icon || '🔔'}</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${n.read ? 'text-slate-400' : 'text-white'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-slate-500 mt-1">{n.date}</p>
              </div>
              {!n.read ? (
                <Bell size={14} className="text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <BellOff size={14} className="text-slate-600 shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}
