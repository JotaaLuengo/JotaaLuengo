import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import useFinanceStore from '../../store/financeStore'
import { formatCurrency } from '../../utils/dateUtils'

export default function SharedExpenses() {
  const navigate = useNavigate()
  const sharedExpenses = useFinanceStore((s) => s.sharedExpenses)
  const updateSharedExpense = useFinanceStore((s) => s.updateSharedExpense)

  const totalMyShare = sharedExpenses.reduce((s, e) => s + e.myShare, 0)
  const totalFull = sharedExpenses.reduce((s, e) => s + e.totalAmount, 0)
  const [editId, setEditId] = useState(null)
  const [editValues, setEditValues] = useState({})

  const startEdit = (expense) => {
    setEditId(expense.id)
    setEditValues({ totalAmount: expense.totalAmount.toString(), myShare: expense.myShare.toString() })
  }

  const saveEdit = (id) => {
    const total = parseFloat(editValues.totalAmount.replace(',', '.'))
    const mine = parseFloat(editValues.myShare.replace(',', '.'))
    if (!isNaN(total) && !isNaN(mine)) {
      updateSharedExpense(id, { totalAmount: total, myShare: mine })
    }
    setEditId(null)
  }

  // Cálculo de contribución total mensual (ej. 950€ para los dos)
  const partnerShare = totalFull - totalMyShare
  const estimatedMonthlyTotal = 950 // estimado por el usuario

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="mx-4 mt-4 rounded-3xl p-5" style={{ background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)' }}>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full bg-white/10">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <span className="text-white/80 text-sm font-medium">Gastos compartidos</span>
        </div>
        <p className="text-white/70 text-sm mb-1">Mi parte mensual</p>
        <p className="text-4xl font-extrabold text-white">{formatCurrency(totalMyShare)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-white/60 text-[10px]">Total entre los dos</p>
            <p className="text-white font-bold">{formatCurrency(totalFull)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-white/60 text-[10px]">Aporte total estimado</p>
            <p className="text-white font-bold">{formatCurrency(estimatedMonthlyTotal)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-3">
        <p className="text-xs text-slate-400">
          Incluye parking, coche y alquiler. El aporte estimado de ~950€ entre los dos también cubre luz, agua y compra.
        </p>

        {sharedExpenses.map((expense) => (
          <div key={expense.id} className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{expense.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{expense.name}</p>
                  <p className="text-xs text-slate-400">Mensual</p>
                </div>
              </div>
              {editId === expense.id ? (
                <button onClick={() => saveEdit(expense.id)} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg font-semibold">
                  ✓ Guardar
                </button>
              ) : (
                <button onClick={() => startEdit(expense)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
                  <RefreshCw size={13} className="text-slate-400" />
                </button>
              )}
            </div>

            {editId === expense.id ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Total (entre dos)</label>
                  <input
                    type="number" step="0.01"
                    value={editValues.totalAmount}
                    onChange={(e) => setEditValues((v) => ({ ...v, totalAmount: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Mi parte</label>
                  <input
                    type="number" step="0.01"
                    value={editValues.myShare}
                    onChange={(e) => setEditValues((v) => ({ ...v, myShare: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-700/50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-slate-400">Total</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(expense.totalAmount)}</p>
                </div>
                <div className="bg-indigo-900/30 rounded-xl p-2.5 text-center border border-indigo-700/30">
                  <p className="text-[10px] text-indigo-300">Yo pago</p>
                  <p className="text-sm font-bold text-indigo-300">{formatCurrency(expense.myShare)}</p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-slate-400">Pareja</p>
                  <p className="text-sm font-bold text-slate-300">{formatCurrency(expense.totalAmount - expense.myShare)}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Resumen adicional */}
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Desglose mensual</h3>
          {sharedExpenses.map((e) => (
            <div key={e.id} className="flex justify-between py-1.5 border-b border-slate-700/30 last:border-0">
              <span className="text-xs text-slate-300">{e.icon} {e.name}</span>
              <span className="text-xs font-semibold text-white">{formatCurrency(e.myShare)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-1">
            <span className="text-sm font-bold text-white">Total mi parte</span>
            <span className="text-sm font-bold text-amber-400">{formatCurrency(totalMyShare)}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            + gastos variables (luz, agua, compra) = ~{formatCurrency(estimatedMonthlyTotal)} aporte total estimado/mes
          </p>
        </div>
      </div>

      <div className="h-6" />
    </div>
  )
}
