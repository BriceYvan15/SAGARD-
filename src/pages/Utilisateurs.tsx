import { useState, useMemo } from 'react'
import {
  Users, Plus, X, Save, Loader2, Shield, ShieldAlert, Edit,
  UserCheck, UserX, Mail, Phone, Eye, EyeOff,
} from 'lucide-react'
import Pagination from '../components/Pagination'
import { useApi } from '../lib/useApi'
import { getUsers, createUser, suspendUser, activateUser, updateUser } from '../services/users.service'
import { ROLE_LABELS } from '../lib/auth'
import { hasAccess } from '../lib/roles'
import Select from '../components/Select'

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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editUser, setEditUser] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [showEditPwd, setShowEditPwd] = useState(false)

  if (!hasAccess('utilisateurs')) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
      <ShieldAlert size={48} className="text-red-300" />
      <p className="font-bold text-lg text-slate-600">Accès restreint</p>
      <p className="text-sm">Seul le DG peut gérer les utilisateurs.</p>
    </div>
  )

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))
  const setVal = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const filtered = users.filter(u => {
    const matchFilter = filter === 'all' || u.role === filter || u.status === filter
    const matchSearch = !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, Math.ceil(filtered.length / pageSize))))

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

  const openEditModal = (user: any) => {
    setEditUser(user)
    setEditForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      whatsappPhone: user.whatsappPhone ?? '',
      role: user.role ?? 'COMMERCIAL',
      password: '',
    })
    setEditError(null)
    setShowEditPwd(false)
  }

  const setEdit = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm((f: any) => ({ ...f, [k]: e.target.value }))
  const setEditVal = (k: string) => (v: string) => setEditForm((f: any) => ({ ...f, [k]: v }))

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.firstName || !editForm.lastName || !editForm.email || !editForm.phone) {
      setEditError('Prénom, nom, email et téléphone sont obligatoires.')
      return
    }
    setEditSaving(true); setEditError(null)
    try {
      const payload: any = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        whatsappPhone: editForm.whatsappPhone || undefined,
        role: editForm.role,
      }
      if (editForm.password) payload.password = editForm.password
      await updateUser(editUser.id, payload)
      setEditUser(null)
      reload()
    } catch (err: any) {
      setEditError(err.response?.data?.message ?? 'Erreur lors de la modification.')
    } finally { setEditSaving(false) }
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
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full sm:w-64 focus:ring-2 focus:ring-sagard-yellow" />
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
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Dernière connexion', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((u: any) => {
                const st = STATUS_CFG[u.status] ?? { label: u.status, cls: 'bg-slate-100 text-slate-500' }
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
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
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      <div className="flex items-center gap-1"><Mail size={12} className="text-slate-400 flex-shrink-0" /> {u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      <div className="flex items-center gap-1"><Phone size={12} className="text-slate-400 flex-shrink-0" /> {u.phone}</div>
                    </td>
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
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(u)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                          <Edit size={11} /> Modifier
                        </button>
                        <button onClick={() => handleToggle(u)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            u.status === 'ACTIF' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}>
                          {u.status === 'ACTIF' ? <><UserX size={11} /> Suspendre</> : <><UserCheck size={11} /> Activer</>}
                        </button>
                      </div>
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
          {filtered.length > 0 && (
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={goToPage} onPageSizeChange={s => { setPageSize(s); setPage(1) }} />
          )}
        </div>
      )}

      {/* Modal Création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-sagard-yellow-dark" /> Créer un compte utilisateur
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} className="text-slate-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {formError && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Select value={form.role} onChange={setVal('role')}
                  options={ROLES_OPTIONS.map(r => ({ value: r.value, label: r.label }))} className="w-full" />
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
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 -mx-6 px-6 py-4 bg-slate-50">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white transition-colors">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-5 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Édition */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit size={18} className="text-sagard-yellow-dark" /> Modifier l'utilisateur
              </h2>
              <button onClick={() => setEditUser(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} className="text-slate-500" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {editError && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{editError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Prénom *</label>
                  <input value={editForm.firstName} onChange={setEdit('firstName')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nom *</label>
                  <input value={editForm.lastName} onChange={setEdit('lastName')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Email *</label>
                <input type="email" value={editForm.email} onChange={setEdit('email')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Téléphone *</label>
                  <input value={editForm.phone} onChange={setEdit('phone')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">WhatsApp</label>
                  <input value={editForm.whatsappPhone} onChange={setEdit('whatsappPhone')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Rôle *</label>
                <Select value={editForm.role} onChange={setEditVal('role')}
                  options={ROLES_OPTIONS.map(r => ({ value: r.value, label: r.label }))} className="w-full" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                <div className="relative">
                  <input type={showEditPwd ? 'text' : 'password'} value={editForm.password} onChange={setEdit('password')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-sagard-yellow" placeholder="••••••" />
                  <button type="button" onClick={() => setShowEditPwd(!showEditPwd)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showEditPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 -mx-6 px-6 py-4 bg-slate-50">
                <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white transition-colors">Annuler</button>
                <button type="submit" disabled={editSaving}
                  className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-5 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors disabled:opacity-50">
                  {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
