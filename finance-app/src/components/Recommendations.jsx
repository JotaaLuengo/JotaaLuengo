import React from 'react'
import useFinanceStore from '../store/financeStore'
import { generateRecommendations, PRIORITY_COLORS } from '../utils/recommendations'

export default function Recommendations() {
  const accounts = useFinanceStore((s) => s.accounts)
  const subscriptions = useFinanceStore((s) => s.subscriptions)
  const transactions = useFinanceStore((s) => s.transactions)
  const sharedExpenses = useFinanceStore((s) => s.sharedExpenses)

  const recs = generateRecommendations(accounts, subscriptions, transactions, sharedExpenses)

  return (
    <div className="px-4 py-4 animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white">Recomendaciones</h2>
        <p className="text-xs text-slate-400 mt-0.5">Personalizadas según tu situación financiera actual</p>
      </div>

      <div className="space-y-3">
        {recs.map((rec) => {
          const style = PRIORITY_COLORS[rec.priority]
          return (
            <div
              key={rec.id}
              className={`rounded-2xl border p-4 ${style.bg} ${style.border}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{rec.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{rec.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">{rec.message}</p>
                  <div className="bg-black/20 rounded-xl p-2.5">
                    <p className="text-xs text-slate-200 font-medium">
                      <span className="text-indigo-400">→ </span>{rec.action}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-5 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Las recomendaciones se basan en los datos que has introducido y en principios generales de finanzas personales. No constituyen asesoramiento financiero profesional.
        </p>
      </div>

      <div className="h-4" />
    </div>
  )
}
