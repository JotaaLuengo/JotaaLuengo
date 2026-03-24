import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const NAV_ITEMS = [
  { label: "Informes",   icon: "✦", path: "/reports/new" },
  { label: "Historial",  icon: "◈", path: "/reports"     },
  { label: "Dashboard",  icon: "◉", path: "/dashboard"   },
  { label: "Calendario", icon: "◷", path: "/calendar"    },
];

export function Sidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-[220px] min-h-screen border-r border-white/[0.07] bg-[#07090d] sticky top-0">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <span className="font-['Bebas_Neue'] text-2xl tracking-widest">
          <span className="text-[#00e87a]">SCOUT</span>
          <span className="text-white">LAB</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
              ${isActive
                ? "bg-[#00e87a]/10 text-[#00e87a] font-medium"
                : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div className="px-4 py-5 border-t border-white/[0.07]">
          <p className="text-xs text-white/30 truncate mb-2">{user.email}</p>
          <button
            onClick={signOut}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
}
