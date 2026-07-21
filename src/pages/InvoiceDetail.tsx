import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Printer, Loader2, Mail, Phone, Globe, Send, Download, Paperclip, X, CreditCard, CheckCircle } from 'lucide-react'
import { fmt, fmtDate, daysOverdue } from '../lib/utils'
import { useApi } from '../lib/useApi'
import { getInvoice, sendInvoiceEmail, downloadInvoicePdf, sendInvoiceEmailWithAttachment, updateInvoiceStatus } from '../services/invoices.service'
import { registerPayment } from '../services/accounting.service'
import logoSagard from '../assets/logo-sagard.jpg'
import toast from 'react-hot-toast'

const cleanDescription = (desc: string): string => {
  if (!desc) return ''
  return desc.replace(/^(\s*\[[^\]]+\]\s*)+/, '').trim()
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const nav    = useNavigate()
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)

  const { data: inv, loading, reload } = useApi(() => getInvoice(id!), [id])

  const [showEditModal, setShowEditModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payForm, setPayForm] = useState({ amount: '', paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'VIREMENT_BANCAIRE', reference: '' })
  const [paySaving, setPaySaving] = useState(false)

  const handleSendEmail = async () => {
    if (!id) return
    setSending(true)
    try {
      if (attachment) {
        await sendInvoiceEmailWithAttachment(id, attachment)
      } else {
        await sendInvoiceEmail(id)
      }
      if ((inv as any).status === 'BROUILLON') {
        await updateInvoiceStatus(id, 'ENVOYEE')
      }
      toast.success('Facture envoyée par e-mail avec succès !')
      setShowEmailModal(false)
      setAttachment(null)
      reload()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'envoi de l\'e-mail'
      toast.error(msg)
    } finally {
      setSending(false)
    }
  }

  const handlePayment = async () => {
    if (!id) return
    setPaySaving(true)
    try {
      await registerPayment(id, {
        amount: payForm.amount ? +payForm.amount : undefined,
        paymentDate: payForm.paymentDate,
        paymentMethod: payForm.paymentMethod,
        reference: payForm.reference || undefined,
      })
      toast.success('Paiement enregistré avec succès !')
      setShowPayModal(false)
      reload()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement'
      toast.error(msg)
    } finally {
      setPaySaving(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!id) return
    setDownloading(true)
    try {
      await downloadInvoicePdf(id)
      if ((inv as any).status === 'BROUILLON') {
        await updateInvoiceStatus(id, 'ENVOYEE')
        reload()
      }
      toast.success('PDF téléchargé avec succès !')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors du téléchargement du PDF'
      toast.error(msg)
    } finally {
      setDownloading(false)
    }
  }

  const handleManualStatus = async (newStatus: string) => {
    if (!id) return
    try {
      await updateInvoiceStatus(id, newStatus)
      reload()
    } catch {}
  }

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
  const paidAmount  = Number(i.paidAmount ?? 0)
  const remaining   = totalAmount - paidAmount
  const lines       = (i.lines ?? []) as any[]
  const isPaid      = i.status === 'PAYEE'
  const isPartial   = i.status === 'PARTIELLEMENT_PAYEE'
  const isAccepted  = i.status === 'ACCEPTEE'
  const paymentLink = `https://pay.djamo.com/3waob`
  const qrData      = paymentLink

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CHEQUE:            'Chèque',
    VIREMENT_BANCAIRE: 'Virement bancaire',
    MOBILE_MONEY:      'Mobile Money',
    ESPECE:            'Espèces',
  }
  const paymentMethodLabel = i.paymentMethod ? (PAYMENT_METHOD_LABELS[i.paymentMethod] ?? i.paymentMethod) : '—'

  const docType = i.type === 'DEVIS' ? 'Devis' : i.type === 'PROFORMA' ? 'Facture Proforma' : 'Facture'
  const backPath = i.type === 'DEVIS' ? '/devis' : i.type === 'PROFORMA' ? '/proforma' : '/facturation'
  const backLabel = i.type === 'DEVIS' ? 'Retour aux devis' : i.type === 'PROFORMA' ? 'Retour aux proforma' : 'Retour à la facturation'
  const clientName = i.client?.name ?? i.lead?.companyName ?? i.lead?.contactName ?? '—'

  return (
    <div className="space-y-6">
      {/* Toolbar - not printed */}
      <div className="flex items-center justify-between gap-2 flex-wrap no-print">
        <button onClick={() => nav(backPath)} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> {backLabel}
        </button>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => { setAttachment(null); setShowEmailModal(true) }}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            <Send size={16} /> <span className="hidden sm:inline">Envoyer par mail</span><span className="sm:hidden">Email</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="hidden sm:inline">{downloading ? 'Génération...' : 'Télécharger PDF'}</span><span className="sm:hidden">PDF</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#C8A000] text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-[#B08E00] transition-colors"
          >
            <Printer size={16} /> <span className="hidden sm:inline">Imprimer</span><span className="sm:hidden">Print</span>
          </button>
          {i.type === 'FACTURE' && !isPaid && (
            <button
              onClick={() => setShowPayModal(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-green-700 transition-colors"
            >
              <CreditCard size={16} /> <span className="hidden sm:inline">Encaisser</span><span className="sm:hidden">Payer</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice document — reproducing the exact layout */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <div id="invoice-print" className="bg-white shadow-lg max-w-[210mm] mx-auto relative" style={{ minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>

        {/* Payment ribbon — only on FACTURE */}
        {i.type === 'FACTURE' && (
          <div className="absolute top-0 right-0 z-10 overflow-hidden w-48 h-48 pointer-events-none">
            <div
              className={`absolute top-9 -right-16 w-72 text-center py-2.5 text-[11px] font-black uppercase tracking-widest shadow-lg rotate-45 ${
                isPaid ? 'bg-green-600 text-white' : isPartial ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
              }`}
              style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
            >
              {isPaid ? 'PAYÉE' : isPartial ? (<>{'PARTIELLEMENT'}<br/>{'PAYÉE'}</>) : 'NON PAYÉE'}
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="px-4 sm:px-12 pt-8 pb-6 flex flex-col" style={{ minHeight: '297mm' }}>

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
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-2">
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
          </div>

          {/* Date info table */}
          <div className="border border-slate-300 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 text-[11px]">
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
                <p className="text-slate-800">{paymentMethodLabel}</p>
              </div>
            </div>
          </div>

          {/* Notes area displayed before billing lines table */}
          {i.notes && (
            <div className="mb-6 p-4 bg-slate-50 border-l-4 border-[#C8A000] text-sm text-slate-700">
              <p className="font-bold text-slate-800 mb-1">Note :</p>
              <p className="whitespace-pre-line">{i.notes}</p>
            </div>
          )}

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
                      {cleanDescription(line.description)}
                    </td>
                    <td className="px-3 py-2.5 border border-slate-200 text-center text-slate-700">
                      {Number(line.quantity).toFixed(2)} Unité(s)
                    </td>
                    <td className="px-3 py-2.5 border border-slate-200 text-right text-slate-700">
                      {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(Number(line.unitPrice))}
                    </td>
                    <td className="px-3 py-2.5 border border-slate-200 text-right font-bold text-slate-800">
                      {new Intl.NumberFormat('fr-FR').format(Number(line.quantity) * Number(line.unitPrice))} F CFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total box */}
          <div className="flex justify-end mb-8">
            <div className="w-full sm:w-72 border border-slate-200">
              {/* Total */}
              <div className="flex items-center border-b border-slate-200">
                <div className="flex-1 px-4 py-2 bg-[#C8A000]/10 border-r border-[#C8A000]/30">
                  <span className="text-sm font-bold text-[#C8A000]">Total TTC</span>
                </div>
                <div className="px-4 py-2 text-right">
                  <span className="text-sm font-black text-slate-800">
                    {new Intl.NumberFormat('fr-FR').format(totalAmount)} F CFA
                  </span>
                </div>
              </div>
              {/* Acompte / Montant payé — si payée ou partiellement payée */}
              {i.type === 'FACTURE' && (isPaid || isPartial) && (
                <div className={`flex items-center border-b border-slate-200 ${isPartial ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <div className={`flex-1 px-4 py-2 border-r ${isPartial ? 'border-amber-100' : 'border-green-100'}`}>
                    <span className={`text-sm font-semibold ${isPartial ? 'text-amber-700' : 'text-green-700'}`}>{isPartial ? 'Acompte versé' : 'Montant payé'}</span>
                  </div>
                  <div className="px-4 py-2 text-right">
                    <span className={`text-sm font-bold ${isPartial ? 'text-amber-700' : 'text-green-700'}`}>
                      {new Intl.NumberFormat('fr-FR').format(paidAmount)} F CFA
                    </span>
                  </div>
                </div>
              )}
              {/* Solde restant */}
              {i.type === 'FACTURE' && (
                <div className={`flex items-center ${isPaid ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex-1 px-4 py-2 border-r border-slate-200">
                    <span className={`text-sm font-bold ${isPaid ? 'text-green-700' : 'text-red-700'}`}>
                      Solde restant
                    </span>
                  </div>
                  <div className="px-4 py-2 text-right">
                    <span className={`text-sm font-black ${isPaid ? 'text-green-700' : 'text-red-700'}`}>
                      {isPaid
                        ? '0 F CFA'
                        : `${new Intl.NumberFormat('fr-FR').format(remaining)} F CFA`
                      }
                    </span>
                  </div>
                </div>
              )}
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
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowEmailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative px-6 py-5" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a2332 100%)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Send size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Envoyer par e-mail</h2>
                    <p className="text-[11px] text-slate-400">{i.reference} — {clientName}</p>
                  </div>
                </div>
                <button onClick={() => setShowEmailModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 text-sm border border-slate-200">
                <p className="text-slate-600">La facture <strong>{i.reference}</strong> sera envoyée par e-mail au client <strong>{clientName}</strong> avec le PDF en pièce jointe.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pièce jointe supplémentaire (optionnel)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4">
                  {attachment ? (
                    <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-700 truncate">{attachment.name}</span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">({(attachment.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button onClick={() => setAttachment(null)} className="p-1 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-2">
                      <Paperclip size={20} className="text-slate-300 mb-1" />
                      <span className="text-xs text-slate-500">Cliquez pour ajouter un fichier depuis votre ordinateur</span>
                      <input type="file" className="hidden" onChange={e => setAttachment(e.target.files?.[0] ?? null)} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button type="button" onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white bg-white transition-colors">
                Annuler
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowPayModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Encaisser un paiement</h3>
              <button onClick={() => setShowPayModal(false)} className="p-1 rounded hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Facture</p>
                <p className="font-bold text-slate-800">{i.reference} — {clientName}</p>
                <p className="text-sm text-slate-600 mt-1">Montant total : <strong>{fmt(totalAmount)}</strong></p>
                {paidAmount > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                    <p className="text-sm text-amber-700">Acompte déjà versé : <strong>{fmt(paidAmount)}</strong></p>
                    <p className="text-sm text-red-600 font-bold">Reste à payer : {fmt(remaining)}</p>
                  </div>
                )}
              </div>

              {/* Choix: totalité ou acompte */}
              {!isPartial && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPayForm(f => ({ ...f, amount: String(totalAmount) }))}
                    className={`px-4 py-3 rounded-lg text-sm font-bold border-2 transition-colors ${payForm.amount === String(totalAmount) ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <CheckCircle size={18} className="mx-auto mb-1" />
                    Paiement total
                    <p className="text-[10px] font-normal mt-0.5">{fmt(totalAmount)}</p>
                  </button>
                  <button
                    onClick={() => setPayForm(f => ({ ...f, amount: '' }))}
                    className={`px-4 py-3 rounded-lg text-sm font-bold border-2 transition-colors ${payForm.amount !== String(totalAmount) ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <CreditCard size={18} className="mx-auto mb-1" />
                    Acompte
                    <p className="text-[10px] font-normal mt-0.5">Paiement partiel</p>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Montant reçu (XOF)</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder={isPartial ? String(remaining) : String(totalAmount)} />
                {isPartial && (
                  <p className="text-[10px] text-slate-400 mt-1">Reste à payer : {fmt(remaining)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date de paiement</label>
                <input type="date" value={payForm.paymentDate} onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mode de paiement</label>
                <select value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                  <option value="VIREMENT_BANCAIRE">Virement bancaire</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="ESPECE">Espèces</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Référence (optionnel)</label>
                <input value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="N° chèque, réf. virement..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowPayModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
                <button onClick={handlePayment} disabled={paySaving || !payForm.amount}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-60">
                  {paySaving ? 'Enregistrement...' : 'Confirmer le paiement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
