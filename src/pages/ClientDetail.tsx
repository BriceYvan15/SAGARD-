import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Loader2, Building2, MapPin, Phone, Mail, Globe,
  FileText, Briefcase, AlertTriangle, User, Hash,
  CheckCircle, Printer, MapPinned, Calendar, Users, Ban,
} from 'lucide-react'
import { useApi } from '../lib/useApi'
import { getClient, getClientStats, downloadClientPdf } from '../services/clients.service'
import { fmt, fmtDate } from '../lib/utils'

const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIF:    { label: 'Actif',    cls: 'bg-green-100 text-green-700',    dot: 'bg-green-500' },
  INACTIF:  { label: 'Inactif',  cls: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400' },
  PROSPECT: { label: 'Prospect', cls: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  SUSPENDU: { label: 'Suspendu', cls: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
}

const STATUS_INVOICE: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: 'Brouillon',  cls: 'bg-slate-100 text-slate-500' },
  ENVOYEE:   { label: 'Envoyée',    cls: 'bg-blue-100 text-blue-700' },
  ACCEPTEE:  { label: 'Acceptée',   cls: 'bg-violet-100 text-violet-700' },
  PAYEE:     { label: 'Payée',      cls: 'bg-green-100 text-green-700' },
  RETARD:    { label: 'En retard',  cls: 'bg-red-100 text-red-700' },
  ANNULEE:   { label: 'Annulée',    cls: 'bg-slate-100 text-slate-400' },
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CHEQUE:            'Chèque',
  VIREMENT_BANCAIRE: 'Virement bancaire',
  MOBILE_MONEY:      'Mobile Money',
  ESPECE:            'Espèces',
}

const SEGMENT_LABELS: Record<string, string> = {
  COMMERCIAL:     'Commercial',
  INDUSTRIEL:     'Industriel',
  RESIDENTIEL:    'Résidentiel',
  INSTITUTIONNEL: 'Institutionnel',
  ONG:            'ONG',
  AMBASSADE:      'Ambassade',
  AUTRE:          'Autre',
}

export default function ClientDetail() {
  const { id }  = useParams()
  const nav     = useNavigate()

  const { data: client, loading } = useApi(() => getClient(id!), [id])
  const { data: stats }           = useApi(() => getClientStats(id!), [id])

  const [pdfLoading, setPdfLoading] = useState(false)
  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      await downloadClientPdf(id!, c?.name ?? 'client')
    } catch (err) {
      console.error('PDF download failed:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-24">
      <Loader2 className="animate-spin text-slate-300" size={32} />
    </div>
  )
  if (!client) return (
    <div className="text-center py-24 text-slate-400">
      <p className="text-lg font-semibold">Client introuvable</p>
      <button onClick={() => nav('/clients')} className="mt-4 text-sm text-sagard-yellow-dark hover:underline">
        Retour aux clients
      </button>
    </div>
  )

  const c        = client as any
  const contacts = (c.contacts ?? []) as any[]
  const invoices = (c.invoices ?? []) as any[]
  const contracts= (c.contracts ?? []) as any[]
  const sites    = (c.sites ?? []) as any[]
  const complaints=(c.complaints ?? []) as any[]
  const st       = STATUS_CFG[c.status] ?? { label: c.status, cls: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between no-print">
        <button onClick={() => nav('/clients')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> Retour aux clients
        </button>
        <button onClick={handleDownloadPdf} disabled={pdfLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-60">
          {pdfLoading ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
          {pdfLoading ? 'Génération...' : 'Télécharger PDF'}
        </button>
      </div>

      <div className="space-y-5">
        {/* === HEADER CARD === */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print-break">
          <div className="bg-gradient-to-r from-slate-50 to-white p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-sagard-yellow/20 flex items-center justify-center flex-shrink-0">
                <Building2 size={28} className="text-sagard-yellow-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-black text-slate-800">{c.name}</h1>
                  {c.legalName && c.legalName !== c.name && (
                    <span className="text-sm text-slate-400 italic">({c.legalName})</span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {c.code && <span className="font-mono text-xs">{c.code}</span>}
                  {c.code && (SEGMENT_LABELS[c.segment] ?? c.sector) && ' · '}
                  {SEGMENT_LABELS[c.segment] ?? c.segment}
                  {c.sector ? ` — ${c.sector}` : ''}
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                  {c.phone && (
                    <span className="flex items-center gap-1.5"><Phone size={13} className="text-slate-400" />{c.phone}</span>
                  )}
                  {c.email && (
                    <span className="flex items-center gap-1.5"><Mail size={13} className="text-slate-400" />{c.email}</span>
                  )}
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:underline">
                      <Globe size={13} />{c.website}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Stats bar */}
          <div className="flex items-center gap-6 px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            {[
              { label: 'Contrats', value: contracts.length, icon: Briefcase, color: 'text-blue-600' },
              { label: 'Factures', value: invoices.length, icon: FileText, color: 'text-violet-600' },
              { label: 'Sites',    value: sites.length,    icon: MapPinned, color: 'text-amber-600' },
              { label: 'Contacts', value: contacts.length,  icon: Users,    color: 'text-slate-600' },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="flex items-center gap-2">
                  <Icon size={15} className={s.color} />
                  <span className="font-bold text-slate-800">{s.value}</span>
                  <span className="text-xs text-slate-400">{s.label}</span>
                </div>
              )
            })}
            {(stats as any)?.totalFacturé > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-400">CA Total</span>
                <span className="text-lg font-black text-sagard-yellow-dark">{fmt((stats as any).totalFacturé)}</span>
              </div>
            )}
          </div>
        </div>

        {/* === MAIN GRID === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* === LEFT COLUMN === */}
          <div className="space-y-5">
            {/* Identification */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow print-break">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Hash size={12} /> Identification
              </h2>
              <div className="space-y-1 text-sm">
                {[
                  { label: 'RCCM',    value: c.rccm },
                  { label: 'NCC',     value: c.ncc },
                  { label: 'N° CNI',  value: c.cniNumber },
                  { label: 'TVA',     value: c.vat },
                  { label: 'Tax ID',  value: c.taxId },
                ].filter(r => r.value).map(r => (
                  <div key={r.label} className="flex justify-between hover:bg-slate-50 -mx-2 px-2 py-1.5 rounded transition-colors">
                    <span className="text-slate-400">{r.label}</span>
                    <span className="font-medium text-slate-700">{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between hover:bg-slate-50 -mx-2 px-2 py-1.5 rounded transition-colors">
                  <span className="text-slate-400">Créé le</span>
                  <span className="font-medium text-slate-700">{fmtDate(c.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Coordonnées directes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow print-break">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Phone size={12} /> Coordonnées
              </h2>
              <div className="space-y-2 text-sm">
                {c.phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400 text-xs">Tel 1:</span> {c.phone}
                  </div>
                )}
                {c.phone2 && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400 text-xs">Tel 2:</span> {c.phone2}
                  </div>
                )}
                {c.mobile && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400 text-xs">Mobile:</span> {c.mobile}
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400 text-xs">Email:</span> {c.email}
                  </div>
                )}
                {c.website && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Globe size={13} className="flex-shrink-0" />
                    <a href={c.website} target="_blank" rel="noreferrer" className="hover:underline">{c.website}</a>
                  </div>
                )}
                {!c.phone && !c.phone2 && !c.mobile && !c.email && !c.website && (
                  <p className="text-sm text-slate-400 italic">Aucune coordonnée</p>
                )}
              </div>
            </div>

            {/* Adresse */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow print-break">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin size={12} /> Adresse
              </h2>
              <div className="text-sm text-slate-700 space-y-1">
                <p className="font-medium">{c.address ?? '—'}</p>
                {c.street2 && <p>{c.street2}</p>}
                {(c.quartier || c.district) && (
                  <p className="text-slate-500">{[c.quartier, c.district].filter(Boolean).join(', ')}</p>
                )}
                <p>{c.city}{c.zip ? ` ${c.zip}` : ''}</p>
                <p className="text-slate-500">{c.country ?? "Côte d'Ivoire"}</p>
                {(c.latitude && c.longitude) && (
                  <p className="text-xs text-slate-400 mt-2">GPS : {c.latitude}, {c.longitude}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            {c.notes && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow print-break">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText size={12} /> Notes
                </h2>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{c.notes}</p>
              </div>
            )}
          </div>

          {/* === RIGHT COLUMN (2/3) === */}
          <div className="lg:col-span-2 space-y-5">

            {/* Contacts */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow print-break">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User size={12} /> Contacts ({contacts.length})
              </h2>
              {contacts.length === 0
                ? <p className="text-sm text-slate-400 italic">Aucun contact enregistré</p>
                : (
                  <div className="divide-y divide-slate-100">
                    {contacts.map((ct: any) => (
                      <div key={ct.id} className="py-3 flex items-start justify-between gap-4 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <User size={15} className="text-slate-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800">{ct.firstName} {ct.lastName}</p>
                              {ct.isPrimary && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sagard-yellow/20 text-sagard-yellow-dark rounded-full">
                                  Principal
                                </span>
                              )}
                            </div>
                            {ct.position && <p className="text-xs text-slate-500 mt-0.5">{ct.position}</p>}
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-600 space-y-1 flex-shrink-0">
                          {ct.phone && <p className="flex items-center gap-1 justify-end"><Phone size={11} />{ct.phone}</p>}
                          {ct.whatsapp && <p className="flex items-center gap-1 justify-end text-green-600"><Phone size={11} />WA: {ct.whatsapp}</p>}
                          {ct.email && <p className="flex items-center gap-1 justify-end"><Mail size={11} />{ct.email}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Contrats */}
            {contracts.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow print-break">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase size={12} /> Contrats ({contracts.length})
                </h2>
                <div className="space-y-2">
                  {contracts.map((ct: any) => (
                    <div key={ct.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm hover:bg-slate-100/70 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-800">{ct.reference ?? ct.title ?? ct.id}</p>
                        <p className="text-xs text-slate-500">{ct.type ?? ct.contractType ?? '—'} · Déb. {fmtDate(ct.startDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sagard-yellow-dark">{fmt(Number(ct.monthlyAmount ?? 0))}/mois</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          ct.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>{ct.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Factures */}
            {invoices.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow print-break">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={12} /> Factures ({invoices.length})
                </h2>
                <div className="space-y-2">
                  {invoices.map((inv: any) => {
                    const ist = STATUS_INVOICE[inv.status] ?? { label: inv.status, cls: 'bg-slate-100 text-slate-500' }
                    return (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm hover:bg-slate-100/70 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-800">{inv.reference}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ist.cls}`}>{ist.label}</span>
                            <span className="text-xs text-slate-400">{fmtDate(inv.issueDate)}</span>
                            {inv.paymentMethod && (
                              <span className="text-xs text-slate-400">· {PAYMENT_METHOD_LABELS[inv.paymentMethod] ?? inv.paymentMethod}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800">{fmt(Number(inv.totalAmount ?? 0))}</p>
                          {inv.status === 'PAYEE' && inv.paidAt && (
                            <p className="text-xs text-green-600 flex items-center gap-1 justify-end">
                              <CheckCircle size={10} /> Payée le {fmtDate(inv.paidAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sites */}
            {sites.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow print-break">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPinned size={12} /> Sites gardiennés ({sites.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sites.map((s: any) => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-lg text-sm hover:bg-slate-100/70 transition-colors">
                      <p className="font-semibold text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.city} · {s.address}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1.5 inline-block ${
                        s.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Réclamations */}
            {complaints.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow print-break">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle size={12} /> Réclamations ({complaints.length})
                </h2>
                <div className="space-y-2">
                  {complaints.map((cp: any) => (
                    <div key={cp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm hover:bg-slate-100/70 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-800">{cp.title ?? '—'}</p>
                        <p className="text-xs text-slate-500">{fmtDate(cp.createdAt)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        cp.status === 'RESOLUE' ? 'bg-green-100 text-green-700' :
                        cp.status === 'EN_COURS' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>{cp.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
