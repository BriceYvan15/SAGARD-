import { Fragment, useState } from 'react'
import { Search, FileText, Plus, ChevronDown, ChevronUp, Loader2, X, CheckCircle, PlayCircle, PauseCircle, XCircle, Receipt, FileCheck, Info, MapPin, Users as UsersIcon, DollarSign } from 'lucide-react'
import { fmt, fmtDate } from '../lib/utils'
import { useApi } from '../lib/useApi'
import {
  getContracts, createContract,
  contractToQuotation, contractToProforma, contractConfirm,
  contractActivate, contractSuspend, contractTerminate,
  contractCreateQuotation, contractCreateInvoice,
} from '../services/contracts.service'
import { getClients } from '../services/clients.service'
import { getSites } from '../services/sites.service'
import { getUsers } from '../services/users.service'

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
  DEVIS:     { label: 'Devis',     cls: 'bg-indigo-100 text-indigo-700' },
  PROFORMA:  { label: 'Proforma',  cls: 'bg-purple-100 text-purple-700' },
  CONFIRME:  { label: 'Confirmé',  cls: 'bg-blue-100 text-blue-700' },
  ACTIF:     { label: 'Actif',     cls: 'bg-green-100 text-green-700' },
  SUSPENDU:  { label: 'Suspendu',  cls: 'bg-amber-100 text-amber-700' },
  RESILIE:   { label: 'Résilié',   cls: 'bg-red-200 text-red-800' },
  EXPIRE:    { label: 'Expiré',    cls: 'bg-red-100 text-red-700' },
}

const CONTRACT_TYPES = [
  { value: 'GARDIENNAGE_STATIQUE',   label: 'Gardiennage statique' },
  { value: 'PATROUILLE_MOBILE',      label: 'Patrouille mobile' },
  { value: 'PROTECTION_RAPPROCHEE',  label: 'Protection rapprochée' },
  { value: 'SECURITE_EVENEMENTIELLE',label: 'Sécurité événementielle' },
  { value: 'TRANSPORT_FONDS',        label: 'Transport de fonds' },
  { value: 'TELESURVEILLANCE',       label: 'Télésurveillance' },
  { value: 'MIXTE',                  label: 'Mixte' },
]

const FREQUENCIES = [
  { value: 'MENSUELLE',     label: 'Mensuelle' },
  { value: 'TRIMESTRIELLE', label: 'Trimestrielle' },
  { value: 'SEMESTRIELLE',  label: 'Semestrielle' },
  { value: 'ANNUELLE',      label: 'Annuelle' },
]

const TYPE_LABEL = (v?: string) => CONTRACT_TYPES.find(t => t.value === v)?.label ?? v ?? '—'

// Transitions autorisées par état (miroir backend)
const ALLOWED: Record<string, { devis?: boolean; proforma?: boolean; confirm?: boolean; activate?: boolean; suspend?: boolean; terminate?: boolean }> = {
  BROUILLON: { devis: true, proforma: true, confirm: true, terminate: true },
  DEVIS:     { proforma: true, confirm: true, terminate: true },
  PROFORMA:  { confirm: true, terminate: true },
  CONFIRME:  { activate: true, terminate: true },
  ACTIF:     { suspend: true, terminate: true },
  SUSPENDU:  { activate: true, terminate: true },
  RESILIE:   {},
  EXPIRE:    {},
}

const EMPTY_FORM = {
  // Identification
  clientId: '', title: '', contractType: 'GARDIENNAGE_STATIQUE',
  siteId: '', assignedUserId: '',
  // Dates
  signatureDate: '', startDate: '', endDate: '',
  autoRenew: false, noticeDays: 30,
  // Effectif
  nbAgentsRequired: 1, nbShifts: 'ONE',
  // Financier
  monthlyAmount: 0, setupAmount: 0, currency: 'XOF',
  invoicingFrequency: 'MENSUELLE', paymentTermDays: 30,
  // Description
  description: '',
}

const CURRENCIES = [
  { value: 'XOF', label: 'XOF (Franc CFA)' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'USD', label: 'USD (Dollar US)' },
]

const MODAL_TABS = [
  { id: 'identification', label: 'Identification', icon: Info },
  { id: 'site',           label: 'Site & affectation', icon: MapPin },
  { id: 'effectif',       label: 'Effectif',       icon: UsersIcon },
  { id: 'financier',      label: 'Financier',      icon: DollarSign },
  { id: 'description',    label: 'Conditions',     icon: FileText },
]

export default function Contrats() {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState<any>({ ...EMPTY_FORM })
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [transitioning, setTransitioning] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('identification')

  const { data, loading, reload }     = useApi(getContracts)
  const { data: clientsData }         = useApi(getClients)
  const { data: sitesData }           = useApi(getSites)
  const { data: usersData }           = useApi(getUsers)
  const all     = (data as any[]) ?? []
  const clients = (clientsData as any[]) ?? []
  const sites   = (sitesData as any[]) ?? []
  const users   = (usersData as any[]) ?? []
  // Filtrer les sites selon le client sélectionné
  const filteredSites = sites.filter(s => !form.clientId || s.clientId === form.clientId)
  // Filtrer les utilisateurs (commerciaux uniquement)
  const commercials   = users.filter(u => ['COMMERCIAL', 'DIRECTEUR_GENERAL'].includes(u.role))

  const set = (k: string) => (e: any) => {
    const v = e.target?.type === 'checkbox' ? e.target.checked
            : e.target?.type === 'number'   ? Number(e.target.value) || 0
            : e.target.value
    setForm((f: any) => ({ ...f, [k]: v }))
  }

  const filtered = all.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = (c.reference ?? '').toLowerCase().includes(q)
      || (c.client?.name ?? '').toLowerCase().includes(q)
      || (c.title ?? '').toLowerCase().includes(q)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const stats = {
    total:        all.length,
    actif:        all.filter(c => c.status === 'ACTIF').length,
    enCours:      all.filter(c => ['DEVIS', 'PROFORMA', 'CONFIRME'].includes(c.status)).length,
    totalRevenue: all.filter(c => c.status === 'ACTIF').reduce((s, c) => s + Number(c.monthlyAmount ?? 0), 0),
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientId || !form.title || !form.startDate || !form.monthlyAmount) {
      setFormError('Client, intitulé, date de début et montant mensuel sont obligatoires.')
      return
    }
    setSaving(true); setFormError(null)
    try {
      await createContract({
        ...form,
        startDate:    new Date(form.startDate),
        endDate:      form.endDate     ? new Date(form.endDate)     : undefined,
        signatureDate:form.signatureDate ? new Date(form.signatureDate) : undefined,
      })
      setShowModal(false)
      setForm({ ...EMPTY_FORM })
      reload()
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  const runTransition = async (id: string, fn: (id: string) => Promise<any>, label: string) => {
    if (!confirm(`Confirmer : ${label} ?`)) return
    setTransitioning(id)
    try {
      await fn(id)
      reload()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Erreur lors de la transition.')
    } finally {
      setTransitioning(null)
    }
  }

  const runDocument = async (id: string, fn: (id: string) => Promise<any>, label: string) => {
    if (!confirm(`${label} ?`)) return
    setTransitioning(id)
    try {
      const doc = await fn(id)
      alert(`${label} OK : ${doc.reference}`)
      reload()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Erreur lors de la création du document.')
    } finally {
      setTransitioning(null)
    }
  }

  return (
    <Fragment>
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          {loading ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
            : <p className="text-2xl font-black text-slate-800">{stats.total}</p>}
          <p className="text-xs text-slate-500">Total contrats</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          {loading ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
            : <p className="text-2xl font-black text-green-600">{stats.actif}</p>}
          <p className="text-xs text-slate-500">Contrats actifs</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50 shadow-sm">
          {loading ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
            : <p className="text-2xl font-black text-blue-600">{stats.enCours}</p>}
          <p className="text-xs text-blue-700">Devis / Proforma / Confirmé</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-sagard-yellow shadow-sm">
          {loading ? <div className="w-16 h-7 bg-slate-200 rounded animate-pulse mb-1" />
            : <p className="text-lg font-black text-slate-800">{fmt(stats.totalRevenue)}</p>}
          <p className="text-xs text-slate-500">Revenu mensuel actifs</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Référence, client, intitulé..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(['all','BROUILLON','DEVIS','PROFORMA','CONFIRME','ACTIF','SUSPENDU','EXPIRE'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {s === 'all' ? 'Tous' : (STATUS_CFG[s]?.label ?? s)}
              </button>
            ))}
            <button onClick={() => { setForm({ ...EMPTY_FORM }); setActiveTab('identification'); setFormError(null); setShowModal(true) }}
              className="flex items-center gap-1.5 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-xs font-bold hover:bg-sagard-yellow-dark transition-colors">
              <Plus size={13} /> Nouveau contrat
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Référence','Client','Intitulé','Type','Agents','Période','Montant/mois','Statut',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(ct => {
                  const st = STATUS_CFG[ct.status] ?? { label: ct.status, cls: 'bg-slate-100 text-slate-500' }
                  const transitions = ALLOWED[ct.status] ?? {}
                  const isWorking = transitioning === ct.id
                  return (
                    <Fragment key={ct.id}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{ct.reference}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{ct.client?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{ct.title ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{TYPE_LABEL(ct.contractType ?? ct.type)}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{ct.nbAgentsRequired ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          <p>{fmtDate(ct.startDate)}</p>
                          {ct.endDate ? <p>{fmtDate(ct.endDate)}</p> : <p className="text-green-600 font-medium">Indéterminé</p>}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 text-xs">{fmt(Number(ct.monthlyAmount ?? 0))}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setExpanded(expanded === ct.id ? null : ct.id)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-sagard-yellow-dark font-medium">
                            {expanded === ct.id ? <><ChevronUp size={13}/>Masquer</> : <><ChevronDown size={13}/>Détails</>}
                          </button>
                        </td>
                      </tr>
                      {expanded === ct.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Caractéristiques</p>
                                <p className="text-xs text-slate-600"><b>Vacations :</b> {ct.nbShifts === 'THREE' ? '3 (24h/24h)' : ct.nbShifts === 'TWO' ? '2' : '1'}</p>
                                <p className="text-xs text-slate-600"><b>Heures/mois :</b> {ct.nbHoursMonth ?? '—'}</p>
                                <p className="text-xs text-slate-600"><b>Frais setup :</b> {ct.setupAmount ? fmt(Number(ct.setupAmount)) : '—'}</p>
                                <p className="text-xs text-slate-600"><b>Fréquence :</b> {ct.invoicingFrequency ?? '—'}</p>
                                <p className="text-xs text-slate-600"><b>Reconduction auto :</b> {ct.autoRenew ? 'Oui' : 'Non'}</p>
                                <p className="text-xs text-slate-600"><b>Préavis :</b> {ct.noticeDays ?? 30} j</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description</p>
                                <p className="text-xs text-slate-700">{ct.description ?? '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Sites couverts</p>
                                {(ct.sites ?? []).map((s: any) => (
                                  <p key={s.id ?? s.siteId} className="text-xs text-slate-700">{s.site?.name ?? s.name}</p>
                                ))}
                                {(ct.sites ?? []).length === 0 && <p className="text-xs text-slate-400">Aucun site lié</p>}
                              </div>
                            </div>

                            {/* Boutons de transition */}
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
                              {transitions.devis && (
                                <button disabled={isWorking} onClick={() => runTransition(ct.id, contractToQuotation, 'Passer en devis')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-200 transition-colors disabled:opacity-50">
                                  <FileText size={13}/> Passer en devis
                                </button>
                              )}
                              {transitions.proforma && (
                                <button disabled={isWorking} onClick={() => runTransition(ct.id, contractToProforma, 'Passer en proforma')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-200 transition-colors disabled:opacity-50">
                                  <FileText size={13}/> Passer en proforma
                                </button>
                              )}
                              {transitions.confirm && (
                                <button disabled={isWorking} onClick={() => runTransition(ct.id, contractConfirm, 'Confirmer le contrat')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors disabled:opacity-50">
                                  <CheckCircle size={13}/> Confirmer
                                </button>
                              )}
                              {transitions.activate && (
                                <button disabled={isWorking} onClick={() => runTransition(ct.id, contractActivate, 'Activer le contrat')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors disabled:opacity-50">
                                  <PlayCircle size={13}/> Activer
                                </button>
                              )}
                              {transitions.suspend && (
                                <button disabled={isWorking} onClick={() => runTransition(ct.id, contractSuspend, 'Suspendre le contrat')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50">
                                  <PauseCircle size={13}/> Suspendre
                                </button>
                              )}
                              {transitions.terminate && (
                                <button disabled={isWorking} onClick={() => runTransition(ct.id, contractTerminate, 'Résilier le contrat')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors disabled:opacity-50">
                                  <XCircle size={13}/> Résilier
                                </button>
                              )}
                              {Object.keys(transitions).length === 0 && (
                                <span className="text-xs text-slate-400 italic">Aucune action disponible (état terminal)</span>
                              )}

                              {/* Génération de documents (toujours dispo sauf brouillon) */}
                              {ct.status !== 'BROUILLON' && (
                                <>
                                  <span className="border-l border-slate-300 mx-2" />
                                  <button disabled={isWorking} onClick={() => runDocument(ct.id, contractCreateQuotation, 'Générer un devis')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50">
                                    <FileCheck size={13}/> Créer devis
                                  </button>
                                  <button disabled={isWorking} onClick={() => runDocument(ct.id, contractCreateInvoice, 'Générer une facture')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50">
                                    <Receipt size={13}/> Créer facture
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p>{search || filter !== 'all' ? 'Aucun résultat' : 'Aucun contrat enregistré'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Modal Nouveau Contrat */}
    {showModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-sagard-yellow-dark" /> Nouveau contrat
            </h2>
            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {MODAL_TABS.map(t => {
              const Icon = t.icon
              const isActive = activeTab === t.id
              return (
                <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${isActive ? 'border-sagard-yellow text-sagard-dark' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  <Icon size={14} /> {t.label}
                </button>
              )
            })}
          </div>

          <form onSubmit={handleCreate} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-4">

            {/* === IDENTIFICATION === */}
            {activeTab === 'identification' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Intitulé *</label>
                  <input value={form.title} onChange={set('title')} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40"
                    placeholder="Ex: Gardiennage agence Plateau" />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Client *</label>
                  <select value={form.clientId} onChange={set('clientId')} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                    <option value="">Sélectionner...</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.code ? `[${c.code}] ` : ''}{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type de prestation *</label>
                  <select value={form.contractType} onChange={set('contractType')} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                    {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date signature</label>
                  <input type="date" value={form.signatureDate} onChange={set('signatureDate')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date de début *</label>
                  <input type="date" value={form.startDate} onChange={set('startDate')} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date de fin</label>
                  <input type="date" value={form.endDate} onChange={set('endDate')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                  <p className="text-[10px] text-slate-400 mt-1">Vide = durée indéterminée</p>
                </div>
                <div className="col-span-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700"><b>Note :</b> La <b>référence</b> (ex: CTR-2026-0001) sera générée automatiquement. Le contrat sera créé en <b>BROUILLON</b>.</p>
                </div>
              </div>
            )}

            {/* === SITE & AFFECTATION === */}
            {activeTab === 'site' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Site principal couvert</label>
                    <select value={form.siteId} onChange={set('siteId')}
                      disabled={!form.clientId}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed">
                      <option value="">— Aucun site —</option>
                      {filteredSites.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ''}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {!form.clientId
                        ? 'Sélectionnez d\'abord un client pour voir ses sites.'
                        : filteredSites.length === 0
                          ? 'Aucun site enregistré pour ce client. Créez-en un depuis la page Sites.'
                          : `${filteredSites.length} site(s) disponible(s) pour ce client.`}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Chargé d'affaires (commercial)</label>
                    <select value={form.assignedUserId} onChange={set('assignedUserId')}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                      <option value="">— Non assigné —</option>
                      {commercials.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">Recevra les alertes (échéance, expiration, réclamations).</p>
                  </div>
                </div>
              </div>
            )}

            {/* === EFFECTIF & VACATIONS === */}
            {activeTab === 'effectif' && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nb agents requis *</label>
                  <input type="number" min={1} value={form.nbAgentsRequired} onChange={set('nbAgentsRequired')} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vacations *</label>
                  <select value={form.nbShifts} onChange={set('nbShifts')} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                    <option value="ONE">1 vacation (8h)</option>
                    <option value="TWO">2 vacations (16h)</option>
                    <option value="THREE">3 vacations (24h/24h)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="bg-sagard-yellow/20 border border-sagard-yellow rounded-lg px-3 py-2 w-full">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">Heures/mois auto</p>
                    <p className="text-lg font-black text-sagard-dark">{form.nbAgentsRequired * (form.nbShifts === 'THREE' ? 3 : form.nbShifts === 'TWO' ? 2 : 1) * 8 * 30}h</p>
                  </div>
                </div>
                <div className="col-span-3 bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Formule de calcul</p>
                  <p className="text-xs text-slate-700"><code className="font-mono bg-white px-1.5 py-0.5 rounded">nb_agents × nb_vacations × 8h × 30j</code></p>
                </div>
              </div>
            )}

            {/* === FINANCIER === */}
            {activeTab === 'financier' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Montant mensuel HT *</label>
                  <input type="number" min={0} value={form.monthlyAmount || ''} onChange={set('monthlyAmount')} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="500000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Devise</label>
                  <select value={form.currency} onChange={set('currency')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                    {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Frais de mise en place</label>
                  <input type="number" min={0} value={form.setupAmount || ''} onChange={set('setupAmount')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fréquence facturation</label>
                  <select value={form.invoicingFrequency} onChange={set('invoicingFrequency')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                    {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Délai paiement (j)</label>
                  <input type="number" min={0} value={form.paymentTermDays} onChange={set('paymentTermDays')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Préavis résiliation (j)</label>
                  <input type="number" min={0} value={form.noticeDays} onChange={set('noticeDays')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div className="col-span-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={form.autoRenew} onChange={set('autoRenew')}
                      className="w-4 h-4 rounded border-slate-300 text-sagard-yellow-dark focus:ring-sagard-yellow/40" />
                    Reconduction automatique (le contrat sera renouvelé tacitement à l'échéance)
                  </label>
                </div>
              </div>
            )}

            {/* === CONDITIONS PARTICULIÈRES === */}
            {activeTab === 'description' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Clauses & conditions particulières</label>
                <textarea value={form.description} onChange={set('description')} rows={10}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none"
                  placeholder="Clauses spécifiques, équipements fournis, modalités d'intervention, pénalités, exigences particulières du client..." />
              </div>
            )}

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors disabled:opacity-60">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Création...</> : 'Créer le contrat (brouillon)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </Fragment>
  )
}
