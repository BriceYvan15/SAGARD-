import { Search, Menu } from 'lucide-react'
import { getUser, ROLE_LABELS } from '../../lib/auth'
import NotificationBell from '../NotificationBell'

interface HeaderProps { title: string; subtitle?: string; onMenuClick?: () => void }

export default function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const user = getUser()
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '??'

  return (
    <header className="h-14 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 bg-white/90 backdrop-blur-md"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>

      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex flex-col justify-center min-w-0">
          <h1 className="text-[15px] font-semibold text-slate-800 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-slate-400 leading-tight mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative hidden md:block">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher..."
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sagard-yellow/30 focus:border-sagard-yellow/50 focus:w-64 w-48 transition-all duration-200" />
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

        <NotificationBell />

        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-sagard-yellow flex items-center justify-center text-sagard-dark font-bold text-[11px] ring-2 ring-sagard-yellow/20 flex-shrink-0">
            {initials}
          </div>
          {user && (
            <div className="hidden lg:block">
              <p className="text-[11px] font-semibold text-slate-700 leading-tight">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
