import type { Project, BOQ, ProcurementPlan } from '@/types'

const fmt = (n: number) => Math.round(n)

export async function generateBOQExcel(
  project:     Project,
  boq:         BOQ,
  mode:        'boq' | 'procurement' = 'boq',
  procurement?: ProcurementPlan | null
): Promise<void> {
  const XLSX = await import('xlsx')
  const wb   = XLSX.utils.book_new()

  if (mode === 'boq') {
    // ── BOQ Sheet ─────────────────────────────────────────────────────────────

    const grouped: Record<string, typeof boq.items> = {}
    for (const item of boq.items) {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    }

    const rows: any[][] = [
      [`BILL OF QUANTITIES — ${project.name}`],
      [`Location: ${project.location} | Date: ${new Date().toLocaleDateString('en-BD')}`],
      [],
      ['Item No', 'Description', 'Unit', 'Quantity', 'Rate (৳)', 'Amount (৳)', 'Category', 'Source'],
    ]

    let grandTotal = 0

    for (const [cat, items] of Object.entries(grouped)) {
      const catLabel = cat.toUpperCase()
      rows.push([catLabel, '', '', '', '', '', '', ''])

      for (const item of items) {
        rows.push([
          item.itemNo, item.description, item.unit,
          item.quantity, fmt(item.rate), fmt(item.amount),
          item.category, item.source,
        ])
      }

      const subtotal = items.reduce((s, i) => s + i.amount, 0)
      grandTotal += subtotal
      rows.push(['', `Subtotal — ${catLabel}`, '', '', '', fmt(subtotal), '', ''])
      rows.push([])
    }

    rows.push(['', 'GRAND TOTAL', '', '', '', fmt(grandTotal), '', ''])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [
      { wch: 10 }, { wch: 45 }, { wch: 8 }, { wch: 12 },
      { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 10 },
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'BOQ')

    // ── Summary sheet ─────────────────────────────────────────────────────────

    const summaryRows: (string | number)[][] = [
      ['BOQ Summary'],
      [`Project: ${project.name}`],
      [],
      ['Category', 'Items', 'Amount (৳)', '% of Total'],
    ]

    const settings = project.costSettings
    for (const [cat, items] of Object.entries(grouped)) {
      const subtotal = items.reduce((s, i) => s + i.amount, 0)
      summaryRows.push([
        cat, items.length, fmt(subtotal),
        grandTotal > 0 ? +((subtotal / grandTotal * 100).toFixed(1)) : 0,
      ])
    }

    summaryRows.push([], ['Direct Cost (BOQ)', '', fmt(grandTotal), ''])
    summaryRows.push([`Overhead (${settings.overheadPercent}%)`, '', fmt(grandTotal * settings.overheadPercent / 100), ''])
    summaryRows.push([`Profit (${settings.profitPercent}%)`,     '', fmt(grandTotal * settings.profitPercent    / 100), ''])
    summaryRows.push([`VAT (${settings.vatPercent}%)`,           '', fmt(grandTotal * settings.vatPercent        / 100), ''])

    const ws2 = XLSX.utils.aoa_to_sheet(summaryRows)
    ws2['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 16 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary')

    XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '_')}_BOQ.xlsx`)

  } else if (mode === 'procurement' && procurement) {
    // ── Material Requirements sheet ───────────────────────────────────────────

    const matRows: any[][] = [
      [`PROCUREMENT PLAN — ${project.name}`],
      [`Duration: ${procurement.durationMonths} months | Total Cost: ৳${fmt(procurement.totalCost).toLocaleString()}`],
      [],
      ['Material', 'Material (Bengali)', 'Unit', 'Total Qty', 'Unit Rate (৳)', 'Total Cost (৳)', 'Status'],
      ...procurement.items.map(item => [
        item.material, item.materialBn, item.unit,
        item.totalQty, fmt(item.unitRate), fmt(item.totalCost), item.status,
      ]),
      [],
      ['', '', '', '', 'Total', fmt(procurement.totalCost)],
    ]

    const ws = XLSX.utils.aoa_to_sheet(matRows)
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Materials')

    // ── Monthly Schedule sheet ────────────────────────────────────────────────

    const schedRows: any[][] = [
      ['Monthly Procurement Schedule'],
      [],
    ]

    for (const month of procurement.schedule) {
      schedRows.push([month.label])
      schedRows.push(['Material', 'Unit', 'Quantity', 'Rate (৳)', 'Cost (৳)'])
      for (const item of month.items) {
        schedRows.push([item.material, item.unit, item.quantity, fmt(item.unitRate), fmt(item.cost)])
      }
      schedRows.push(['', '', '', 'Month Total', fmt(month.totalCost)])
      schedRows.push([])
    }

    const ws2 = XLSX.utils.aoa_to_sheet(schedRows)
    ws2['!cols'] = [{ wch: 32 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Monthly Schedule')

    XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '_')}_Procurement.xlsx`)
  }
}
