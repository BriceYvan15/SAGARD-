import { Fragment, useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Users, ChevronDown, ChevronUp, Building2, Loader2, X,
  MapPin, Phone, FileText, UserPlus, Trash2, Pencil, Eye, ShieldCheck,
  Briefcase, AlertTriangle, MapPinned, Ban, ArrowUp, ArrowDown,
  CheckSquare, Square, XCircle, MoreVertical, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { fmt } from '../lib/utils'
import { useApi } from '../lib/useApi'
import { getClients, createClient, updateClient, deleteClient } from '../services/clients.service'
import { isDG } from '../lib/roles'
import AuditHistory from '../components/AuditHistory'
import Select from '../components/Select'

const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIF:    { label: 'Actif',    cls: 'bg-green-100 text-green-700',    dot: 'bg-green-500' },
  INACTIF:  { label: 'Inactif',  cls: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400' },
  PROSPECT: { label: 'Prospect', cls: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  SUSPENDU: { label: 'Suspendu', cls: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
}


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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy]     = useState<'name' | 'createdAt' | 'status'>('name')
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('asc')
  const [bulkAction, setBulkAction] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left?: number } | null>(null)
  const actionBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const nav = useNavigate()
  const customSegments: string[] = (() => {
    try {
      const s = localStorage.getItem('sagard_client_segments');
      return s ? JSON.parse(s) : [
        'Résidentiel', 'Commercial', 'Industriel', 'Banque / Finance',
        'Ambassade / Diplomatique', 'Événementiel', 'Administration publique',
        'Particulier', 'Entreprise privée', 'Institution publique', 'ONG',
        'Ambassade', 'Autre'
      ]
    } catch {
      return []
    }
  })()

  const [form, setForm]           = useState<typeof EMPTY_FORM>(() => ({ ...EMPTY_FORM, segment: customSegments[0] ?? 'Commercial' }))
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [editingClient, setEditingClient] = useState<any>(null)

  const { data, loading, reload } = useApi(getClients)
  const all = (data as any[]) ?? []

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))
  const setVal = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(f => ({ ...f, [k]: v }))

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let result = all.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(q)
        || (c.sector ?? '').toLowerCase().includes(q)
        || (c.city ?? '').toLowerCase().includes(q)
      const matchFilter = filter === 'all' || c.status === filter
      return matchSearch && matchFilter
    })
    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = (a.name ?? '').localeCompare(b.name ?? '')
      else if (sortBy === 'createdAt') cmp = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      else if (sortBy === 'status') cmp = (a.status ?? '').localeCompare(b.status ?? '')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [all, search, filter, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))

  useEffect(() => { setPage(1) }, [search, filter, sortBy, sortDir])

  const counts = {
    all:      all.length,
    ACTIF:    all.filter(c => c.status === 'ACTIF').length,
    PROSPECT: all.filter(c => c.status === 'PROSPECT').length,
    INACTIF:  all.filter(c => c.status === 'INACTIF').length,
    SUSPENDU: all.filter(c => c.status === 'SUSPENDU').length,
  }

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const toggleSelectAll = () =>
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)))

  const clearSelection = () => setSelected(new Set())

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ${selected.size} client(s) ? Ils seront désactivés.`)) return
    setBulkAction('deleting')
    setDeleteError(null)
    try {
      for (const id of selected) await deleteClient(id)
      clearSelection()
      reload()
    } catch (err: any) {
      setDeleteError(err.response?.data?.message ?? 'Erreur lors de la suppression.')
    } finally {
      setBulkAction(null)
    }
  }

  const handleBulkStatus = async (newStatus: string) => {
    setBulkAction('status')
    setDeleteError(null)
    try {
      for (const id of selected) await updateClient(id, { status: newStatus })
      clearSelection()
      reload()
    } catch (err: any) {
      setDeleteError(err.response?.data?.message ?? 'Erreur lors du changement de statut.')
    } finally {
      setBulkAction(null)
    }
  }

  const handleDelete = async (client: any) => {
    if (!confirm(`Supprimer le client ${client.name} ? Il sera désactivé.`)) return
    setDeleteError(null)
    try {
      await deleteClient(client.id)
      setExpanded(null)
      reload()
    } catch (err: any) {
      setDeleteError(err.response?.data?.message ?? 'Erreur lors de la suppression.')
    }
  }

  const toggleSort = (col: 'name' | 'createdAt' | 'status') => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  return (
    <Fragment>
    <div className="space-y-5">
      {/* === KPI CARDS === */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {([
          { key: 'all',      label: 'Total',    count: counts.all,      icon: Building2,   color: 'bg-slate-100 text-slate-600' },
          { key: 'ACTIF',    label: 'Actifs',   count: counts.ACTIF,    icon: ShieldCheck, color: 'bg-green-50 text-green-600' },
          { key: 'PROSPECT', label: 'Prospects',count: counts.PROSPECT, icon: UserPlus,    color: 'bg-blue-50 text-blue-600' },
          { key: 'INACTIF',  label: 'Inactifs', count: counts.INACTIF,  icon: Users,       color: 'bg-amber-50 text-amber-600' },
          { key: 'SUSPENDU', label: 'Suspendus',count: counts.SUSPENDU, icon: Ban,         color: 'bg-red-50 text-red-600' },
        ]).map(s => {
          const Icon = s.icon
          const active = filter === s.key
          return (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`bg-white rounded-xl p-3.5 border text-left transition-all flex items-center gap-3 ${active ? 'border-sagard-yellow shadow-md ring-1 ring-sagard-yellow/30' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                {loading
                  ? <div className="w-8 h-6 bg-slate-200 rounded animate-pulse" />
                  : <p className="text-xl font-black text-slate-800 leading-none">{s.count}</p>}
                <p className="text-[11px] text-slate-500 mt-1 truncate">{s.label}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* === ERROR BANNER === */}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
        </div>
      )}

      {/* === MAIN PANEL === */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[150px] max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
            </div>
            <Select value={sortBy} onChange={v => setSortBy(v as any)}
              options={[{ value: 'name', label: 'Trier par nom' }, { value: 'createdAt', label: 'Trier par date' }, { value: 'status', label: 'Trier par statut' }]}
              className="w-36 sm:w-44" />
            <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex-shrink-0">
              {sortDir === 'asc' ? <ArrowUp size={14} className="text-slate-500" /> : <ArrowDown size={14} className="text-slate-500" />}
            </button>
          </div>
          <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditingClient(null); setActiveTab('identification'); setShowModal(true); setFormError(null) }}
            className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors flex-shrink-0">
            <Plus size={15} /> Nouveau client
          </button>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-sagard-yellow/5 border-b border-sagard-yellow/20">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
              <button onClick={clearSelection} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                <XCircle size={13} /> Annuler
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Select onChange={v => { if (v) handleBulkStatus(v) }}
                disabled={!!bulkAction}
                options={[{ value: 'ACTIF', label: 'Activer' }, { value: 'INACTIF', label: 'Désactiver' }, { value: 'SUSPENDU', label: 'Suspendre' }, { value: 'PROSPECT', label: 'Prospect' }]}
                placeholder="Changer statut…"
                size="sm"
                className="w-36"
              />
              <button onClick={handleBulkDelete} disabled={!!bulkAction}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50">
                {bulkAction === 'deleting' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Supprimer
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>{search || filter !== 'all' ? 'Aucun résultat' : 'Aucun client enregistré'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Table header */}
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-10 px-4 py-2.5">
                    <button onClick={toggleSelectAll}>
                      {selected.size === filtered.length && filtered.length > 0
                        ? <CheckSquare size={16} className="text-sagard-yellow-dark" />
                        : <Square size={16} className="text-slate-400 hover:text-slate-500" />}
                    </button>
                  </th>
                  <th className="text-left px-2 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700"
                    onClick={() => toggleSort('name')}>
                    <span className="flex items-center gap-1">Client {sortBy === 'name' && (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}</span>
                  </th>
                  <th className="text-left px-2 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-2 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Secteur</th>
                  <th className="text-center px-2 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Contrats</th>
                  <th className="text-center px-2 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Sites</th>
                  <th className="text-left px-2 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700"
                    onClick={() => toggleSort('status')}>
                    <span className="flex items-center gap-1">Statut {sortBy === 'status' && (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}</span>
                  </th>
                  <th className="w-10 px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map(client => {
                  const st    = STATUS_CFG[client.status] ?? { label: client.status, cls: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' }
                  const contact = client.contacts?.[0]
                  const nbContracts = client._count?.contracts ?? client.contracts?.length ?? 0
                  const nbSites     = client._count?.sites ?? client.sites?.length ?? 0
                  const isOpen = expanded === client.id
                  const isChecked = selected.has(client.id)

                  return (
                    <Fragment key={client.id}>
                      <tr className={`transition-colors ${isChecked ? 'bg-sagard-yellow/5' : 'hover:bg-slate-50'}`}>
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSelect(client.id)}>
                            {isChecked
                              ? <CheckSquare size={16} className="text-sagard-yellow-dark" />
                              : <Square size={16} className="text-slate-300 hover:text-slate-400" />}
                          </button>
                        </td>
                        {/* Client name + code */}
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-sagard-yellow/20 flex items-center justify-center flex-shrink-0">
                              <Building2 size={15} className="text-sagard-yellow-dark" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{client.name}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                {client.code && <span className="font-mono">{client.code}</span>}
                                {client.city && <span className="flex items-center gap-0.5"><MapPin size={10} />{client.city}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Contact */}
                        <td className="px-2 py-3 hidden md:table-cell">
                          {contact ? (
                            <div className="text-xs">
                              <p className="text-slate-700 font-medium">{contact.firstName} {contact.lastName}</p>
                              <p className="text-slate-400">{contact.phone ?? contact.email ?? '—'}</p>
                            </div>
                          ) : <span className="text-slate-400 text-xs">—</span>}
                        </td>
                        {/* Sector */}
                        <td className="px-2 py-3 hidden lg:table-cell">
                          <span className="text-xs text-slate-600">{client.sector ?? '—'}</span>
                        </td>
                        {/* Contracts count */}
                        <td className="px-2 py-3 text-center hidden sm:table-cell">
                          <span className="text-sm font-bold text-slate-700">{nbContracts}</span>
                        </td>
                        {/* Sites count */}
                        <td className="px-2 py-3 text-center hidden sm:table-cell">
                          <span className="text-sm font-bold text-slate-700">{nbSites}</span>
                        </td>
                        {/* Status */}
                        <td className="px-2 py-3">
                          {editingStatus === client.id ? (
                            <Select
                              value={client.status}
                              onChange={v => handleStatusChange(client.id, v)}
                              options={Object.entries(STATUS_CFG).map(([val, cfg]) => ({ value: val, label: cfg.label }))}
                              size="sm"
                              className="w-32"
                            />
                          ) : (
                            <button
                              onClick={() => setEditingStatus(client.id)}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-sagard-yellow/40 transition-all ${st.cls}`}
                              title="Cliquez pour changer le statut"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </button>
                          )}
                        </td>
                        {/* Actions menu */}
                        <td className="px-2 py-3 relative">
                          <button ref={el => { actionBtnRefs.current[client.id] = el }} onClick={() => {
                            if (actionMenu === client.id) {
                              setActionMenu(null)
                            } else {
                              const rect = actionBtnRefs.current[client.id]?.getBoundingClientRect()
                              if (rect) {
                                const spaceBelow = window.innerHeight - rect.bottom
                                const spaceAbove = rect.top
                                const menuWidth = 160
                                const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)
                                if (spaceBelow < 200 && spaceAbove > spaceBelow) {
                                  setMenuPos({ bottom: window.innerHeight - rect.top + 4, left })
                                } else {
                                  setMenuPos({ top: rect.bottom + 4, left })
                                }
                              }
                              setActionMenu(client.id)
                            }
                          }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical size={15} className="text-slate-400" />
                          </button>
                          {actionMenu === client.id && menuPos && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                              <div
                                style={{ top: menuPos.top, bottom: menuPos.bottom, left: menuPos.left }}
                                className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[160px]">
                                <button onClick={() => { setExpanded(isOpen ? null : client.id); setActionMenu(null) }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                                  {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                  {isOpen ? 'Masquer' : 'Aperçu'}
                                </button>
                                <button onClick={() => { nav(`/clients/${client.id}`); setActionMenu(null) }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                                  <Eye size={13} /> Fiche complète
                                </button>
                                <button onClick={() => {
                                  setEditingClient(client)
                                  setForm({
                                    name: client.name ?? '', legalName: client.legalName ?? '', segment: client.segment ?? customSegments[0] ?? 'Commercial',
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
                                  setActionMenu(null)
                                }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                                  <Pencil size={13} /> Modifier
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button onClick={() => { handleDelete(client); setActionMenu(null) }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                                  <Trash2 size={13} /> Supprimer
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>

                      {/* Expanded preview row */}
                      {isOpen && (
                        <tr className="bg-slate-50">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {/* Address */}
                              <div className="bg-white rounded-lg p-3 border border-slate-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <MapPin size={13} className="text-slate-400" />
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Adresse</p>
                                </div>
                                <p className="text-sm text-slate-700">{client.address ?? '—'}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{client.city}{client.country ? `, ${client.country}` : ''}</p>
                              </div>
                              {/* Contacts */}
                              <div className="bg-white rounded-lg p-3 border border-slate-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Phone size={13} className="text-slate-400" />
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contacts</p>
                                </div>
                                {(client.contacts ?? []).length > 0 ? (client.contacts ?? []).slice(0, 3).map((ct: any) => (
                                  <p key={ct.id} className="text-xs text-slate-700 leading-relaxed">{ct.firstName} {ct.lastName} — {ct.role ?? 'Contact'}</p>
                                )) : <p className="text-xs text-slate-400">Aucun contact</p>}
                                {(client.contacts ?? []).length > 3 && <p className="text-xs text-slate-400 mt-1">+{(client.contacts ?? []).length - 3} autre(s)</p>}
                              </div>
                              {/* Sites */}
                              <div className="bg-white rounded-lg p-3 border border-slate-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <MapPinned size={13} className="text-slate-400" />
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sites</p>
                                </div>
                                {(client.sites ?? []).length > 0 ? (client.sites ?? []).slice(0, 3).map((s: any) => (
                                  <p key={s.id} className="text-xs text-slate-700 leading-relaxed">{s.name}</p>
                                )) : <p className="text-xs text-slate-400">Aucun site</p>}
                                {(client.sites ?? []).length > 3 && <p className="text-xs text-slate-400 mt-1">+{(client.sites ?? []).length - 3} autre(s)</p>}
                              </div>
                              {/* Complaints */}
                              <div className="bg-white rounded-lg p-3 border border-slate-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <AlertTriangle size={13} className="text-slate-400" />
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Réclamations</p>
                                </div>
                                {(client.complaints ?? []).length > 0 ? (client.complaints ?? []).slice(0, 3).map((cp: any) => (
                                  <p key={cp.id} className="text-xs text-slate-700 leading-relaxed">{cp.title} — <span className="text-slate-400">{cp.status}</span></p>
                                )) : <p className="text-xs text-slate-400">Aucune</p>}
                              </div>
                            </div>
                            {/* Audit + actions */}
                            <div className="flex items-center gap-2 mt-4">
                              <button onClick={() => {
                                setEditingClient(client)
                                setForm({
                                  name: client.name ?? '', legalName: client.legalName ?? '', segment: client.segment ?? customSegments[0] ?? 'Commercial',
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
                              <button onClick={() => handleDelete(client)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                                <Trash2 size={12} /> Supprimer
                              </button>
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
          </div>
        )}

        {/* Pagination footer */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-sm">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Afficher</span>
              <Select value={String(pageSize)} onChange={v => { setPageSize(Number(v)); setPage(1) }}
                options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }, { value: '100', label: '100' }]}
                size="sm" className="w-20" />
              <span>par page · {filtered.length} au total</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={15} className="text-slate-500" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-slate-400">…</span>
                    )}
                    <button onClick={() => goToPage(p)}
                      className={`min-w-[28px] h-7 px-1 rounded-lg text-xs font-semibold transition-colors ${p === currentPage ? 'bg-sagard-yellow text-sagard-dark' : 'text-slate-600 hover:bg-slate-100'}`}>
                      {p}
                    </button>
                  </Fragment>
                ))}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight size={15} className="text-slate-500" />
              </button>
            </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
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
                  <Select value={form.segment} onChange={setVal('segment')} required
                    options={customSegments.map(s => ({ value: s, label: s }))} className="w-full" />
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
                <div className="col-span-1 sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700"><b>Note :</b> Le <b>code client</b> (ex: CLI-2026-0001) sera généré automatiquement à l'enregistrement.</p>
                </div>
              </div>
            )}

            {/* === ONGLET ADRESSE & COORDONNÉES DIRECTES === */}
            {activeTab === 'address' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Adresse postale</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Adresse (ligne 1) *</label>
                      <input value={form.address} onChange={set('address')} required
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Rue, numéro..." />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="col-span-1 sm:col-span-2">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={c.firstName} onChange={e => updateExtra(i, 'firstName', e.target.value)} placeholder="Prénom *"
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                      <input value={c.lastName} onChange={e => updateExtra(i, 'lastName', e.target.value)} placeholder="Nom *"
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                      <input value={c.position ?? ''} onChange={e => updateExtra(i, 'position', e.target.value)} placeholder="Fonction"
                        className="col-span-1 sm:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                      <input value={c.phone} onChange={e => updateExtra(i, 'phone', e.target.value)} placeholder="Téléphone *" type="tel"
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                      <input value={c.whatsapp ?? ''} onChange={e => updateExtra(i, 'whatsapp', e.target.value)} placeholder="WhatsApp" type="tel"
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                      <input value={c.email ?? ''} onChange={e => updateExtra(i, 'email', e.target.value)} placeholder="Email" type="email"
                        className="col-span-1 sm:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
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
