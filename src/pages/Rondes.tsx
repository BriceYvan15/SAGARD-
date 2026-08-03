import { useState } from 'react'
import {
  Footprints, MapPin, Clock, CheckCircle2, AlertTriangle, XCircle,
  Loader2, ChevronRight, Filter, X,
} from 'lucide-react'
import { useApi } from '../lib/useApi'
import { fmtDate, clsx } from '../lib/utils'
import { getPatrols, getPatrol, PATROL_STATES } from '../services/patrols.service'

const STATE_CONFIG: Record<string, { label: string; icon: any; cls: string }> = {
  EN_COURS: { label: 'En cours', icon: Loader2, cls: 'bg-blue-100 text-blue-700' },
  TERMINEE: { label: 'Terminée', icon: CheckCircle2, cls: 'bg-green-100 text-green-700' },
  INCOMPLETE: { label: 'Incomplète', icon: AlertTriangle, cls: 'bg-amber-100 text-amber-700' },
  INTERROMPUE: { label: 'Interrompue', icon: XCircle, cls: 'bg-red-100 text-red-700' },
}

function fmtDateTime(s?: string | null): string {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return s }
}

function fmtTime(s?: string | null): string {
  if (!s) return '—'
  try { return new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
  catch { return s }
}

export default function Rondes() {
  const [filterState, setFilterState] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: rounds, loading } = useApi(() => getPatrols(filterState ? { state: filterState } : {}), [filterState])
  const { data: detail } = useApi(() => selectedId ? getPatrol(selectedId) : Promise.resolve(null), [selectedId])

  const list = (rounds as any[]) ?? []
  const selected = detail as any

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Footprints size={24} className="text-sagard-yellow" />
          Rondes
        </h1>
        <p className="text-slate-500 text-sm mt-1">Historique des rondes de patrol des agents</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-slate-400" />
        <button
          onClick={() => setFilterState('')}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition',
            filterState === '' ? 'bg-sagard-yellow text-sagard-dark' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
          )}
        >
          Toutes
        </button>
        {PATROL_STATES.map(s => (
          <button
            key={s.value}
            onClick={() => setFilterState(s.value)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition',
              filterState === s.value ? 'bg-sagard-yellow text-sagard-dark' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(STATE_CONFIG).map(([key, cfg]) => {
          const count = list.filter(r => r.state === key).length
          return (
            <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase">{cfg.label}</span>
                <cfg.icon size={14} className={cfg.cls.split(' ')[1]} />
              </div>
              <p className="text-2xl font-black text-slate-900">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <Footprints size={40} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Aucune ronde enregistrée</p>
          <p className="text-slate-300 text-sm mt-1">Les rondes effectuées par les agents apparaîtront ici.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Référence</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Agent</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Site</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Durée</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Progression</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">État</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((r: any) => {
                const cfg = STATE_CONFIG[r.state] ?? STATE_CONFIG.EN_COURS
                const agentName = r.agent?.user ? `${r.agent.user.firstName} ${r.agent.user.lastName}` : '—'
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-800 text-sm">{r.reference}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-600 text-sm">{agentName}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-300" />
                        <span className="text-slate-600 text-sm">{r.site?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-300" />
                        <span className="text-slate-500 text-sm">{fmtDateTime(r.dateStart)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-500 text-sm">{r.durationMin ? `${r.durationMin} min` : '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sagard-yellow rounded-full"
                            style={{ width: `${Math.min(r.completionPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{r.completionPct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold', cfg.cls)}>
                        <cfg.icon size={12} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ChevronRight size={14} className="text-slate-300" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-black text-slate-900 text-lg">{selected.reference}</h2>
                <p className="text-slate-400 text-sm">Détails de la ronde</p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Agent</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {selected.agent?.user ? `${selected.agent.user.firstName} ${selected.agent.user.lastName}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Site</p>
                  <p className="text-sm font-semibold text-slate-700">{selected.site?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Début</p>
                  <p className="text-sm text-slate-600">{fmtDateTime(selected.dateStart)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Fin</p>
                  <p className="text-sm text-slate-600">
                    {selected.dateEnd ? fmtDateTime(selected.dateEnd) : 'En cours...'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Durée</p>
                  <p className="text-sm text-slate-600">{selected.durationMin ? `${selected.durationMin} min` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Progression</p>
                  <p className="text-sm text-slate-600">{selected.pointsDone}/{selected.pointsTotal} points ({selected.completionPct}%)</p>
                </div>
              </div>

              {/* Checks list */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Points de contrôle scannés</p>
                {selected.checks?.length > 0 ? (
                  <div className="space-y-2">
                    {selected.checks.map((c: any, i: number) => (
                      <div key={c.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                        <div className={clsx(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                          c.hasAnomaly ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        )}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-700">
                            {c.pointCode ?? c.point?.code ?? 'Point inconnu'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {fmtTime(c.checkTime)}
                            {c.note ? ` · ${c.note}` : ''}
                          </p>
                        </div>
                        {c.hasAnomaly && <AlertTriangle size={16} className="text-red-500" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm text-center py-4">Aucun point scanné</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
