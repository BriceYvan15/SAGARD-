import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Target, Users, FileText, AlertTriangle, Clock, X, UserPlus, Shield, Package, Briefcase, Volume2, VolumeX } from 'lucide-react'
import { getNotifications, getUnreadCount, markRead, markAllRead } from '../services/notifications.service'
import { unlockAudio, playNotificationSound, isSoundEnabled, setSoundEnabled } from '../lib/notification-sound'

const ICON_MAP: Record<string, any> = {
  PROSPECT: Target,
  CLIENT: Users,
  CONTRAT: FileText,
  FACTURE: FileText,
  FACTURE_RETARD: FileText,
  POINTAGE: Clock,
  ALERTE: AlertTriangle,
  RECRUTEMENT: UserPlus,
  COMMERCIAL: Briefcase,
  INCIDENT: Shield,
  EQUIPEMENT: Package,
  EXPIRATION_CONTRAT: FileText,
  ASSIGNATION: Users,
  RECLAMATION: AlertTriangle,
  SYSTEME: Bell,
}

const COLOR_MAP: Record<string, string> = {
  PROSPECT: 'bg-blue-100 text-blue-600',
  CLIENT: 'bg-green-100 text-green-600',
  CONTRAT: 'bg-purple-100 text-purple-600',
  FACTURE: 'bg-amber-100 text-amber-600',
  FACTURE_RETARD: 'bg-amber-100 text-amber-600',
  POINTAGE: 'bg-teal-100 text-teal-600',
  ALERTE: 'bg-red-100 text-red-600',
  RECRUTEMENT: 'bg-purple-100 text-purple-600',
  COMMERCIAL: 'bg-indigo-100 text-indigo-600',
  INCIDENT: 'bg-red-100 text-red-600',
  EQUIPEMENT: 'bg-orange-100 text-orange-600',
  EXPIRATION_CONTRAT: 'bg-amber-100 text-amber-600',
  ASSIGNATION: 'bg-blue-100 text-blue-600',
  RECLAMATION: 'bg-red-100 text-red-600',
  SYSTEME: 'bg-slate-100 text-slate-600',
}

function getNotificationLink(n: any): string | null {
  switch (n.type) {
    case 'RECRUTEMENT': return '/rh?tab=candidacies'
    case 'EXPIRATION_CONTRAT': return '/rh?tab=alerts'
    case 'POINTAGE': return '/operations'
    case 'INCIDENT': return '/supervision'
    case 'RECLAMATION': return '/supervision'
    case 'ASSIGNATION': return '/operations'
    case 'COMMERCIAL': return '/alertes-commerciales'
    case 'FACTURE':
    case 'FACTURE_RETARD': return '/facturation'
    case 'EQUIPEMENT': return '/stock'
    case 'PROSPECT': return '/prospects'
    case 'CLIENT': return '/clients'
    case 'CONTRAT': return '/contrats'
    default: return null
  }
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [soundOn, setSoundOn] = useState(isSoundEnabled())
  const ref = useRef<HTMLDivElement>(null)
  const prevUnreadRef = useRef(0)
  const prevNotifIdsRef = useRef<Set<string>>(new Set())
  const isFirstLoadRef = useRef(true)

  const load = async () => {
    try {
      const [notifs, count] = await Promise.all([getNotifications(), getUnreadCount()])
      const newUnread = typeof count === 'number' ? count : count?.count ?? 0

      // Detect new notifications (by ID) to play sound
      if (isFirstLoadRef.current) {
        prevNotifIdsRef.current = new Set(notifs.map((n: any) => n.id as string))
        prevUnreadRef.current = newUnread
        isFirstLoadRef.current = false
      } else {
        const currentIds = new Set(notifs.map((n: any) => n.id as string))
        const newNotifs = notifs.filter((n: any) => !prevNotifIdsRef.current.has(n.id))
        if (newNotifs.length > 0 && soundOn) {
          // Play sound based on the most urgent new notification type
          const types = newNotifs.map((n: any) => n.type as string)
          const priorityType = types.find((t: string) => ['INCIDENT', 'ALERTE', 'RECLAMATION'].includes(t))
            || types.find((t: string) => ['FACTURE', 'FACTURE_RETARD', 'COMMERCIAL'].includes(t))
            || types[0]
          playNotificationSound(priorityType)
        }
        prevNotifIdsRef.current = currentIds
        prevUnreadRef.current = newUnread
      }

      setNotifications(notifs)
      setUnread(newUnread)
    } catch {}
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [soundOn])

  // Unlock audio on first user interaction anywhere
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudio()
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('keydown', handleFirstInteraction)
    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleMarkRead = async (id: string) => {
    await markRead(id)
    load()
  }

  const handleClick = async (n: any) => {
    if (!n.read) {
      try { await markRead(n.id) } catch {}
    }
    const link = getNotificationLink(n)
    if (link) {
      setOpen(false)
      navigate(link)
    }
    load()
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    load()
  }

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "à l'instant"
    if (mins < 60) return `il y a ${mins}min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `il y a ${hrs}h`
    const days = Math.floor(hrs / 24)
    return `il y a ${days}j`
  }

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
    if (next) {
      unlockAudio()
      playNotificationSound('SYSTEME')
    }
  }

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      <button onClick={toggleSound} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors" title={soundOn ? 'Désactiver le son' : 'Activer le son'}>
        {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-sm text-slate-700">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  <CheckCheck size={12} /> Tout marquer lu
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((n: any) => {
                const Icon = ICON_MAP[n.type] ?? Bell
                const color = COLOR_MAP[n.type] ?? 'bg-slate-100 text-slate-600'
                return (
                  <div key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
