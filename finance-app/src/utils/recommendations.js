import { getMonthlyCost } from './dateUtils'
import { INITIAL_SHARED_EXPENSES } from '../data/initialData'

/**
 * Genera recomendaciones personalizadas de ahorro
 */
export function generateRecommendations(accounts, subscriptions, transactions, sharedExpenses) {
  const recommendations = []

  // Calcular totales
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const bbvaBalance = accounts.find((a) => a.id === 'bbva')?.balance ?? 0
  const tradeBalance = accounts.find((a) => a.id === 'traderepublic')?.balance ?? 0
  const investBalance = (accounts.find((a) => a.id === 'myinvestor-cartera')?.balance ?? 0) +
    (accounts.find((a) => a.id === 'myinvestor-pension')?.balance ?? 0)
  const subsCost = getMonthlyCost(subscriptions)
  const sharedCost = sharedExpenses.reduce((sum, e) => sum + e.myShare, 0)

  // Patrimonio total
  const netWorth = totalBalance
  const savingsRatio = (tradeBalance + investBalance) / netWorth

  // Regla de emergencia: 3-6 meses de gastos fijos
  const fixedMonthly = subsCost + sharedCost
  const emergencyTarget = fixedMonthly * 4
  if (bbvaBalance < emergencyTarget) {
    recommendations.push({
      id: 'emergency-fund',
      priority: 'high',
      icon: '🛡️',
      title: 'Fondo de emergencia',
      message: `Tu cuenta BBVA tiene ${bbvaBalance.toFixed(2)}€. Lo recomendable es tener al menos ${emergencyTarget.toFixed(0)}€ (4 meses de gastos fijos) en cuenta corriente como colchón de seguridad.`,
      action: `Mantén entre ${(fixedMonthly * 3).toFixed(0)}€ y ${(fixedMonthly * 6).toFixed(0)}€ en BBVA como fondo de emergencia.`,
    })
  }

  // Suscripciones caras
  if (subsCost > 120) {
    recommendations.push({
      id: 'high-subs',
      priority: 'medium',
      icon: '✂️',
      title: 'Optimiza tus suscripciones',
      message: `Pagas ${subsCost.toFixed(2)}€/mes solo en suscripciones. Eso son ${(subsCost * 12).toFixed(0)}€ al año.`,
      action: 'Revisa si usas activamente todas tus suscripciones. Higgsfield (53€) y ElevenLabs (24€) suponen el 57% del gasto total.',
    })
  }

  // Trade Republic vs MyInvestor
  if (tradeBalance > 5000 && investBalance < tradeBalance * 0.5) {
    recommendations.push({
      id: 'diversify',
      priority: 'medium',
      icon: '📊',
      title: 'Diversifica tu inversión',
      message: `Tienes ${tradeBalance.toFixed(2)}€ en Trade Republic al 2% TAE, pero solo ${investBalance.toFixed(2)}€ invertidos en fondos indexados.`,
      action: 'Considera mover parte de Trade Republic a tu cartera indexada de MyInvestor para obtener mayor rentabilidad a largo plazo (media histórica S&P500: ~10% anual).',
    })
  }

  // Plan de pensiones
  if (investBalance < 1000) {
    recommendations.push({
      id: 'pension',
      priority: 'low',
      icon: '🏛️',
      title: 'Incrementa tu pensión',
      message: `Tu plan de pensiones tiene ${accounts.find((a) => a.id === 'myinvestor-pension')?.balance?.toFixed(2)}€. Las aportaciones al plan de pensiones tienen ventajas fiscales.`,
      action: 'Aporta al plan de pensiones para reducir tu base imponible del IRPF. El límite es 1.500€/año con desgravación.',
    })
  }

  // Ratio de ahorro
  if (savingsRatio < 0.5) {
    recommendations.push({
      id: 'savings-ratio',
      priority: 'low',
      icon: '🎯',
      title: 'Mejora tu ratio de ahorro',
      message: `El ${(savingsRatio * 100).toFixed(0)}% de tu patrimonio está en ahorro/inversión. La regla 50/30/20 recomienda ahorrar al menos el 20% de tus ingresos mensuales.`,
      action: 'Configura una transferencia automática mensual a Trade Republic o MyInvestor justo después de cobrar la nómina.',
    })
  }

  // Crédito revolut
  recommendations.push({
    id: 'credit-revolut',
    priority: 'high',
    icon: '💳',
    title: 'Liquida el crédito Revolut',
    message: 'Tienes 132,63€ del mes de marzo y 143,86€ del mes de abril pendientes en tu tarjeta de crédito Revolut.',
    action: 'Asegúrate de que hay saldo suficiente en Revolut para los cargos automáticos. Pagar crédito a tiempo evita intereses.',
  })

  // Gasto en gasolina
  const fuelExpenses = transactions?.filter((t) => t.category === 'fuel') ?? []
  if (fuelExpenses.length > 0) {
    const fuelTotal = fuelExpenses.reduce((sum, t) => sum + t.amount, 0)
    recommendations.push({
      id: 'fuel',
      priority: 'low',
      icon: '⛽',
      title: 'Controla el gasto en gasolina',
      message: `Has gastado ${fuelTotal.toFixed(2)}€ en gasolina registrados.`,
      action: 'Usa la app GasBuddy para encontrar las gasolineras más baratas de tu zona.',
    })
  }

  // Recomendación general de riqueza
  recommendations.push({
    id: 'net-worth',
    priority: 'info',
    icon: '💎',
    title: 'Tu patrimonio neto',
    message: `Patrimonio total: ${netWorth.toFixed(2)}€. De estos, ${(tradeBalance + investBalance).toFixed(2)}€ (${(savingsRatio * 100).toFixed(0)}%) están en ahorro/inversión.`,
    action: 'Sigue incrementando tus inversiones cada mes. El interés compuesto trabaja mejor cuanto antes empieces.',
  })

  return recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2, info: 3 }
    return order[a.priority] - order[b.priority]
  })
}

export const PRIORITY_COLORS = {
  high: { bg: 'bg-red-900/30', border: 'border-red-700/50', badge: 'bg-red-700 text-white', label: 'Urgente' },
  medium: { bg: 'bg-amber-900/30', border: 'border-amber-700/50', badge: 'bg-amber-600 text-white', label: 'Recomendado' },
  low: { bg: 'bg-blue-900/30', border: 'border-blue-700/50', badge: 'bg-blue-700 text-white', label: 'Consejo' },
  info: { bg: 'bg-slate-800/50', border: 'border-slate-600/50', badge: 'bg-slate-600 text-white', label: 'Info' },
}
