import { useState, useEffect } from 'react'
import {
  Settings, Building2, Shield, Bell, Palette, Save, Loader2,
  Check, Globe, Clock, Lock, Database, FileText, Plus, X, Trash2,
} from 'lucide-react'
import { hasAccess } from '../lib/roles'
import { getUser, ROLE_LABELS } from '../lib/auth'

type Tab = 'entreprise' | 'securite' | 'notifications' | 'systeme' | 'facturation'

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'entreprise',    label: 'Entreprise',    icon: Building2 },
  { id: 'facturation',   label: 'Facturation',   icon: FileText },
  { id: 'securite',      label: 'Sécurité',      icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'systeme',       label: 'Système',       icon: Database },
]

export default function Parametres() {
  const [activeTab, setActiveTab] = useState<Tab>('entreprise')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const user = getUser()

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Settings size={22} /> Paramètres</h1>
          <p className="text-sm text-slate-400 mt-0.5">Configuration du système</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-56 space-y-1 flex-shrink-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-sagard-yellow text-sagard-dark' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {activeTab === 'entreprise' && <EntrepriseTab />}
          {activeTab === 'facturation' && <FacturationTab />}
          {activeTab === 'securite' && <SecuriteTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'systeme' && <SystemeTab />}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Icon size={18} /> {title}</h2>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sagard-yellow" />
    </div>
  )
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-sagard-yellow' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function EntrepriseTab() {
  const [companyName, setCompanyName] = useState('SAGARD SÉCURITÉ')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyAddress, setCompanyAddress] = useState('Abidjan, Côte d\'Ivoire')
  const [rccm, setRccm] = useState('')
  const [ncc, setNcc] = useState('')

  return (
    <div className="space-y-6">
      <SectionTitle icon={Building2} title="Informations de l'entreprise" sub="Données affichées sur les documents officiels" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Raison sociale" value={companyName} onChange={setCompanyName} />
        <Field label="Téléphone" value={companyPhone} onChange={setCompanyPhone} />
        <Field label="Email" value={companyEmail} onChange={setCompanyEmail} type="email" />
        <Field label="Adresse" value={companyAddress} onChange={setCompanyAddress} />
        <Field label="RCCM" value={rccm} onChange={setRccm} />
        <Field label="NCC" value={ncc} onChange={setNcc} />
      </div>
    </div>
  )
}

function SecuriteTab() {
  const [minPwd, setMinPwd] = useState('8')
  const [sessionTimeout, setSessionTimeout] = useState('480')
  const [forceReset, setForceReset] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)

  return (
    <div className="space-y-6">
      <SectionTitle icon={Lock} title="Sécurité des comptes" sub="Politique de mots de passe et sessions" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Longueur minimum mot de passe" value={minPwd} onChange={setMinPwd} type="number" />
        <Field label="Timeout session (minutes)" value={sessionTimeout} onChange={setSessionTimeout} type="number" />
      </div>
      <div className="mt-4">
        <Toggle label="Forcer le changement de mot de passe" sub="Les utilisateurs devront changer leur mot de passe à la première connexion" checked={forceReset} onChange={setForceReset} />
        <Toggle label="Authentification à deux facteurs" sub="Activer la 2FA pour tous les utilisateurs" checked={twoFactor} onChange={setTwoFactor} />
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [newProspect, setNewProspect] = useState(true)
  const [prospectStagnant, setProspectStagnant] = useState(true)
  const [prospectConverted, setProspectConverted] = useState(true)
  const [contractExpiry, setContractExpiry] = useState(true)
  const [overdueInvoice, setOverdueInvoice] = useState(true)
  const [agentAlert, setAgentAlert] = useState(true)

  return (
    <div className="space-y-6">
      <SectionTitle icon={Bell} title="Préférences de notification" sub="Choisissez les événements pour lesquels vous souhaitez être notifié" />
      <Toggle label="Nouveau prospect" sub="Notification lorsqu'un commercial enregistre un nouveau prospect" checked={newProspect} onChange={setNewProspect} />
      <Toggle label="Prospect stagnant" sub="Alerte quand un prospect n'a pas avancé depuis 7 jours" checked={prospectStagnant} onChange={setProspectStagnant} />
      <Toggle label="Conversion prospect → client" sub="Notification lorsqu'un prospect est converti en client" checked={prospectConverted} onChange={setProspectConverted} />
      <Toggle label="Expiration de contrat" sub="Alerte 30 jours avant l'expiration d'un contrat de gardiennage" checked={contractExpiry} onChange={setContractExpiry} />
      <Toggle label="Facture en retard" sub="Notification pour les factures impayées passées l'échéance" checked={overdueInvoice} onChange={setOverdueInvoice} />
      <Toggle label="Alertes terrain" sub="Notifications des agents terrain (incidents, pointages)" checked={agentAlert} onChange={setAgentAlert} />
    </div>
  )
}

function FacturationTab() {
  const STORAGE_KEY_DESIG = 'sagard_invoice_designations'
  const STORAGE_KEY_ACCTS = 'sagard_accounting_accounts'

  const defaultDesignations = [
    'Gardiennage statique',
    'Gardiennage mobile / Patrouille',
    'Protection rapprochée VIP',
    'Surveillance événementielle',
    'Escorte de fonds',
    'Installation vidéosurveillance',
    'Maintenance système de sécurité',
    'Formation sécurité',
    'Frais de mise en service',
  ]

  const defaultAccounts = [
    { code: '411', label: 'Clients' },
    { code: '512', label: 'Banque' },
    { code: '531', label: 'Caisse' },
    { code: '601', label: 'Achats de matières' },
    { code: '613', label: 'Locations' },
    { code: '641', label: 'Rémunérations du personnel' },
    { code: '706', label: 'Prestations de services' },
  ]

  const [designations, setDesignations] = useState<string[]>(() => {
    try { const s = localStorage.getItem(STORAGE_KEY_DESIG); return s ? JSON.parse(s) : defaultDesignations }
    catch { return defaultDesignations }
  })
  const [accounts, setAccounts] = useState<{ code: string; label: string }[]>(() => {
    try { const s = localStorage.getItem(STORAGE_KEY_ACCTS); return s ? JSON.parse(s) : defaultAccounts }
    catch { return defaultAccounts }
  })
  const [newDesig, setNewDesig] = useState('')
  const [newAcctCode, setNewAcctCode] = useState('')
  const [newAcctLabel, setNewAcctLabel] = useState('')

  useEffect(() => { localStorage.setItem(STORAGE_KEY_DESIG, JSON.stringify(designations)) }, [designations])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_ACCTS, JSON.stringify(accounts)) }, [accounts])

  return (
    <div className="space-y-8">
      {/* Désignations factures */}
      <div>
        <SectionTitle icon={FileText} title="Désignations de facturation" sub="Éléments disponibles dans la liste déroulante lors de la création de factures" />
        <div className="space-y-2 mb-4">
          {designations.map((d, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 group">
              <span className="text-sm text-slate-700">{d}</span>
              <button onClick={() => setDesignations(prev => prev.filter((_, idx) => idx !== i))}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1 rounded">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {designations.length === 0 && <p className="text-sm text-slate-400 italic">Aucune désignation configurée</p>}
        </div>
        <div className="flex gap-2">
          <input value={newDesig} onChange={e => setNewDesig(e.target.value)} placeholder="Nouvelle désignation..."
            onKeyDown={e => { if (e.key === 'Enter' && newDesig.trim()) { setDesignations(prev => [...prev, newDesig.trim()]); setNewDesig('') } }}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none" />
          <button onClick={() => { if (newDesig.trim()) { setDesignations(prev => [...prev, newDesig.trim()]); setNewDesig('') } }}
            disabled={!newDesig.trim()}
            className="flex items-center gap-1 px-4 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-50">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {/* Comptes comptables */}
      <div>
        <SectionTitle icon={Database} title="Plan comptable" sub="Comptes disponibles pour la saisie comptable (journal, dépenses)" />
        <div className="space-y-2 mb-4">
          {accounts.map((a, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 group">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{a.code}</span>
                <span className="text-sm text-slate-700">{a.label}</span>
              </div>
              <button onClick={() => setAccounts(prev => prev.filter((_, idx) => idx !== i))}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1 rounded">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {accounts.length === 0 && <p className="text-sm text-slate-400 italic">Aucun compte configuré</p>}
        </div>
        <div className="flex gap-2">
          <input value={newAcctCode} onChange={e => setNewAcctCode(e.target.value)} placeholder="Code (ex: 706)"
            className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none" />
          <input value={newAcctLabel} onChange={e => setNewAcctLabel(e.target.value)} placeholder="Libellé du compte..."
            onKeyDown={e => { if (e.key === 'Enter' && newAcctCode.trim() && newAcctLabel.trim()) { setAccounts(prev => [...prev, { code: newAcctCode.trim(), label: newAcctLabel.trim() }]); setNewAcctCode(''); setNewAcctLabel('') } }}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none" />
          <button onClick={() => { if (newAcctCode.trim() && newAcctLabel.trim()) { setAccounts(prev => [...prev, { code: newAcctCode.trim(), label: newAcctLabel.trim() }]); setNewAcctCode(''); setNewAcctLabel('') } }}
            disabled={!newAcctCode.trim() || !newAcctLabel.trim()}
            className="flex items-center gap-1 px-4 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-50">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}

function SystemeTab() {
  return (
    <div className="space-y-6">
      <SectionTitle icon={Database} title="Informations système" sub="Détails techniques de la plateforme" />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Version</p>
          <p className="text-sm font-bold text-slate-700">SAGARD ERP v1.0.0</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Environnement</p>
          <p className="text-sm font-bold text-slate-700">Production</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Base de données</p>
          <p className="text-sm font-bold text-slate-700">PostgreSQL 16</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">API</p>
          <p className="text-sm font-bold text-slate-700">NestJS v10</p>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
        <p className="text-sm font-bold text-amber-700 flex items-center gap-2"><Globe size={14} /> Fuseau horaire</p>
        <p className="text-xs text-amber-600 mt-1">Afrique/Abidjan (UTC+0)</p>
      </div>
    </div>
  )
}
