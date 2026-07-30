import { useState, useEffect } from 'react'
import {
  Activity, Search, Sun, Moon, Clock, Navigation, Calendar,
  Loader2, Plus, X, MapPin, UserCheck, Play, Square, ArrowRightLeft, History
} from 'lucide-react'
import AgentMap from '../components/AgentMap'
import { useApi } from '../lib/useApi'
import { fmtDate } from '../lib/utils'
import {
  getTodayPointages, getPointagesByDate, getPointagesRange, getDeployments, createDeployment, activateDeployment,
  endDeployment, transferDeployment, getTransfers
} from '../services/operations.service'
import { getAgents } from '../services/agents.service'
import { getSites } from '../services/sites.service'
import Select from '../components/Select'
import DatePicker from '../components/DatePicker'

type Tab = 'pointages' | 'deployments' | 'positions' | 'transfers'

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'pointages',   label: 'Pointages',     icon: Clock },
  { key: 'deployments', label: 'Déploiements',  icon: MapPin },
  { key: 'positions',   label: 'Positions',     icon: Navigation },
  { key: 'transfers',    label: 'Mutations',     icon: ArrowRightLeft },
]

const DEP_STATE: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
  ACTIF:     { label: 'Actif',     cls: 'bg-green-100 text-green-700' },
  TERMINE:   { label: 'Terminé',   cls: 'bg-slate-100 text-slate-500' },
  REMPLACE:  { label: 'Remplacé',  cls: 'bg-amber-100 text-amber-700' },
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40'

function fmtTime(iso?: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

export default function Operations() {
  const [tab, setTab] = useState<Tab>('pointages')
  const [search, setSearch] = useState('')
  const [shiftFilter, setShift] = useState('all')
  const [siteFilter, setSiteFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Date filter for pointages: 'today' | 'week' | 'all' | 'custom'
  const [dateMode, setDateMode] = useState<'today' | 'week' | 'all' | 'custom'>('today')
  const [ptDate, setPtDate] = useState('')
  const [ptData, setPtData] = useState<any[] | null>(null)
  const [ptLoading, setPtLoading] = useState(false)

  const loadPointages = async () => {
    setPtLoading(true)
    try {
      let data: any[]
      const todayStr = new Date().toISOString().slice(0, 10)
      if (dateMode === 'today') {
        data = await getPointagesByDate(todayStr)
      } else if (dateMode === 'custom' && ptDate) {
        data = await getPointagesByDate(ptDate)
      } else if (dateMode === 'week') {
        const now = new Date()
        const monday = new Date(now)
        const day = monday.getDay() || 7
        monday.setDate(monday.getDate() - day + 1)
        const sunday = new Date(monday)
        sunday.setDate(sunday.getDate() + 6)
        data = await getPointagesRange(monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10))
      } else {
        // all: last 30 days
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 30)
        data = await getPointagesRange(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10))
      }
      setPtData(data)
    } catch {
      setPtData([])
    } finally {
      setPtLoading(false)
    }
  }

  useEffect(() => { loadPointages() }, [dateMode, ptDate])
  const { data: depData, loading: depLoading, reload: reloadDeps } = useApi(getDeployments)
  const { data: agentsData } = useApi(getAgents)
  const { data: sitesData }  = useApi(getSites)

  const pointages   = ptData ?? []
  const deployments = (depData as any[]) ?? []
  const agents      = (agentsData as any[]) ?? []
  const sites       = (sitesData as any[]) ?? []
  const sitesMap    = new Map(sites.map((s: any) => [s.id, s]))

  // ─── Déploiement modal ───
  const [showDepModal, setShowDepModal] = useState(false)
  const [depForm, setDepForm] = useState({ agentId: '', siteId: '', shift: 'JOUR', startDate: '', endDate: '', state: 'ACTIF', notes: '' })
  const [depSaving, setDepSaving] = useState(false)
  const [depError, setDepError] = useState<string | null>(null)

  // ─── Transfer modal ───
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferTarget, setTransferTarget] = useState<any | null>(null)
  const [transferForm, setTransferForm] = useState({ toSiteId: '', motif: '', transferDate: '' })
  const [transferSaving, setTransferSaving] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)

  // ─── Transfers data ───
  const { data: transfersData, loading: transfersLoading, reload: reloadTransfers } = useApi(getTransfers)
  const transfers = (transfersData as any[]) ?? []

  const openTransfer = (dep: any) => {
    setTransferTarget(dep)
    setTransferForm({ toSiteId: '', motif: '', transferDate: new Date().toISOString().slice(0, 10) })
    setTransferError(null)
    setShowTransferModal(true)
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferTarget) return
    if (!transferForm.toSiteId) { setTransferError('Le site de destination est obligatoire.'); return }
    if (!transferForm.motif.trim()) { setTransferError('Le motif de la mutation est obligatoire.'); return }
    if (transferForm.toSiteId === transferTarget.siteId) { setTransferError('Le site de destination doit être différent du site actuel.'); return }
    setTransferSaving(true); setTransferError(null)
    try {
      await transferDeployment(transferTarget.id, {
        toSiteId: transferForm.toSiteId,
        motif: transferForm.motif.trim(),
        transferDate: transferForm.transferDate || undefined,
      })
      setShowTransferModal(false)
      setTransferTarget(null)
      reloadDeps()
      reloadTransfers()
    } catch (err: any) { setTransferError(err.response?.data?.message ?? 'Erreur lors de la mutation') }
    finally { setTransferSaving(false) }
  }


  // Pointages filter
  const filteredPt = pointages.filter(op => {
    const q = search.toLowerCase()
    const agentName = `${op.agent?.user?.firstName ?? ''} ${op.agent?.user?.lastName ?? ''}`.toLowerCase()
    const siteName  = (op.deployment?.site?.name ?? sitesMap.get(op.siteId)?.name ?? '').toLowerCase()
    const matchSearch = !q || agentName.includes(q) || siteName.includes(q)
    const matchShift  = shiftFilter === 'all' || (op.shift ?? '').toLowerCase() === shiftFilter
    const matchSite   = !siteFilter || op.siteId === siteFilter || op.deployment?.siteId === siteFilter
    const isDone = !!op.checkOutTime
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'en_cours' && !isDone)
      || (statusFilter === 'termine' && isDone)
      || (statusFilter === 'retard' && (op.lateMinutes ?? 0) > 0)
    return matchSearch && matchShift && matchSite && matchStatus
  })

  const today      = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const inProgress = pointages.filter(o => !o.checkOutTime).length
  const done       = pointages.filter(o => !!o.checkOutTime).length


  const handleCreateDep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!depForm.agentId || !depForm.siteId) { setDepError('Agent et site sont obligatoires.'); return }
    setDepSaving(true); setDepError(null)
    try {
      await createDeployment({
        ...depForm,
        startDate: depForm.startDate || new Date().toISOString(),
        endDate: depForm.endDate || undefined,
      })
      setShowDepModal(false)
      reloadDeps()
    } catch (err: any) { setDepError(err.response?.data?.message ?? 'Erreur') }
    finally { setDepSaving(false) }
  }


  return (
    <div className="space-y-5">
      {/* Day banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sagard-yellow text-xs font-bold uppercase tracking-widest">Opérations</p>
          <p className="text-white text-lg font-bold capitalize mt-0.5">{today}</p>
        </div>
        <div className="flex gap-4 sm:gap-6 text-center flex-wrap">
          {ptLoading ? (
            <Loader2 className="animate-spin text-slate-400 my-2" size={22} />
          ) : (
            <>
              <div><p className="text-2xl font-black text-sagard-yellow">{inProgress}</p><p className="text-slate-400 text-xs">En poste</p></div>
              <div><p className="text-2xl font-black text-green-400">{done}</p><p className="text-slate-400 text-xs">Terminés</p></div>
              <div className="hidden sm:block"><p className="text-2xl font-black text-blue-400">{deployments.filter(d => d.state === 'ACTIF').length}</p><p className="text-slate-400 text-xs">Affect.</p></div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-1 justify-center whitespace-nowrap ${tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ═══ TAB POINTAGES ═══ */}
      {tab === 'pointages' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          {/* Filter bar */}
          <div className="flex flex-col gap-3 p-4 border-b border-slate-100">
            {/* Row 1: Search + Date quick filters */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher (agent, site, matricule)..."
                  className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100">
                    <X size={14} className="text-slate-400" />
                  </button>
                )}
              </div>

              {/* Date quick filters */}
              <div className="flex gap-1 flex-wrap items-center">
                {([
                  { key: 'all', label: 'Toutes dates', icon: Calendar },
                  { key: 'today', label: "Aujourd'hui", icon: Calendar },
                  { key: 'week', label: 'Cette semaine', icon: Calendar },
                ] as const).map(d => {
                  const Icon = d.icon
                  return (
                    <button key={d.key} onClick={() => { setDateMode(d.key); setPtDate('') }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${dateMode === d.key ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      <Icon size={13} /> {d.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Row 2: Filters (shift, site, status, custom date) */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              {/* Shift filter with count */}
              <Select
                value={shiftFilter}
                onChange={v => setShift(v)}
                size="sm"
                className="w-full sm:w-44"
                options={[
                  { value: 'all', label: `Toutes vacations (${pointages.length})` },
                  { value: 'jour', label: `Jour (${pointages.filter(p => (p.shift ?? '').toLowerCase() === 'jour').length})` },
                  { value: 'nuit', label: `Nuit (${pointages.filter(p => (p.shift ?? '').toLowerCase() === 'nuit').length})` },
                ]}
              />

              {/* Site filter */}
              <Select
                value={siteFilter}
                onChange={v => setSiteFilter(v)}
                size="sm"
                className="w-full sm:w-52"
                placeholder="Tous les sites"
                options={sites.map((s: any) => ({ value: s.id, label: s.name }))}
              />

              {/* Status filter */}
              <Select
                value={statusFilter}
                onChange={v => setStatusFilter(v)}
                size="sm"
                className="w-full sm:w-40"
                options={[
                  { value: 'all', label: 'Tous états' },
                  { value: 'en_cours', label: 'En cours' },
                  { value: 'termine', label: 'Terminé' },
                  { value: 'retard', label: 'En retard' },
                ]}
              />

              {/* Custom date picker */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setDateMode('custom')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${dateMode === 'custom' ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <Calendar size={13} /> Date précise
                </button>
                {dateMode === 'custom' && (
                  <DatePicker value={ptDate} onChange={v => setPtDate(v)} placeholder="Choisir date" className="w-44" />
                )}
              </div>
            </div>
          </div>
          {ptLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10"><tr className="bg-slate-50 border-b border-slate-100">
                  {['Agent','Site','Vacation','Prise','Fin','Statut'].map((h, i) => <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase bg-slate-50 ${i === 2 || i === 3 || i === 4 ? 'hidden md:table-cell' : ''}`}>{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPt.map(op => {
                    const isNight = (op.shift ?? '').toLowerCase() === 'nuit'
                    const isDone = !!op.checkOutTime
                    return (
                      <tr key={op.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3"><p className="font-semibold text-slate-800">{op.agent?.user?.firstName} {op.agent?.user?.lastName}</p><p className="text-xs text-slate-400">{op.agent?.matricule}</p></td>
                        <td className="px-4 py-3 text-xs text-slate-600">{op.deployment?.site?.name ?? sitesMap.get(op.siteId)?.name ?? '—'}</td>
                        <td className="px-4 py-3 hidden md:table-cell"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isNight ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>{isNight ? 'Nuit' : 'Jour'}</span></td>
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-700 hidden md:table-cell">{fmtTime(op.checkInTime)}</td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-500 hidden md:table-cell">{op.checkOutTime ? fmtTime(op.checkOutTime) : <span className="text-blue-500 font-semibold">En cours</span>}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${isDone ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{isDone ? 'Terminé' : 'En cours'}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredPt.length === 0 && <div className="text-center py-12 text-slate-400"><Activity size={40} className="mx-auto mb-3 opacity-30" /><p>Aucun pointage {ptDate ? 'à cette date' : 'aujourd\'hui'}</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB DÉPLOIEMENTS ═══ */}
      {tab === 'deployments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 gap-3">
            <p className="text-sm font-bold text-slate-700 hidden sm:block">{deployments.length} affectations</p>
            <button onClick={() => { setDepError(null); setShowDepModal(true) }}
              className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-sagard-yellow-dark transition-colors ml-auto">
              <Plus size={15} /> <span className="hidden sm:inline">Nouvelle affectation</span><span className="sm:hidden">Affectation</span>
            </button>
          </div>
          {depLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10"><tr className="bg-slate-50 border-b border-slate-100">
                  {['Réf','Agent','Site','Vacation','Début','Fin','État','Actions'].map((h, i) => <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase bg-slate-50 ${i === 0 || i === 4 || i === 5 ? 'hidden md:table-cell' : ''}`}>{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {deployments.map(dep => {
                    const st = DEP_STATE[dep.state] ?? { label: dep.state, cls: 'bg-slate-100 text-slate-500' }
                    return (
                      <tr key={dep.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 hidden md:table-cell">{dep.reference}</td>
                        <td className="px-4 py-3"><p className="font-semibold text-slate-800">{dep.agent?.user?.firstName} {dep.agent?.user?.lastName}</p></td>
                        <td className="px-4 py-3 text-xs text-slate-600">{dep.site?.name}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dep.shift === 'NUIT' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>{dep.shift}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell">{fmtDate(dep.startDate)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{dep.endDate ? fmtDate(dep.endDate) : '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {dep.state === 'BROUILLON' && (
                              <button onClick={async () => { await activateDeployment(dep.id); reloadDeps() }}
                                className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Activer"><Play size={13} /></button>
                            )}
                            {dep.state === 'ACTIF' && (
                              <>
                                <button onClick={() => openTransfer(dep)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Muter vers un autre site"><ArrowRightLeft size={13} /></button>
                                <button onClick={async () => { await endDeployment(dep.id); reloadDeps() }}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Terminer"><Square size={13} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {deployments.length === 0 && <div className="text-center py-12 text-slate-400"><MapPin size={40} className="mx-auto mb-3 opacity-30" /><p>Aucune affectation</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB POSITIONS ═══ */}
      {tab === 'positions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-700">Position des agents</p>
              <p className="text-xs text-slate-400">Position GPS des agents en poste aujourd'hui</p>
            </div>
            <div className="flex gap-3 text-center">
              <div><p className="text-xl font-black text-green-600">{pointages.filter(pt => pt.checkInLat && pt.checkInLng).length}</p><p className="text-[10px] text-slate-400">En poste</p></div>
              <div><p className="text-xl font-black text-slate-400">{agents.length - pointages.filter(pt => pt.checkInLat && pt.checkInLng).length}</p><p className="text-[10px] text-slate-400">Non pointés</p></div>
            </div>
          </div>
          {ptLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
          ) : (
            <div className="flex flex-col lg:flex-row" style={{ height: '600px' }}>
              <div className="flex-1 relative">
                <AgentMap markers={[
                  // Agents en poste avec position GPS du pointage
                  ...pointages
                    .filter(pt => pt.checkInLat && pt.checkInLng)
                    .map(pt => ({
                      id: pt.id,
                      name: `${pt.agent?.user?.firstName ?? ''} ${pt.agent?.user?.lastName ?? ''}`,
                      siteName: pt.deployment?.site?.name ?? '—',
                      phone: pt.agent?.user?.phone,
                      shift: pt.shift,
                      lat: pt.checkInLat,
                      lng: pt.checkInLng,
                      type: 'agent' as const,
                    })),
                  // Agents affectés sans pointage mais avec coordonnées de site
                  ...agents
                    .filter(a => {
                      const site = a.deployments?.[0]?.site
                      return site?.latitude && site?.longitude && !pointages.some(pt => pt.agentId === a.id && pt.checkInLat && pt.checkInLng)
                    })
                    .map(a => {
                      const site = a.deployments?.[0]?.site
                      return {
                        id: a.id,
                        name: `${a.user?.firstName ?? ''} ${a.user?.lastName ?? ''}`,
                        siteName: site?.name ?? '—',
                        phone: a.user?.phone,
                        shift: a.shift,
                        lat: site.latitude,
                        lng: site.longitude,
                        type: 'site' as const,
                      }
                    }),
                ]} />
              </div>
              <div className="lg:w-80 overflow-y-auto border-t lg:border-t-0 lg:border-l border-slate-100">
                {pointages.filter(pt => pt.checkInLat && pt.checkInLng).map(pt => {
                  const lat = pt.checkInLat
                  const lng = pt.checkInLng
                  return (
                    <div key={pt.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => {
                        const event = new CustomEvent('agent-map-focus', { detail: { lat, lng } })
                        window.dispatchEvent(event)
                      }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold bg-green-100 text-green-700">
                        {(pt.agent?.user?.firstName?.[0] ?? '') + (pt.agent?.user?.lastName?.[0] ?? '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{pt.agent?.user?.firstName} {pt.agent?.user?.lastName}</p>
                        <p className="text-xs text-slate-500 truncate">📍 {pt.deployment?.site?.name ?? '—'}</p>
                      </div>
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-green-500" title="En poste" />
                    </div>
                  )
                })}
                {agents.filter(a => {
                  const site = a.deployments?.[0]?.site
                  return site?.latitude && site?.longitude && !pointages.some(pt => pt.agentId === a.id && pt.checkInLat && pt.checkInLng)
                }).map(a => {
                  const site = a.deployments?.[0]?.site
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => {
                        const event = new CustomEvent('agent-map-focus', { detail: { lat: site.latitude, lng: site.longitude } })
                        window.dispatchEvent(event)
                      }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold bg-amber-100 text-amber-700">
                        {(a.user?.firstName?.[0] ?? '') + (a.user?.lastName?.[0] ?? '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{a.user?.firstName} {a.user?.lastName}</p>
                        <p className="text-xs text-slate-500 truncate">📍 {site?.name ?? 'Non affecté'}</p>
                      </div>
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-amber-400" title="Affecté (non pointé)" />
                    </div>
                  )
                })}
                {agents.filter(a => {
                  const site = a.deployments?.[0]?.site
                  return !site?.latitude && !pointages.some(pt => pt.agentId === a.id && pt.checkInLat && pt.checkInLng)
                }).map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 opacity-60">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold bg-slate-100 text-slate-400">
                      {(a.user?.firstName?.[0] ?? '') + (a.user?.lastName?.[0] ?? '')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.user?.firstName} {a.user?.lastName}</p>
                      <p className="text-xs text-slate-500 truncate">{a.deployments?.[0]?.site?.name ?? 'Non affecté'}</p>
                    </div>
                    <span className="w-2 h-2 rounded-full flex-shrink-0 bg-slate-300" title="Pas de coordonnées" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB MUTATIONS ═══ */}
      {tab === 'transfers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><ArrowRightLeft size={16} className="text-sagard-yellow-dark" /> Historique des mutations</p>
              <p className="text-xs text-slate-400 mt-0.5">Suivi des transferts d'agents entre sites</p>
            </div>
          </div>
          {transfersLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-12 text-slate-400"><History size={40} className="mx-auto mb-3 opacity-30" /><p>Aucune mutation enregistrée</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Agent</th>
                    <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Site source</th>
                    <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Site destination</th>
                    <th className="px-4 py-3 text-left font-semibold">Motif</th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Date</th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Décidé par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transfers.map(tr => (
                    <tr key={tr.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{tr.agent?.user?.firstName} {tr.agent?.user?.lastName}</p>
                        <p className="text-xs text-slate-400">{tr.agent?.matricule}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />{tr.fromSite?.name}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />{tr.toSite?.name}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-xs">
                        <p className="truncate" title={tr.motif}>{tr.motif}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{fmtDate(tr.transferDate)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                        {tr.decidedBy ? `${tr.decidedBy.firstName} ${tr.decidedBy.lastName}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ MODAL TRANSFERT ═══ */}
      {showTransferModal && transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ArrowRightLeft size={18} className="text-blue-600" /> Mutation d'agent</h2>
              <button onClick={() => setShowTransferModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
            </div>
            <form onSubmit={handleTransfer} className="px-6 py-5 space-y-4">
              {transferError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{transferError}</p>}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-semibold text-slate-500 w-20">Agent</span>
                  <span className="font-semibold text-slate-800">{transferTarget.agent?.user?.firstName} {transferTarget.agent?.user?.lastName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-semibold text-slate-500 w-20">Site actuel</span>
                  <span className="text-slate-700">{transferTarget.site?.name}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Site de destination *</label>
                <Select value={transferForm.toSiteId} onChange={v => setTransferForm(f => ({ ...f, toSiteId: v }))}
                  options={sites.filter((s: any) => s.id !== transferTarget.siteId).map((s: any) => ({ value: s.id, label: `${s.name}${s.city ? ` (${s.city})` : ''}` }))}
                  placeholder="-- Sélectionner le nouveau site --" className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Motif de la mutation *</label>
                <textarea value={transferForm.motif} onChange={e => setTransferForm(f => ({ ...f, motif: e.target.value }))}
                  rows={3} className={inputCls} placeholder="Ex: Remplacement d'agent défaillant, renforcement temporaire, demande client..." required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date de la mutation</label>
                <DatePicker value={transferForm.transferDate} onChange={v => setTransferForm(f => ({ ...f, transferDate: v }))} className="w-full" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={transferSaving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
                  {transferSaving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />} Confirmer la mutation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL DÉPLOIEMENT ═══ */}
      {showDepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-sagard-yellow-dark" /> Nouvelle affectation</h2>
              <button onClick={() => setShowDepModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
            </div>
            <form onSubmit={handleCreateDep} className="px-6 py-5 space-y-4">
              {depError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{depError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Agent *</label>
                  <Select value={depForm.agentId} onChange={v => setDepForm(f => ({...f, agentId: v}))}
                    options={agents.map((a: any) => ({ value: a.id, label: `${a.user?.firstName} ${a.user?.lastName} (${a.matricule})` }))}
                    placeholder="-- Sélectionner --" className="w-full" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Site *</label>
                  <Select value={depForm.siteId} onChange={v => setDepForm(f => ({...f, siteId: v}))}
                    options={sites.map((s: any) => ({ value: s.id, label: `${s.name}${s.city ? ` (${s.city})` : ''}` }))}
                    placeholder="-- Sélectionner --" className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vacation</label>
                  <Select value={depForm.shift} onChange={v => setDepForm(f => ({...f, shift: v}))}
                    options={[{ value: 'JOUR', label: 'Jour' }, { value: 'NUIT', label: 'Nuit' }, { value: 'MIXTE', label: 'Mixte' }]} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">État initial</label>
                  <Select value={depForm.state} onChange={v => setDepForm(f => ({...f, state: v}))}
                    options={[{ value: 'ACTIF', label: 'Actif immédiatement' }, { value: 'BROUILLON', label: 'Brouillon' }]} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date début</label>
                  <DatePicker value={depForm.startDate} onChange={v => setDepForm(f => ({...f, startDate: v}))} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date fin (optionnel)</label>
                  <DatePicker value={depForm.endDate} onChange={v => setDepForm(f => ({...f, endDate: v}))} className="w-full" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                  <input value={depForm.notes} onChange={e => setDepForm(f => ({...f, notes: e.target.value}))} className={inputCls} placeholder="Optionnel..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowDepModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={depSaving} className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                  {depSaving ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
