import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, MapPin, UserCheck,
  Activity, Receipt, Settings, ShieldCheck, LogOut
} from 'lucide-react'

const nav = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/clients',     icon: Users,            label: 'Clients & CRM' },
  { to: '/contrats',    icon: FileText,         label: 'Contrats' },
  { to: '/sites',       icon: MapPin,           label: 'Sites gardiennés' },
  { to: '/agents',      icon: UserCheck,        label: 'Agents' },
  { to: '/operations',  icon: Activity,         label: 'Opérations' },
  { to: '/facturation', icon: Receipt,          label: 'Facturation' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-sagard-dark flex flex-col fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-9 h-9 bg-sagard-yellow rounded-lg flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={20} className="text-sagard-dark" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">SAGARD</div>
          <div className="text-slate-400 text-xs">SÉCURITÉ · ERP</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sagard-yellow text-sagard-dark'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700 space-y-1">
        <NavLink
          to="/parametres"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
        >
          <Settings size={18} />
          Paramètres
        </NavLink>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-all">
          <LogOut size={18} />
          Déconnexion
        </button>
        <div className="px-3 pt-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sagard-yellow flex items-center justify-center text-sagard-dark font-bold text-xs flex-shrink-0">KD</div>
          <div>
            <div className="text-white text-xs font-semibold">Kouamé Diallo</div>
            <div className="text-slate-500 text-xs">Directeur Général</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
