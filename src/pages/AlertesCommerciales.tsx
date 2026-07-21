import { Bell, AlertTriangle, Trophy, Clock, Target, TrendingUp, Users, FileWarning, Loader2, ShieldAlert, Briefcase } from 'lucide-react'
import { useApi } from '../lib/useApi'
import { getCommercialStats } from '../services/leads.service'
import { getExpiringContracts } from '../services/contracts.service'
import { fmtDate } from '../lib/utils'
import { hasAccess } from '../lib/roles'

const SEVERITY_CFG: Record<string, { icon: any; cls: string; border: string }> = {
  CRITICAL: { icon: AlertTriangle, cls: 'bg-red-50 text-red-700', border: 'border-red-200' },
  WARNING:  { icon: Clock,         cls: 'bg-amber-50 text-amber-700', border: 'border-amber-200' },
  INFO:     { icon: Trophy,        cls: 'bg-green-50 text-green-700', border: 'border-green-200' },
}

export default function AlertesCommerciales() {
  const { data, loading } = useApi(getCommercialStats)
  const { data: expiringData, loading: loadingExpiring } = useApi(getExpiringContracts)
  const stats = data as any
  const expiringContracts = (expiringData as any[] ?? [])

  if (!hasAccess('alertes-commerciales')) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
      <ShieldAlert size={48} className="text-red-300" />
      <p className="font-bold text-lg text-slate-600">Accès restreint</p>
      <p className="text-sm">Cette page est réservée au DG et au Comptable.</p>
    </div>
  )

  if (loading) return (
    <div className="flex justify-center py-24"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
  )

  if (!stats) return (
    <div className="text-center py-24 text-slate-400">
      <p>Aucune donnée disponible</p>
    </div>
  )

  const alerts = (stats.alerts ?? []) as any[]
  const ranking = (stats.ranking ?? []) as any[]
  const weeklyByCommercial = (stats.weeklyByCommercial ?? []) as any[]
  const staleProspects = (stats.staleProspects ?? []) as any[]
  const overdueInvoices = (stats.overdueInvoices ?? []) as any[]

  const totalWeek = weeklyByCommercial.reduce((s: number, r: any) => s + r._count, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sagard-yellow/20 flex items-center justify-center">
          <Bell size={20} className="text-sagard-yellow-dark" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800">Alertes Commerciales</h1>
          <p className="text-xs text-slate-500">Suivi des objectifs et performances des commerciaux</p>
        </div>
      </div>

      {/* Alerts banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a: any, idx: number) => {
            const cfg = SEVERITY_CFG[a.severity] ?? SEVERITY_CFG.INFO
            const Icon = cfg.icon
            return (
              <div key={idx} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${cfg.border} ${cfg.cls}`}>
                <Icon size={18} className="mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium">{a.message}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Target size={16} className="text-blue-600" /></div>
            <p className="text-xs text-slate-500 font-medium">Objectif semaine</p>
          </div>
          <p className="text-2xl font-black text-slate-800">{totalWeek} <span className="text-sm font-medium text-slate-400">/ 10</span></p>
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, totalWeek * 10)}%`, backgroundColor: totalWeek >= 10 ? '#22c55e' : '#f59e0b' }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"><FileWarning size={16} className="text-amber-600" /></div>
            <p className="text-xs text-slate-500 font-medium">Prospects stagnants</p>
          </div>
          <p className="text-2xl font-black text-amber-600">{staleProspects.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Non avancés depuis +30j</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle size={16} className="text-red-600" /></div>
            <p className="text-xs text-slate-500 font-medium">Factures en retard</p>
          </div>
          <p className="text-2xl font-black text-red-600">{overdueInvoices.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Échéance dépassée</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"><Trophy size={16} className="text-green-600" /></div>
            <p className="text-xs text-slate-500 font-medium">Meilleur commercial</p>
          </div>
          <p className="text-lg font-black text-green-600 truncate">{ranking.length > 0 ? ranking[0].userName : '—'}</p>
          {ranking.length > 0 && <p className="text-[10px] text-slate-400 mt-1">{ranking[0].created} prospects, {ranking[0].won} gagnés</p>}
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking commerciaux */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp size={16} className="text-sagard-yellow-dark" />
            <h2 className="font-bold text-sm text-slate-700">Classement des commerciaux (mois)</h2>
          </div>
          <div className="p-4">
            {ranking.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">Aucune donnée ce mois</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase">
                    <th className="text-left py-2">#</th>
                    <th className="text-left py-2">Commercial</th>
                    <th className="text-center py-2">Prospects</th>
                    <th className="text-center py-2">Gagnés</th>
                    <th className="text-center py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r: any, idx: number) => (
                    <tr key={r.userId} className="border-t border-slate-100">
                      <td className="py-2">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="py-2 text-xs font-semibold text-slate-700">{r.userName ?? '—'}</td>
                      <td className="py-2 text-center font-bold">{r.created}</td>
                      <td className="py-2 text-center font-bold text-green-600">{r.won}</td>
                      <td className="py-2 text-center font-black text-sagard-yellow-dark">{r.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Prospection hebdo par commercial */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            <h2 className="font-bold text-sm text-slate-700">Prospection cette semaine</h2>
          </div>
          <div className="p-4">
            {weeklyByCommercial.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">Aucun prospect cette semaine</p>
            ) : (
              <div className="space-y-3">
                {weeklyByCommercial.map((r: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 w-32 truncate">{r.userName ?? 'N/A'}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (r._count / 10) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-8 text-right">{r._count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prospects stagnants */}
      {staleProspects.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm">
          <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2 bg-amber-50/50">
            <Clock size={16} className="text-amber-600" />
            <h2 className="font-bold text-sm text-amber-700">Prospects non avancés (+30 jours)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Référence</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Entreprise / Contact</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Créé le</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Commercial</th>
                </tr>
              </thead>
              <tbody>
                {staleProspects.map((p: any) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-amber-50/30">
                    <td className="px-4 py-2 font-mono text-xs font-bold">{p.reference}</td>
                    <td className="px-4 py-2">{p.companyName || p.contactName}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-2 text-xs font-semibold text-slate-600">{p.commercialName ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Factures en retard */}
      {overdueInvoices.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm">
          <div className="px-4 py-3 border-b border-red-100 flex items-center gap-2 bg-red-50/50">
            <AlertTriangle size={16} className="text-red-600" />
            <h2 className="font-bold text-sm text-red-700">Factures en retard d'échéance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Référence</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Montant</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Échéance</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-red-50/30">
                    <td className="px-4 py-2 font-mono text-xs font-bold">{inv.reference}</td>
                    <td className="px-4 py-2 font-bold">{new Intl.NumberFormat('fr-FR').format(Number(inv.totalAmount ?? 0))} XOF</td>
                    <td className="px-4 py-2 text-xs text-red-600 font-semibold">{fmtDate(inv.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Contrats de gardiennage expirant bientôt */}
      {!loadingExpiring && expiringContracts.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm">
          <div className="px-4 py-3 border-b border-orange-100 flex items-center gap-2 bg-orange-50/50">
            <Briefcase size={16} className="text-orange-600" />
            <h2 className="font-bold text-sm text-orange-700">Contrats de gardiennage expirant dans 30 jours</h2>
            <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">{expiringContracts.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Référence</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Client</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Titre</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Fin du contrat</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Jours restants</th>
                </tr>
              </thead>
              <tbody>
                {expiringContracts.map((c: any) => {
                  const daysLeft = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : null
                  const urgencyCls = daysLeft !== null && daysLeft <= 7 ? 'text-red-600 font-black' : daysLeft !== null && daysLeft <= 14 ? 'text-orange-600 font-bold' : 'text-amber-600 font-semibold'
                  return (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                      <td className="px-4 py-2 font-mono text-xs font-bold">{c.reference}</td>
                      <td className="px-4 py-2 text-slate-700">{c.client?.name ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-600 text-xs">{c.title ?? '—'}</td>
                      <td className="px-4 py-2 text-xs">{fmtDate(c.endDate)}</td>
                      <td className={`px-4 py-2 text-xs ${urgencyCls}`}>{daysLeft !== null ? `${daysLeft}j` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
