import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Informes",   icon: "✦", path: "/reports/new" },
  { label: "Historial",  icon: "◈", path: "/reports"     },
  { label: "Dashboard",  icon: "◉", path: "/dashboard"   },
  { label: "Calendario", icon: "◷", path: "/calendar"    },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#07090d]/95 backdrop-blur border-t border-white/[0.07] flex">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors
            ${isActive ? "text-[#00e87a]" : "text-white/40"}`
          }
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
