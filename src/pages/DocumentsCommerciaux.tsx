import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Search, Eye, Loader2, Plus, X, Trash2, Send,
  CheckCircle, XCircle, FileCheck, FileBadge,
} from 'lucide-react'
import { fmt, fmtDate } from '../lib/utils'
import { useApi } from '../lib/useApi'
import { getInvoices, createInvoice, updateInvoiceStatus, getServiceCatalog } from '../services/invoices.service'
import { getClients } from '../services/clients.service'
import { getLeads } from '../services/leads.service'
import Select from '../components/Select'
import DatePicker from '../components/DatePicker'

type DocType = 'DEVIS' | 'PROFORMA'

const TYPE_CFG: Record<DocType, { label: string; cls: string; icon: any; btnLabel: string }> = {
  DEVIS:    { label: 'Devis',    cls: 'bg-indigo-100 text-indigo-700', icon: FileCheck,  btnLabel: 'Nouveau devis' },
  PROFORMA: { label: 'Proforma', cls: 'bg-purple-100 text-purple-700', icon: FileBadge, btnLabel: 'Nouvelle proforma' },
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
  ENVOYEE:   { label: 'Envoyé',    cls: 'bg-blue-100 text-blue-700' },
  ACCEPTEE:  { label: 'Accepté',   cls: 'bg-green-100 text-green-700' },
  PAYEE:     { label: 'Facturé',   cls: 'bg-emerald-100 text-emerald-700' },
  ANNULEE:   { label: 'Refusé',    cls: 'bg-red-100 text-red-700' },
}

type Line = { description: string; quantity: number; unitPrice: number }
const EMPTY_LINE: Line = { description: '', quantity: 1, unitPrice: 0 }

export default function DocumentsCommerciaux() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | DocType>('ALL')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<DocType>('DEVIS')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [prospectId, setProspectId] = useState('')
  const [clientId, setClientId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }])

  const { data, loading, reload } = useApi(getInvoices)
  const { data: clientsData }     = useApi(getClients)
  const { data: leadsData }       = useApi(getLeads)
  const { data: catalogData }     = useApi(getServiceCatalog)

  const allDocs = ((data as any[]) ?? []).filter(i => i.type === 'DEVIS' || i.type === 'PROFORMA')
  const clients = (clientsData as any[]) ?? []
  const leads   = (leadsData as any[]) ?? []
  const catalog = (catalogData as any[]) ?? []
  const customDesignations: string[] = (() => {
    try { const s = localStorage.getItem('sagard_invoice_designations'); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })()

  const filtered = allDocs.filter(i => {
    const matchType = typeFilter === 'ALL' || i.type === typeFilter
    const q = search.toLowerCase()
    const matchSearch = (i.reference ?? '').toLowerCase().includes(q)
      || (i.client?.name ?? '').toLowerCase().includes(q)
      || (i.lead?.companyName ?? '').toLowerCase().includes(q)
    return matchType && matchSearch
  })

  const addLine    = () => setLines(l => [...l, { ...EMPTY_LINE }])
  const removeLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i))
  const setLine    = (i: number, k: keyof Line, v: string) =>
    setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [k]: k === 'description' ? v : Number(v) || 0 } : ln))

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)

  const resetModal = () => {
    setProspectId(''); setClientId(''); setDueDate(''); setNotes('')
    setLines([{ ...EMPTY_LINE }]); setFormError(null)
  }

  const openCreate = (type: DocType) => {
    setModalType(type)
    resetModal()
    setShowModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!clientId && !prospectId) || !dueDate || lines.some(l => !l.description || l.unitPrice <= 0)) {
      setFormError('Prospect/client, date de validité et toutes les lignes sont obligatoires.')
      return
    }
    setSaving(true); setFormError(null)
    try {
      await createInvoice({
        type: modalType,
        clientId: clientId || undefined,
        leadId: prospectId || undefined,
        dueDate: new Date(dueDate),
        notes,
        lines: lines.map(l => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice })),
        totalAmount: subtotal,
      })
      setShowModal(false)
      resetModal()
      reload()
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  // KPIs
  const devisCount    = allDocs.filter(i => i.type === 'DEVIS').length
  const proformaCount = allDocs.filter(i => i.type === 'PROFORMA').length
  const acceptedCount = allDocs.filter(i => i.status === 'ACCEPTEE' || i.status === 'PAYEE').length
  const totalAmount   = allDocs.reduce((s, i) => s + Number(i.totalAmount ?? 0), 0)

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0"><FileCheck size={18} className="text-indigo-600" /></div>
          <div><p className="text-2xl font-black text-slate-800">{devisCount}</p><p className="text-xs text-slate-500">Devis</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0"><FileBadge size={18} className="text-purple-600" /></div>
          <div><p className="text-2xl font-black text-slate-800">{proformaCount}</p><p className="text-xs text-slate-500">Proformas</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><CheckCircle size={18} className="text-green-600" /></div>
          <div><p className="text-2xl font-black text-slate-800">{acceptedCount}</p><p className="text-xs text-slate-500">Acceptés</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0"><FileText size={18} className="text-amber-600" /></div>
          <div><p className="text-lg font-black text-slate-800">{fmt(totalAmount)}</p><p className="text-xs text-slate-500">Montant total</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Référence, client..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
            </div>
            {/* Type filter */}
            <div className="flex gap-1 flex-wrap">
              {(['ALL', 'DEVIS', 'PROFORMA'] as const).map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    typeFilter === t ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {t === 'ALL' ? 'Tous' : t === 'DEVIS' ? 'Devis' : 'Proformas'}
                  <span className="ml-1 font-black">
                    {t === 'ALL' ? allDocs.length : allDocs.filter(d => d.type === t).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => openCreate('DEVIS')}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
              <FileCheck size={13} /> Nouveau devis
            </button>
            <button onClick={() => openCreate('PROFORMA')}
              className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors">
              <FileBadge size={13} /> Nouvelle proforma
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Référence', 'Type', 'Prospect / Client', 'Date', 'Validité', 'Montant', 'Statut', 'Actions'].map((h, idx) => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 ${idx === 1 || idx === 3 || idx === 4 ? 'hidden md:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const st   = STATUS_CFG[inv.status] ?? { label: inv.status, cls: 'bg-slate-100 text-slate-500' }
                  const tp   = TYPE_CFG[inv.type as DocType]
                  return (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{inv.reference}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tp?.cls ?? ''}`}>{tp?.label ?? inv.type}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{inv.client?.name ?? inv.lead?.companyName ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{fmtDate(inv.issueDate)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{fmtDate(inv.dueDate)}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{fmt(Number(inv.totalAmount ?? 0))}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => nav(`/facturation/${inv.id}`)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-sagard-yellow-dark" title="Voir">
                            <Eye size={15} />
                          </button>
                          {inv.status === 'BROUILLON' && (
                            <button onClick={async () => { await updateInvoiceStatus(inv.id, 'ENVOYEE'); reload() }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700" title="Marquer comme envoyé">
                              <Send size={14} />
                            </button>
                          )}
                          {inv.status === 'ENVOYEE' && (
                            <>
                              <button onClick={async () => { await updateInvoiceStatus(inv.id, 'ACCEPTEE'); reload() }}
                                className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 hover:text-green-700" title="Accepter">
                                <CheckCircle size={14} />
                              </button>
                              <button onClick={async () => { await updateInvoiceStatus(inv.id, 'ANNULEE'); reload() }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600" title="Refuser">
                                <XCircle size={14} />
                              </button>
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
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p>{search || typeFilter !== 'ALL' ? 'Aucun résultat' : 'Aucun document commercial'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                {modalType === 'DEVIS'
                  ? <><FileCheck size={18} className="text-indigo-600" /> Nouveau devis</>
                  : <><FileBadge size={18} className="text-purple-600" /> Nouvelle facture proforma</>
                }
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto">
              <div className="px-4 sm:px-6 py-5 space-y-4">
                {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}

                <div className={`border rounded-xl p-3 ${modalType === 'DEVIS' ? 'bg-indigo-50 border-indigo-200' : 'bg-purple-50 border-purple-200'}`}>
                  <p className={`text-xs ${modalType === 'DEVIS' ? 'text-indigo-700' : 'text-purple-700'}`}>
                    {modalType === 'DEVIS'
                      ? <><b>Devis</b> — Document d'offre commerciale pour un prospect ou client.</>
                      : <><b>Facture Proforma</b> — Document pré-facturation envoyé avant confirmation du contrat.</>
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prospect</label>
                    <Select value={prospectId} onChange={v => { setProspectId(v); if (v) setClientId('') }}
                      options={leads.filter(l => l.stage !== 'PERDU').map((l: any) => ({ value: l.id, label: `${l.reference} — ${l.companyName || l.contactName}` }))}
                      placeholder="— Aucun —" className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ou Client existant</label>
                    <Select value={clientId} onChange={v => { setClientId(v); if (v) setProspectId('') }}
                      options={clients.map((c: any) => ({ value: c.id, label: `${c.code ? `[${c.code}] ` : ''}${c.name}` }))}
                      placeholder="— Aucun —" className="w-full" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date de validité *</label>
                  <DatePicker value={dueDate} onChange={v => setDueDate(v)} className="w-full" />
                </div>

                {/* Lines */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lignes</p>
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse mb-2">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Description</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500 w-20">Qté</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 w-32">Prix unit.</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 w-28">Total</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="px-2 py-1.5">
                            <Select value={line.description} onChange={v => {
                              setLine(idx, 'description', v)
                              const matched = catalog.find((s: any) => `[${s.code}] ${s.description}` === v)
                              if (matched && matched.unitPrice) {
                                setLine(idx, 'unitPrice', String(matched.unitPrice))
                              }
                            }}
                              size="sm"
                              placeholder="-- Choisir une désignation --"
                              groups={[
                                ...(catalog.length > 0 ? [{ label: 'Catalogue', options: catalog.map((s: any) => ({ value: `[${s.code}] ${s.description}`, label: `${s.code} — ${s.description}` })) }] : []),
                                ...(customDesignations.length > 0 ? [{ label: 'Désignations personnalisées', options: customDesignations.map((d: string) => ({ value: d, label: d })) }] : []),
                              ]}
                              className="w-full" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min={1} value={line.quantity} onChange={e => setLine(idx, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min={0} value={line.unitPrice || ''} onChange={e => setLine(idx, 'unitPrice', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40"
                              placeholder="0" />
                          </td>
                          <td className="px-2 py-1.5 text-right text-sm font-bold text-slate-800">
                            {new Intl.NumberFormat('fr-FR').format(line.quantity * line.unitPrice)} XOF
                          </td>
                          <td className="px-1">
                            {lines.length > 1 && (
                              <button type="button" onClick={() => removeLine(idx)} className="p-1 text-red-400 hover:text-red-600">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  <button type="button" onClick={addLine}
                    className="text-xs font-semibold text-sagard-yellow-dark hover:underline">+ Ajouter une ligne</button>

                  <div className="flex justify-end mt-3">
                    <div className="w-full sm:w-60 space-y-1.5 text-sm">
                      <div className="flex justify-between font-black text-slate-800 text-base border-t border-slate-200 pt-1.5">
                        <span>TOTAL</span>
                        <span className="text-sagard-yellow-dark">{new Intl.NumberFormat('fr-FR').format(subtotal)} XOF</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Notes / conditions</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none" />
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <button type="button" onClick={() => setShowModal(false)} className="text-sm text-slate-500 hover:text-slate-700">Annuler</button>
                <button type="submit" disabled={saving}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 ${
                    modalType === 'DEVIS'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}>
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {modalType === 'DEVIS' ? 'Créer le devis' : 'Créer la proforma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
