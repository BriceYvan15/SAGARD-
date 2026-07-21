import { useState, useEffect } from 'react'
import { History, Filter, Loader2, User, Search, Pencil, Trash2, Plus } from 'lucide-react'
import { getAuditHistory } from '../services/audit.service'
import { fmtDate } from '../lib/utils'
import Select from '../components/Select'

const ENTITIES = [
  { value: '', label: 'Toutes les entités' },
  { value: 'Agent', label: 'Agents' },
  { value: 'Client', label: 'Clients' },
  { value: 'Site', label: 'Sites' },
  { value: 'Payment', label: 'Paiements' },
  { value: 'ManualExpense', label: 'Dépenses' },
]

const ACTION_META: Record<string, { label: string; color: string; icon: any }> = {
  CREATE: { label: 'Création', color: 'bg-green-100 text-green-700', icon: Plus },
  UPDATE: { label: 'Modification', color: 'bg-blue-100 text-blue-700', icon: Pencil },
  DELETE: { label: 'Suppression', color: 'bg-red-100 text-red-700', icon: Trash2 },
}

export default function AuditTrail() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [entity, setEntity] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    getAuditHistory({ entity: entity || undefined, page, limit: 50 })
      .then((data) => setLogs(Array.isArray(data) ? data : data.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [entity, page])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5">
        <p className="text-sagard-yellow text-xs font-bold uppercase tracking-widest">Traçabilité</p>
        <p className="text-white text-lg font-bold mt-0.5">Journal des modifications</p>
        <p className="text-slate-400 text-xs mt-1">Historique de toutes les créations, modifications et suppressions</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-slate-400" />
        <Select value={entity} onChange={v => { setEntity(v); setPage(1) }}
          options={ENTITIES.map(e => ({ value: e.value, label: e.label }))} className="w-full sm:w-48" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Date', 'Heure', 'Utilisateur', 'Action', 'Entité', 'ID', 'Détails'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log: any) => {
                  const meta = ACTION_META[log.action] ?? ACTION_META.UPDATE
                  const Icon = meta.icon
                  const changes = log.action === 'UPDATE' && log.oldData && log.newData
                    ? Object.keys(log.newData).filter(k => k !== 'updatedAt' && k !== 'createdAt' && String(log.oldData?.[k] ?? '') !== String(log.newData[k] ?? ''))
                    : []

                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(log.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">
                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${meta.color}`}>
                          <Icon size={10} /> {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-700">{log.entity}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400 max-w-[80px] truncate">{log.entityId?.slice(0, 8) ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px]">
                        {log.action === 'DELETE' && <span className="text-red-500">Désactivé</span>}
                        {log.action === 'CREATE' && <span className="text-green-600">Nouvel enregistrement</span>}
                        {log.action === 'UPDATE' && changes.length > 0 && (
                          <span>{changes.length} champ{changes.length > 1 ? 's' : ''}: {changes.slice(0, 3).join(', ')}{changes.length > 3 ? '…' : ''}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                      <History size={40} className="mx-auto mb-3 opacity-30" />
                      <p>Aucune modification enregistrée</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logs.length >= 50 && (
            <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-100">
                Précédent
              </button>
              <span className="text-xs text-slate-500">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-100">
                Suivant
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
