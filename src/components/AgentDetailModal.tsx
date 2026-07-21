import { useEffect, useState } from 'react'
import { X, Loader2, User, Briefcase, Phone, Mail, MapPin, Shield, Calendar, Clock, CreditCard, Heart, Package, GraduationCap, Pencil, Trash2, Save } from 'lucide-react'
import { getAgent, updateAgent, deleteAgent } from '../services/agents.service'
import { fmtDate } from '../lib/utils'
import AuditHistory from './AuditHistory'
import Select from './Select'
import DatePicker from './DatePicker'

interface Props {
  agentId: string
  onClose: () => void
  onRefresh?: () => void
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  EN_POSTE:     { label: 'En poste',       cls: 'bg-green-100 text-green-700' },
  DISPONIBLE:   { label: 'Disponible',     cls: 'bg-blue-100 text-blue-700' },
  EN_CONGE:     { label: 'En conge',       cls: 'bg-blue-100 text-blue-700' },
  EN_FORMATION: { label: 'Formation',      cls: 'bg-amber-100 text-amber-700' },
  INACTIF:      { label: 'Inactif',        cls: 'bg-slate-100 text-slate-500' },
  RECRUTE:      { label: 'Recrute',        cls: 'bg-purple-100 text-purple-700' },
}

const SHIFT_LABELS: Record<string, string> = { JOUR: 'Jour', NUIT: 'Nuit', MIXTE: 'Mixte' }
const CONTRACT_LABELS: Record<string, string> = { CDD: 'CDD', CDI: 'CDI', ESSAI: "Periode d'essai", STAGE: 'Stage', JOURNALIER: 'Journalier' }
const EDUCATION_LABELS: Record<string, string> = {
  SANS_DIPLOME: 'Sans diplome', CEPE: 'CEPE', BEPC: 'BEPC', BAC: 'BAC',
  BTS_DUT: 'BTS / DUT', LICENCE: 'Licence', MASTER: 'Master', DOCTORAT: 'Doctorat', AUTRE: 'Autre',
}
const BEHAVIOR_LABELS: Record<string, { label: string; cls: string }> = {
  EXEMPLAIRE: { label: 'Exemplaire', cls: 'text-emerald-600 bg-emerald-50' },
  BON: { label: 'Bon', cls: 'text-blue-600 bg-blue-50' },
  NORMAL: { label: 'Normal', cls: 'text-slate-600 bg-slate-50' },
  INDISCIPLINE: { label: 'Indiscipline', cls: 'text-red-600 bg-red-50' },
}

const COLORS = ['bg-blue-500','bg-purple-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-cyan-500']

export default function AgentDetailModal({ agentId, onClose, onRefresh }: Props) {
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'info' | 'travail' | 'historique' | 'audit'>('info')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAgent(agentId)
      .then(setAgent)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [agentId])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-12 shadow-2xl">
          <Loader2 className="animate-spin text-sagard-yellow mx-auto" size={32} />
          <p className="text-sm text-slate-500 mt-3">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <p className="text-red-600 font-medium">Agent introuvable</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg text-sm">Fermer</button>
        </div>
      </div>
    )
  }

  const u = agent.user ?? {}
  const initials = (u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')
  const colorIdx = ((u.firstName?.charCodeAt(0) ?? 0) + (u.lastName?.charCodeAt(0) ?? 0)) % COLORS.length
  const st = STATUS_CFG[agent.status] ?? { label: agent.status, cls: 'bg-slate-100 text-slate-500' }
  const beh = BEHAVIOR_LABELS[agent.behaviorRating] ?? BEHAVIOR_LABELS.NORMAL
  const activeSite = agent.deployments?.find((d: any) => d.isActive)?.site

  const startEdit = () => {
    setEditForm({
      position: agent.position ?? '',
      shift: agent.shift ?? 'JOUR',
      department: agent.department ?? '',
      baseSalary: agent.baseSalary ?? '',
      contractType: agent.contractType ?? '',
      contractEndDate: agent.contractEndDate ? agent.contractEndDate.slice(0, 10) : '',
      address: agent.address ?? '',
      cniNumber: agent.cniNumber ?? '',
      emergencyContact: agent.emergencyContact ?? '',
      emergencyPhone: agent.emergencyPhone ?? '',
      emergencyRelation: agent.emergencyRelation ?? '',
      status: agent.status ?? 'EN_POSTE',
    })
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateAgent(agentId, {
        ...editForm,
        baseSalary: editForm.baseSalary ? Number(editForm.baseSalary) : undefined,
        contractEndDate: editForm.contractEndDate ? new Date(editForm.contractEndDate) : undefined,
      })
      const updated = await getAgent(agentId)
      setAgent(updated)
      setEditing(false)
      onRefresh?.()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Desactiver l'agent ${u.firstName} ${u.lastName} ?`)) return
    await deleteAgent(agentId)
    onRefresh?.()
    onClose()
  }

  const tabs = [
    { key: 'info' as const, label: 'Informations' },
    { key: 'travail' as const, label: 'Travail' },
    { key: 'historique' as const, label: 'Historique' },
    { key: 'audit' as const, label: 'Modifications' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col" onMouseDown={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full ${COLORS[colorIdx]} text-white text-lg font-bold flex items-center justify-center shadow-md`}>
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{u.firstName} {u.lastName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{agent.matricule}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${beh.cls}`}>{beh.label}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!editing ? (
                <>
                  <button onClick={startEdit} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                    <Pencil size={12} /> Modifier
                  </button>
                  <button onClick={handleDelete} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                    <Trash2 size={12} /> Supprimer
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors">
                    <Save size={12} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors">
                    Annuler
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-sagard-yellow text-sagard-dark' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'info' && (
            <div className="space-y-6">
              {/* Informations personnelles */}
              <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User size={14} /> Informations personnelles
                </h3>
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <EditField label="N° CNI" value={editForm.cniNumber} onChange={v => setEditForm((f: any) => ({ ...f, cniNumber: v }))} />
                    <EditField label="Adresse" value={editForm.address} onChange={v => setEditForm((f: any) => ({ ...f, address: v }))} />
                    <EditField label="Contact d'urgence" value={editForm.emergencyContact} onChange={v => setEditForm((f: any) => ({ ...f, emergencyContact: v }))} />
                    <EditField label="Tél. urgence" value={editForm.emergencyPhone} onChange={v => setEditForm((f: any) => ({ ...f, emergencyPhone: v }))} />
                    <EditField label="Lien parental" value={editForm.emergencyRelation} onChange={v => setEditForm((f: any) => ({ ...f, emergencyRelation: v }))} />
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
                      <Select value={editForm.status} onChange={v => setEditForm((f: any) => ({ ...f, status: v }))}
                        options={Object.entries(STATUS_CFG).map(([k, v]) => ({ value: k, label: v.label }))} className="w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={User} label="Nom complet" value={`${u.firstName} ${u.lastName}`} />
                    <InfoRow icon={Phone} label="Telephone" value={u.phone} />
                    <InfoRow icon={Mail} label="Email" value={u.email} />
                    <InfoRow icon={Shield} label="N° CNI" value={agent.cniNumber} />
                    <InfoRow icon={MapPin} label="Adresse" value={agent.address} />
                    <InfoRow icon={GraduationCap} label="Niveau d'etude" value={EDUCATION_LABELS[agent.educationLevel] ?? agent.educationLevel} />
                  </div>
                )}
              </section>

              {/* Contact d'urgence */}
              {!editing && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Heart size={14} /> Contact d'urgence
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={User} label="Nom" value={agent.emergencyContact} />
                    <InfoRow icon={Phone} label="Telephone" value={agent.emergencyPhone} />
                    <InfoRow icon={Heart} label="Lien parental" value={agent.emergencyRelation} />
                  </div>
                </section>
              )}
            </div>
          )}

          {tab === 'travail' && (
            <div className="space-y-6">
              {/* Poste et contrat */}
              <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase size={14} /> Poste et contrat
                </h3>
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <EditField label="Poste" value={editForm.position} onChange={v => setEditForm((f: any) => ({ ...f, position: v }))} />
                    <EditField label="Département" value={editForm.department} onChange={v => setEditForm((f: any) => ({ ...f, department: v }))} />
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Vacation</label>
                      <Select value={editForm.shift} onChange={v => setEditForm((f: any) => ({ ...f, shift: v }))}
                        options={Object.entries(SHIFT_LABELS).map(([k, v]) => ({ value: k, label: v }))} className="w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Type de contrat</label>
                      <Select value={editForm.contractType} onChange={v => setEditForm((f: any) => ({ ...f, contractType: v }))}
                        options={Object.entries(CONTRACT_LABELS).map(([k, v]) => ({ value: k, label: v }))} className="w-full" />
                    </div>
                    <EditField label="Salaire de base (XOF)" value={editForm.baseSalary} onChange={v => setEditForm((f: any) => ({ ...f, baseSalary: v }))} type="number" />
                    <EditField label="Fin de contrat" value={editForm.contractEndDate} onChange={v => setEditForm((f: any) => ({ ...f, contractEndDate: v }))} type="date" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={Briefcase} label="Poste" value={agent.position} />
                    <InfoRow icon={Briefcase} label="Departement" value={agent.department} />
                    <InfoRow icon={Clock} label="Vacation" value={SHIFT_LABELS[agent.shift] ?? agent.shift} />
                    <InfoRow icon={CreditCard} label="Type de contrat" value={CONTRACT_LABELS[agent.contractType] ?? agent.contractType} />
                    <InfoRow icon={Calendar} label="Date d'embauche" value={agent.hireDate ? fmtDate(agent.hireDate) : null} />
                    <InfoRow icon={Calendar} label="Fin de contrat" value={agent.contractEndDate ? fmtDate(agent.contractEndDate) : null} />
                    <InfoRow icon={CreditCard} label="Salaire de base" value={agent.baseSalary ? `${Number(agent.baseSalary).toLocaleString('fr-FR')} XOF` : null} />
                    <InfoRow icon={CreditCard} label="Compte bancaire" value={agent.bankAccount} />
                  </div>
                )}
              </section>

              {/* Site actuel */}
              {!editing && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Affectation actuelle
                  </h3>
                  {activeSite ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="font-semibold text-green-800">{activeSite.name}</p>
                      {activeSite.district && <p className="text-xs text-green-600 mt-0.5">{activeSite.district}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Aucune affectation active</p>
                  )}
                </section>
              )}

              {/* Equipements */}
              {!editing && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Package size={14} /> Equipements assignes
                  </h3>
                  {agent.equipments?.length > 0 ? (
                    <div className="space-y-2">
                      {agent.equipments.filter((eq: any) => !eq.returnedAt).map((eq: any) => (
                        <div key={eq.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                          <Package size={14} className="text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">{eq.equipment?.name ?? 'Equipement'}</p>
                            <p className="text-xs text-slate-400">{eq.equipment?.code ?? ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Aucun equipement assigne</p>
                  )}
                </section>
              )}
            </div>
          )}

          {tab === 'audit' && (
            <div className="space-y-4">
              <AuditHistory entity="Agent" entityId={agentId} />
            </div>
          )}

          {tab === 'historique' && (
            <div className="space-y-6">
              {/* Derniers pointages */}
              <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock size={14} /> Derniers pointages
                </h3>
                {agent.pointages?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Date</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Entree</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Sortie</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {agent.pointages.slice(0, 10).map((p: any) => (
                          <tr key={p.id}>
                            <td className="px-3 py-2 text-xs">{p.checkInTime ? fmtDate(p.checkInTime) : '-'}</td>
                            <td className="px-3 py-2 text-xs">{p.checkInTime ? new Date(p.checkInTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                            <td className="px-3 py-2 text-xs">{p.checkOutTime ? new Date(p.checkOutTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                            <td className="px-3 py-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'PRESENT' ? 'bg-green-100 text-green-700' : p.status === 'RETARD' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {p.status ?? '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Aucun pointage enregistre</p>
                )}
              </section>

              {/* Formations */}
              <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <GraduationCap size={14} /> Formations recentes
                </h3>
                {agent.trainings?.length > 0 ? (
                  <div className="space-y-2">
                    {agent.trainings.map((t: any) => (
                      <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <p className="text-sm font-medium text-slate-700">{t.title ?? t.type ?? 'Formation'}</p>
                        <p className="text-xs text-slate-400">{t.startDate ? fmtDate(t.startDate) : ''} {t.endDate ? `- ${fmtDate(t.endDate)}` : ''}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Aucune formation</p>
                )}
              </section>

              {/* Conges */}
              <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar size={14} /> Conges recents
                </h3>
                {agent.leaves?.length > 0 ? (
                  <div className="space-y-2">
                    {agent.leaves.map((l: any) => (
                      <div key={l.id} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{l.type ?? 'Conge'}</p>
                          <p className="text-xs text-slate-400">{l.startDate ? fmtDate(l.startDate) : ''} - {l.endDate ? fmtDate(l.endDate) : ''}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status === 'APPROVED' ? 'bg-green-100 text-green-700' : l.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {l.status === 'APPROVED' ? 'Approuve' : l.status === 'REJECTED' ? 'Refuse' : 'En attente'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Aucun conge</p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
      <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value || <span className="text-slate-300 italic">Non renseigne</span>}</p>
      </div>
    </div>
  )
}

function EditField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {type === 'date'
        ? <DatePicker value={value || ''} onChange={onChange} className="w-full" />
        : <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
            onMouseDown={e => e.stopPropagation()}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sagard-yellow/40 focus:border-sagard-yellow outline-none transition-colors bg-white" />}
    </div>
  )
}
