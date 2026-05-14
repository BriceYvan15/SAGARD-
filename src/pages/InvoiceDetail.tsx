import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Printer, CheckCircle, Clock, AlertCircle, ShieldCheck } from 'lucide-react'
import { invoices } from '../data/mockData'
import { fmt, fmtDate, daysOverdue } from '../lib/utils'

const statusConfig = {
  brouillon: { label: 'BROUILLON',   cls: 'bg-slate-200 text-slate-600' },
  envoyee:   { label: 'ENVOYÉE',     cls: 'bg-blue-100 text-blue-700' },
  payee:     { label: 'PAYÉE',       cls: 'bg-green-100 text-green-700' },
  retard:    { label: 'EN RETARD',   cls: 'bg-red-100 text-red-700' },
  annulee:   { label: 'ANNULÉE',     cls: 'bg-slate-100 text-slate-400' },
}

function HistoryIcon({ type }: { type: string }) {
  const m: Record<string, { icon: any; cls: string }> = {
    create:   { icon: CheckCircle, cls: 'text-blue-500' },
    payment:  { icon: CheckCircle, cls: 'text-green-500' },
    document: { icon: Clock,       cls: 'text-purple-500' },
    note:     { icon: AlertCircle, cls: 'text-amber-500' },
    status:   { icon: Clock,       cls: 'text-slate-400' },
    update:   { icon: Clock,       cls: 'text-slate-400' },
  }
  const { icon: Icon, cls } = m[type] ?? m.note
  return <Icon size={14} className={cls} />
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const inv = invoices.find(i => i.id === id)

  if (!inv) return (
    <div className="text-center py-24 text-slate-400">
      <p className="text-lg font-semibold">Facture introuvable</p>
      <button onClick={() => nav('/facturation')} className="mt-4 text-sm text-sagard-yellow-dark hover:underline">Retour</button>
    </div>
  )

  const overdueDays = inv.status === 'retard' ? daysOverdue(inv.dueDate) : 0
  const qrData = JSON.stringify({ ref: inv.reference, client: inv.clientName, montant: fmt(inv.totalAmount), statut: statusConfig[inv.status].label, date: fmtDate(inv.issueDate) })

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between no-print">
        <button onClick={() => nav('/facturation')} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> Retour à la facturation
        </button>
        <div className="flex items-center gap-3">
          {inv.status === 'retard' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
              <AlertCircle size={14} /> {overdueDays} jour{overdueDays > 1 ? 's' : ''} de retard
            </div>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark transition-colors"
          >
            <Printer size={16} /> Imprimer / PDF
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div id="invoice-print" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-4xl mx-auto">

        {/* Header band */}
        <div className="bg-[#1E1E1E] px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#C8D400] rounded-xl flex items-center justify-center">
              <ShieldCheck size={26} className="text-[#1E1E1E]" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">SAGARD SÉCURITÉ</div>
              <div className="text-[#C8D400] text-xs font-medium tracking-widest">AGENCE DE SÉCURITÉ PRIVÉE</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[#C8D400] text-2xl font-black tracking-tight">FACTURE</div>
            <div className="text-slate-300 font-mono text-sm mt-0.5">{inv.reference}</div>
            <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${statusConfig[inv.status].cls}`}>
              {statusConfig[inv.status].label}
            </span>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Addresses + QR */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Emetteur */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">De</p>
              <p className="font-bold text-slate-800">SAGARD SÉCURITÉ SARL</p>
              <p className="text-sm text-slate-600">Cité Verte, Yopougon</p>
              <p className="text-sm text-slate-600">Abidjan, Côte d'Ivoire</p>
              <p className="text-sm text-slate-600 mt-1">+225 2723 434 624</p>
              <p className="text-sm text-slate-600">sagardsecurite@gmail.com</p>
              <p className="text-sm text-slate-600">RC : CI-ABJ-2019-B-12345</p>
            </div>

            {/* Client */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Facturé à</p>
              <p className="font-bold text-slate-800">{inv.clientName}</p>
              <p className="text-sm text-slate-600">{inv.clientAddress}</p>
              <p className="text-sm text-slate-600">{inv.clientCity}</p>
            </div>

            {/* QR Code + dates */}
            <div className="flex flex-col items-end gap-3">
              <div className="p-2 border-2 border-[#C8D400] rounded-xl bg-white shadow">
                <QRCodeSVG
                  value={qrData}
                  size={100}
                  bgColor="#ffffff"
                  fgColor="#1E1E1E"
                  level="M"
                />
              </div>
              <div className="text-right text-xs text-slate-500 space-y-0.5">
                <p><span className="font-semibold">Émission :</span> {fmtDate(inv.issueDate)}</p>
                <p><span className="font-semibold">Livraison :</span> {fmtDate(inv.deliveryDate)}</p>
                <p className={inv.status === 'retard' ? 'text-red-600 font-bold' : ''}>
                  <span className="font-semibold">Échéance :</span> {fmtDate(inv.dueDate)}
                </p>
                {inv.paidAt && <p className="text-green-600 font-semibold">Payée le {fmtDate(inv.paidAt)}</p>}
              </div>
            </div>
          </div>

          {/* Lines table */}
          <div className="rounded-xl overflow-hidden border border-slate-200 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1E1E1E] text-white">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide w-16">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Désignation</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide w-16">Qté</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide w-36">P.U. (XOF)</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide w-36">Total (XOF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inv.lines.map((line, i) => (
                  <tr key={line.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{line.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{line.description}</p>
                      {line.details !== line.description && <p className="text-xs text-slate-400">{line.details}</p>}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">{line.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {new Intl.NumberFormat('fr-FR').format(line.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {new Intl.NumberFormat('fr-FR').format(line.quantity * line.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Sous-total HT</span>
                <span className="font-medium">{new Intl.NumberFormat('fr-FR').format(inv.totalAmount)} XOF</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>TVA (0%)</span>
                <span>— XOF</span>
              </div>
              <div className="flex justify-between items-center bg-[#1E1E1E] text-white px-4 py-3 rounded-xl">
                <span className="font-bold text-sm">TOTAL TTC</span>
                <span className="font-black text-lg text-[#C8D400]">{new Intl.NumberFormat('fr-FR').format(inv.totalAmount)} XOF</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {inv.notes && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-slate-700">{inv.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-600">Règlement par virement bancaire</p>
              <p>Banque : NSIA Banque CI · Compte : 12345 67890 00</p>
            </div>
            <div className="text-right">
              <p>SAGARD SÉCURITÉ SARL — RC: CI-ABJ-2019-B-12345</p>
              <p>+225 2723 434 624 · sagardsecurite@gmail.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit history */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto no-print">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Historique de suivi</h3>
        </div>
        <div className="px-6 py-4">
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200" />
            <div className="space-y-4">
              {inv.history.map(h => (
                <div key={h.id} className="flex items-start gap-4 pl-8 relative">
                  <div className="absolute left-0 top-0.5 w-7 h-7 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center">
                    <HistoryIcon type={h.type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{h.action}</p>
                      <span className="text-xs text-slate-400">— {h.user}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{h.details}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtDate(h.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
