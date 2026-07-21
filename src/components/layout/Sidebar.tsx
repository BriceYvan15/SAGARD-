import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, MapPin, UserCheck,
  Activity, Receipt, Settings, LogOut,
  UsersRound, Package, Bot, Bell, ClipboardList, Target,
  FileCheck, FileBadge, Briefcase, UserCog, DoorOpen, Calculator, History,
  ChevronDown, ChevronLeft, ChevronRight, X,
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

function UserCard({ compact }: { compact?: boolean }) {
  const user = getUser()
  if (!user) return null
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  if (compact) {
    return (
      <div className="flex justify-center">
        <div className="w-7 h-7 rounded-full bg-sagard-yellow flex items-center justify-center text-sagard-dark font-bold text-[10px]">
          {initials}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors duration-200 cursor-default">
      <div className="relative flex-shrink-0">
        <div className="w-7 h-7 rounded-full bg-sagard-yellow flex items-center justify-center text-sagard-dark font-bold text-[10px]">
          {initials}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-sagard-dark" />
      </div>
      <div className="overflow-hidden flex-1 min-w-0">
        <div className="text-white text-xs font-semibold truncate leading-tight">{user.firstName} {user.lastName}</div>
        <div className="text-slate-500 text-[10px] truncate leading-tight">{ROLE_LABELS[user.role] ?? user.role}</div>
      </div>
    </div>
  )
}

interface SidebarProps {
  mode: 'pinned' | 'hover'
  onToggleMode: () => void
  onClose?: () => void
}

export default function Sidebar({ mode, onToggleMode, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [isHovering, setIsHovering] = useState(false)
  const isHover = mode === 'hover'
  const expanded = !isHover || isHovering
  // On mobile, always show full width — hover mode is desktop-only
  const mobileExpanded = true

  const toggleGroup = (i: number) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const handleToggle = () => {
    onToggleMode()
    setIsHovering(false)
  }

  return (
    <aside
      onMouseEnter={() => isHover && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`w-60 ${expanded ? 'lg:w-60' : 'lg:w-[60px]'} h-screen flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
      style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >

      {/* Logo + toggle */}
      <div className="flex items-center gap-3 px-4 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-sagard-yellow/30">
          <img src={logoSagard} alt="SAGARD" className="w-full h-full object-cover" />
        </div>
        <div className={`overflow-hidden whitespace-nowrap transition-opacity duration-200 flex-1 opacity-100 ${expanded ? 'lg:opacity-100' : 'lg:opacity-0'}`}>
          <span className="text-white font-semibold text-sm tracking-tight">SAGARD</span>
          <span className="text-slate-500 text-xs ml-1.5">ERP</span>
        </div>
        <button
          onClick={handleToggle}
          title={isHover ? 'Épingler la sidebar' : 'Rétracter au survol'}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-150 flex-shrink-0 hidden lg:block"
        >
          {isHover ? <ChevronRight size={16} strokeWidth={2} /> : <ChevronLeft size={16} strokeWidth={2} />}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-150 flex-shrink-0 lg:hidden"
          >
            <X size={18} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: 'none' }}>
        {navGroups.map((group, gi) => {
          const visibleItems = group.items.filter(({ to }) => hasAccess(to.replace('/', '')))
          if (visibleItems.length === 0 && group.title) return null
          const isCollapsed = collapsed.has(gi)

          return (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.title && (
                <button
                  onClick={() => toggleGroup(gi)}
                  className={`w-full flex items-center justify-between px-3 mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-400 transition-colors opacity-100 ${expanded ? 'lg:opacity-100' : 'lg:opacity-0'}`}
                >
                  <span className="whitespace-nowrap overflow-hidden">{group.title}</span>
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-200 flex-shrink-0 ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                </button>
              )}
              <div
                className="space-y-px overflow-hidden transition-all duration-200"
                style={{
                  maxHeight: isCollapsed ? 0 : '500px',
                  opacity: isCollapsed ? 0 : 1,
                }}
              >
                {visibleItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={isHover && !expanded ? label : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-sagard-yellow/12 text-sagard-yellow'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sagard-yellow rounded-r-full" />
                        )}
                        <Icon size={14.5} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
                        <span className={`truncate whitespace-nowrap transition-opacity duration-200 opacity-100 ${expanded ? 'lg:opacity-100' : 'lg:opacity-0'}`}>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="pt-3 space-y-px">
          {hasAccess('parametres') && (
            <NavLink
              to="/parametres"
              title={isHover && !expanded ? 'Paramètres' : undefined}
              className={({ isActive }) =>
                `relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sagard-yellow/12 text-sagard-yellow'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sagard-yellow rounded-r-full" />}
                  <Settings size={14.5} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
                  <span className={`truncate whitespace-nowrap transition-opacity duration-200 opacity-100 ${expanded ? 'lg:opacity-100' : 'lg:opacity-0'}`}>Paramètres</span>
                </>
              )}
            </NavLink>
          )}
          <button onClick={logout}
            title={isHover && !expanded ? 'Déconnexion' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 ${!expanded ? 'lg:justify-center' : ''}`}>
            <LogOut size={14.5} strokeWidth={1.8} className="flex-shrink-0" />
            <span className={`truncate whitespace-nowrap transition-opacity duration-200 opacity-100 ${expanded ? 'lg:opacity-100' : 'lg:opacity-0'}`}>Déconnexion</span>
          </button>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="mt-2 pt-2">
            <div className={`${!expanded ? 'lg:flex lg:justify-center' : ''}`}>
              <UserCard compact={false} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
