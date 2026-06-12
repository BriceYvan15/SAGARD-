import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, MapPin, UserCheck,
  Activity, Receipt, Settings, LogOut,
  UsersRound, Package, Bot, Bell, ClipboardList, Target,
  FileCheck, FileBadge, Briefcase, UserCog, DoorOpen, Calculator, History,
} from 'lucide-react'
import { getUser, ROLE_LABELS } from '../../lib/auth'
import { hasAccess } from '../../lib/roles'
import { logout } from '../../services/auth.service'
import logoSagard from '../../assets/logo-sagard.jpg'

type NavItem = { to: string; icon: any; label: string }
type NavGroup = { title: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    title: '',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    ],
  },
  {
    title: 'Espace Commercial',
    items: [
      { to: '/prospects',             icon: Target,   label: 'Prospects' },
      { to: '/documents-commerciaux', icon: FileText,  label: 'Devis & Proforma' },
      { to: '/clients',               icon: Users,     label: 'Clients' },
    ],
  },
  {
    title: 'Comptabilité & Contrats',
    items: [
      { to: '/contrats',              icon: Briefcase,   label: 'Contrats' },
      { to: '/facturation',           icon: Receipt,     label: 'Factures' },
      { to: '/comptabilite',          icon: Calculator,  label: 'Comptabilité' },
      { to: '/alertes-commerciales',  icon: Bell,        label: 'Alertes Commerciales' },
    ],
  },
  {
    title: 'Opérations',
    items: [
      { to: '/sites',       icon: MapPin,        label: 'Sites gardiennés' },
      { to: '/agents',      icon: UserCheck,     label: 'Agents' },
      { to: '/operations',  icon: Activity,      label: 'Opérations' },
      { to: '/supervision', icon: Bell,          label: 'Supervision' },
      { to: '/registres',   icon: ClipboardList, label: 'Registres site' },
    ],
  },
  {
    title: 'Accueil & Réception',
    items: [
      { to: '/accueil', icon: DoorOpen, label: 'Accueil' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/utilisateurs', icon: UserCog,   label: 'Utilisateurs' },
      { to: '/rh',    icon: UsersRound, label: 'Ressources Humaines' },
      { to: '/stock', icon: Package,    label: 'Stock & Véhicules' },
      { to: '/audit', icon: History,    label: 'Journal des modifications' },
      { to: '/ia',    icon: Bot,        label: 'Assistant IA' },
    ],
  },
]

function UserCard() {
  const user = getUser()
  if (!user) return null
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  return (
    <div className="px-3 pt-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-sagard-yellow flex items-center justify-center text-sagard-dark font-bold text-xs flex-shrink-0">
        {initials}
      </div>
      <div className="overflow-hidden">
        <div className="text-white text-xs font-semibold truncate">{user.firstName} {user.lastName}</div>
        <div className="text-slate-500 text-xs truncate">{ROLE_LABELS[user.role] ?? user.role}</div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-sagard-dark flex flex-col fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <img src={logoSagard} alt="SAGARD" className="w-10 h-10 object-contain flex-shrink-0" />
        <div>
          <div className="text-white font-bold text-sm leading-tight">SAGARD</div>
          <div className="text-slate-400 text-xs">SÉCURITÉ · ERP</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
        {navGroups.map((group, gi) => {
          const visibleItems = group.items.filter(({ to }) => hasAccess(to.replace('/', '')))
          if (visibleItems.length === 0 && group.title) return null
          return (
            <div key={gi} className={group.title ? 'mt-4 first:mt-0' : ''}>
              {group.title && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-sagard-yellow text-sagard-dark'
                          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={16} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
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
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-all">
          <LogOut size={18} />
          Déconnexion
        </button>
        <UserCard />
      </div>
    </aside>
  )
}
