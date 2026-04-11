import {
  addDays,
  addWeeks,
  addMonths,
  setDate,
  isBefore,
  isAfter,
  differenceInDays,
  format,
  startOfMonth,
  endOfMonth,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Calcula la próxima fecha de pago para una suscripción
 */
export function getNextPaymentDate(subscription) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (subscription.frequency === 'every_4_weeks') {
    const lastPayment = parseISO(subscription.lastPaymentDate)
    let next = addWeeks(lastPayment, 4)
    // Avanzar hasta encontrar la próxima fecha futura
    while (isBefore(next, today)) {
      next = addWeeks(next, 4)
    }
    return next
  }

  if (subscription.frequency === 'monthly') {
    const day = subscription.dayOfMonth
    // Intentar este mes
    let candidate = setDate(new Date(today.getFullYear(), today.getMonth(), 1), day)
    if (isBefore(candidate, today)) {
      candidate = addMonths(candidate, 1)
    }
    return candidate
  }

  return null
}

/**
 * Días que faltan para el próximo pago (negativo = ya pasó)
 */
export function getDaysUntilPayment(subscription) {
  const next = getNextPaymentDate(subscription)
  if (!next) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return differenceInDays(next, today)
}

/**
 * Formatea fecha en español
 */
export function formatDate(date, fmt = 'd MMM yyyy') {
  return format(typeof date === 'string' ? parseISO(date) : date, fmt, { locale: es })
}

/**
 * Formatea fecha corta
 */
export function formatDateShort(date) {
  return formatDate(date, 'd MMM')
}

/**
 * Obtiene suscripciones con pagos próximos (en N días)
 */
export function getUpcomingPayments(subscriptions, days = 7) {
  return subscriptions
    .filter((s) => s.active)
    .map((s) => ({ ...s, nextDate: getNextPaymentDate(s), daysUntil: getDaysUntilPayment(s) }))
    .filter((s) => s.daysUntil !== null && s.daysUntil >= 0 && s.daysUntil <= days)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

/**
 * Obtiene suscripciones que se cobran mañana (para notificaciones)
 */
export function getTomorrowPayments(subscriptions) {
  return subscriptions
    .filter((s) => s.active)
    .map((s) => ({ ...s, nextDate: getNextPaymentDate(s), daysUntil: getDaysUntilPayment(s) }))
    .filter((s) => s.daysUntil === 1)
}

/**
 * Suma total de suscripciones activas al mes
 */
export function getMonthlyCost(subscriptions) {
  return subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => {
      if (s.frequency === 'monthly') return sum + s.amount
      if (s.frequency === 'every_4_weeks') return sum + (s.amount * 13) / 12 // promedio anual
      return sum
    }, 0)
}

/**
 * Transacciones del mes actual
 */
export function getThisMonthTransactions(transactions) {
  const start = startOfMonth(new Date())
  const end = endOfMonth(new Date())
  return transactions.filter((t) => {
    const d = parseISO(t.date)
    return isAfter(d, addDays(start, -1)) && isBefore(d, addDays(end, 1))
  })
}

/**
 * Label de urgencia para el número de días
 */
export function getDaysLabel(days) {
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Mañana'
  if (days <= 3) return `En ${days} días`
  return `${days} días`
}

export function formatCurrency(amount, currency = '€') {
  return `${Number(amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency}`
}

export function getCurrentMonthLabel() {
  return format(new Date(), 'MMMM yyyy', { locale: es })
}

export function parseTransactionVoice(text) {
  const lower = text.toLowerCase()
  const result = { description: text, amount: null, type: 'expense', category: 'other', accountId: 'bbva' }

  // Detectar cantidad
  const amountMatch = lower.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:euros?|€)/)
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1].replace(',', '.'))
  }

  // Detectar tipo
  if (/nómin|ingres|cobr[aoé]|abono/.test(lower)) { result.type = 'income'; result.category = 'income' }
  else if (/gasolin|combustible/.test(lower)) { result.category = 'fuel' }
  else if (/cerve|bar|restaur|comid|amig|ocio|salid/.test(lower)) { result.category = 'restaurants' }
  else if (/superm|compra|mercado|alcam|carrefour/.test(lower)) { result.category = 'food' }
  else if (/transfer|ahorro|myinvestor|traderepublic|revolut/.test(lower)) { result.type = 'transfer'; result.category = 'transfer' }
  else if (/invest/.test(lower)) { result.type = 'transfer'; result.category = 'savings' }

  // Detectar cuenta
  if (/revolut/.test(lower)) result.accountId = 'revolut'
  else if (/myinvestor/.test(lower)) result.accountId = 'myinvestor-cartera'
  else if (/trade/.test(lower)) result.accountId = 'traderepublic'

  return result
}
