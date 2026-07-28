import { Fragment, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users, DollarSign, Calendar, AlertTriangle, CheckCircle, Clock, Loader2, Plus, X, Award, UserPlus, FileText, Eye, Briefcase, Ban, Pencil, ShieldOff, ShieldCheck, Search, Trash2 } from 'lucide-react'
import { useApi } from '../lib/useApi'
import { getPayrolls, createPayrollMonth, validatePayrollLine, payPayrollLine, deletePayroll, getPayslip, getPayrollDetail, updatePayrollLine, toggleBlockPayrollLine, getLeaves, createLeave, approveLeave, rejectLeave, getTrainings, createTraining, getCandidacies, createCandidacy, updateIntegrationStep, getContractExpiryAlerts, getIndisciplinedAgents, getDisciplinary, createDisciplinary, getContracts } from '../services/hr.service'
import { getTreasuryAccounts } from '../services/treasury.service'
import { getAgents } from '../services/agents.service'
import { fmt, fmtDate } from '../lib/utils'
import NewPostulantModal from '../components/NewPostulantModal'
import ConvertToAgentModal from '../components/ConvertToAgentModal'
import Select from '../components/Select'
import DatePicker from '../components/DatePicker'

const STATUS_LINE: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: 'Brouillon',  cls: 'bg-slate-100 text-slate-600' },
  VALIDE:    { label: 'Validé',     cls: 'bg-blue-100 text-blue-700' },
  PAYE:      { label: 'Payé',       cls: 'bg-green-100 text-green-700' },
  BLOQUE:    { label: 'Bloqué',    cls: 'bg-red-100 text-red-700' },
}
const STATUS_LEAVE: Record<string, { label: string; cls: string }> = {
  EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
  APPROUVE:   { label: 'Approuvé',   cls: 'bg-green-100 text-green-700' },
  REFUSE:     { label: 'Refusé',     cls: 'bg-red-100 text-red-700' },
  ANNULE:     { label: 'Annulé',     cls: 'bg-slate-100 text-slate-500' },
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active ? 'bg-sagard-yellow text-sagard-dark' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
    }`}>
      {children}
    </button>
  )
}

const STEP_LABELS: Record<string, string> = {
  ENTRETIEN_EMBAUCHE: "Entretien d'embauche",
  FORMATION_FCB: 'Formation FCB (3j)',
  FORMATION_REGLEMENT: 'Règlement Intérieur (1j)',
  FORMATION_SERVICE_POSTE: 'Services et Poste (1j)',
  SIGNATURE_CONTRAT: 'Signature contrat travail',
  MISE_EN_SERVICE: 'Mise en service',
}

function fmtHours(hours: number): string {
  const h = Math.floor(hours)
  const min = Math.round((hours - h) * 60)
  return min > 0 ? `${h}h ${String(min).padStart(2, '0')}min` : `${h}h`
}

const EMPTY_CANDIDACY = { firstName: '', lastName: '', phone: '', email: '', cniNumber: '', position: '' }
const EMPTY_DISCIPLINARY = { agentId: '', type: 'FAUTE', description: '', date: '', sanction: '' }
const EMPTY_LEAVE = { agentId: '', type: 'CONGE_ANNUEL', startDate: '', endDate: '', reason: '' }
const EMPTY_TRAINING = { title: '', description: '', trainer: '', location: '', startDate: '', endDate: '', agentIds: [] as string[] }

export default function RH() {
  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as any) ?? 'payroll'
  const [tab, setTab]               = useState<'payroll' | 'leaves' | 'trainings' | 'candidacies' | 'disciplinary' | 'alerts' | 'contracts'>(initialTab)
  const [genLoading, setGenLoading] = useState(false)
  const [actionLoading, setAction]  = useState<string | null>(null)
  const [showCandModal, setShowCandModal] = useState(false)
  const [candForm, setCandForm]     = useState({ ...EMPTY_CANDIDACY })
  const [convertCand, setConvertCand] = useState<any | null>(null)
  const [showDiscModal, setShowDiscModal] = useState(false)
  const [discForm, setDiscForm]     = useState({ ...EMPTY_DISCIPLINARY })
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)

  // Congés modal
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm]   = useState({ ...EMPTY_LEAVE })
  // Formations modal
  const [showTrainModal, setShowTrainModal] = useState(false)
  const [trainForm, setTrainForm]   = useState({ ...EMPTY_TRAINING })
  // Fiche de paie modal
  const [payslipData, setPayslipData] = useState<any | null>(null)
  const [payslipLoading, setPayslipLoading] = useState(false)
  // Expandable payroll detail
  const [expandedPayroll, setExpandedPayroll] = useState<string | null>(null)
  const [payrollDetail, setPayrollDetail] = useState<any | null>(null)
  const [payrollDetailLoading, setPayrollDetailLoading] = useState(false)
  // Edit line modal
  const [editLine, setEditLine] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ daysWorked: 0, hoursWorked: 0, baseSalary: 0, bonuses: 0, deductions: 0, notes: '' })
  const [editSaving, setEditSaving] = useState(false)
  // Block modal
  const [blockLine, setBlockLine] = useState<any | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [blockSaving, setBlockSaving] = useState(false)
  // Search in payroll
  const [payrollSearch, setPayrollSearch] = useState('')
  // Delete payroll modal
  const [deletePayrollItem, setDeletePayrollItem] = useState<any | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  // Create month modal
  const [showCreateMonthModal, setShowCreateMonthModal] = useState(false)
  const [createMonthForm, setCreateMonthForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
  // Pay line modal
  const [payLineData, setPayLineData] = useState<any | null>(null)
  const [payForm, setPayForm] = useState({ treasuryAccountId: '', paymentMethod: 'VIREMENT_BANCAIRE', reference: '' })
  const [paySaving, setPaySaving] = useState(false)
  // Treasury accounts for payment modal
  const { data: treasuryAccountsData } = useApi(getTreasuryAccounts)
  const treasuryAccounts = (treasuryAccountsData as any[]) ?? []

  const { data: payrolls, loading: pLoad, reload: reloadP }   = useApi(getPayrolls)
  const { data: leaves,   loading: lLoad, reload: reloadL }   = useApi(getLeaves)
  const { data: trainings, loading: tLoad, reload: reloadT }  = useApi(getTrainings)
  const { data: candidacies, loading: cLoad, reload: reloadC } = useApi(getCandidacies)
  const { data: disciplinary, loading: dLoad, reload: reloadD } = useApi(getDisciplinary)
  const { data: expiryAlerts, loading: eLoad }                  = useApi(getContractExpiryAlerts)
  const { data: indisciplined, loading: iLoad }                 = useApi(getIndisciplinedAgents)
  const { data: agentsData }                                     = useApi(getAgents)
  const { data: contractsData, loading: ctLoad }                   = useApi(getContracts)
  const agents = (agentsData as any[]) ?? []
  const contracts = (contractsData as any[]) ?? []

  const now = new Date()

  async function handleCreateMonth() {
    setGenLoading(true)
    try {
      await createPayrollMonth(createMonthForm.month, createMonthForm.year)
      setShowCreateMonthModal(false)
      reloadP()
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Erreur création mois de paie')
    } finally { setGenLoading(false) }
  }

  async function handleValidateLine(lineId: string) {
    setAction(lineId)
    try {
      await validatePayrollLine(lineId)
      if (expandedPayroll) {
        const detail = await getPayrollDetail(expandedPayroll)
        setPayrollDetail(detail)
      }
      reloadP()
    } catch (e: any) { alert(e.response?.data?.message ?? 'Erreur') }
    finally { setAction(null) }
  }

  async function handlePayLine() {
    if (!payLineData) return
    if (!payForm.treasuryAccountId) { alert('Veuillez sélectionner un compte de trésorerie'); return }
    setPaySaving(true)
    try {
      await payPayrollLine(payLineData.id, payForm)
      if (expandedPayroll) {
        const detail = await getPayrollDetail(expandedPayroll)
        setPayrollDetail(detail)
      }
      reloadP()
      setPayLineData(null)
      setPayForm({ treasuryAccountId: '', paymentMethod: 'VIREMENT_BANCAIRE', reference: '' })
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Erreur paiement')
    } finally { setPaySaving(false) }
  }

  async function handleExpandPayroll(p: any) {
    const isExpanded = expandedPayroll === p.id
    if (isExpanded) {
      setExpandedPayroll(null)
      setPayrollDetail(null)
    } else {
      setExpandedPayroll(p.id)
      setPayrollDetailLoading(true)
      try {
        const detail = await getPayrollDetail(p.id)
        setPayrollDetail(detail)
      } catch { alert('Erreur chargement détail') }
      finally { setPayrollDetailLoading(false) }
    }
  }

  function openEditLine(line: any) {
    setEditLine(line)
    setEditForm({
      daysWorked: line.daysWorked,
      hoursWorked: Number(line.hoursWorked ?? 0),
      baseSalary: Number(line.baseSalary),
      bonuses: Number(line.bonuses),
      deductions: Number(line.deductions),
      notes: line.notes ?? '',
    })
  }

  async function handleSaveLine() {
    if (!editLine) return
    setEditSaving(true)
    try {
      await updatePayrollLine(editLine.id, editForm)
      if (expandedPayroll) {
        const detail = await getPayrollDetail(expandedPayroll)
        setPayrollDetail(detail)
      }
      reloadP()
      setEditLine(null)
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Erreur')
    } finally { setEditSaving(false) }
  }

  async function handleToggleBlock() {
    if (!blockLine) return
    setBlockSaving(true)
    try {
      await toggleBlockPayrollLine(blockLine.id, !blockLine.blocked, blockReason || undefined)
      if (expandedPayroll) {
        const detail = await getPayrollDetail(expandedPayroll)
        setPayrollDetail(detail)
      }
      reloadP()
      setBlockLine(null)
      setBlockReason('')
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Erreur')
    } finally { setBlockSaving(false) }
  }

  async function handleDeletePayroll() {
    if (!deletePayrollItem) return
    setDeleteLoading(true)
    try {
      await deletePayroll(deletePayrollItem.id)
      setExpandedPayroll(null)
      setPayrollDetail(null)
      reloadP()
      setDeletePayrollItem(null)
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Erreur')
    } finally { setDeleteLoading(false) }
  }

  async function handleLeaveAction(id: string, action: 'approve' | 'reject') {
    setAction(id)
    try {
      if (action === 'approve') await approveLeave(id)
      else await rejectLeave(id, 'Non accordé')
      reloadL()
    } catch (e: any) { alert(e.response?.data?.message ?? 'Erreur') }
    finally { setAction(null) }
  }

  return (
    <Fragment>
    <div className="space-y-5">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex gap-1 w-fit flex-wrap shadow-sm">
        <Tab active={tab === 'payroll'}      onClick={() => setTab('payroll')}>💰 Paie</Tab>
        <Tab active={tab === 'contracts'}    onClick={() => setTab('contracts')}>📋 Contrats</Tab>
        <Tab active={tab === 'leaves'}       onClick={() => setTab('leaves')}>🏖️ Congés</Tab>
        <Tab active={tab === 'trainings'}    onClick={() => setTab('trainings')}>📚 Formations</Tab>
        <Tab active={tab === 'candidacies'}  onClick={() => setTab('candidacies')}>👤 Recrutement</Tab>
        <Tab active={tab === 'disciplinary'} onClick={() => setTab('disciplinary')}>⚠️ Disciplinaire</Tab>
        <Tab active={tab === 'alerts'}       onClick={() => setTab('alerts')}>🔔 Alertes RH</Tab>
      </div>

      {/* PAIE */}
      {tab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Gestion de la paie</h2>
            <button onClick={() => { setCreateMonthForm({ month: now.getMonth() + 1, year: now.getFullYear() }); setShowCreateMonthModal(true) }}
              className="flex items-center gap-2 bg-sagard-yellow hover:bg-sagard-yellow-dark text-sagard-dark text-sm font-bold px-4 py-2 rounded-xl transition-colors">
              <Plus size={16} /> Nouveau mois
            </button>
          </div>

          {pLoad ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : (
            <div className="space-y-3">
              {((payrolls as any[]) ?? []).map((p: any) => {
                const isExpanded = expandedPayroll === p.id
                const lines = payrollDetail?.lines ?? p.lines ?? []
                const filteredLines = payrollSearch
                  ? lines.filter((l: any) => {
                      const name = `${l.agent?.user?.firstName ?? ''} ${l.agent?.user?.lastName ?? ''}`.toLowerCase()
                      const mat = (l.agent?.matricule ?? '').toLowerCase()
                      return name.includes(payrollSearch.toLowerCase()) || mat.includes(payrollSearch.toLowerCase())
                    })
                  : lines
                const paidCount = p.paidCount ?? lines.filter((l: any) => l.paymentStatus === 'PAYE').length
                const totalLines = p.totalLines ?? lines.length
                const blockedCount = p.blockedCount ?? lines.filter((l: any) => l.blocked).length
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50" onClick={() => handleExpandPayroll(p)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-sagard-yellow/20 rounded-lg flex items-center justify-center"><DollarSign size={18} className="text-sagard-yellow-dark" /></div>
                        <div>
                          <p className="font-bold text-slate-800">{String(p.month).padStart(2,'0')}/{p.year}</p>
                          <p className="text-xs text-slate-400">
                            {totalLines} agents · {paidCount} payé(s)
                            {blockedCount > 0 && <span className="text-red-500 font-medium"> · {blockedCount} bloqué(s)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Brut</p>
                          <p className="font-bold text-slate-800">{fmt(p.totalBrut)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Net</p>
                          <p className="font-bold text-green-700">{fmt(p.totalNet)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setDeletePayrollItem(p) }} title="Supprimer"
                            className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <span className={`transition-transform text-slate-400 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-slate-100">
                        {/* Search bar */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                          <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              value={payrollSearch}
                              onChange={e => setPayrollSearch(e.target.value)}
                              placeholder="Rechercher un agent..."
                              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/30"
                            />
                          </div>
                          <span className="text-xs text-slate-400">{filteredLines.length} agent(s)</span>
                        </div>
                        {payrollDetailLoading ? (
                          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" size={20} /></div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50"><tr>
                                {['Agent','Poste','Site','Jours','Salaire base','Primes','Brut','Retenues','Net','Statut','Actions'].map(h => (
                                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                                ))}
                              </tr></thead>
                              <tbody className="divide-y divide-slate-50">
                                {filteredLines.map((l: any) => {
                                  const lst = STATUS_LINE[l.paymentStatus] ?? { label: l.paymentStatus, cls: 'bg-slate-100 text-slate-600' }
                                  return (
                                  <tr key={l.id} className={`hover:bg-slate-50 ${l.blocked ? 'bg-red-50/50' : ''}`}>
                                    <td className="px-3 py-2.5">
                                      <div className="font-medium text-slate-800">{l.agent?.user?.firstName} {l.agent?.user?.lastName}</div>
                                      <div className="text-xs text-slate-400 font-mono">{l.agent?.matricule}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-xs text-slate-600">{l.agent?.position ?? '—'}</td>
                                    <td className="px-3 py-2.5 text-xs text-slate-600">{l.agent?.deployments?.[0]?.site?.name ?? '—'}</td>
                                    <td className="px-3 py-2.5 text-slate-600 text-center">
                                      <div>{l.daysWorked}j</div>
                                      <div className="text-xs text-slate-400">{fmtHours(l.hoursWorked)}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600">{fmt(l.baseSalary)}</td>
                                    <td className="px-3 py-2.5 text-emerald-600 font-medium">{Number(l.bonuses) > 0 ? `+${fmt(l.bonuses)}` : '—'}</td>
                                    <td className="px-3 py-2.5 font-semibold text-slate-800">{fmt(l.grossSalary)}</td>
                                    <td className="px-3 py-2.5 text-red-600 font-medium">{Number(l.deductions) > 0 ? `-${fmt(l.deductions)}` : '—'}</td>
                                    <td className="px-3 py-2.5">
                                      {l.blocked ? (
                                        <div>
                                          <span className="font-bold text-red-600 line-through">{fmt(l.netSalary)}</span>
                                          <div className="text-xs text-red-500 flex items-center gap-1 mt-0.5"><Ban size={10} /> {l.blockReason ?? 'Bloqué'}</div>
                                        </div>
                                      ) : (
                                        <span className="font-bold text-green-700">{fmt(l.netSalary)}</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${lst.cls}`}>{lst.label}</span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center gap-1">
                                        {l.paymentStatus === 'BROUILLON' && (
                                          <>
                                            <button onClick={() => openEditLine(l)} title="Modifier"
                                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
                                              <Pencil size={13} />
                                            </button>
                                            <button onClick={() => { setBlockLine(l); setBlockReason(l.blockReason ?? '') }} title="Bloquer"
                                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                                              <ShieldOff size={13} />
                                            </button>
                                            <button onClick={() => handleValidateLine(l.id)} disabled={actionLoading === l.id} title="Valider"
                                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                                              {actionLoading === l.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                            </button>
                                          </>
                                        )}
                                        {l.paymentStatus === 'VALIDE' && (
                                          <>
                                            <button onClick={() => openEditLine(l)} title="Modifier"
                                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
                                              <Pencil size={13} />
                                            </button>
                                            <button onClick={() => { setBlockLine(l); setBlockReason(l.blockReason ?? '') }} title="Bloquer"
                                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                                              <ShieldOff size={13} />
                                            </button>
                                            <button onClick={() => { setPayLineData(l); setPayForm({ treasuryAccountId: '', paymentMethod: 'VIREMENT_BANCAIRE', reference: '' }) }} title="Payer"
                                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                                              <DollarSign size={13} />
                                            </button>
                                          </>
                                        )}
                                        {l.paymentStatus === 'BLOQUE' && (
                                          <button onClick={() => { setBlockLine(l); setBlockReason(l.blockReason ?? '') }} title="Débloquer"
                                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                                            <ShieldCheck size={13} />
                                          </button>
                                        )}
                                        <button onClick={async () => { setPayslipLoading(true); try { const data = await getPayslip(l.id); setPayslipData(data) } catch { alert('Erreur chargement fiche') } finally { setPayslipLoading(false) } }}
                                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Voir fiche">
                                          <Eye size={13} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  )
                                })}
                                {filteredLines.length === 0 && (
                                  <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400 text-sm">Aucun agent trouvé</td></tr>
                                )}
                              </tbody>
                              {filteredLines.length > 0 && (
                                <tfoot className="bg-slate-50 border-t-2 border-slate-100">
                                  <tr className="font-bold">
                                    <td colSpan={4} className="px-3 py-3 text-slate-700">Total ({filteredLines.length} agents)</td>
                                    <td className="px-3 py-3 text-slate-700">{fmt(filteredLines.reduce((s: number, l: any) => s + Number(l.baseSalary), 0))}</td>
                                    <td className="px-3 py-3 text-emerald-700">{fmt(filteredLines.reduce((s: number, l: any) => s + Number(l.bonuses), 0))}</td>
                                    <td className="px-3 py-3 text-slate-800">{fmt(filteredLines.reduce((s: number, l: any) => s + Number(l.grossSalary), 0))}</td>
                                    <td className="px-3 py-3 text-red-700">{fmt(filteredLines.reduce((s: number, l: any) => s + Number(l.deductions), 0))}</td>
                                    <td className="px-3 py-3 text-green-700">{fmt(filteredLines.reduce((s: number, l: any) => s + Number(l.netSalary), 0))}</td>
                                    <td></td><td></td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {((payrolls as any[]) ?? []).length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
                  <DollarSign size={40} className="mx-auto mb-3 opacity-30" /> Aucune fiche de paie. Cliquez sur « Nouveau mois » pour commencer.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTRATS DE TRAVAIL */}
      {tab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Contrats de travail</h2>
              <p className="text-xs text-slate-400 mt-0.5">Vue d'ensemble des contrats agents — taux, indemnités, échéances</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-green-700 font-medium">
                {contracts.filter((c: any) => c.status === 'EN_POSTE').length} actifs
              </span>
              <span className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-amber-700 font-medium">
                {contracts.filter((c: any) => c.contractEndDate && new Date(c.contractEndDate) < new Date(Date.now() + 30 * 86400000)).length} expirant
              </span>
            </div>
          </div>

          {ctLoad ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['Agent', 'Matricule', 'Poste', 'Type', 'Vacation', 'Salaire base', 'Embauche', 'Fin contrat', 'Site actuel', 'Statut'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contracts.map((c: any) => {
                      const contractCls = c.contractType === 'CDI' ? 'bg-green-100 text-green-700' : c.contractType === 'CDD' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      const statusCls = c.status === 'EN_POSTE' ? 'bg-green-100 text-green-700' : c.status === 'DISPONIBLE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      const isExpiring = c.contractEndDate && new Date(c.contractEndDate) < new Date(Date.now() + 30 * 86400000)
                      const site = c.deployments?.[0]?.site?.name
                      return (
                        <tr key={c.id} className={`hover:bg-slate-50 ${isExpiring ? 'bg-amber-50/40' : ''}`}>
                          <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">{c.user?.firstName} {c.user?.lastName}</td>
                          <td className="px-3 py-2.5 text-xs font-mono text-slate-500">{c.matricule}</td>
                          <td className="px-3 py-2.5 text-slate-600">{c.position ?? '—'}</td>
                          <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${contractCls}`}>{c.contractType ?? '—'}</span></td>
                          <td className="px-3 py-2.5 text-slate-600">{c.shift === 'JOUR' ? 'Jour' : c.shift === 'NUIT' ? 'Nuit' : c.shift ?? '—'}</td>
                          <td className="px-3 py-2.5 font-medium text-slate-800">{c.baseSalary ? fmt(Number(c.baseSalary)) : '—'}</td>
                          <td className="px-3 py-2.5 text-slate-600">{c.hireDate ? fmtDate(c.hireDate) : '—'}</td>
                          <td className={`px-3 py-2.5 ${isExpiring ? 'text-amber-700 font-semibold' : 'text-slate-600'}`}>
                            {c.contractEndDate ? fmtDate(c.contractEndDate) : <span className="text-slate-300">Indéterminé</span>}
                            {isExpiring && <span className="ml-1 text-[10px]">⚠️</span>}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs">{site ?? <span className="text-slate-300 italic">Non affecté</span>}</td>
                          <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls}`}>{c.status}</span></td>
                        </tr>
                      )
                    })}
                    {contracts.length === 0 && (
                      <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">
                        <Briefcase size={40} className="mx-auto mb-3 opacity-30" /> Aucun contrat trouvé
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONGÉS */}
      {tab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Demandes de congés</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                <Clock size={14} />
                {((leaves as any[]) ?? []).filter((l: any) => l.status === 'EN_ATTENTE').length} en attente
              </div>
              <button onClick={() => { setLeaveForm({ ...EMPTY_LEAVE }); setFormError(null); setShowLeaveModal(true) }}
                className="flex items-center gap-2 bg-sagard-yellow hover:bg-sagard-yellow-dark text-sagard-dark text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                <Plus size={16} /> Demander un congé
              </button>
            </div>
          </div>

          {lLoad ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Agent', 'Type', 'Du', 'Au', 'Jours', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {((leaves as any[]) ?? []).map((l: any) => {
                    const st = STATUS_LEAVE[l.status] ?? { label: l.status, cls: '' }
                    const agentName = l.agent?.user ? `${l.agent.user.firstName} ${l.agent.user.lastName}` : '—'
                    return (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{agentName}</td>
                        <td className="px-4 py-3 text-slate-600">{l.type}</td>
                        <td className="px-4 py-3 text-slate-600">{fmtDate(l.startDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmtDate(l.endDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{l.days}j</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span></td>
                        <td className="px-4 py-3">
                          {l.status === 'EN_ATTENTE' && (
                            <div className="flex gap-2">
                              <button onClick={() => handleLeaveAction(l.id, 'approve')} disabled={actionLoading === l.id}
                                className="text-xs text-green-600 hover:underline font-medium">✓ Approuver</button>
                              <button onClick={() => handleLeaveAction(l.id, 'reject')} disabled={actionLoading === l.id}
                                className="text-xs text-red-600 hover:underline font-medium">✗ Refuser</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {((leaves as any[]) ?? []).length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">Aucune demande</td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FORMATIONS */}
      {tab === 'trainings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Formations</h2>
            <button onClick={() => { setTrainForm({ ...EMPTY_TRAINING }); setFormError(null); setShowTrainModal(true) }}
              className="flex items-center gap-2 bg-sagard-yellow hover:bg-sagard-yellow-dark text-sagard-dark text-sm font-bold px-4 py-2 rounded-xl transition-colors">
              <Plus size={16} /> Planifier une formation
            </button>
          </div>
          {tLoad ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {((trainings as any[]) ?? []).map((t: any) => (
                <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-800 text-sm">{t.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.status === 'PLANIFIE' ? 'bg-blue-100 text-blue-700' :
                      t.status === 'EN_COURS' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>{t.status}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t.type} · {t.provider ?? 'Interne'}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                    <Calendar size={12} />
                    {fmtDate(t.startDate)} → {fmtDate(t.endDate)}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <Users size={12} />
                    {t.participants?.length ?? 0} participant(s)
                  </div>
                </div>
              ))}
              {((trainings as any[]) ?? []).length === 0 && (
                <div className="col-span-3 text-center text-slate-400 text-sm py-10">Aucune formation planifiée</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CANDIDATURES & INTÉGRATION */}
      {tab === 'candidacies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recrutement & Intégration</h2>
            <button onClick={() => { setCandForm({ ...EMPTY_CANDIDACY }); setFormError(null); setShowCandModal(true) }}
              className="flex items-center gap-2 bg-sagard-yellow hover:bg-sagard-yellow-dark text-sagard-dark text-sm font-bold px-4 py-2 rounded-xl transition-colors">
              <Plus size={16} /> Nouvelle candidature
            </button>
          </div>

          {cLoad ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : (
            <div className="space-y-4">
              {((candidacies as any[]) ?? []).map((c: any) => (
                <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800">{c.firstName} {c.lastName}</h3>
                      <p className="text-xs text-slate-500">{c.position} · {c.phone} {c.cniNumber ? `· CNI: ${c.cniNumber}` : ''}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      c.status === 'CANDIDATURE' ? 'bg-blue-100 text-blue-700' :
                      c.status === 'EN_INTEGRATION' ? 'bg-amber-100 text-amber-700' :
                      c.status === 'INTEGRE' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>{c.status}</span>
                  </div>

                  {/* Mini CV */}
                  {c.notes && (() => {
                    try {
                      const cv = JSON.parse(c.notes)
                      return (
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mini CV</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                            {cv.dateNaissance && <div><span className="text-slate-400">Né(e) le :</span> <span className="font-medium text-slate-700">{cv.dateNaissance}</span></div>}
                            {cv.lieuNaissance && <div><span className="text-slate-400">Lieu :</span> <span className="font-medium text-slate-700">{cv.lieuNaissance}</span></div>}
                            {cv.situationMatrimoniale && <div><span className="text-slate-400">Situation :</span> <span className="font-medium text-slate-700">{cv.situationMatrimoniale}</span></div>}
                            {cv.adresse && <div><span className="text-slate-400">Adresse :</span> <span className="font-medium text-slate-700">{cv.adresse}</span></div>}
                            {cv.niveauEtude && <div><span className="text-slate-400">Niveau :</span> <span className="font-medium text-slate-700">{cv.niveauEtude}</span></div>}
                            {cv.diplome && <div><span className="text-slate-400">Diplôme :</span> <span className="font-medium text-slate-700">{cv.diplome}</span></div>}
                            {cv.experiencesSecurite && <div><span className="text-slate-400">Exp. sécurité :</span> <span className="font-medium text-slate-700">{cv.experiencesSecurite}</span></div>}
                            {cv.ancienEmployeur && <div><span className="text-slate-400">Dernier empl. :</span> <span className="font-medium text-slate-700">{cv.ancienEmployeur}</span></div>}
                            {cv.dureeExperience && <div><span className="text-slate-400">Expérience :</span> <span className="font-medium text-slate-700">{cv.dureeExperience}</span></div>}
                            {cv.competences && <div><span className="text-slate-400">Compétences :</span> <span className="font-medium text-slate-700">{cv.competences}</span></div>}
                            {cv.langues && <div><span className="text-slate-400">Langues :</span> <span className="font-medium text-slate-700">{cv.langues}</span></div>}
                            {cv.permisConduire && cv.permisConduire !== 'Non' && <div><span className="text-slate-400">Permis :</span> <span className="font-medium text-slate-700">{cv.permisConduire}</span></div>}
                            {cv.disponibilite && <div><span className="text-slate-400">Disponibilité :</span> <span className="font-medium text-slate-700">{cv.disponibilite}</span></div>}
                            {cv.pretentionSalariale && <div><span className="text-slate-400">Prétention :</span> <span className="font-medium text-slate-700">{cv.pretentionSalariale}</span></div>}
                            {cv.referenceNom && <div><span className="text-slate-400">Référence :</span> <span className="font-medium text-slate-700">{cv.referenceNom} {cv.referencePhone ? `(${cv.referencePhone})` : ''}</span></div>}
                          </div>
                          {cv.observation && <p className="mt-2 text-xs text-slate-600 italic border-t border-slate-200 pt-2">📝 {cv.observation}</p>}
                        </div>
                      )
                    } catch { return null }
                  })()}

                  {/* Pipeline d'intégration */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pipeline d'intégration</p>
                    <div className="flex gap-1">
                      {(c.integrationSteps ?? []).map((step: any, i: number) => (
                        <div key={step.id}
                          className={`flex-1 h-2 rounded-full ${step.completed ? (step.passed === false ? 'bg-red-400' : 'bg-emerald-400') : 'bg-slate-200'}`}
                          title={STEP_LABELS[step.stepType] ?? step.title}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                      {(c.integrationSteps ?? []).map((step: any) => (
                        <button key={step.id}
                          onClick={async () => {
                            if (step.completed) return
                            if (confirm(`Marquer « ${STEP_LABELS[step.stepType] ?? step.title} » comme terminé (réussi) ?`)) {
                              await updateIntegrationStep(step.id, { completed: true, passed: true, startDate: new Date(), endDate: new Date() })
                              reloadC()
                            }
                          }}
                          className={`text-center p-2 rounded-lg border text-xs transition-colors ${
                            step.completed
                              ? step.passed === false
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-sagard-yellow cursor-pointer'
                          }`}>
                          <p className="font-medium">{STEP_LABELS[step.stepType] ?? step.title}</p>
                          {step.completed && <p className="text-[10px] mt-0.5">{step.passed === false ? 'Échoué' : '✓ Validé'}</p>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action: finaliser l'intégration & créer l'agent */}
                  {(() => {
                    const steps = c.integrationSteps ?? []
                    const allDone = steps.length > 0 && steps.every((s: any) => s.completed && s.passed !== false)
                    const alreadyAgent = !!c.agentId || c.status === 'EMBAUCHE'
                    if (alreadyAgent) {
                      return (
                        <div className="mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold">
                          ✓ Agent créé avec succès — Voir dans Opérations → Agents
                        </div>
                      )
                    }
                    if (allDone) {
                      return (
                        <button
                          onClick={() => setConvertCand(c)}
                          className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          ✨ Finaliser l'intégration & créer l'agent
                        </button>
                      )
                    }
                    return (
                      <p className="mt-4 text-xs text-slate-400 italic text-center">
                        Validez toutes les étapes pour pouvoir créer l'agent.
                      </p>
                    )
                  })()}
                </div>
              ))}
              {((candidacies as any[]) ?? []).length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                  <UserPlus size={40} className="mx-auto mb-3 opacity-30" />
                  Aucune candidature en cours
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DISCIPLINAIRE */}
      {tab === 'disciplinary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Registre disciplinaire</h2>
            <button onClick={() => { setDiscForm({ ...EMPTY_DISCIPLINARY }); setFormError(null); setShowDiscModal(true) }}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
              <Plus size={16} /> Nouvelle sanction
            </button>
          </div>

          {dLoad ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Agent', 'Type', 'N° Faute', 'Date', 'Description', 'Sanction'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {((disciplinary as any[]) ?? []).map((d: any) => {
                    const agentName = d.agent?.user ? `${d.agent.user.firstName} ${d.agent.user.lastName}` : '—'
                    return (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{agentName}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            d.type === 'FAUTE' ? 'bg-amber-100 text-amber-700' :
                            d.type === 'AVERTISSEMENT' ? 'bg-orange-100 text-orange-700' :
                            d.type === 'MISE_A_PIED' ? 'bg-red-100 text-red-700' :
                            'bg-red-200 text-red-800'
                          }`}>{d.type?.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{d.faultNumber ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{fmtDate(d.date)}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">{d.description}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{d.sanction ?? '—'}</td>
                      </tr>
                    )
                  })}
                  {((disciplinary as any[]) ?? []).length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Aucun enregistrement disciplinaire</td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALERTES RH */}
      {tab === 'alerts' && (
        <div className="space-y-6">
          <h2 className="font-semibold text-slate-800">Alertes RH</h2>

          {/* Contrats expirant */}
          <div>
            <h3 className="text-sm font-bold text-amber-700 flex items-center gap-2 mb-3">
              <Clock size={16} /> Contrats de travail expirant dans 30 jours
            </h3>
            {eLoad ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : ((expiryAlerts as any[]) ?? []).length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                <CheckCircle size={16} className="inline mr-2" /> Aucun contrat n'expire dans les 30 prochains jours.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-amber-50 border-b border-amber-200">
                    <tr>
                      {['Agent', 'Téléphone', 'Fin de contrat', 'Jours restants'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {((expiryAlerts as any[]) ?? []).map((a: any) => {
                      const daysLeft = Math.ceil((new Date(a.contractEndDate).getTime() - Date.now()) / 86_400_000)
                      return (
                        <tr key={a.id} className="hover:bg-amber-50/50">
                          <td className="px-4 py-3 font-medium text-slate-800">{a.user?.firstName} {a.user?.lastName}</td>
                          <td className="px-4 py-3 text-slate-600">{a.user?.phone ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{fmtDate(a.contractEndDate)}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${daysLeft <= 7 ? 'text-red-600' : daysLeft <= 14 ? 'text-amber-600' : 'text-slate-700'}`}>
                              {daysLeft}j
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Agents indisciplinés */}
          <div>
            <h3 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-3">
              <AlertTriangle size={16} /> Agents indisciplinés (3+ fautes)
            </h3>
            {iLoad ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : ((indisciplined as any[]) ?? []).length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                <CheckCircle size={16} className="inline mr-2" /> Aucun agent indiscipliné.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-red-50 border-b border-red-200">
                    <tr>
                      {['Agent', 'Téléphone', 'Nb fautes', 'Dernière faute'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-red-700 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {((indisciplined as any[]) ?? []).map((a: any) => (
                      <tr key={a.id} className="hover:bg-red-50/50">
                        <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                          <AlertTriangle size={14} className="text-red-500" />
                          {a.user?.firstName} {a.user?.lastName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{a.user?.phone ?? '—'}</td>
                        <td className="px-4 py-3 font-bold text-red-600">{a.disciplinary?.length ?? 0}</td>
                        <td className="px-4 py-3 text-slate-600">{a.disciplinary?.[0] ? fmtDate(a.disciplinary[0].date) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Modal Nouvelle Candidature */}
    {showCandModal && (
      <NewPostulantModal
        onClose={() => setShowCandModal(false)}
        onCreated={() => { setShowCandModal(false); reloadC() }}
      />
    )}

    {/* Modal Conversion → Agent */}
    {convertCand && (
      <ConvertToAgentModal
        candidacy={convertCand}
        onClose={() => setConvertCand(null)}
        onCreated={() => { setConvertCand(null); reloadC() }}
      />
    )}

    {/* Modal Nouvelle Sanction */}
    {showDiscModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" /> Nouvelle sanction disciplinaire
            </h2>
            <button onClick={() => setShowDiscModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!discForm.agentId || !discForm.description || !discForm.date) {
              setFormError('Agent, description et date sont obligatoires.')
              return
            }
            setSaving(true); setFormError(null)
            try {
              await createDisciplinary({ ...discForm, date: new Date(discForm.date) })
              setShowDiscModal(false); setDiscForm({ ...EMPTY_DISCIPLINARY }); reloadD()
            } catch (err: any) { setFormError(err.response?.data?.message ?? 'Erreur') }
            finally { setSaving(false) }
          }} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Agent *</label>
              <Select value={discForm.agentId} onChange={v => setDiscForm(f => ({ ...f, agentId: v }))} required
                options={agents.map((a: any) => ({ value: a.id, label: `${a.user?.firstName} ${a.user?.lastName} (${a.matricule})` }))}
                placeholder="-- Sélectionner un agent --" className="w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <Select value={discForm.type} onChange={v => setDiscForm(f => ({ ...f, type: v }))}
                  options={[{ value: 'FAUTE', label: 'Faute' }, { value: 'AVERTISSEMENT', label: 'Avertissement' }, { value: 'MISE_A_PIED', label: 'Mise à pied' }, { value: 'LICENCIEMENT', label: 'Licenciement' }]} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
                <DatePicker value={discForm.date} onChange={v => setDiscForm(f => ({ ...f, date: v }))} className="w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
              <textarea value={discForm.description} onChange={e => setDiscForm(f => ({ ...f, description: e.target.value }))} rows={3} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sanction prononcée</label>
              <input value={discForm.sanction} onChange={e => setDiscForm(f => ({ ...f, sanction: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Ex: Retenue de 2 jours de salaire" />
            </div>
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowDiscModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white">Annuler</button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null} Enregistrer la sanction
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    {/* ═══ Modal Demande de congé ═══ */}
    {showLeaveModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Calendar size={18} className="text-sagard-yellow-dark" /> Demande de congé</h2>
            <button onClick={() => setShowLeaveModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!leaveForm.agentId || !leaveForm.startDate || !leaveForm.endDate) { setFormError('Agent et dates sont obligatoires.'); return }
            setSaving(true); setFormError(null)
            try {
              await createLeave(leaveForm)
              setShowLeaveModal(false); setLeaveForm({ ...EMPTY_LEAVE }); reloadL()
            } catch (err: any) { setFormError(err.response?.data?.message ?? 'Erreur') }
            finally { setSaving(false) }
          }} className="px-6 py-5 space-y-4">
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Agent *</label>
              <Select value={leaveForm.agentId} onChange={v => setLeaveForm(f => ({ ...f, agentId: v }))} required
                options={agents.map((a: any) => ({ value: a.id, label: `${a.user?.firstName} ${a.user?.lastName} (${a.matricule})` }))}
                placeholder="-- Sélectionner un agent --" className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type de congé</label>
              <Select value={leaveForm.type} onChange={v => setLeaveForm(f => ({ ...f, type: v }))}
                options={[{ value: 'CONGE_ANNUEL', label: 'Congé annuel' }, { value: 'MALADIE', label: 'Maladie' }, { value: 'MATERNITE', label: 'Maternité' }, { value: 'PATERNITE', label: 'Paternité' }, { value: 'SANS_SOLDE', label: 'Sans solde' }, { value: 'FORMATION', label: 'Formation' }]} className="w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date début *</label>
                <DatePicker value={leaveForm.startDate} onChange={v => setLeaveForm(f => ({ ...f, startDate: v }))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date fin *</label>
                <DatePicker value={leaveForm.endDate} onChange={v => setLeaveForm(f => ({ ...f, endDate: v }))} className="w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Motif</label>
              <textarea value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none" placeholder="Motif du congé (optionnel)..." />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowLeaveModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white">Annuler</button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />} Soumettre
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ═══ Modal Planifier une formation ═══ */}
    {showTrainModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Award size={18} className="text-sagard-yellow-dark" /> Planifier une formation</h2>
            <button onClick={() => setShowTrainModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!trainForm.title || !trainForm.startDate || trainForm.agentIds.length === 0) { setFormError('Titre, date de début et au moins un participant sont obligatoires.'); return }
            setSaving(true); setFormError(null)
            try {
              for (const agentId of trainForm.agentIds) {
                await createTraining({
                  agentId,
                  title: trainForm.title,
                  description: trainForm.description || undefined,
                  trainer: trainForm.trainer || undefined,
                  location: trainForm.location || undefined,
                  startDate: new Date(trainForm.startDate),
                  endDate: trainForm.endDate ? new Date(trainForm.endDate) : undefined,
                })
              }
              setShowTrainModal(false); setTrainForm({ ...EMPTY_TRAINING }); reloadT()
            } catch (err: any) { setFormError(err.response?.data?.message ?? 'Erreur') }
            finally { setSaving(false) }
          }} className="px-6 py-5 space-y-4">
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Titre de la formation *</label>
              <input value={trainForm.title} onChange={e => setTrainForm(f => ({ ...f, title: e.target.value }))} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Ex: Formation sécurité incendie" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea value={trainForm.description} onChange={e => setTrainForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none" placeholder="Détails de la formation..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Formateur</label>
                <input value={trainForm.trainer} onChange={e => setTrainForm(f => ({ ...f, trainer: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Nom du formateur" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Lieu</label>
                <input value={trainForm.location} onChange={e => setTrainForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Lieu de la formation" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date début *</label>
                <DatePicker value={trainForm.startDate} onChange={v => setTrainForm(f => ({ ...f, startDate: v }))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date fin</label>
                <DatePicker value={trainForm.endDate} onChange={v => setTrainForm(f => ({ ...f, endDate: v }))} className="w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Participants * ({trainForm.agentIds.length} sélectionné{trainForm.agentIds.length > 1 ? 's' : ''})</label>
              <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                {agents.map((a: any) => {
                  const checked = trainForm.agentIds.includes(a.id)
                  return (
                    <label key={a.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${checked ? 'bg-sagard-yellow/10 text-slate-800' : 'hover:bg-slate-50 text-slate-600'}`}>
                      <input type="checkbox" checked={checked} onChange={() => {
                        setTrainForm(f => ({
                          ...f,
                          agentIds: checked ? f.agentIds.filter(id => id !== a.id) : [...f.agentIds, a.id]
                        }))
                      }} className="rounded border-slate-300" />
                      <span className="font-medium">{a.user?.firstName} {a.user?.lastName}</span>
                      <span className="text-xs text-slate-400">({a.matricule})</span>
                    </label>
                  )
                })}
                {agents.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Aucun agent disponible</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowTrainModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white">Annuler</button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />} Planifier
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ═══ Modal Supprimer paie ═══ */}
    {deletePayrollItem && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Trash2 size={18} className="text-red-500" /> Supprimer la paie
            </h2>
            <button onClick={() => setDeletePayrollItem(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              <p className="font-semibold mb-1">Êtes-vous sûr de vouloir supprimer cette paie ?</p>
              <p className="text-xs">Paie de <strong>{String(deletePayrollItem.month).padStart(2,'0')}/{deletePayrollItem.year}</strong> — {deletePayrollItem.lines?.length ?? 0} agent(s)</p>
              <p className="text-xs mt-2">Toutes les lignes de paie des employés seront définitivement supprimées. Cette action est irréversible.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDeletePayrollItem(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
              <button onClick={handleDeletePayroll} disabled={deleteLoading}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-60">
                {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ Modal Nouveau mois de paie ═══ */}
    {showCreateMonthModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Plus size={18} className="text-sagard-yellow-dark" /> Nouveau mois de paie
            </h2>
            <button onClick={() => setShowCreateMonthModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-slate-500">Crée un mois de paie avec tous les agents en poste. Les jours travaillés seront automatiquement calculés depuis les pointages.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mois</label>
                <select value={createMonthForm.month} onChange={e => setCreateMonthForm(f => ({ ...f, month: +e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40">
                  {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('fr-FR', { month: 'long' })}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Année</label>
                <input type="number" value={createMonthForm.year} onChange={e => setCreateMonthForm(f => ({ ...f, year: +e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreateMonthModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
              <button onClick={handleCreateMonth} disabled={genLoading}
                className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                {genLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Créer
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ Modal Payer ligne de paie ═══ */}
    {payLineData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <DollarSign size={18} className="text-green-600" /> Payer le salaire
            </h2>
            <button onClick={() => setPayLineData(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3">
              <p className="font-semibold text-slate-800">{payLineData.agent?.user?.firstName} {payLineData.agent?.user?.lastName}</p>
              <p className="text-xs text-slate-400 font-mono">{payLineData.agent?.matricule} · {payLineData.agent?.position}</p>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-slate-500">Net à payer</span>
                <span className="font-bold text-green-700">{fmt(payLineData.netSalary)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Compte de trésorerie à débiter</label>
              <select value={payForm.treasuryAccountId} onChange={e => setPayForm(f => ({ ...f, treasuryAccountId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40">
                <option value="">— Sélectionner —</option>
                {treasuryAccounts.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name} — Solde: {fmt(a.balance)}</option>
                ))}
              </select>
              {payForm.treasuryAccountId && (() => {
                const acc = treasuryAccounts.find((a: any) => a.id === payForm.treasuryAccountId)
                if (acc && Number(acc.balance) < Number(payLineData.netSalary)) {
                  return <p className="text-xs text-red-500 mt-1">⚠ Solde insuffisant sur ce compte</p>
                }
                return null
              })()}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Mode de paiement</label>
              <select value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40">
                <option value="VIREMENT_BANCAIRE">Virement bancaire</option>
                <option value="ESPECE">Espèces</option>
                <option value="CHEQUE">Chèque</option>
                <option value="MOBILE_MONEY">Mobile money</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Référence (optionnel)</label>
              <input type="text" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="N° chèque, référence virement..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setPayLineData(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
              <button onClick={handlePayLine} disabled={paySaving || !payForm.treasuryAccountId}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-60">
                {paySaving ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />} Payer
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ Modal Modifier ligne de paie ═══ */}
    {editLine && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Pencil size={18} className="text-sagard-yellow-dark" /> Modifier la paie
            </h2>
            <button onClick={() => setEditLine(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3">
              <p className="font-semibold text-slate-800">{editLine.agent?.user?.firstName} {editLine.agent?.user?.lastName}</p>
              <p className="text-xs text-slate-400 font-mono">{editLine.agent?.matricule} · {editLine.agent?.position}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Vacations (jours)</label>
                <input type="number" min={0} max={62} value={editForm.daysWorked}
                  onChange={e => setEditForm(f => ({ ...f, daysWorked: +e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                <p className="text-xs text-slate-400 mt-1">1 vacation = 12h (JOUR ou NUIT) = 2500 FCFA</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Heures travaillées</label>
                <input type="number" min={0} step={0.01} value={editForm.hoursWorked}
                  onChange={e => setEditForm(f => ({ ...f, hoursWorked: +e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                <p className="text-xs text-slate-400 mt-1">{fmtHours(editForm.hoursWorked)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Salaire de base</label>
                <input type="number" min={0} value={editForm.baseSalary}
                  onChange={e => setEditForm(f => ({ ...f, baseSalary: +e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Primes / Bonus</label>
                <input type="number" min={0} value={editForm.bonuses}
                  onChange={e => setEditForm(f => ({ ...f, bonuses: +e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                <p className="text-xs text-slate-400 mt-1">Prime transport, salissure, heures supp, etc.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Retenues</label>
                <input type="number" min={0} value={editForm.deductions}
                  onChange={e => setEditForm(f => ({ ...f, deductions: +e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                <p className="text-xs text-slate-400 mt-1">Cotisations, IRPP, avances, sanctions...</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optionnel)</label>
              <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Ex: Avance sur salaire, prime de rendement..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
            </div>
            <div className="bg-slate-50 rounded-lg px-4 py-3 flex justify-between text-sm">
              <div>
                <p className="text-xs text-slate-400">Brut calculé</p>
                <p className="font-bold text-slate-800">{fmt(editForm.daysWorked * 2500 + editForm.bonuses)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Net calculé</p>
                <p className="font-bold text-green-700">{fmt(Math.max(editForm.daysWorked * 2500 + editForm.bonuses - editForm.deductions, 0))}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditLine(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
              <button onClick={handleSaveLine} disabled={editSaving}
                className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                {editSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ Modal Bloquer paie ═══ */}
    {blockLine && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {blockLine.blocked ? <ShieldCheck size={18} className="text-green-600" /> : <ShieldOff size={18} className="text-red-500" />}
              {blockLine.blocked ? 'Débloquer la paie' : 'Bloquer la paie'}
            </h2>
            <button onClick={() => setBlockLine(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3">
              <p className="font-semibold text-slate-800">{blockLine.agent?.user?.firstName} {blockLine.agent?.user?.lastName}</p>
              <p className="text-xs text-slate-400 font-mono">{blockLine.agent?.matricule} · {blockLine.agent?.position}</p>
              <p className="text-sm text-slate-600 mt-2">Net à payer : <span className="font-bold text-green-700">{fmt(blockLine.netSalary)}</span></p>
            </div>
            {!blockLine.blocked ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Motif du blocage</label>
                  <input value={blockReason} onChange={e => setBlockReason(e.target.value)}
                    placeholder="Ex: Sanction disciplinaire, avance non remboursée, congé sans autorisation..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300" />
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  <Ban size={14} className="inline mr-1" />
                  Le net à payer sera mis à 0. L'employé ne recevra pas son salaire pour cette période.
                </div>
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                <ShieldCheck size={14} className="inline mr-1" />
                La paie sera débloquée. Le net sera recalculé à partir du brut et des retenues.
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setBlockLine(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
              <button onClick={handleToggleBlock} disabled={blockSaving}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-60 ${
                  blockLine.blocked ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'
                }`}>
                {blockSaving ? <Loader2 size={14} className="animate-spin" /> : blockLine.blocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                {blockLine.blocked ? 'Débloquer' : 'Bloquer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ Modal Fiche de paie individuelle ═══ */}
    {payslipData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-sagard-yellow-dark" /> Fiche de paie
            </h2>
            <button onClick={() => setPayslipData(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg text-slate-800">{payslipData.agent?.user?.firstName} {payslipData.agent?.user?.lastName}</p>
                <p className="text-xs text-slate-400">{payslipData.agent?.matricule} · {payslipData.agent?.user?.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">
                  {String(payslipData.payroll?.month).padStart(2, '0')}/{payslipData.payroll?.year}
                </p>
                <p className="text-xs text-slate-400">{payslipData.daysWorked}j travaillés · {fmtHours(payslipData.hoursWorked)}</p>
              </div>
            </div>

            <div id="payslip-print-area" className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Libellé</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Montant</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="px-4 py-2 text-slate-700">Salaire de base</td><td className="px-4 py-2 text-right font-medium">{fmt(payslipData.baseSalary)}</td></tr>
                  {payslipData.details?.primeTransport > 0 && <tr><td className="px-4 py-2 text-emerald-700">+ Prime transport</td><td className="px-4 py-2 text-right text-emerald-700">{fmt(payslipData.details.primeTransport)}</td></tr>}
                  {payslipData.details?.primeSalissure > 0 && <tr><td className="px-4 py-2 text-emerald-700">+ Prime salissure</td><td className="px-4 py-2 text-right text-emerald-700">{fmt(payslipData.details.primeSalissure)}</td></tr>}
                  {payslipData.details?.heuresSupp > 0 && <tr><td className="px-4 py-2 text-emerald-700">+ Heures supp.</td><td className="px-4 py-2 text-right text-emerald-700">{fmt(payslipData.details.heuresSupp)}</td></tr>}
                  <tr className="bg-slate-50 font-semibold"><td className="px-4 py-2">Salaire brut</td><td className="px-4 py-2 text-right">{fmt(payslipData.grossSalary)}</td></tr>
                  {payslipData.details?.cnps_ipres_rg > 0 && <tr><td className="px-4 py-2 text-red-600">- IPRES Régime Général (5.6%)</td><td className="px-4 py-2 text-right text-red-600">{fmt(payslipData.details.cnps_ipres_rg)}</td></tr>}
                  {payslipData.details?.cnps_ipres_rc > 0 && <tr><td className="px-4 py-2 text-red-600">- IPRES RC (3.6%)</td><td className="px-4 py-2 text-right text-red-600">{fmt(payslipData.details.cnps_ipres_rc)}</td></tr>}
                  {payslipData.details?.cotisationMaladie > 0 && <tr><td className="px-4 py-2 text-red-600">- IPM Maladie (3%)</td><td className="px-4 py-2 text-right text-red-600">{fmt(payslipData.details.cotisationMaladie)}</td></tr>}
                  {payslipData.details?.irpp > 0 && <tr><td className="px-4 py-2 text-red-600">- IRPP</td><td className="px-4 py-2 text-right text-red-600">{fmt(payslipData.details.irpp)}</td></tr>}
                  {payslipData.details?.trimf > 0 && <tr><td className="px-4 py-2 text-red-600">- TRIMF</td><td className="px-4 py-2 text-right text-red-600">{fmt(payslipData.details.trimf)}</td></tr>}
                  <tr className="bg-green-50 font-bold text-green-800"><td className="px-4 py-3 text-base">NET À PAYER</td><td className="px-4 py-3 text-right text-base">{fmt(payslipData.netSalary)}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => {
                const printArea = document.getElementById('payslip-print-area')
                if (!printArea) return
                const w = window.open('', '_blank', 'width=800,height=900')
                if (!w) return
                w.document.write(`<html><head><title>Fiche de paie - ${payslipData.agent?.user?.firstName} ${payslipData.agent?.user?.lastName}</title><style>
                  body{font-family:system-ui,sans-serif;padding:40px;color:#1e293b}
                  table{width:100%;border-collapse:collapse;margin-top:16px}
                  th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:13px}
                  thead{background:#f8fafc}
                  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1e293b}
                  .company{font-size:18px;font-weight:bold}
                  .subtitle{font-size:11px;color:#64748b;margin-top:4px}
                  .net{background:#dcfce7;font-weight:bold;font-size:15px}
                  .credit{color:#059669}.debit{color:#dc2626}
                  @media print{body{padding:20px}}
                </style></head><body>
                <div class="header"><div><div class="company">SAGARD SÉCURITÉ</div><div class="subtitle">Fiche de paie</div></div><div style="text-align:right"><strong>${String(payslipData.payroll?.month).padStart(2,'0')}/${payslipData.payroll?.year}</strong><br/><span class="subtitle">${payslipData.daysWorked}j travaillés · ${fmtHours(payslipData.hoursWorked)}</span></div></div>
                <p><strong>${payslipData.agent?.user?.firstName} ${payslipData.agent?.user?.lastName}</strong> — ${payslipData.agent?.matricule}</p>
                ${printArea.innerHTML}
                </body></html>`)
                w.document.close()
                w.print()
              }}
                className="flex items-center gap-2 px-4 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors">
                <FileText size={14} /> Imprimer
              </button>
              <button onClick={() => setPayslipData(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white">Fermer</button>
            </div>
          </div>
        </div>
      </div>
    )}

    </Fragment>
  )
}
