import { useState, useEffect, useMemo, Fragment } from 'react'
import {
  Search, MapPin, Plus, ShieldAlert, ShieldCheck, Loader2, Users, X, Building2,
  QrCode, Pencil, Save, AlertCircle, Trash2, UserPlus, Power, Briefcase, Activity, Printer,
} from 'lucide-react'
import { useApi } from '../lib/useApi'
import {
  getSites, getSite, createSite, updateSite, deleteSite,
  listPatrolPoints, addPatrolPoint, disablePatrolPoint,
  getPatrolPointQr, getPatrolPointsQrSheet,
  assignAgentToSite,
} from '../services/sites.service'
import AuditHistory from '../components/AuditHistory'
import PatrolQrModal from '../components/PatrolQrModal'
import Pagination from '../components/Pagination'
import { getClients } from '../services/clients.service'
import { getAgents } from '../services/agents.service'
import { DEPLOYMENT_ROLES, DEPLOYMENT_SHIFTS } from '../services/deployments.service'
import Select from '../components/Select'
import DatePicker from '../components/DatePicker'

const RISK_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  FAIBLE:   { label: 'Faible',   cls: 'bg-green-100 text-green-700',  icon: ShieldCheck },
  MOYEN:    { label: 'Moyen',    cls: 'bg-amber-100 text-amber-700',  icon: ShieldAlert },
  ELEVE:    { label: 'Élevé',    cls: 'bg-red-100 text-red-700',      icon: ShieldAlert },
  CRITIQUE: { label: 'Critique', cls: 'bg-red-900 text-red-100',      icon: ShieldAlert },
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIF:    { label: 'Actif',    cls: 'bg-green-100 text-green-700' },
  INACTIF:  { label: 'Inactif', cls: 'bg-slate-100 text-slate-500' },
  SUSPENDU: { label: 'Suspendu',cls: 'bg-red-100 text-red-700' },
}

const DEFAULT_SITE_TYPES = [
  { value: 'VILLA',     label: 'Villa / Résidence' },
  { value: 'IMMEUBLE',  label: 'Immeuble' },
  { value: 'ENTREPOT',  label: 'Entrepôt' },
  { value: 'USINE',     label: 'Usine' },
  { value: 'BUREAU',    label: 'Bureau' },
  { value: 'COMMERCE',  label: 'Commerce' },
  { value: 'BANQUE',    label: 'Banque / Agence' },
  { value: 'CHANTIER',  label: 'Chantier' },
  { value: 'AUTRE',     label: 'Autre' },
]

const SITE_TYPE_MAP: Record<string, string> = {
  'VILLA / RÉSIDENCE': 'VILLA',
  'VILLA / RESIDENCE': 'VILLA',
  'VILLA': 'VILLA',
  'IMMEUBLE': 'IMMEUBLE',
  'ENTREPÔT': 'ENTREPOT',
  'ENTREPOT': 'ENTREPOT',
  'USINE': 'USINE',
  'BUREAU': 'BUREAU',
  'COMMERCE': 'COMMERCE',
  'BANQUE / AGENCE': 'BANQUE',
  'BANQUE': 'BANQUE',
  'CHANTIER': 'CHANTIER',
  'AUTRE': 'AUTRE',
}

function getSiteTypes(): { value: string; label: string }[] {
  try {
    const s = localStorage.getItem('sagard_site_types')
    if (s) {
      const items: string[] = JSON.parse(s)
      return items.map(label => {
        const normalized = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
        const value = SITE_TYPE_MAP[normalized] ?? normalized.replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
        return { value, label }
      })
    }
  } catch {}
  return DEFAULT_SITE_TYPES
}

const RISK_LEVELS = [
  { value: 'FAIBLE',   label: 'Faible'   },
  { value: 'MOYEN',    label: 'Moyen'    },
  { value: 'ELEVE',    label: 'Élevé'    },
  { value: 'CRITIQUE', label: 'Critique' },
] as const

const SHIFTS = [
  { value: 'ONE',   label: '1 vacation' },
  { value: 'TWO',   label: '2 vacations' },
  { value: 'THREE', label: '3 vacations' },
] as const

const emptyForm = () => ({
  name: '', clientId: '', contactId: '',
  address: '', city: '', district: '', country: "Côte d'Ivoire",
  latitude: '', longitude: '',
  siteType: 'VILLA', surface: '',
  riskLevel: 'MOYEN', nbAgentsRequired: '1', nbShifts: 'ONE',
  hasArmed: false, hasCanine: false,
  instructions: '', notes: '',
})

const TABS = [
  { key: 'identification', label: 'Identification', icon: Building2 },
  { key: 'address',        label: 'Adresse & GPS',  icon: MapPin },
  { key: 'config',         label: 'Configuration',  icon: ShieldCheck },
  { key: 'notes',          label: 'Notes',          icon: AlertCircle },
] as const

export default function Sites() {
  const [search, setSearch] = useState('')
  const [risk, setRisk]       = useState('all')
  const [status, setStatus]   = useState('all')
  const [siteType, setSiteType] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)
  const [activeKpi, setActiveKpi] = useState<string | null>(null)
  const [siteTypes, setSiteTypes] = useState(getSiteTypes())

  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState<typeof TABS[number]['key']>('identification')
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [patrolPoints, setPatrolPoints] = useState<any[]>([])
  const [showPointForm, setShowPointForm] = useState(false)
  const [pointForm, setPointForm] = useState({ name: '', sequence: '10', locationDescription: '', expectedIntervalMin: '60', instructions: '' })
  const [qrModal, setQrModal] = useState<{ open: boolean; svg: string | null; title: string; subtitle?: string; filename: string; loading: boolean }>({ open: false, svg: null, title: '', filename: '', loading: false })

  const [showAssign, setShowAssign] = useState(false)
  const [assignForm, setAssignForm] = useState({ agentId: '', role: 'AGENT', shiftKind: 'JOUR', startDate: new Date().toISOString().slice(0, 10), notes: '' })
  const [editingSite, setEditingSite] = useState<string | null>(null)

  const { data, loading, reload: refetch } = useApi(getSites)
  const { data: clientsRaw } = useApi(() => getClients())
  const { data: agentsRaw }  = useApi(() => getAgents())
  const all = (data as any[]) ?? []
  const clients = (clientsRaw as any[]) ?? []
  const agents  = (agentsRaw as any[]) ?? []

  useEffect(() => {
    const handler = () => setSiteTypes(getSiteTypes())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const filtered = all.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = s.name.toLowerCase().includes(q)
      || (s.code ?? '').toLowerCase().includes(q)
      || (s.client?.name ?? '').toLowerCase().includes(q)
      || (s.district ?? s.city ?? '').toLowerCase().includes(q)
    const matchRisk   = risk === 'all'     || s.riskLevel === risk
    const matchStatus = status === 'all'   || s.status === status
    const matchType   = siteType === 'all' || s.siteType === siteType
    return matchSearch && matchRisk && matchStatus && matchType
  })

  const totalAgents = all.reduce((sum, s) => sum + (s._count?.deployments ?? s.deployments?.length ?? 0), 0)

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, Math.ceil(filtered.length / pageSize))))

  const resetFilters = () => { setRisk('all'); setStatus('all'); setSiteType('all'); setActiveKpi(null) }

  const handleKpiClick = (kpi: string) => {
    if (activeKpi === kpi) { resetFilters(); return }
    setActiveKpi(kpi)
    setPage(1)
    if (kpi === 'total')     { setRisk('all');     setStatus('all');   setSiteType('all') }
    if (kpi === 'actif')     { setRisk('all');     setStatus('ACTIF'); setSiteType('all') }
    if (kpi === 'risque')    { setRisk('ELEVE');   setStatus('all');   setSiteType('all') }
    if (kpi === 'agents')    { setRisk('all');     setStatus('all');   setSiteType('all') }
  }

  /* ───── Création / Édition ───── */
  const openCreate = () => { setForm(emptyForm()); setEditingSite(null); setTab('identification'); setFormError(null); setShowModal(true) }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim())     return setFormError('Le nom du site est obligatoire.')
    if (!editingSite && !form.clientId) return setFormError('Sélectionnez un client.')
    if (!form.address.trim())  return setFormError("L'adresse est obligatoire.")
    if (!form.city.trim())     return setFormError('La ville est obligatoire.')
    try {
      setSaving(true)
      const payload = {
        ...form,
        contactId: form.contactId || null,
        latitude:  form.latitude  ? Number(form.latitude)  : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        surface:   form.surface   ? Number(form.surface)   : null,
        nbAgentsRequired: Number(form.nbAgentsRequired || 1),
      }
      if (editingSite) {
        await updateSite(editingSite, payload)
      } else {
        await createSite(payload)
      }
      setShowModal(false)
      setEditingSite(null)
      refetch()
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  /* ───── Détail ───── */
  const openDetail = async (id: string) => {
    setSelectedId(id); setDetailLoading(true)
    try {
      const d = await getSite(id)
      setDetail(d)
      setPatrolPoints(d.patrolPoints ?? [])
    } finally { setDetailLoading(false) }
  }

  const addPoint = async () => {
    if (!selectedId || !pointForm.name.trim()) return
    const p = await addPatrolPoint(selectedId, {
      name: pointForm.name,
      sequence: Number(pointForm.sequence || 10),
      locationDescription: pointForm.locationDescription || null,
      expectedIntervalMin: Number(pointForm.expectedIntervalMin || 60),
      instructions: pointForm.instructions || null,
    })
    setPatrolPoints(pts => [...pts, p])
    setPointForm({ name: '', sequence: '10', locationDescription: '', expectedIntervalMin: '60', instructions: '' })
    setShowPointForm(false)
  }

  const removePoint = async (id: string) => {
    if (!confirm('Désactiver ce point de contrôle ?')) return
    await disablePatrolPoint(id)
    setPatrolPoints(pts => pts.filter(p => p.id !== id))
  }

  const viewPointQr = async (p: any) => {
    setQrModal({ open: true, svg: null, title: `QR — ${p.name}`, subtitle: `Code ${p.code}`, filename: `QR-${p.code}`, loading: true })
    try {
      const res = await getPatrolPointQr(p.id)
      setQrModal(m => ({ ...m, svg: res.svg, loading: false }))
    } catch {
      setQrModal(m => ({ ...m, open: false, loading: false }))
      alert('Impossible de générer le QR de ce point.')
    }
  }

  const printAllQr = async () => {
    if (!selectedId) return
    const siteName = detail?.name ?? 'site'
    setQrModal({ open: true, svg: null, title: 'Planche QR du site', subtitle: siteName, filename: `QR-${siteName}`, loading: true })
    try {
      const res = await getPatrolPointsQrSheet(selectedId)
      setQrModal(m => ({ ...m, svg: res.svg, subtitle: `${res.siteName} · ${res.count} point(s)`, loading: false }))
    } catch (e: any) {
      setQrModal(m => ({ ...m, open: false, loading: false }))
      alert(e?.response?.data?.message ?? 'Aucun point actif à imprimer.')
    }
  }

  const assignAgent = async () => {
    if (!selectedId || !assignForm.agentId) return
    try {
      await assignAgentToSite(selectedId, {
        agentId: assignForm.agentId,
        role: assignForm.role,
        shiftKind: assignForm.shiftKind,
        shift: assignForm.shiftKind === 'NUIT' ? 'NUIT' : 'JOUR',
        startDate: assignForm.startDate,
        notes: assignForm.notes || null,
      })
      setShowAssign(false)
      setAssignForm({ agentId: '', role: 'AGENT', shiftKind: 'JOUR', startDate: new Date().toISOString().slice(0, 10), notes: '' })
      await openDetail(selectedId)
      refetch()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Impossible d'affecter ce gardien à ce site.")
    }
  }

  return (
    <Fragment>
    <div className="space-y-5">
      {/* KPIs — cliquables pour filtrer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => handleKpiClick('total')}
          className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3 text-left ${activeKpi === 'total' ? 'border-sagard-yellow ring-2 ring-sagard-yellow/30' : 'border-slate-200'}`}>
          <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0"><Building2 size={20} className="text-sagard-yellow" /></div>
          <div>
            {loading ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
              : <p className="text-2xl font-black text-slate-800">{all.length}</p>}
            <p className="text-xs text-slate-500 font-medium">Sites total</p>
          </div>
        </button>
        <button
          onClick={() => handleKpiClick('actif')}
          className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3 text-left ${activeKpi === 'actif' ? 'border-green-400 ring-2 ring-green-200' : 'border-slate-200'}`}>
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><ShieldCheck size={20} className="text-green-600" /></div>
          <div>
            {loading ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
              : <p className="text-2xl font-black text-green-600">{all.filter(s => s.status === 'ACTIF').length}</p>}
            <p className="text-xs text-slate-500 font-medium">Sites actifs</p>
          </div>
        </button>
        <button
          onClick={() => handleKpiClick('risque')}
          className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3 text-left ${activeKpi === 'risque' ? 'border-red-400 ring-2 ring-red-200' : 'border-slate-200'}`}>
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"><ShieldAlert size={20} className="text-red-600" /></div>
          <div>
            {loading ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
              : <p className="text-2xl font-black text-red-600">{all.filter(s => s.riskLevel === 'ELEVE').length}</p>}
            <p className="text-xs text-slate-500 font-medium">Risque élevé</p>
          </div>
        </button>
        <button
          onClick={() => handleKpiClick('agents')}
          className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3 text-left ${activeKpi === 'agents' ? 'border-sagard-yellow ring-2 ring-sagard-yellow/30' : 'border-slate-200'}`}>
          <div className="w-11 h-11 rounded-xl bg-sagard-yellow/15 flex items-center justify-center flex-shrink-0"><Users size={20} className="text-sagard-yellow-dark" /></div>
          <div>
            {loading ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
              : <p className="text-2xl font-black text-slate-800">{totalAgents}</p>}
            <p className="text-xs text-slate-500 font-medium">Agents déployés</p>
          </div>
        </button>
      </div>

      {/* Card grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Filters bar */}
        <div className="flex flex-col gap-3 p-4 border-b border-slate-100">
          {/* Row 1: Search + New button */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Nom, client, district..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
            </div>
            <button onClick={openCreate} className="flex items-center gap-1.5 bg-sagard-yellow text-sagard-dark px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-sagard-yellow-dark transition-colors whitespace-nowrap">
              <Plus size={13} /> Nouveau site
            </button>
          </div>
          {/* Row 2: Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Statut</span>
              {(['all', 'ACTIF', 'INACTIF', 'SUSPENDU'] as const).map(s => (
                <button key={s} onClick={() => { setStatus(s); setPage(1); setActiveKpi(s === 'all' && risk === 'all' && siteType === 'all' ? null : activeKpi) }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${status === s ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {s === 'all' ? 'Tous' : (STATUS_CFG[s]?.label ?? s)}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-slate-200" />
            {/* Risk filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Risque</span>
              {(['all', 'FAIBLE', 'MOYEN', 'ELEVE', 'CRITIQUE'] as const).map(r => (
                <button key={r} onClick={() => { setRisk(r); setPage(1); setActiveKpi(r === 'all' && status === 'all' && siteType === 'all' ? null : activeKpi) }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${risk === r ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {r === 'all' ? 'Tous' : (RISK_CFG[r]?.label ?? r)}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-slate-200" />
            {/* Site type filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Type</span>
              <Select
                value={siteType}
                onChange={v => { setSiteType(v); setPage(1) }}
                options={siteTypes.map(t => ({ value: t.value, label: t.label }))}
                placeholder="Tous"
                size="sm"
                className="w-full"
              />
            </div>
            {/* Reset */}
            {(risk !== 'all' || status !== 'all' || siteType !== 'all' || activeKpi) && (
              <button onClick={resetFilters} className="ml-auto text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors">
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <MapPin size={40} className="mx-auto mb-3 opacity-30" />
            <p>{search || risk !== 'all' || status !== 'all' || siteType !== 'all' ? 'Aucun résultat' : 'Aucun site enregistré'}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {paginated.map(site => {
                const rCfg  = RISK_CFG[site.riskLevel] ?? { label: site.riskLevel ?? '—', cls: 'bg-slate-100 text-slate-500', icon: ShieldCheck }
                const sCfg  = STATUS_CFG[site.status]  ?? { label: site.status ?? '—',    cls: 'bg-slate-100 text-slate-500' }
                const RiskIcon = rCfg.icon
                const nbAgents = site._count?.deployments ?? site.deployments?.length ?? 0

                return (
                  <button type="button" key={site.id} onClick={() => openDetail(site.id)}
                    className="text-left border border-slate-200 rounded-xl p-4 hover:border-sagard-yellow/50 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-sagard-yellow/20 flex items-center justify-center">
                          <MapPin size={16} className="text-sagard-yellow-dark" />
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sCfg.cls}`}>{sCfg.label}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${rCfg.cls}`}>
                        <RiskIcon size={10} /> {rCfg.label}
                      </span>
                    </div>
                    {site.code && <p className="text-[10px] font-mono text-slate-400 mb-0.5">{site.code}</p>}
                    <h3 className="font-bold text-slate-800 text-sm leading-snug mb-1">{site.name}</h3>
                    <p className="text-xs text-slate-500 mb-3">{site.client?.name ?? '—'}</p>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p className="flex items-center gap-1">
                        <MapPin size={10} /> {[site.address, site.district ?? site.city].filter(Boolean).join(', ') || '—'}
                      </p>
                      <p className="flex items-center gap-1">
                        <Users size={10} />
                        <span className="font-semibold text-sagard-yellow-dark">{nbAgents}</span>&nbsp;agents&nbsp;·&nbsp;
                        <QrCode size={10} />
                        <span className="font-semibold text-slate-600">{site._count?.patrolPoints ?? 0}</span>&nbsp;pts QR
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            {filtered.length > 0 && (
              <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={goToPage} onPageSizeChange={s => { setPageSize(s); setPage(1) }} />
            )}
          </>
        )}
      </div>
    </div>

    {/* ════════════ MODAL : CRÉATION SITE (multi-onglets) ════════════ */}
    {showModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 size={18} className="text-sagard-yellow-dark" /> {editingSite ? 'Modifier le site' : 'Nouveau site'}
            </h2>
            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
          </div>

          {/* Onglets */}
          <div className="flex gap-1 px-4 pt-3 bg-slate-50 border-b border-slate-100 overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button key={t.key} onClick={() => setTab(t.key)} type="button"
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap ${tab === t.key ? 'bg-white text-sagard-dark border border-slate-200 border-b-white -mb-px' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Icon size={13} /> {t.label}
                </button>
              )
            })}
          </div>

          <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* IDENTIFICATION */}
            {tab === 'identification' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nom du site *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    placeholder="Ex: Villa Cocody Riviera, Agence Plateau..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Client *</label>
                  <Select value={form.clientId} onChange={v => setForm(f => ({ ...f, clientId: v, contactId: '' }))}
                    options={clients.map((c: any) => ({ value: c.id, label: c.name }))}
                    placeholder="— Sélectionner —" className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Contact sur site</label>
                  <Select value={form.contactId} onChange={v => setForm(f => ({ ...f, contactId: v }))}
                    disabled={!form.clientId}
                    options={(clients.find((c: any) => c.id === form.clientId)?.contacts ?? []).map((ct: any) => ({ value: ct.id, label: `${ct.firstName} ${ct.lastName}${ct.position ? ` — ${ct.position}` : ''}` }))}
                    placeholder="— Aucun —" className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type de site *</label>
                  <Select value={form.siteType} onChange={v => setForm(f => ({ ...f, siteType: v }))}
                    options={siteTypes.map(t => ({ value: t.value, label: t.label }))} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Surface (m²)</label>
                  <input type="number" min={0} value={form.surface} onChange={e => setForm(f => ({ ...f, surface: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
              </div>
            )}

            {/* ADRESSE & GPS */}
            {tab === 'address' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Adresse *</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required
                    placeholder="Rue, immeuble, lot..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ville *</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Quartier / District</label>
                  <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Pays</label>
                  <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Latitude GPS</label>
                  <input type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                    placeholder="5.3470"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Longitude GPS</label>
                  <input type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                    placeholder="-4.0244"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
              </div>
            )}

            {/* CONFIGURATION */}
            {tab === 'config' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Niveau de risque *</label>
                  <Select value={form.riskLevel} onChange={v => setForm(f => ({ ...f, riskLevel: v }))}
                    options={RISK_LEVELS.map(r => ({ value: r.value, label: r.label }))} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Effectif requis *</label>
                  <input type="number" min={1} value={form.nbAgentsRequired} onChange={e => setForm(f => ({ ...f, nbAgentsRequired: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de vacations</label>
                  <Select value={form.nbShifts} onChange={v => setForm(f => ({ ...f, nbShifts: v }))}
                    options={SHIFTS.map(s => ({ value: s.value, label: s.label }))} className="w-full" />
                </div>
                <label className="col-span-1 sm:col-span-2 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={form.hasArmed} onChange={e => setForm(f => ({ ...f, hasArmed: e.target.checked }))}
                    className="w-4 h-4 accent-sagard-yellow-dark" />
                  <span className="text-sm text-slate-700">Agents armés requis</span>
                </label>
                <label className="col-span-1 sm:col-span-2 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={form.hasCanine} onChange={e => setForm(f => ({ ...f, hasCanine: e.target.checked }))}
                    className="w-4 h-4 accent-sagard-yellow-dark" />
                  <span className="text-sm text-slate-700">Maître-chien requis</span>
                </label>
              </div>
            )}

            {/* NOTES */}
            {tab === 'notes' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Consignes permanentes</label>
                  <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={4}
                    placeholder="Consignes opérationnelles applicables en permanence sur le site..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Notes internes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                    placeholder="Remarques internes (non visibles par le client)..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none" />
                </div>
              </div>
            )}

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={14} /> {formError}
              </div>
            )}
          </form>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button onClick={() => setShowModal(false)} type="button"
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-100 bg-white">Annuler</button>
            <button onClick={submit} disabled={saving} type="button"
              className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {editingSite ? 'Enregistrer' : 'Créer le site'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ════════════ MODAL : DÉTAIL SITE ════════════ */}
    {selectedId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={18} className="text-sagard-yellow-dark" /> {detail?.name ?? '…'}
                {detail?.code && <span className="text-xs font-mono text-slate-400 ml-1">{detail.code}</span>}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{detail?.client?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                setEditingSite(selectedId)
                setForm({
                  name: detail?.name ?? '', clientId: detail?.clientId ?? '', contactId: '',
                  address: detail?.address ?? '', city: detail?.city ?? '', district: detail?.district ?? '',
                  country: detail?.country ?? "Côte d'Ivoire",
                  latitude: detail?.latitude ? String(detail.latitude) : '', longitude: detail?.longitude ? String(detail.longitude) : '',
                  siteType: detail?.siteType ?? 'VILLA', surface: detail?.surface ? String(detail.surface) : '',
                  riskLevel: detail?.riskLevel ?? 'MOYEN', nbAgentsRequired: String(detail?.nbAgentsRequired ?? 1),
                  nbShifts: detail?.nbShifts ?? 'ONE',
                  hasArmed: detail?.hasArmed ?? false, hasCanine: detail?.hasCanine ?? false,
                  instructions: detail?.instructions ?? '', notes: detail?.notes ?? '',
                })
                setTab('identification')
                setSelectedId(null); setDetail(null)
                setShowModal(true)
              }}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                <Pencil size={12} /> Modifier
              </button>
              <button onClick={async () => {
                if (!confirm(`Désactiver le site ${detail?.name} ?`)) return
                await deleteSite(selectedId!)
                setSelectedId(null); setDetail(null)
                refetch()
              }}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                <Trash2 size={12} /> Supprimer
              </button>
              <button onClick={() => { setSelectedId(null); setDetail(null) }}
                className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
          </div>

          {detailLoading || !detail ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Infos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Info label="Type"   value={siteTypes.find(t => t.value === detail.siteType)?.label ?? detail.siteType} />
                <Info label="Risque" value={RISK_LEVELS.find(r => r.value === detail.riskLevel)?.label ?? detail.riskLevel} />
                <Info label="Effectif requis" value={`${detail.nbAgentsRequired} agent(s)`} />
                <Info label="Vacations" value={SHIFTS.find(s => s.value === detail.nbShifts)?.label ?? detail.nbShifts} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Info label="Adresse" value={[detail.address, detail.district, detail.city, detail.country].filter(Boolean).join(', ')} />
                <Info label="GPS" value={detail.latitude && detail.longitude ? `${detail.latitude}, ${detail.longitude}` : '—'} />
              </div>
              {detail.instructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <p className="font-bold mb-1">Consignes permanentes :</p>
                  <p className="whitespace-pre-wrap">{detail.instructions}</p>
                </div>
              )}

              {/* Affectations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Users size={15} /> Agents affectés ({detail.deployments?.length ?? 0})
                  </h3>
                  <button onClick={() => setShowAssign(true)}
                    className="flex items-center gap-1.5 bg-sagard-yellow text-sagard-dark px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-sagard-yellow-dark">
                    <UserPlus size={12} /> Affecter un agent
                  </button>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>{['Agent', 'Matricule', 'Rôle', 'Vacation', 'Début', 'Statut'].map(h =>
                        <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.deployments ?? []).map((d: any) => (
                        <tr key={d.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-800">{d.agent.user?.firstName} {d.agent.user?.lastName}</td>
                          <td className="px-3 py-2 font-mono text-slate-500">{d.agent.matricule}</td>
                          <td className="px-3 py-2 text-slate-600">{DEPLOYMENT_ROLES.find(r => r.value === d.role)?.label ?? d.role}</td>
                          <td className="px-3 py-2 text-slate-600">{DEPLOYMENT_SHIFTS.find(s => s.value === d.shiftKind)?.label ?? d.shiftKind}</td>
                          <td className="px-3 py-2 text-slate-500">{new Date(d.startDate).toLocaleDateString('fr-FR')}</td>
                          <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">{d.state}</span></td>
                        </tr>
                      ))}
                      {(detail.deployments ?? []).length === 0 && (
                        <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">Aucun agent affecté à ce site.</td></tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>

              {/* Points de contrôle QR */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <QrCode size={15} /> Points de contrôle de ronde ({patrolPoints.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {patrolPoints.length > 0 && (
                      <button onClick={printAllQr}
                        className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50">
                        <Printer size={12} /> Imprimer tous les QR
                      </button>
                    )}
                    <button onClick={() => setShowPointForm(s => !s)}
                      className="flex items-center gap-1.5 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-900">
                      <Plus size={12} /> Ajouter un point
                    </button>
                  </div>
                </div>
                {showPointForm && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input value={pointForm.name} onChange={e => setPointForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Désignation (ex: Entrée principale)"
                      className="col-span-1 sm:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    <input type="number" value={pointForm.sequence} onChange={e => setPointForm(p => ({ ...p, sequence: e.target.value }))}
                      placeholder="Ordre" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    <input type="number" value={pointForm.expectedIntervalMin} onChange={e => setPointForm(p => ({ ...p, expectedIntervalMin: e.target.value }))}
                      placeholder="Intervalle attendu (min)" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    <input value={pointForm.locationDescription} onChange={e => setPointForm(p => ({ ...p, locationDescription: e.target.value }))}
                      placeholder="Description emplacement"
                      className="col-span-1 sm:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    <textarea value={pointForm.instructions} onChange={e => setPointForm(p => ({ ...p, instructions: e.target.value }))}
                      placeholder="Consignes au point" rows={2}
                      className="col-span-1 sm:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none" />
                    <div className="col-span-1 sm:col-span-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setShowPointForm(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs">Annuler</button>
                      <button type="button" onClick={addPoint}
                        className="px-3 py-1.5 rounded-lg bg-sagard-yellow text-sagard-dark text-xs font-bold">Ajouter</button>
                    </div>
                  </div>
                )}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>{['Ordre', 'Désignation', 'Code QR', 'Emplacement', 'Intervalle', ''].map(h =>
                        <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {patrolPoints.map(p => (
                        <tr key={p.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono text-slate-500">{p.sequence}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{p.name}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => viewPointQr(p)} title="Voir / imprimer le QR"
                              className="font-mono text-[10px] text-slate-600 hover:text-sagard-yellow-dark hover:underline decoration-dotted underline-offset-2">
                              {p.code}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-slate-500">{p.locationDescription ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{p.expectedIntervalMin} min</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => viewPointQr(p)} title="Voir / imprimer le QR"
                                className="p-1 hover:bg-sagard-yellow/20 rounded text-slate-600"><QrCode size={13} /></button>
                              <button onClick={() => removePoint(p.id)} title="Désactiver"
                                className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {patrolPoints.length === 0 && (
                        <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">Aucun point de contrôle défini.</td></tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>

              {/* Audit trail */}
              <AuditHistory entity="Site" entityId={selectedId!} />
            </div>
          )}
        </div>
      </div>
    )}

    {/* ════════════ MODAL : QR POINT DE CONTRÔLE ════════════ */}
    <PatrolQrModal
      open={qrModal.open}
      onClose={() => setQrModal(m => ({ ...m, open: false }))}
      svg={qrModal.svg}
      title={qrModal.title}
      subtitle={qrModal.subtitle}
      filename={qrModal.filename}
      loading={qrModal.loading}
    />

    {/* ════════════ MODAL : AFFECTATION AGENT ════════════ */}
    {showAssign && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserPlus size={16} className="text-sagard-yellow-dark" /> Affecter un agent
            </h3>
            <button onClick={() => setShowAssign(false)} className="p-1 rounded hover:bg-slate-100"><X size={16} /></button>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Agent *</label>
              <Select value={assignForm.agentId} onChange={v => setAssignForm(f => ({ ...f, agentId: v }))}
                options={agents.map((a: any) => ({ value: a.id, label: `${a.matricule} — ${a.user?.firstName} ${a.user?.lastName}` }))}
                placeholder="— Sélectionner —" className="w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rôle</label>
                <Select value={assignForm.role} onChange={v => setAssignForm(f => ({ ...f, role: v }))}
                  options={DEPLOYMENT_ROLES.map(r => ({ value: r.value, label: r.label }))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Vacation</label>
                <Select value={assignForm.shiftKind} onChange={v => setAssignForm(f => ({ ...f, shiftKind: v }))}
                  options={DEPLOYMENT_SHIFTS.map(s => ({ value: s.value, label: s.label }))} className="w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date de début</label>
              <DatePicker value={assignForm.startDate} onChange={v => setAssignForm(f => ({ ...f, startDate: v }))} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
            <button onClick={() => setShowAssign(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm bg-white">Annuler</button>
            <button onClick={assignAgent} disabled={!assignForm.agentId}
              className="px-5 py-2 rounded-lg bg-sagard-yellow text-sagard-dark text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
              Affecter
            </button>
          </div>
        </div>
      </div>
    )}
    </Fragment>
  )
}

/** Bloc info clé/valeur compact pour la modale de détail */
function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value ?? '—'}</p>
    </div>
  )
}
