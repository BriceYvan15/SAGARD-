import { Fragment, useState, useMemo } from 'react'
import { Search, Plus, UserCheck, Loader2, X, Award, AlertTriangle, Users, ShieldCheck, GraduationCap, Plane } from 'lucide-react'
import Pagination from '../components/Pagination'
import { fmtDate } from '../lib/utils'
import { useApi } from '../lib/useApi'
import { getAgents, createAgent, createAgentWithUser } from '../services/agents.service'
import { getUsers } from '../services/users.service'
import AgentDetailModal from '../components/AgentDetailModal'
import Select from '../components/Select'
import DatePicker from '../components/DatePicker'

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  EN_POSTE:     { label: 'En poste',       cls: 'bg-green-100 text-green-700' },
  DISPONIBLE:   { label: 'Disponible',     cls: 'bg-blue-100 text-blue-700' },
  EN_CONGE:     { label: 'En congé',       cls: 'bg-blue-100 text-blue-700' },
  EN_FORMATION: { label: 'Formation',      cls: 'bg-amber-100 text-amber-700' },
  INACTIF:      { label: 'Inactif',        cls: 'bg-slate-100 text-slate-500' },
  RECRUTE:      { label: 'Recruté',        cls: 'bg-purple-100 text-purple-700' },
}

const SHIFT_CFG: Record<string, { label: string; cls: string }> = {
  JOUR:  { label: 'Jour',  cls: 'bg-amber-100 text-amber-700' },
  NUIT:  { label: 'Nuit',  cls: 'bg-indigo-100 text-indigo-700' },
  MIXTE: { label: 'Mixte', cls: 'bg-slate-100 text-slate-600' },
}

const BEHAVIOR_CFG: Record<string, { label: string; icon: any; cls: string }> = {
  EXEMPLAIRE:   { label: 'Exemplaire',   icon: Award,          cls: 'text-emerald-600' },
  BON:          { label: 'Bon',          icon: Award,          cls: 'text-blue-500' },
  NORMAL:       { label: '',             icon: null,           cls: '' },
  INDISCIPLINE: { label: 'Indiscipliné', icon: AlertTriangle,  cls: 'text-red-600' },
}

const EDUCATION_LEVELS = [
  { value: '', label: '-- Choisir --' },
  { value: 'SANS_DIPLOME', label: 'Sans diplôme' },
  { value: 'CEPE', label: 'CEPE' },
  { value: 'BEPC', label: 'BEPC' },
  { value: 'BAC', label: 'BAC' },
  { value: 'BTS_DUT', label: 'BTS / DUT' },
  { value: 'LICENCE', label: 'Licence' },
  { value: 'MASTER', label: 'Master' },
  { value: 'DOCTORAT', label: 'Doctorat' },
  { value: 'AUTRE', label: 'Autre' },
]

const CONTRACT_TYPES = [
  { value: '', label: '-- Choisir --' },
  { value: 'CDD', label: 'CDD' },
  { value: 'CDI', label: 'CDI' },
  { value: 'ESSAI', label: 'Période d\'essai' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'JOURNALIER', label: 'Journalier' },
]

const COLORS = ['bg-blue-500','bg-purple-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-cyan-500']

const EMPTY_AGENT = {
  userId: '', position: '', shift: 'JOUR', hireDate: '', baseSalary: '',
  cniNumber: '', department: '', educationLevel: '', contractType: '', contractEndDate: '',
  emergencyContact: '', emergencyPhone: '', emergencyRelation: '', address: '',
  // Champs nouvel utilisateur
  firstName: '', lastName: '', phone: '', email: '', password: '', role: 'AGENT_TERRAIN',
}

export default function Agents() {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState({ ...EMPTY_AGENT })
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [createMode, setCreateMode] = useState<'new' | 'existing'>('new')

  const { data, loading, reload } = useApi(getAgents)
  const { data: usersData }       = useApi(getUsers)
  const all   = (data as any[]) ?? []
  const users = (usersData as any[]) ?? []

  const set = (k: keyof typeof EMPTY_AGENT) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))
  const setVal = (k: keyof typeof EMPTY_AGENT) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (createMode === 'existing' && !form.userId) {
      setFormError('Veuillez sélectionner un utilisateur.')
      return
    }
    if (createMode === 'new' && (!form.firstName || !form.lastName || !form.phone || !form.email || !form.password)) {
      setFormError('Nom, prénom, téléphone, email et mot de passe sont obligatoires.')
      return
    }
    if (!form.position) {
      setFormError('Le poste est obligatoire.')
      return
    }
    setSaving(true); setFormError(null)
    try {
      if (createMode === 'new') {
        await createAgentWithUser({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
          password: form.password,
          role: form.role,
          position: form.position,
          shift: form.shift,
          hireDate: form.hireDate ? new Date(form.hireDate) : new Date(),
          baseSalary: form.baseSalary ? Number(form.baseSalary) : 0,
          contractType: form.contractType || undefined,
          educationLevel: form.educationLevel || undefined,
          contractEndDate: form.contractEndDate ? new Date(form.contractEndDate) : undefined,
          cniNumber: form.cniNumber || undefined,
          department: form.department || undefined,
          address: form.address || undefined,
          emergencyContact: form.emergencyContact || undefined,
          emergencyPhone: form.emergencyPhone || undefined,
          emergencyRelation: form.emergencyRelation || undefined,
        })
      } else {
        await createAgent({
          userId: form.userId,
          position: form.position,
          shift: form.shift,
          hireDate: form.hireDate ? new Date(form.hireDate) : new Date(),
          baseSalary: form.baseSalary ? Number(form.baseSalary) : 0,
          contractType: form.contractType || undefined,
          educationLevel: form.educationLevel || undefined,
          contractEndDate: form.contractEndDate ? new Date(form.contractEndDate) : undefined,
          cniNumber: form.cniNumber || undefined,
          department: form.department || undefined,
          address: form.address || undefined,
          emergencyContact: form.emergencyContact || undefined,
          emergencyPhone: form.emergencyPhone || undefined,
          emergencyRelation: form.emergencyRelation || undefined,
        })
      }
      setShowModal(false)
      setForm({ ...EMPTY_AGENT })
      reload()
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = all.filter(a => {
    const q    = search.toLowerCase()
    const name = `${a.user?.firstName ?? ''} ${a.user?.lastName ?? ''}`.toLowerCase()
    const matchSearch = name.includes(q)
      || (a.matricule ?? '').toLowerCase().includes(q)
      || (a.position ?? '').toLowerCase().includes(q)
    const matchFilter = filter === 'all' || a.status === filter
    return matchSearch && matchFilter
  })

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, Math.ceil(filtered.length / pageSize))))

  const KPI_ITEMS = [
    { key: 'all',      label: 'Total agents',  count: all.length },
    { key: 'EN_POSTE', label: 'En poste',      count: all.filter(a => a.status === 'EN_POSTE').length },
    { key: 'EN_FORMATION',label: 'En formation',  count: all.filter(a => a.status === 'EN_FORMATION').length },
    { key: 'EN_CONGE',    label: 'En congé',      count: all.filter(a => a.status === 'EN_CONGE').length },
  ]

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40"

  return (
    <Fragment>
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {KPI_ITEMS.map((s, i) => {
          const iconMap: any[] = [Users, ShieldCheck, GraduationCap, Plane]
          const pastelMap: string[] = ['bg-slate-100 text-slate-600', 'bg-green-50 text-green-600', 'bg-amber-50 text-amber-600', 'bg-blue-50 text-blue-600']
          const Icon = iconMap[i] ?? Users
          return (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`bg-white rounded-xl p-4 border text-left transition-all flex items-center gap-3 ${filter === s.key ? 'border-sagard-yellow shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${pastelMap[i] ?? 'bg-slate-100 text-slate-600'}`}>
                <Icon size={18} />
              </div>
              <div>
                {loading
                  ? <div className="w-10 h-7 bg-slate-200 rounded animate-pulse mb-1" />
                  : <p className="text-2xl font-black text-slate-800">{s.count}</p>}
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nom, matricule, poste..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
          </div>
          <button onClick={() => { setForm({ ...EMPTY_AGENT }); setFormError(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors">
            <Plus size={15} /> Nouvel agent
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Agent','Matricule','Poste','Site affecté','Vacation','Contrat','Embauche','Statut'].map((h, i) => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 ${i === 2 || i === 3 || i === 4 || i === 5 || i === 6 ? 'hidden md:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map(agent => {
                  const u         = agent.user ?? {}
                  const initials  = (u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')
                  const colorIdx  = ((u.firstName?.charCodeAt(0) ?? 0) + (u.lastName?.charCodeAt(0) ?? 0)) % COLORS.length
                  const st        = STATUS_CFG[agent.status] ?? { label: agent.status, cls: 'bg-slate-100 text-slate-500' }
                  const shiftCfg  = SHIFT_CFG[agent.shift]   ?? { label: agent.shift ?? '—', cls: 'bg-slate-100 text-slate-600' }
                  const siteName  = agent.deployments?.[0]?.site?.name
                  const beh       = BEHAVIOR_CFG[agent.behaviorRating] ?? BEHAVIOR_CFG.NORMAL
                  const BehIcon   = beh.icon

                  return (
                    <tr key={agent.id} onClick={() => setSelectedAgentId(agent.id)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${COLORS[colorIdx]} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {u.firstName} {u.lastName}
                              {BehIcon && <BehIcon size={13} className={beh.cls} title={beh.label} />}
                            </p>
                            <p className="text-xs text-slate-400">{u.phone ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{agent.matricule ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell">{agent.position ?? '—'}</td>
                      <td className="px-4 py-3 text-xs hidden md:table-cell">
                        {siteName
                          ? <span className="text-slate-700">{siteName}</span>
                          : <span className="text-slate-400 italic">Non affecté</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${shiftCfg.cls}`}>{shiftCfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell">{agent.contractType ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{agent.hireDate ? fmtDate(agent.hireDate) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <UserCheck size={40} className="mx-auto mb-3 opacity-30" />
                <p>{search || filter !== 'all' ? 'Aucun résultat' : 'Aucun agent enregistré'}</p>
              </div>
            )}
          </div>
        )}
        {filtered.length > 0 && (
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={goToPage} onPageSizeChange={s => { setPageSize(s); setPage(1) }} />
        )}
      </div>
    </div>

    {/* Modal Nouvel Agent */}
    {showModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserCheck size={18} className="text-sagard-yellow-dark" /> Nouvel employé / agent
            </h2>
            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-5">
            {/* Toggle mode */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Type d'enregistrement</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCreateMode('new')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${createMode === 'new' ? 'bg-sagard-yellow text-sagard-dark border-sagard-yellow' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  Nouvel employé
                </button>
                <button type="button" onClick={() => setCreateMode('existing')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${createMode === 'existing' ? 'bg-sagard-yellow text-sagard-dark border-sagard-yellow' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  Utilisateur existant
                </button>
              </div>
            </div>

            {/* Mode: Utilisateur existant */}
            {createMode === 'existing' && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Rattachement utilisateur</p>
                <Select value={form.userId} onChange={setVal('userId')}
                  options={users.filter((u: any) => !u.agent).map((u: any) => ({ value: u.id, label: `${u.firstName} ${u.lastName} (${u.role})` }))}
                  placeholder="-- Sélectionner un utilisateur --" className="w-full" />
              </div>
            )}

            {/* Mode: Nouvel utilisateur */}
            {createMode === 'new' && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Identité & compte</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prénom *</label>
                    <input value={form.firstName} onChange={set('firstName')} className={inputCls} placeholder="Kouadio" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
                    <input value={form.lastName} onChange={set('lastName')} className={inputCls} placeholder="KOFFI" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone *</label>
                    <input value={form.phone} onChange={set('phone')} type="tel" className={inputCls} placeholder="+225 07 XX XX XX XX" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                    <input value={form.email} onChange={set('email')} type="email" className={inputCls} placeholder="agent@sagard.ci" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Mot de passe *</label>
                    <input value={form.password} onChange={set('password')} type="password" className={inputCls} placeholder="Min. 6 caractères" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Rôle</label>
                    <Select value={form.role} onChange={setVal('role')}
                      options={[{ value: 'AGENT_TERRAIN', label: 'Agent terrain' }, { value: 'CONTROLEUR', label: 'Contrôleur' }, { value: 'TECHNICIENNE_SURFACE', label: 'Technicienne de surface' }, { value: 'AGENT_ACCUEIL', label: "Agent d'accueil" }, { value: 'CHEF_OPERATIONS', label: 'Chef opérations' }, { value: 'RH', label: 'RH' }, { value: 'COMMERCIAL', label: 'Commercial' }, { value: 'COMPTABLE', label: 'Comptable' }]} className="w-full" />
                  </div>
                </div>
              </div>
            )}

            {/* Identité */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Informations employé</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">N° CNI</label>
                  <input value={form.cniNumber} onChange={set('cniNumber')} className={inputCls} placeholder="CI-XXXXXXXXX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Adresse</label>
                  <input value={form.address} onChange={set('address')} className={inputCls} placeholder="Cocody, Abidjan" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Niveau d'étude</label>
                  <Select value={form.educationLevel} onChange={setVal('educationLevel')}
                    options={EDUCATION_LEVELS.map(l => ({ value: l.value, label: l.label }))} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Service / Département</label>
                  <input value={form.department} onChange={set('department')} className={inputCls} placeholder="Opérations, Commercial..." />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Poste *</label>
                  <input value={form.position} onChange={set('position')} required className={inputCls} placeholder="Agent de sécurité, Chef de poste..." />
                </div>
              </div>
            </div>

            {/* Contrat de travail */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Contrat de travail</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type de contrat</label>
                  <Select value={form.contractType} onChange={setVal('contractType')}
                    options={CONTRACT_TYPES.map(t => ({ value: t.value, label: t.label }))} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vacation</label>
                  <Select value={form.shift} onChange={setVal('shift')}
                    options={[{ value: 'JOUR', label: 'Jour' }, { value: 'NUIT', label: 'Nuit' }, { value: 'MIXTE', label: 'Mixte' }]} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date d'embauche</label>
                  <DatePicker value={form.hireDate} onChange={setVal('hireDate')} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fin de contrat</label>
                  <DatePicker value={form.contractEndDate} onChange={setVal('contractEndDate')} className="w-full" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Salaire de base (XOF)</label>
                  <input value={form.baseSalary} onChange={set('baseSalary')} type="number" className={inputCls} placeholder="150000" />
                </div>
              </div>
            </div>

            {/* Contact d'urgence */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Contact d'urgence</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nom et prénom</label>
                  <input value={form.emergencyContact} onChange={set('emergencyContact')} className={inputCls} placeholder="KONAN Amani" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
                  <input value={form.emergencyPhone} onChange={set('emergencyPhone')} type="tel" className={inputCls} placeholder="+225 07 XX XX XX XX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Lien parental</label>
                  <input value={form.emergencyRelation} onChange={set('emergencyRelation')} className={inputCls} placeholder="Père, mère, époux(se)..." />
                </div>
              </div>
            </div>

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
                {saving ? <><Loader2 size={14} className="animate-spin" /> Enregistrement...</> : 'Enregistrer l\'agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {selectedAgentId && (
      <AgentDetailModal agentId={selectedAgentId} onClose={() => setSelectedAgentId(null)} onRefresh={reload} />
    )}
    </Fragment>
  )
}
