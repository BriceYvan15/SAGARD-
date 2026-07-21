import { useState } from 'react'
import { Loader2, Eye, EyeOff, UserCheck } from 'lucide-react'
import { convertCandidacyToAgent } from '../services/hr.service'
import Select from './Select'
import DatePicker from './DatePicker'

const ROLES = [
  { value: 'AGENT_TERRAIN', label: 'Agent de terrain' },
  { value: 'CONTROLEUR', label: 'Contrôleur' },
  { value: 'TECHNICIENNE_SURFACE', label: 'Technicien(ne) de surface' },
  { value: 'AGENT_ACCUEIL', label: "Agent d'accueil" },
]

const SHIFTS = [
  { value: 'JOUR', label: 'Jour' },
  { value: 'NUIT', label: 'Nuit' },
  { value: 'MIXTE', label: 'Mixte (rotation)' },
]

const CONTRACTS = [
  { value: 'ESSAI', label: "Période d'essai" },
  { value: 'CDD', label: 'CDD' },
  { value: 'CDI', label: 'CDI' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'JOURNALIER', label: 'Journalier' },
]

const EDUCATION_LEVELS = [
  'SANS_DIPLOME', 'CEPE', 'BEPC', 'BAC', 'BTS_DUT', 'LICENCE', 'MASTER', 'DOCTORAT', 'AUTRE',
]

interface Props {
  candidacy: any
  onClose: () => void
  onCreated: () => void
}

function pickCv(notes: string | null) {
  if (!notes) return {}
  try { return JSON.parse(notes) } catch { return {} }
}

function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function ConvertToAgentModal({ candidacy, onClose, onCreated }: Props) {
  const cv = pickCv(candidacy.notes)
  const [showPwd, setShowPwd] = useState(false)
  const [showSuccess, setShowSuccess] = useState<{ email: string; password: string; matricule: string } | null>(null)

  const [form, setForm] = useState({
    email: candidacy.email ?? '',
    password: genPassword(),
    role: 'AGENT_TERRAIN',
    position: candidacy.position ?? 'Agent de sécurité',
    shift: 'JOUR',
    contractType: 'ESSAI',
    hireDate: new Date().toISOString().slice(0, 10),
    contractEndDate: '',
    baseSalary: '',
    department: 'Opérations',
    educationLevel: cv.niveauEtude && EDUCATION_LEVELS.includes(cv.niveauEtude) ? cv.niveauEtude : 'BEPC',
    address: cv.adresse ?? '',
    emergencyContact: cv.referenceNom ?? '',
    emergencyPhone: cv.referencePhone ?? '',
    emergencyRelation: '',
    bankAccount: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.email || !form.password || !form.baseSalary) {
      setError('Email, mot de passe et salaire sont obligatoires')
      return
    }
    if (form.password.length < 6) {
      setError('Mot de passe trop court (minimum 6 caractères)')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        baseSalary: parseFloat(form.baseSalary),
        contractEndDate: form.contractEndDate || undefined,
      }
      const res = await convertCandidacyToAgent(candidacy.id, payload)
      setShowSuccess({ email: form.email, password: form.password, matricule: res.agent.matricule })
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Erreur lors de la création de l'agent")
    } finally {
      setSaving(false)
    }
  }

  const copyCredentials = async () => {
    if (!showSuccess) return
    const txt = `Identifiants SAGARD\nMatricule: ${showSuccess.matricule}\nEmail: ${showSuccess.email}\nMot de passe: ${showSuccess.password}`
    try { await navigator.clipboard.writeText(txt) } catch {}
  }

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="px-6 py-5 border-b border-slate-100 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCheck className="text-emerald-600" size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Agent créé avec succès</h2>
            <p className="text-xs text-slate-500 mt-1">Communiquez ces identifiants à l'agent</p>
          </div>
          <div className="p-6 space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm space-y-2">
              <div><span className="text-slate-500">Matricule :</span> <span className="font-bold text-slate-800">{showSuccess.matricule}</span></div>
              <div><span className="text-slate-500">Email :</span> <span className="font-bold text-slate-800">{showSuccess.email}</span></div>
              <div><span className="text-slate-500">Mot de passe :</span> <span className="font-bold text-purple-700">{showSuccess.password}</span></div>
            </div>
            <button onClick={copyCredentials} className="w-full py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
              📋 Copier les identifiants
            </button>
            <button onClick={() => { onCreated(); onClose() }} className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700">
              Fermer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Finaliser l'intégration & créer l'agent</h2>
            <p className="text-xs text-slate-500">{candidacy.firstName} {candidacy.lastName} · {candidacy.phone}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        <div className="p-6 space-y-5">
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

          {/* Identifiants */}
          <section className="border border-purple-200 bg-purple-50/50 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wide">Identifiants de connexion</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email professionnel *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="prenom.nom@sagard.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe * (6 caractères min.)</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} className="input-field pr-20" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button type="button" onClick={() => setShowPwd(s => !s)} className="p-1 text-slate-400 hover:text-slate-700">
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button type="button" onClick={() => set('password', genPassword())} className="text-[10px] px-1.5 py-1 bg-purple-100 text-purple-700 rounded font-semibold hover:bg-purple-200">
                      🎲
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-purple-700">⚠️ Notez ces identifiants — ils seront affichés une seule fois après création.</p>
          </section>

          {/* Poste & contrat */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Poste & contrat</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle système *</label>
                <Select value={form.role} onChange={v => set('role', v)}
                  options={ROLES.map(r => ({ value: r.value, label: r.label }))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Poste / Fonction *</label>
                <input value={form.position} onChange={e => set('position', e.target.value)} className="input-field" placeholder="Ex: Agent de sécurité" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Service / Département</label>
                <input value={form.department} onChange={e => set('department', e.target.value)} className="input-field" placeholder="Opérations" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Shift</label>
                <Select value={form.shift} onChange={v => set('shift', v)}
                  options={SHIFTS.map(s => ({ value: s.value, label: s.label }))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Type de contrat *</label>
                <Select value={form.contractType} onChange={v => set('contractType', v)}
                  options={CONTRACTS.map(c => ({ value: c.value, label: c.label }))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Salaire de base (FCFA) *</label>
                <input type="number" value={form.baseSalary} onChange={e => set('baseSalary', e.target.value)} className="input-field" placeholder="100000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date d'embauche *</label>
                <DatePicker value={form.hireDate} onChange={v => set('hireDate', v)} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fin de contrat (si CDD/Essai)</label>
                <DatePicker value={form.contractEndDate} onChange={v => set('contractEndDate', v)} className="w-full" />
              </div>
            </div>
          </section>

          {/* Infos perso */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Niveau d'étude</label>
                <Select value={form.educationLevel} onChange={v => set('educationLevel', v)}
                  options={EDUCATION_LEVELS.map(n => ({ value: n, label: n }))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Compte bancaire (RIB)</label>
                <input value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} className="input-field" placeholder="Optionnel" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} className="input-field" placeholder="Quartier, commune" />
              </div>
            </div>
          </section>

          {/* Contact d'urgence */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contact d'urgence</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom complet</label>
                <input value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label>
                <input value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lien (parent, conjoint…)</label>
                <input value={form.emergencyRelation} onChange={e => set('emergencyRelation', e.target.value)} className="input-field" placeholder="Père, mère, époux…" />
              </div>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
          <button onClick={submit} disabled={saving} className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
            Créer l'agent
          </button>
        </div>
      </div>
    </div>
  )
}
