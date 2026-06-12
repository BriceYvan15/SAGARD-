import { useState, Fragment } from 'react'
import {
  Bell, AlertTriangle, ShieldCheck, FileText, Loader2, Eye, Plus, X, Save,
  AlertCircle, CheckCircle2, Clock, MapPin, Search, Filter,
} from 'lucide-react'
import { useApi } from '../lib/useApi'
import { getAlerts, ALERT_TYPES, ALERT_SEVERITIES, ALERT_STATES, createAlert, acknowledgeAlert, resolveAlert, markFalseAlert, convertToIncident } from '../services/alerts.service'
import { getIncidents, INCIDENT_TYPES, INCIDENT_SEVERITIES, INCIDENT_STATES, createIncident, investigateIncident, resolveIncident, closeIncident } from '../services/incidents.service'
import { getControls, CONTROL_VISIT_TYPES, CONTROL_VISIT_STATES, createControl, markControlDone } from '../services/controls.service'
import { getDailyReports, REPORT_STATES, REPORT_SHIFTS, createDailyReport, submitReport, validateReport } from '../services/daily-reports.service'
import { getSites } from '../services/sites.service'

type Tab = 'alerts' | 'incidents' | 'controls' | 'reports'

const TABS: { key: Tab; label: string; icon: any; color: string }[] = [
  { key: 'alerts',    label: 'Alertes SOS',      icon: Bell,         color: 'red'   },
  { key: 'incidents', label: 'Incidents',         icon: AlertTriangle, color: 'amber' },
  { key: 'controls',  label: 'Visites contrôle', icon: ShieldCheck,  color: 'blue'  },
  { key: 'reports',   label: 'Rapports quotidiens', icon: FileText,  color: 'green' },
]

export default function Supervision() {
  const [tab, setTab] = useState<Tab>('alerts')

  return (
    <div className="space-y-5">
      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${active ? `bg-${t.color}-50 text-${t.color}-700 border border-${t.color}-200 shadow-sm` : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'alerts'    && <AlertsPanel />}
      {tab === 'incidents' && <IncidentsPanel />}
      {tab === 'controls'  && <ControlsPanel />}
      {tab === 'reports'   && <ReportsPanel />}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  ALERTES SOS                                                */
/* ════════════════════════════════════════════════════════════ */
function AlertsPanel() {
  const { data, loading, reload } = useApi(getAlerts)
  const { data: sitesRaw } = useApi(getSites)
  const alerts = (data as any[]) ?? []
  const sites  = (sitesRaw as any[]) ?? []
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ siteId: '', alertType: 'SOS', severity: 'WARNING', message: '' })
  const [saving, setSaving] = useState(false)

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.state === filter)

  const doCreate = async () => {
    if (!form.siteId) return
    setSaving(true)
    try { await createAlert(form); setShowCreate(false); reload() } finally { setSaving(false) }
  }

  const doAction = async (id: string, action: 'ack' | 'resolve' | 'false' | 'convert') => {
    if (action === 'ack')     await acknowledgeAlert(id)
    if (action === 'resolve') await resolveAlert(id)
    if (action === 'false')   await markFalseAlert(id)
    if (action === 'convert') await convertToIncident(id)
    reload()
  }

  return (
    <Fragment>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {[{ v: 'all', l: 'Toutes' }, ...ALERT_STATES.map(s => ({ v: s.value, l: s.label }))].map(o => (
            <button key={o.v} onClick={() => setFilter(o.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === o.v ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {o.l} {o.v !== 'all' && <span className="ml-1 font-bold">{alerts.filter(a => a.state === o.v).length}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700">
          <Bell size={12} /> Simuler alerte
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {filtered.map(a => {
            const sev = ALERT_SEVERITIES.find(s => s.value === a.severity)
            const st  = ALERT_STATES.find(s => s.value === a.state)
            const tp  = ALERT_TYPES.find(t => t.value === a.alertType)
            return (
              <div key={a.id} className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-4 ${a.state === 'NOUVELLE' ? 'border-red-300 bg-red-50/30 animate-pulse' : 'border-slate-200'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{a.reference}</span>
                    <Badge label={tp?.label ?? a.alertType} color={sev?.color ?? 'slate'} />
                    <Badge label={st?.label ?? a.state} color={st?.color ?? 'gray'} />
                  </div>
                  <p className="text-sm text-slate-700 truncate">{a.message || '—'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(a.createdAt).toLocaleString('fr-FR')}
                    {a.responseTimeMin > 0 && <span className="ml-2 text-amber-600">⏱ {a.responseTimeMin.toFixed(1)} min</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {a.state === 'NOUVELLE' && <Btn label="Prendre en compte" onClick={() => doAction(a.id, 'ack')} cls="bg-amber-100 text-amber-700" />}
                  {(a.state === 'PRISE_EN_COMPTE' || a.state === 'INTERVENTION') && <Btn label="Résoudre" onClick={() => doAction(a.id, 'resolve')} cls="bg-green-100 text-green-700" />}
                  {a.state !== 'RESOLUE' && a.state !== 'FAUSSE' && <Btn label="Fausse" onClick={() => doAction(a.id, 'false')} cls="bg-slate-100 text-slate-600" />}
                  {!a.incidentId && a.state !== 'FAUSSE' && <Btn label="→ Incident" onClick={() => doAction(a.id, 'convert')} cls="bg-red-100 text-red-700" />}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <Empty text="Aucune alerte" />}
        </div>
      )}

      {/* Modal créer alerte */}
      {showCreate && (
        <Modal title="Simuler une alerte" onClose={() => setShowCreate(false)}>
          <div className="space-y-3 p-5">
            <Field label="Site *">
              <select value={form.siteId} onChange={e => setForm(f => ({ ...f, siteId: e.target.value }))} className="input-field">
                <option value="">— Sélectionner —</option>
                {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select value={form.alertType} onChange={e => setForm(f => ({ ...f, alertType: e.target.value }))} className="input-field">
                  {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Sévérité">
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="input-field">
                  {ALERT_SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Message">
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} className="input-field resize-none" />
            </Field>
          </div>
          <ModalFooter saving={saving} onCancel={() => setShowCreate(false)} onSave={doCreate} saveLabel="Émettre alerte" />
        </Modal>
      )}
    </Fragment>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  INCIDENTS                                                  */
/* ════════════════════════════════════════════════════════════ */
function IncidentsPanel() {
  const { data, loading, reload } = useApi(getIncidents)
  const { data: sitesRaw } = useApi(getSites)
  const incidents = (data as any[]) ?? []
  const sites = (sitesRaw as any[]) ?? []
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', siteId: '', incidentType: 'INTRUSION', severity: 'MOYEN', description: '' })
  const [saving, setSaving] = useState(false)

  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.state === filter)

  const doCreate = async () => {
    if (!form.title || !form.siteId) return
    setSaving(true)
    try { await createIncident(form); setShowCreate(false); reload() } finally { setSaving(false) }
  }

  const doAction = async (id: string, action: 'investigate' | 'resolve' | 'close') => {
    if (action === 'investigate') await investigateIncident(id)
    if (action === 'resolve')     await resolveIncident(id)
    if (action === 'close')       await closeIncident(id)
    reload()
  }

  return (
    <Fragment>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {[{ v: 'all', l: 'Tous' }, ...INCIDENT_STATES.map(s => ({ v: s.value, l: s.label }))].map(o => (
            <button key={o.v} onClick={() => setFilter(o.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === o.v ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {o.l} {o.v !== 'all' && <span className="ml-1 font-bold">{incidents.filter(i => i.state === o.v).length}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-700">
          <Plus size={12} /> Déclarer incident
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {filtered.map(inc => {
            const sev = INCIDENT_SEVERITIES.find(s => s.value === inc.severity)
            const st  = INCIDENT_STATES.find(s => s.value === inc.state)
            const tp  = INCIDENT_TYPES.find(t => t.value === inc.incidentType)
            return (
              <div key={inc.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{inc.reference}</span>
                    <Badge label={tp?.label ?? inc.incidentType} color="slate" />
                    <Badge label={sev?.label ?? inc.severity} color={sev?.color ?? 'slate'} />
                    <Badge label={st?.label ?? inc.state} color={st?.color ?? 'gray'} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{inc.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{inc.site?.name} · {new Date(inc.incidentDatetime).toLocaleString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-1">
                  {inc.state === 'OUVERT' && <Btn label="Investiguer" onClick={() => doAction(inc.id, 'investigate')} cls="bg-amber-100 text-amber-700" />}
                  {inc.state === 'INVESTIGATION' && <Btn label="Résoudre" onClick={() => doAction(inc.id, 'resolve')} cls="bg-green-100 text-green-700" />}
                  {inc.state === 'RESOLU' && <Btn label="Clore" onClick={() => doAction(inc.id, 'close')} cls="bg-slate-100 text-slate-600" />}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <Empty text="Aucun incident" />}
        </div>
      )}

      {showCreate && (
        <Modal title="Déclarer un incident" onClose={() => setShowCreate(false)}>
          <div className="space-y-3 p-5">
            <Field label="Titre *">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="Ex: Tentative d'intrusion portail nord" />
            </Field>
            <Field label="Site *">
              <select value={form.siteId} onChange={e => setForm(f => ({ ...f, siteId: e.target.value }))} className="input-field">
                <option value="">— Sélectionner —</option>
                {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select value={form.incidentType} onChange={e => setForm(f => ({ ...f, incidentType: e.target.value }))} className="input-field">
                  {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Gravité">
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="input-field">
                  {INCIDENT_SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Description *">
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="input-field resize-none" placeholder="Description détaillée de l'incident..." />
            </Field>
          </div>
          <ModalFooter saving={saving} onCancel={() => setShowCreate(false)} onSave={doCreate} saveLabel="Déclarer" />
        </Modal>
      )}
    </Fragment>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  VISITES DE CONTRÔLE                                        */
/* ════════════════════════════════════════════════════════════ */
function ControlsPanel() {
  const { data, loading, reload } = useApi(getControls)
  const { data: sitesRaw } = useApi(getSites)
  const controls = (data as any[]) ?? []
  const sites = (sitesRaw as any[]) ?? []
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ siteId: '', visitType: 'ROUTINE', agentsExpected: '0', notes: '' })
  const [saving, setSaving] = useState(false)

  const filtered = filter === 'all' ? controls : controls.filter(c => c.state === filter)

  const doCreate = async () => {
    if (!form.siteId) return
    setSaving(true)
    try { await createControl({ ...form, controllerId: 'current' }); setShowCreate(false); reload() } finally { setSaving(false) }
  }

  return (
    <Fragment>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {[{ v: 'all', l: 'Toutes' }, ...CONTROL_VISIT_STATES.map(s => ({ v: s.value, l: s.label }))].map(o => (
            <button key={o.v} onClick={() => setFilter(o.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === o.v ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {o.l} {o.v !== 'all' && <span className="ml-1 font-bold">{controls.filter(c => c.state === o.v).length}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700">
          <Plus size={12} /> Nouvelle visite
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {filtered.map(c => {
            const tp = CONTROL_VISIT_TYPES.find(t => t.value === c.visitType)
            const st = CONTROL_VISIT_STATES.find(s => s.value === c.state)
            return (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{c.reference}</span>
                    <Badge label={tp?.label ?? c.visitType} color="blue" />
                    <Badge label={st?.label ?? c.state} color={st?.color ?? 'gray'} />
                    {c.rating && <span className="text-xs text-amber-500">{'★'.repeat(c.rating)}</span>}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{c.site?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(c.visitDatetime).toLocaleString('fr-FR')}
                    {c.durationMinutes != null && <span className="ml-2">· {c.durationMinutes} min</span>}
                    <span className="ml-2">· {c.agentsChecked}/{c.agentsExpected} agents</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckBadge label="Tenue" ok={c.uniformOk} />
                  <CheckBadge label="Équip." ok={c.equipmentOk} />
                  <CheckBadge label="Posture" ok={c.postureOk} />
                  <CheckBadge label="Registre" ok={c.registerOk} />
                  {c.state === 'BROUILLON' && (
                    <Btn label="Terminer" onClick={async () => { await markControlDone(c.id); reload() }} cls="bg-green-100 text-green-700" />
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <Empty text="Aucune visite" />}
        </div>
      )}

      {showCreate && (
        <Modal title="Nouvelle visite de contrôle" onClose={() => setShowCreate(false)}>
          <div className="space-y-3 p-5">
            <Field label="Site *">
              <select value={form.siteId} onChange={e => setForm(f => ({ ...f, siteId: e.target.value }))} className="input-field">
                <option value="">— Sélectionner —</option>
                {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select value={form.visitType} onChange={e => setForm(f => ({ ...f, visitType: e.target.value }))} className="input-field">
                  {CONTROL_VISIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Agents attendus">
                <input type="number" value={form.agentsExpected} onChange={e => setForm(f => ({ ...f, agentsExpected: e.target.value }))} className="input-field" />
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="input-field resize-none" />
            </Field>
          </div>
          <ModalFooter saving={saving} onCancel={() => setShowCreate(false)} onSave={doCreate} saveLabel="Démarrer visite" />
        </Modal>
      )}
    </Fragment>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  RAPPORTS QUOTIDIENS                                        */
/* ════════════════════════════════════════════════════════════ */
function ReportsPanel() {
  const { data, loading, reload } = useApi(getDailyReports)
  const { data: sitesRaw } = useApi(getSites)
  const reports = (data as any[]) ?? []
  const sites = (sitesRaw as any[]) ?? []
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ siteId: '', shift: 'JOUR', summary: '' })
  const [saving, setSaving] = useState(false)

  const filtered = filter === 'all' ? reports : reports.filter(r => r.state === filter)

  const doCreate = async () => {
    if (!form.siteId) return
    setSaving(true)
    try { await createDailyReport(form); setShowCreate(false); reload() } finally { setSaving(false) }
  }

  const doAction = async (id: string, action: 'submit' | 'validate') => {
    if (action === 'submit')   await submitReport(id)
    if (action === 'validate') await validateReport(id)
    reload()
  }

  return (
    <Fragment>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {[{ v: 'all', l: 'Tous' }, ...REPORT_STATES.map(s => ({ v: s.value, l: s.label }))].map(o => (
            <button key={o.v} onClick={() => setFilter(o.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === o.v ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {o.l} {o.v !== 'all' && <span className="ml-1 font-bold">{reports.filter(r => r.state === o.v).length}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700">
          <Plus size={12} /> Nouveau rapport
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {filtered.map(r => {
            const st = REPORT_STATES.find(s => s.value === r.state)
            const sh = REPORT_SHIFTS.find(s => s.value === r.shift)
            return (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{r.reference}</span>
                    <Badge label={sh?.label ?? r.shift} color="blue" />
                    <Badge label={st?.label ?? r.state} color={st?.color ?? 'gray'} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{r.site?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(r.date).toLocaleDateString('fr-FR')}
                    <span className="ml-2">· {r._count?.agents ?? r.agentCount ?? 0}/{r.agentsExpected} agents</span>
                    {r._count?.incidents > 0 && <span className="ml-2 text-red-500">· {r._count.incidents} incidents</span>}
                  </p>
                  {r.summary && <p className="text-xs text-slate-500 mt-1 truncate">{r.summary}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {r.state === 'BROUILLON' && <Btn label="Soumettre" onClick={() => doAction(r.id, 'submit')} cls="bg-blue-100 text-blue-700" />}
                  {r.state === 'SOUMIS' && <Btn label="Valider" onClick={() => doAction(r.id, 'validate')} cls="bg-green-100 text-green-700" />}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <Empty text="Aucun rapport" />}
        </div>
      )}

      {showCreate && (
        <Modal title="Nouveau rapport quotidien" onClose={() => setShowCreate(false)}>
          <div className="space-y-3 p-5">
            <Field label="Site *">
              <select value={form.siteId} onChange={e => setForm(f => ({ ...f, siteId: e.target.value }))} className="input-field">
                <option value="">— Sélectionner —</option>
                {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Vacation">
              <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))} className="input-field">
                {REPORT_SHIFTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Résumé">
              <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Faits marquants de la vacation..." />
            </Field>
          </div>
          <ModalFooter saving={saving} onCancel={() => setShowCreate(false)} onSave={doCreate} saveLabel="Créer rapport" />
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
    red:    'bg-red-100 text-red-700',
    amber:  'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700',
    green:  'bg-green-100 text-green-700',
    blue:   'bg-blue-100 text-blue-700',
    slate:  'bg-slate-100 text-slate-600',
    gray:   'bg-gray-100 text-gray-600',
  }
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cls[color] ?? cls.slate}`}>{label}</span>
}

function CheckBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ok ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'}`}>
      {ok ? '✓' : '✗'} {label}
    </span>
  )
}

function Btn({ label, onClick, cls }: { label: string; onClick: () => void; cls: string }) {
  return <button onClick={onClick} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${cls}`}>{label}</button>
}

function Spinner() { return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div> }

function Empty({ text }: { text: string }) {
  return <div className="text-center py-12 text-slate-400 text-sm">{text}</div>
}

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
