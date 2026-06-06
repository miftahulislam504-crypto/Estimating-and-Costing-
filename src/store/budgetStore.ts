import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ProjectBudget, BudgetLine, BudgetCategory, CostSettings
} from '@/types'
import type { ProjectEstimation } from '@/types'

// ─── Category definitions ─────────────────────────────────────────────────────

export const BUDGET_CATEGORIES: {
  id: BudgetCategory; label: string; labelBn: string; color: string; icon: string
}[] = [
  { id: 'structure',    label: 'Structure',      labelBn: 'কাঠামো',         color: 'text-blue-400',   icon: '🏗️' },
  { id: 'architecture', label: 'Architecture',   labelBn: 'স্থাপত্য',       color: 'text-green-400',  icon: '🏛️' },
  { id: 'mep',          label: 'MEP',            labelBn: 'এমইপি',          color: 'text-pink-400',   icon: '⚡' },
  { id: 'external',     label: 'External Works', labelBn: 'বাহ্যিক কাজ',    color: 'text-teal-400',   icon: '🌿' },
  { id: 'preliminaries',label: 'Preliminaries',  labelBn: 'প্রাথমিক',       color: 'text-amber-400',  icon: '📋' },
  { id: 'contingency',  label: 'Contingency',    labelBn: 'কন্টিনজেন্সি',   color: 'text-purple-400', icon: '🛡️' },
  { id: 'land',         label: 'Land & Site',    labelBn: 'জমি ও সাইট',    color: 'text-orange-400', icon: '🏞️' },
  { id: 'design_fee',   label: 'Design Fee',     labelBn: 'ডিজাইন ফি',     color: 'text-indigo-400', icon: '📐' },
  { id: 'supervision',  label: 'Supervision',    labelBn: 'তদারকি',         color: 'text-rose-400',   icon: '👷' },
]

// ─── Build budget from estimation ─────────────────────────────────────────────

export function buildBudgetFromEstimation(
  projectId:  string,
  estimation: ProjectEstimation,
  contingencyPct: number = 5
): ProjectBudget {
  const now = new Date().toISOString()

  // Group estimation line items by category
  const catTotals: Partial<Record<BudgetCategory, number>> = {}
  for (const item of estimation.lineItems) {
    const cat = item.category as BudgetCategory
    catTotals[cat] = (catTotals[cat] ?? 0) + item.amount
  }

  const grandTotal = estimation.grandTotal

  // Build budget lines from estimation categories
  const lines: BudgetLine[] = []

  for (const cat of BUDGET_CATEGORIES) {
    const raw = catTotals[cat.id] ?? 0
    if (raw === 0 && !['land', 'design_fee', 'supervision'].includes(cat.id)) continue

    // Apply project overhead/profit proportionally to get full allocated amount
    const ratio = grandTotal > 0 && estimation.directCost > 0
      ? grandTotal / estimation.directCost
      : 1
    const allocated = raw > 0 ? raw * ratio : 0

    if (allocated === 0) continue

    lines.push({
      id:          crypto.randomUUID(),
      category:    cat.id,
      description: `${cat.label} — ${cat.labelBn}`,
      allocated,
      actual:      0,
      variance:    allocated,
      percent:     grandTotal > 0 ? (allocated / grandTotal) * 100 : 0,
    })
  }

  // Add Design Fee (typically 2-3% of construction cost)
  if (!lines.find(l => l.category === 'design_fee')) {
    const designFee = grandTotal * 0.025
    lines.push({
      id:          crypto.randomUUID(),
      category:    'design_fee',
      description: 'Design Fee — Architect & Engineer',
      allocated:   designFee,
      actual:      0,
      variance:    designFee,
      percent:     2.5,
    })
  }

  // Add Supervision (2% of construction cost)
  if (!lines.find(l => l.category === 'supervision')) {
    const supervision = grandTotal * 0.02
    lines.push({
      id:          crypto.randomUUID(),
      category:    'supervision',
      description: 'Site Supervision — Resident Engineer',
      allocated:   supervision,
      actual:      0,
      variance:    supervision,
      percent:     2.0,
    })
  }

  const totalAllocated = lines.reduce((s, l) => s + l.allocated, 0)

  return {
    projectId,
    lines,
    totalAllocated,
    totalActual:   0,
    totalVariance: totalAllocated,
    contingencyPct,
    version: 1,
    createdAt: now,
    updatedAt: now,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface BudgetStore {
  budgets: Record<string, ProjectBudget>

  getBudget:      (projectId: string) => ProjectBudget | null
  setBudget:      (budget: ProjectBudget) => void
  updateLine:     (projectId: string, lineId: string, data: Partial<BudgetLine>) => void
  updateActual:   (projectId: string, lineId: string, actual: number) => void
  addLine:        (projectId: string, line: BudgetLine) => void
  deleteLine:     (projectId: string, lineId: string) => void
  clearBudget:    (projectId: string) => void
}

function recalcBudget(budget: ProjectBudget): ProjectBudget {
  const totalAllocated = budget.lines.reduce((s, l) => s + l.allocated, 0)
  const totalActual    = budget.lines.reduce((s, l) => s + l.actual, 0)
  const lines = budget.lines.map(l => ({
    ...l,
    variance: l.allocated - l.actual,
    percent:  totalAllocated > 0 ? (l.allocated / totalAllocated) * 100 : 0,
  }))
  return {
    ...budget,
    lines,
    totalAllocated,
    totalActual,
    totalVariance: totalAllocated - totalActual,
    updatedAt: new Date().toISOString(),
  }
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      budgets: {},

      getBudget: (projectId) => get().budgets[projectId] ?? null,

      setBudget: (budget) =>
        set(s => ({ budgets: { ...s.budgets, [budget.projectId]: recalcBudget(budget) } })),

      updateLine: (projectId, lineId, data) =>
        set(s => {
          const b = s.budgets[projectId]
          if (!b) return s
          const lines = b.lines.map(l => l.id === lineId ? { ...l, ...data } : l)
          return { budgets: { ...s.budgets, [projectId]: recalcBudget({ ...b, lines }) } }
        }),

      updateActual: (projectId, lineId, actual) =>
        set(s => {
          const b = s.budgets[projectId]
          if (!b) return s
          const lines = b.lines.map(l =>
            l.id === lineId ? { ...l, actual } : l
          )
          return { budgets: { ...s.budgets, [projectId]: recalcBudget({ ...b, lines }) } }
        }),

      addLine: (projectId, line) =>
        set(s => {
          const b = s.budgets[projectId]
          if (!b) return s
          return { budgets: { ...s.budgets, [projectId]: recalcBudget({ ...b, lines: [...b.lines, line] }) } }
        }),

      deleteLine: (projectId, lineId) =>
        set(s => {
          const b = s.budgets[projectId]
          if (!b) return s
          return { budgets: { ...s.budgets, [projectId]: recalcBudget({ ...b, lines: b.lines.filter(l => l.id !== lineId) }) } }
        }),

      clearBudget: (projectId) =>
        set(s => { const n = { ...s.budgets }; delete n[projectId]; return { budgets: n } }),
    }),
    { name: 'civilos-budget' }
  )
)
