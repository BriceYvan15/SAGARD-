import { Fragment, useState } from 'react'
import { Search, Plus, Users, ChevronDown, ChevronUp, Building2, Loader2, X, MapPin, Phone, FileText, UserPlus, Trash2, Pencil } from 'lucide-react'
import { fmt } from '../lib/utils'
import { useApi } from '../lib/useApi'
import { getClients, createClient, updateClient, deleteClient } from '../services/clients.service'
import { isDG } from '../lib/roles'
import AuditHistory from '../components/AuditHistory'

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIF:    { label: 'Actif',    cls: 'bg-green-100 text-green-700' },
  INACTIF:  { label: 'Inactif', cls: 'bg-slate-100 text-slate-500' },
  PROSPECT: { label: 'Prospect', cls: 'bg-blue-100 text-blue-700' },
  SUSPENDU: { label: 'Suspendu', cls: 'bg-red-100 text-red-700' },
}

const SEGMENTS = [
  { value: 'RESIDENTIEL',             label: 'Résidentiel' },
  { value: 'COMMERCIAL',              label: 'Commercial' },
  { value: 'INDUSTRIEL',              label: 'Industriel' },
  { value: 'BANQUE_FINANCE',          label: 'Banque / Finance' },
  { value: 'AMBASSADE_DIPLOMATIQUE',  label: 'Ambassade / Diplomatique' },
  { value: 'EVENEMENTIEL',            label: 'Événementiel' },
  { value: 'ADMINISTRATION_PUBLIQUE', label: 'Administration publique' },
  { value: 'AUTRE',                   label: 'Autre' },
]

type ExtraContact = { firstName: string; lastName: string; phone: string; email?: string; whatsapp?: string; position?: string }

const EMPTY_FORM = {
  // Identification
  name: '', legalName: '', segment: 'COMMERCIAL', sector: '', rccm: '', ncc: '', cniNumber: '',
  // Coordonnées directes
  phone: '', phone2: '', mobile: '', email: '', website: '',
  // Adresse
  address: '', street2: '', zip: '', city: '', district: '', quartier: '', country: "Côte d'Ivoire",
  // GPS
  latitude: '', longitude: '',
  // Notes
  notes: '',
  // Contact principal
  contactFirstName: '', contactLastName: '', contactPhone: '', contactEmail: '', contactWhatsapp: '', contactPosition: '',
  // Contacts secondaires
  additionalContacts: [] as ExtraContact[],
}

const TABS = [
  { id: 'identification', label: 'Identification', icon: Building2 },
  { id: 'address',        label: 'Adresse',        icon: MapPin },
  { id: 'contact',        label: 'Contact principal', icon: Phone },
  { id: 'extras',         label: 'Contacts secondaires', icon: UserPlus },
  { id: 'notes',          label: 'Notes',           icon: FileText },
]

export default function Clients() {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('identification')
  const [form, setForm]           = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM })
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [editingClient, setEditingClient] = useState<any>(null)

  const { data, loading, reload } = useApi(getClients)
  const all = (data as any[]) ?? []

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const updateExtra = (i: number, key: keyof ExtraContact, v: string) =>
    setForm(f => ({ ...f, additionalContacts: f.additionalContacts.map((c, idx) => idx === i ? { ...c, [key]: v } : c) }))

  const addExtra    = () => setForm(f => ({ ...f, additionalContacts: [...f.additionalContacts, { firstName: '', lastName: '', phone: '' }] }))
  const removeExtra = (i: number) => setForm(f => ({ ...f, additionalContacts: f.additionalContacts.filter((_, idx) => idx !== i) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.address || !form.city) {
      setFormError('Champs obligatoires manquants (Nom, Adresse, Ville).')
      return
    }
    if (!editingClient && (!form.contactFirstName || !form.contactLastName || !form.contactPhone)) {
      setFormError('Le contact principal est obligatoire pour un nouveau client.')
      return
    }
    setSaving(true); setFormError(null)
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      }
      if (editingClient) {
        await updateClient(editingClient.id, payload)
      } else {
        await createClient(payload)
      }
      setShowModal(false)
      setForm({ ...EMPTY_FORM })
      setEditingClient(null)
      setActiveTab('identification')
      reload()
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    try {
      await updateClient(clientId, { status: newStatus })
      setEditingStatus(null)
      reload()
    } catch (err: any) {
      console.error('Erreur changement statut:', err)
    }
  }

  const filtered = all.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = c.name.toLowerCase().includes(q)
      || (c.sector ?? '').toLowerCase().includes(q)
      || (c.city ?? '').toLowerCase().includes(q)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all:      all.length,
    ACTIF:    all.filter(c => c.status === 'ACTIF').length,
    PROSPECT: all.filter(c => c.status === 'PROSPECT').length,
    INACTIF:  all.filter(c => c.status === 'INACTIF').length,
  }

  return (
    <Fragment>
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { key: 'all',      label: 'Total clients', count: counts.all },
          { key: 'ACTIF',    label: 'Actifs',        count: counts.ACTIF },
          { key: 'PROSPECT', label: 'Prospects',     count: counts.PROSPECT },
          { key: 'INACTIF',  label: 'Inactifs',      count: counts.INACTIF },
        ]).map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`bg-white rounded-xl p-4 border text-left transition-all ${filter === s.key ? 'border-sagard-yellow shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            {loading
              ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
              : <p className="text-2xl font-black text-slate-800">{s.count}</p>}
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nom, secteur, ville..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
          </div>
          <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditingClient(null); setActiveTab('identification'); setShowModal(true); setFormError(null) }}
            className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors">
            <Plus size={15} /> Nouveau client
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Client', ...(isDG() ? ['Commercial'] : []), 'Secteur', 'Contact principal', 'Contrats', 'CA Total', 'Statut', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => {
                  const st    = STATUS_CFG[client.status] ?? { label: client.status, cls: 'bg-slate-100 text-slate-500' }
                  const contact = client.contacts?.[0]
                  const nbContracts = client._count?.contracts ?? client.contracts?.length ?? 0
                  const totalRev    = client._count?.invoices ?? 0

                  return (
                    <Fragment key={client.id}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sagard-yellow/20 flex items-center justify-center flex-shrink-0">
                              <Building2 size={14} className="text-sagard-yellow-dark" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{client.name}</p>
                              <p className="text-xs text-slate-400">{client.city ?? '—'}</p>
                            </div>
                          </div>
                        </td>
                        {isDG() && (
                          <td className="px-4 py-3">
                            {client.createdBy ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold">
                                {client.createdBy.firstName} {client.createdBy.lastName}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Direct</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-slate-600 text-xs">{client.sector ?? '—'}</td>
                        <td className="px-4 py-3">
                          {contact ? (
                            <>
                              <p className="text-slate-700 font-medium text-xs">{contact.firstName} {contact.lastName}</p>
                              <p className="text-slate-400 text-xs">{contact.phone ?? contact.email ?? '—'}</p>
                            </>
                          ) : <span className="text-slate-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-slate-800">{nbContracts}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 text-xs">
                          {totalRev > 0 ? fmt(totalRev) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {editingStatus === client.id ? (
                            <select
                              value={client.status}
                              onChange={e => handleStatusChange(client.id, e.target.value)}
                              onBlur={() => setEditingStatus(null)}
                              autoFocus
                              className="px-2 py-1 rounded-lg text-xs font-semibold border border-sagard-yellow bg-white focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40"
                            >
                              {Object.entries(STATUS_CFG).map(([val, cfg]) => (
                                <option key={val} value={val}>{cfg.label}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingStatus(client.id)}
                              className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-sagard-yellow/40 transition-all ${st.cls}`}
                              title="Cliquez pour changer le statut"
                            >
                              {st.label}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpanded(expanded === client.id ? null : client.id)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-sagard-yellow-dark font-medium"
                          >
                            {expanded === client.id
                              ? <><ChevronUp size={13} />Masquer</>
                              : <><ChevronDown size={13} />Détails</>}
                          </button>
                        </td>
                      </tr>

                      {expanded === client.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={isDG() ? 8 : 7} className="px-6 py-4">
                            {/* Action buttons */}
                            <div className="flex gap-2 mb-4">
                              <button onClick={() => {
                                setEditingClient(client)
                                setForm({
                                  name: client.name ?? '', legalName: client.legalName ?? '', segment: client.segment ?? 'COMMERCIAL',
                                  sector: client.sector ?? '', rccm: client.rccm ?? '', ncc: client.ncc ?? '', cniNumber: client.cniNumber ?? '',
                                  phone: client.phone ?? '', phone2: client.phone2 ?? '', mobile: client.mobile ?? '',
                                  email: client.email ?? '', website: client.website ?? '',
                                  address: client.address ?? '', street2: client.street2 ?? '', zip: client.zip ?? '',
                                  city: client.city ?? '', district: client.district ?? '', quartier: client.quartier ?? '',
                                  country: client.country ?? "Côte d'Ivoire",
                                  latitude: client.latitude ? String(client.latitude) : '', longitude: client.longitude ? String(client.longitude) : '',
                                  notes: client.notes ?? '',
                                  contactFirstName: client.contactFirstName ?? '', contactLastName: client.contactLastName ?? '',
                                  contactPhone: client.contacts?.[0]?.phone ?? '', contactEmail: client.contacts?.[0]?.email ?? '',
                                  contactWhatsapp: client.contacts?.[0]?.whatsapp ?? '', contactPosition: client.contacts?.[0]?.position ?? '',
                                  additionalContacts: [],
                                })
                                setActiveTab('identification')
                                setShowModal(true)
                              }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                                <Pencil size={12} /> Modifier
                              </button>
                              {isDG() && (
                                <button onClick={async () => {
                                  if (!confirm(`Supprimer le client ${client.name} ? Il sera désactivé.`)) return
                                  await deleteClient(client.id)
                                  reload()
                                }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                                  <Trash2 size={12} /> Supprimer
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Adresse</p>
                                <p className="text-slate-700">{client.address ?? '—'}</p>
                                <p className="text-slate-500 text-xs">{client.city}{client.country ? `, ${client.country}` : ''}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Contacts</p>
                                {(client.contacts ?? []).map((ct: any) => (
                                  <p key={ct.id} className="text-slate-700 text-xs">{ct.firstName} {ct.lastName} — {ct.role ?? 'Contact'}</p>
                                ))}
                                {(client.contacts ?? []).length === 0 && <p className="text-slate-400 text-xs">Aucun contact</p>}
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Sites gardiennés</p>
                                {(client.sites ?? []).map((s: any) => (
                                  <p key={s.id} className="text-slate-700 text-xs">{s.name}</p>
                                ))}
                                {(client.sites ?? []).length === 0 && <p className="text-slate-400 text-xs">Aucun site</p>}
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Réclamations</p>
                                {(client.complaints ?? []).map((c: any) => (
                                  <p key={c.id} className="text-slate-700 text-xs">{c.title} — <span className="text-slate-400">{c.status}</span></p>
                                ))}
                                {(client.complaints ?? []).length === 0 && <p className="text-slate-400 text-xs">Aucune</p>}
                              </div>
                            </div>
                            <div className="mt-4">
                              <AuditHistory entity="Client" entityId={client.id} />
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
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>{search || filter !== 'all' ? 'Aucun résultat' : 'Aucun client enregistré'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Modal Nouveau Client — à onglets (aligné Odoo res.partner) */}
    {showModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 size={18} className="text-sagard-yellow-dark" /> {editingClient ? 'Modifier le client' : 'Nouveau client'}
            </h2>
            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon
              const isActive = activeTab === t.id
              return (
                <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${isActive ? 'border-sagard-yellow text-sagard-dark' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  <Icon size={14} /> {t.label}
                  {t.id === 'extras' && form.additionalContacts.length > 0 && (
                    <span className="ml-1 bg-sagard-yellow text-sagard-dark text-[10px] font-bold rounded-full px-1.5">{form.additionalContacts.length}</span>
                  )}
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-5">
            {/* === ONGLET IDENTIFICATION === */}
            {activeTab === 'identification' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nom commercial *</label>
                  <input value={form.name} onChange={set('name')} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Ex: SGBCI" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Raison sociale</label>
                  <input value={form.legalName} onChange={set('legalName')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Ex: SGBCI SA" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Segment client *</label>
                  <select value={form.segment} onChange={set('segment')} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                    {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">N° RCCM</label>
                  <input value={form.rccm} onChange={set('rccm')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="CI-ABJ-2024-B-..." />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">NCC / Identification fiscale</label>
                  <input value={form.ncc} onChange={set('ncc')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Numéro Compte Contribuable" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Secteur d'activité</label>
                  <input value={form.sector} onChange={set('sector')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Télécommunications, BTP..." />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">N° CNI / Passeport (contact)</label>
                  <input value={form.cniNumber} onChange={set('cniNumber')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="CI-XXXXXXXXX" />
                </div>
                <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700"><b>Note :</b> Le <b>code client</b> (ex: CLI-2026-0001) sera généré automatiquement à l'enregistrement.</p>
                </div>
              </div>
            )}

            {/* === ONGLET ADRESSE & COORDONNÉES DIRECTES === */}
            {activeTab === 'address' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Adresse postale</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Adresse (ligne 1) *</label>
                      <input value={form.address} onChange={set('address')} required
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Rue, numéro..." />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Adresse (ligne 2)</label>
                      <input value={form.street2} onChange={set('street2')}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Complément, bâtiment..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Code postal</label>
                      <input value={form.zip} onChange={set('zip')}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="01 BP..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Ville *</label>
                      <input value={form.city} onChange={set('city')} required
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Abidjan" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Commune / District</label>
                      <input value={form.district} onChange={set('district')}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Plateau, Cocody..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Quartier</label>
                      <input value={form.quartier} onChange={set('quartier')}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Riviera, Angré..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Pays</label>
                      <input value={form.country} onChange={set('country')}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Coordonnées GPS</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Latitude</label>
                      <input value={form.latitude} onChange={set('latitude')} type="number" step="any"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="5.3364" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Longitude</label>
                      <input value={form.longitude} onChange={set('longitude')} type="number" step="any"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="-4.0083" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Coordonnées directes (entreprise)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Contact 1 (téléphone)</label>
                      <input value={form.phone} onChange={set('phone')} type="tel"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="+225 27 XX XX XX XX" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Contact 2</label>
                      <input value={form.phone2} onChange={set('phone2')} type="tel"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="+225 05 XX XX XX XX" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Mobile</label>
                      <input value={form.mobile} onChange={set('mobile')} type="tel"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="+225 07 XX XX XX XX" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Email entreprise</label>
                      <input value={form.email} onChange={set('email')} type="email"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="info@entreprise.ci" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Site web</label>
                      <input value={form.website} onChange={set('website')} type="url"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="https://www.entreprise.ci" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* === ONGLET CONTACT PRINCIPAL === */}
            {activeTab === 'contact' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Prénom *</label>
                  <input value={form.contactFirstName} onChange={set('contactFirstName')} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Kouamé" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
                  <input value={form.contactLastName} onChange={set('contactLastName')} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="KONAN" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fonction</label>
                  <input value={form.contactPosition} onChange={set('contactPosition')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Directeur Général, Responsable sécurité..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone *</label>
                  <input value={form.contactPhone} onChange={set('contactPhone')} required type="tel"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="+225 07 XX XX XX XX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp</label>
                  <input value={form.contactWhatsapp} onChange={set('contactWhatsapp')} type="tel"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="+225 07 XX XX XX XX" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input value={form.contactEmail} onChange={set('contactEmail')} type="email"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="contact@entreprise.ci" />
                </div>
              </div>
            )}

            {/* === ONGLET CONTACTS SECONDAIRES === */}
            {activeTab === 'extras' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Ajoutez d'autres personnes à contacter (facturation, exploitation, urgence…)</p>
                  <button type="button" onClick={addExtra}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sagard-yellow text-sagard-dark rounded-lg text-xs font-bold hover:bg-sagard-yellow-dark transition-colors">
                    <Plus size={13} /> Ajouter un contact
                  </button>
                </div>
                {form.additionalContacts.length === 0 && (
                  <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    <UserPlus size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Aucun contact secondaire. Cliquez sur « Ajouter un contact ».</p>
                  </div>
                )}
                {form.additionalContacts.map((c, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-4 relative">
                    <button type="button" onClick={() => removeExtra(i)}
                      className="absolute top-2 right-2 p-1 rounded text-red-500 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-3">Contact #{i + 2}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={c.firstName} onChange={e => updateExtra(i, 'firstName', e.target.value)} placeholder="Prénom *"
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                      <input value={c.lastName} onChange={e => updateExtra(i, 'lastName', e.target.value)} placeholder="Nom *"
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                      <input value={c.position ?? ''} onChange={e => updateExtra(i, 'position', e.target.value)} placeholder="Fonction"
                        className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                      <input value={c.phone} onChange={e => updateExtra(i, 'phone', e.target.value)} placeholder="Téléphone *" type="tel"
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                      <input value={c.whatsapp ?? ''} onChange={e => updateExtra(i, 'whatsapp', e.target.value)} placeholder="WhatsApp" type="tel"
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                      <input value={c.email ?? ''} onChange={e => updateExtra(i, 'email', e.target.value)} placeholder="Email" type="email"
                        className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* === ONGLET NOTES === */}
            {activeTab === 'notes' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Commentaire interne</label>
                <textarea value={form.notes} onChange={set('notes')} rows={10}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none"
                  placeholder="Informations internes : sensibilité, spécificités, historique commercial..." />
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
                {saving ? <><Loader2 size={14} className="animate-spin" /> Enregistrement...</> : 'Enregistrer le client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </Fragment>
  )
}
