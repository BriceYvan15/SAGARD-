import { Search } from 'lucide-react'
import { getUser, ROLE_LABELS } from '../../lib/auth'
import NotificationBell from '../NotificationBell'

interface HeaderProps { title: string; subtitle?: string }

export default function Header({ title, subtitle }: HeaderProps) {
  const user = getUser()
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '??'

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sagard-yellow/50 w-56" />
        </div>

        <NotificationBell />

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-sagard-yellow flex items-center justify-center text-sagard-dark font-bold text-sm">
            {initials}
          </div>
          {user && (
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-slate-700">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-slate-400">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
