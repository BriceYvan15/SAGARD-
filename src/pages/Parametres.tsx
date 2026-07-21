import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Settings, Building2, Shield, Bell, Palette, Save, Loader2,
  Check, Globe, Clock, Lock, Database, FileText, Plus, X, Trash2, Users, Calculator, MapPin, Download, RefreshCw,
} from 'lucide-react'
import { hasAccess } from '../lib/roles'
import { getUser, ROLE_LABELS } from '../lib/auth'

import { getSettings, updateSettings, backupDatabase } from '../services/settings.service'
import { getServiceCatalog, createCatalogItem, updateCatalogItem, deleteCatalogItem, resetCatalog } from '../services/invoices.service'
import { getAccounts, createAccount, deleteAccount, resetAccounts } from '../services/accounting.service'
import toast from 'react-hot-toast'

type Tab = 'entreprise' | 'facturation' | 'comptabilite' | 'clients' | 'sites' | 'securite' | 'notifications' | 'systeme'

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'entreprise',    label: 'Entreprise',     icon: Building2 },
  { id: 'facturation',   label: 'Facturation',    icon: FileText },
  { id: 'comptabilite',  label: 'Comptabilité',   icon: Calculator },
  { id: 'clients',       label: 'Clients',        icon: Users },
  { id: 'sites',         label: 'Sites',          icon: MapPin },
  { id: 'securite',      label: 'Sécurité',       icon: Shield },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'systeme',       label: 'Système',        icon: Database },
]

export default function Parametres() {
  if (!hasAccess('parametres')) {
    return <Navigate to="/" replace />
  }

  const [activeTab, setActiveTab] = useState<Tab>('entreprise')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const user = getUser()

  // Company settings state — shared with EntrepriseTab
  const [companyName, setCompanyName] = useState('SAGARD SÉCURITÉ')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyAddress, setCompanyAddress] = useState("Abidjan, Côte d'Ivoire")
  const [rccm, setRccm] = useState('')
  const [ncc, setNcc] = useState('')

  // Load settings from database on mount
  useEffect(() => {
    getSettings()
      .then((s: any) => {
        if (s) {
          setCompanyName(s.name || 'SAGARD SÉCURITÉ')
          setCompanyPhone(s.phone || '')
          setCompanyEmail(s.email || '')
          setCompanyAddress(s.address || "Abidjan, Côte d'Ivoire")
          setRccm(s.rccm || '')
          setNcc(s.ncc || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings({
        name: companyName,
        phone: companyPhone,
        email: companyEmail,
        address: companyAddress,
        rccm,
        ncc,
      })
      setSaved(true)
      toast.success('Paramètres enregistrés avec succès')
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
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

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Sidebar tabs */}
        <div className="flex gap-1 overflow-x-auto sm:overflow-x-visible sm:flex-col sm:w-56 sm:space-y-1 sm:flex-shrink-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-sagard-yellow text-sagard-dark' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          {activeTab === 'entreprise' && (
            <EntrepriseTab
              companyName={companyName} setCompanyName={setCompanyName}
              companyPhone={companyPhone} setCompanyPhone={setCompanyPhone}
              companyEmail={companyEmail} setCompanyEmail={setCompanyEmail}
              companyAddress={companyAddress} setCompanyAddress={setCompanyAddress}
              rccm={rccm} setRccm={setRccm}
              ncc={ncc} setNcc={setNcc}
              loading={loadingSettings}
            />
          )}
          {activeTab === 'facturation' && <FacturationTab />}
          {activeTab === 'comptabilite' && <ComptabiliteTab />}
          {activeTab === 'clients' && <ClientsTab />}
          {activeTab === 'sites' && <SitesTab />}
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

function EntrepriseTab({
  companyName, setCompanyName,
  companyPhone, setCompanyPhone,
  companyEmail, setCompanyEmail,
  companyAddress, setCompanyAddress,
  rccm, setRccm,
  ncc, setNcc,
  loading,
}: {
  companyName: string; setCompanyName: (v: string) => void
  companyPhone: string; setCompanyPhone: (v: string) => void
  companyEmail: string; setCompanyEmail: (v: string) => void
  companyAddress: string; setCompanyAddress: (v: string) => void
  rccm: string; setRccm: (v: string) => void
  ncc: string; setNcc: (v: string) => void
  loading: boolean
}) {
  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="animate-spin text-slate-300" size={24} />
    </div>
  )

  return (
    <div className="space-y-6">
      <SectionTitle icon={Building2} title="Informations de l'entreprise" sub="Données affichées sur les documents officiels et utilisées pour l'envoi d'e-mails" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  const STORAGE_KEY = 'sagard_invoice_designations'

  const [catalog, setCatalog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newDesc, setNewDesc] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')

  const loadCatalog = async () => {
    setLoading(true)
    try {
      const data = await getServiceCatalog()
      setCatalog(data)
    } catch { toast.error('Erreur lors du chargement du catalogue') }
    setLoading(false)
  }

  useEffect(() => { loadCatalog() }, [])

  const handleAdd = async () => {
    if (!newDesc.trim()) return
    try {
      const code = newDesc.trim().slice(0, 10).toUpperCase().replace(/\s/g, '_').replace(/[^A-Z0-9_]/g, '')
      await createCatalogItem({ code: `${code}_${Date.now().toString().slice(-4)}`, description: newDesc.trim(), unitPrice: newPrice ? Number(newPrice) : undefined })
      setNewDesc(''); setNewPrice('')
      toast.success('Désignation ajoutée')
      loadCatalog()
    } catch { toast.error('Erreur lors de l\'ajout') }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCatalogItem(id)
      toast.success('Désignation supprimée')
      loadCatalog()
    } catch { toast.error('Erreur lors de la suppression') }
  }

  const handleSavePrice = async (id: string) => {
    try {
      await updateCatalogItem(id, { unitPrice: Number(editPrice) })
      setEditingId(null); setEditPrice('')
      toast.success('Prix mis à jour')
      loadCatalog()
    } catch { toast.error('Erreur lors de la mise à jour') }
  }

  const handleReset = async () => {
    if (!confirm('Voulez-vous vraiment réinitialiser le catalogue avec la liste par défaut ? Les modifications seront perdues.')) return
    try {
      await resetCatalog()
      toast.success('Catalogue réinitialisé')
      loadCatalog()
    } catch { toast.error('Erreur lors de la réinitialisation') }
  }

  const customDesignations: string[] = (() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })()

  return (
    <div className="space-y-5">
      <SectionTitle icon={FileText} title="Désignations de facturation" sub="Éléments disponibles dans la liste déroulante lors de la création de factures, devis et proforma" />

      <div className="flex justify-end">
        <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          <RefreshCw size={12} /> Réinitialiser la liste par défaut
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl p-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
        ) : (
          <div className="space-y-1.5 mb-4 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
            {catalog.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded shrink-0">{item.code}</span>
                  <span className="text-sm text-slate-700 truncate">{item.description}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {editingId === item.id ? (
                    <>
                      <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                        className="w-28 px-2 py-1 text-xs border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40"
                        placeholder="Prix XOF" />
                      <button onClick={() => handleSavePrice(item.id)} className="text-green-600 hover:text-green-700 p-1"><Check size={14} /></button>
                      <button onClick={() => { setEditingId(null); setEditPrice('') }} className="text-slate-400 hover:text-slate-600 p-1"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-600">
                        {item.unitPrice ? `${new Intl.NumberFormat('fr-FR').format(Number(item.unitPrice))} XOF` : '—'}
                      </span>
                      <button onClick={() => { setEditingId(item.id); setEditPrice(item.unitPrice ? String(Number(item.unitPrice)) : '') }}
                        className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-600 transition-opacity p-1 text-xs">Modifier</button>
                      <button onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1 rounded">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {catalog.length === 0 && <p className="text-sm text-slate-400 italic">Aucune désignation dans le catalogue</p>}
          </div>
        )}

        <div className="border-t border-slate-100 pt-3">
          <div className="flex gap-2">
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Nouvelle désignation..."
              onKeyDown={e => { if (e.key === 'Enter' && newDesc.trim()) handleAdd() }}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none" />
            <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Prix XOF"
              type="number"
              onKeyDown={e => { if (e.key === 'Enter' && newDesc.trim()) handleAdd() }}
              className="w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none" />
            <button onClick={handleAdd} disabled={!newDesc.trim()}
              className="flex items-center gap-1 px-4 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-50">
              <Plus size={14} /> Ajouter
            </button>
          </div>
          {customDesignations.length > 0 && (
            <p className="text-xs text-slate-400 mt-2 italic">
              {customDesignations.length} désignation(s) personnalisée(s) locale(s) — elles apparaissent aussi dans les listes déroulantes
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ComptabiliteTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [resetting, setResetting] = useState(false)

  const load = () => {
    setLoading(true)
    getAccounts().then((data: any[]) => setItems(data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!newCode.trim() || !newLabel.trim()) return
    try {
      await createAccount({ code: newCode.trim(), label: newLabel.trim() })
      setNewCode(''); setNewLabel('')
      load()
      toast.success('Compte ajouté')
    } catch { toast.error('Erreur lors de l\'ajout') }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id)
      load()
      toast.success('Compte supprimé')
    } catch { toast.error('Erreur lors de la suppression') }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      await resetAccounts()
      load()
      toast.success('Plan comptable réinitialisé')
    } catch { toast.error('Erreur lors de la réinitialisation') }
    finally { setResetting(false) }
  }

  return (
    <div className="space-y-5">
      <SectionTitle icon={Calculator} title="Plan comptable" sub="Comptes disponibles pour la saisie comptable (journal des opérations, dépenses)" />
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-slate-500">{loading ? 'Chargement...' : `${items.length} comptes`}</span>
          <button onClick={handleReset} disabled={resetting}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
            {resetting ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Réinitialiser
          </button>
        </div>
        <div className="space-y-1.5 mb-4 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
          {items.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 group">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{a.code}</span>
                <span className="text-sm text-slate-700">{a.label}</span>
              </div>
              <button onClick={() => handleDelete(a.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1 rounded">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {items.length === 0 && !loading && <p className="text-sm text-slate-400 italic">Aucun compte configuré. Cliquez sur "Réinitialiser" pour charger le plan par défaut.</p>}
        </div>
        <div className="flex gap-2">
          <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Code (ex: 706)"
            className="w-28 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none" />
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Libellé du compte..."
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none" />
          <button onClick={handleAdd}
            disabled={!newCode.trim() || !newLabel.trim()}
            className="flex items-center gap-1 px-4 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-50">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}

function ClientsTab() {
  const STORAGE_KEY = 'sagard_client_segments'

  const defaults = [
    'Résidentiel',
    'Commercial',
    'Industriel',
    'Banque / Finance',
    'Ambassade / Diplomatique',
    'Événementiel',
    'Administration publique',
    'Particulier',
    'Entreprise privée',
    'Institution publique',
    'ONG',
    'Ambassade',
    'Autre',
  ]

  const [items, setItems] = useState<string[]>(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : defaults }
    catch { return defaults }
  })
  const [newItem, setNewItem] = useState('')

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }, [items])

  return (
    <div className="space-y-5">
      <SectionTitle icon={Users} title="Segments clients" sub="Segments disponibles dans la liste déroulante lors de l'enregistrement ou la modification de clients et prospects" />
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-1.5 mb-4 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
          {items.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs rounded-full pl-3 pr-1 py-1 group">
              {s}
              <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                className="text-slate-300 hover:text-red-500 rounded-full p-0.5 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
          {items.length === 0 && <p className="text-xs text-slate-400 italic">Aucun segment</p>}
        </div>
        <div className="flex gap-2">
          <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Nouveau segment..."
            onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { setItems(prev => [...prev, newItem.trim()]); setNewItem('') } }}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none" />
          <button onClick={() => { if (newItem.trim()) { setItems(prev => [...prev, newItem.trim()]); setNewItem('') } }}
            disabled={!newItem.trim()}
            className="flex items-center gap-1 px-4 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-50">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}

function SitesTab() {
  const STORAGE_KEY = 'sagard_site_types'

  const defaults = [
    'Villa / Résidence',
    'Immeuble',
    'Entrepôt',
    'Usine',
    'Bureau',
    'Commerce',
    'Banque / Agence',
    'Chantier',
    'Autre',
  ]

  const [items, setItems] = useState<string[]>(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : defaults }
    catch { return defaults }
  })
  const [newItem, setNewItem] = useState('')

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }, [items])

  return (
    <div className="space-y-5">
      <SectionTitle icon={MapPin} title="Types de sites gardiennés" sub="Types de sites disponibles dans la liste déroulante lors de la création ou modification d'un site" />
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-1.5 mb-4 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
          {items.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs rounded-full pl-3 pr-1 py-1 group">
              {s}
              <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                className="text-slate-300 hover:text-red-500 rounded-full p-0.5 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
          {items.length === 0 && <p className="text-xs text-slate-400 italic">Aucun type de site</p>}
        </div>
        <div className="flex gap-2">
          <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Nouveau type de site..."
            onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { setItems(prev => [...prev, newItem.trim()]); setNewItem('') } }}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sagard-yellow/40 focus:outline-none" />
          <button onClick={() => { if (newItem.trim()) { setItems(prev => [...prev, newItem.trim()]); setNewItem('') } }}
            disabled={!newItem.trim()}
            className="flex items-center gap-1 px-4 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-50">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}

function SystemeTab() {
  const [backingUp, setBackingUp] = useState(false)

  const handleBackup = async () => {
    setBackingUp(true)
    try {
      await backupDatabase()
      toast.success('Backup téléchargé avec succès')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du backup')
    } finally {
      setBackingUp(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle icon={Database} title="Informations système" sub="Détails techniques de la plateforme" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Backup section */}
      <div className="border border-slate-200 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Database size={16} /> Sauvegarde de la base de données</h3>
            <p className="text-xs text-slate-400 mt-1">Télécharger un dump SQL complet de la base de données de production</p>
          </div>
          <button onClick={handleBackup} disabled={backingUp}
            className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-50 transition-colors">
            {backingUp ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {backingUp ? 'Sauvegarde...' : 'Télécharger le backup'}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
        <p className="text-sm font-bold text-amber-700 flex items-center gap-2"><Globe size={14} /> Fuseau horaire</p>
        <p className="text-xs text-amber-600 mt-1">Afrique/Abidjan (UTC+0)</p>
      </div>
    </div>
  )
}
