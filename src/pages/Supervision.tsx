import { useState, Fragment, useEffect } from 'react'
import {
  Bell, AlertTriangle, ShieldCheck, FileText, Loader2, Plus, X, Save,
  AlertCircle, CheckCircle2, Clock, LayoutDashboard,
  ArrowRight, ChevronRight, User, Calendar,
  Building2, MessageSquare, Star, Image as ImageIcon, Zap,
} from 'lucide-react'
import { useApi } from '../lib/useApi'
import { getAlerts, getAlert, ALERT_TYPES, ALERT_SEVERITIES, ALERT_STATES, createAlert, acknowledgeAlert, resolveAlert, markFalseAlert, convertToIncident } from '../services/alerts.service'
import { getIncidents, getIncident, INCIDENT_TYPES, INCIDENT_SEVERITIES, INCIDENT_STATES, createIncident, investigateIncident, resolveIncident, closeIncident, submitOpsReport, validateOpsReport, rejectOpsReport, OPS_REPORT_STATES } from '../services/incidents.service'
import { getControls, getControl, CONTROL_VISIT_TYPES, CONTROL_VISIT_STATES, createControl, markControlDone, markControlReported, cancelControl } from '../services/controls.service'
import { getDailyReports, getDailyReport, REPORT_STATES, REPORT_SHIFTS, createDailyReport, submitReport, validateReport, rejectReport, resetReport } from '../services/daily-reports.service'
import { getSites } from '../services/sites.service'
import { getUser } from '../lib/auth'
import Select from '../components/Select'

type Tab = 'dashboard' | 'alerts' | 'incidents' | 'controls' | 'reports'

const TABS: { key: Tab; label: string; icon: any; color: string }[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, color: 'slate' },
  { key: 'alerts',    label: 'Alertes SOS',      icon: Bell,         color: 'red'   },
  { key: 'incidents', label: 'Incidents',         icon: AlertTriangle, color: 'amber' },
  { key: 'controls',  label: 'Visites contrôle', icon: ShieldCheck,  color: 'blue'  },
  { key: 'reports',   label: 'Rapports quotidiens', icon: FileText,  color: 'green' },
]

export default function Supervision() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="space-y-5">
      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.key
          const pastelMap: Record<string, string> = {
            slate: 'bg-slate-800 text-white border-slate-800',
            red: 'bg-red-50 text-red-700 border-red-200',
            amber: 'bg-amber-50 text-amber-700 border-amber-200',
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            green: 'bg-green-50 text-green-700 border-green-200',
          }
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${active ? `${pastelMap[t.color] ?? 'bg-slate-50 text-slate-700 border-slate-200'} shadow-sm` : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:shadow-sm'}`}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'dashboard' && <DashboardPanel onNavigate={setTab} />}
      {tab === 'alerts'    && <AlertsPanel />}
      {tab === 'incidents' && <IncidentsPanel />}
      {tab === 'controls'  && <ControlsPanel />}
      {tab === 'reports'   && <ReportsPanel />}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════ */
/*  DASHBOARD OVERVIEW                                         */
/* ════════════════════════════════════════════════════════════ */
function DashboardPanel({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { data: alertsData,    loading: alL } = useApi(getAlerts)
  const { data: incidentsData, loading: inL } = useApi(getIncidents)
  const { data: controlsData,  loading: coL } = useApi(getControls)
  const { data: reportsData,   loading: reL } = useApi(getDailyReports)

  const alerts    = (alertsData as any[])    ?? []
  const incidents = (incidentsData as any[]) ?? []
  const controls  = (controlsData as any[])  ?? []
  const reports   = (reportsData as any[])   ?? []

  const newAlerts    = alerts.filter(a => a.state === 'NOUVELLE').length
  const openIncidents = incidents.filter(i => i.state === 'OUVERT' || i.state === 'INVESTIGATION').length
  const pendingControls = controls.filter(c => c.state === 'BROUILLON').length
  const submittedReports = reports.filter(r => r.state === 'SOUMIS').length
  const validatedReports = reports.filter(r => r.state === 'VALIDE').length

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-5">
      {/* Day banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sagard-yellow text-xs font-bold uppercase tracking-widest">Supervision</p>
          <p className="text-white text-lg font-bold capitalize mt-0.5">{today}</p>
        </div>
        <div className="flex gap-4 sm:gap-6 text-center flex-wrap">
          <div><p className="text-2xl font-black text-red-400">{newAlerts}</p><p className="text-slate-400 text-xs">Alertes</p></div>
          <div><p className="text-2xl font-black text-amber-400">{openIncidents}</p><p className="text-slate-400 text-xs">Incidents</p></div>
          <div><p className="text-2xl font-black text-blue-400">{pendingControls}</p><p className="text-slate-400 text-xs">Visites</p></div>
          <div><p className="text-2xl font-black text-green-400">{submittedReports}</p><p className="text-slate-400 text-xs">Rapports</p></div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Bell} label="Alertes SOS" color="red"
          total={alerts.length} active={newAlerts} activeLabel="nouvelles"
          loading={alL} onClick={() => onNavigate('alerts')}
        />
        <KpiCard
          icon={AlertTriangle} label="Incidents" color="amber"
          total={incidents.length} active={openIncidents} activeLabel="ouverts"
          loading={inL} onClick={() => onNavigate('incidents')}
        />
        <KpiCard
          icon={ShieldCheck} label="Visites contrôle" color="blue"
          total={controls.length} active={pendingControls} activeLabel="en cours"
          loading={coL} onClick={() => onNavigate('controls')}
        />
        <KpiCard
          icon={FileText} label="Rapports" color="green"
          total={reports.length} active={submittedReports} activeLabel="à valider"
          loading={reL} onClick={() => onNavigate('reports')}
        />
      </div>

      {/* Recent items grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-red-500" />
              <p className="text-sm font-bold text-slate-700">Dernières alertes</p>
            </div>
            <button onClick={() => onNavigate('alerts')} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {alL ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" size={20} /></div> :
             alerts.slice(0, 4).map(a => {
               const st = ALERT_STATES.find(s => s.value === a.state)
               const sev = ALERT_SEVERITIES.find(s => s.value === a.severity)
               return (
                 <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                   <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.state === 'NOUVELLE' ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-slate-800 truncate">{a.message || a.alertType}</p>
                     <p className="text-xs text-slate-400">{a.site?.name ?? '—'} · {new Date(a.createdAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</p>
                   </div>
                   <Badge label={st?.label ?? a.state} color={st?.color ?? 'gray'} />
                 </div>
               )
             })}
            {!alL && alerts.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">Aucune alerte</div>}
          </div>
        </div>

        {/* Recent incidents */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <p className="text-sm font-bold text-slate-700">Derniers incidents</p>
            </div>
            <button onClick={() => onNavigate('incidents')} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {inL ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" size={20} /></div> :
             incidents.slice(0, 4).map(inc => {
               const st = INCIDENT_STATES.find(s => s.value === inc.state)
               const sev = INCIDENT_SEVERITIES.find(s => s.value === inc.severity)
               return (
                 <div key={inc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                   <div className={`w-2 h-2 rounded-full flex-shrink-0 ${inc.state === 'OUVERT' ? 'bg-red-500' : inc.state === 'INVESTIGATION' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-slate-800 truncate">{inc.title}</p>
                     <p className="text-xs text-slate-400">{inc.site?.name ?? '—'} · {new Date(inc.incidentDatetime ?? inc.createdAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</p>
                   </div>
                   <Badge label={sev?.label ?? inc.severity} color={sev?.color ?? 'slate'} />
                 </div>
               )
             })}
            {!inL && incidents.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">Aucun incident</div>}
          </div>
        </div>

        {/* Recent controls */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-500" />
              <p className="text-sm font-bold text-slate-700">Dernières visites</p>
            </div>
            <button onClick={() => onNavigate('controls')} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {coL ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" size={20} /></div> :
             controls.slice(0, 4).map(c => {
               const st = CONTROL_VISIT_STATES.find(s => s.value === c.state)
               const tp = CONTROL_VISIT_TYPES.find(t => t.value === c.visitType)
               return (
                 <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                   <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.state === 'BROUILLON' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-slate-800 truncate">{c.site?.name ?? '—'}</p>
                     <p className="text-xs text-slate-400">{tp?.label ?? c.visitType} · {new Date(c.visitDatetime).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</p>
                   </div>
                   <Badge label={st?.label ?? c.state} color={st?.color ?? 'gray'} />
                 </div>
               )
             })}
            {!coL && controls.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">Aucune visite</div>}
          </div>
        </div>

        {/* Recent reports */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-green-500" />
              <p className="text-sm font-bold text-slate-700">Derniers rapports</p>
            </div>
            <button onClick={() => onNavigate('reports')} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {reL ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" size={20} /></div> :
             reports.slice(0, 4).map(r => {
               const st = REPORT_STATES.find(s => s.value === r.state)
               const sh = REPORT_SHIFTS.find(s => s.value === r.shift)
               return (
                 <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                   <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.state === 'SOUMIS' ? 'bg-blue-500' : r.state === 'VALIDE' ? 'bg-green-500' : 'bg-slate-300'}`} />
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-slate-800 truncate">{r.site?.name ?? '—'}</p>
                     <p className="text-xs text-slate-400">{sh?.label ?? r.shift} · {new Date(r.date).toLocaleDateString('fr-FR')} · {r._count?.agents ?? r.agentCount ?? 0}/{r.agentsExpected} agents</p>
                   </div>
                   <Badge label={st?.label ?? r.state} color={st?.color ?? 'gray'} />
                 </div>
               )
             })}
            {!reL && reports.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">Aucun rapport</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, color, total, active, activeLabel, loading, onClick }: {
  icon: any; label: string; color: string; total: number; active: number; activeLabel: string; loading: boolean; onClick: () => void
}) {
  const colorMap: Record<string, { bg: string; text: string; ring: string; activeBg: string }> = {
    red:   { bg: 'bg-red-50',   text: 'text-red-600',   ring: 'ring-red-200',   activeBg: 'bg-red-500'   },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200', activeBg: 'bg-amber-500' },
    blue:  { bg: 'bg-blue-50',  text: 'text-blue-600',  ring: 'ring-blue-200',  activeBg: 'bg-blue-500'  },
    green: { bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-200', activeBg: 'bg-green-500' },
  }
  const c = colorMap[color] ?? colorMap.blue
  return (
    <button onClick={onClick} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left hover:shadow-md transition-all ${active > 0 ? `ring-2 ${c.ring}` : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon size={20} className={c.text} />
        </div>
        {active > 0 && (
          <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${c.activeBg} animate-pulse`}>
            {active} {activeLabel}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      {loading ? (
        <Loader2 size={18} className="animate-spin text-slate-300 mt-1" />
      ) : (
        <p className="text-2xl font-black text-slate-800 mt-0.5">{total}</p>
      )}
    </button>
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({ siteId: '', alertType: 'SOS', severity: 'WARNING', message: '' })
  const [saving, setSaving] = useState(false)

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.state === filter)

  const doCreate = async () => {
    if (!form.siteId) return
    setSaving(true)
    try { await createAlert(form); setShowCreate(false); reload() } finally { setSaving(false) }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(a => {
            const sev = ALERT_SEVERITIES.find(s => s.value === a.severity)
            const st  = ALERT_STATES.find(s => s.value === a.state)
            const tp  = ALERT_TYPES.find(t => t.value === a.alertType)
            const isNew = a.state === 'NOUVELLE'
            return (
              <button key={a.id} onClick={() => setSelectedId(a.id)}
                className={`text-left bg-white border rounded-xl p-4 hover:shadow-lg transition-all ${isNew ? 'border-red-300 bg-red-50/30 ring-2 ring-red-200' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge label={tp?.label ?? a.alertType} color={sev?.color ?? 'slate'} />
                    <Badge label={st?.label ?? a.state} color={st?.color ?? 'gray'} />
                  </div>
                  {isNew && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
                </div>
                <p className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">{a.message || 'Aucun message'}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Building2 size={11} /> <span className="truncate">{a.site?.name ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <Clock size={11} /> {new Date(a.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {a.responseTimeMin > 0 && <span className="ml-1 text-amber-600">⏱ {a.responseTimeMin.toFixed(1)} min</span>}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                  <span className="font-mono">{a.reference}</span>
                  <ChevronRight size={12} className="ml-auto" />
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && <div className="col-span-full"><Empty text="Aucune alerte" /></div>}
        </div>
      )}

      {selectedId && (
        <DetailDrawer id={selectedId} onClose={() => setSelectedId(null)} onReload={reload} type="alert" />
      )}

      {showCreate && (
        <Modal title="Simuler une alerte" onClose={() => setShowCreate(false)}>
          <div className="space-y-3 p-5">
            <Field label="Site *">
              <Select value={form.siteId} onChange={v => setForm(f => ({ ...f, siteId: v }))}
                options={sites.map((s: any) => ({ value: s.id, label: s.name }))}
                placeholder="— Sélectionner —" className="w-full" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={form.alertType} onChange={v => setForm(f => ({ ...f, alertType: v }))}
                  options={ALERT_TYPES.map(t => ({ value: t.value, label: t.label }))} className="w-full" />
              </Field>
              <Field label="Sévérité">
                <Select value={form.severity} onChange={v => setForm(f => ({ ...f, severity: v }))}
                  options={ALERT_SEVERITIES.map(s => ({ value: s.value, label: s.label }))} className="w-full" />
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', siteId: '', incidentType: 'INTRUSION', severity: 'MOYEN', description: '' })
  const [saving, setSaving] = useState(false)

  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.state === filter)

  const doCreate = async () => {
    if (!form.title || !form.siteId) return
    setSaving(true)
    try { await createIncident(form); setShowCreate(false); reload() } finally { setSaving(false) }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(inc => {
            const sev = INCIDENT_SEVERITIES.find(s => s.value === inc.severity)
            const st  = INCIDENT_STATES.find(s => s.value === inc.state)
            const tp  = INCIDENT_TYPES.find(t => t.value === inc.incidentType)
            const isOpen = inc.state === 'OUVERT'
            return (
              <button key={inc.id} onClick={() => setSelectedId(inc.id)}
                className={`text-left bg-white border rounded-xl p-4 hover:shadow-lg transition-all ${isOpen ? 'border-amber-300 ring-2 ring-amber-200' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge label={tp?.label ?? inc.incidentType} color="slate" />
                    <Badge label={sev?.label ?? inc.severity} color={sev?.color ?? 'slate'} />
                  </div>
                  <Badge label={st?.label ?? inc.state} color={st?.color ?? 'gray'} />
                </div>
                <p className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">{inc.title}</p>
                {inc.description && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{inc.description}</p>}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Building2 size={11} /> <span className="truncate">{inc.site?.name ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <Clock size={11} /> {new Date(inc.incidentDatetime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                  <span className="font-mono">{inc.reference}</span>
                  <ChevronRight size={12} className="ml-auto" />
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && <div className="col-span-full"><Empty text="Aucun incident" /></div>}
        </div>
      )}

      {selectedId && (
        <DetailDrawer id={selectedId} onClose={() => setSelectedId(null)} onReload={reload} type="incident" />
      )}

      {showCreate && (
        <Modal title="Déclarer un incident" onClose={() => setShowCreate(false)}>
          <div className="space-y-3 p-5">
            <Field label="Titre *">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="Ex: Tentative d'intrusion portail nord" />
            </Field>
            <Field label="Site *">
              <Select value={form.siteId} onChange={v => setForm(f => ({ ...f, siteId: v }))}
                options={sites.map((s: any) => ({ value: s.id, label: s.name }))}
                placeholder="— Sélectionner —" className="w-full" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={form.incidentType} onChange={v => setForm(f => ({ ...f, incidentType: v }))}
                  options={INCIDENT_TYPES.map(t => ({ value: t.value, label: t.label }))} className="w-full" />
              </Field>
              <Field label="Gravité">
                <Select value={form.severity} onChange={v => setForm(f => ({ ...f, severity: v }))}
                  options={INCIDENT_SEVERITIES.map(s => ({ value: s.value, label: s.label }))} className="w-full" />
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => {
            const tp = CONTROL_VISIT_TYPES.find(t => t.value === c.visitType)
            const st = CONTROL_VISIT_STATES.find(s => s.value === c.state)
            const checks = [c.uniformOk, c.equipmentOk, c.postureOk, c.registerOk].filter(Boolean).length
            return (
              <button key={c.id} onClick={() => setSelectedId(c.id)}
                className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge label={tp?.label ?? c.visitType} color="blue" />
                    <Badge label={st?.label ?? c.state} color={st?.color ?? 'gray'} />
                  </div>
                  {c.rating > 0 && <span className="text-xs text-amber-500 flex-shrink-0">{'★'.repeat(c.rating)}</span>}
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{c.site?.name ?? '—'}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock size={11} /> {new Date(c.visitDatetime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {c.durationMinutes != null && <span className="ml-1">· {c.durationMinutes} min</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <User size={11} /> {c.agentsChecked ?? 0}/{c.agentsExpected ?? 0} agents
                  <span className="ml-auto text-slate-500 font-medium">{checks}/4 contrôles OK</span>
                </div>
                {c.notes && <p className="text-xs text-slate-500 line-clamp-2 mt-2">{c.notes}</p>}
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                  <span className="font-mono">{c.reference}</span>
                  <ChevronRight size={12} className="ml-auto" />
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && <div className="col-span-full"><Empty text="Aucune visite" /></div>}
        </div>
      )}

      {selectedId && (
        <DetailDrawer id={selectedId} onClose={() => setSelectedId(null)} onReload={reload} type="control" />
      )}

      {showCreate && (
        <Modal title="Nouvelle visite de contrôle" onClose={() => setShowCreate(false)}>
          <div className="space-y-3 p-5">
            <Field label="Site *">
              <Select value={form.siteId} onChange={v => setForm(f => ({ ...f, siteId: v }))}
                options={sites.map((s: any) => ({ value: s.id, label: s.name }))}
                placeholder="— Sélectionner —" className="w-full" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={form.visitType} onChange={v => setForm(f => ({ ...f, visitType: v }))}
                  options={CONTROL_VISIT_TYPES.map(t => ({ value: t.value, label: t.label }))} className="w-full" />
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({ siteId: '', shift: 'JOUR', summary: '' })
  const [saving, setSaving] = useState(false)

  const filtered = filter === 'all' ? reports : reports.filter(r => r.state === filter)

  const doCreate = async () => {
    if (!form.siteId) return
    setSaving(true)
    try { await createDailyReport(form); setShowCreate(false); reload() } finally { setSaving(false) }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(r => {
            const st = REPORT_STATES.find(s => s.value === r.state)
            const sh = REPORT_SHIFTS.find(s => s.value === r.shift)
            const agentCount = r._count?.agents ?? r.agentCount ?? 0
            const incCount = r._count?.incidents ?? 0
            return (
              <button key={r.id} onClick={() => setSelectedId(r.id)}
                className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge label={sh?.label ?? r.shift} color="blue" />
                    <Badge label={st?.label ?? r.state} color={st?.color ?? 'gray'} />
                  </div>
                  {incCount > 0 && <Badge label={`${incCount} incident${incCount > 1 ? 's' : ''}`} color="red" />}
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{r.site?.name ?? '—'}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar size={11} /> {new Date(r.date).toLocaleDateString('fr-FR')}
                  <span className="ml-1">· {agentCount}/{r.agentsExpected ?? 0} agents</span>
                </div>
                {r.summary && <p className="text-xs text-slate-500 line-clamp-2 mt-2">{r.summary}</p>}
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                  <span className="font-mono">{r.reference}</span>
                  <ChevronRight size={12} className="ml-auto" />
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && <div className="col-span-full"><Empty text="Aucun rapport" /></div>}
        </div>
      )}

      {selectedId && (
        <DetailDrawer id={selectedId} onClose={() => setSelectedId(null)} onReload={reload} type="report" />
      )}

      {showCreate && (
        <Modal title="Nouveau rapport quotidien" onClose={() => setShowCreate(false)}>
          <div className="space-y-3 p-5">
            <Field label="Site *">
              <Select value={form.siteId} onChange={v => setForm(f => ({ ...f, siteId: v }))}
                options={sites.map((s: any) => ({ value: s.id, label: s.name }))}
                placeholder="— Sélectionner —" className="w-full" />
            </Field>
            <Field label="Vacation">
              <Select value={form.shift} onChange={v => setForm(f => ({ ...f, shift: v }))}
                options={REPORT_SHIFTS.map(s => ({ value: s.value, label: s.label }))} className="w-full" />
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
/*  DRAWER DE DÉTAILS                                          */
/* ════════════════════════════════════════════════════════════ */
function DetailDrawer({ id, onClose, onReload, type }: { id: string; onClose: () => void; onReload: () => void; type: 'alert' | 'incident' | 'control' | 'report' }) {
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [opsReportText, setOpsReportText] = useState('')
  const [showOpsEditor, setShowOpsEditor] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectBox, setShowRejectBox] = useState(false)

  const currentUser = getUser()
  const isChefOps = currentUser?.role === 'CHEF_OPERATIONS'
  const isDG = currentUser?.role === 'DIRECTEUR_GENERAL'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const fetcher = type === 'alert' ? getAlert : type === 'incident' ? getIncident : type === 'control' ? getControl : getDailyReport
    fetcher(id).then(d => { if (!cancelled) { setItem(d); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, type])

  const doAction = async (action: string) => {
    setActing(true)
    try {
      if (type === 'alert') {
        if (action === 'ack')     await acknowledgeAlert(id)
        if (action === 'resolve') await resolveAlert(id)
        if (action === 'false')   await markFalseAlert(id)
        if (action === 'convert') await convertToIncident(id)
      } else if (type === 'incident') {
        if (action === 'investigate') await investigateIncident(id)
        if (action === 'resolve')     await resolveIncident(id)
        if (action === 'close')       await closeIncident(id)
      } else if (type === 'control') {
        if (action === 'done')     await markControlDone(id)
        if (action === 'reported') await markControlReported(id)
        if (action === 'cancel')   await cancelControl(id)
      } else if (type === 'report') {
        if (action === 'submit')   await submitReport(id)
        if (action === 'validate') await validateReport(id)
        if (action === 'reject')   await rejectReport(id)
        if (action === 'reset')    await resetReport(id)
      }
      const fetcher = type === 'alert' ? getAlert : type === 'incident' ? getIncident : type === 'control' ? getControl : getDailyReport
      const fresh = await fetcher(id)
      setItem(fresh)
      onReload()
    } finally { setActing(false) }
  }

  const doOpsAction = async (action: 'submit' | 'validate' | 'reject') => {
    setActing(true)
    try {
      if (action === 'submit') {
        await submitOpsReport(id, opsReportText)
        setShowOpsEditor(false)
        setOpsReportText('')
      } else if (action === 'validate') {
        await validateOpsReport(id)
      } else if (action === 'reject') {
        await rejectOpsReport(id, rejectReason || undefined)
        setShowRejectBox(false)
        setRejectReason('')
      }
      const fresh = await getIncident(id)
      setItem(fresh)
      onReload()
    } finally { setActing(false) }
  }

  const titleMap = { alert: 'Détail de l\'alerte', incident: 'Détail de l\'incident', control: 'Détail de la visite', report: 'Détail du rapport' }
  const accentMap = { alert: 'bg-red-500', incident: 'bg-amber-500', control: 'bg-blue-500', report: 'bg-green-500' }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 ${accentMap[type]} text-white`}>
          <h3 className="text-base font-bold flex items-center gap-2">
            {type === 'alert' && <Bell size={18} />}
            {type === 'incident' && <AlertTriangle size={18} />}
            {type === 'control' && <ShieldCheck size={18} />}
            {type === 'report' && <FileText size={18} />}
            {titleMap[type]}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/20"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? <Spinner /> : !item ? <Empty text="Élément introuvable" /> : (
            <>
              {/* Reference + State */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400">{item.reference}</span>
                {type === 'alert' && <Badge label={ALERT_STATES.find(s => s.value === item.state)?.label ?? item.state} color={ALERT_STATES.find(s => s.value === item.state)?.color ?? 'gray'} />}
                {type === 'incident' && <Badge label={INCIDENT_STATES.find(s => s.value === item.state)?.label ?? item.state} color={INCIDENT_STATES.find(s => s.value === item.state)?.color ?? 'gray'} />}
                {type === 'control' && <Badge label={CONTROL_VISIT_STATES.find(s => s.value === item.state)?.label ?? item.state} color={CONTROL_VISIT_STATES.find(s => s.value === item.state)?.color ?? 'gray'} />}
                {type === 'report' && <Badge label={REPORT_STATES.find(s => s.value === item.state)?.label ?? item.state} color={REPORT_STATES.find(s => s.value === item.state)?.color ?? 'gray'} />}
              </div>

              {/* Site */}
              <DetailRow icon={<Building2 size={14} />} label="Site" value={item.site?.name ?? '—'} />

              {/* Type-specific fields */}
              {type === 'alert' && <AlertDetails item={item} />}
              {type === 'incident' && <IncidentDetails item={item} />}
              {type === 'control' && <ControlDetails item={item} />}
              {type === 'report' && <ReportDetails item={item} />}

              {/* Agent/Controller/Reporter info */}
              {(item.agent || item.controller || item.reporter || item.submitter || item.createdBy) && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><User size={12} /> Personnes</p>
                  {item.agent && <DetailRow icon={<User size={12} />} label="Agent" value={`${item.agent.user?.firstName ?? ''} ${item.agent.user?.lastName ?? ''}`.trim() || item.agent.matricule || '—'} />}
                  {item.controller && <DetailRow icon={<ShieldCheck size={12} />} label="Contrôleur" value={`${item.controller.firstName ?? ''} ${item.controller.lastName ?? ''}`.trim() || '—'} />}
                  {item.reporter && <DetailRow icon={<User size={12} />} label="Signalé par" value={`${item.reporter.firstName ?? ''} ${item.reporter.lastName ?? ''}`.trim() || '—'} />}
                  {item.submitter && <DetailRow icon={<User size={12} />} label="Soumis par" value={`${item.submitter.firstName ?? ''} ${item.submitter.lastName ?? ''}`.trim() || '—'} />}
                  {item.createdBy && <DetailRow icon={<User size={12} />} label="Créé par" value={`${item.createdBy.firstName ?? ''} ${item.createdBy.lastName ?? ''}`.trim() || '—'} />}
                </div>
              )}

              {/* Agents list (incidents & reports) */}
              {item.agents && item.agents.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><User size={12} /> Agents ({item.agents.length})</p>
                  {item.agents.map((ag: any) => (
                    <div key={ag.id} className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      {ag.agent?.user ? `${ag.agent.user.firstName} ${ag.agent.user.lastName}` : ag.agent?.matricule ?? 'Agent'}
                      {ag.role && <span className="text-slate-400">· {ag.role}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Photos */}
              {(() => {
                let urls: string[] = []
                if (Array.isArray(item.attachmentUrls) && item.attachmentUrls.length > 0) {
                  urls = item.attachmentUrls
                } else if (Array.isArray(item.photos) && item.photos.length > 0) {
                  urls = item.photos.map((p: any) => p.url ?? p).filter(Boolean)
                } else if (item.photoUrl) {
                  urls = [item.photoUrl]
                }
                if (urls.length === 0) return null
                const baseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/api\/v1$/, '')
                const origin = baseUrl || window.location.origin
                const fullUrl = (u: string) => u.startsWith('http') ? u : `${origin}${u}`
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><ImageIcon size={12} /> Photos ({urls.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {urls.map((u: string, i: number) => (
                        <a key={i} href={fullUrl(u)} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-slate-200 hover:opacity-80">
                          <img src={fullUrl(u)} alt={`Photo ${i + 1}`} className="w-full h-24 object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Rapport d'incident (chef des opérations) — only for incidents */}
              {type === 'incident' && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><FileText size={12} /> Rapport d'incident</p>
                    {item.opsReportState && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.opsReportState === 'VALIDE' ? 'bg-green-100 text-green-700' :
                        item.opsReportState === 'SOUMIS' ? 'bg-amber-100 text-amber-700' :
                        item.opsReportState === 'REJETE' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {OPS_REPORT_STATES.find(s => s.value === item.opsReportState)?.label ?? item.opsReportState}
                      </span>
                    )}
                  </div>

                  {/* Existing report text */}
                  {item.opsReport && !showOpsEditor && (
                    <div className="text-xs text-slate-700 bg-white rounded-lg p-2.5 border border-slate-200 whitespace-pre-wrap">{item.opsReport}</div>
                  )}

                  {/* Reporter info */}
                  {item.opsReportBy && (
                    <p className="text-xs text-slate-400">
                      Rédigé par {item.opsReportBy.firstName} {item.opsReportBy.lastName}
                      {item.opsReportDate && ` · ${new Date(item.opsReportDate).toLocaleString('fr-FR')}`}
                    </p>
                  )}

                  {/* Validator info */}
                  {item.opsReportValidatedBy && (
                    <p className="text-xs text-slate-400">
                      {item.opsReportState === 'VALIDE' ? 'Validé' : 'Rejeté'} par {item.opsReportValidatedBy.firstName} {item.opsReportValidatedBy.lastName}
                      {item.opsReportValidatedAt && ` · ${new Date(item.opsReportValidatedAt).toLocaleString('fr-FR')}`}
                    </p>
                  )}

                  {/* Chef ops: editor */}
                  {isChefOps && (showOpsEditor || (!item.opsReport && item.opsReportState !== 'SOUMIS')) && (
                    <div className="space-y-2">
                      <textarea
                        value={opsReportText}
                        onChange={e => setOpsReportText(e.target.value)}
                        rows={5}
                        placeholder="Rédigez le rapport d'incident..."
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => doOpsAction('submit')}
                          disabled={acting || !opsReportText.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                        >
                          {acting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Soumettre au DG
                        </button>
                        {item.opsReport && (
                          <button onClick={() => setShowOpsEditor(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Annuler</button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chef ops: edit button when report exists */}
                  {isChefOps && item.opsReport && !showOpsEditor && item.opsReportState !== 'SOUMIS' && (
                    <button onClick={() => { setOpsReportText(item.opsReport ?? ''); setShowOpsEditor(true) }} className="text-xs text-blue-600 hover:underline">Modifier le rapport</button>
                  )}

                  {/* DG: validate/reject when SOUMIS */}
                  {isDG && item.opsReportState === 'SOUMIS' && !showRejectBox && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => doOpsAction('validate')}
                        disabled={acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50"
                      >
                        {acting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Valider
                      </button>
                      <button
                        onClick={() => setShowRejectBox(true)}
                        disabled={acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 disabled:opacity-50"
                      >
                        <X size={12} /> Rejeter
                      </button>
                    </div>
                  )}

                  {/* DG: reject reason box */}
                  {isDG && showRejectBox && (
                    <div className="space-y-2">
                      <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        rows={2}
                        placeholder="Motif du rejet (optionnel)..."
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => doOpsAction('reject')}
                          disabled={acting}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                        >
                          {acting ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Confirmer le rejet
                        </button>
                        <button onClick={() => setShowRejectBox(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Annuler</button>
                      </div>
                    </div>
                  )}

                  {/* Chef ops: resubmit after rejection */}
                  {isChefOps && item.opsReportState === 'REJETE' && !showOpsEditor && (
                    <button onClick={() => { setOpsReportText(item.opsReport ?? ''); setShowOpsEditor(true) }} className="text-xs text-blue-600 hover:underline">Reprendre le rapport</button>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t border-slate-100 pt-3 space-y-1">
                <DetailRow icon={<Calendar size={12} />} label="Créé le" value={new Date(item.createdAt).toLocaleString('fr-FR')} />
                {item.updatedAt && item.updatedAt !== item.createdAt && <DetailRow icon={<Calendar size={12} />} label="Modifié le" value={new Date(item.updatedAt).toLocaleString('fr-FR')} />}
              </div>
            </>
          )}
        </div>

        {/* Actions footer */}
        {!loading && item && (
          <div className="border-t border-slate-100 p-4 flex flex-wrap gap-2 bg-slate-50">
            {type === 'alert' && (
              <>
                {item.state === 'NOUVELLE' && <ActionBtn label="Prendre en compte" onClick={() => doAction('ack')} cls="bg-amber-100 text-amber-700" loading={acting} />}
                {(item.state === 'PRISE_EN_COMPTE' || item.state === 'INTERVENTION') && <ActionBtn label="Résoudre" onClick={() => doAction('resolve')} cls="bg-green-100 text-green-700" loading={acting} />}
                {item.state !== 'RESOLUE' && item.state !== 'FAUSSE' && <ActionBtn label="Fausse alerte" onClick={() => doAction('false')} cls="bg-slate-100 text-slate-600" loading={acting} />}
                {!item.incidentId && item.state !== 'FAUSSE' && <ActionBtn label="→ Incident" onClick={() => doAction('convert')} cls="bg-red-100 text-red-700" loading={acting} />}
              </>
            )}
            {type === 'incident' && (
              <>
                {item.state === 'OUVERT' && <ActionBtn label="Investiguer" onClick={() => doAction('investigate')} cls="bg-amber-100 text-amber-700" loading={acting} />}
                {item.state === 'INVESTIGATION' && <ActionBtn label="Résoudre" onClick={() => doAction('resolve')} cls="bg-green-100 text-green-700" loading={acting} />}
                {item.state === 'RESOLU' && <ActionBtn label="Clore" onClick={() => doAction('close')} cls="bg-slate-100 text-slate-600" loading={acting} />}
              </>
            )}
            {type === 'control' && (
              <>
                {item.state === 'BROUILLON' && <ActionBtn label="Marquer terminée" onClick={() => doAction('done')} cls="bg-green-100 text-green-700" loading={acting} />}
                {item.state === 'BROUILLON' && <ActionBtn label="Reporter" onClick={() => doAction('reported')} cls="bg-amber-100 text-amber-700" loading={acting} />}
                {item.state !== 'ANNULEE' && item.state !== 'TERMINEE' && <ActionBtn label="Annuler" onClick={() => doAction('cancel')} cls="bg-slate-100 text-slate-600" loading={acting} />}
              </>
            )}
            {type === 'report' && (
              <>
                {item.state === 'BROUILLON' && <ActionBtn label="Soumettre" onClick={() => doAction('submit')} cls="bg-blue-100 text-blue-700" loading={acting} />}
                {item.state === 'SOUMIS' && <ActionBtn label="Valider" onClick={() => doAction('validate')} cls="bg-green-100 text-green-700" loading={acting} />}
                {item.state === 'SOUMIS' && <ActionBtn label="Rejeter" onClick={() => doAction('reject')} cls="bg-red-100 text-red-700" loading={acting} />}
                {(item.state === 'REJETE' || item.state === 'VALIDE') && <ActionBtn label="Remettre brouillon" onClick={() => doAction('reset')} cls="bg-slate-100 text-slate-600" loading={acting} />}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function AlertDetails({ item }: { item: any }) {
  const tp = ALERT_TYPES.find(t => t.value === item.alertType)
  const sev = ALERT_SEVERITIES.find(s => s.value === item.severity)
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <DetailRow icon={<Zap size={12} />} label="Type" value={tp?.label ?? item.alertType} />
        <DetailRow icon={<AlertCircle size={12} />} label="Sévérité" value={sev?.label ?? item.severity} />
      </div>
      {item.message && (
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5"><MessageSquare size={12} /> Message</p>
          <p className="text-sm text-slate-700">{item.message}</p>
        </div>
      )}
      {item.responseTimeMin > 0 && <DetailRow icon={<Clock size={12} />} label="Temps de réponse" value={`${item.responseTimeMin.toFixed(1)} min`} />}
      {item.resolvedAt && <DetailRow icon={<CheckCircle2 size={12} />} label="Résolue le" value={new Date(item.resolvedAt).toLocaleString('fr-FR')} />}
    </>
  )
}

function IncidentDetails({ item }: { item: any }) {
  const tp = INCIDENT_TYPES.find(t => t.value === item.incidentType)
  const sev = INCIDENT_SEVERITIES.find(s => s.value === item.severity)
  return (
    <>
      <p className="text-base font-bold text-slate-800">{item.title}</p>
      <div className="grid grid-cols-2 gap-3">
        <DetailRow icon={<Zap size={12} />} label="Type" value={tp?.label ?? item.incidentType} />
        <DetailRow icon={<AlertCircle size={12} />} label="Gravité" value={sev?.label ?? item.severity} />
      </div>
      <DetailRow icon={<Calendar size={12} />} label="Date/heure" value={new Date(item.incidentDatetime).toLocaleString('fr-FR')} />
      {item.description && (
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5"><MessageSquare size={12} /> Description</p>
          <p className="text-sm text-slate-700">{item.description}</p>
        </div>
      )}
      {item.resolution && (
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1 flex items-center gap-1.5"><CheckCircle2 size={12} /> Résolution</p>
          <p className="text-sm text-slate-700">{item.resolution}</p>
        </div>
      )}
    </>
  )
}

function ControlDetails({ item }: { item: any }) {
  const tp = CONTROL_VISIT_TYPES.find(t => t.value === item.visitType)
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <DetailRow icon={<Zap size={12} />} label="Type" value={tp?.label ?? item.visitType} />
        <DetailRow icon={<Clock size={12} />} label="Durée" value={item.durationMinutes != null ? `${item.durationMinutes} min` : '—'} />
      </div>
      <DetailRow icon={<Calendar size={12} />} label="Date/heure" value={new Date(item.visitDatetime).toLocaleString('fr-FR')} />
      <DetailRow icon={<User size={12} />} label="Agents" value={`${item.agentsChecked ?? 0}/${item.agentsExpected ?? 0} contrôlés`} />
      {item.rating > 0 && (
        <div className="flex items-center gap-2">
          <Star size={14} className="text-amber-500" />
          <span className="text-sm text-slate-700">Note: {'★'.repeat(item.rating)} ({item.rating}/5)</span>
        </div>
      )}
      {/* Checklist */}
      <div className="bg-slate-50 rounded-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contrôles</p>
        <ChecklistRow label="Tenue réglementaire" ok={item.uniformOk} />
        <ChecklistRow label="Équipement" ok={item.equipmentOk} />
        <ChecklistRow label="Posture / vigilance" ok={item.postureOk} />
        <ChecklistRow label="Registre à jour" ok={item.registerOk} />
      </div>
      {item.notes && (
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5"><MessageSquare size={12} /> Notes</p>
          <p className="text-sm text-slate-700">{item.notes}</p>
        </div>
      )}
    </>
  )
}

function ReportDetails({ item }: { item: any }) {
  const sh = REPORT_SHIFTS.find(s => s.value === item.shift)
  const agentCount = item._count?.agents ?? item.agentCount ?? 0
  const incCount = item._count?.incidents ?? 0
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <DetailRow icon={<Clock size={12} />} label="Vacation" value={sh?.label ?? item.shift} />
        <DetailRow icon={<User size={12} />} label="Agents" value={`${agentCount}/${item.agentsExpected ?? 0}`} />
      </div>
      <DetailRow icon={<Calendar size={12} />} label="Date" value={new Date(item.date).toLocaleDateString('fr-FR')} />
      {incCount > 0 && <DetailRow icon={<AlertTriangle size={12} />} label="Incidents liés" value={`${incCount}`} />}
      {item.summary && (
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5"><MessageSquare size={12} /> Résumé</p>
          <p className="text-sm text-slate-700">{item.summary}</p>
        </div>
      )}
      {item.validatedAt && <DetailRow icon={<CheckCircle2 size={12} />} label="Validé le" value={new Date(item.validatedAt).toLocaleString('fr-FR')} />}
    </>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-400">{label}</span>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  )
}

function ChecklistRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${ok ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'}`}>
        {ok ? '✓' : '✗'}
      </span>
      <span className={`text-sm ${ok ? 'text-slate-700' : 'text-slate-500'}`}>{label}</span>
    </div>
  )
}

function ActionBtn({ label, onClick, cls, loading }: { label: string; onClick: () => void; cls: string; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${cls} disabled:opacity-50`}>
      {loading ? <Loader2 size={12} className="animate-spin" /> : null}
      {label}
    </button>
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
