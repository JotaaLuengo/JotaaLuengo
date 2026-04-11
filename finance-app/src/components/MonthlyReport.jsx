import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import useFinanceStore from '../store/financeStore'
import { CATEGORIES } from '../data/initialData'
import {
  getThisMonthTransactions, formatCurrency, getMonthlyCost, getCurrentMonthLabel
} from '../utils/dateUtils'

const RCOLORS = ['#6366f1', '#22d3ee', '#f97316', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9']

export default function MonthlyReport() {
  const accounts = useFinanceStore((s) => s.accounts)
  const subscriptions = useFinanceStore((s) => s.subscriptions)
  const transactions = useFinanceStore((s) => s.transactions)
  const sharedExpenses = useFinanceStore((s) => s.sharedExpenses)

  const monthlyTx = getThisMonthTransactions(transactions)
  const income = monthlyTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthlyTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savings = monthlyTx.filter((t) => t.type === 'transfer').reduce((s, t) => s + t.amount, 0)
  const subscriptionsCost = getMonthlyCost(subscriptions)
  const sharedTotal = sharedExpenses.reduce((s, e) => s + e.myShare, 0)
  const totalFixedExpenses = subscriptionsCost + sharedTotal
  const balance = income - expenses - savings

  // Gastos por categoría
  const categoryTotals = {}
  monthlyTx.filter((t) => t.type === 'expense').forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
  })
  const pieData = Object.entries(categoryTotals).map(([catId, amount]) => {
    const cat = CATEGORIES.find((c) => c.id === catId)
    return { name: cat?.name || catId, value: amount, icon: cat?.icon || '📦' }
  }).sort((a, b) => b.value - a.value)

  // Patrimonio por tipo
  const wealthData = [
    { name: 'Corriente', value: accounts.filter((a) => a.type === 'checking').reduce((s, a) => s + a.balance, 0) },
    { name: 'Ahorro', value: accounts.find((a) => a.id === 'traderepublic')?.balance ?? 0 },
    { name: 'Inversión', value: accounts.find((a) => a.id === 'myinvestor-cartera')?.balance ?? 0 },
    { name: 'Pensión', value: accounts.find((a) => a.id === 'myinvestor-pension')?.balance ?? 0 },
  ]

  return (
    <div className="px-4 py-4 space-y-5 animate-fade-in">
      <h2 className="text-lg font-bold text-white capitalize">Resumen · {getCurrentMonthLabel()}</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Ingresos" value={income} color="text-emerald-400" icon="💵" />
        <KpiCard label="Gastos variables" value={expenses} color="text-red-400" icon="💸" />
        <KpiCard label="Ahorros / inversión" value={savings} color="text-sky-400" icon="💰" />
        <KpiCard label="Balance neto" value={balance} color={balance >= 0 ? 'text-emerald-400' : 'text-red-400'} icon="⚖️" />
      </div>

      {/* Gastos fijos estimados */}
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700/40 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Gastos fijos del mes</h3>
        <div className="space-y-2">
          <FixedRow label="Suscripciones digitales" amount={subscriptionsCost} icon="🔄" />
          <FixedRow label="Mi parte gastos compartidos" amount={sharedTotal} icon="👫" />
          <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between">
            <span className="text-sm font-bold text-white">Total fijos</span>
            <span className="text-sm font-bold text-amber-400">{formatCurrency(totalFixedExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Distribución de gastos */}
      {pieData.length > 0 && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/40 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Gastos por categoría</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={RCOLORS[i % RCOLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => formatCurrency(val)}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: RCOLORS[i % RCOLORS.length] }} />
                  <span className="text-xs text-slate-300">{item.icon} {item.name}</span>
                </div>
                <span className="text-xs font-semibold text-white">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patrimonio */}
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700/40 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Distribución del patrimonio</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={wealthData} barSize={30}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={55}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
            <Tooltip
              formatter={(val) => formatCurrency(val)}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {wealthData.map((_, i) => (
                <Cell key={i} fill={RCOLORS[i % RCOLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-4" />
    </div>
  )
}

function KpiCard({ label, value, color, icon }) {
  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700/40 p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
    </div>
  )
}

function FixedRow({ label, amount, icon }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300">{icon} {label}</span>
      <span className="text-sm font-semibold text-white">{formatCurrency(amount)}</span>
    </div>
  )
}
