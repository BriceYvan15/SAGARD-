import { useState } from 'react'
import { Activity, Search, Sun, Moon, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react'
import { operations } from '../data/mockData'

const statusCfg = {
  en_cours: { label: 'En cours',  cls: 'bg-blue-100 text-blue-700',    icon: Clock },
  termine:  { label: 'Terminé',   cls: 'bg-green-100 text-green-700',  icon: CheckCircle },
  absent:   { label: 'Absent',    cls: 'bg-red-100 text-red-700',      icon: XCircle },
  retard:   { label: 'En retard', cls: 'bg-amber-100 text-amber-700',  icon: AlertTriangle },
}

export default function Operations() {
  const [search, setSearch] = useState('')
  const [shiftFilter, setShiftFilter] = useState<'all'|'jour'|'nuit'>('all')

  const filtered = operations.filter(op => {
    const q = search.toLowerCase()
    const matchSearch = op.agentName.toLowerCase().includes(q) || (op.siteName ?? '').toLowerCase().includes(q)
    const matchShift = shiftFilter === 'all' || op.shift === shiftFilter
    return matchSearch && matchShift
  })

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const inProgress = operations.filter(o => o.status==='en_cours').length
  const lates      = operations.filter(o => o.status==='retard').length
  const done       = operations.filter(o => o.status==='termine').length

  return (
    <div className="space-y-5">
      {/* Day banner */}
      <div className="bg-[#1E1E1E] rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-[#C8D400] text-xs font-bold uppercase tracking-widest">Rapport du jour</p>
          <p className="text-white text-lg font-bold capitalize mt-0.5">{today}</p>
        </div>
        <div className="flex gap-6 text-center">
          <div><p className="text-2xl font-black text-[#C8D400]">{inProgress}</p><p className="text-slate-400 text-xs">En poste</p></div>
          <div><p className="text-2xl font-black text-green-400">{done}</p><p className="text-slate-400 text-xs">Terminés</p></div>
          <div><p className="text-2xl font-black text-amber-400">{lates}</p><p className="text-slate-400 text-xs">Retards</p></div>
          <div><p className="text-2xl font-black text-slate-300">{operations.length}</p><p className="text-slate-400 text-xs">Total</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Agent, site..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
          </div>
          <div className="flex gap-2">
            {(['all','jour','nuit'] as const).map(s => (
              <button key={s} onClick={() => setShiftFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${shiftFilter===s ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {s === 'jour' ? <><Sun size={12}/> Jour</> : s === 'nuit' ? <><Moon size={12}/> Nuit</> : 'Toutes'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Agent','Site','Vacation','Prise de poste','Fin de poste','Durée','Statut','Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(op => {
                const { label, cls, icon: StatusIcon } = statusCfg[op.status]
                let duration = '—'
                if (op.checkOut) {
                  const [ih, im] = op.checkIn.split(':').map(Number)
                  const [oh, om] = op.checkOut.split(':').map(Number)
                  const totalMin = (oh * 60 + om) - (ih * 60 + im)
                  const h = Math.floor(Math.abs(totalMin) / 60)
                  const m = Math.abs(totalMin) % 60
                  duration = `${h}h${m > 0 ? m + 'min' : ''}`
                }
                return (
                  <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{op.agentName}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {op.siteName ?? <span className="italic text-slate-400">Formation</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium w-fit px-2 py-0.5 rounded-full ${
                        op.shift==='jour' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {op.shift==='jour' ? <Sun size={11}/> : <Moon size={11}/>}
                        {op.shift==='jour' ? 'Jour' : 'Nuit'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-700">{op.checkIn}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-500">
                      {op.checkOut ?? <span className="text-blue-500 font-semibold">En cours</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{duration}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>
                        <StatusIcon size={11} /> {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{op.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Activity size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucune opération trouvée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
