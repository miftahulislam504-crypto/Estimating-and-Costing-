import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ProjectEstimation, EstimationLineItem,
  EstimationCategory, CostSettings
} from '@/types'
import type { BOQ } from '@/types'

// ─── Category metadata ────────────────────────────────────────────────────────

export const ESTIMATION_CATEGORIES: {
  id: EstimationCategory; label: string; labelBn: string; color: string
}[] = [
  { id: 'structure',     label: 'Structure',      labelBn: 'কাঠামো',          color: 'text-blue-400' },
  { id: 'architecture',  label: 'Architecture',   labelBn: 'স্থাপত্য',        color: 'text-green-400' },
  { id: 'mep',           label: 'MEP',            labelBn: 'এমইপি',           color: 'text-pink-400' },
  { id: 'external',      label: 'External Works', labelBn: 'বাহ্যিক কাজ',     color: 'text-teal-400' },
  { id: 'preliminaries', label: 'Preliminaries',  labelBn: 'প্রাথমিক খরচ',    color: 'text-amber-400' },
  { id: 'contingency',   label: 'Contingency',    labelBn: 'কন্টিনজেন্সি',    color: 'text-purple-400' },
]

// ─── BOQ → Estimation mapper ──────────────────────────────────────────────────

function boqCategoryToEstCategory(boqCat: string): EstimationCategory {
  switch (boqCat) {
    case 'concrete':
    case 'reinforcement':
    case 'earthwork':    return 'structure'
    case 'masonry':
    case 'finishing':    return 'architecture'
    case 'mep':          return 'mep'
    case 'external':     return 'external'
    default:             return 'structure'
  }
}

// ─── Build estimation from BOQ + cost settings ───────────────────────────────

export function buildEstimationFromBOQ(
  projectId:   string,
  boq:         BOQ,
  settings:    CostSettings,
  totalArea:   number,
  totalFloors: number,
  preparedBy:  string = 'Engineer'
): ProjectEstimation {

  // Group BOQ items into estimation categories
  const lineItems: EstimationLineItem[] = boq.items.map(item => ({
    id:          crypto.randomUUID(),
    category:    boqCategoryToEstCategory(item.category),
    description: item.description,
    unit:        item.unit,
    quantity:    item.quantity,
    unitRate:    item.rate,
    amount:      item.amount,
    source:      'boq' as const,
  }))

  const directCost = lineItems.reduce((s, i) => s + i.amount, 0)

  // Add MEP estimate if not in BOQ (typically 15-18% of structure cost)
  const structureCost = lineItems
    .filter(i => i.category === 'structure')
    .reduce((s, i) => s + i.amount, 0)

  const hasMEP = lineItems.some(i => i.category === 'mep')
  if (!hasMEP && structureCost > 0) {
    lineItems.push({
      id:          crypto.randomUUID(),
      category:    'mep',
      description: 'Electrical, Plumbing & Sanitation (Lump Sum)',
      unit:        'ls',
      quantity:    1,
      unitRate:    structureCost * 0.15,
      amount:      structureCost * 0.15,
      source:      'calculated',
    })
  }

  // Add Preliminaries (site setup, scaffolding, temp facilities ~3%)
  lineItems.push({
    id:          crypto.randomUUID(),
    category:    'preliminaries',
    description: 'Preliminaries (Site Setup, Scaffolding, Safety)',
    unit:        'ls',
    quantity:    1,
    unitRate:    directCost * 0.03,
    amount:      directCost * 0.03,
    source:      'calculated',
  })

  const subtotal1    = lineItems.reduce((s, i) => s + i.amount, 0)
  const overheadCost = subtotal1 * settings.overheadPercent / 100
  const profitCost   = (subtotal1 + overheadCost) * settings.profitPercent / 100
  const markupCost   = (subtotal1 + overheadCost + profitCost) * settings.markupPercent / 100
  const contingencyCost = subtotal1 * settings.contingencyPct / 100

  const preVAT   = subtotal1 + overheadCost + profitCost + markupCost + contingencyCost
  const vatAmount = preVAT * settings.vatPercent / 100
  const taxAmount = preVAT * settings.taxPercent / 100
  const grandTotal = preVAT + vatAmount + taxAmount

  const costPerSqm   = totalArea > 0 ? grandTotal / totalArea : 0
  const costPerSqft  = costPerSqm / 10.764
  const costPerFloor = totalFloors > 0 ? grandTotal / totalFloors : 0

  return {
    projectId,
    version:      1,
    lineItems,
    directCost:   subtotal1,
    overheadCost,
    profitCost,
    markupCost,
    contingencyCost,
    vatAmount,
    taxAmount,
    grandTotal,
    costPerSqm,
    costPerSqft,
    costPerFloor,
    preparedAt:   new Date().toISOString(),
    preparedBy,
    validityDays: 90,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface EstimationStore {
  estimations: Record<string, ProjectEstimation>

  getEstimation:    (projectId: string) => ProjectEstimation | null
  setEstimation:    (estimation: ProjectEstimation) => void
  addLineItem:      (projectId: string, item: EstimationLineItem) => void
  updateLineItem:   (projectId: string, item: EstimationLineItem) => void
  deleteLineItem:   (projectId: string, itemId: string) => void
  recalculate:      (projectId: string, settings: CostSettings, totalArea: number, totalFloors: number) => void
  clearEstimation:  (projectId: string) => void
}

function recalcTotals(
  items:    EstimationLineItem[],
  settings: CostSettings,
  area:     number,
  floors:   number
): Partial<ProjectEstimation> {
  const directCost    = items.reduce((s, i) => s + i.amount, 0)
  const overheadCost  = directCost * settings.overheadPercent / 100
  const profitCost    = (directCost + overheadCost) * settings.profitPercent / 100
  const markupCost    = (directCost + overheadCost + profitCost) * settings.markupPercent / 100
  const contingencyCost = directCost * settings.contingencyPct / 100
  const preVAT        = directCost + overheadCost + profitCost + markupCost + contingencyCost
  const vatAmount     = preVAT * settings.vatPercent / 100
  const taxAmount     = preVAT * settings.taxPercent / 100
  const grandTotal    = preVAT + vatAmount + taxAmount
  return {
    directCost, overheadCost, profitCost, markupCost,
    contingencyCost, vatAmount, taxAmount, grandTotal,
    costPerSqm:   area   > 0 ? grandTotal / area   : 0,
    costPerSqft:  area   > 0 ? grandTotal / area / 10.764 : 0,
    costPerFloor: floors > 0 ? grandTotal / floors : 0,
  }
}

export const useEstimationStore = create<EstimationStore>()(
  persist(
    (set, get) => ({
      estimations: {},

      getEstimation: (projectId) =>
        get().estimations[projectId] ?? null,

      setEstimation: (estimation) =>
        set(s => ({ estimations: { ...s.estimations, [estimation.projectId]: estimation } })),

      addLineItem: (projectId, item) =>
        set(s => {
          const est = s.estimations[projectId]
          if (!est) return s
          const lineItems = [...est.lineItems, { ...item, amount: item.quantity * item.unitRate }]
          return {
            estimations: {
              ...s.estimations,
              [projectId]: { ...est, lineItems },
            },
          }
        }),

      updateLineItem: (projectId, item) =>
        set(s => {
          const est = s.estimations[projectId]
          if (!est) return s
          const lineItems = est.lineItems.map(i =>
            i.id === item.id ? { ...item, amount: item.quantity * item.unitRate } : i
          )
          return { estimations: { ...s.estimations, [projectId]: { ...est, lineItems } } }
        }),

      deleteLineItem: (projectId, itemId) =>
        set(s => {
          const est = s.estimations[projectId]
          if (!est) return s
          const lineItems = est.lineItems.filter(i => i.id !== itemId)
          return { estimations: { ...s.estimations, [projectId]: { ...est, lineItems } } }
        }),

      recalculate: (projectId, settings, totalArea, totalFloors) =>
        set(s => {
          const est = s.estimations[projectId]
          if (!est) return s
          const totals = recalcTotals(est.lineItems, settings, totalArea, totalFloors)
          return {
            estimations: {
              ...s.estimations,
              [projectId]: { ...est, ...totals },
            },
          }
        }),

      clearEstimation: (projectId) =>
        set(s => {
          const n = { ...s.estimations }
          delete n[projectId]
          return { estimations: n }
        }),
    }),
    { name: 'civilos-estimation' }
  )
)
