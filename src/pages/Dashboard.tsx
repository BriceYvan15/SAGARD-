import { Users, FileText, UserCheck, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { clients, contracts, agents, invoices, revenueData, agentStatusData } from '../data/mockData'
import { fmt } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, sub, color, onClick }: {
  icon: any; label: string; value: string; sub: string; color: string; onClick?: () => void
}) {
  return (
    <div onClick={onClick} className={`bg-white rounded-xl p-5 border border-slate-200 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{sub}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

const fmtXOF = (v: number) => new Intl.NumberFormat('fr-FR').format(v / 1000) + 'K'

export default function Dashboard() {
  const nav = useNavigate()
  const activeClients   = clients.filter(c => c.status === 'actif').length
  const activeContracts = contracts.filter(c => c.status === 'actif').length
  const agentsActifs    = agents.filter(a => a.status === 'actif').length
  const overdueInv      = invoices.filter(i => i.status === 'retard')
  const totalOverdue    = overdueInv.reduce((s, i) => s + i.totalAmount, 0)
  const monthRevenue    = revenueData[revenueData.length - 1].revenue
  const renewalContracts = contracts.filter(c => c.status === 'renouvellement').length

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users}      label="Clients actifs"      value={String(activeClients)}   sub="+2 ce mois"          color="bg-blue-500"        onClick={() => nav('/clients')} />
        <StatCard icon={FileText}   label="Contrats actifs"     value={String(activeContracts)} sub={`${renewalContracts} à renouveler`} color="bg-sagard-yellow-dark" onClick={() => nav('/contrats')} />
        <StatCard icon={UserCheck}  label="Agents déployés"     value={String(agentsActifs)}    sub="sur 12 sites"        color="bg-emerald-500"     onClick={() => nav('/agents')} />
        <StatCard icon={TrendingUp} label="CA ce mois"          value={fmtXOF(monthRevenue)}    sub="XOF"                 color="bg-violet-500" />
        <StatCard icon={AlertCircle}label="Factures en retard"  value={String(overdueInv.length)} sub={fmt(totalOverdue)} color="bg-red-500"         onClick={() => nav('/facturation')} />
        <StatCard icon={Clock}      label="Agents en formation" value={String(agents.filter(a=>a.status==='formation').length)} sub="FKNS" color="bg-amber-500" onClick={() => nav('/agents')} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Chiffre d'affaires mensuel</h3>
              <p className="text-xs text-slate-400">7 derniers mois — XOF</p>
            </div>
            <span className="text-xs bg-sagard-yellow/20 text-sagard-yellow-dark font-semibold px-2 py-1 rounded-full">2024</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmtXOF(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [fmt(v), 'Revenu']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#C8D400" radius={[4,4,0,0]} />
              <Bar dataKey="target"  fill="#e2e8f0" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-slate-400 justify-center">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-sagard-yellow inline-block"/>Réalisé</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 inline-block"/>Objectif</span>
          </div>
        </div>

        {/* Pie agents */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">Statut des agents</h3>
          <p className="text-xs text-slate-400 mb-4">Répartition actuelle</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={agentStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {agentStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {agentStatusData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{background:d.color}}/>
                  {d.name}
                </span>
                <span className="font-semibold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent invoices + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Factures en retard</h3>
            <button onClick={() => nav('/facturation')} className="text-xs text-sagard-yellow-dark hover:underline font-medium">Voir tout</button>
          </div>
          <div className="divide-y divide-slate-100">
            {overdueInv.map(inv => (
              <div key={inv.id} onClick={() => nav(`/facturation/${inv.id}`)} className="px-5 py-3 flex items-center justify-between hover:bg-red-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{inv.reference}</p>
                  <p className="text-xs text-slate-500">{inv.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{fmt(inv.totalAmount)}</p>
                  <p className="text-xs text-slate-400">Éch. {inv.dueDate}</p>
                </div>
              </div>
            ))}
            {overdueInv.length === 0 && <p className="text-sm text-slate-400 px-5 py-4">Aucune facture en retard 🎉</p>}
          </div>
        </div>

        {/* Recent contracts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Contrats récents</h3>
            <button onClick={() => nav('/contrats')} className="text-xs text-sagard-yellow-dark hover:underline font-medium">Voir tout</button>
          </div>
          <div className="divide-y divide-slate-100">
            {contracts.slice(0,5).map(ct => (
              <div key={ct.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{ct.reference}</p>
                  <p className="text-xs text-slate-500">{ct.clientName} · {ct.nbAgents} agents</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ct.status==='actif' ? 'bg-green-100 text-green-700' :
                    ct.status==='renouvellement' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                  }`}>{ct.status}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{fmt(ct.monthlyAmount)}/mois</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
