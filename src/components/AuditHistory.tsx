import { useState, useEffect } from 'react'
import { History, ChevronDown, ChevronUp, User, Pencil, Trash2, Plus } from 'lucide-react'
import { getEntityHistory } from '../services/audit.service'
import { fmtDate } from '../lib/utils'

const ACTION_META: Record<string, { label: string; color: string; icon: any }> = {
  CREATE: { label: 'Création', color: 'bg-green-100 text-green-700', icon: Plus },
  UPDATE: { label: 'Modification', color: 'bg-blue-100 text-blue-700', icon: Pencil },
  DELETE: { label: 'Suppression', color: 'bg-red-100 text-red-700', icon: Trash2 },
}

function diffFields(oldData: any, newData: any): { field: string; from: any; to: any }[] {
  if (!oldData || !newData) return []
  const diffs: { field: string; from: any; to: any }[] = []
  for (const key of Object.keys(newData)) {
    if (key === 'updatedAt' || key === 'createdAt') continue
    const oldVal = oldData[key]
    const newVal = newData[key]
    if (typeof newVal === 'object' && newVal !== null) continue
    if (String(oldVal ?? '') !== String(newVal ?? '')) {
      diffs.push({ field: key, from: oldVal, to: newVal })
    }
  }
  return diffs
}

export default function AuditHistory({ entity, entityId }: { entity: string; entityId: string }) {
  const [logs, setLogs] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (open && logs.length === 0) {
      getEntityHistory(entity, entityId).then(setLogs).catch(() => {})
    }
  }, [open, entity, entityId])

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <History size={15} className="text-slate-400" />
          Historique des modifications
          {logs.length > 0 && <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{logs.length}</span>}
        </span>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {open && (
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {logs.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Aucune modification enregistrée</p>
          )}
          {logs.map((log: any) => {
            const meta = ACTION_META[log.action] ?? ACTION_META.UPDATE
            const Icon = meta.icon
            const diffs = log.action === 'UPDATE' ? diffFields(log.oldData, log.newData) : []
            const isExpanded = expanded === log.id

            return (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${meta.color}`}>
                      <Icon size={10} className="inline mr-1" />{meta.label}
                    </span>
                    <span className="text-xs text-slate-500">{fmtDate(log.createdAt)}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système'}
                    </span>
                  </div>
                </div>

                {diffs.length > 0 && (
                  <button onClick={() => setExpanded(isExpanded ? null : log.id)}
                    className="text-xs text-blue-500 hover:text-blue-700 mt-1 flex items-center gap-1">
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {diffs.length} champ{diffs.length > 1 ? 's' : ''} modifié{diffs.length > 1 ? 's' : ''}
                  </button>
                )}

                {isExpanded && diffs.length > 0 && (
                  <div className="mt-2 bg-slate-50 rounded-lg p-2 space-y-1">
                    {diffs.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-slate-600 min-w-[100px]">{d.field}</span>
                        <span className="text-red-500 line-through">{String(d.from ?? '—')}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-green-600 font-medium">{String(d.to ?? '—')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {log.action === 'DELETE' && (
                  <p className="text-xs text-red-500 mt-1">Enregistrement supprimé / désactivé</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
