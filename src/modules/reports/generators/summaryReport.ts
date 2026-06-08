import type {
  Project, TakeoffSummary, BOQ,
  ProjectEstimation, ProjectBudget, CashFlowPlan
} from '@/types'

const fmt = (n: number) => Math.round(n).toLocaleString('en-BD')

const C = {
  primary:  [6,   148, 162] as [number,number,number],
  dark:     [15,  23,  42]  as [number,number,number],
  darkMid:  [30,  41,  59]  as [number,number,number],
  surface:  [51,  65,  85]  as [number,number,number],
  light:    [226, 232, 240] as [number,number,number],
  muted:    [100, 116, 139] as [number,number,number],
  white:    [255, 255, 255] as [number,number,number],
  emerald:  [16,  185, 129] as [number,number,number],
  amber:    [245, 158, 11]  as [number,number,number],
  red:      [239, 68,  68]  as [number,number,number],
  purple:   [147, 51,  234] as [number,number,number],
}

export async function generateProjectSummaryPDF(
  project:    Project,
  takeoff:    TakeoffSummary | null,
  boq:        BOQ | null,
  estimation: ProjectEstimation | null,
  budget:     ProjectBudget | null,
  cashFlow:   CashFlowPlan | null,
): Promise<void> {
  const { default: jsPDF }     = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W   = 210
  const M   = 14
  let y     = M

  const addPage = () => { doc.addPage(); y = M }

  // ── Cover Page ────────────────────────────────────────────────────────────

  doc.setFillColor(...C.dark)
  doc.rect(0, 0, W, 297, 'F')
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, 5, 297, 'F')
  doc.setFillColor(...C.darkMid)
  doc.rect(5, 60, W - 5, 120, 'F')

  // Logo text
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('CIVILOS ESTIMATE', M + 6, 30)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.muted)
  doc.text('BNBC-Centric Construction Cost Platform', M + 6, 37)

  // Title
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('PROJECT', M + 6, 78)
  doc.setTextColor(...C.primary)
  doc.text('COST REPORT', M + 6, 92)

  // Project name
  doc.setFontSize(14)
  doc.setTextColor(...C.light)
  doc.setFont('helvetica', 'normal')
  doc.text(project.name, M + 6, 108, { maxWidth: W - M * 2 - 10 })

  doc.setFontSize(9)
  doc.setTextColor(...C.muted)
  doc.text(project.location, M + 6, 118)
  doc.text(`${project.totalFloors} Floors  •  ${project.totalArea.toLocaleString()} m²  •  ${project.buildingType}`, M + 6, 126)

  // Date + prepared by
  doc.setFontSize(8)
  doc.setTextColor(...C.muted)
  doc.text(`Prepared: ${new Date().toLocaleDateString('en-BD')}`, M + 6, 168)
  if (estimation) doc.text(`Prepared by: ${estimation.preparedBy}`, M + 6, 176)

  // Grand total on cover
  if (estimation) {
    doc.setFillColor(...C.primary)
    doc.roundedRect(M + 6, 192, W - M * 2 - 12, 36, 4, 4, 'F')
    doc.setTextColor(...C.white)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('PROJECT GRAND TOTAL', W / 2, 205, { align: 'center' })
    doc.setFontSize(22)
    doc.text('৳ ' + fmt(estimation.grandTotal), W / 2, 218, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`৳ ${fmt(estimation.costPerSqft)} per sft  •  ৳ ${fmt(estimation.costPerSqm)} per m²`, W / 2, 226, { align: 'center' })
  }

  // ── Page 2: Project Overview + Takeoff ────────────────────────────────────

  addPage()

  // Section header helper
  const secH = (title: string) => {
    doc.setFillColor(...C.darkMid)
    doc.rect(M, y, W - M * 2, 9, 'F')
    doc.setFillColor(...C.primary)
    doc.rect(M, y, 2, 9, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text(title, M + 5, y + 6.5)
    y += 12
    doc.setFont('helvetica', 'normal')
  }

  // Info grid
  secH('PROJECT INFORMATION')
  const infoFields = [
    ['Project Name', project.name],
    ['Location', project.location],
    ['Region', project.region],
    ['Building Type', project.buildingType],
    ['Total Floors', project.totalFloors + ' floors'],
    ['Total Area', project.totalArea.toLocaleString() + ' m²'],
    ['Plot Area', project.plotArea.toLocaleString() + ' m²'],
    ['Owner', project.owner || '—'],
    ['Consultant', project.consultant || '—'],
    ['Currency', project.costSettings.currency],
  ]

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    body: infoFields,
    bodyStyles:   { fillColor: C.darkMid, textColor: C.light, fontSize: 8 },
    alternateRowStyles: { fillColor: C.dark },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 'auto' } },
    theme: 'plain',
  })
  y = (doc as any).lastAutoTable.finalY + 10

  // Quantity Takeoff Summary
  if (takeoff) {
    secH('QUANTITY TAKEOFF SUMMARY')
    const qtRows = [
      ['Total Concrete Volume',  fmt(takeoff.totalConcreteVol)  + ' m³'],
      ['Total Steel (Rebar)',     fmt(takeoff.totalSteelWeight / 1000) + ' MT'],
      ['Total Formwork Area',    fmt(takeoff.totalFormworkArea) + ' m²'],
      ['Total Brick Quantity',   takeoff.totalBrickQty.toLocaleString() + ' nos'],
      ['Total Plaster Area',     fmt(takeoff.totalPlasterArea)  + ' m²'],
      ['Total Paint Area',       fmt(takeoff.totalPaintArea)    + ' m²'],
      ['Total Doors',            takeoff.totalDoors  + ' nos'],
      ['Total Windows',          takeoff.totalWindows + ' nos'],
    ]

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      body: qtRows,
      bodyStyles:   { fillColor: C.darkMid, textColor: C.light, fontSize: 8 },
      alternateRowStyles: { fillColor: C.dark },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { halign: 'right', textColor: C.primary } },
      theme: 'plain',
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Page 3: Cost Summary ──────────────────────────────────────────────────

  if (estimation) {
    if (y > 200) addPage()
    secH('COST ESTIMATION SUMMARY')

    const s = project.costSettings
    const costSummary = [
      ['Direct Cost (BOQ)',          fmt(estimation.directCost),      ''],
      [`Overhead (${s.overheadPercent}%)`,  fmt(estimation.overheadCost),    ''],
      [`Profit (${s.profitPercent}%)`,       fmt(estimation.profitCost),      ''],
      [`Markup (${s.markupPercent}%)`,        fmt(estimation.markupCost),      ''],
      [`Contingency (${s.contingencyPct}%)`, fmt(estimation.contingencyCost), ''],
      [`VAT (${s.vatPercent}%)`,             fmt(estimation.vatAmount),       ''],
      ['GRAND TOTAL',                fmt(estimation.grandTotal),      '✓'],
    ]

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Cost Component', 'Amount (৳)', '']],
      body: costSummary,
      headStyles: { fillColor: C.surface, textColor: C.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fillColor: C.darkMid, textColor: C.light, fontSize: 8 },
      alternateRowStyles: { fillColor: C.dark },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold', textColor: C.primary },
        2: { halign: 'center', cellWidth: 12 },
      },
      theme: 'plain',
      didParseCell: (data) => {
        if (data.row.index === costSummary.length - 1 && data.section === 'body') {
          data.cell.styles.fillColor  = C.primary
          data.cell.styles.textColor  = C.white
          data.cell.styles.fontSize   = 10
        }
      },
    })
    y = (doc as any).lastAutoTable.finalY + 10

    // Per-area metrics
    const areaMetrics = [
      ['Cost per m²',    '৳ ' + fmt(estimation.costPerSqm)],
      ['Cost per sft',   '৳ ' + fmt(estimation.costPerSqft)],
      ['Cost per Floor', '৳ ' + fmt(estimation.costPerFloor)],
    ]

    autoTable(doc, {
      startY: y,
      margin: { left: M + 60, right: M },
      body: areaMetrics,
      bodyStyles: { fillColor: C.darkMid, textColor: C.light, fontSize: 8 },
      alternateRowStyles: { fillColor: C.dark },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', textColor: C.emerald as any },
      },
      theme: 'plain',
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Budget Summary ────────────────────────────────────────────────────────

  if (budget && y < 220) {
    secH('BUDGET SUMMARY')
    const budgetRows = budget.lines.map(l => [
      l.description,
      fmt(l.allocated),
      fmt(l.actual),
      l.variance >= 0 ? '+' + fmt(l.variance) : '−' + fmt(Math.abs(l.variance)),
    ])
    budgetRows.push([
      'TOTAL',
      fmt(budget.totalAllocated),
      fmt(budget.totalActual),
      fmt(budget.totalVariance),
    ])

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Category', 'Allocated ৳', 'Actual ৳', 'Variance ৳']],
      body: budgetRows,
      headStyles: { fillColor: C.surface, textColor: C.white, fontSize: 8 },
      bodyStyles: { fillColor: C.darkMid, textColor: C.light, fontSize: 7.5 },
      alternateRowStyles: { fillColor: C.dark },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right', textColor: C.amber },
        3: { halign: 'right', textColor: C.emerald },
      },
      theme: 'plain',
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Cash Flow Summary ─────────────────────────────────────────────────────

  if (cashFlow) {
    if (y > 220) addPage()
    secH('CASH FLOW SUMMARY')

    const cfRows = [
      ['Total Cash In',     '৳ ' + fmt(cashFlow.totalCashIn)],
      ['Total Cash Out',    '৳ ' + fmt(cashFlow.totalCashOut)],
      ['Net Profit/Loss',   (cashFlow.netProfit >= 0 ? '+' : '−') + '৳ ' + fmt(cashFlow.netProfit)],
      ['Peak Deficit',      cashFlow.peakNegative < 0 ? '−৳ ' + fmt(cashFlow.peakNegative) : 'None'],
      ['Duration',          cashFlow.durationMonths + ' months'],
    ]

    autoTable(doc, {
      startY: y,
      margin: { left: M + 40, right: M + 40 },
      body: cfRows,
      bodyStyles: { fillColor: C.darkMid, textColor: C.light, fontSize: 8 },
      alternateRowStyles: { fillColor: C.dark },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', textColor: C.primary } },
      theme: 'plain',
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Footer on all pages ───────────────────────────────────────────────────

  const pages = (doc as any).internal.getNumberOfPages()
  for (let i = 2; i <= pages; i++) {   // skip cover page (i=1)
    doc.setPage(i)
    doc.setFillColor(...C.dark)
    doc.rect(0, 287, W, 10, 'F')
    doc.setFillColor(...C.primary)
    doc.rect(0, 287, 3, 10, 'F')
    doc.setTextColor(...C.muted)
    doc.setFontSize(7)
    doc.text('CivilOS Estimate — BNBC-Centric Construction Cost Platform', M, 293)
    doc.text(`Page ${i} of ${pages}`, W - M, 293, { align: 'right' })
  }

  doc.save(`${project.name.replace(/\s+/g, '_')}_Project_Summary.pdf`)
}
