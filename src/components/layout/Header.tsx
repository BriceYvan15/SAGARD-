import { useState } from 'react'
import { Bell, Search, X, CheckCheck } from 'lucide-react'
import { notifications as allNotifications } from '../../data/mockData'
import { fmtDate } from '../../lib/utils'

const priorityColor: Record<string, string> = {
  danger:  'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  info:    'bg-blue-100 text-blue-700 border-blue-200',
}

const priorityDot: Record<string, string> = {
  danger: 'bg-red-500', warning: 'bg-amber-500', success: 'bg-green-500', info: 'bg-blue-500',
}

interface HeaderProps { title: string; subtitle?: string }

export default function Header({ title, subtitle }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState(allNotifications)
  const unread = notifs.filter(n => !n.read).length

  const markAll = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search bar */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sagard-yellow/50 w-56"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="font-semibold text-slate-800">Notifications</div>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button onClick={markAll} className="text-xs text-sagard-yellow-dark flex items-center gap-1 hover:underline">
                        <CheckCheck size={14} /> Tout lire
                      </button>
                    )}
                    <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {notifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                      className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-sagard-yellow/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? 'bg-slate-300' : priorityDot[n.priority]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-semibold truncate ${!n.read ? 'text-slate-800' : 'text-slate-600'}`}>{n.title}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${priorityColor[n.priority]}`}>
                              {n.priority === 'danger' ? 'Urgent' : n.priority === 'warning' ? 'Attention' : n.priority === 'success' ? 'OK' : 'Info'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{fmtDate(n.createdAt.split('T')[0])}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-sagard-yellow flex items-center justify-center text-sagard-dark font-bold text-sm">
          KD
        </div>
      </div>
    </header>
  )
}
