import { useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, X, Save, Loader2, Phone, Mail, MapPin, ChevronRight,
  TrendingUp, Target, Award, XCircle, ArrowRight, UserPlus,
} from 'lucide-react'
import { useApi } from '../lib/useApi'
import {
  getLeads, createLead, qualifyLead, proposeLead, negotiateLead,
  winLead, loseLead, getLeadStats, convertLeadToClient,
  LEAD_STAGES, LEAD_SERVICE_TYPES, LEAD_SOURCES, LEAD_PRIORITIES,
} from '../services/leads.service'
import { getClients } from '../services/clients.service'
import { getUsers } from '../services/users.service'
import { isDG } from '../lib/roles'

type ViewMode = 'kanban' | 'list'

export default function Prospects() {
  const nav = useNavigate()
  const { data, loading, reload } = useApi(getLeads)
  const { data: statsRaw } = useApi(getLeadStats)
  const { data: clientsRaw } = useApi(getClients)
  const { data: usersRaw } = useApi(getUsers)
  const leads = (data as any[]) ?? []
  const stats = (statsRaw as any[]) ?? []
  const clients = (clientsRaw as any[]) ?? []
  const users = (usersRaw as any[]) ?? []
  const userMap = Object.fromEntries(users.map((u: any) => [u.id, `${u.firstName} ${u.lastName}`]))
  const [view, setView] = useState<ViewMode>('kanban')
  const [showCreate, setShowCreate] = useState(false)
  const [convertLead, setConvertLead] = useState<any>(null)

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-6 gap-3">
        {LEAD_STAGES.map(s => {
          const st = stats.find((x: any) => x.stage === s.value)
          return (
            <div key={s.value} className={`bg-white border border-slate-200 rounded-xl p-3 text-center`}>
              <Badge label={s.label} color={s.color} />
              <p className="text-2xl font-bold text-slate-800 mt-1">{st?.count ?? 0}</p>
              {st?.totalRevenue > 0 && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {Number(st.totalRevenue).toLocaleString('fr-FR')} XOF
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <button onClick={() => setView('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === 'kanban' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
            Pipeline
          </button>
          <button onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
            Liste
          </button>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700">
          <Plus size={12} /> Nouveau prospect
        </button>
      </div>

      {loading ? <Spinner /> : (
        view === 'kanban'
          ? <KanbanView leads={leads} reload={reload} onConvert={setConvertLead} userMap={userMap} />
          : <ListView leads={leads} reload={reload} onConvert={setConvertLead} userMap={userMap} />
      )}

      {showCreate && (
        <CreateLeadModal
          clients={clients}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); reload() }}
        />
      )}

      {convertLead && (
        <ConvertToClientModal
          lead={convertLead}
          onClose={() => setConvertLead(null)}
          onConverted={(clientId: string) => {
            setConvertLead(null)
            reload()
            nav(`/clients`)
          }}
        />
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  KANBAN VIEW                                                */
/* ════════════════════════════════════════════════════════════ */
const ACTIVE_STAGES = LEAD_STAGES.filter(s => !['GAGNE', 'PERDU'].includes(s.value))

function KanbanView({ leads, reload, onConvert, userMap }: { leads: any[]; reload: () => void; onConvert: (lead: any) => void; userMap: Record<string, string> }) {
  const advance = async (lead: any) => {
    const order = ['NOUVEAU', 'QUALIFIE', 'PROPOSITION', 'NEGOCIATION']
    const idx = order.indexOf(lead.stage)
    if (idx < 0) return
    const actions: Record<string, (id: string) => Promise<any>> = {
      NOUVEAU: qualifyLead,
      QUALIFIE: proposeLead,
      PROPOSITION: negotiateLead,
    }
    if (actions[lead.stage]) {
      await actions[lead.stage](lead.id)
      reload()
    }
  }

  const doLose = async (id: string) => { await loseLead(id); reload() }

  return (
    <div className="grid grid-cols-4 gap-4">
      {ACTIVE_STAGES.map(stage => {
        const stageLeads = leads.filter(l => l.stage === stage.value)
        return (
          <div key={stage.value} className="space-y-2">
            <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl bg-${stage.color}-50 border border-${stage.color}-200`}>
              <span className={`text-xs font-bold text-${stage.color}-700`}>{stage.label}</span>
              <span className={`text-xs font-bold bg-${stage.color}-200 text-${stage.color}-800 px-2 py-0.5 rounded-full`}>{stageLeads.length}</span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {stageLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} onAdvance={() => advance(lead)} onWin={() => onConvert(lead)} onLose={() => doLose(lead.id)} userMap={userMap} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LeadCard({ lead, onAdvance, onWin, onLose, userMap }: {
  lead: any; onAdvance: () => void; onWin: () => void; onLose: () => void; userMap: Record<string, string>
}) {
  const svc = LEAD_SERVICE_TYPES.find(t => t.value === lead.serviceType)
  const prio = LEAD_PRIORITIES.find(p => p.value === lead.priority)
  const canAdvance = ['NOUVEAU', 'QUALIFIE', 'PROPOSITION'].includes(lead.stage)
  const canWin = lead.stage === 'NEGOCIATION'

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] font-mono text-slate-400">{lead.reference}</span>
        {prio && <Badge label={prio.label} color={prio.color} />}
      </div>
      <p className="text-sm font-semibold text-slate-800 leading-tight mb-1">{lead.title}</p>
      {lead.companyName && <p className="text-xs text-slate-500 mb-1">{lead.companyName}</p>}
      {lead.contactName && (
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Phone size={10} /> {lead.contactName}
        </p>
      )}
      {svc && <Badge label={svc.label} color="indigo" />}
      {lead.estimatedRevenue && (
        <p className="text-xs font-semibold text-green-600 mt-1.5">
          {Number(lead.estimatedRevenue).toLocaleString('fr-FR')} XOF
        </p>
      )}
      {isDG() && lead.createdById && (
        <p className="text-[10px] mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-semibold">
          <UserPlus size={9} /> {userMap[lead.createdById] ?? 'Commercial'}
        </p>
      )}
      <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100">
        {canAdvance && (
          <button onClick={onAdvance} className="flex items-center gap-0.5 text-[10px] px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100">
            <ArrowRight size={10} /> Avancer
          </button>
        )}
        {canWin && (
          <button onClick={onWin} className="flex items-center gap-0.5 text-[10px] px-2 py-1 rounded bg-green-50 text-green-700 font-medium hover:bg-green-100">
            <Award size={10} /> Gagné
          </button>
        )}
        {!['GAGNE', 'PERDU'].includes(lead.stage) && (
          <button onClick={onLose} className="flex items-center gap-0.5 text-[10px] px-2 py-1 rounded bg-red-50 text-red-600 font-medium hover:bg-red-100">
            <XCircle size={10} /> Perdu
          </button>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  LIST VIEW                                                  */
/* ════════════════════════════════════════════════════════════ */
function ListView({ leads, reload, onConvert, userMap }: { leads: any[]; reload: () => void; onConvert: (lead: any) => void; userMap: Record<string, string> }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? leads : leads.filter(l => l.stage === filter)

  return (
    <Fragment>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {[{ v: 'all', l: 'Tous' }, ...LEAD_STAGES.map(s => ({ v: s.value, l: s.label }))].map(o => (
          <button key={o.v} onClick={() => setFilter(o.v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === o.v ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {o.l} {o.v !== 'all' && <span className="ml-1 font-bold">{leads.filter(l => l.stage === o.v).length}</span>}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(lead => {
          const stage = LEAD_STAGES.find(s => s.value === lead.stage)
          const svc = LEAD_SERVICE_TYPES.find(t => t.value === lead.serviceType)
          const prio = LEAD_PRIORITIES.find(p => p.value === lead.priority)
          return (
            <div key={lead.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-slate-400">{lead.reference}</span>
                  {stage && <Badge label={stage.label} color={stage.color} />}
                  {prio && <Badge label={prio.label} color={prio.color} />}
                  {svc && <Badge label={svc.label} color="indigo" />}
                </div>
                <p className="text-sm font-semibold text-slate-800">{lead.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lead.companyName || lead.contactName}
                  {lead.siteCity && <span> · {lead.siteCity}</span>}
                  {lead.estimatedRevenue && <span className="text-green-600 font-semibold ml-2">{Number(lead.estimatedRevenue).toLocaleString('fr-FR')} XOF</span>}
                  <span className="ml-2">· {lead.probability}%</span>
                  {isDG() && lead.createdById && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold">
                      Commercial : {userMap[lead.createdById] ?? lead.createdById.slice(0, 8)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {lead.stage === 'NOUVEAU' && <Btn label="Qualifier" onClick={async () => { await qualifyLead(lead.id); reload() }} cls="bg-indigo-100 text-indigo-700" />}
                {lead.stage === 'QUALIFIE' && <Btn label="Proposer" onClick={async () => { await proposeLead(lead.id); reload() }} cls="bg-purple-100 text-purple-700" />}
                {lead.stage === 'PROPOSITION' && <Btn label="Négocier" onClick={async () => { await negotiateLead(lead.id); reload() }} cls="bg-amber-100 text-amber-700" />}
                {lead.stage === 'NEGOCIATION' && <Btn label="Gagné → Client" onClick={() => onConvert(lead)} cls="bg-green-100 text-green-700" icon={<UserPlus size={11} />} />}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <Empty text="Aucun prospect" />}
      </div>
    </Fragment>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  CREATE MODAL                                               */
/* ════════════════════════════════════════════════════════════ */
function CreateLeadModal({ clients, onClose, onCreated }: {
  clients: any[]; onClose: () => void; onCreated: () => void
}) {
  const [form, setForm] = useState({
    title: '', companyName: '', contactName: '', contactEmail: '', contactPhone: '',
    clientId: '', source: 'APPEL_ENTRANT', priority: 'NORMALE',
    serviceType: 'GARDIENNAGE_STATIQUE', siteAddress: '', siteCity: '',
    nbAgentsEstimated: '', estimatedRevenue: '', notes: '',
  })
  const [saving, setSaving] = useState(false)

  const doCreate = async () => {
    if (!form.title) return
    setSaving(true)
    try {
      await createLead({
        ...form,
        clientId: form.clientId || undefined,
        nbAgentsEstimated: form.nbAgentsEstimated ? parseInt(form.nbAgentsEstimated) : 0,
        estimatedRevenue: form.estimatedRevenue || undefined,
      })
      onCreated()
    } finally { setSaving(false) }
  }

  return (
    <Modal title="Nouveau prospect" onClose={onClose}>
      <div className="space-y-3 p-5">
        <Field label="Titre / Objet *">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="Ex: Gardiennage villa Cocody" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Entreprise">
            <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="input-field" />
          </Field>
          <Field label="Client existant">
            <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className="input-field">
              <option value="">— Nouveau —</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Contact">
            <input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} className="input-field" />
          </Field>
          <Field label="Téléphone">
            <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="input-field" />
          </Field>
          <Field label="Email">
            <input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="input-field" />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Type de service">
            <select value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} className="input-field">
              {LEAD_SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Source">
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input-field">
              {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Priorité">
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input-field">
              {LEAD_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Adresse du site">
            <input value={form.siteAddress} onChange={e => setForm(f => ({ ...f, siteAddress: e.target.value }))} className="input-field" />
          </Field>
          <Field label="Ville">
            <input value={form.siteCity} onChange={e => setForm(f => ({ ...f, siteCity: e.target.value }))} className="input-field" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Agents estimés">
            <input type="number" value={form.nbAgentsEstimated} onChange={e => setForm(f => ({ ...f, nbAgentsEstimated: e.target.value }))} className="input-field" />
          </Field>
          <Field label="Chiffre d'affaires estimé (XOF)">
            <input type="number" value={form.estimatedRevenue} onChange={e => setForm(f => ({ ...f, estimatedRevenue: e.target.value }))} className="input-field" />
          </Field>
        </div>
        <Field label="Notes">
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input-field resize-none" />
        </Field>
      </div>
      <ModalFooter saving={saving} onCancel={onClose} onSave={doCreate} saveLabel="Créer le prospect" />
    </Modal>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  CONVERT TO CLIENT MODAL                                    */
/* ════════════════════════════════════════════════════════════ */
const CLIENT_SEGMENTS = [
  { value: 'ENTREPRISE_PRIVEE', label: 'Entreprise privée' },
  { value: 'INSTITUTION_PUBLIQUE', label: 'Institution publique' },
  { value: 'ONG', label: 'ONG / Organisation internationale' },
  { value: 'PARTICULIER', label: 'Particulier' },
  { value: 'AMBASSADE', label: 'Ambassade / Consulat' },
  { value: 'AUTRE', label: 'Autre' },
] as const

function ConvertToClientModal({ lead, onClose, onConverted }: {
  lead: any; onClose: () => void; onConverted: (clientId: string) => void
}) {
  const [form, setForm] = useState({
    name: lead.companyName || lead.contactName || '',
    legalName: lead.companyName || '',
    segment: 'AUTRE',
    sector: '',
    taxId: '',
    rccm: '',
    ncc: '',
    phone: lead.contactPhone || '',
    mobile: '',
    email: lead.contactEmail || '',
    website: '',
    address: lead.siteAddress || '',
    city: lead.siteCity || '',
    district: '',
    notes: lead.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const doConvert = async () => {
    if (!form.name || !form.address || !form.city) {
      setError('Nom, adresse et ville sont obligatoires')
      return
    }
    setSaving(true)
    setError('')
    try {
      const client = await convertLeadToClient(lead.id, form)
      onConverted(client.id)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la conversion')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Convertir en client" onClose={onClose}>
      <div className="space-y-4 p-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
          <UserPlus size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Conversion du prospect {lead.reference}</p>
            <p className="text-xs text-green-600 mt-0.5">
              Les données du prospect sont pré-remplies. Complétez les informations manquantes.
            </p>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

        {/* Identité */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nom de l'entreprise *">
            <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" />
          </Field>
          <Field label="Raison sociale">
            <input value={form.legalName} onChange={e => set('legalName', e.target.value)} className="input-field" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Segment">
            <select value={form.segment} onChange={e => set('segment', e.target.value)} className="input-field">
              {CLIENT_SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Secteur d'activité">
            <input value={form.sector} onChange={e => set('sector', e.target.value)} className="input-field" placeholder="Ex: BTP, Banque..." />
          </Field>
          <Field label="N° Identification fiscale">
            <input value={form.taxId} onChange={e => set('taxId', e.target.value)} className="input-field" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="N° RCCM">
            <input value={form.rccm} onChange={e => set('rccm', e.target.value)} className="input-field" placeholder="Registre du Commerce" />
          </Field>
          <Field label="N° NCC">
            <input value={form.ncc} onChange={e => set('ncc', e.target.value)} className="input-field" placeholder="Numéro Compte Contribuable" />
          </Field>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Téléphone">
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" />
          </Field>
          <Field label="Mobile">
            <input value={form.mobile} onChange={e => set('mobile', e.target.value)} className="input-field" />
          </Field>
          <Field label="Email">
            <input value={form.email} onChange={e => set('email', e.target.value)} className="input-field" />
          </Field>
        </div>

        <Field label="Site web">
          <input value={form.website} onChange={e => set('website', e.target.value)} className="input-field" placeholder="https://..." />
        </Field>

        {/* Adresse */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Adresse *">
            <input value={form.address} onChange={e => set('address', e.target.value)} className="input-field" />
          </Field>
          <Field label="Ville *">
            <input value={form.city} onChange={e => set('city', e.target.value)} className="input-field" />
          </Field>
        </div>

        <Field label="Commune / Quartier">
          <input value={form.district} onChange={e => set('district', e.target.value)} className="input-field" />
        </Field>

        <Field label="Notes">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="input-field resize-none" />
        </Field>
      </div>
      <ModalFooter saving={saving} onCancel={onClose} onSave={doConvert} saveLabel="Convertir en client" />
    </Modal>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  UTILITY COMPONENTS                                         */
/* ════════════════════════════════════════════════════════════ */
function Badge({ label, color }: { label: string; color: string }) {
  const cls: Record<string, string> = {
    red: 'bg-red-100 text-red-700', amber: 'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700', green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700', indigo: 'bg-indigo-100 text-indigo-700',
    purple: 'bg-purple-100 text-purple-700', slate: 'bg-slate-100 text-slate-600',
    gray: 'bg-gray-100 text-gray-600',
  }
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cls[color] ?? cls.slate}`}>{label}</span>
}

function Btn({ label, onClick, cls, icon }: { label: string; onClick: () => void; cls: string; icon?: React.ReactNode }) {
  return <button onClick={onClick} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${cls}`}>{icon}{label}</button>
}

function Spinner() { return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div> }
function Empty({ text }: { text: string }) { return <div className="text-center py-12 text-slate-400 text-sm">{text}</div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>{children}</div>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function ModalFooter({ saving, onCancel, onSave, saveLabel }: { saving: boolean; onCancel: () => void; onSave: () => void; saveLabel: string }) {
  return (
    <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
      <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200 text-sm bg-white">Annuler</button>
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-sagard-yellow text-sagard-dark text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saveLabel}
      </button>
    </div>
  )
}
