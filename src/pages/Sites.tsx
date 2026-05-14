import { useState } from 'react'
import { Search, MapPin, Plus, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react'
import { sites } from '../data/mockData'

const riskCfg = {
  faible: { label: 'Faible',  cls: 'bg-green-100 text-green-700',   icon: ShieldCheck },
  moyen:  { label: 'Moyen',   cls: 'bg-amber-100 text-amber-700',   icon: ShieldAlert },
  eleve:  { label: 'Élevé',   cls: 'bg-red-100 text-red-700',       icon: ShieldAlert },
}

const statusCfg = {
  actif:    { label: 'Actif',    cls: 'bg-green-100 text-green-700' },
  inactif:  { label: 'Inactif', cls: 'bg-slate-100 text-slate-500' },
  suspendu: { label: 'Suspendu',cls: 'bg-red-100 text-red-700' },
}

export default function Sites() {
  const [search, setSearch] = useState('')
  const [risk, setRisk]     = useState<'all'|'faible'|'moyen'|'eleve'>('all')

  const filtered = sites.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = s.name.toLowerCase().includes(q) || s.clientName.toLowerCase().includes(q) || s.district.toLowerCase().includes(q)
    const matchRisk = risk === 'all' || s.riskLevel === risk
    return matchSearch && matchRisk
  })

  const totalAgents = sites.reduce((s, site) => s + site.agentsDeployed, 0)

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-2xl font-black text-slate-800">{sites.length}</p>
          <p className="text-xs text-slate-500">Sites total</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-2xl font-black text-green-600">{sites.filter(s=>s.status==='actif').length}</p>
          <p className="text-xs text-slate-500">Sites actifs</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-200 bg-red-50">
          <p className="text-2xl font-black text-red-600">{sites.filter(s=>s.riskLevel==='eleve').length}</p>
          <p className="text-xs text-red-700">Risque élevé</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-sagard-yellow shadow-sm">
          <p className="text-2xl font-black text-slate-800">{totalAgents}</p>
          <p className="text-xs text-slate-500">Agents déployés</p>
        </div>
      </div>

      {/* Card grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nom du site, client, district..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
          </div>
          <div className="flex items-center gap-2">
            {(['all','faible','moyen','eleve'] as const).map(r => (
              <button key={r} onClick={() => setRisk(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${risk===r ? 'bg-sagard-yellow text-sagard-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {r === 'all' ? 'Tous' : riskCfg[r].label}
              </button>
            ))}
            <button className="flex items-center gap-1.5 bg-sagard-yellow text-sagard-dark px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-sagard-yellow-dark">
              <Plus size={13}/> Nouveau
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filtered.map(site => {
            const { label: riskLabel, cls: riskCls, icon: RiskIcon } = riskCfg[site.riskLevel]
            return (
              <div key={site.id} className="border border-slate-200 rounded-xl p-4 hover:border-sagard-yellow/50 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-sagard-yellow/20 flex items-center justify-center">
                      <MapPin size={16} className="text-sagard-yellow-dark" />
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusCfg[site.status].cls}`}>{statusCfg[site.status].label}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${riskCls}`}>
                    <RiskIcon size={10} /> {riskLabel}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm leading-snug mb-1">{site.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{site.clientName}</p>
                <div className="text-xs text-slate-500 space-y-1">
                  <p className="flex items-center gap-1"><MapPin size={10}/> {site.address}, {site.district}</p>
                  <p className="flex items-center gap-1">
                    <span className="font-semibold text-sagard-yellow-dark">{site.agentsDeployed}</span> agents déployés
                  </p>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-400">
              <MapPin size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun site trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
