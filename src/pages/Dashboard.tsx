import { Users, FileText, UserCheck, TrendingUp, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fmt } from '../lib/utils'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApi } from '../lib/useApi'
import { getDashboardStats } from '../services/dashboard.service'
import { hasAccess } from '../lib/roles'

function StatCard({ icon: Icon, label, value, sub, color, onClick, loading }: {
  icon: any; label: string; value: string; sub: string; color: string; onClick?: () => void; loading?: boolean
}) {
  return (
    <div onClick={onClick} className={`bg-white rounded-xl p-5 border border-slate-200 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          {loading
            ? <div className="w-12 h-7 bg-slate-200 rounded animate-pulse mt-1" />
            : <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>}
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
  if (!hasAccess('dashboard')) return <Navigate to="/prospects" replace />

  const nav = useNavigate()
  const { data: stats, loading: kLoad } = useApi(getDashboardStats)

  const k             = stats as any
  const overdueList   = k?.overdueInvoicesList   ?? []
  const recentPointages = k?.todayPointagesList  ?? []
  const revenueData   = (k?.monthlyRevenue as any[]) ?? []

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard loading={kLoad} icon={Users}       label="Clients actifs"     value={String(k?.clients ?? 0)}         sub="actifs"              color="bg-blue-500"          onClick={() => nav('/clients')} />
        <StatCard loading={kLoad} icon={FileText}    label="Contrats actifs"    value={String(k?.contracts ?? 0)}       sub="en cours"            color="bg-sagard-yellow-dark" onClick={() => nav('/contrats')} />
        <StatCard loading={kLoad} icon={UserCheck}   label="Agents déployés"    value={String(k?.agentsOnDuty ?? 0)}    sub="en poste"            color="bg-emerald-500"       onClick={() => nav('/agents')} />
        <StatCard loading={kLoad} icon={TrendingUp}  label="Sites actifs"       value={String(k?.sites ?? 0)}           sub="sous surveillance"   color="bg-violet-500" />
        <StatCard loading={kLoad} icon={AlertCircle} label="Factures en retard" value={String(k?.overdueInvoices ?? 0)} sub="à relancer"          color="bg-red-500"           onClick={() => nav('/facturation')} />
        <StatCard loading={kLoad} icon={Clock}       label="Pointages du jour"  value={String(k?.todayPointages ?? 0)}  sub="aujourd'hui"         color="bg-amber-500"         onClick={() => nav('/operations')} />

      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Chiffre d'affaires mensuel</h3>
              <p className="text-xs text-slate-400">12 derniers mois — XOF</p>
            </div>
            <span className="text-xs bg-sagard-yellow/20 text-sagard-yellow-dark font-semibold px-2 py-1 rounded-full">{new Date().getFullYear()}</span>
          </div>
          {kLoad ? (
            <div className="flex justify-center items-center h-[220px]"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtXOF(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [fmt(v), 'Revenu']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="amount" fill="#C8D400" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pointages 7 jours */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">Pointages 7 jours</h3>
          <p className="text-xs text-slate-400 mb-4">Présences quotidiennes</p>
          {kLoad ? (
            <div className="flex justify-center items-center h-[160px]"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={(k?.weeklyPointages as any[]) ?? []} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Overdue invoices + today pointages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Factures en retard</h3>
            <button onClick={() => nav('/facturation')} className="text-xs text-sagard-yellow-dark hover:underline font-medium">Voir tout</button>
          </div>
          <div className="divide-y divide-slate-100">
            {overdueList.map((inv: any) => (
              <div key={inv.id} onClick={() => nav(`/facturation/${inv.id}`)} className="px-5 py-3 flex items-center justify-between hover:bg-red-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{inv.reference}</p>
                  <p className="text-xs text-slate-500">{inv.client?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{fmt(inv.totalAmount)}</p>
                  <p className="text-xs text-slate-400">Éch. {new Date(inv.dueDate).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))}
            {overdueList.length === 0 && !kLoad && <p className="text-sm text-slate-400 px-5 py-4">Aucune facture en retard 🎉</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Pointages du jour</h3>
            <button onClick={() => nav('/operations')} className="text-xs text-sagard-yellow-dark hover:underline font-medium">Voir tout</button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPointages.slice(0, 5).map((p: any) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.agent?.user?.firstName} {p.agent?.user?.lastName}</p>
                  <p className="text-xs text-slate-500">{p.shift} · {p.site?.name ?? '—'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  p.status === 'EN_COURS' ? 'bg-green-100 text-green-700' :
                  p.status === 'RETARD'   ? 'bg-amber-100 text-amber-700' :
                  p.status === 'TERMINE'  ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                }`}>{p.status}</span>
              </div>
            ))}
            {recentPointages.length === 0 && !kLoad && <p className="text-sm text-slate-400 px-5 py-4">Aucun pointage aujourd'hui</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
