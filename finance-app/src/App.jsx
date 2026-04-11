import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import BBVAAccount from './components/accounts/BBVAAccount'
import RevolutAccount from './components/accounts/RevolutAccount'
import MyInvestorAccount from './components/accounts/MyInvestorAccount'
import TradeRepublicAccount from './components/accounts/TradeRepublicAccount'
import SharedExpenses from './components/accounts/SharedExpenses'
import TransactionList from './components/TransactionList'
import AddTransaction from './components/AddTransaction'
import MonthlyReport from './components/MonthlyReport'
import Recommendations from './components/Recommendations'
import useFinanceStore from './store/financeStore'
import { getTomorrowPayments } from './utils/dateUtils'

export default function App() {
  const subscriptions = useFinanceStore((s) => s.subscriptions)
  const addNotification = useFinanceStore((s) => s.addNotification)
  const notifications = useFinanceStore((s) => s.notifications)

  // Comprobar pagos de mañana al iniciar
  useEffect(() => {
    const tomorrowPayments = getTomorrowPayments(subscriptions)
    const today = new Date().toDateString()

    tomorrowPayments.forEach((sub) => {
      const alreadyNotified = notifications.some(
        (n) => n.subscriptionId === sub.id && n.date === today
      )
      if (!alreadyNotified) {
        addNotification({
          type: 'payment_reminder',
          subscriptionId: sub.id,
          date: today,
          title: `Cobro mañana: ${sub.name}`,
          message: `${sub.amount.toFixed(2)}€ se cargarán mañana en tu cuenta ${sub.accountId.toUpperCase()}`,
          icon: sub.icon,
          amount: sub.amount,
        })

        // Notificación del sistema si está disponible
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`⚠️ Cobro mañana: ${sub.name}`, {
            body: `${sub.amount.toFixed(2)}€ — ${sub.accountId.toUpperCase()}`,
            icon: '/pwa-192x192.png',
          })
        }
      }
    })

    // Pedir permiso de notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, []) // eslint-disable-line

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="bbva" element={<BBVAAccount />} />
        <Route path="revolut" element={<RevolutAccount />} />
        <Route path="myinvestor" element={<MyInvestorAccount />} />
        <Route path="traderepublic" element={<TradeRepublicAccount />} />
        <Route path="shared" element={<SharedExpenses />} />
        <Route path="transactions" element={<TransactionList />} />
        <Route path="add" element={<AddTransaction />} />
        <Route path="report" element={<MonthlyReport />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
