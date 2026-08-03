import { useState, useMemo, useEffect } from 'react'
import {
  Footprints, MapPin, Clock, CheckCircle2, AlertTriangle, XCircle,
  Loader2, ChevronRight, X, Calendar, ChevronLeft,
} from 'lucide-react'
import { useApi } from '../lib/useApi'
import { clsx } from '../lib/utils'
import { getPatrols, getPatrol } from '../services/patrols.service'
import DatePicker from '../components/DatePicker'

const STATE_CONFIG: Record<string, { label: string; icon: any; cls: string; ring: string }> = {
  EN_COURS: { label: 'En cours', icon: Loader2, cls: 'bg-blue-100 text-blue-700', ring: 'ring-blue-400' },
  TERMINEE: { label: 'Terminée', icon: CheckCircle2, cls: 'bg-green-100 text-green-700', ring: 'ring-green-400' },
  INCOMPLETE: { label: 'Incomplète', icon: AlertTriangle, cls: 'bg-amber-100 text-amber-700', ring: 'ring-amber-400' },
  INTERROMPUE: { label: 'Interrompue', icon: XCircle, cls: 'bg-red-100 text-red-700', ring: 'ring-red-400' },
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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const { data: rounds, loading } = useApi(
    () => getPatrols({
      ...(filterState ? { state: filterState } : {}),
      ...(dateFrom ? { from: dateFrom } : {}),
      ...(dateTo ? { to: dateTo } : {}),
    }),
    [filterState, dateFrom, dateTo],
  )
  const { data: detail } = useApi(() => selectedId ? getPatrol(selectedId) : Promise.resolve(null), [selectedId])

  const allRounds = (rounds as any[]) ?? []
  const selected = detail as any

  // Count per state from all data (not filtered by state, only by date)
  const counts = useMemo(() => {
    const c: Record<string, number> = { EN_COURS: 0, TERMINEE: 0, INCOMPLETE: 0, INTERROMPUE: 0 }
    // If we have a state filter, counts reflect only that state
    // To get accurate counts we'd need unfiltered data, but for simplicity we count from current list
    allRounds.forEach(r => { if (c[r.state] !== undefined) c[r.state]++ })
    return c
  }, [allRounds])

  const hasDateFilter = dateFrom || dateTo

  useEffect(() => { setPage(1) }, [filterState, dateFrom, dateTo])

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(allRounds.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedRounds = allRounds.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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

      {/* Date filters */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-44">
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Date début</label>
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Du..." max={dateTo || undefined} />
        </div>
        <div className="w-44">
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Date fin</label>
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="Au..." min={dateFrom || undefined} />
        </div>
        {hasDateFilter && (
          <button
            onClick={() => { setDateFrom(''); setDateTo('') }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-red-500 border border-slate-200 rounded-lg hover:border-red-200 transition flex items-center gap-1.5"
          >
            <X size={14} />
            Effacer
          </button>
        )}
      </div>

      {/* Clickable stat cards (also serve as state filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* "Toutes" card */}
        <button
          onClick={() => setFilterState('')}
          className={clsx(
            'text-left rounded-xl p-4 shadow-sm border transition-all',
            filterState === ''
              ? 'bg-sagard-yellow/10 border-sagard-yellow ring-2 ring-sagard-yellow/40'
              : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Toutes</span>
            <Footprints size={14} className="text-sagard-yellow" />
          </div>
          <p className="text-2xl font-black text-slate-900">{allRounds.length}</p>
        </button>
        {Object.entries(STATE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterState(filterState === key ? '' : key)}
            className={clsx(
              'text-left rounded-xl p-4 shadow-sm border transition-all',
              filterState === key
                ? `${cfg.cls} border-transparent ring-2 ${cfg.ring}/40`
                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={clsx('text-xs font-semibold uppercase', filterState === key ? '' : 'text-slate-500')}>{cfg.label}</span>
              <cfg.icon size={14} className={filterState === key ? '' : cfg.cls.split(' ')[1]} />
            </div>
            <p className={clsx('text-2xl font-black', filterState === key ? '' : 'text-slate-900')}>{counts[key] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : allRounds.length === 0 ? (
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
              {paginatedRounds.map((r: any) => {
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {allRounds.length} ronde{allRounds.length > 1 ? 's' : ''} · Page {currentPage}/{totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-slate-300 text-xs">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={clsx(
                          'w-8 h-8 rounded-lg text-xs font-bold transition',
                          p === currentPage
                            ? 'bg-sagard-yellow text-sagard-dark'
                            : 'text-slate-500 hover:bg-slate-100'
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
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
