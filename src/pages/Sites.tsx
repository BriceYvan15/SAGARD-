import { useState, useEffect, Fragment } from 'react'
import {
  Search, MapPin, Plus, ShieldAlert, ShieldCheck, Loader2, Users, X, Building2,
  QrCode, Pencil, Save, AlertCircle, Trash2, UserPlus, Power,
} from 'lucide-react'
import { useApi } from '../lib/useApi'
import {
  getSites, getSite, createSite, updateSite, deleteSite,
  listPatrolPoints, addPatrolPoint, disablePatrolPoint,
  assignAgentToSite,
} from '../services/sites.service'
import AuditHistory from '../components/AuditHistory'
import { getClients } from '../services/clients.service'
import { getAgents } from '../services/agents.service'
import { DEPLOYMENT_ROLES, DEPLOYMENT_SHIFTS } from '../services/deployments.service'

const RISK_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  FAIBLE: { label: 'Faible', cls: 'bg-green-100 text-green-700',  icon: ShieldCheck },
  MOYEN:  { label: 'Moyen',  cls: 'bg-amber-100 text-amber-700',  icon: ShieldAlert },
  ELEVE:  { label: 'Élevé',  cls: 'bg-red-100 text-red-700',      icon: ShieldAlert },
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIF:    { label: 'Actif',    cls: 'bg-green-100 text-green-700' },
  INACTIF:  { label: 'Inactif', cls: 'bg-slate-100 text-slate-500' },
  SUSPENDU: { label: 'Suspendu',cls: 'bg-red-100 text-red-700' },
}

const SITE_TYPES = [
  { value: 'VILLA',     label: 'Villa / Résidence' },
  { value: 'IMMEUBLE',  label: 'Immeuble' },
  { value: 'ENTREPOT',  label: 'Entrepôt' },
  { value: 'USINE',     label: 'Usine' },
  { value: 'BUREAU',    label: 'Bureau' },
  { value: 'COMMERCE',  label: 'Commerce' },
  { value: 'BANQUE',    label: 'Banque / Agence' },
  { value: 'CHANTIER',  label: 'Chantier' },
  { value: 'AUTRE',     label: 'Autre' },
] as const

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
  const [risk, setRisk]     = useState('all')

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

  const [showAssign, setShowAssign] = useState(false)
  const [assignForm, setAssignForm] = useState({ agentId: '', role: 'AGENT', shiftKind: 'JOUR', startDate: new Date().toISOString().slice(0, 10), notes: '' })
  const [editingSite, setEditingSite] = useState<string | null>(null)

  const { data, loading, reload: refetch } = useApi(getSites)
  const { data: clientsRaw } = useApi(() => getClients())
  const { data: agentsRaw }  = useApi(() => getAgents())
  const all = (data as any[]) ?? []
  const clients = (clientsRaw as any[]) ?? []
  const agents  = (agentsRaw as any[]) ?? []

  const filtered = all.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = s.name.toLowerCase().includes(q)
      || (s.code ?? '').toLowerCase().includes(q)
      || (s.client?.name ?? '').toLowerCase().includes(q)
      || (s.district ?? s.city ?? '').toLowerCase().includes(q)
    const matchRisk = risk === 'all' || s.riskLevel === risk
    return matchSearch && matchRisk
  })

  const totalAgents = all.reduce((sum, s) => sum + (s._count?.deployments ?? s.deployments?.length ?? 0), 0)

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

  const assignAgent = async () => {
    if (!selectedId || !assignForm.agentId) return
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
  }

  return (
    <Fragment>
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          {loading ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
            : <p className="text-2xl font-black text-slate-800">{all.length}</p>}
          <p className="text-xs text-slate-500">Sites total</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          {loading ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
            : <p className="text-2xl font-black text-green-600">{all.filter(s => s.status === 'ACTIF').length}</p>}
          <p className="text-xs text-slate-500">Sites actifs</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-200 bg-red-50">
          {loading ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
            : <p className="text-2xl font-black text-red-600">{all.filter(s => s.riskLevel === 'ELEVE').length}</p>}
          <p className="text-xs text-red-700">Risque élevé</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-sagard-yellow shadow-sm">
          {loading ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
            : <p className="text-2xl font-black text-slate-800">{totalAgents}</p>}
          <p className="text-xs text-slate-500">Agents déployés</p>
        </div>
      </div>

      {/* Card grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nom, client, district..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(['all','FAIBLE','MOYEN','ELEVE'] as const).map(r => (
              <button key={r} onClick={() => setRisk(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${risk === r ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {r === 'all' ? 'Tous' : (RISK_CFG[r]?.label ?? r)}
              </button>
            ))}
            <button onClick={openCreate} className="flex items-center gap-1.5 bg-sagard-yellow text-sagard-dark px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-sagard-yellow-dark transition-colors">
              <Plus size={13} /> Nouveau site
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filtered.map(site => {
              const rCfg  = RISK_CFG[site.riskLevel] ?? { label: site.riskLevel ?? '—', cls: 'bg-slate-100 text-slate-500', icon: ShieldCheck }
              const sCfg  = STATUS_CFG[site.status]  ?? { label: site.status ?? '—',    cls: 'bg-slate-100 text-slate-500' }
              const RiskIcon = rCfg.icon
              const nbAgents = site._count?.deployments ?? site.deployments?.length ?? 0

              return (
                <button type="button" key={site.id} onClick={() => openDetail(site.id)}
                  className="text-left border border-slate-200 rounded-xl p-4 hover:border-sagard-yellow/50 hover:shadow-md transition-all bg-white">
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
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-400">
                <MapPin size={40} className="mx-auto mb-3 opacity-30" />
                <p>{search || risk !== 'all' ? 'Aucun résultat' : 'Aucun site enregistré'}</p>
              </div>
            )}
          </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nom du site *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    placeholder="Ex: Villa Cocody Riviera, Agence Plateau..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Client *</label>
                  <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value, contactId: '' }))} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                    <option value="">— Sélectionner —</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Contact sur site</label>
                  <select value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))}
                    disabled={!form.clientId}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white disabled:bg-slate-50 disabled:text-slate-400">
                    <option value="">— Aucun —</option>
                    {(clients.find((c: any) => c.id === form.clientId)?.contacts ?? []).map((ct: any) => (
                      <option key={ct.id} value={ct.id}>{ct.firstName} {ct.lastName} {ct.position ? `— ${ct.position}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type de site *</label>
                  <select value={form.siteType} onChange={e => setForm(f => ({ ...f, siteType: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                    {SITE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
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
                <div className="col-span-2">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Niveau de risque *</label>
                  <select value={form.riskLevel} onChange={e => setForm(f => ({ ...f, riskLevel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                    {RISK_LEVELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Effectif requis *</label>
                  <input type="number" min={1} value={form.nbAgentsRequired} onChange={e => setForm(f => ({ ...f, nbAgentsRequired: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de vacations</label>
                  <select value={form.nbShifts} onChange={e => setForm(f => ({ ...f, nbShifts: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                    {SHIFTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <label className="col-span-2 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={form.hasArmed} onChange={e => setForm(f => ({ ...f, hasArmed: e.target.checked }))}
                    className="w-4 h-4 accent-sagard-yellow-dark" />
                  <span className="text-sm text-slate-700">Agents armés requis</span>
                </label>
                <label className="col-span-2 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg cursor-pointer">
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
              <div className="grid grid-cols-4 gap-3">
                <Info label="Type"   value={SITE_TYPES.find(t => t.value === detail.siteType)?.label ?? detail.siteType} />
                <Info label="Risque" value={RISK_LEVELS.find(r => r.value === detail.riskLevel)?.label ?? detail.riskLevel} />
                <Info label="Effectif requis" value={`${detail.nbAgentsRequired} agent(s)`} />
                <Info label="Vacations" value={SHIFTS.find(s => s.value === detail.nbShifts)?.label ?? detail.nbShifts} />
              </div>
              <div className="grid grid-cols-2 gap-3">
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

              {/* Points de contrôle QR */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <QrCode size={15} /> Points de contrôle de ronde ({patrolPoints.length})
                  </h3>
                  <button onClick={() => setShowPointForm(s => !s)}
                    className="flex items-center gap-1.5 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-900">
                    <Plus size={12} /> Ajouter un point
                  </button>
                </div>
                {showPointForm && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3 grid grid-cols-2 gap-2">
                    <input value={pointForm.name} onChange={e => setPointForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Désignation (ex: Entrée principale)"
                      className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    <input type="number" value={pointForm.sequence} onChange={e => setPointForm(p => ({ ...p, sequence: e.target.value }))}
                      placeholder="Ordre" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    <input type="number" value={pointForm.expectedIntervalMin} onChange={e => setPointForm(p => ({ ...p, expectedIntervalMin: e.target.value }))}
                      placeholder="Intervalle attendu (min)" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    <input value={pointForm.locationDescription} onChange={e => setPointForm(p => ({ ...p, locationDescription: e.target.value }))}
                      placeholder="Description emplacement"
                      className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    <textarea value={pointForm.instructions} onChange={e => setPointForm(p => ({ ...p, instructions: e.target.value }))}
                      placeholder="Consignes au point" rows={2}
                      className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none" />
                    <div className="col-span-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setShowPointForm(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs">Annuler</button>
                      <button type="button" onClick={addPoint}
                        className="px-3 py-1.5 rounded-lg bg-sagard-yellow text-sagard-dark text-xs font-bold">Ajouter</button>
                    </div>
                  </div>
                )}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
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
                          <td className="px-3 py-2 font-mono text-[10px] text-slate-600">{p.code}</td>
                          <td className="px-3 py-2 text-slate-500">{p.locationDescription ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{p.expectedIntervalMin} min</td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => removePoint(p.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={12} /></button>
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

              {/* Audit trail */}
              <AuditHistory entity="Site" entityId={selectedId!} />
            </div>
          )}
        </div>
      </div>
    )}

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
              <select value={assignForm.agentId} onChange={e => setAssignForm(f => ({ ...f, agentId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                <option value="">— Sélectionner —</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.matricule} — {a.user?.firstName} {a.user?.lastName}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rôle</label>
                <select value={assignForm.role} onChange={e => setAssignForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                  {DEPLOYMENT_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Vacation</label>
                <select value={assignForm.shiftKind} onChange={e => setAssignForm(f => ({ ...f, shiftKind: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                  {DEPLOYMENT_SHIFTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date de début</label>
              <input type="date" value={assignForm.startDate} onChange={e => setAssignForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
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
