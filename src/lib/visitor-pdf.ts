import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { VISIT_PURPOSES, ID_DOC_TYPES } from '../services/visitors.service'

const SAGARD_YELLOW = '#C8D400'
const SAGARD_DARK = '#0f172a'
const SAGARD_DARK_2 = '#1e293b'

interface VisitData {
  id: string
  reference?: string
  visitorName: string
  visitorCompany?: string
  visitorPhone?: string
  idType?: string
  idNumber?: string
  visitPurpose?: string
  hostName?: string
  plateNumber?: string
  badgeNo?: string
  notes?: string
  checkIn?: string | null
  checkOut?: string | null
  siteName?: string
  agentName?: string
}

function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDateShort(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getPurposeLabel(value?: string): string {
  return VISIT_PURPOSES.find(p => p.value === value)?.label ?? value ?? '—'
}

function getIdTypeLabel(value?: string): string {
  return ID_DOC_TYPES.find(d => d.value === value)?.label ?? value ?? '—'
}

function addHeader(doc: jsPDF, subtitle: string) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Dark header bar
  doc.setFillColor(SAGARD_DARK)
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Yellow accent line
  doc.setFillColor(SAGARD_YELLOW)
  doc.rect(0, 28, pageWidth, 1.5, 'F')

  // Company name
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('SAGARD ERP', 14, 13)

  // Subtitle
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#94A3B8')
  doc.text(subtitle, 14, 21)

  // Date d'édition
  doc.setFontSize(8)
  doc.text(`Édité le ${new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`, pageWidth - 14, 21, { align: 'right' })
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor('#94A3B8')
    doc.setFont('helvetica', 'normal')
    doc.text(
      `SAGARD ERP — Document généré automatiquement — Page ${i}/${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' },
    )
  }
}

/**
 * Génère une fiche PDF individuelle pour un visiteur
 */
export function exportVisitorFiche(v: VisitData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  addHeader(doc, 'Fiche individuelle de visite')

  let y = 42

  // Reference badge
  doc.setFillColor(SAGARD_YELLOW)
  doc.roundedRect(14, y, 50, 8, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(SAGARD_DARK)
  doc.text(`Réf: ${v.reference ?? 'N/A'}`, 16, y + 5.5)
  y += 14

  // Status badge
  const isPresent = !v.checkOut
  doc.setFillColor(isPresent ? '#10B981' : '#64748B')
  doc.roundedRect(14, y, 35, 6, 1.5, 1.5, 'F')
  doc.setFontSize(8)
  doc.setTextColor('#FFFFFF')
  doc.text(isPresent ? 'PRÉSENT' : 'SORTI', 16, y + 4.2)
  y += 12

  // Visitor name (large)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(SAGARD_DARK)
  doc.text(v.visitorName, 14, y)
  y += 8

  if (v.visitorCompany) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#64748B')
    doc.text(v.visitorCompany, 14, y)
    y += 6
  }
  y += 4

  // Info table
  const infoRows: [string, string][] = [
    ['Téléphone', v.visitorPhone ?? '—'],
    ['Type de pièce', getIdTypeLabel(v.idType)],
    ['N° pièce d\'identité', v.idNumber ?? '—'],
    ['Motif de la visite', getPurposeLabel(v.visitPurpose)],
    ['Personne visitée', v.hostName ?? '—'],
    ['N° plaque véhicule', v.plateNumber ?? '—'],
    ['N° badge visiteur', v.badgeNo ?? '—'],
    ['Site', v.siteName ?? '—'],
    ['Agent réception', v.agentName ?? '—'],
    ['Arrivée', fmtDateTime(v.checkIn)],
    ['Départ', fmtDateTime(v.checkOut)],
  ]

  autoTable(doc, {
    startY: y,
    head: [['Information', 'Détail']],
    body: infoRows,
    theme: 'striped',
    headStyles: {
      fillColor: SAGARD_DARK_2 as any,
      textColor: '#FFFFFF' as any,
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: '#334155' as any,
    },
    alternateRowStyles: {
      fillColor: '#F8FAFC' as any,
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold', textColor: '#64748B' as any },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  })

  // Notes section
  const finalY = (doc as any).lastAutoTable.finalY + 8
  if (v.notes) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor('#64748B')
    doc.text('Notes / Observations', 14, finalY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#334155')
    const splitNotes = doc.splitTextToSize(v.notes, pageWidth - 28)
    doc.text(splitNotes, 14, finalY + 5)
  }

  addFooter(doc)
  doc.save(`fiche_visite_${(v.visitorName || 'visiteur').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}

/**
 * Génère un PDF listant plusieurs visites (sélection ou par jour)
 */
export function exportVisitList(visits: VisitData[], title: string, filenameDate?: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })

  addHeader(doc, title)

  const rows = visits.map(v => [
    v.reference ?? '—',
    v.visitorName,
    v.visitorCompany ?? '—',
    v.visitorPhone ?? '—',
    getPurposeLabel(v.visitPurpose),
    v.hostName ?? '—',
    v.agentName ?? '—',
    fmtDateTime(v.checkIn),
    v.checkOut ? fmtDateTime(v.checkOut) : 'En cours',
  ])

  autoTable(doc, {
    startY: 38,
    head: [['Réf.', 'Visiteur', 'Entreprise', 'Téléphone', 'Motif', 'Personne visitée', 'Agent', 'Arrivée', 'Départ']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: SAGARD_DARK_2 as any,
      textColor: '#FFFFFF' as any,
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: '#334155' as any,
    },
    alternateRowStyles: {
      fillColor: '#F8FAFC' as any,
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 27 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
      6: { cellWidth: 30 },
      7: { cellWidth: 35 },
      8: { cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      // Summary at bottom
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const present = visits.filter(v => !v.checkOut).length
      const sorti = visits.length - present
      doc.setFontSize(8)
      doc.setTextColor('#64748B')
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Total: ${visits.length} visite(s) — Présents: ${present} — Sortis: ${sorti}`,
        14,
        pageHeight - 12,
      )
    },
  })

  addFooter(doc)

  const dateStr = filenameDate ?? new Date().toISOString().split('T')[0]
  doc.save(`registre_visites_${dateStr}.pdf`)
}
