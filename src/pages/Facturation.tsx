import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, Search, Eye, AlertCircle, CheckCircle, Clock, FileText, Loader2, Plus, X, Trash2, Layers, ChevronRight, ArrowLeft, PlayCircle } from 'lucide-react'
import { fmt, fmtDate, daysOverdue } from '../lib/utils'
import { useApi } from '../lib/useApi'
import { getInvoices, createInvoice, payInvoice, getServiceCatalog } from '../services/invoices.service'
import { createBillingRun, previewBillingRun, generateBillingRun } from '../services/billing-runs.service'
import { getClients } from '../services/clients.service'

const FREQUENCIES = [
  { value: 'MENSUELLE',     label: 'Mensuelle' },
  { value: 'TRIMESTRIELLE', label: 'Trimestrielle' },
  { value: 'SEMESTRIELLE',  label: 'Semestrielle' },
  { value: 'ANNUELLE',      label: 'Annuelle' },
]

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
  ENVOYEE:   { label: 'Envoyée',   cls: 'bg-blue-100 text-blue-700' },
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
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fType, setFType]         = useState<'FACTURE' | 'DEVIS' | 'PROFORMA'>('FACTURE')
  const [clientId, setClientId]   = useState('')
  const [dueDate, setDueDate]     = useState('')
  const [notes, setNotes]         = useState('')
  const [lines, setLines]         = useState<Line[]>([{ ...EMPTY_LINE }])

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
    setFType('FACTURE'); setClientId(''); setDueDate(''); setNotes('')
    setLines([{ ...EMPTY_LINE }]); setFormError(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !dueDate || lines.some(l => !l.description || l.unitPrice <= 0)) {
      setFormError('Client, date d\'échéance et toutes les lignes (description + prix) sont obligatoires.')
      return
    }
    setSaving(true); setFormError(null)
    try {
      const inv = await createInvoice({ clientId, type: 'FACTURE', dueDate: new Date(dueDate), lines, notes: notes || undefined })
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

  const sum = (st: string) => all.filter(i => i.status === st).reduce((s: number, i: any) => s + Number(i.totalAmount ?? 0), 0)
  const cnt = (st: string) => all.filter(i => i.status === st).length

  const KPI_ITEMS = [
    { icon: CheckCircle, label: 'Payées',     value: fmt(sum('PAYEE')),     cls: 'bg-green-500', count: cnt('PAYEE') },
    { icon: Clock,       label: 'Envoyées',   value: fmt(sum('ENVOYEE')),   cls: 'bg-blue-500',  count: cnt('ENVOYEE') },
    { icon: AlertCircle, label: 'En retard',  value: fmt(sum('RETARD')),    cls: 'bg-red-500',   count: cnt('RETARD') },
    { icon: FileText,    label: 'Brouillons', value: fmt(sum('BROUILLON')), cls: 'bg-slate-400', count: cnt('BROUILLON') },
  ]

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <Fragment>
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_ITEMS.map(({ icon: Icon, label, value, cls, count }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              {loading
                ? <div className="w-20 h-4 bg-slate-200 rounded animate-pulse mb-1" />
                : <><p className="text-xs text-slate-500">{label} ({count})</p><p className="text-sm font-bold text-slate-800">{value}</p></>}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar + Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Référence, client..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all','BROUILLON','ENVOYEE','PAYEE','RETARD'] as const).map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {s === 'all' ? 'Toutes' : (STATUS_CFG[s]?.label ?? s)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { resetBillingWizard(); setShowBillingWizard(true) }}
              className="flex items-center gap-2 bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors whitespace-nowrap">
              <Layers size={14} /> Lot de facturation
            </button>
            <button onClick={() => { resetModal(); setShowModal(true) }}
              className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors whitespace-nowrap">
              <Plus size={15} /> Nouvelle facture
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Référence','Client','Type','Échéance','Montant TTC','Statut',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(inv => {
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
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {inv.status !== 'PAYEE' && inv.status !== 'ANNULEE' && inv.type === 'FACTURE' && (
                            <button onClick={async () => {
                              if (!confirm('Marquer cette facture comme payée ?')) return
                              try {
                                await payInvoice(inv.id, { paymentMethod: 'manual' })
                                reload()
                              } catch (err: any) {
                                alert(err.response?.data?.message ?? 'Erreur')
                              }
                            }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors" title="Marquer payée">
                              <CheckCircle size={13} />
                            </button>
                          )}
                          <button onClick={() => nav(`/facturation/${inv.id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-sagard-yellow text-sagard-dark rounded-lg text-xs font-semibold hover:bg-sagard-yellow-dark transition-colors">
                            <Eye size={13} /> Voir
                          </button>
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
      </div>
    </div>

    {/* Modal Nouvelle Facture */}
    {showModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Receipt size={18} className="text-sagard-yellow-dark" /> Nouvelle facture définitive
            </h2>
            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
            {/* En-tête */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Client *</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                  <option value="">Sélectionner un client...</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Date d'échéance *</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={minDate} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
              </div>
            </div>

            {/* Lignes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lignes de facturation</p>
                <button type="button" onClick={addLine}
                  className="flex items-center gap-1 text-xs text-sagard-yellow-dark font-semibold hover:underline">
                  <Plus size={13} /> Ajouter une ligne
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Désignation *</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500 w-16">Qté</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 w-32">P.U. (XOF) *</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 w-32">Total</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5">
                          <select value={line.description} onChange={e => setLine(i, 'description', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                            <option value="">-- Choisir une désignation --</option>
                            {catalog.length > 0 && <optgroup label="Catalogue">
                              {catalog.map((s: any) => (
                                <option key={s.id} value={`[${s.code}] ${s.description}`}>{s.code} — {s.description}</option>
                              ))}
                            </optgroup>}
                            {customDesignations.length > 0 && <optgroup label="Désignations personnalisées">
                              {customDesignations.map((d, idx) => (
                                <option key={`custom-${idx}`} value={d}>{d}</option>
                              ))}
                            </optgroup>}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={1} value={line.quantity} onChange={e => setLine(i, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={0} value={line.unitPrice || ''} onChange={e => setLine(i, 'unitPrice', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
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

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes / conditions (optionnel)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none"
                placeholder="Conditions de paiement, remarques..." />
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors disabled:opacity-60">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Création...</> : `Créer le ${fType.toLowerCase()}`}
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Période *</label>
                    <input type="month" value={billingForm.period} onChange={e => setBillingForm(f => ({ ...f, period: e.target.value }))} required
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                    <p className="text-[10px] text-slate-400 mt-1">Format YYYY-MM. Affiché sur chaque facture du lot.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date de facturation *</label>
                    <input type="date" value={billingForm.invoiceDate} onChange={e => setBillingForm(f => ({ ...f, invoiceDate: e.target.value }))} required
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fréquence ciblée *</label>
                    <select value={billingForm.invoicingFrequency} onChange={e => setBillingForm(f => ({ ...f, invoicingFrequency: e.target.value }))} required
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                      {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">Seuls les contrats ACTIFS dont la fréquence correspond seront inclus.</p>
                  </div>
                  <div className="col-span-2">
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
                    <p className="text-base font-black text-green-600">{fmt(Math.round((billingPreview.total ?? 0) * 1.18))}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total TTC (18%)</p>
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
    </Fragment>
  )
}
