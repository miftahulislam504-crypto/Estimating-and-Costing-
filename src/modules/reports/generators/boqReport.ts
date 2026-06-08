import type { Project, BOQ } from '@/types'
import type { TenderPackage } from '@/types'

const fmt  = (n: number) => Math.round(n).toLocaleString('en-BD')
const fmt2 = (n: number) => n.toLocaleString('en-BD', { maximumFractionDigits: 2 })

const BOQ_CAT_LABELS: Record<string, string> = {
  earthwork: 'A. Earthwork', concrete: 'B. Concrete Work',
  reinforcement: 'C. Reinforcement', masonry: 'D. Masonry Work',
  finishing: 'E. Finishing Works', mep: 'F. MEP Works', external: 'G. External Works',
}

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary:    [6,   148, 162],   // teal brand
  dark:       [15,  23,  42],    // surface-950
  darkMid:    [30,  41,  59],    // surface-800
  surface:    [51,  65,  85],    // surface-700
  lightText:  [226, 232, 240],   // surface-200
  mutedText:  [100, 116, 139],   // surface-500
  white:      [255, 255, 255],
  accent:     [16,  185, 129],   // emerald
  warning:    [245, 158, 11],    // amber
}

export async function generateBOQReport(
  project:    Project,
  boq:        BOQ,
  mode:       'boq' | 'tender' = 'boq',
  tender?:    TenderPackage
): Promise<void> {
  // Dynamic import to keep bundle lean
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = 210
  const MARGIN = 14
  let y = MARGIN

  // ── Helper functions ────────────────────────────────────────────────────────

  function setFill(rgb: number[]) { doc.setFillColor(rgb[0], rgb[1], rgb[2]) }
  function setTextColor(rgb: number[]) { doc.setTextColor(rgb[0], rgb[1], rgb[2]) }
  function setDrawColor(rgb: number[]) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]) }

  function header(title: string, subtitle: string) {
    // Dark header band
    setFill(COLORS.dark)
    doc.rect(0, 0, W, 32, 'F')
    setFill(COLORS.primary)
    doc.rect(0, 0, 3, 32, 'F')

    setTextColor(COLORS.white)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(title, MARGIN + 4, 13)

    setTextColor(COLORS.mutedText)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, MARGIN + 4, 20)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-BD')}`, MARGIN + 4, 26)
    y = 40
  }

  function projectInfoBlock() {
    setFill(COLORS.darkMid)
    doc.rect(MARGIN, y, W - MARGIN * 2, 22, 'F')
    setTextColor(COLORS.mutedText)
    doc.setFontSize(7)
    const fields = [
      ['Project', project.name],
      ['Location', project.location],
      ['Owner', project.owner || '—'],
      ['Consultant', project.consultant || '—'],
      ['Building Type', project.buildingType],
      ['Total Area', `${project.totalArea.toLocaleString()} m²`],
    ]
    const colW = (W - MARGIN * 2) / 3
    fields.forEach((f, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x   = MARGIN + 4 + col * colW
      const ty  = y + 6 + row * 9
      setTextColor(COLORS.mutedText)
      doc.text(f[0] + ':', x, ty)
      setTextColor(COLORS.lightText)
      doc.text(f[1], x + 20, ty)
    })
    y += 28
  }

  function sectionTitle(title: string) {
    setFill(COLORS.darkMid)
    doc.rect(MARGIN, y, W - MARGIN * 2, 8, 'F')
    setFill(COLORS.primary)
    doc.rect(MARGIN, y, 2, 8, 'F')
    setTextColor(COLORS.white)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(title, MARGIN + 5, y + 5.5)
    y += 11
  }

  // ── Build document ──────────────────────────────────────────────────────────

  header(
    mode === 'tender' ? 'TENDER BOQ DOCUMENT' : 'BILL OF QUANTITIES (BOQ)',
    `${project.name} — ${project.location}`
  )
  projectInfoBlock()

  // Group items by category
  const grouped: Record<string, typeof boq.items> = {}
  const items = tender ? tender.items.map(ti => ({ ...ti, source: 'manual' as const, notes: undefined })) : boq.items
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item as any)
  }

  let catIndex = 0
  for (const [cat, catItems] of Object.entries(grouped)) {
    const catLabel = BOQ_CAT_LABELS[cat] ?? cat.toUpperCase()
    const catTotal = catItems.reduce((s, i) => s + i.amount, 0)

    sectionTitle(`${catLabel}`)

    autoTable(doc, {
      startY:  y,
      margin:  { left: MARGIN, right: MARGIN },
      head: [['Item No', 'Description', 'Unit', 'Quantity', 'Rate (৳)', 'Amount (৳)']],
      body: catItems.map(item => [
        item.itemNo,
        item.description,
        item.unit,
        fmt2(item.quantity),
        fmt(item.rate ?? (item as any).unitRate ?? 0),
        fmt(item.amount),
      ]),
      foot: [['', `Subtotal — ${catLabel}`, '', '', '', fmt(catTotal)]],
      headStyles: {
        fillColor: COLORS.surface,
        textColor: COLORS.white,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fillColor: COLORS.darkMid,
        textColor: COLORS.lightText,
        fontSize: 7.5,
      },
      alternateRowStyles: { fillColor: COLORS.dark },
      footStyles: {
        fillColor: COLORS.surface,
        textColor: COLORS.warning,
        fontSize: 8,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 14 },
        3: { halign: 'right',  cellWidth: 22 },
        4: { halign: 'right',  cellWidth: 26 },
        5: { halign: 'right',  cellWidth: 30 },
      },
      theme: 'plain',
    })

    y = (doc as any).lastAutoTable.finalY + 6
    catIndex++
  }

  // ── Grand Total ─────────────────────────────────────────────────────────────

  const grandTotal   = tender?.grandTotal ?? boq.grandTotal
  const contingency  = tender?.contingency ?? 0
  const directCost   = tender?.directCost  ?? boq.grandTotal

  const summaryRows: [string, string][] = [
    ['Direct Cost (BOQ Total)', fmt(directCost)],
  ]
  if (contingency > 0) summaryRows.push([`Contingency (${project.costSettings.contingencyPct}%)`, fmt(contingency)])
  summaryRows.push(['GRAND TOTAL', fmt(grandTotal)])

  autoTable(doc, {
    startY: y,
    margin: { left: W / 2, right: MARGIN },
    body:   summaryRows,
    bodyStyles:    { fillColor: COLORS.darkMid, textColor: COLORS.lightText, fontSize: 8 },
    alternateRowStyles: { fillColor: COLORS.dark },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold', textColor: [6, 148, 162] },
    },
    theme: 'plain',
    didParseCell: (data) => {
      if (data.row.index === summaryRows.length - 1) {
        data.cell.styles.fontSize    = 10
        data.cell.styles.fillColor   = COLORS.primary as any
        data.cell.styles.textColor   = COLORS.white as any
        data.cell.styles.fontStyle   = 'bold'
      }
    },
  })

  // ── Footer on each page ─────────────────────────────────────────────────────

  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    setFill(COLORS.dark)
    doc.rect(0, 287, W, 10, 'F')
    setTextColor(COLORS.mutedText)
    doc.setFontSize(7)
    doc.text('CivilOS Estimate — BNBC-Centric Construction Cost Platform', MARGIN, 293)
    doc.text(`Page ${i} of ${pageCount}`, W - MARGIN, 293, { align: 'right' })
  }

  doc.save(`${project.name.replace(/\s+/g, '_')}_BOQ_${new Date().toLocaleDateString('en-BD').replace(/\//g, '-')}.pdf`)
}
