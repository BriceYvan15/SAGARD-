import { Fragment, useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, Search, Eye, AlertCircle, CheckCircle, Clock, FileText, Loader2, Plus, X, Trash2, Layers, ChevronRight, ArrowLeft, PlayCircle, MoreVertical, Pencil, Send, Download, AlertTriangle, CreditCard } from 'lucide-react'
import Pagination from '../components/Pagination'
import DatePicker from '../components/DatePicker'
import Select from '../components/Select'
import { fmt, fmtDate, daysOverdue } from '../lib/utils'
import { useApi } from '../lib/useApi'
import { getInvoices, createInvoice, payInvoice, getServiceCatalog, markOverdue, deleteInvoice, updateInvoiceStatus, updateInvoice, sendInvoiceEmail, downloadInvoicePdf } from '../services/invoices.service'
import { registerPayment } from '../services/accounting.service'
import { createBillingRun, previewBillingRun, generateBillingRun } from '../services/billing-runs.service'
import { getClients } from '../services/clients.service'
import { isDG } from '../lib/roles'
import toast from 'react-hot-toast'

const FREQUENCIES = [
  { value: 'MENSUELLE',     label: 'Mensuelle' },
  { value: 'TRIMESTRIELLE', label: 'Trimestrielle' },
  { value: 'SEMESTRIELLE',  label: 'Semestrielle' },
  { value: 'ANNUELLE',      label: 'Annuelle' },
]

const PAYMENT_METHODS = [
  { value: 'CHEQUE',             label: 'Chèque' },
  { value: 'VIREMENT_BANCAIRE',  label: 'Virement bancaire' },
  { value: 'MOBILE_MONEY',       label: 'Mobile Money' },
  { value: 'ESPECE',             label: 'Espèces' },
]

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
  ENVOYEE:   { label: 'Envoyée',   cls: 'bg-blue-100 text-blue-700' },
  ACCEPTEE:  { label: 'Acceptée',  cls: 'bg-indigo-100 text-indigo-700' },
  PARTIELLEMENT_PAYEE: { label: 'Acompte', cls: 'bg-amber-100 text-amber-700' },
  PAYEE:     { label: 'Payée',     cls: 'bg-green-100 text-green-700' },
  RETARD:    { label: 'En retard', cls: 'bg-red-100 text-red-700' },
  ANNULEE:   { label: 'Annulée',   cls: 'bg-slate-100 text-slate-400 line-through' },
}

type Line = { description: string; quantity: number; unitPrice: number }

const EMPTY_LINE: Line = { description: '', quantity: 1, unitPrice: 0 }

export default function Facturation() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fType, setFType]         = useState<'FACTURE' | 'DEVIS' | 'PROFORMA'>('FACTURE')
  const [clientId, setClientId]   = useState('')
  const [dueDate, setDueDate]     = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [notes, setNotes]         = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [lines, setLines]         = useState<Line[]>([{ ...EMPTY_LINE }])

  // ─── Modal Marquer comme payé ───
  const [payModalInvoice, setPayModalInvoice] = useState<any>(null)
  const [payMethod, setPayMethod] = useState('')
  const [payBusy, setPayBusy]     = useState(false)
  const [payMode, setPayMode]     = useState<'total' | 'partial'>('total')
  const [payAmount, setPayAmount] = useState('')

  // ─── Action menu (3 dots) ───
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left?: number } | null>(null)
  const actionBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // ─── Edit modal ───
  const [editModal, setEditModal] = useState<any>(null)
  const [editIssueDate, setEditIssueDate] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editLines, setEditLines] = useState<Line[]>([])
  const [editSaving, setEditSaving] = useState(false)

  const openEditModal = (inv: any) => {
    setEditIssueDate(inv.issueDate ? new Date(inv.issueDate).toISOString().slice(0, 10) : '')
    setEditDueDate(inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '')
    setEditNotes(inv.notes ?? '')
    setEditLines((inv.lines ?? []).map((l: any) => ({ description: l.description, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) })))
    setEditModal(inv)
    setActionMenu(null)
  }

  const handleSaveEdit = async () => {
    if (!editModal) return
    setEditSaving(true)
    try {
      await updateInvoice(editModal.id, {
        issueDate: editIssueDate ? new Date(editIssueDate) : undefined,
        dueDate: editDueDate ? new Date(editDueDate) : undefined,
        notes: editNotes || undefined,
        lines: editLines.length > 0 ? editLines : undefined,
      })
      toast.success('Facture modifiée')
      setEditModal(null)
      reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la modification')
    } finally {
      setEditSaving(false)
    }
  }

  const handleStatusChange = async (inv: any, status: string) => {
    setActionMenu(null)
    try {
      await updateInvoiceStatus(inv.id, status)
      toast.success('Statut mis à jour')
      reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur')
    }
  }

  const handleSendFromList = async (inv: any) => {
    setActionMenu(null)
    try {
      await sendInvoiceEmail(inv.id)
      if (inv.status === 'BROUILLON') await updateInvoiceStatus(inv.id, 'ENVOYEE')
      toast.success('Facture envoyée par e-mail')
      reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de l\'envoi')
    }
  }

  const handleDownloadFromList = async (inv: any) => {
    setActionMenu(null)
    try {
      await downloadInvoicePdf(inv.id)
      if (inv.status === 'BROUILLON') await updateInvoiceStatus(inv.id, 'ENVOYEE')
      reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors du téléchargement')
    }
  }

  // ─── Wizard Lot de facturation ───
  const [showBillingWizard, setShowBillingWizard] = useState(false)
  const [billingStep, setBillingStep] = useState<1 | 2 | 3>(1)
  const [billingRun, setBillingRun]   = useState<any>(null)
  const [billingPreview, setBillingPreview] = useState<any>(null)
  const [billingForm, setBillingForm] = useState({
    period: new Date().toISOString().slice(0, 7), // YYYY-MM
    invoiceDate: new Date().toISOString().slice(0, 10),
    invoicingFrequency: 'MENSUELLE',
    notes: '',
  })
  const [billingBusy, setBillingBusy] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  const resetBillingWizard = () => {
    setBillingStep(1); setBillingRun(null); setBillingPreview(null); setBillingError(null)
    setBillingForm({
      period: new Date().toISOString().slice(0, 7),
      invoiceDate: new Date().toISOString().slice(0, 10),
      invoicingFrequency: 'MENSUELLE',
      notes: '',
    })
  }

  const billingNext = async () => {
    setBillingBusy(true); setBillingError(null)
    try {
      if (billingStep === 1) {
        const run = await createBillingRun(billingForm)
        const preview = await previewBillingRun(run.id)
        setBillingRun(run); setBillingPreview(preview)
        setBillingStep(2)
      } else if (billingStep === 2) {
        await generateBillingRun(billingRun.id)
        setBillingStep(3)
        reload()
      }
    } catch (err: any) {
      setBillingError(err.response?.data?.message ?? 'Erreur')
    } finally {
      setBillingBusy(false)
    }
  }

  const { data, loading, reload } = useApi(getInvoices)
  const { data: clientsData }     = useApi(getClients)
  const { data: catalogData }     = useApi(getServiceCatalog)

  // Mark overdue invoices on mount so RETARD status is up-to-date
  useEffect(() => { markOverdue().then(() => reload()).catch(() => {}) }, [])
  const all      = ((data as any[]) ?? []).filter(i => i.type === 'FACTURE' || !i.type)
  const clients  = (clientsData as any[]) ?? []
  const catalog  = (catalogData as any[]) ?? []
  const customDesignations: string[] = (() => {
    try { const s = localStorage.getItem('sagard_invoice_designations'); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })()

  const addLine    = () => setLines(l => [...l, { ...EMPTY_LINE }])
  const removeLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i))
  const setLine    = (i: number, k: keyof Line, v: string) =>
    setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [k]: k === 'description' ? v : Number(v) || 0 } : ln))

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const total    = subtotal

  const resetModal = () => {
    setFType('FACTURE'); setClientId(''); setDueDate(''); setIssueDate(''); setNotes('')
    setPaymentMethod(''); setLines([{ ...EMPTY_LINE }]); setFormError(null)
  }

  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (inv: any) => {
    setDeleteTarget(inv)
    setActionMenu(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteInvoice(deleteTarget.id)
      toast.success('Facture supprimée')
      setDeleteTarget(null)
      reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !dueDate || lines.some(l => !l.description || l.unitPrice <= 0)) {
      setFormError('Client, date d\'échéance et toutes les lignes (description + prix) sont obligatoires.')
      return
    }
    setSaving(true); setFormError(null)
    try {
      const inv = await createInvoice({ clientId, type: 'FACTURE', dueDate: new Date(dueDate), issueDate: issueDate ? new Date(issueDate) : undefined, lines, notes: notes || undefined, paymentMethod: paymentMethod || undefined })
      reload()
      setShowModal(false)
      resetModal()
      nav(`/facturation/${inv.id}`)
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = all.filter(inv => {
    const q = search.toLowerCase()
    const matchSearch = (inv.reference ?? '').toLowerCase().includes(q)
      || (inv.client?.name ?? '').toLowerCase().includes(q)
    const matchFilter = filter === 'all' || inv.status === filter
    return matchSearch && matchFilter
  })

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, Math.ceil(filtered.length / pageSize))))

  const sum = (st: string) => all.filter(i => i.status === st).reduce((s: number, i: any) => s + Number(i.totalAmount ?? 0), 0)
  const cnt = (st: string) => all.filter(i => i.status === st).length

  const KPI_ITEMS = [
    { key: 'PAYEE',     icon: CheckCircle, label: 'Payées',     value: fmt(sum('PAYEE')),     iconBg: 'bg-green-50', iconColor: 'text-green-600', borderActive: 'border-green-400 ring-2 ring-green-200', count: cnt('PAYEE') },
    { key: 'PARTIELLEMENT_PAYEE', icon: CreditCard, label: 'Acomptes', value: fmt(sum('PARTIELLEMENT_PAYEE')), iconBg: 'bg-amber-50', iconColor: 'text-amber-600', borderActive: 'border-amber-400 ring-2 ring-amber-200', count: cnt('PARTIELLEMENT_PAYEE') },
    { key: 'ENVOYEE',   icon: Clock,       label: 'Envoyées',   value: fmt(sum('ENVOYEE')),   iconBg: 'bg-blue-50', iconColor: 'text-blue-600', borderActive: 'border-blue-400 ring-2 ring-blue-200', count: cnt('ENVOYEE') },
    { key: 'RETARD',    icon: AlertCircle, label: 'En retard',  value: fmt(sum('RETARD')),    iconBg: 'bg-red-50', iconColor: 'text-red-600', borderActive: 'border-red-400 ring-2 ring-red-200', count: cnt('RETARD') },
    { key: 'BROUILLON', icon: FileText,    label: 'Brouillons', value: fmt(sum('BROUILLON')), iconBg: 'bg-slate-100', iconColor: 'text-slate-500', borderActive: 'border-sagard-yellow ring-2 ring-sagard-yellow/30', count: cnt('BROUILLON') },
  ]

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <Fragment>
    <div className="space-y-6">
      {/* Summary KPIs — cliquables pour filtrer */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {KPI_ITEMS.map(({ key, icon: Icon, label, value, iconBg, iconColor, borderActive, count }) => (
          <button
            key={key}
            onClick={() => { setFilter(filter === key ? 'all' : key); setPage(1) }}
            className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3 text-left ${filter === key ? borderActive : 'border-slate-200'}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Icon size={20} className={iconColor} />
            </div>
            <div>
              {loading
                ? <div className="w-20 h-4 bg-slate-200 rounded animate-pulse mb-1" />
                : <><p className="text-xs text-slate-500 font-medium">{label} ({count})</p><p className="text-sm font-bold text-slate-800">{value}</p></>}
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar + Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 p-4 border-b border-slate-100">
          {/* Row 1: Search + Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Référence, client..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { resetBillingWizard(); setShowBillingWizard(true) }}
                className="flex items-center gap-2 bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors whitespace-nowrap">
                <Layers size={14} /> <span className="hidden sm:inline">Lot de facturation</span><span className="sm:hidden">Lot</span>
              </button>
              <button onClick={() => { resetModal(); setShowModal(true) }}
                className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-3 sm:px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors whitespace-nowrap">
                <Plus size={15} /> <span className="hidden sm:inline">Nouvelle facture</span><span className="sm:hidden">Facture</span>
              </button>
            </div>
          </div>
          {/* Row 2: Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Statut</span>
              {(['all','BROUILLON','ENVOYEE','PARTIELLEMENT_PAYEE','PAYEE','RETARD','ANNULEE'] as const).map(s => (
                <button key={s} onClick={() => { setFilter(s); setPage(1) }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {s === 'all' ? 'Toutes' : (STATUS_CFG[s]?.label ?? s)}
                </button>
              ))}
            </div>
            {filter !== 'all' && (
              <button onClick={() => { setFilter('all'); setPage(1) }} className="ml-auto text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors">
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Référence','Client','Type','Échéance','Montant TTC','Statut',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map(inv => {
                  const st = STATUS_CFG[inv.status] ?? { label: inv.status, cls: 'bg-slate-100 text-slate-500' }
                  const overdueDays = inv.status === 'RETARD' ? daysOverdue(inv.dueDate) : 0
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Receipt size={14} className="text-slate-400 flex-shrink-0" />
                          <span className="font-mono font-semibold text-slate-800 text-xs">{inv.reference}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700">{inv.client?.name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{inv.contract?.reference ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{inv.type ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className={inv.status === 'RETARD' ? 'text-red-600 font-semibold' : 'text-slate-600'}>{fmtDate(inv.dueDate)}</p>
                        {overdueDays > 0 && <p className="text-xs text-red-500">{overdueDays}j de retard</p>}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{fmt(Number(inv.totalAmount ?? 0))}</td>
                      <td className="px-4 py-3">
                        {isDG() && inv.status !== 'PAYEE' && inv.status !== 'ANNULEE' && inv.type === 'FACTURE' ? (
                          <select
                            value={inv.status}
                            onChange={e => { e.stopPropagation(); handleStatusChange(inv, e.target.value) }}
                            className={`px-2 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${st.cls}`}
                          >
                            <option value="BROUILLON">Brouillon</option>
                            <option value="ENVOYEE">Envoyée</option>
                            <option value="ACCEPTEE">Acceptée</option>
                            <option value="PARTIELLEMENT_PAYEE">Acompte</option>
                            <option value="RETARD">En retard</option>
                            <option value="ANNULEE">Annulée</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            ref={el => { actionBtnRefs.current[inv.id] = el }}
                            onClick={() => {
                              if (actionMenu === inv.id) {
                                setActionMenu(null)
                              } else {
                                const btn = actionBtnRefs.current[inv.id]
                                const rect = btn?.getBoundingClientRect()
                                if (rect) {
                                  const menuWidth = 180
                                  const spaceBelow = window.innerHeight - rect.bottom
                                  const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)
                                  if (spaceBelow < 260) {
                                    setMenuPos({ bottom: window.innerHeight - rect.top + 4, left })
                                  } else {
                                    setMenuPos({ top: rect.bottom + 4, left })
                                  }
                                }
                                setActionMenu(inv.id)
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical size={16} className="text-slate-400" />
                          </button>
                          {actionMenu === inv.id && menuPos && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                              <div
                                style={{ top: menuPos.top, bottom: menuPos.bottom, left: menuPos.left }}
                                className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[180px]">
                                <button onClick={() => { nav(`/facturation/${inv.id}`); setActionMenu(null) }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                                  <Eye size={13} /> Voir le détail
                                </button>
                                <button onClick={() => handleDownloadFromList(inv)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                                  <Download size={13} /> Télécharger PDF
                                </button>
                                <button onClick={() => handleSendFromList(inv)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                                  <Send size={13} /> Envoyer par email
                                </button>
                                {inv.status !== 'PAYEE' && inv.status !== 'ANNULEE' && inv.type === 'FACTURE' && (
                                  <button onClick={() => { setPayModalInvoice(inv); setPayMethod(''); setPayMode('total'); setPayAmount(String(Number(inv.totalAmount ?? 0))); setActionMenu(null) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-700 hover:bg-green-50 transition-colors">
                                    <CheckCircle size={13} /> Marquer payée
                                  </button>
                                )}
                                {isDG() && inv.status !== 'PAYEE' && (
                                  <button onClick={() => openEditModal(inv)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                                    <Pencil size={13} /> Modifier
                                  </button>
                                )}
                                {isDG() && (
                                  <>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button onClick={() => { handleDelete(inv); setActionMenu(null) }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                                      <Trash2 size={13} /> Supprimer
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Receipt size={40} className="mx-auto mb-3 opacity-30" />
                <p>{search || filter !== 'all' ? 'Aucun résultat' : 'Aucune facture enregistrée'}</p>
              </div>
            )}
          </div>
        )}
        {filtered.length > 0 && (
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={goToPage} onPageSizeChange={s => { setPageSize(s); setPage(1) }} />
        )}
      </div>
    </div>

    {/* Modal Marquer comme payé */}
    {payModalInvoice && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setPayModalInvoice(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header with gradient */}
          <div className="relative px-6 py-5" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a2332 100%)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Encaisser un paiement</h2>
                  <p className="text-[11px] text-slate-400">Confirmez le paiement de la facture</p>
                </div>
              </div>
              <button onClick={() => setPayModalInvoice(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
          </div>
          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 text-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Receipt size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Facture</span>
              </div>
              <p className="font-bold text-slate-800">{payModalInvoice.reference}</p>
              <p className="text-slate-600 text-xs mt-0.5">{payModalInvoice.client?.name ?? '—'}</p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Montant total</p>
                <p className="text-xl font-black text-sagard-yellow-dark">{fmt(Number(payModalInvoice.totalAmount ?? 0))}</p>
                {Number(payModalInvoice.paidAmount ?? 0) > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-amber-700">Acompte déjà versé : <strong>{fmt(Number(payModalInvoice.paidAmount ?? 0))}</strong></p>
                    <p className="text-sm text-red-600 font-bold">Reste à payer : {fmt(Number(payModalInvoice.totalAmount ?? 0) - Number(payModalInvoice.paidAmount ?? 0))}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Choix: totalité ou acompte */}
            {Number(payModalInvoice.paidAmount ?? 0) === 0 && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setPayMode('total'); setPayAmount(String(Number(payModalInvoice.totalAmount ?? 0))) }}
                  className={`px-4 py-3 rounded-lg text-sm font-bold border-2 transition-colors ${payMode === 'total' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  <CheckCircle size={18} className="mx-auto mb-1" />
                  Paiement total
                  <p className="text-[10px] font-normal mt-0.5">{fmt(Number(payModalInvoice.totalAmount ?? 0))}</p>
                </button>
                <button
                  onClick={() => { setPayMode('partial'); setPayAmount('') }}
                  className={`px-4 py-3 rounded-lg text-sm font-bold border-2 transition-colors ${payMode === 'partial' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  <Receipt size={18} className="mx-auto mb-1" />
                  Acompte
                  <p className="text-[10px] font-normal mt-0.5">Paiement partiel</p>
                </button>
              </div>
            )}

            {payMode === 'partial' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Montant de l'acompte (XOF)</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="Saisir le montant" />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mode de paiement <span className="text-red-500">*</span></label>
              <Select value={payMethod} onChange={setPayMethod}
                options={PAYMENT_METHODS.map(m => ({ value: m.value, label: m.label }))}
                placeholder="— Sélectionner le mode de paiement —" className="w-full" />
            </div>
          </div>
          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button type="button" onClick={() => setPayModalInvoice(null)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white bg-white transition-colors">
              Annuler
            </button>
            <button
              disabled={!payMethod || payBusy || (payMode === 'partial' && !payAmount)}
              onClick={async () => {
                setPayBusy(true)
                try {
                  if (payMode === 'partial' && payAmount) {
                    await registerPayment(payModalInvoice.id, {
                      amount: +payAmount,
                      paymentMethod: payMethod,
                    })
                  } else {
                    await payInvoice(payModalInvoice.id, { paymentMethod: payMethod })
                  }
                  reload()
                  setPayModalInvoice(null)
                } catch (err: any) {
                  alert(err.response?.data?.message ?? 'Erreur')
                } finally {
                  setPayBusy(false)
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {payBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Confirmer le paiement
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal Nouvelle Facture */}
    {showModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header with gradient */}
          <div className="relative px-6 py-5" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a2332 100%)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sagard-yellow/20 flex items-center justify-center">
                  <Receipt size={20} className="text-sagard-yellow" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Nouvelle facture</h2>
                  <p className="text-[11px] text-slate-400">Créez une facture pour un client</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
          </div>

          <form onSubmit={handleCreate} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Section: En-tête */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <FileText size={12} /> Informations générales
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Client <span className="text-red-500">*</span></label>
                  <Select value={clientId} onChange={setClientId}
                    options={clients.map((c: any) => ({ value: c.id, label: c.name }))}
                    placeholder="— Sélectionner un client —" className="w-full" />
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date d'émission</label>
                  <DatePicker value={issueDate} onChange={setIssueDate} placeholder="— Aujourd'hui —" className="w-full" />
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date d'échéance <span className="text-red-500">*</span></label>
                  <DatePicker value={dueDate} onChange={setDueDate} placeholder="— Sélectionner —" className="w-full" />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Section: Lignes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Layers size={12} /> Lignes de facturation
                </div>
                <button type="button" onClick={addLine}
                  className="flex items-center gap-1 text-xs text-sagard-yellow-dark font-semibold hover:underline">
                  <Plus size={13} /> Ajouter une ligne
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Désignation <span className="text-red-500">*</span></th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500 w-16">Qté</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 w-32">P.U. (XOF) <span className="text-red-500">*</span></th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 w-32">Total</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-2 py-1.5">
                          <Select
                            value={line.description}
                            onChange={v => {
                              setLine(i, 'description', v)
                              const matched = catalog.find((s: any) => `[${s.code}] ${s.description}` === v)
                              if (matched && matched.unitPrice) {
                                setLine(i, 'unitPrice', String(matched.unitPrice))
                              }
                            }}
                            size="sm"
                            placeholder="— Choisir —"
                            className="w-full"
                            groups={[
                              ...(catalog.length > 0 ? [{
                                label: 'Catalogue',
                                options: catalog.map((s: any) => ({ value: `[${s.code}] ${s.description}`, label: `${s.code} — ${s.description}` })),
                              }] : []),
                              ...(customDesignations.length > 0 ? [{
                                label: 'Désignations personnalisées',
                                options: customDesignations.map((d) => ({ value: d, label: d })),
                              }] : []),
                            ]}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={1} value={line.quantity} onChange={e => setLine(i, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 focus:border-sagard-yellow/40 transition-all" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={0} value={line.unitPrice || ''} onChange={e => setLine(i, 'unitPrice', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 focus:border-sagard-yellow/40 transition-all" />
                        </td>
                        <td className="px-3 py-1.5 text-right text-xs font-semibold text-slate-700">
                          {new Intl.NumberFormat('fr-FR').format(line.quantity * line.unitPrice)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {lines.length > 1 && (
                            <button type="button" onClick={() => removeLine(i)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totaux */}
              <div className="flex justify-end mt-3">
                <div className="w-60 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Sous-total</span>
                    <span>{new Intl.NumberFormat('fr-FR').format(subtotal)} XOF</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-800 text-base border-t border-slate-200 pt-1.5">
                    <span>TOTAL</span>
                    <span className="text-sagard-yellow-dark">{new Intl.NumberFormat('fr-FR').format(total)} XOF</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Section: Paiement & Notes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <AlertCircle size={12} /> Paiement & Notes
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mode de paiement</label>
                <Select value={paymentMethod} onChange={setPaymentMethod}
                  options={PAYMENT_METHODS.map(m => ({ value: m.value, label: m.label }))}
                  placeholder="— Sélectionner —" className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes / conditions <span className="text-slate-400 font-normal">(optionnel)</span></label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 focus:border-sagard-yellow/40 resize-none transition-all"
                  placeholder="Conditions de paiement, remarques..." />
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                <AlertCircle size={14} className="flex-shrink-0" />
                {formError}
              </div>
            )}
            </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-white bg-white transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors disabled:opacity-60">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Création...</> : <><Plus size={14} /> Créer la facture</>}
            </button>
          </div>
          </form>
        </div>
      </div>
    )}

    {/* === WIZARD : Lot de facturation périodique (équivalent sagard.billing.run d'Odoo) === */}
    {showBillingWizard && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers size={18} className="text-sagard-yellow-dark" />
              Lot de facturation périodique
              {billingRun?.reference && <span className="text-xs font-mono text-slate-400 ml-2">{billingRun.reference}</span>}
            </h2>
            <button onClick={() => setShowBillingWizard(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs">
            {[
              { n: 1, label: 'Paramètres' },
              { n: 2, label: 'Prévisualisation' },
              { n: 3, label: 'Confirmation' },
            ].map((s, idx) => {
              const isDone   = billingStep > s.n
              const isActive = billingStep === s.n
              return (
                <Fragment key={s.n}>
                  <div className={`flex items-center gap-2 ${isActive ? 'text-sagard-dark font-bold' : isDone ? 'text-green-600 font-semibold' : 'text-slate-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-sagard-yellow text-sagard-dark' : isDone ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {isDone ? <CheckCircle size={12}/> : s.n}
                    </div>
                    {s.label}
                  </div>
                  {idx < 2 && <ChevronRight size={14} className="text-slate-300" />}
                </Fragment>
              )
            })}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* ÉTAPE 1 : Paramètres */}
            {billingStep === 1 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                  <b>Étape 1/3 :</b> Définissez la période et la fréquence. Le système identifiera ensuite les contrats actifs éligibles.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Période *</label>
                    <input type="month" value={billingForm.period} onChange={e => setBillingForm(f => ({ ...f, period: e.target.value }))} required
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                    <p className="text-[10px] text-slate-400 mt-1">Format YYYY-MM. Affiché sur chaque facture du lot.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date de facturation *</label>
                    <DatePicker value={billingForm.invoiceDate} onChange={v => setBillingForm(f => ({ ...f, invoiceDate: v }))} placeholder="— Sélectionner —" className="w-full" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fréquence ciblée *</label>
                    <Select value={billingForm.invoicingFrequency} onChange={v => setBillingForm(f => ({ ...f, invoicingFrequency: v }))}
                      options={FREQUENCIES.map(f => ({ value: f.value, label: f.label }))}
                      className="w-full" />
                    <p className="text-[10px] text-slate-400 mt-1">Seuls les contrats ACTIFS dont la fréquence correspond seront inclus.</p>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Notes internes (optionnel)</label>
                    <textarea value={billingForm.notes} onChange={e => setBillingForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none"
                      placeholder="Commentaire interne sur ce lot..." />
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : Preview */}
            {billingStep === 2 && billingPreview && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  <b>Étape 2/3 :</b> Vérifiez la liste des contrats qui seront facturés. Cliquez sur « Générer les factures » pour confirmer.
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-slate-800">{billingPreview.count ?? 0}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Contrats éligibles</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-base font-black text-sagard-yellow-dark">{fmt(billingPreview.total ?? 0)}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total HT estimé</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-base font-black text-green-600">{fmt(billingPreview.total ?? 0)}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total à facturer</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {['Référence', 'Client', 'Intitulé', 'Montant HT'].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(billingPreview.contracts ?? []).map((c: any) => (
                        <tr key={c.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-2 font-mono font-bold text-slate-700">{c.reference}</td>
                          <td className="px-3 py-2 text-slate-700">{c.client?.name ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-600">{c.title ?? '—'}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">{fmt(Number(c.monthlyAmount ?? 0))}</td>
                        </tr>
                      ))}
                      {billingPreview.count === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                            <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                            <p>Aucun contrat éligible pour cette fréquence.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : Confirmation */}
            {billingStep === 3 && (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Lot exécuté avec succès</h3>
                <p className="text-sm text-slate-500 mb-4">
                  <b>{billingPreview?.count ?? 0}</b> facture(s) ont été créée(s) en brouillon pour la période <b>{billingForm.period}</b>.
                </p>
                <p className="text-xs text-slate-400">
                  Les factures sont maintenant disponibles dans la liste ci-dessous, prêtes à être envoyées aux clients.
                </p>
              </div>
            )}

            {billingError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{billingError}</div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
            {billingStep === 1 && (
              <>
                <button type="button" onClick={() => setShowBillingWizard(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white transition-colors">
                  Annuler
                </button>
                <button type="button" onClick={billingNext} disabled={billingBusy || !billingForm.period || !billingForm.invoiceDate}
                  className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors disabled:opacity-60">
                  {billingBusy ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                  Continuer
                </button>
              </>
            )}
            {billingStep === 2 && (
              <>
                <button type="button" onClick={() => setBillingStep(1)} disabled={billingBusy}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white transition-colors">
                  <ArrowLeft size={14} /> Retour
                </button>
                <button type="button" onClick={billingNext} disabled={billingBusy || (billingPreview?.count ?? 0) === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60">
                  {billingBusy ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                  Générer les {billingPreview?.count ?? 0} facture(s)
                </button>
              </>
            )}
            {billingStep === 3 && (
              <>
                <div />
                <button type="button" onClick={() => setShowBillingWizard(false)}
                  className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors">
                  <CheckCircle size={14} /> Terminé
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Edit Modal */}
    {editModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Pencil size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Modifier la facture</h2>
                <p className="text-[11px] text-slate-400">{editModal.reference}</p>
              </div>
            </div>
            <button onClick={() => setEditModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date d'émission</label>
                <DatePicker value={editIssueDate} onChange={setEditIssueDate} placeholder="— Aujourd'hui —" className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date d'échéance</label>
                <DatePicker value={editDueDate} onChange={setEditDueDate} placeholder="— Sélectionner —" className="w-full" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
              <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30" rows={2} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600">Lignes de facturation</label>
                <button onClick={() => setEditLines(l => [...l, { ...EMPTY_LINE }])}
                  className="flex items-center gap-1 text-xs text-amber-600 font-semibold hover:text-amber-700">
                  <Plus size={12} /> Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {editLines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <input value={line.description} onChange={e => setEditLines(l => l.map((ln, i) => i === idx ? { ...ln, description: e.target.value } : ln))}
                      className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg" placeholder="Description" />
                    <input type="number" value={line.quantity} onChange={e => setEditLines(l => l.map((ln, i) => i === idx ? { ...ln, quantity: Number(e.target.value) || 0 } : ln))}
                      className="w-16 px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-center" />
                    <input type="number" value={line.unitPrice} onChange={e => setEditLines(l => l.map((ln, i) => i === idx ? { ...ln, unitPrice: Number(e.target.value) || 0 } : ln))}
                      className="w-28 px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-right" />
                    <button onClick={() => setEditLines(l => l.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {editLines.length > 0 && (
                <div className="mt-2 text-right text-sm font-semibold text-slate-700">
                  Total: {new Intl.NumberFormat('fr-FR').format(editLines.reduce((s, l) => s + l.quantity * l.unitPrice, 0))} F CFA
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
            <button type="button" onClick={() => setEditModal(null)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white bg-white transition-colors">
              Annuler
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={editSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
              {editSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Confirmation Modal */}
    {deleteTarget && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Supprimer la facture ?</h3>
            <p className="text-sm text-slate-500">
              Êtes-vous sûr de vouloir supprimer la facture
              <span className="font-mono font-bold text-slate-700"> {deleteTarget.reference} </span>
              de
              <span className="font-semibold text-slate-700"> {deleteTarget.client?.name ?? '—'}</span>
              {' '}d'un montant de
              <span className="font-bold text-slate-700"> {fmt(Number(deleteTarget.totalAmount ?? 0))}</span>
              {' '}?
            </p>
            <p className="text-xs text-red-500 font-medium mt-3 flex items-center justify-center gap-1">
              <AlertTriangle size={12} /> Cette action est irréversible
            </p>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white bg-white transition-colors disabled:opacity-50">
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    )}
    </Fragment>
  )
}
