import { useState, useEffect, useMemo } from 'react'
import {
  DoorOpen, UserPlus, Clock, LogOut as LogOutIcon, Search, Plus,
  Phone, Building2, FileText, User, Loader2, CheckCircle2, AlertTriangle,
  Calendar, Briefcase, X, Save, FileDown, ChevronDown,
} from 'lucide-react'
import Pagination from '../components/Pagination'
import { getVisitors, createVisitor, checkOutVisitor, VISIT_PURPOSES, ID_DOC_TYPES } from '../services/visitors.service'
import { getCandidacies } from '../services/hr.service'
import { getSites } from '../services/sites.service'
import { getUser } from '../lib/auth'
import NewPostulantModal from '../components/NewPostulantModal'
import Select from '../components/Select'
import DatePicker from '../components/DatePicker'
import { exportVisitorFiche, exportVisitList } from '../lib/visitor-pdf'

function toPdfData(v: any) {
  return {
    ...v,
    siteName: v.site?.name,
    agentName: v.agent ? `${v.agent.firstName} ${v.agent.lastName}` : undefined,
  }
}

const TABS = [
  { id: 'visites', label: 'Registre des visites', icon: DoorOpen },
  { id: 'postulants', label: 'Postulants', icon: UserPlus },
] as const

type Tab = typeof TABS[number]['id']

export default function Accueil() {
  const [tab, setTab] = useState<Tab>('visites')

  return (
    <div className="space-y-5">
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [exportOpen, setExportOpen] = useState(false)
  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0])

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

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, Math.ceil(filtered.length / pageSize))))

  const todayVisits = visits.filter(v => {
    const d = new Date(v.checkIn)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })
  const presentNow = todayVisits.filter(v => !v.checkOut)

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{todayVisits.length}</p>
            <p className="text-xs text-slate-500 font-medium">Visites aujourd'hui</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-green-600">{presentNow.length}</p>
            <p className="text-xs text-slate-500 font-medium">Présents actuellement</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} className="text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-500">{todayVisits.length - presentNow.length}</p>
            <p className="text-xs text-slate-500 font-medium">Sortis aujourd'hui</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un visiteur..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'present', 'sorti'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s === 'all' ? 'Tous' : s === 'present' ? 'Présents' : 'Sortis'}
            </button>
          ))}

          {/* Export dropdown */}
          <div className="relative ml-auto">
            <button
              onClick={() => setExportOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <FileDown size={14} />
              Export PDF
              <ChevronDown size={12} />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl shadow-lg border border-slate-200 w-64 py-2">
                  <button
                    onClick={() => { setExportOpen(false); exportVisitList(filtered.map(toPdfData), 'Registre des visites — Liste complète') }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileDown size={13} /> Exporter la liste filtrée ({filtered.length})
                  </button>
                  {selected.size > 0 && (
                    <button
                      onClick={() => { setExportOpen(false); exportVisitList(filtered.filter(v => selected.has(v.id)).map(toPdfData), `Registre des visites — Sélection (${selected.size})`) }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FileDown size={13} /> Exporter la sélection ({selected.size})
                    </button>
                  )}
                  <div className="border-t border-slate-100 my-1" />
                  <div className="px-4 py-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Export par jour</label>
                    <div className="flex items-center gap-2 mt-1">
                      <DatePicker
                        value={exportDate}
                        onChange={v => setExportDate(v)}
                        className="flex-1"
                      />
                      <button
                        onClick={() => {
                          setExportOpen(false)
                          const dayVisits = visits.filter(v => {
                            const d = new Date(v.checkIn)
                            return d.toISOString().split('T')[0] === exportDate
                          })
                          if (dayVisits.length === 0) { alert('Aucune visite pour cette date'); return }
                          exportVisitList(dayVisits.map(toPdfData), `Registre des visites — ${new Date(exportDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, exportDate)
                        }}
                        className="px-2.5 py-1 bg-sagard-yellow text-sagard-dark rounded-lg text-xs font-bold hover:bg-sagard-yellow-dark transition-colors"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors"
          >
            <Plus size={15} />
            Nouvelle visite
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Selection bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-sagard-yellow/10 border-b border-sagard-yellow/20">
              <span className="text-xs font-bold text-sagard-dark">{selected.size} sélectionné(s)</span>
              <button
                onClick={() => {
                  const pageIds = new Set(paginated.map(v => v.id))
                  const newSel = new Set(selected)
                  pageIds.forEach(id => newSel.delete(id))
                  setSelected(newSel)
                }}
                className="text-xs text-slate-600 hover:text-slate-800 underline"
              >
                Désélectionner la page
              </button>
              <button onClick={() => setSelected(new Set())} className="text-xs text-slate-600 hover:text-slate-800 underline">
                Tout désélectionner
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && paginated.every(v => selected.has(v.id))}
                      onChange={e => {
                        const newSel = new Set(selected)
                        if (e.target.checked) {
                          paginated.forEach(v => newSel.add(v.id))
                        } else {
                          paginated.forEach(v => newSel.delete(v.id))
                        }
                        setSelected(newSel)
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-sagard-yellow focus:ring-sagard-yellow/40 cursor-pointer"
                    />
                  </th>
                  {['Réf.', 'Visiteur', 'Entreprise', 'Motif', 'Personne visitée', 'Agent', 'Arrivée', 'Départ', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-slate-400">
                    <DoorOpen size={36} className="mx-auto mb-2 opacity-20" />
                    Aucune visite enregistrée
                  </td></tr>
                ) : paginated.map(v => (
                  <tr key={v.id} className={`hover:bg-slate-50 transition-colors ${selected.has(v.id) ? 'bg-sagard-yellow/5' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(v.id)}
                        onChange={e => {
                          const newSel = new Set(selected)
                          if (e.target.checked) newSel.add(v.id)
                          else newSel.delete(v.id)
                          setSelected(newSel)
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-sagard-yellow focus:ring-sagard-yellow/40 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{v.reference}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{v.visitorName}</div>
                      {v.visitorPhone && <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={10} /> {v.visitorPhone}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{v.visitorCompany ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        v.visitPurpose === 'CANDIDATURE' ? 'bg-purple-100 text-purple-700' :
                        v.visitPurpose === 'ENTRETIEN' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {VISIT_PURPOSES.find(p => p.value === v.visitPurpose)?.label ?? v.visitPurpose}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{v.hostName ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {v.agent ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 flex-shrink-0">
                            {v.agent.firstName?.[0] ?? '?'}{v.agent.lastName?.[0] ?? ''}
                          </div>
                          <span className="whitespace-nowrap">{v.agent.firstName} {v.agent.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{fmtTime(v.checkIn)}</td>
                    <td className="px-4 py-3 text-xs">
                      {v.checkOut ? (
                        <span className="text-green-600 font-semibold">{fmtTime(v.checkOut)}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center gap-1"><Clock size={10} /> En cours</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => exportVisitorFiche(toPdfData(v))}
                          className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Fiche PDF individuelle"
                        >
                          <FileDown size={11} /> Fiche
                        </button>
                        {!v.checkOut && (
                          <button
                            onClick={() => handleCheckOut(v.id)}
                            className="flex items-center gap-1 text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <LogOutIcon size={11} /> Sortie
                          </button>
                        )}
                        {v.isBlacklisted && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle size={9} />Blacklist
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={goToPage} onPageSizeChange={s => { setPageSize(s); setPage(1) }} />
          )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header with gradient */}
        <div className="relative px-6 py-5" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a2332 100%)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sagard-yellow/20 flex items-center justify-center">
                <DoorOpen size={20} className="text-sagard-yellow" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Enregistrer une visite</h2>
                <p className="text-[11px] text-slate-400">Renseignez les informations du visiteur</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X size={18} className="text-slate-400" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
              <AlertTriangle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Section: Visiteur */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <User size={12} /> Identité du visiteur
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nom du visiteur *">
                <input value={form.visitorName} onChange={e => set('visitorName', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none transition-all" placeholder="Nom complet" />
              </Field>
              <Field label="Entreprise / Provenance">
                <input value={form.visitorCompany} onChange={e => set('visitorCompany', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none transition-all" placeholder="Société" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone">
                <input value={form.visitorPhone} onChange={e => set('visitorPhone', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none transition-all" placeholder="0X XX XX XX XX" />
              </Field>
              <Field label="Personne visitée">
                <input value={form.hostName} onChange={e => set('hostName', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none transition-all" placeholder="Nom de la personne" />
              </Field>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Section: Pièce d'identité & Motif */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <FileText size={12} /> Pièce d'identité & Motif
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Type de pièce">
                <Select value={form.idType} onChange={v => set('idType', v)}
                  options={ID_DOC_TYPES.map(d => ({ value: d.value, label: d.label }))} className="w-full" />
              </Field>
              <Field label="N° pièce d'identité">
                <input value={form.idNumber} onChange={e => set('idNumber', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none transition-all" placeholder="N° CNI / Passeport" />
              </Field>
              <Field label="Motif de la visite">
                <Select value={form.visitPurpose} onChange={v => set('visitPurpose', v)}
                  options={VISIT_PURPOSES.map(p => ({ value: p.value, label: p.label }))} className="w-full" />
              </Field>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Section: Véhicule & Badge */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Briefcase size={12} /> Véhicule & Badge
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="N° plaque véhicule">
                <input value={form.plateNumber} onChange={e => set('plateNumber', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none transition-all" placeholder="AB 1234 CD" />
              </Field>
              <Field label="N° badge visiteur">
                <input value={form.badgeNo} onChange={e => set('badgeNo', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none transition-all" placeholder="Badge n°" />
              </Field>
            </div>
            <Field label="Notes / Observations">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none transition-all h-16 resize-none" placeholder="Informations supplémentaires..." />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-white bg-white transition-colors">Annuler</button>
          <button onClick={submit} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer la visite
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, Math.ceil(filtered.length / pageSize))))

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
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un postulant..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors ml-auto"
        >
          <Plus size={15} />
          Nouveau postulant
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nom complet</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Téléphone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Poste souhaité</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">N° CNI</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                  <UserPlus size={36} className="mx-auto mb-2 opacity-20" />
                  Aucun postulant enregistré
                </td></tr>
              ) : paginated.map(c => {
                const st = STATUS_MAP[c.status] ?? { label: c.status, cls: 'bg-slate-100 text-slate-600' }
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{c.firstName} {c.lastName}</div>
                      {c.email && <div className="text-xs text-slate-400">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{c.phone}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 text-xs">{c.position}</td>
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
          {filtered.length > 0 && (
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={goToPage} onPageSizeChange={s => { setPageSize(s); setPage(1) }} />
          )}
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
