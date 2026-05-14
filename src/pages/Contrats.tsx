import { useState } from 'react'
import { Search, FileText, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { contracts } from '../data/mockData'
import { fmt, fmtDate } from '../lib/utils'
import type { ContractStatus } from '../types'

const statusCfg: Record<ContractStatus, { label: string; cls: string }> = {
  brouillon:     { label: 'Brouillon',     cls: 'bg-slate-100 text-slate-600' },
  actif:         { label: 'Actif',         cls: 'bg-green-100 text-green-700' },
  expire:        { label: 'Expiré',        cls: 'bg-red-100 text-red-700' },
  resilie:       { label: 'Résilié',       cls: 'bg-red-200 text-red-800' },
  renouvellement:{ label: 'Renouvellement',cls: 'bg-amber-100 text-amber-700' },
}

const histTypeCls: Record<string, string> = {
  create: 'bg-blue-500', update: 'bg-purple-500', status: 'bg-slate-400',
  payment: 'bg-green-500', document: 'bg-amber-500', note: 'bg-orange-400',
}

export default function Contrats() {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<ContractStatus | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = c.reference.toLowerCase().includes(q) || c.clientName.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const stats = {
    total:    contracts.length,
    actif:    contracts.filter(c=>c.status==='actif').length,
    renouvellement: contracts.filter(c=>c.status==='renouvellement').length,
    totalRevenue: contracts.reduce((s,c)=>s+c.monthlyAmount, 0),
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-2xl font-black text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-500">Total contrats</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-2xl font-black text-green-600">{stats.actif}</p>
          <p className="text-xs text-slate-500">Contrats actifs</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm bg-amber-50">
          <p className="text-2xl font-black text-amber-600">{stats.renouvellement}</p>
          <p className="text-xs text-amber-700">À renouveler</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-sagard-yellow shadow-sm">
          <p className="text-lg font-black text-slate-800">{fmt(stats.totalRevenue)}</p>
          <p className="text-xs text-slate-500">Revenu mensuel total</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Référence, client..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {(['all','actif','renouvellement','expire'] as const).map(s => (
                <button key={s} onClick={() => setFilter(s as ContractStatus | 'all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter===s ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {s === 'all' ? 'Tous' : statusCfg[s as ContractStatus].label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-xs font-bold hover:bg-sagard-yellow-dark transition-colors">
              <Plus size={13} /> Nouveau
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Référence','Client','Site','Type','Agents','Période','Montant/mois','Statut','Historique'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ct => (
                <>
                  <tr key={ct.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{ct.reference}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{ct.clientName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{ct.siteName}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{ct.type}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">{ct.nbAgents}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <p>{fmtDate(ct.startDate)}</p>
                      <p>{ct.endDate ? fmtDate(ct.endDate) : <span className="text-green-600 font-medium">CDI</span>}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 text-xs">{fmt(ct.monthlyAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusCfg[ct.status].cls}`}>
                        {statusCfg[ct.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setExpanded(expanded===ct.id ? null : ct.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-sagard-yellow-dark font-medium">
                        {expanded===ct.id ? <><ChevronUp size={13}/>Masquer</> : <><ChevronDown size={13}/>Voir</>}
                      </button>
                    </td>
                  </tr>
                  {expanded === ct.id && (
                    <tr key={`${ct.id}-hist`} className="bg-slate-50">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description</p>
                            <p className="text-sm text-slate-700">{ct.description}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Historique</p>
                            <div className="relative pl-5">
                              <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-300" />
                              <div className="space-y-2">
                                {ct.history.map(h => (
                                  <div key={h.id} className="relative">
                                    <div className={`absolute -left-4 top-1 w-2.5 h-2.5 rounded-full ${histTypeCls[h.type]}`} />
                                    <p className="text-xs font-semibold text-slate-700">{h.action} <span className="font-normal text-slate-400">— {h.user}</span></p>
                                    <p className="text-xs text-slate-500">{h.details}</p>
                                    <p className="text-xs text-slate-400">{fmtDate(h.date)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun contrat trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
