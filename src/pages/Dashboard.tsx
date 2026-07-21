import { useEffect } from 'react'
import { Users, FileText, UserCheck, TrendingUp, AlertCircle, Clock, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fmt } from '../lib/utils'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApi } from '../lib/useApi'
import { getDashboardStats } from '../services/dashboard.service'
import { markOverdue } from '../services/invoices.service'
import { hasAccess } from '../lib/roles'

function StatCard({ icon: Icon, label, value, sub, color, bgColor, onClick, loading, delay = 0 }: {
  icon: any; label: string; value: string; sub: string; color: string; bgColor: string; onClick?: () => void; loading?: boolean; delay?: number
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 border border-slate-200 shadow-sm animate-fade-in transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lobe hover:border-slate-300 hover:-translate-y-0.5' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColor}`}>
          <Icon size={20} className={color} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
          {loading
            ? <div className="w-16 h-6 bg-slate-200 rounded animate-pulse mt-0.5" />
            : <p className="text-xl font-bold text-slate-800 leading-tight">{value}</p>}
          <p className="text-[11px] text-slate-400 truncate">{sub}</p>
        </div>
      </div>
    </div>
  )
}

const fmtXOF = (v: number) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000) return Math.round(v / 1000) + 'K'
  return String(v)
}

const STATUS_COLORS: Record<string, string> = {
  EN_COURS:  '#10b981',
  TERMINE:   '#64748b',
  RETARD:    '#f59e0b',
  ABSENT:    '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  EN_COURS:  'En cours',
  TERMINE:   'Terminé',
  RETARD:    'En retard',
  ABSENT:    'Absent',
}

export default function Dashboard() {
  if (!hasAccess('dashboard')) return <Navigate to="/prospects" replace />

  const nav = useNavigate()
  const { data: stats, loading: kLoad, reload: reloadStats } = useApi(getDashboardStats)

  // Mark overdue invoices on mount so RETARD status is up-to-date
  useEffect(() => { markOverdue().then(() => reloadStats()).catch(() => {}) }, [])

  const k               = stats as any
  const overdueList     = k?.overdueInvoicesList   ?? []
  const recentPointages = k?.todayPointagesList    ?? []
  const revenueData     = (k?.monthlyRevenue as any[]) ?? []
  const weeklyData      = (k?.weeklyPointages as any[]) ?? []

  const totalRevenue = revenueData.reduce((s: number, d: any) => s + Number(d.amount ?? 0), 0)
  const avgRevenue   = revenueData.length ? totalRevenue / revenueData.length : 0

  const pointageStatusData = Object.entries(
    recentPointages.reduce((acc: Record<string, number>, p: any) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1
      return acc
    }, {})
  ).map(([status, count]) => ({ name: STATUS_LABELS[status] ?? status, value: count, color: STATUS_COLORS[status] ?? '#94a3b8' }))

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard delay={0}   loading={kLoad} icon={Users}       label="Clients actifs"     value={String(k?.clients ?? 0)}         sub="actifs"            color="text-blue-600"       bgColor="bg-blue-50"        onClick={() => nav('/clients')} />
        <StatCard delay={50}  loading={kLoad} icon={FileText}    label="Contrats actifs"    value={String(k?.contracts ?? 0)}       sub="en cours"          color="text-sagard-yellow-dark" bgColor="bg-sagard-yellow/10" onClick={() => nav('/contrats')} />
        <StatCard delay={100} loading={kLoad} icon={UserCheck}   label="Agents déployés"    value={String(k?.agentsOnDuty ?? 0)}    sub="en poste"          color="text-emerald-600"    bgColor="bg-emerald-50"     onClick={() => nav('/agents')} />
        <StatCard delay={150} loading={kLoad} icon={TrendingUp}  label="Sites actifs"       value={String(k?.sites ?? 0)}           sub="sous surveillance" color="text-violet-600"    bgColor="bg-violet-50"      />
        <StatCard delay={200} loading={kLoad} icon={AlertCircle} label="Factures en retard" value={String(k?.overdueInvoices ?? 0)} sub="à relancer"        color="text-red-600"        bgColor="bg-red-50"         onClick={() => nav('/facturation')} />
        <StatCard delay={250} loading={kLoad} icon={Clock}       label="Pointages du jour"  value={String(k?.todayPointages ?? 0)}  sub="aujourd'hui"       color="text-amber-600"     bgColor="bg-amber-50"       onClick={() => nav('/operations')} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Chiffre d'affaires mensuel</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total: <span className="font-semibold text-slate-600">{fmt(totalRevenue)}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                Moyenne: <span className="font-semibold text-slate-600">{fmt(avgRevenue)}</span>
              </p>
            </div>
            <span className="text-xs bg-sagard-yellow/20 text-sagard-yellow-dark font-semibold px-2.5 py-1 rounded-full">{new Date().getFullYear()}</span>
          </div>
          {kLoad ? (
            <div className="flex justify-center items-center h-[240px]"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
          ) : revenueData.length === 0 ? (
            <div className="flex justify-center items-center h-[240px] text-sm text-slate-400">Aucune donnée disponible</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C8D400" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#C8D400" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tickFormatter={fmtXOF} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  formatter={(v: number) => [fmt(v), 'Revenu']}
                  contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  labelStyle={{ fontWeight: 600, color: '#334155' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#A5AF00" strokeWidth={2.5} fill="url(#revGradient)" dot={{ r: 3, fill: '#A5AF00', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#A5AF00', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pointage status donut */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800">Statut des pointages</h3>
          <p className="text-xs text-slate-400 mb-2">Répartition du jour</p>
          {kLoad ? (
            <div className="flex justify-center items-center h-[200px]"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
          ) : pointageStatusData.length === 0 ? (
            <div className="flex justify-center items-center h-[200px] text-sm text-slate-400">Aucun pointage</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pointageStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={3}>
                    {pointageStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pointageStatusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{Number(s.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weekly pointages bar chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-800">Pointages des 7 derniers jours</h3>
            <p className="text-xs text-slate-400 mt-0.5">Présences quotidiennes</p>
          </div>
        </div>
        {kLoad ? (
          <div className="flex justify-center items-center h-[160px]"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : weeklyData.length === 0 ? (
          <div className="flex justify-center items-center h-[160px] text-sm text-slate-400">Aucune donnée disponible</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} barCategoryGap="24%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0' }} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[6,6,0,0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Overdue invoices + today pointages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Overdue invoices */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <h3 className="font-semibold text-slate-800">Factures en retard</h3>
              {overdueList.length > 0 && <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">{overdueList.length}</span>}
            </div>
            <button onClick={() => nav('/facturation')} className="text-xs text-sagard-yellow-dark hover:underline font-medium flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
            {overdueList.map((inv: any) => (
              <div key={inv.id} onClick={() => nav(`/facturation/${inv.id}`)} className="px-5 py-3 flex items-center justify-between hover:bg-red-50/50 cursor-pointer transition-colors group">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-red-700 transition-colors">{inv.reference}</p>
                  <p className="text-xs text-slate-500 truncate">{inv.client?.name}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-bold text-red-600">{fmt(inv.totalAmount)}</p>
                  <p className="text-xs text-slate-400">Éch. {new Date(inv.dueDate).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))}
            {overdueList.length === 0 && !kLoad && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CheckCircle2 size={32} className="text-emerald-400" />
                <p className="text-sm text-slate-400">Aucune facture en retard</p>
              </div>
            )}
          </div>
        </div>

        {/* Today pointages */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <h3 className="font-semibold text-slate-800">Pointages du jour</h3>
            </div>
            <button onClick={() => nav('/operations')} className="text-xs text-sagard-yellow-dark hover:underline font-medium flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
            {recentPointages.slice(0, 8).map((p: any) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{p.agent?.user?.firstName} {p.agent?.user?.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{p.shift} · {p.site?.name ?? '—'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-3 ${
                  p.status === 'EN_COURS' ? 'bg-green-100 text-green-700' :
                  p.status === 'RETARD'   ? 'bg-amber-100 text-amber-700' :
                  p.status === 'TERMINE'  ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                }`}>{p.status}</span>
              </div>
            ))}
            {recentPointages.length === 0 && !kLoad && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Clock size={32} className="text-slate-300" />
                <p className="text-sm text-slate-400">Aucun pointage aujourd'hui</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
