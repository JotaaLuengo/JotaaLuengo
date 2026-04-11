import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, List, PlusCircle, BarChart2, Lightbulb, Bell } from 'lucide-react'
import useFinanceStore from '../store/financeStore'

export default function Layout() {
  const notifications = useFinanceStore((s) => s.notifications)
  const unread = notifications.filter((n) => !n.read).length
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 max-w-md mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 pt-4 pb-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💼</span>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Mis Finanzas</h1>
            <p className="text-xs text-slate-400">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/transactions')}
          className="relative p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <Bell size={20} className="text-slate-300" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 border-t border-slate-800/80 bg-slate-900/95 backdrop-blur-xl safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          <NavItem to="/" icon={<Home size={22} />} label="Inicio" />
          <NavItem to="/transactions" icon={<List size={22} />} label="Movimientos" />
          {/* Botón central grande */}
          <NavLink
            to="/add"
            className="flex flex-col items-center -mt-5"
          >
            {({ isActive }) => (
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isActive
                    ? 'bg-indigo-500 scale-105'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                <PlusCircle size={26} className="text-white" />
              </div>
            )}
          </NavLink>
          <NavItem to="/report" icon={<BarChart2 size={22} />} label="Resumen" />
          <NavItem to="/recommendations" icon={<Lightbulb size={22} />} label="Consejos" />
        </div>
      </nav>
    </div>
  )
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
          isActive ? 'text-indigo-400 nav-active' : 'text-slate-500 hover:text-slate-300'
        }`
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}
