import { useState } from 'react'
import { Search, Plus, UserCheck } from 'lucide-react'
import { agents } from '../data/mockData'
import { fmtDate } from '../lib/utils'
import type { AgentStatus } from '../types'

const statusCfg: Record<AgentStatus, { label: string; cls: string }> = {
  actif:     { label: 'En poste',    cls: 'bg-green-100 text-green-700' },
  inactif:   { label: 'Inactif',    cls: 'bg-slate-100 text-slate-500' },
  conge:     { label: 'En congé',   cls: 'bg-blue-100 text-blue-700' },
  formation: { label: 'Formation',  cls: 'bg-amber-100 text-amber-700' },
}

const shiftCfg = { jour: 'Jour', nuit: 'Nuit', mixte: 'Mixte' }

export default function Agents() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AgentStatus | 'all'>('all')

  const filtered = agents.filter(a => {
    const q = search.toLowerCase()
    const name = `${a.firstName} ${a.lastName}`.toLowerCase()
    const matchSearch = name.includes(q) || a.matricule.toLowerCase().includes(q) || a.position.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || a.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['all','actif','formation','conge'] as const).map(s => {
          const count = s === 'all' ? agents.length : agents.filter(a => a.status === s).length
          const labels: Record<string, string> = { all:'Total agents', actif:'En poste', formation:'En formation', conge:'En congé' }
          return (
            <button key={s} onClick={() => setFilter(s as AgentStatus | 'all')}
              className={`bg-white rounded-xl p-4 border text-left transition-all ${filter===s ? 'border-sagard-yellow shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
              <p className="text-2xl font-black text-slate-800">{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{labels[s]}</p>
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
              placeholder="Nom, matricule, poste..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
          </div>
          <button className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors">
            <Plus size={15} /> Nouvel agent
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Agent','Matricule','Poste','Site affecté','Vacation','Embauche','Certifications','Statut'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(agent => {
                const initials = agent.firstName[0] + agent.lastName[0]
                const colors = ['bg-blue-500','bg-purple-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-cyan-500']
                const colorIdx = (agent.firstName.charCodeAt(0) + agent.lastName.charCodeAt(0)) % colors.length
                return (
                  <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${colors[colorIdx]} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{agent.firstName} {agent.lastName}</p>
                          <p className="text-xs text-slate-400">{agent.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{agent.matricule}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{agent.position}</td>
                    <td className="px-4 py-3 text-xs">
                      {agent.siteName
                        ? <span className="text-slate-700">{agent.siteName}</span>
                        : <span className="text-slate-400 italic">Non affecté</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        agent.shift==='jour' ? 'bg-amber-100 text-amber-700' :
                        agent.shift==='nuit' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}>{shiftCfg[agent.shift]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(agent.hireDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {agent.certifications.map(cert => (
                          <span key={cert} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{cert}</span>
                        ))}
                        {agent.certifications.length === 0 && <span className="text-xs text-slate-400 italic">En cours</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusCfg[agent.status].cls}`}>
                        {statusCfg[agent.status].label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <UserCheck size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun agent trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
