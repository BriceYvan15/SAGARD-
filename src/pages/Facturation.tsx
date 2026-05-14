import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, Search, Eye, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react'
import { invoices } from '../data/mockData'
import { fmt, fmtDate, daysOverdue } from '../lib/utils'
import type { InvoiceStatus } from '../types'

const statusConfig: Record<InvoiceStatus, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon',  cls: 'bg-slate-100 text-slate-600' },
  envoyee:   { label: 'Envoyée',    cls: 'bg-blue-100 text-blue-700' },
  payee:     { label: 'Payée',      cls: 'bg-green-100 text-green-700' },
  retard:    { label: 'En retard',  cls: 'bg-red-100 text-red-700' },
  annulee:   { label: 'Annulée',    cls: 'bg-slate-100 text-slate-400 line-through' },
}

export default function Facturation() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all')

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    const matchSearch = inv.reference.toLowerCase().includes(q) || inv.clientName.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || inv.status === filter
    return matchSearch && matchFilter
  })

  const totalPaid    = invoices.filter(i => i.status === 'payee').reduce((s, i) => s + i.totalAmount, 0)
  const totalPending = invoices.filter(i => i.status === 'envoyee').reduce((s, i) => s + i.totalAmount, 0)
  const totalOverdue = invoices.filter(i => i.status === 'retard').reduce((s, i) => s + i.totalAmount, 0)

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle, label: 'Payées', value: fmt(totalPaid), cls: 'bg-green-500', count: invoices.filter(i=>i.status==='payee').length },
          { icon: Clock,       label: 'Envoyées', value: fmt(totalPending), cls: 'bg-blue-500', count: invoices.filter(i=>i.status==='envoyee').length },
          { icon: AlertCircle, label: 'En retard', value: fmt(totalOverdue), cls: 'bg-red-500', count: invoices.filter(i=>i.status==='retard').length },
          { icon: FileText,    label: 'Brouillons', value: fmt(invoices.filter(i=>i.status==='brouillon').reduce((s,i)=>s+i.totalAmount,0)), cls: 'bg-slate-400', count: invoices.filter(i=>i.status==='brouillon').length },
        ].map(({ icon: Icon, label, value, cls, count }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label} ({count})</p>
              <p className="text-sm font-bold text-slate-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une facture..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all','brouillon','envoyee','payee','retard'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter===s ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {s === 'all' ? 'Toutes' : statusConfig[s as InvoiceStatus].label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Référence','Client','Émission','Échéance','Montant','Statut',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(inv => {
                const overdueDays = inv.status === 'retard' ? daysOverdue(inv.dueDate) : 0
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Receipt size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="font-mono font-semibold text-slate-800 text-xs">{inv.reference}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{inv.clientName}</p>
                      <p className="text-xs text-slate-400">{inv.contractRef}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(inv.issueDate)}</td>
                    <td className="px-4 py-3">
                      <p className={inv.status === 'retard' ? 'text-red-600 font-semibold' : 'text-slate-600'}>{fmtDate(inv.dueDate)}</p>
                      {overdueDays > 0 && <p className="text-xs text-red-500">{overdueDays}j de retard</p>}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{fmt(inv.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig[inv.status].cls}`}>
                        {statusConfig[inv.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => nav(`/facturation/${inv.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sagard-yellow text-sagard-dark rounded-lg text-xs font-semibold hover:bg-sagard-yellow-dark transition-colors"
                      >
                        <Eye size={13} /> Voir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Receipt size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucune facture trouvée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
