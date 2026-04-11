import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  INITIAL_ACCOUNTS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_SHARED_EXPENSES,
  INITIAL_CREDIT_CARDS,
} from '../data/initialData'
import { format } from 'date-fns'

// uuid simple sin dependencia extra
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const useFinanceStore = create(
  persist(
    (set, get) => ({
      // ─── Estado ───────────────────────────────────────────────────────────
      accounts: INITIAL_ACCOUNTS,
      subscriptions: INITIAL_SUBSCRIPTIONS,
      sharedExpenses: INITIAL_SHARED_EXPENSES,
      creditCards: INITIAL_CREDIT_CARDS,
      transactions: [],
      notifications: [],

      // ─── Cuentas ──────────────────────────────────────────────────────────
      updateAccountBalance: (accountId, newBalance) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId ? { ...a, balance: newBalance } : a
          ),
        })),

      addBalanceDelta: (accountId, delta) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId ? { ...a, balance: +(a.balance + delta).toFixed(2) } : a
          ),
        })),

      // ─── Transacciones ────────────────────────────────────────────────────
      addTransaction: (data) => {
        const tx = {
          id: genId(),
          date: format(new Date(), 'yyyy-MM-dd'),
          ...data,
          amount: Math.abs(data.amount),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ transactions: [tx, ...state.transactions] }))

        // Actualizar saldo de la cuenta
        const { accounts } = get()
        const account = accounts.find((a) => a.id === tx.accountId)
        if (account) {
          const delta = tx.type === 'income' ? tx.amount : -tx.amount
          get().addBalanceDelta(tx.accountId, delta)
          // Si es transferencia, también actualizar cuenta destino
          if (tx.type === 'transfer' && tx.toAccountId) {
            get().addBalanceDelta(tx.toAccountId, tx.amount)
          }
        }
        return tx
      },

      deleteTransaction: (id) => {
        const tx = get().transactions.find((t) => t.id === id)
        if (!tx) return
        // Revertir saldo
        const delta = tx.type === 'income' ? -tx.amount : tx.amount
        get().addBalanceDelta(tx.accountId, delta)
        if (tx.type === 'transfer' && tx.toAccountId) {
          get().addBalanceDelta(tx.toAccountId, -tx.amount)
        }
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }))
      },

      // ─── Suscripciones ────────────────────────────────────────────────────
      addSubscription: (data) =>
        set((state) => ({
          subscriptions: [...state.subscriptions, { id: genId(), active: true, ...data }],
        })),

      updateSubscription: (id, data) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),

      toggleSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, active: !s.active } : s
          ),
        })),

      markSubscriptionPaid: (id, paymentDate) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  lastPaymentDate: paymentDate || format(new Date(), 'yyyy-MM-dd'),
                }
              : s
          ),
        })),

      // ─── Gastos compartidos ───────────────────────────────────────────────
      updateSharedExpense: (id, data) =>
        set((state) => ({
          sharedExpenses: state.sharedExpenses.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),

      // ─── Tarjeta de crédito ───────────────────────────────────────────────
      markCreditChargePaid: (cardId, chargeId) =>
        set((state) => ({
          creditCards: state.creditCards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  pendingCharges: c.pendingCharges.map((ch) =>
                    ch.id === chargeId ? { ...ch, paid: true } : ch
                  ),
                }
              : c
          ),
        })),

      // ─── Notificaciones ───────────────────────────────────────────────────
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            { id: genId(), read: false, createdAt: new Date().toISOString(), ...notification },
            ...state.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      // ─── Reset (solo para desarrollo) ─────────────────────────────────────
      resetToInitial: () =>
        set({
          accounts: INITIAL_ACCOUNTS,
          subscriptions: INITIAL_SUBSCRIPTIONS,
          sharedExpenses: INITIAL_SHARED_EXPENSES,
          creditCards: INITIAL_CREDIT_CARDS,
          transactions: [],
          notifications: [],
        }),
    }),
    {
      name: 'finance-tracker-v1',
      version: 1,
    }
  )
)

export default useFinanceStore
