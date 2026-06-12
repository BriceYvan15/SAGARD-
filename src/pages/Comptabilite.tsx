import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, BookOpen, Wallet, Loader2, ArrowUpRight, ArrowDownRight, Filter, CreditCard, Plus, X, Receipt, FileText, Play, Ban } from 'lucide-react'
import { getAccountingDashboard, getJournal, getTreasury, getUnpaidInvoices, registerPayment, recordExpense, getExpenses, getBillingRuns, createBillingRun, generateBillingRun, cancelBillingRun } from '../services/accounting.service'
import { fmt, fmtDate } from '../lib/utils'

type Tab = 'dashboard' | 'journal' | 'treasury' | 'payments' | 'expenses' | 'billing'

const ENTRY_TYPES = [
  { value: '', label: 'Tous' },
  { value: 'VENTE', label: 'Ventes' },
  { value: 'ENCAISSEMENT', label: 'Encaissements' },
  { value: 'SALAIRE', label: 'Salaires' },
  { value: 'CARBURANT', label: 'Carburant' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]

const TYPE_COLORS: Record<string, string> = {
  VENTE: 'bg-blue-100 text-blue-700',
  ENCAISSEMENT: 'bg-green-100 text-green-700',
  SALAIRE: 'bg-purple-100 text-purple-700',
  CARBURANT: 'bg-amber-100 text-amber-700',
  MAINTENANCE: 'bg-orange-100 text-orange-700',
}

const PAYMENT_METHODS = [
  { value: 'VIREMENT', label: 'Virement bancaire' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
]

const EXPENSE_ACCOUNTS = [
  { value: '6055 — Fournitures carburant', label: 'Carburant' },
  { value: '6064 — Fournitures administratives', label: 'Fournitures bureau' },
  { value: '6155 — Entretien véhicules', label: 'Entretien véhicules' },
  { value: '6132 — Locations', label: 'Loyers' },
  { value: '6261 — Téléphone', label: 'Téléphone / Internet' },
  { value: '6271 — Frais bancaires', label: 'Frais bancaires' },
  { value: '6311 — Impôts et taxes', label: 'Impôts et taxes' },
  { value: '6581 — Charges diverses', label: 'Autres charges' },
]

export default function Comptabilite() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [year, setYear] = useState(new Date().getFullYear())

  // Dashboard
  const [dash, setDash] = useState<any>(null)
  const [dashLoading, setDashLoading] = useState(true)

  // Journal
  const [journal, setJournal] = useState<any>(null)
  const [jLoad, setJLoad] = useState(false)
  const [jMonth, setJMonth] = useState<number | undefined>(undefined)
  const [jType, setJType] = useState('')

  // Treasury
  const [treasury, setTreasury] = useState<any>(null)
  const [tLoad, setTLoad] = useState(false)

  // Payments
  const [unpaid, setUnpaid] = useState<any[]>([])
  const [pLoad, setPLoad] = useState(false)
  const [payModal, setPayModal] = useState<any>(null)
  const [payForm, setPayForm] = useState({ amount: '', paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'VIREMENT', reference: '' })
  const [payingSaving, setPayingSaving] = useState(false)

  // Expenses
  const [expenses, setExpenses] = useState<any[]>([])
  const [eLoad, setELoad] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expForm, setExpForm] = useState({ description: '', amount: '', account: EXPENSE_ACCOUNTS[0].value, date: new Date().toISOString().slice(0, 10), reference: '', category: '' })
  const [expSaving, setExpSaving] = useState(false)

  // Billing Runs
  const [billingRuns, setBillingRuns] = useState<any[]>([])
  const [bLoad, setBLoad] = useState(false)
  const [showBillingForm, setShowBillingForm] = useState(false)
  const [billingForm, setBillingForm] = useState({ period: new Date().toISOString().slice(0, 7), invoiceDate: new Date().toISOString().slice(0, 10), invoicingFrequency: 'monthly' })
  const [billingSaving, setBillingSaving] = useState(false)

  useEffect(() => {
    setDashLoading(true)
    getAccountingDashboard(year).then(setDash).catch(() => {}).finally(() => setDashLoading(false))
  }, [year])

  useEffect(() => {
    if (tab === 'journal') {
      setJLoad(true)
      getJournal({ year, month: jMonth, type: jType || undefined }).then(setJournal).catch(() => {}).finally(() => setJLoad(false))
    }
  }, [tab, year, jMonth, jType])

  useEffect(() => {
    if (tab === 'treasury') {
      setTLoad(true)
      getTreasury(year).then(setTreasury).catch(() => {}).finally(() => setTLoad(false))
    }
  }, [tab, year])

  useEffect(() => {
    if (tab === 'payments') {
      setPLoad(true)
      getUnpaidInvoices().then(setUnpaid).catch(() => {}).finally(() => setPLoad(false))
    }
  }, [tab])

  useEffect(() => {
    if (tab === 'expenses') {
      setELoad(true)
      getExpenses({ year }).then(setExpenses).catch(() => {}).finally(() => setELoad(false))
    }
  }, [tab, year])

  useEffect(() => {
    if (tab === 'billing') {
      setBLoad(true)
      getBillingRuns().then(setBillingRuns).catch(() => {}).finally(() => setBLoad(false))
    }
  }, [tab])

  const handlePayment = async () => {
    if (!payModal) return
    setPayingSaving(true)
    try {
      await registerPayment(payModal.id, {
        amount: payForm.amount ? +payForm.amount : undefined,
        paymentDate: payForm.paymentDate,
        paymentMethod: payForm.paymentMethod,
        reference: payForm.reference || undefined,
      })
      setPayModal(null)
      setUnpaid(prev => prev.filter(i => i.id !== payModal.id))
      // Refresh dashboard
      getAccountingDashboard(year).then(setDash).catch(() => {})
    } catch (err) {
      console.error(err)
    } finally {
      setPayingSaving(false)
    }
  }

  const handleExpense = async () => {
    if (!expForm.description || !expForm.amount) return
    setExpSaving(true)
    try {
      await recordExpense({
        description: expForm.description,
        amount: +expForm.amount,
        account: expForm.account,
        date: expForm.date,
        reference: expForm.reference || undefined,
        category: expForm.category || undefined,
      })
      setShowExpenseForm(false)
      setExpForm({ description: '', amount: '', account: EXPENSE_ACCOUNTS[0].value, date: new Date().toISOString().slice(0, 10), reference: '', category: '' })
      setELoad(true)
      getExpenses({ year }).then(setExpenses).catch(() => {}).finally(() => setELoad(false))
    } catch (err) {
      console.error(err)
    } finally {
      setExpSaving(false)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#1E1E1E] rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-[#C8D400] text-xs font-bold uppercase tracking-widest">Comptabilité</p>
          <p className="text-white text-lg font-bold mt-0.5">Gestion financière</p>
        </div>
        <select value={year} onChange={e => setYear(+e.target.value)}
          className="bg-[#2A2A2A] text-white border border-[#444] rounded-lg px-3 py-2 text-sm">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {([
          { key: 'dashboard' as Tab, label: 'Tableau de bord', icon: TrendingUp },
          { key: 'payments' as Tab, label: 'Paiements', icon: CreditCard },
          { key: 'expenses' as Tab, label: 'Dépenses', icon: Receipt },
          { key: 'journal' as Tab, label: 'Journal', icon: BookOpen },
          { key: 'treasury' as Tab, label: 'Trésorerie', icon: Wallet },
          { key: 'billing' as Tab, label: 'Facturation auto', icon: FileText },
        ]).map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center whitespace-nowrap ${tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ═══ DASHBOARD ═══ */}
      {tab === 'dashboard' && (
        dashLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div> : dash && (
          <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Chiffre d'affaires</span>
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center"><TrendingUp size={18} className="text-green-600" /></div>
                </div>
                <p className="text-2xl font-black text-slate-800">{fmt(dash.revenue.total)}</p>
                <p className="text-xs text-slate-400 mt-1">Factures encaissées {year}</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Créances clients</span>
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center"><DollarSign size={18} className="text-amber-600" /></div>
                </div>
                <p className="text-2xl font-black text-amber-600">{fmt(dash.pending.total)}</p>
                <p className="text-xs text-slate-400 mt-1">{dash.pending.count} facture(s) en attente</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Charges totales</span>
                  <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center"><TrendingDown size={18} className="text-red-600" /></div>
                </div>
                <p className="text-2xl font-black text-red-600">{fmt(dash.expenses.total)}</p>
                <p className="text-xs text-slate-400 mt-1">Salaires + Véhicules</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Résultat net</span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dash.netResult >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {dash.netResult >= 0 ? <ArrowUpRight size={18} className="text-emerald-600" /> : <ArrowDownRight size={18} className="text-red-600" />}
                  </div>
                </div>
                <p className={`text-2xl font-black ${dash.netResult >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(dash.netResult)}</p>
                <p className="text-xs text-slate-400 mt-1">Marge : {dash.margin}%</p>
              </div>
            </div>

            {/* Détail charges */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Masse salariale</p>
                <p className="text-xl font-bold text-purple-700">{fmt(dash.expenses.salaries)}</p>
                <div className="mt-3 space-y-1">
                  {(dash.expenses.salaryByMonth ?? []).filter((m: any) => m.amount > 0).map((m: any) => (
                    <div key={m.month} className="flex justify-between text-xs">
                      <span className="text-slate-500">Mois {String(m.month).padStart(2,'0')}</span>
                      <span className="font-medium text-slate-700">{fmt(m.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Carburant</p>
                <p className="text-xl font-bold text-amber-700">{fmt(dash.expenses.fuel)}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Maintenance véhicules</p>
                <p className="text-xl font-bold text-orange-700">{fmt(dash.expenses.maintenance)}</p>
              </div>
            </div>

            {/* Revenue par mois */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-4">Revenus mensuels {year}</p>
              <div className="flex items-end gap-2 h-40">
                {(dash.revenue.byMonth ?? []).map((m: any) => {
                  const max = Math.max(...(dash.revenue.byMonth ?? []).map((x: any) => x.amount), 1)
                  const h = Math.max((m.amount / max) * 100, 2)
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-slate-600">{m.amount > 0 ? fmt(m.amount) : ''}</span>
                      <div className="w-full bg-sagard-yellow/80 rounded-t" style={{ height: `${h}%` }} />
                      <span className="text-[10px] text-slate-400">{m.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      )}

      {/* ═══ JOURNAL COMPTABLE ═══ */}
      {tab === 'journal' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select value={jMonth ?? ''} onChange={e => setJMonth(e.target.value ? +e.target.value : undefined)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
                <option value="">Tous les mois</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(year, i).toLocaleString('fr-FR', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1">
              {ENTRY_TYPES.map(t => (
                <button key={t.value} onClick={() => setJType(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${jType === t.value ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {jLoad ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div> : journal && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-bold text-slate-700">{journal.entries.length} écritures</p>
                <div className="flex gap-4 text-xs">
                  <span className="text-red-600 font-semibold">Débit: {fmt(journal.totals.debit)}</span>
                  <span className="text-green-600 font-semibold">Crédit: {fmt(journal.totals.credit)}</span>
                  <span className={`font-bold ${journal.totals.balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Solde: {fmt(journal.totals.balance)}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-100">
                    {['Date', 'Type', 'Référence', 'Libellé', 'Compte', 'Débit', 'Crédit', 'Solde'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {(journal.entries ?? []).map((e: any) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-xs text-slate-600">{fmtDate(e.date)}</td>
                        <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[e.type] ?? 'bg-slate-100 text-slate-600'}`}>{e.type}</span></td>
                        <td className="px-4 py-2.5 text-xs font-mono text-slate-700">{e.reference}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-700 max-w-xs truncate">{e.description}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{e.account}</td>
                        <td className="px-4 py-2.5 font-medium text-red-600">{e.debit > 0 ? fmt(e.debit) : ''}</td>
                        <td className="px-4 py-2.5 font-medium text-green-600">{e.credit > 0 ? fmt(e.credit) : ''}</td>
                        <td className={`px-4 py-2.5 font-semibold text-xs ${e.balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(e.balance)}</td>
                      </tr>
                    ))}
                    {(journal.entries ?? []).length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm"><BookOpen size={40} className="mx-auto mb-3 opacity-30" />Aucune écriture pour cette période</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ PAIEMENTS ═══ */}
      {tab === 'payments' && (
        pLoad ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div> : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">Factures en attente de paiement ({unpaid.length})</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-100">
                    {['Référence', 'Client', 'Montant', 'Échéance', 'Statut', ''].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {unpaid.map((inv: any) => {
                      const isLate = new Date(inv.dueDate) < new Date()
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{inv.reference}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{inv.client?.name ?? '—'}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{fmt(Number(inv.totalAmount))}</td>
                          <td className={`px-4 py-3 text-xs ${isLate ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>{fmtDate(inv.dueDate)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === 'RETARD' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {inv.status === 'RETARD' ? 'En retard' : 'Envoyée'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => {
                              setPayForm({ amount: String(Number(inv.totalAmount)), paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'VIREMENT', reference: '' })
                              setPayModal(inv)
                            }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors">
                              <CreditCard size={12} /> Encaisser
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {unpaid.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                        <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                        Toutes les factures sont réglées
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment modal */}
            {payModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">Enregistrer un paiement</h3>
                    <button onClick={() => setPayModal(null)} className="p-1 rounded hover:bg-slate-100"><X size={16} /></button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Facture</p>
                      <p className="font-bold text-slate-800">{payModal.reference} — {payModal.client?.name}</p>
                      <p className="text-sm text-slate-600 mt-1">Montant total : <strong>{fmt(Number(payModal.totalAmount))}</strong></p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Montant reçu (XOF)</label>
                      <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Date de paiement</label>
                      <input type="date" value={payForm.paymentDate} onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Mode de paiement</label>
                      <select value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Référence (optionnel)</label>
                      <input value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                        placeholder="N° chèque, réf. virement..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setPayModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
                      <button onClick={handlePayment} disabled={payingSaving}
                        className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-60">
                        {payingSaving ? 'Enregistrement...' : 'Confirmer le paiement'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ═══ DÉPENSES ═══ */}
      {tab === 'expenses' && (
        eLoad ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div> : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowExpenseForm(true)}
                className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors">
                <Plus size={15} /> Saisir une dépense
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-100">
                    {['Date', 'Description', 'Compte', 'Montant', 'Référence', 'Saisi par'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenses.map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(exp.date ?? exp.createdAt)}</td>
                        <td className="px-4 py-3 text-xs text-slate-700 font-medium">{exp.description}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{exp.account}</td>
                        <td className="px-4 py-3 font-bold text-red-600">{fmt(exp.amount)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{exp.reference ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{exp.createdBy ? `${exp.createdBy.firstName} ${exp.createdBy.lastName}` : '—'}</td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                        <Receipt size={40} className="mx-auto mb-3 opacity-30" />
                        Aucune dépense saisie pour {year}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expense form modal */}
            {showExpenseForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">Saisir une dépense</h3>
                    <button onClick={() => setShowExpenseForm(false)} className="p-1 rounded hover:bg-slate-100"><X size={16} /></button>
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
                      <input value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Ex: Achat carburant bureau" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Montant (XOF) *</label>
                        <input type="number" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                        <input type="date" value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Compte comptable</label>
                      <select value={expForm.account} onChange={e => setExpForm(f => ({ ...f, account: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                        {EXPENSE_ACCOUNTS.map(a => <option key={a.value} value={a.value}>{a.label} ({a.value})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Référence / justificatif</label>
                      <input value={expForm.reference} onChange={e => setExpForm(f => ({ ...f, reference: e.target.value }))}
                        placeholder="N° pièce, bon..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    </div>
                    <div className="flex justify-end gap-2 pt-3">
                      <button onClick={() => setShowExpenseForm(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
                      <button onClick={handleExpense} disabled={expSaving || !expForm.description || !expForm.amount}
                        className="px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                        {expSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ═══ TRÉSORERIE ═══ */}
      {tab === 'treasury' && (
        tLoad ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div> : treasury && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-700">Trésorerie mensuelle {year}</p>
                <p className={`text-sm font-bold ${treasury.cumulativeSolde >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  Solde cumulé : {fmt(treasury.cumulativeSolde)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-100">
                    {['Mois', 'Encaissements', 'Décaissements', 'Solde mensuel'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {(treasury.months ?? []).map((m: any) => (
                      <tr key={m.month} className={`hover:bg-slate-50 ${m.encaissements === 0 && m.decaissements === 0 ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-3 font-medium text-slate-700 capitalize">{m.label}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{m.encaissements > 0 ? `+${fmt(m.encaissements)}` : '—'}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{m.decaissements > 0 ? `-${fmt(m.decaissements)}` : '—'}</td>
                        <td className={`px-4 py-3 font-bold ${m.solde >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{m.solde !== 0 ? fmt(m.solde) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bar chart visuel simplifié */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-4">Flux de trésorerie</p>
              <div className="space-y-2">
                {(treasury.months ?? []).filter((m: any) => m.encaissements > 0 || m.decaissements > 0).map((m: any) => {
                  const max = Math.max(...(treasury.months ?? []).map((x: any) => Math.max(x.encaissements, x.decaissements)), 1)
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-12 capitalize">{m.label.slice(0, 4)}</span>
                      <div className="flex-1 flex gap-1 h-5">
                        <div className="bg-green-400 rounded-sm" style={{ width: `${(m.encaissements / max) * 100}%` }} title={`Encaissements: ${fmt(m.encaissements)}`} />
                        <div className="bg-red-400 rounded-sm" style={{ width: `${(m.decaissements / max) * 100}%` }} title={`Décaissements: ${fmt(m.decaissements)}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded-sm" /> Encaissements</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm" /> Décaissements</span>
              </div>
            </div>
          </div>
        )
      )}

      {/* ═══ FACTURATION AUTOMATIQUE ═══ */}
      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Lots de facturation</h2>
              <p className="text-xs text-slate-400 mt-0.5">Génération automatique des factures depuis les contrats actifs</p>
            </div>
            <button onClick={() => { setBillingForm({ period: new Date().toISOString().slice(0, 7), invoiceDate: new Date().toISOString().slice(0, 10), invoicingFrequency: 'monthly' }); setShowBillingForm(true) }}
              className="flex items-center gap-2 bg-sagard-yellow hover:bg-sagard-yellow-dark text-sagard-dark text-sm font-bold px-4 py-2 rounded-xl transition-colors">
              <Plus size={16} /> Nouveau lot
            </button>
          </div>

          {bLoad ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
          ) : (
            <div className="space-y-3">
              {billingRuns.map((br: any) => {
                const stCls = br.status === 'BROUILLON' ? 'bg-slate-100 text-slate-600' : br.status === 'EXECUTE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                const stLabel = br.status === 'BROUILLON' ? 'Brouillon' : br.status === 'EXECUTE' ? 'Exécuté' : 'Annulé'
                return (
                  <div key={br.id} className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FileText size={18} className="text-blue-600" /></div>
                        <div>
                          <p className="font-bold text-slate-800">{br.reference ?? br.id.slice(0, 8)}</p>
                          <p className="text-xs text-slate-400">Période : {br.period} · {br.invoicingFrequency === 'monthly' ? 'Mensuelle' : br.invoicingFrequency === 'quarterly' ? 'Trimestrielle' : br.invoicingFrequency}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-slate-400">{br._count?.invoices ?? br.invoices?.length ?? 0} facture(s)</p>
                          {br.totalAmount != null && <p className="font-bold text-slate-800">{fmt(br.totalAmount)}</p>}
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${stCls}`}>{stLabel}</span>
                        {br.status === 'BROUILLON' && (
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              if (!confirm('Générer les factures pour ce lot ?')) return
                              setBillingSaving(true)
                              try { await generateBillingRun(br.id); setBLoad(true); getBillingRuns().then(setBillingRuns).finally(() => setBLoad(false)) }
                              catch (err: any) { alert(err.response?.data?.message ?? 'Erreur') }
                              finally { setBillingSaving(false) }
                            }} disabled={billingSaving}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100">
                              <Play size={12} /> Générer
                            </button>
                            <button onClick={async () => {
                              if (!confirm('Annuler ce lot ?')) return
                              try { await cancelBillingRun(br.id); setBLoad(true); getBillingRuns().then(setBillingRuns).finally(() => setBLoad(false)) }
                              catch (err: any) { alert(err.response?.data?.message ?? 'Erreur') }
                            }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100">
                              <Ban size={12} /> Annuler
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {billingRuns.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
                  <FileText size={40} className="mx-auto mb-3 opacity-30" /> Aucun lot de facturation
                </div>
              )}
            </div>
          )}

          {/* Modal Nouveau lot */}
          {showBillingForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-sagard-yellow-dark" /> Nouveau lot de facturation</h2>
                  <button onClick={() => setShowBillingForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Période (AAAA-MM)</label>
                    <input type="month" value={billingForm.period} onChange={e => setBillingForm(f => ({ ...f, period: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date de facturation</label>
                    <input type="date" value={billingForm.invoiceDate} onChange={e => setBillingForm(f => ({ ...f, invoiceDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fréquence ciblée</label>
                    <select value={billingForm.invoicingFrequency} onChange={e => setBillingForm(f => ({ ...f, invoicingFrequency: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                      <option value="monthly">Mensuelle</option>
                      <option value="quarterly">Trimestrielle</option>
                      <option value="biannual">Semestrielle</option>
                      <option value="annual">Annuelle</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowBillingForm(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
                    <button onClick={async () => {
                      setBillingSaving(true)
                      try {
                        await createBillingRun(billingForm)
                        setShowBillingForm(false)
                        setBLoad(true); getBillingRuns().then(setBillingRuns).finally(() => setBLoad(false))
                      } catch (err: any) { alert(err.response?.data?.message ?? 'Erreur') }
                      finally { setBillingSaving(false) }
                    }} disabled={billingSaving}
                      className="px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                      {billingSaving ? 'Création...' : 'Créer le lot'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

