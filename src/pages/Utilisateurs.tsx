import { useState } from 'react'
import {
  Users, Plus, X, Save, Loader2, Shield, ShieldAlert,
  UserCheck, UserX, Mail, Phone, Eye, EyeOff,
} from 'lucide-react'
import { useApi } from '../lib/useApi'
import { getUsers, createUser, suspendUser, activateUser } from '../services/users.service'
import { ROLE_LABELS } from '../lib/auth'
import { hasAccess } from '../lib/roles'

const ROLES_OPTIONS = [
  { value: 'DIRECTEUR_GENERAL',    label: 'Directeur Général',    color: 'bg-red-100 text-red-700' },
  { value: 'COMMERCIAL',           label: 'Commercial',           color: 'bg-blue-100 text-blue-700' },
  { value: 'COMPTABLE',            label: 'Comptable',            color: 'bg-emerald-100 text-emerald-700' },
  { value: 'RH',                   label: 'Ressources Humaines',  color: 'bg-purple-100 text-purple-700' },
  { value: 'CHEF_OPERATIONS',      label: 'Chef Opérations',      color: 'bg-amber-100 text-amber-700' },
  { value: 'CONTROLEUR',           label: 'Contrôleur',           color: 'bg-orange-100 text-orange-700' },
  { value: 'TECHNICIENNE_SURFACE', label: 'Technicienne Surface',  color: 'bg-pink-100 text-pink-700' },
  { value: 'AGENT_ACCUEIL',        label: 'Agent Accueil',        color: 'bg-teal-100 text-teal-700' },
  { value: 'AGENT_TERRAIN',        label: 'Agent Terrain',        color: 'bg-slate-100 text-slate-700' },
]

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIF:    { label: 'Actif',    cls: 'bg-green-100 text-green-700' },
  SUSPENDU: { label: 'Suspendu', cls: 'bg-red-100 text-red-700' },
}

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '', whatsappPhone: '', role: 'COMMERCIAL', password: '',
}

export default function Utilisateurs() {
  const { data, loading, reload } = useApi(getUsers)
  const users = (data as any[]) ?? []
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  if (!hasAccess('utilisateurs')) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
      <ShieldAlert size={48} className="text-red-300" />
      <p className="font-bold text-lg text-slate-600">Accès restreint</p>
      <p className="text-sm">Seul le DG peut gérer les utilisateurs.</p>
    </div>
  )

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const filtered = users.filter(u => {
    const matchFilter = filter === 'all' || u.role === filter || u.status === filter
    const matchSearch = !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
      setFormError('Tous les champs obligatoires doivent être remplis.')
      return
    }
    setSaving(true); setFormError(null)
    try {
      await createUser(form)
      setShowModal(false)
      setForm({ ...EMPTY_FORM })
      reload()
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Erreur lors de la création.')
    } finally { setSaving(false) }
  }

  const handleToggle = async (user: any) => {
    try {
      if (user.status === 'ACTIF') await suspendUser(user.id)
      else await activateUser(user.id)
      reload()
    } catch {}
  }

  const roleColor = (role: string) => ROLES_OPTIONS.find(r => r.value === role)?.color ?? 'bg-slate-100 text-slate-600'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users size={22} /> Gestion des Utilisateurs</h1>
          <p className="text-sm text-slate-400 mt-0.5">{users.length} comptes enregistrés</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_FORM }); setFormError(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors">
          <Plus size={15} /> Nouveau compte
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-64 focus:ring-2 focus:ring-sagard-yellow" />
        {[{ v: 'all', l: 'Tous' }, ...ROLES_OPTIONS.map(r => ({ v: r.value, l: r.label })), { v: 'SUSPENDU', l: 'Suspendus' }].map(o => (
          <button key={o.v} onClick={() => setFilter(o.v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === o.v ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {o.l}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Dernière connexion', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => {
                const st = STATUS_CFG[u.status] ?? { label: u.status, cls: 'bg-slate-100 text-slate-500' }
                return (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sagard-yellow/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-sagard-yellow-dark">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-800">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs flex items-center gap-1"><Mail size={12} className="text-slate-400" /> {u.email}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs flex items-center gap-1"><Phone size={12} className="text-slate-400" /> {u.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleColor(u.role)}`}>
                        <Shield size={10} /> {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(u)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          u.status === 'ACTIF' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}>
                        {u.status === 'ACTIF' ? <><UserX size={11} /> Suspendre</> : <><UserCheck size={11} /> Activer</>}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Aucun utilisateur trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Créer un compte utilisateur</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Prénom *</label>
                  <input value={form.firstName} onChange={set('firstName')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nom *</label>
                  <input value={form.lastName} onChange={set('lastName')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Email *</label>
                <input type="email" value={form.email} onChange={set('email')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Téléphone *</label>
                  <input value={form.phone} onChange={set('phone')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">WhatsApp</label>
                  <input value={form.whatsappPhone} onChange={set('whatsappPhone')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Rôle *</label>
                <select value={form.role} onChange={set('role')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow">
                  {ROLES_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Mot de passe *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-sagard-yellow" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-5 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
