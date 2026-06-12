import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileCheck, Search, Eye, Loader2, Plus, X, Trash2, Send, CheckCircle, XCircle } from 'lucide-react'
import { fmt, fmtDate } from '../lib/utils'
import { useApi } from '../lib/useApi'
import { getInvoices, createInvoice, updateInvoiceStatus, getServiceCatalog } from '../services/invoices.service'
import { getClients } from '../services/clients.service'
import { getLeads } from '../services/leads.service'

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
  ENVOYEE:   { label: 'Envoyé',    cls: 'bg-blue-100 text-blue-700' },
  ACCEPTEE:  { label: 'Accepté',   cls: 'bg-green-100 text-green-700' },
  PAYEE:     { label: 'Facturé',   cls: 'bg-emerald-100 text-emerald-700' },
  ANNULEE:   { label: 'Refusé',    cls: 'bg-red-100 text-red-700' },
}

type Line = { description: string; quantity: number; unitPrice: number }
const EMPTY_LINE: Line = { description: '', quantity: 1, unitPrice: 0 }

export default function Devis() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
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
  const all      = ((data as any[]) ?? []).filter(i => i.type === 'DEVIS')
  const clients  = (clientsData as any[]) ?? []
  const leads    = (leadsData as any[]) ?? []
  const catalog  = (catalogData as any[]) ?? []

  const filtered = all.filter(i => {
    const q = search.toLowerCase()
    return (i.reference ?? '').toLowerCase().includes(q)
      || (i.client?.name ?? '').toLowerCase().includes(q)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!clientId && !prospectId) || !dueDate || lines.some(l => !l.description || l.unitPrice <= 0)) {
      setFormError('Prospect/client, date de validité et toutes les lignes sont obligatoires.')
      return
    }
    setSaving(true); setFormError(null)
    try {
      await createInvoice({
        type: 'DEVIS',
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

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-2xl font-black text-slate-800">{all.length}</p>
          <p className="text-xs text-slate-500">Total devis</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <p className="text-2xl font-black text-green-600">{all.filter(i => i.status === 'ACCEPTEE' || i.status === 'PAYEE').length}</p>
          <p className="text-xs text-slate-500">Devis acceptés</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-sagard-yellow shadow-sm">
          <p className="text-lg font-black text-slate-800">{fmt(all.reduce((s, i) => s + Number(i.totalAmount ?? 0), 0))}</p>
          <p className="text-xs text-slate-500">Montant total</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Référence, client..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
          </div>
          <button onClick={() => { resetModal(); setShowModal(true) }}
            className="flex items-center gap-1.5 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-xs font-bold hover:bg-sagard-yellow-dark transition-colors">
            <Plus size={13} /> Nouveau devis
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Référence', 'Prospect / Client', 'Date', 'Validité', 'Montant', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const st = STATUS_CFG[inv.status] ?? { label: inv.status, cls: 'bg-slate-100 text-slate-500' }
                  return (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{inv.reference}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{inv.client?.name ?? inv.lead?.companyName ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(inv.issueDate)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(inv.dueDate)}</td>
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
                <FileCheck size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucun devis</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileCheck size={18} className="text-sagard-yellow-dark" /> Nouveau devis
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-4">
                {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                  <p className="text-xs text-indigo-700">
                    <b>💡 Le devis</b> est créé pour un prospect. Une fois accepté, il sera converti en facture proforma.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prospect</label>
                    <select value={prospectId} onChange={e => setProspectId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                      <option value="">— Aucun —</option>
                      {leads.filter(l => l.stage !== 'PERDU').map((l: any) => (
                        <option key={l.id} value={l.id}>{l.reference} — {l.companyName || l.contactName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ou Client existant</label>
                    <select value={clientId} onChange={e => setClientId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                      <option value="">— Aucun —</option>
                      {clients.map((c: any) => <option key={c.id} value={c.id}>{c.code ? `[${c.code}] ` : ''}{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date de validité *</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>

                {/* Lines */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lignes du devis</p>
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
                            <select value={line.description} onChange={e => setLine(idx, 'description', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 bg-white">
                              <option value="">-- Choisir une désignation --</option>
                              {catalog.map((s: any) => (
                                <option key={s.id} value={`[${s.code}] ${s.description}`}>{s.code} — {s.description}</option>
                              ))}
                            </select>
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
                  <button type="button" onClick={addLine}
                    className="text-xs font-semibold text-sagard-yellow-dark hover:underline">+ Ajouter une ligne</button>

                  <div className="flex justify-end mt-3">
                    <div className="w-60 space-y-1.5 text-sm">
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
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <button type="button" onClick={() => setShowModal(false)} className="text-sm text-slate-500 hover:text-slate-700">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors disabled:opacity-50">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Créer le devis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
