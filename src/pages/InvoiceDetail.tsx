import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Printer, Loader2, Mail, Phone, Globe } from 'lucide-react'
import { fmt, fmtDate, daysOverdue } from '../lib/utils'
import { useApi } from '../lib/useApi'
import { getInvoice } from '../services/invoices.service'
import logoSagard from '../assets/logo-sagard.jpg'

export default function InvoiceDetail() {
  const { id } = useParams()
  const nav    = useNavigate()

  const { data: inv, loading } = useApi(() => getInvoice(id!), [id])

  if (loading) return (
    <div className="flex justify-center py-24"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
  )
  if (!inv) return (
    <div className="text-center py-24 text-slate-400">
      <p className="text-lg font-semibold">Facture introuvable</p>
      <button onClick={() => nav('/facturation')} className="mt-4 text-sm text-sagard-yellow-dark hover:underline">Retour</button>
    </div>
  )

  const i = inv as any
  const totalAmount = Number(i.totalAmount ?? 0)
  const lines       = (i.lines ?? []) as any[]
  const isPaid      = i.status === 'PAYEE'
  const isAccepted  = i.status === 'ACCEPTEE'
  const paymentLink = `https://pay.djamo.com/3waob`
  const qrData      = paymentLink

  const docType = i.type === 'DEVIS' ? 'Devis' : i.type === 'PROFORMA' ? 'Facture Proforma' : 'Facture'
  const backPath = i.type === 'DEVIS' ? '/devis' : i.type === 'PROFORMA' ? '/proforma' : '/facturation'
  const backLabel = i.type === 'DEVIS' ? 'Retour aux devis' : i.type === 'PROFORMA' ? 'Retour aux proforma' : 'Retour à la facturation'
  const clientName = i.client?.name ?? i.lead?.companyName ?? i.lead?.contactName ?? '—'

  return (
    <div className="space-y-6">
      {/* Toolbar - not printed */}
      <div className="flex items-center justify-between no-print">
        <button onClick={() => nav(backPath)} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> {backLabel}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#C8A000] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#B08E00] transition-colors"
        >
          <Printer size={16} /> Imprimer / PDF
        </button>
      </div>

      {/* Invoice document — reproducing the exact layout */}
      <div id="invoice-print" className="bg-white shadow-lg max-w-[210mm] mx-auto relative" style={{ minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>

        {/* Payment ribbon — only on FACTURE, only PAYÉE / NON PAYÉE */}
        {i.type === 'FACTURE' && (
          <div className="absolute top-0 right-0 z-10 overflow-hidden w-44 h-44 pointer-events-none">
            <div
              className={`absolute top-7 -right-10 w-56 text-center py-2.5 text-[11px] font-black uppercase tracking-widest shadow-lg rotate-45 ${
                isPaid ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}
              style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
            >
              {isPaid ? 'PAYÉE' : 'NON PAYÉE'}
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="px-12 pt-8 pb-6 flex flex-col" style={{ minHeight: '297mm' }}>

          {/* Top header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <img src={logoSagard} alt="SAGARD" className="w-20 h-20 object-contain" />
              <div>
                <p className="text-sm font-bold text-slate-800 tracking-wide">SAGARD SECURITE</p>
                <p className="text-xs italic text-[#C8A000]">Service d'assistance et de gardiennage sécurité</p>
              </div>
            </div>
          </div>

          {/* Client info + Invoice ref */}
          <div className="flex justify-between items-start mb-6">
            <div className="text-sm text-slate-700 leading-relaxed">
              <p className="font-bold">{clientName}</p>
              {i.client?.neighborhood && <p>{i.client.neighborhood}</p>}
              {i.client?.district && <p>{i.client.district}</p>}
              {i.client?.city && <p>{i.client.city}</p>}
              <p>Côte d'Ivoire</p>
              {i.client?.rccm && <p>RCCM : {i.client.rccm}</p>}
              {i.client?.ncc && <p>NCC : {i.client.ncc}</p>}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800">{docType} {i.reference}</p>
            </div>
          </div>

          {/* Company registration line */}
          <div className="text-[10px] text-slate-500 mb-4 border-b border-slate-200 pb-2">
            <p>SAGARD SÉCURITÉ · NCC : 1712198T · RCCM : CI-ABJ-2016-B-24910 · Régime TEE</p>
            <p>Centre d'impôts : 875 Impôts de Yopougon V</p>
          </div>

          {/* Date info table */}
          <div className="border border-slate-300 mb-6">
            <div className="grid grid-cols-4 text-[11px]">
              <div className="border-r border-slate-300 p-2">
                <p className="font-bold text-slate-600">Date de facturation</p>
                <p className="text-slate-800">{fmtDate(i.issueDate)}</p>
              </div>
              <div className="border-r border-slate-300 p-2">
                <p className="font-bold text-slate-600">Échéance</p>
                <p className="text-slate-800">{fmtDate(i.dueDate)}</p>
              </div>
              <div className="border-r border-slate-300 p-2">
                <p className="font-bold text-slate-600">RCCM / NCC client</p>
                <p className="text-slate-800">{i.client?.rccm || i.client?.ncc ? `${i.client.rccm ?? ''} ${i.client.ncc ? '/ ' + i.client.ncc : ''}`.trim() : '—'}</p>
              </div>
              <div className="p-2">
                <p className="font-bold text-slate-600">Mode de paiement</p>
                <p className="text-slate-800">{i.paymentMethod ?? 'Chèque'}</p>
              </div>
            </div>
          </div>

          {/* Lines table */}
          <div className="mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#C8A000]/20">
                  <th className="text-left px-3 py-2.5 text-[11px] font-bold text-[#C8A000] uppercase border border-[#C8A000]/30">Description</th>
                  <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#C8A000] uppercase border border-[#C8A000]/30 w-24">Quantité</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-bold text-[#C8A000] uppercase border border-[#C8A000]/30 w-32">Prix unitaire</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-bold text-[#C8A000] uppercase border border-[#C8A000]/30 w-32">Montant</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.id ?? idx}>
                    <td className="px-3 py-2.5 border border-slate-200 text-slate-800">
                      {line.code && <span className="font-medium">[{line.code}] </span>}
                      {line.description}
                    </td>
                    <td className="px-3 py-2.5 border border-slate-200 text-center text-slate-700">
                      {Number(line.quantity).toFixed(2)} Unité(s)
                    </td>
                    <td className="px-3 py-2.5 border border-slate-200 text-right text-slate-700">
                      {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(Number(line.unitPrice))}
                    </td>
                    <td className="px-3 py-2.5 border border-slate-200 text-right font-bold text-slate-800">
                      {new Intl.NumberFormat('fr-FR').format(Number(line.quantity) * Number(line.unitPrice))} CFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total box */}
          <div className="flex justify-end mb-8">
            <div className="border-2 border-[#C8A000] inline-flex">
              <div className="bg-[#C8A000]/10 px-4 py-2 border-r border-[#C8A000]">
                <span className="text-sm font-bold text-[#C8A000]">Total</span>
              </div>
              <div className="px-6 py-2">
                <span className="text-sm font-black text-slate-800">
                  {new Intl.NumberFormat('fr-FR').format(totalAmount)} CFA
                </span>
              </div>
            </div>
          </div>

          {/* Payment communication */}
          <div className="mb-6">
            <p className="text-sm text-slate-700">
              <span className="font-bold">Communication de paiement :</span> {i.reference}
            </p>
            <p className="text-sm text-slate-700">
              sur ce compte : <a href={paymentLink} className="text-blue-600 underline">{paymentLink}</a>
            </p>
          </div>

          {/* QR Code section */}
          <div className="flex items-start gap-4 mb-auto">
            <div className="border border-slate-200 p-1">
              <QRCodeSVG
                value={qrData}
                size={90}
                bgColor="#ffffff"
                fgColor="#1E1E1E"
                level="M"
              />
            </div>
            <div className="pt-2">
              <p className="text-sm font-black text-slate-800">PAYEZ EN UN CLIN D'ŒIL !</p>
              <p className="text-xs italic text-[#C8A000]">Scannez le QR code</p>
              <p className="text-xs italic text-[#C8A000]">ou cliquez pour payer en ligne</p>
            </div>
          </div>

          {/* Spacer to push footer to bottom */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="border-t border-slate-300 pt-3 mt-8">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <Mail size={10} className="text-[#C8A000]" />
                directionsagardci@gmail.com
              </span>
              <span className="flex items-center gap-1">
                <Phone size={10} className="text-[#C8A000]" />
                +225 0749 800 080 / 2723266641
              </span>
              <span className="flex items-center gap-1">
                <Globe size={10} className="text-[#C8A000]" />
                www.sagard.ci
              </span>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-2">Page 1/1</p>
          </div>
        </div>
      </div>
    </div>
  )
}
