import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Users, ChevronDown, ChevronUp, Building2 } from 'lucide-react'
import { clients } from '../data/mockData'
import { fmt, fmtDate } from '../lib/utils'
import type { ClientStatus } from '../types'

const statusCfg: Record<ClientStatus, { label: string; cls: string }> = {
  actif:    { label: 'Actif',    cls: 'bg-green-100 text-green-700' },
  inactif:  { label: 'Inactif', cls: 'bg-slate-100 text-slate-500' },
  prospect: { label: 'Prospect', cls: 'bg-blue-100 text-blue-700' },
  suspendu: { label: 'Suspendu',cls: 'bg-red-100 text-red-700' },
}

const historyTypeCls: Record<string, string> = {
  create: 'bg-blue-500', update: 'bg-purple-500', status: 'bg-slate-400',
  payment: 'bg-green-500', document: 'bg-amber-500', note: 'bg-orange-400',
}

export default function Clients() {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<ClientStatus | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['all','actif','prospect','inactif'] as const).map(s => {
          const count = s === 'all' ? clients.length : clients.filter(c => c.status === s).length
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`bg-white rounded-xl p-4 border text-left transition-all ${filter===s ? 'border-sagard-yellow shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
              <p className="text-2xl font-black text-slate-800">{count}</p>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{s === 'all' ? 'Total clients' : statusCfg[s as ClientStatus].label + 's'}</p>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nom, secteur, ville..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
          </div>
          <button className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors">
            <Plus size={15} /> Nouveau client
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Client','Secteur','Contact','Contrats','CA Total','Statut','Historique'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => (
                <>
                  <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sagard-yellow/20 flex items-center justify-center flex-shrink-0">
                          <Building2 size={14} className="text-sagard-yellow-dark" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{client.name}</p>
                          <p className="text-xs text-slate-400">{client.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{client.sector}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700 font-medium text-xs">{client.contactName}</p>
                      <p className="text-slate-400 text-xs">{client.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-slate-800">{client.contracts}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 text-xs">{client.contracts > 0 ? fmt(client.totalRevenue) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusCfg[client.status].cls}`}>
                        {statusCfg[client.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === client.id ? null : client.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-sagard-yellow-dark font-medium"
                      >
                        {expanded === client.id ? <><ChevronUp size={13}/>Masquer</> : <><ChevronDown size={13}/>Voir</>}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded history row */}
                  {expanded === client.id && (
                    <tr key={`${client.id}-hist`} className="bg-slate-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="max-w-2xl">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Historique de suivi</p>
                          <div className="relative pl-6">
                            <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-300" />
                            <div className="space-y-3">
                              {client.history.map(h => (
                                <div key={h.id} className="relative">
                                  <div className={`absolute -left-5 top-1 w-3 h-3 rounded-full ${historyTypeCls[h.type] ?? 'bg-slate-400'}`} />
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                      <span className="text-sm font-semibold text-slate-800">{h.action}</span>
                                      <span className="text-xs text-slate-400 ml-2">par {h.user}</span>
                                      <p className="text-xs text-slate-500">{h.details}</p>
                                    </div>
                                    <span className="text-xs text-slate-400 flex-shrink-0">{fmtDate(h.date)}</span>
                                  </div>
                                </div>
                              ))}
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
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun client trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
