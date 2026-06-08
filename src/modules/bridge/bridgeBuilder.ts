import type {
  CivilOSDataBridge, Project,
  TakeoffSummary, ProjectEstimation, ProjectBudget,
  ProcurementPlan, CashFlowPlan, VariationRegister, VERegister
} from '@/types'

export function buildDataBridge(
  project:    Project,
  takeoff:    TakeoffSummary   | null,
  estimation: ProjectEstimation | null,
  budget:     ProjectBudget    | null,
  procurement:ProcurementPlan  | null,
  cashFlow:   CashFlowPlan     | null,
  variation:  VariationRegister | null,
  ve:         VERegister       | null,
): CivilOSDataBridge {

  return {
    version:    '2.0',
    exportedAt: new Date().toISOString(),
    exportedBy: 'CivilOS Estimate',

    project: {
      id:           project.id,
      name:         project.name,
      location:     project.location,
      region:       project.region,
      buildingType: project.buildingType,
      totalFloors:  project.totalFloors,
      totalArea:    project.totalArea,
      plotArea:     project.plotArea,
      owner:        project.owner,
      consultant:   project.consultant,
    },

    estimation: estimation ? {
      grandTotal:      estimation.grandTotal,
      directCost:      estimation.directCost,
      overheadCost:    estimation.overheadCost,
      profitCost:      estimation.profitCost,
      contingencyCost: estimation.contingencyCost,
      vatAmount:       estimation.vatAmount,
      costPerSqm:      estimation.costPerSqm,
      costPerSqft:     estimation.costPerSqft,
      costPerFloor:    estimation.costPerFloor,
      preparedAt:      estimation.preparedAt,
    } : null,

    budget: budget ? {
      totalAllocated: budget.totalAllocated,
      totalActual:    budget.totalActual,
      totalVariance:  budget.totalVariance,
      lines: budget.lines.map(l => ({
        category:    l.category,
        description: l.description,
        allocated:   l.allocated,
        actual:      l.actual,
      })),
    } : null,

    procurement: procurement ? {
      totalCost:      procurement.totalCost,
      durationMonths: procurement.durationMonths,
      items: procurement.items.map(i => ({
        material:  i.material,
        unit:      i.unit,
        totalQty:  i.totalQty,
        unitRate:  i.unitRate,
        totalCost: i.totalCost,
        status:    i.status,
      })),
      monthlyTotals: procurement.schedule.map(m => ({
        label:     m.label,
        totalCost: m.totalCost,
      })),
    } : null,

    cashFlow: cashFlow ? {
      durationMonths: cashFlow.durationMonths,
      totalCashIn:    cashFlow.totalCashIn,
      totalCashOut:   cashFlow.totalCashOut,
      netProfit:      cashFlow.netProfit,
      peakNegative:   cashFlow.peakNegative,
      months: cashFlow.months.map(m => ({
        label:          m.label,
        cashIn:         m.cashIn,
        cashOut:        m.cashOut,
        netFlow:        m.netFlow,
        runningBalance: m.runningBalance,
      })),
    } : null,

    takeoff: takeoff ? {
      totalConcreteVol:  takeoff.totalConcreteVol,
      totalSteelWeight:  takeoff.totalSteelWeight,
      totalFormworkArea: takeoff.totalFormworkArea,
      totalBrickQty:     takeoff.totalBrickQty,
      totalPlasterArea:  takeoff.totalPlasterArea,
      totalPaintArea:    takeoff.totalPaintArea,
      totalDoors:        takeoff.totalDoors,
      totalWindows:      takeoff.totalWindows,
    } : null,

    variation: variation ? {
      originalCost:  variation.originalCost,
      netVariation:  variation.netVariation,
      revisedCost:   variation.revisedCost,
      approvedCount: variation.items.filter(i => i.status === 'approved' || i.status === 'implemented').length,
      pendingCount:  variation.items.filter(i => i.status === 'pending').length,
    } : null,

    valueEngineering: ve ? {
      totalPotentialSaving: ve.totalPotentialSaving,
      totalAcceptedSaving:  ve.totalAcceptedSaving,
      proposalCount:        ve.items.length,
      acceptedCount:        ve.items.filter(i => i.status === 'accepted').length,
    } : null,
  }
}

// ── Download helper ───────────────────────────────────────────────────────────

export function downloadJSON(data: CivilOSDataBridge, filename: string): string {
  const json     = JSON.stringify(data, null, 2)
  const blob     = new Blob([json], { type: 'application/json' })
  const url      = URL.createObjectURL(blob)
  const a        = document.createElement('a')
  a.href         = url
  a.download     = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  const sizeKB   = (blob.size / 1024).toFixed(1)
  return `${sizeKB} KB`
}

export function downloadCivilOS(data: CivilOSDataBridge, filename: string): string {
  // .civilos is just JSON with a custom extension
  const json     = JSON.stringify(data, null, 2)
  const blob     = new Blob([json], { type: 'application/octet-stream' })
  const url      = URL.createObjectURL(blob)
  const a        = document.createElement('a')
  a.href         = url
  a.download     = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  const sizeKB   = (blob.size / 1024).toFixed(1)
  return `${sizeKB} KB`
}

// ── CSV export for simple flat data ──────────────────────────────────────────

export function downloadCSV(rows: string[][], filename: string): void {
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Import handler ────────────────────────────────────────────────────────────

export async function importCivilOSFile(file: File): Promise<CivilOSDataBridge> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.version && data.project) {
          resolve(data as CivilOSDataBridge)
        } else {
          reject(new Error('Invalid .civilos file format'))
        }
      } catch {
        reject(new Error('File parse error'))
      }
    }
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsText(file)
  })
}
