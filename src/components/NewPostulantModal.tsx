import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createCandidacy } from '../services/hr.service'

const POSITIONS = [
  'Agent de sécurité',
  "Agent d'accueil",
  'Contrôleur',
  'Technicien(ne) de surface',
  'Chef de poste',
  'Autre',
]

const NIVEAUX_ETUDE = ['Aucun', 'Primaire', 'BEPC', 'BAC', 'BAC+2', 'BAC+3', 'BAC+4/5', 'Autre']
const SITUATIONS = ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function NewPostulantModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    cniNumber: '',
    position: 'Agent de sécurité',
  })
  const [cv, setCv] = useState({
    dateNaissance: '',
    lieuNaissance: '',
    situationMatrimoniale: 'Célibataire',
    nombreEnfants: '',
    adresse: '',
    niveauEtude: 'BEPC',
    diplome: '',
    experiencesSecurite: '',
    experiencesAutres: '',
    ancienEmployeur: '',
    dureeExperience: '',
    competences: '',
    langues: 'Français',
    permisConduire: 'Non',
    disponibilite: 'Immédiate',
    pretentionSalariale: '',
    referenceNom: '',
    referencePhone: '',
    observation: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setCvField = (k: string, v: string) => setCv(f => ({ ...f, [k]: v }))

  const goToStep2 = () => {
    if (!form.firstName || !form.lastName || !form.phone) {
      setError('Nom, prénom et téléphone sont obligatoires')
      return
    }
    setError('')
    setStep(2)
  }

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      const notes = JSON.stringify(cv)
      await createCandidacy({ ...form, notes })
      onCreated()
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Enregistrer un postulant</h2>
            <p className="text-xs text-slate-400">Étape {step}/2 — {step === 1 ? 'Informations personnelles' : 'Mini CV'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        <div className="px-6 pt-3">
          <div className="flex gap-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-slate-200'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-slate-200'}`} />
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom *">
                  <input value={form.firstName} onChange={e => set('firstName', e.target.value)} className="input-field" placeholder="Prénom" />
                </Field>
                <Field label="Nom *">
                  <input value={form.lastName} onChange={e => set('lastName', e.target.value)} className="input-field" placeholder="Nom" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Téléphone *">
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0X XX XX XX XX" />
                </Field>
                <Field label="Email">
                  <input value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="email@exemple.com" type="email" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="N° CNI">
                  <input value={form.cniNumber} onChange={e => set('cniNumber', e.target.value)} className="input-field" placeholder="N° pièce d'identité" />
                </Field>
                <Field label="Poste souhaité">
                  <select value={form.position} onChange={e => set('position', e.target.value)} className="input-field">
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="border border-slate-200 rounded-lg p-3 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">État civil</h3>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Date de naissance">
                    <input type="date" value={cv.dateNaissance} onChange={e => setCvField('dateNaissance', e.target.value)} className="input-field" />
                  </Field>
                  <Field label="Lieu de naissance">
                    <input value={cv.lieuNaissance} onChange={e => setCvField('lieuNaissance', e.target.value)} className="input-field" placeholder="Ville / Pays" />
                  </Field>
                  <Field label="Situation matrimoniale">
                    <select value={cv.situationMatrimoniale} onChange={e => setCvField('situationMatrimoniale', e.target.value)} className="input-field">
                      {SITUATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre d'enfants">
                    <input value={cv.nombreEnfants} onChange={e => setCvField('nombreEnfants', e.target.value)} className="input-field" placeholder="0" type="number" />
                  </Field>
                  <Field label="Adresse / Quartier">
                    <input value={cv.adresse} onChange={e => setCvField('adresse', e.target.value)} className="input-field" placeholder="Quartier, Commune" />
                  </Field>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Formation & Diplômes</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Niveau d'étude">
                    <select value={cv.niveauEtude} onChange={e => setCvField('niveauEtude', e.target.value)} className="input-field">
                      {NIVEAUX_ETUDE.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                  <Field label="Diplôme obtenu">
                    <input value={cv.diplome} onChange={e => setCvField('diplome', e.target.value)} className="input-field" placeholder="Ex: BEPC, CAP Sécurité..." />
                  </Field>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Expérience professionnelle</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expérience en sécurité">
                    <input value={cv.experiencesSecurite} onChange={e => setCvField('experiencesSecurite', e.target.value)} className="input-field" placeholder="Ex: 2 ans chez ABC Sécurité" />
                  </Field>
                  <Field label="Autres expériences">
                    <input value={cv.experiencesAutres} onChange={e => setCvField('experiencesAutres', e.target.value)} className="input-field" placeholder="Ex: 1 an manutention" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Dernier employeur">
                    <input value={cv.ancienEmployeur} onChange={e => setCvField('ancienEmployeur', e.target.value)} className="input-field" placeholder="Nom de la société" />
                  </Field>
                  <Field label="Durée totale d'expérience">
                    <input value={cv.dureeExperience} onChange={e => setCvField('dureeExperience', e.target.value)} className="input-field" placeholder="Ex: 3 ans" />
                  </Field>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Compétences & Disponibilité</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Compétences particulières">
                    <input value={cv.competences} onChange={e => setCvField('competences', e.target.value)} className="input-field" placeholder="Ex: premiers secours, incendie" />
                  </Field>
                  <Field label="Langues parlées">
                    <input value={cv.langues} onChange={e => setCvField('langues', e.target.value)} className="input-field" placeholder="Français, Dioula..." />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Permis de conduire">
                    <select value={cv.permisConduire} onChange={e => setCvField('permisConduire', e.target.value)} className="input-field">
                      <option value="Non">Non</option>
                      <option value="A">Catégorie A (moto)</option>
                      <option value="B">Catégorie B (voiture)</option>
                      <option value="C">Catégorie C (poids lourd)</option>
                      <option value="AB">A + B</option>
                    </select>
                  </Field>
                  <Field label="Disponibilité">
                    <select value={cv.disponibilite} onChange={e => setCvField('disponibilite', e.target.value)} className="input-field">
                      <option value="Immédiate">Immédiate</option>
                      <option value="1 semaine">Dans 1 semaine</option>
                      <option value="2 semaines">Dans 2 semaines</option>
                      <option value="1 mois">Dans 1 mois</option>
                    </select>
                  </Field>
                  <Field label="Prétention salariale">
                    <input value={cv.pretentionSalariale} onChange={e => setCvField('pretentionSalariale', e.target.value)} className="input-field" placeholder="Ex: 100 000 FCFA" />
                  </Field>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Personne de référence</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nom de la référence">
                    <input value={cv.referenceNom} onChange={e => setCvField('referenceNom', e.target.value)} className="input-field" placeholder="Nom complet" />
                  </Field>
                  <Field label="Téléphone référence">
                    <input value={cv.referencePhone} onChange={e => setCvField('referencePhone', e.target.value)} className="input-field" placeholder="0X XX XX XX XX" />
                  </Field>
                </div>
              </div>

              <Field label="Observation / Remarque">
                <textarea value={cv.observation} onChange={e => setCvField('observation', e.target.value)} className="input-field h-16 resize-none" placeholder="Impression générale, ponctualité, présentation..." />
              </Field>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-between">
          <div>
            {step === 2 && (
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium">
                ← Retour
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
            {step === 1 ? (
              <button onClick={goToStep2} className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700">
                Suivant → Mini CV
              </button>
            ) : (
              <button onClick={submit} disabled={saving} className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer le postulant'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
