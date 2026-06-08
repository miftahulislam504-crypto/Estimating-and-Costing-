import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CashFlowPlan, CashFlowMonth, ProjectEstimation, CostSettings } from '@/types'

// ─── S-Curve distribution helper ─────────────────────────────────────────────
// Typical construction cash flow follows an S-curve:
// slow start → rapid middle → slow finish

function sCurveWeights(n: number): number[] {
  // Uses a sigmoid-based distribution
  const weights: number[] = []
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 6 - 3   // -3 to +3
    const s = 1 / (1 + Math.exp(-x))
    weights.push(s)
  }
  // Convert cumulative to incremental
  const incremental: number[] = [weights[0]]
  for (let i = 1; i < n; i++) {
    incremental.push(weights[i] - weights[i - 1])
  }
  // Normalize so sum = 1
  const total = incremental.reduce((a, b) => a + b, 0)
  return incremental.map(w => w / total)
}

// ─── Auto-generate cash flow from estimation ─────────────────────────────────

export function buildCashFlow(
  projectId:      string,
  estimation:     ProjectEstimation,
  settings:       CostSettings,
  durationMonths: number,
  startYear:      number = new Date().getFullYear(),
  startMonth:     number = new Date().getMonth() + 1,
  advancePct:     number = 10,    // % of contract as advance
  retentionPct:   number = 5,     // % withheld each bill
  billingCycle:   number = 1      // months between bills
): CashFlowPlan {

  const grandTotal    = estimation.grandTotal
  const weights       = sCurveWeights(durationMonths)

  // Cost breakdown ratios (from estimation settings)
  const materialRatio   = 0.45
  const laborRatio      = 0.25
  const equipmentRatio  = 0.10
  const overheadRatio   = settings.overheadPercent / 100
  const subcontractRatio = 0.05

  const months: CashFlowMonth[] = []
  let runningBalance = 0
  let totalCashIn    = 0
  let totalCashOut   = 0

  // Advance payment in month 0 (first month)
  const advanceAmount = grandTotal * (advancePct / 100)

  for (let m = 0; m < durationMonths; m++) {
    const calMonth = ((startMonth - 1 + m) % 12) + 1
    const calYear  = startYear + Math.floor((startMonth - 1 + m) / 12)
    const monthLabel = new Date(calYear, calMonth - 1)
      .toLocaleString('en-BD', { month: 'short', year: '2-digit' })

    const workDoneThisMonth = grandTotal * weights[m]
    const cashOutThisMonth  = workDoneThisMonth

    // Material / Labor / Equipment / Overhead breakdown
    const materialCost    = cashOutThisMonth * materialRatio
    const laborCost       = cashOutThisMonth * laborRatio
    const equipmentCost   = cashOutThisMonth * equipmentRatio
    const overheadCost    = cashOutThisMonth * overheadRatio
    const subcontractCost = cashOutThisMonth * subcontractRatio

    // Cash In: billing on cycle, with retention withheld
    let contractReceipt  = 0
    let advanceReceipt   = 0
    let retentionRelease = 0

    if (m === 0) {
      advanceReceipt = advanceAmount
    }

    // Billing every `billingCycle` months
    if (m > 0 && m % billingCycle === 0) {
      // Bill for last billingCycle months of work
      const billedWork = grandTotal * weights
        .slice(Math.max(0, m - billingCycle), m)
        .reduce((a, b) => a + b, 0)
      contractReceipt = billedWork * (1 - retentionPct / 100)
    }

    // Release retention in last month
    if (m === durationMonths - 1) {
      const totalRetentionHeld = grandTotal * (retentionPct / 100)
      retentionRelease = totalRetentionHeld
    }

    const cashIn  = contractReceipt + advanceReceipt + retentionRelease
    const cashOut = cashOutThisMonth
    const netFlow = cashIn - cashOut
    runningBalance += netFlow

    totalCashIn  += cashIn
    totalCashOut += cashOut

    months.push({
      month: calMonth,
      year:  calYear,
      label: `M${m + 1} (${monthLabel})`,
      cashIn,
      cashOut,
      netFlow,
      runningBalance,
      contractReceipt,
      advanceReceipt,
      retentionRelease,
      materialCost,
      laborCost,
      equipmentCost,
      overheadCost,
      subcontractCost,
    })
  }

  const peakNegative = Math.min(...months.map(m => m.runningBalance))

  return {
    projectId,
    months,
    totalCashIn,
    totalCashOut,
    netProfit:      totalCashIn - totalCashOut,
    peakNegative,
    durationMonths,
    generatedAt:    new Date().toISOString(),
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface CashFlowStore {
  plans: Record<string, CashFlowPlan>

  getPlan:      (projectId: string) => CashFlowPlan | null
  setPlan:      (plan: CashFlowPlan) => void
  clearPlan:    (projectId: string) => void
  updateMonth:  (projectId: string, idx: number, data: Partial<CashFlowMonth>) => void
}

export const useCashFlowStore = create<CashFlowStore>()(
  persist(
    (set, get) => ({
      plans: {},

      getPlan:  (projectId) => get().plans[projectId] ?? null,

      setPlan:  (plan) =>
        set(s => ({ plans: { ...s.plans, [plan.projectId]: plan } })),

      clearPlan: (projectId) =>
        set(s => { const n = { ...s.plans }; delete n[projectId]; return { plans: n } }),

      updateMonth: (projectId, idx, data) =>
        set(s => {
          const plan = s.plans[projectId]
          if (!plan) return s
          const months = plan.months.map((m, i) => i === idx ? { ...m, ...data } : m)
          // Recompute running balance
          let rb = 0
          const recalculated = months.map(m => {
            m.netFlow       = m.cashIn - m.cashOut
            rb             += m.netFlow
            m.runningBalance = rb
            return m
          })
          return {
            plans: {
              ...s.plans,
              [projectId]: {
                ...plan,
                months: recalculated,
                totalCashIn:  recalculated.reduce((s, m) => s + m.cashIn, 0),
                totalCashOut: recalculated.reduce((s, m) => s + m.cashOut, 0),
                peakNegative: Math.min(...recalculated.map(m => m.runningBalance)),
              },
            },
          }
        }),
    }),
    { name: 'civilos-cashflow' }
  )
)
