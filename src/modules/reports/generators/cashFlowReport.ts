import type { Project, CashFlowPlan } from '@/types'

const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString('en-BD')

const COLORS: Record<string, [number, number, number]> = {
  primary: [6, 148, 162],
  dark:    [15, 23, 42],
  darkMid: [30, 41, 59],
  surface: [51, 65, 85],
  light:   [226, 232, 240],
  muted:   [100, 116, 139],
  white:   [255, 255, 255],
  emerald: [16, 185, 129],
  amber:   [245, 158, 11],
  red:     [239, 68, 68],
}

export async function generateCashFlowReport(
  project:  Project,
  plan:     CashFlowPlan,
  format:   'pdf' | 'excel' = 'pdf'
): Promise<void> {
  if (format === 'excel') {
    await generateCashFlowExcel(project, plan)
    return
  }

  const { default: jsPDF }     = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W   = 297
  const M   = 14
  let y     = M

  // Header
  doc.setFillColor(...COLORS.dark as [number,number,number])
  doc.rect(0, 0, W, 30, 'F')
  doc.setFillColor(...COLORS.primary as [number,number,number])
  doc.rect(0, 0, 3, 30, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('CASH FLOW FORECAST REPORT', M + 4, 13)

  doc.setTextColor(...COLORS.muted as [number,number,number])
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`${project.name} — ${project.location}`, M + 4, 21)
  doc.text(`Duration: ${plan.durationMonths} months | Generated: ${new Date().toLocaleDateString('en-BD')}`, M + 4, 27)
  y = 38

  // Key metrics row
  const kpis = [
    { label: 'Total Cash In',  value: '৳ ' + fmt(plan.totalCashIn),  color: COLORS.emerald },
    { label: 'Total Cash Out', value: '৳ ' + fmt(plan.totalCashOut), color: COLORS.amber },
    { label: 'Net Profit',     value: (plan.netProfit >= 0 ? '+' : '−') + '৳ ' + fmt(plan.netProfit), color: plan.netProfit >= 0 ? COLORS.emerald : COLORS.red },
    { label: 'Peak Deficit',   value: plan.peakNegative < 0 ? '−৳ ' + fmt(plan.peakNegative) : 'None', color: plan.peakNegative < 0 ? COLORS.red : COLORS.emerald },
    { label: 'Duration',       value: plan.durationMonths + ' months', color: COLORS.primary },
  ]

  const kW = (W - M * 2) / kpis.length
  kpis.forEach((k, i) => {
    const x = M + i * kW
    doc.setFillColor(...COLORS.darkMid as [number,number,number])
    doc.roundedRect(x, y, kW - 2, 16, 2, 2, 'F')
    doc.setFontSize(6.5)
    doc.setTextColor(...COLORS.muted as [number,number,number])
    doc.text(k.label, x + 4, y + 6)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...k.color as [number,number,number])
    doc.text(k.value, x + 4, y + 13)
  })
  y += 22
  doc.setFont('helvetica', 'normal')

  // Monthly cash flow table
  const tableBody = plan.months.map(m => [
    m.label.split(' ')[0],
    m.advanceReceipt > 0    ? fmt(m.advanceReceipt)   : '—',
    m.contractReceipt > 0   ? fmt(m.contractReceipt)  : '—',
    m.retentionRelease > 0  ? fmt(m.retentionRelease) : '—',
    fmt(m.cashIn),
    fmt(m.materialCost),
    fmt(m.laborCost),
    fmt(m.equipmentCost),
    fmt(m.cashOut),
    (m.netFlow >= 0 ? '+' : '−') + fmt(m.netFlow),
    (m.runningBalance >= 0 ? '' : '−') + fmt(m.runningBalance),
  ])

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [[
      'Month', 'Advance', 'Receipt', 'Retention',
      'Cash In ৳', 'Material', 'Labor', 'Equipment',
      'Cash Out ৳', 'Net Flow', 'Balance ৳',
    ]],
    body: tableBody,
    foot: [[
      'TOTAL', '—', '—', '—',
      fmt(plan.totalCashIn), '—', '—', '—',
      fmt(plan.totalCashOut),
      (plan.netProfit >= 0 ? '+' : '−') + fmt(plan.netProfit),
      fmt(plan.months[plan.months.length-1]?.runningBalance ?? 0),
    ]],
    headStyles:  { fillColor: COLORS.surface, textColor: COLORS.white, fontSize: 7, fontStyle: 'bold', halign: 'center' },
    bodyStyles:  { fillColor: COLORS.darkMid, textColor: COLORS.light, fontSize: 7, halign: 'right' },
    alternateRowStyles: { fillColor: COLORS.dark },
    footStyles:  { fillColor: COLORS.surface, textColor: COLORS.amber, fontSize: 7.5, fontStyle: 'bold', halign: 'right' },
    columnStyles: {
      0: { halign: 'left', cellWidth: 22 },
      4: { textColor: COLORS.emerald },
      8: { textColor: COLORS.amber },
      9: { fontStyle: 'bold' },
      10: { fontStyle: 'bold', textColor: COLORS.primary },
    },
    theme: 'plain',
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 10) {
        const val = plan.months[data.row.index]?.runningBalance ?? 0
        if (val < 0) data.cell.styles.textColor = COLORS.red as any
        else         data.cell.styles.textColor = COLORS.emerald as any
      }
      if (data.section === 'body' && data.column.index === 9) {
        const val = plan.months[data.row.index]?.netFlow ?? 0
        if (val < 0) data.cell.styles.textColor = COLORS.red as any
        else         data.cell.styles.textColor = COLORS.emerald as any
      }
    },
  })

  // Footer
  const pages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(...COLORS.dark as [number,number,number])
    doc.rect(0, 200, W, 10, 'F')
    doc.setTextColor(...COLORS.muted as [number,number,number])
    doc.setFontSize(7)
    doc.text('CivilOS Estimate — BNBC-Centric Construction Cost Platform', M, 206)
    doc.text(`Page ${i} of ${pages}`, W - M, 206, { align: 'right' })
  }

  doc.save(`${project.name.replace(/\s+/g, '_')}_CashFlow.pdf`)
}

// ── Excel ─────────────────────────────────────────────────────────────────────

async function generateCashFlowExcel(project: Project, plan: CashFlowPlan): Promise<void> {
  const XLSX = await import('xlsx')
  const wb   = XLSX.utils.book_new()

  const rows = [
    ['CivilOS Estimate — Cash Flow Report'],
    [`Project: ${project.name} | Duration: ${plan.durationMonths} months`],
    [],
    ['Month', 'Advance', 'Contract Receipt', 'Retention Release',
     'Total Cash In', 'Material', 'Labor', 'Equipment', 'Overhead',
     'Total Cash Out', 'Net Flow', 'Running Balance'],
    ...plan.months.map(m => [
      m.label, m.advanceReceipt, m.contractReceipt, m.retentionRelease,
      m.cashIn, m.materialCost, m.laborCost, m.equipmentCost, m.overheadCost,
      m.cashOut, m.netFlow, m.runningBalance,
    ]),
    [],
    ['Total Cash In', plan.totalCashIn],
    ['Total Cash Out', plan.totalCashOut],
    ['Net Profit', plan.netProfit],
    ['Peak Deficit', plan.peakNegative],
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = Array(12).fill({ wch: 18 })
  XLSX.utils.book_append_sheet(wb, ws, 'Cash Flow')
  XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '_')}_CashFlow.xlsx`)
}
