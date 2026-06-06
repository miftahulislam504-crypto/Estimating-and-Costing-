import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ProcurementPlan, ProcurementItem, MonthlySchedule,
  ProcurementScheduleItem, TakeoffSummary
} from '@/types'

// ─── Material requirements calculator ────────────────────────────────────────

interface MaterialRequirement {
  id:         string
  material:   string
  materialBn: string
  unit:       string
  quantity:   number
  unitRate:   number
}

export function calcMaterialRequirements(summary: TakeoffSummary): MaterialRequirement[] {
  const reqs: MaterialRequirement[] = []

  // Cement: 8.5 bags per m³ RCC M20
  if (summary.totalConcreteVol > 0) {
    reqs.push({
      id: 'cement', material: 'Cement (OPC 50kg bag)', materialBn: 'সিমেন্ট',
      unit: 'bag', quantity: Math.ceil(summary.totalConcreteVol * 8.5 * 1.05), unitRate: 580,
    })
    // Sand: 0.44 m³ per m³ concrete
    reqs.push({
      id: 'sand', material: 'Sand (Fine, river)', materialBn: 'বালি',
      unit: 'm³', quantity: Math.ceil(summary.totalConcreteVol * 0.44 * 1.05), unitRate: 2200,
    })
    // Stone chips: 0.88 m³ per m³ concrete
    reqs.push({
      id: 'stone', material: 'Stone Chips (20mm)', materialBn: 'পাথর চিপস',
      unit: 'm³', quantity: Math.ceil(summary.totalConcreteVol * 0.88 * 1.05), unitRate: 3500,
    })
  }

  // Steel rod
  if (summary.totalSteelWeight > 0) {
    const mt = summary.totalSteelWeight / 1000
    reqs.push({
      id: 'steel', material: 'Steel Rod Fe500', materialBn: 'রড Fe500',
      unit: 'MT', quantity: Math.ceil(mt * 1.03 * 10) / 10, unitRate: 98000,
    })
  }

  // Bricks
  if (summary.totalBrickQty > 0) {
    reqs.push({
      id: 'brick', material: 'Brick (1st Class)', materialBn: '১ম শ্রেণির ইট',
      unit: 'nos', quantity: Math.ceil(summary.totalBrickQty * 1.05), unitRate: 14,
    })
  }

  // Plaster materials (cement + sand)
  if (summary.totalPlasterArea > 0) {
    const plasterCement = Math.ceil(summary.totalPlasterArea * 0.22 * 1.1)
    reqs.push({
      id: 'plaster-cement', material: 'Cement for Plaster', materialBn: 'প্লাস্টারের সিমেন্ট',
      unit: 'bag', quantity: plasterCement, unitRate: 580,
    })
  }

  // Paint
  if (summary.totalPaintArea > 0) {
    // 1 tin 20L covers ~80 m² (2 coats)
    const tins = Math.ceil(summary.totalPaintArea / 80 * 1.1)
    reqs.push({
      id: 'paint', material: 'Interior Paint (20L tin)', materialBn: 'ইন্টেরিয়র পেইন্ট',
      unit: 'tin', quantity: tins, unitRate: 6500,
    })
    const primerTins = Math.ceil(tins * 0.5)
    reqs.push({
      id: 'primer', material: 'Primer (20L tin)', materialBn: 'প্রাইমার',
      unit: 'tin', quantity: primerTins, unitRate: 4500,
    })
  }

  return reqs
}

// ─── Monthly schedule builder ─────────────────────────────────────────────────

export function buildMonthlySchedule(
  requirements: MaterialRequirement[],
  durationMonths: number,
  startYear: number = new Date().getFullYear(),
  startMonth: number = new Date().getMonth() + 1
): MonthlySchedule[] {
  if (durationMonths === 0 || requirements.length === 0) return []

  // Distribution pattern: front-loaded for bulk materials
  const distPattern: Record<string, number[]> = {
    // Foundation heavy: month 1-3
    cement: buildDist(durationMonths, 'front'),
    sand:   buildDist(durationMonths, 'front'),
    stone:  buildDist(durationMonths, 'front'),
    steel:  buildDist(durationMonths, 'uniform'),
    brick:  buildDist(durationMonths, 'middle'),
    paint:  buildDist(durationMonths, 'end'),
    primer: buildDist(durationMonths, 'end'),
  }

  const schedules: MonthlySchedule[] = []

  for (let m = 0; m < durationMonths; m++) {
    const month      = ((startMonth - 1 + m) % 12) + 1
    const year       = startYear + Math.floor((startMonth - 1 + m) / 12)
    const monthLabel = new Date(year, month - 1).toLocaleString('en-BD', { month: 'long' })

    const items: ProcurementScheduleItem[] = requirements.map(req => {
      const pattern = distPattern[req.id] ?? buildDist(durationMonths, 'uniform')
      const ratio   = pattern[m] ?? 0
      const qty     = Math.ceil(req.quantity * ratio * 10) / 10

      return {
        materialId: req.id,
        material:   req.material,
        unit:       req.unit,
        quantity:   qty,
        unitRate:   req.unitRate,
        cost:       qty * req.unitRate,
      }
    }).filter(i => i.quantity > 0)

    schedules.push({
      month,
      year,
      label:     `Month ${m + 1} (${monthLabel} ${year})`,
      items,
      totalCost: items.reduce((s, i) => s + i.cost, 0),
    })
  }

  return schedules
}

// Distribution helpers
function buildDist(months: number, type: 'front' | 'uniform' | 'middle' | 'end'): number[] {
  if (months === 0) return []
  const arr = new Array(months).fill(0)

  switch (type) {
    case 'uniform':
      return arr.map(() => 1 / months)
    case 'front': {
      // 60% in first 40%, rest uniform
      const frontMonths = Math.max(1, Math.ceil(months * 0.4))
      const frontRatio  = 0.6 / frontMonths
      const restRatio   = 0.4 / Math.max(1, months - frontMonths)
      return arr.map((_, i) => i < frontMonths ? frontRatio : restRatio)
    }
    case 'middle': {
      const start = Math.floor(months * 0.25)
      const end   = Math.ceil(months * 0.75)
      const span  = end - start
      return arr.map((_, i) => (i >= start && i < end) ? 1 / span : 0)
    }
    case 'end': {
      const endMonths = Math.max(1, Math.ceil(months * 0.35))
      const start     = months - endMonths
      return arr.map((_, i) => i >= start ? 1 / endMonths : 0)
    }
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ProcurementStore {
  plans: Record<string, ProcurementPlan>

  getPlan:         (projectId: string) => ProcurementPlan | null
  autoGenerate:    (projectId: string, summary: TakeoffSummary, months: number) => void
  updateItem:      (projectId: string, itemId: string, data: Partial<ProcurementItem>) => void
  deleteItem:      (projectId: string, itemId: string) => void
  clearPlan:       (projectId: string) => void
}

export const useProcurementStore = create<ProcurementStore>()(
  persist(
    (set, get) => ({
      plans: {},

      getPlan: (projectId) => get().plans[projectId] ?? null,

      autoGenerate: (projectId, summary, months) => {
        const requirements = calcMaterialRequirements(summary)
        const schedule     = buildMonthlySchedule(requirements, months)

        const items: ProcurementItem[] = requirements.map(req => ({
          id:           req.id,
          material:     req.material,
          materialBn:   req.materialBn,
          unit:         req.unit,
          totalQty:     req.quantity,
          orderedQty:   0,
          deliveredQty: 0,
          unitRate:     req.unitRate,
          totalCost:    req.quantity * req.unitRate,
          status:       'planned' as const,
          scheduledDate: new Date().toISOString(),
        }))

        const plan: ProcurementPlan = {
          projectId,
          items,
          schedule,
          totalCost:      items.reduce((s, i) => s + i.totalCost, 0),
          generatedAt:    new Date().toISOString(),
          durationMonths: months,
        }

        set(s => ({ plans: { ...s.plans, [projectId]: plan } }))
      },

      updateItem: (projectId, itemId, data) =>
        set(s => {
          const plan = s.plans[projectId]
          if (!plan) return s
          const items = plan.items.map(i =>
            i.id === itemId
              ? { ...i, ...data, totalCost: (data.totalQty ?? i.totalQty) * (data.unitRate ?? i.unitRate) }
              : i
          )
          return {
            plans: {
              ...s.plans,
              [projectId]: { ...plan, items, totalCost: items.reduce((s, i) => s + i.totalCost, 0) },
            },
          }
        }),

      deleteItem: (projectId, itemId) =>
        set(s => {
          const plan = s.plans[projectId]
          if (!plan) return s
          const items = plan.items.filter(i => i.id !== itemId)
          return { plans: { ...s.plans, [projectId]: { ...plan, items, totalCost: items.reduce((s, i) => s + i.totalCost, 0) } } }
        }),

      clearPlan: (projectId) =>
        set(s => { const n = { ...s.plans }; delete n[projectId]; return { plans: n } }),
    }),
    { name: 'civilos-procurement' }
  )
)
