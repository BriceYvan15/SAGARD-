import { useState, Fragment } from 'react'
import {
  UserPlus, KeyRound, Package, Loader2, Plus, X, Save, LogOut, LogIn,
  AlertTriangle, Clock,
} from 'lucide-react'
import { useApi } from '../lib/useApi'
import { getVisitors, createVisitor, checkOutVisitor, VISIT_PURPOSES, ID_DOC_TYPES } from '../services/visitors.service'
import { getKeys, createKey, issueKey, returnKey, KEY_TYPES, KEY_STATES } from '../services/keys.service'
import { getSiteEquipments, createSiteEquipment, assignEquipment, returnEquipment, EQUIPMENT_CATEGORIES, EQUIPMENT_STATES } from '../services/site-equipment.service'
import { getSites } from '../services/sites.service'
import Select from '../components/Select'

type Tab = 'visitors' | 'keys' | 'equipment'

const TABS: { key: Tab; label: string; icon: any; color: string }[] = [
  { key: 'visitors',  label: 'Registre visiteurs', icon: UserPlus, color: 'indigo' },
  { key: 'keys',      label: 'Clés & trousseaux',  icon: KeyRound, color: 'amber'  },
  { key: 'equipment', label: 'Matériel de site',    icon: Package,  color: 'teal'   },
]

export default function Registres() {
  const [tab, setTab] = useState<Tab>('visitors')

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.key
          const pastelMap: Record<string, string> = {
            indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            amber: 'bg-amber-50 text-amber-700 border-amber-200',
            teal: 'bg-teal-50 text-teal-700 border-teal-200',
          }
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${active ? `${pastelMap[t.color] ?? 'bg-slate-50 text-slate-700 border-slate-200'} shadow-sm` : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:shadow-sm'}`}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'visitors'  && <VisitorsPanel />}
      {tab === 'keys'      && <KeysPanel />}
      {tab === 'equipment' && <EquipmentPanel />}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  REGISTRE DES VISITEURS                                     */
/* ════════════════════════════════════════════════════════════ */
function VisitorsPanel() {
  const { data, loading, reload } = useApi(getVisitors)
  const { data: sitesRaw } = useApi(getSites)
  const visitors = (data as any[]) ?? []
  const sites = (sitesRaw as any[]) ?? []
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    siteId: '', visitorName: '', visitorCompany: '', visitorPhone: '',
    idType: 'CNI', idNumber: '', visitPurpose: 'REUNION', hostName: '',
    plateNumber: '', badgeNo: '', notes: '',
  })
  const [saving, setSaving] = useState(false)

  const doCreate = async () => {
    if (!form.siteId || !form.visitorName) return
    setSaving(true)
    try { await createVisitor(form); setShowCreate(false); reload() } finally { setSaving(false) }
  }

  const doCheckOut = async (id: string) => {
    await checkOutVisitor(id)
    reload()
  }

  const present = visitors.filter(v => !v.checkOut)
  const departed = visitors.filter(v => v.checkOut)

  return (
    <Fragment>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-3 items-center">
          <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
            {present.length} présent{present.length > 1 ? 's' : ''}
          </span>
          <span className="text-xs text-slate-400">{departed.length} sorti(e)s aujourd'hui</span>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700">
          <Plus size={12} /> Enregistrer visiteur
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {visitors.map(v => (
            <div key={v.id} className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all ${v.isBlacklisted ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-slate-400">{v.reference}</span>
                  {v.isBlacklisted && <Badge label="LISTE NOIRE" color="red" />}
                  <Badge label={VISIT_PURPOSES.find(p => p.value === v.visitPurpose)?.label ?? v.visitPurpose} color="indigo" />
                  {!v.checkOut ? <Badge label="Présent" color="green" /> : <Badge label="Sorti" color="slate" />}
                </div>
                <p className="text-sm font-semibold text-slate-800">{v.visitorName} {v.visitorCompany && <span className="font-normal text-slate-500">· {v.visitorCompany}</span>}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {v.site?.name} · Entrée {new Date(v.checkIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {v.checkOut && <span> · Sortie {new Date(v.checkOut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                  {v.hostName && <span> · Visite: {v.hostName}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!v.checkOut && (
                  <Btn label="Sortie" onClick={() => doCheckOut(v.id)} cls="bg-orange-100 text-orange-700" icon={<LogOut size={11} />} />
                )}
              </div>
            </div>
          ))}
          {visitors.length === 0 && <Empty text="Aucun visiteur enregistré" />}
        </div>
      )}

      {showCreate && (
        <Modal title="Enregistrer un visiteur" onClose={() => setShowCreate(false)}>
          <div className="space-y-3 p-5">
            <Field label="Site *">
              <Select value={form.siteId} onChange={v => setForm(f => ({ ...f, siteId: v }))}
                options={sites.map((s: any) => ({ value: s.id, label: s.name }))}
                placeholder="— Sélectionner —" className="w-full" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nom du visiteur *">
                <input value={form.visitorName} onChange={e => setForm(f => ({ ...f, visitorName: e.target.value }))} className="input-field" />
              </Field>
              <Field label="Société">
                <input value={form.visitorCompany} onChange={e => setForm(f => ({ ...f, visitorCompany: e.target.value }))} className="input-field" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Type pièce">
                <Select value={form.idType} onChange={v => setForm(f => ({ ...f, idType: v }))}
                  options={ID_DOC_TYPES.map(t => ({ value: t.value, label: t.label }))} className="w-full" />
              </Field>
              <Field label="N° pièce">
                <input value={form.idNumber} onChange={e => setForm(f => ({ ...f, idNumber: e.target.value }))} className="input-field" />
              </Field>
              <Field label="Téléphone">
                <input value={form.visitorPhone} onChange={e => setForm(f => ({ ...f, visitorPhone: e.target.value }))} className="input-field" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Motif">
                <Select value={form.visitPurpose} onChange={v => setForm(f => ({ ...f, visitPurpose: v }))}
                  options={VISIT_PURPOSES.map(p => ({ value: p.value, label: p.label }))} className="w-full" />
              </Field>
              <Field label="Personne visitée">
                <input value={form.hostName} onChange={e => setForm(f => ({ ...f, hostName: e.target.value }))} className="input-field" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Immatriculation">
                <input value={form.plateNumber} onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))} className="input-field" />
              </Field>
              <Field label="N° badge remis">
                <input value={form.badgeNo} onChange={e => setForm(f => ({ ...f, badgeNo: e.target.value }))} className="input-field" />
              </Field>
            </div>
            <Field label="Observations">
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input-field resize-none" />
            </Field>
          </div>
          <ModalFooter saving={saving} onCancel={() => setShowCreate(false)} onSave={doCreate} saveLabel="Enregistrer entrée" />
        </Modal>
      )}
    </Fragment>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  CLÉS & TROUSSEAUX                                          */
/* ════════════════════════════════════════════════════════════ */
function KeysPanel() {
  const { data, loading, reload } = useApi(getKeys)
  const { data: sitesRaw } = useApi(getSites)
  const keys = (data as any[]) ?? []
  const sites = (sitesRaw as any[]) ?? []
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', siteId: '', keyType: 'PORTE', notes: '' })
  const [saving, setSaving] = useState(false)

  const filtered = filter === 'all' ? keys : keys.filter(k => k.state === filter)

  const doCreate = async () => {
    if (!form.name || !form.code || !form.siteId) return
    setSaving(true)
    try { await createKey(form); setShowCreate(false); reload() } finally { setSaving(false) }
  }

  const doIssue = async (id: string) => {
    await issueKey(id, {})
    reload()
  }

  const doReturn = async (id: string) => {
    await returnKey(id)
    reload()
  }

  return (
    <Fragment>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {[{ v: 'all', l: 'Toutes' }, ...KEY_STATES.map(s => ({ v: s.value, l: s.label }))].map(o => (
            <button key={o.v} onClick={() => setFilter(o.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === o.v ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {o.l} {o.v !== 'all' && <span className="ml-1 font-bold">{keys.filter(k => k.state === o.v).length}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-700">
          <Plus size={12} /> Ajouter clé
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {filtered.map(k => {
            const st = KEY_STATES.find(s => s.value === k.state)
            const tp = KEY_TYPES.find(t => t.value === k.keyType)
            return (
              <div key={k.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{k.code}</span>
                    <Badge label={tp?.label ?? k.keyType} color="amber" />
                    <Badge label={st?.label ?? k.state} color={st?.color ?? 'gray'} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{k.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {k.site?.name}
                    {k.currentHolderId && <span className="ml-2">· Détenteur: {k.currentHolderId}</span>}
                    <span className="ml-2">· {k._count?.movements ?? 0} mouvement(s)</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {k.state === 'DISPONIBLE' && <Btn label="Sortir" onClick={() => doIssue(k.id)} cls="bg-amber-100 text-amber-700" icon={<LogOut size={11} />} />}
                  {k.state === 'SORTIE' && <Btn label="Retour" onClick={() => doReturn(k.id)} cls="bg-green-100 text-green-700" icon={<LogIn size={11} />} />}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <Empty text="Aucune clé" />}
        </div>
      )}

      {showCreate && (
        <Modal title="Ajouter une clé" onClose={() => setShowCreate(false)}>
          <div className="space-y-3 p-5">
            <Field label="Site *">
              <Select value={form.siteId} onChange={v => setForm(f => ({ ...f, siteId: v }))}
                options={sites.map((s: any) => ({ value: s.id, label: s.name }))}
                placeholder="— Sélectionner —" className="w-full" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Désignation *">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Ex: Clé portail principal" />
              </Field>
              <Field label="Code / N° *">
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="input-field" placeholder="Ex: CLE-001" />
              </Field>
            </div>
            <Field label="Type">
              <Select value={form.keyType} onChange={v => setForm(f => ({ ...f, keyType: v }))}
                options={KEY_TYPES.map(t => ({ value: t.value, label: t.label }))} className="w-full" />
            </Field>
            <Field label="Notes">
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input-field resize-none" />
            </Field>
          </div>
          <ModalFooter saving={saving} onCancel={() => setShowCreate(false)} onSave={doCreate} saveLabel="Ajouter" />
        </Modal>
      )}
    </Fragment>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  MATÉRIEL DE SITE                                           */
/* ════════════════════════════════════════════════════════════ */
function EquipmentPanel() {
  const { data, loading, reload } = useApi(getSiteEquipments)
  const { data: sitesRaw } = useApi(getSites)
  const equipments = (data as any[]) ?? []
  const sites = (sitesRaw as any[]) ?? []
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'TENUE', siteId: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const filtered = filter === 'all' ? equipments : equipments.filter(e => e.state === filter)

  const doCreate = async () => {
    if (!form.name) return
    setSaving(true)
    try { await createSiteEquipment(form); setShowCreate(false); reload() } finally { setSaving(false) }
  }

  const doAssign = async (id: string) => {
    await assignEquipment(id, {})
    reload()
  }

  const doReturn = async (id: string) => {
    await returnEquipment(id)
    reload()
  }

  return (
    <Fragment>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {[{ v: 'all', l: 'Tout' }, ...EQUIPMENT_STATES.map(s => ({ v: s.value, l: s.label }))].map(o => (
            <button key={o.v} onClick={() => setFilter(o.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === o.v ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {o.l} {o.v !== 'all' && <span className="ml-1 font-bold">{equipments.filter(e => e.state === o.v).length}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-700">
          <Plus size={12} /> Ajouter matériel
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {filtered.map(eq => {
            const st = EQUIPMENT_STATES.find(s => s.value === eq.state)
            const cat = EQUIPMENT_CATEGORIES.find(c => c.value === eq.category)
            return (
              <div key={eq.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{eq.code}</span>
                    <Badge label={cat?.label ?? eq.category} color="teal" />
                    <Badge label={st?.label ?? eq.state} color={st?.color ?? 'gray'} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{eq.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {eq.site?.name ?? 'Non affecté'}
                    {eq.employeeId && <span className="ml-2">· Agent: {eq.employeeId}</span>}
                    <span className="ml-2">· {eq._count?.movements ?? 0} mvt(s)</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {eq.state === 'EN_STOCK' && <Btn label="Attribuer" onClick={() => doAssign(eq.id)} cls="bg-blue-100 text-blue-700" />}
                  {eq.state === 'ATTRIBUE' && <Btn label="Retour" onClick={() => doReturn(eq.id)} cls="bg-green-100 text-green-700" icon={<LogIn size={11} />} />}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <Empty text="Aucun matériel" />}
        </div>
      )}

      {showCreate && (
        <Modal title="Ajouter du matériel" onClose={() => setShowCreate(false)}>
          <div className="space-y-3 p-5">
            <Field label="Désignation *">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Ex: Radio Motorola DP4400" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Catégorie">
                <Select value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))}
                  options={EQUIPMENT_CATEGORIES.map(c => ({ value: c.value, label: c.label }))} className="w-full" />
              </Field>
              <Field label="Site">
                <Select value={form.siteId} onChange={v => setForm(f => ({ ...f, siteId: v }))}
                  options={sites.map((s: any) => ({ value: s.id, label: s.name }))}
                  placeholder="— Aucun —" className="w-full" />
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input-field resize-none" />
            </Field>
          </div>
          <ModalFooter saving={saving} onCancel={() => setShowCreate(false)} onSave={doCreate} saveLabel="Ajouter" />
        </Modal>
      )}
    </Fragment>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  COMPOSANTS UTILITAIRES                                     */
/* ════════════════════════════════════════════════════════════ */
function Badge({ label, color }: { label: string; color: string }) {
  const cls: Record<string, string> = {
    red: 'bg-red-100 text-red-700', amber: 'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700', green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700', indigo: 'bg-indigo-100 text-indigo-700',
    teal: 'bg-teal-100 text-teal-700', slate: 'bg-slate-100 text-slate-600',
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
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
