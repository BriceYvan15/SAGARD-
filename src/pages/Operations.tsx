import { useState } from 'react'
import {
  Activity, Search, Sun, Moon, Clock,
  Loader2, Plus, X, MapPin, UserCheck, Shield, FileText, Play, Square
} from 'lucide-react'
import { useApi } from '../lib/useApi'
import { fmtDate } from '../lib/utils'
import {
  getTodayPointages, getDeployments, createDeployment, activateDeployment,
  endDeployment, getIncidents, getDailyReports
} from '../services/operations.service'
import { getAgents } from '../services/agents.service'
import { getSites } from '../services/sites.service'

type Tab = 'pointages' | 'deployments' | 'incidents' | 'rapports'

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'pointages',   label: 'Pointages',     icon: Clock },
  { key: 'deployments', label: 'Déploiements',  icon: MapPin },
  { key: 'incidents',   label: 'Incidents',     icon: Shield },
  { key: 'rapports',    label: 'Rapports',      icon: FileText },
]

const DEP_STATE: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
  ACTIF:     { label: 'Actif',     cls: 'bg-green-100 text-green-700' },
  TERMINE:   { label: 'Terminé',   cls: 'bg-slate-100 text-slate-500' },
  REMPLACE:  { label: 'Remplacé',  cls: 'bg-amber-100 text-amber-700' },
}

const INC_STATE: Record<string, { label: string; cls: string }> = {
  OUVERT:       { label: 'Ouvert',       cls: 'bg-red-100 text-red-700' },
  INVESTIGATION:{ label: 'Investigation',cls: 'bg-amber-100 text-amber-700' },
  RESOLU:       { label: 'Résolu',       cls: 'bg-green-100 text-green-700' },
  CLOS:         { label: 'Clos',         cls: 'bg-slate-100 text-slate-500' },
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40'

function fmtTime(iso?: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

export default function Operations() {
  const [tab, setTab] = useState<Tab>('pointages')
  const [search, setSearch] = useState('')
  const [shiftFilter, setShift] = useState('all')

  // Data
  const { data: ptData, loading: ptLoading }   = useApi(getTodayPointages)
  const { data: depData, loading: depLoading, reload: reloadDeps } = useApi(getDeployments)
  const { data: incData, loading: incLoading }  = useApi(getIncidents)
  const { data: repData, loading: repLoading }  = useApi(getDailyReports)
  const { data: agentsData } = useApi(getAgents)
  const { data: sitesData }  = useApi(getSites)

  const pointages   = (ptData as any[]) ?? []
  const deployments = (depData as any[]) ?? []
  const incidents   = (incData as any[]) ?? []
  const reports     = (repData as any[]) ?? []
  const agents      = (agentsData as any[]) ?? []
  const sites       = (sitesData as any[]) ?? []
  const sitesMap    = new Map(sites.map((s: any) => [s.id, s]))

  // ─── Déploiement modal ───
  const [showDepModal, setShowDepModal] = useState(false)
  const [depForm, setDepForm] = useState({ agentId: '', siteId: '', shift: 'JOUR', startDate: '', endDate: '', state: 'ACTIF', notes: '' })
  const [depSaving, setDepSaving] = useState(false)
  const [depError, setDepError] = useState<string | null>(null)


  // Pointages filter
  const filteredPt = pointages.filter(op => {
    const q = search.toLowerCase()
    const agentName = `${op.agent?.user?.firstName ?? ''} ${op.agent?.user?.lastName ?? ''}`.toLowerCase()
    const siteName  = (op.deployment?.site?.name ?? sitesMap.get(op.siteId)?.name ?? '').toLowerCase()
    const matchSearch = agentName.includes(q) || siteName.includes(q)
    const matchShift  = shiftFilter === 'all' || (op.shift ?? '').toLowerCase() === shiftFilter
    return matchSearch && matchShift
  })

  const today      = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const inProgress = pointages.filter(o => !o.checkOutTime).length
  const done       = pointages.filter(o => !!o.checkOutTime).length


  const handleCreateDep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!depForm.agentId || !depForm.siteId) { setDepError('Agent et site sont obligatoires.'); return }
    setDepSaving(true); setDepError(null)
    try {
      await createDeployment({
        ...depForm,
        startDate: depForm.startDate || new Date().toISOString(),
        endDate: depForm.endDate || undefined,
      })
      setShowDepModal(false)
      reloadDeps()
    } catch (err: any) { setDepError(err.response?.data?.message ?? 'Erreur') }
    finally { setDepSaving(false) }
  }


  return (
    <div className="space-y-5">
      {/* Day banner */}
      <div className="bg-[#1E1E1E] rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-[#C8D400] text-xs font-bold uppercase tracking-widest">Opérations</p>
          <p className="text-white text-lg font-bold capitalize mt-0.5">{today}</p>
        </div>
        <div className="flex gap-6 text-center">
          {ptLoading ? (
            <Loader2 className="animate-spin text-slate-400 my-2" size={22} />
          ) : (
            <>
              <div><p className="text-2xl font-black text-[#C8D400]">{inProgress}</p><p className="text-slate-400 text-xs">En poste</p></div>
              <div><p className="text-2xl font-black text-green-400">{done}</p><p className="text-slate-400 text-xs">Terminés</p></div>
              <div><p className="text-2xl font-black text-blue-400">{deployments.filter(d => d.state === 'ACTIF').length}</p><p className="text-slate-400 text-xs">Affectations actives</p></div>
              <div><p className="text-2xl font-black text-red-400">{incidents.filter(i => i.state === 'OUVERT').length}</p><p className="text-slate-400 text-xs">Incidents ouverts</p></div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ═══ TAB POINTAGES ═══ */}
      {tab === 'pointages' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Agent, site..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
            </div>
            <div className="flex gap-2">
              {([{ key: 'all', label: 'Toutes' }, { key: 'jour', label: 'Jour', icon: <Sun size={12}/> }, { key: 'nuit', label: 'Nuit', icon: <Moon size={12}/> }]).map(s => (
                <button key={s.key} onClick={() => setShift(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${shiftFilter === s.key ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {(s as any).icon}{s.label}
                </button>
              ))}
            </div>
          </div>
          {ptLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {['Agent','Site','Vacation','Prise','Fin','Statut'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPt.map(op => {
                    const isNight = (op.shift ?? '').toLowerCase() === 'nuit'
                    const isDone = !!op.checkOutTime
                    return (
                      <tr key={op.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3"><p className="font-semibold text-slate-800">{op.agent?.user?.firstName} {op.agent?.user?.lastName}</p><p className="text-xs text-slate-400">{op.agent?.matricule}</p></td>
                        <td className="px-4 py-3 text-xs text-slate-600">{op.deployment?.site?.name ?? sitesMap.get(op.siteId)?.name ?? '—'}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isNight ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>{isNight ? 'Nuit' : 'Jour'}</span></td>
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-700">{fmtTime(op.checkInTime)}</td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-500">{op.checkOutTime ? fmtTime(op.checkOutTime) : <span className="text-blue-500 font-semibold">En cours</span>}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${isDone ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{isDone ? 'Terminé' : 'En cours'}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredPt.length === 0 && <div className="text-center py-12 text-slate-400"><Activity size={40} className="mx-auto mb-3 opacity-30" /><p>Aucun pointage aujourd'hui</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB DÉPLOIEMENTS ═══ */}
      {tab === 'deployments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-700">{deployments.length} affectations</p>
            <button onClick={() => { setDepError(null); setShowDepModal(true) }}
              className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors">
              <Plus size={15} /> Nouvelle affectation
            </button>
          </div>
          {depLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {['Réf','Agent','Site','Vacation','Début','Fin','État','Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {deployments.map(dep => {
                    const st = DEP_STATE[dep.state] ?? { label: dep.state, cls: 'bg-slate-100 text-slate-500' }
                    return (
                      <tr key={dep.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{dep.reference}</td>
                        <td className="px-4 py-3"><p className="font-semibold text-slate-800">{dep.agent?.user?.firstName} {dep.agent?.user?.lastName}</p></td>
                        <td className="px-4 py-3 text-xs text-slate-600">{dep.site?.name}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dep.shift === 'NUIT' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>{dep.shift}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(dep.startDate)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{dep.endDate ? fmtDate(dep.endDate) : '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {dep.state === 'BROUILLON' && (
                              <button onClick={async () => { await activateDeployment(dep.id); reloadDeps() }}
                                className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Activer"><Play size={13} /></button>
                            )}
                            {dep.state === 'ACTIF' && (
                              <button onClick={async () => { await endDeployment(dep.id); reloadDeps() }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Terminer"><Square size={13} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {deployments.length === 0 && <div className="text-center py-12 text-slate-400"><MapPin size={40} className="mx-auto mb-3 opacity-30" /><p>Aucune affectation</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB INCIDENTS (lecture seule — création via mobile) ═══ */}
      {tab === 'incidents' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-700">{incidents.length} incidents</p>
            <span className="text-xs text-slate-400 italic">Déclarés depuis l'app mobile</span>
          </div>
          {incLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {['Date','Titre','Site','Type','Sévérité','Statut'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map(inc => {
                    const st = INC_STATE[inc.state] ?? { label: inc.state, cls: 'bg-slate-100 text-slate-500' }
                    return (
                      <tr key={inc.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(inc.incidentDatetime ?? inc.createdAt)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{inc.title}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{inc.site?.name ?? '—'}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{inc.incidentType}</span></td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${inc.severity === 'CRITIQUE' ? 'bg-red-100 text-red-700' : inc.severity === 'ELEVE' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{inc.severity}</span></td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {incidents.length === 0 && <div className="text-center py-12 text-slate-400"><Shield size={40} className="mx-auto mb-3 opacity-30" /><p>Aucun incident déclaré</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB RAPPORTS ═══ */}
      {tab === 'rapports' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-700">{reports.length} rapports journaliers</p>
            <span className="text-xs text-slate-400 italic">Rédigés depuis l'app mobile</span>
          </div>
          {repLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {['Date','Site','Vacation','Statut','Agents','Résumé'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{fmtDate(r.date)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{r.site?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{r.shift ?? '—'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.state === 'VALIDE' ? 'bg-green-100 text-green-700' : r.state === 'SOUMIS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{r.state}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-600">{r.agentCount ?? 0}/{r.agentsExpected ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{r.summary ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reports.length === 0 && <div className="text-center py-12 text-slate-400"><FileText size={40} className="mx-auto mb-3 opacity-30" /><p>Aucun rapport</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ═══ MODAL DÉPLOIEMENT ═══ */}
      {showDepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-sagard-yellow-dark" /> Nouvelle affectation</h2>
              <button onClick={() => setShowDepModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
            </div>
            <form onSubmit={handleCreateDep} className="px-6 py-5 space-y-4">
              {depError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{depError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Agent *</label>
                  <select value={depForm.agentId} onChange={e => setDepForm(f => ({...f, agentId: e.target.value}))} className={inputCls + ' bg-white'}>
                    <option value="">-- Sélectionner --</option>
                    {agents.map((a: any) => <option key={a.id} value={a.id}>{a.user?.firstName} {a.user?.lastName} ({a.matricule})</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Site *</label>
                  <select value={depForm.siteId} onChange={e => setDepForm(f => ({...f, siteId: e.target.value}))} className={inputCls + ' bg-white'}>
                    <option value="">-- Sélectionner --</option>
                    {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vacation</label>
                  <select value={depForm.shift} onChange={e => setDepForm(f => ({...f, shift: e.target.value}))} className={inputCls + ' bg-white'}>
                    <option value="JOUR">Jour</option><option value="NUIT">Nuit</option><option value="MIXTE">Mixte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">État initial</label>
                  <select value={depForm.state} onChange={e => setDepForm(f => ({...f, state: e.target.value}))} className={inputCls + ' bg-white'}>
                    <option value="ACTIF">Actif immédiatement</option><option value="BROUILLON">Brouillon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date début</label>
                  <input type="date" value={depForm.startDate} onChange={e => setDepForm(f => ({...f, startDate: e.target.value}))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date fin (optionnel)</label>
                  <input type="date" value={depForm.endDate} onChange={e => setDepForm(f => ({...f, endDate: e.target.value}))} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                  <input value={depForm.notes} onChange={e => setDepForm(f => ({...f, notes: e.target.value}))} className={inputCls} placeholder="Optionnel..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowDepModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={depSaving} className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                  {depSaving ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
