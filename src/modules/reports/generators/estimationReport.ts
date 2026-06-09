import type { Project, ProjectEstimation } from '@/types'
import { ESTIMATION_CATEGORIES } from '@/store/estimationStore'

const fmt = (n: number) => Math.round(n).toLocaleString('en-BD')

const COLORS: Record<string, [number, number, number]> = {
  primary:  [6, 148, 162],
  dark:     [15, 23, 42],
  darkMid:  [30, 41, 59],
  surface:  [51, 65, 85],
  light:    [226, 232, 240],
  muted:    [100, 116, 139],
  white:    [255, 255, 255],
  amber:    [245, 158, 11],
  emerald:  [16, 185, 129],
}

export async function generateEstimationReport(
  project:    Project,
  estimation: ProjectEstimation,
  format:     'pdf' | 'excel' = 'pdf'
): Promise<void> {
  if (format === 'excel') {
    await generateEstimationExcel(project, estimation)
    return
  }

  const { default: jsPDF }      = await import('jspdf')
  const { default: autoTable }  = await import('jspdf-autotable')

  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = 210
  const M    = 14
  let y      = M

  // Header
  doc.setFillColor(...COLORS.dark as [number,number,number])
  doc.rect(0, 0, W, 38, 'F')
  doc.setFillColor(...COLORS.primary as [number,number,number])
  doc.rect(0, 0, 3, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('COST ESTIMATION REPORT', M + 4, 14)

  doc.setTextColor(...COLORS.muted as [number,number,number])
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`${project.name} — ${project.location}`, M + 4, 22)
  doc.text(`Prepared: ${new Date(estimation.preparedAt).toLocaleDateString('en-BD')} | Valid: ${estimation.validityDays} days`, M + 4, 29)
  doc.text(`Prepared by: ${estimation.preparedBy}`, M + 4, 35)
  y = 46

  // ── Key Metrics ─────────────────────────────────────────────────────────────

  const metrics = [
    { label: 'Grand Total',  value: fmt(estimation.grandTotal),   color: COLORS.primary },
    { label: 'Cost per m²',  value: '৳ ' + fmt(estimation.costPerSqm),   color: COLORS.emerald },
    { label: 'Cost per sft', value: '৳ ' + fmt(estimation.costPerSqft),  color: COLORS.amber },
    { label: 'Total Area',   value: project.totalArea + ' m²',    color: COLORS.muted },
  ]

  const mW = (W - M * 2) / 4
  metrics.forEach((m, i) => {
    const x = M + i * mW
    doc.setFillColor(...COLORS.darkMid as [number,number,number])
    doc.roundedRect(x, y, mW - 2, 18, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.muted as [number,number,number])
    doc.text(m.label, x + 4, y + 6)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...m.color as [number,number,number])
    doc.text(m.value, x + 4, y + 14)
  })
  y += 24
  doc.setFont('helvetica', 'normal')

  // ── Line items by category ───────────────────────────────────────────────────

  const grouped: Record<string, typeof estimation.lineItems> = {}
  for (const item of estimation.lineItems) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }

  for (const cat of ESTIMATION_CATEGORIES) {
    const items = grouped[cat.id]
    if (!items || items.length === 0) continue

    const subtotal = items.reduce((s, i) => s + i.amount, 0)

    // Category header
    doc.setFillColor(...COLORS.darkMid as [number,number,number])
    doc.rect(M, y, W - M * 2, 7, 'F')
    doc.setFillColor(...COLORS.primary as [number,number,number])
    doc.rect(M, y, 2, 7, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(`${cat.label} — ${cat.labelBn}`, M + 5, y + 5)
    y += 9

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Description', 'Unit', 'Qty', 'Rate ৳', 'Amount ৳', 'Source']],
      body: items.map(item => [
        item.description,
        item.unit,
        item.quantity.toLocaleString('en-BD', { maximumFractionDigits: 2 }),
        fmt(item.unitRate),
        fmt(item.amount),
        item.source.toUpperCase(),
      ]),
      foot: [['Subtotal — ' + cat.label, '', '', '', fmt(subtotal), '']],
      headStyles:   { fillColor: COLORS.surface, textColor: COLORS.white, fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles:   { fillColor: COLORS.darkMid, textColor: COLORS.light, fontSize: 7 },
      alternateRowStyles: { fillColor: COLORS.dark },
      footStyles:   { fillColor: COLORS.surface, textColor: COLORS.amber, fontSize: 7.5, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 14 },
        2: { halign: 'right',  cellWidth: 18 },
        3: { halign: 'right',  cellWidth: 24 },
        4: { halign: 'right',  cellWidth: 28 },
        5: { halign: 'center', cellWidth: 16 },
      },
      theme: 'plain',
    })
    y = (doc as any).lastAutoTable.finalY + 5
  }

  // ── Cost Summary table ───────────────────────────────────────────────────────

  const s = project.costSettings
  const summaryData = [
    ['Direct Cost',              fmt(estimation.directCost)],
    [`Overhead (${s.overheadPercent}%)`, fmt(estimation.overheadCost)],
    [`Profit (${s.profitPercent}%)`,     fmt(estimation.profitCost)],
    [`Markup (${s.markupPercent}%)`,     fmt(estimation.markupCost)],
    [`Contingency (${s.contingencyPct}%)`, fmt(estimation.contingencyCost)],
    [`VAT (${s.vatPercent}%)`,           fmt(estimation.vatAmount)],
    ['GRAND TOTAL',              fmt(estimation.grandTotal)],
  ]

  autoTable(doc, {
    startY: y,
    margin: { left: W * 0.45, right: M },
    body: summaryData,
    bodyStyles: { fillColor: COLORS.darkMid, textColor: COLORS.light, fontSize: 8 },
    alternateRowStyles: { fillColor: COLORS.dark },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' },
    },
    theme: 'plain',
    didParseCell: (data) => {
      if (data.row.index === summaryData.length - 1) {
        data.cell.styles.fontSize    = 10
        data.cell.styles.fillColor   = COLORS.primary as any
        data.cell.styles.textColor   = COLORS.white as any
        data.cell.styles.fontStyle   = 'bold'
      }
    },
  })

  // Page footer
  const pages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(...COLORS.dark as [number,number,number])
    doc.rect(0, 287, W, 10, 'F')
    doc.setTextColor(...COLORS.muted as [number,number,number])
    doc.setFontSize(7)
    doc.text('CivilOS Estimate — BNBC-Centric Construction Cost Platform', M, 293)
    doc.text(`Page ${i} of ${pages}`, W - M, 293, { align: 'right' })
  }

  doc.save(`${project.name.replace(/\s+/g, '_')}_Estimation_${Date.now()}.pdf`)
}

// ── Excel version ────────────────────────────────────────────────────────────

async function generateEstimationExcel(project: Project, estimation: ProjectEstimation): Promise<void> {
  const XLSX = await import('xlsx')

  const wb  = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['CivilOS Estimate — Cost Estimation Report'],
    [`Project: ${project.name}`],
    [`Location: ${project.location}`],
    [`Date: ${new Date().toLocaleDateString('en-BD')}`],
    [],
    ['Category', 'Description', 'Unit', 'Quantity', 'Unit Rate (৳)', 'Amount (৳)', 'Source'],
    ...estimation.lineItems.map(item => [
      item.category, item.description, item.unit,
      item.quantity, item.unitRate, item.amount, item.source,
    ]),
    [],
    ['', '', '', '', 'Direct Cost',   estimation.directCost],
    ['', '', '', '', 'Overhead',      estimation.overheadCost],
    ['', '', '', '', 'Profit',        estimation.profitCost],
    ['', '', '', '', 'Markup',        estimation.markupCost],
    ['', '', '', '', 'Contingency',   estimation.contingencyCost],
    ['', '', '', '', 'VAT',           estimation.vatAmount],
    ['', '', '', '', 'GRAND TOTAL',   estimation.grandTotal],
    [],
    ['Cost per m²',   estimation.costPerSqm],
    ['Cost per sft',  estimation.costPerSqft],
  ]

  const ws = XLSX.utils.aoa_to_sheet(summaryData)
  ws['!cols'] = [{ wch: 16 }, { wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Estimation')
  XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '_')}_Estimation.xlsx`)
}
