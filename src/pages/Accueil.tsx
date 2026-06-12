import { useState, useEffect } from 'react'
import {
  DoorOpen, UserPlus, Clock, LogOut as LogOutIcon, Search, Plus,
  Phone, Building2, FileText, User, Loader2, CheckCircle2, AlertTriangle,
  Calendar, Briefcase,
} from 'lucide-react'
import { getVisitors, createVisitor, checkOutVisitor, VISIT_PURPOSES, ID_DOC_TYPES } from '../services/visitors.service'
import { getCandidacies } from '../services/hr.service'
import { getSites } from '../services/sites.service'
import { getUser } from '../lib/auth'
import NewPostulantModal from '../components/NewPostulantModal'

const TABS = [
  { id: 'visites', label: 'Registre des visites', icon: DoorOpen },
  { id: 'postulants', label: 'Postulants', icon: UserPlus },
] as const

type Tab = typeof TABS[number]['id']

export default function Accueil() {
  const [tab, setTab] = useState<Tab>('visites')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <DoorOpen size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800">Accueil & Réception</h1>
          <p className="text-xs text-slate-500">Gestion des visites et enregistrement des postulants</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'visites' && <VisitesTab />}
      {tab === 'postulants' && <PostulantsTab />}
    </div>
  )
}

// â•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Â
// ONGLET VISITES
// â•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Â
function VisitesTab() {
  const [visits, setVisits] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'sorti'>('all')

  const load = async () => {
    setLoading(true)
    try {
      const [v, s] = await Promise.all([getVisitors(), getSites()])
      setVisits(v)
      setSites(s)
    } catch { }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCheckOut = async (id: string) => {
    try {
      await checkOutVisitor(id)
      load()
    } catch { }
  }

  const filtered = visits.filter(v => {
    const matchSearch = !search || v.visitorName?.toLowerCase().includes(search.toLowerCase()) ||
      v.visitorCompany?.toLowerCase().includes(search.toLowerCase()) ||
      v.reference?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'present' && !v.checkOut) ||
      (filterStatus === 'sorti' && !!v.checkOut)
    return matchSearch && matchStatus
  })

  const todayVisits = visits.filter(v => {
    const d = new Date(v.checkIn)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })
  const presentNow = todayVisits.filter(v => !v.checkOut)

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-blue-500" />
            <span className="text-xs text-slate-500 font-medium">Visites aujourd'hui</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{todayVisits.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <User size={16} className="text-green-500" />
            <span className="text-xs text-slate-500 font-medium">Présents actuellement</span>
          </div>
          <p className="text-2xl font-black text-green-600">{presentNow.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Sortis aujourd'hui</span>
          </div>
          <p className="text-2xl font-black text-slate-500">{todayVisits.length - presentNow.length}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un visiteur..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Tous</option>
          <option value="present">Présents</option>
          <option value="sorti">Sortis</option>
        </select>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition ml-auto"
        >
          <Plus size={16} />
          Nouvelle visite
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Réf.</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Visiteur</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Entreprise</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Motif</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Personne visitée</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Arrivée</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Départ</th>
                <th className="text-center px-4 py-3 text-xs text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">Aucune visite enregistrée</td></tr>
              ) : filtered.map(v => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">{v.reference}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{v.visitorName}</div>
                    {v.visitorPhone && <div className="text-xs text-slate-400">{v.visitorPhone}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.visitorCompany ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      v.visitPurpose === 'CANDIDATURE' ? 'bg-purple-100 text-purple-700' :
                      v.visitPurpose === 'ENTRETIEN' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {VISIT_PURPOSES.find(p => p.value === v.visitPurpose)?.label ?? v.visitPurpose}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.hostName ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtTime(v.checkIn)}</td>
                  <td className="px-4 py-3 text-xs">
                    {v.checkOut ? (
                      <span className="text-green-600 font-semibold">{fmtTime(v.checkOut)}</span>
                    ) : (
                      <span className="text-amber-600 font-semibold">En cours</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!v.checkOut && (
                      <button
                        onClick={() => handleCheckOut(v.id)}
                        className="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1 rounded-lg hover:bg-red-100 transition"
                      >
                        <LogOutIcon size={12} className="inline mr-1" />
                        Sortie
                      </button>
                    )}
                    {v.isBlacklisted && (
                      <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                        <AlertTriangle size={10} className="inline mr-1" />Blacklist
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nouvelle visite */}
      {showForm && (
        <NewVisitModal siteId={sites.length > 0 ? sites[0].id : ''} onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load() }} />
      )}
    </div>
  )
}

// â•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Â
// MODAL NOUVELLE VISITE
// â•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Â
function NewVisitModal({ siteId, onClose, onCreated }: { siteId: string; onClose: () => void; onCreated: () => void }) {
  const user = getUser()
  const [form, setForm] = useState({
    visitorName: '',
    visitorCompany: '',
    visitorPhone: '',
    idType: 'CNI',
    idNumber: '',
    visitPurpose: 'REUNION',
    hostName: '',
    plateNumber: '',
    badgeNo: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.visitorName) { setError('Le nom du visiteur est obligatoire'); return }
    setSaving(true)
    setError('')
    try {
      await createVisitor({ ...form, siteId, agentId: user?.id })
      onCreated()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Enregistrer une visite</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom du visiteur *">
              <input value={form.visitorName} onChange={e => set('visitorName', e.target.value)} className="input-field" placeholder="Nom complet" />
            </Field>
            <Field label="Entreprise / Provenance">
              <input value={form.visitorCompany} onChange={e => set('visitorCompany', e.target.value)} className="input-field" placeholder="Société" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone">
              <input value={form.visitorPhone} onChange={e => set('visitorPhone', e.target.value)} className="input-field" placeholder="0X XX XX XX XX" />
            </Field>
            <Field label="Personne visitée">
              <input value={form.hostName} onChange={e => set('hostName', e.target.value)} className="input-field" placeholder="Nom de la personne" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Type de pièce">
              <select value={form.idType} onChange={e => set('idType', e.target.value)} className="input-field">
                {ID_DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="N° pièce d'identité">
              <input value={form.idNumber} onChange={e => set('idNumber', e.target.value)} className="input-field" placeholder="N° CNI / Passeport" />
            </Field>
            <Field label="Motif de la visite">
              <select value={form.visitPurpose} onChange={e => set('visitPurpose', e.target.value)} className="input-field">
                {VISIT_PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="N° plaque véhicule">
              <input value={form.plateNumber} onChange={e => set('plateNumber', e.target.value)} className="input-field" placeholder="AB 1234 CD" />
            </Field>
            <Field label="N° badge visiteur">
              <input value={form.badgeNo} onChange={e => set('badgeNo', e.target.value)} className="input-field" placeholder="Badge n°" />
            </Field>
          </div>

          <Field label="Notes / Observations">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field h-16 resize-none" placeholder="Informations supplémentaires..." />
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
          <button onClick={submit} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// â•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Â
// ONGLET POSTULANTS
// â•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Â
function PostulantsTab() {
  const [candidacies, setCandidacies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getCandidacies()
      setCandidacies(data)
    } catch { }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = candidacies.filter(c => {
    if (!search) return true
    const full = `${c.firstName} ${c.lastName} ${c.phone} ${c.position}`.toLowerCase()
    return full.includes(search.toLowerCase())
  })

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    CANDIDATURE: { label: 'Nouvelle', cls: 'bg-blue-100 text-blue-700' },
    ENTRETIEN: { label: 'Entretien', cls: 'bg-indigo-100 text-indigo-700' },
    FORMATION: { label: 'Formation', cls: 'bg-amber-100 text-amber-700' },
    ACCEPTE: { label: 'Accepté', cls: 'bg-green-100 text-green-700' },
    REJETE: { label: 'Rejeté', cls: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un postulant..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition ml-auto"
        >
          <Plus size={16} />
          Nouveau postulant
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Nom complet</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Téléphone</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Poste souhaité</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">N° CNI</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Aucun postulant enregistré</td></tr>
              ) : filtered.map(c => {
                const st = STATUS_MAP[c.status] ?? { label: c.status, cls: 'bg-slate-100 text-slate-600' }
                return (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{c.firstName} {c.lastName}</div>
                      {c.email && <div className="text-xs text-slate-400">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{c.position}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.cniNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(c.appliedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <NewPostulantModal onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load() }} />}
    </div>
  )
}


// â•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Â
// HELPERS
// â•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Ââ•Â
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function fmtTime(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
