import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { VERegister, ValueEngineeringItem, VEStatus, TakeoffSummary } from '@/types'

// ─── Auto suggestion engine ───────────────────────────────────────────────────

export function generateVESuggestions(
  summary: TakeoffSummary,
  grandTotal: number
): Omit<ValueEngineeringItem, 'id' | 'proposedBy' | 'proposedDate'>[] {
  const suggestions: Omit<ValueEngineeringItem, 'id' | 'proposedBy' | 'proposedDate'>[] = []

  // 1. Column size optimization
  if (summary.totalConcreteVol > 0) {
    const colVol = summary.elements
      .filter(e => e.elementType === 'column')
      .reduce((s, e) => s + e.concreteVolume, 0)

    if (colVol > 5) {
      const saving = colVol * 0.1 * 12000  // 10% reduction × RCC rate
      suggestions.push({
        category:        'structural',
        status:          'proposed',
        title:           'Column Size Optimization',
        titleBn:         'কলামের আকার হ্রাস',
        description:     'Structural analysis shows columns may be oversized. Re-analysis with optimized sections can reduce concrete and steel.',
        originalMethod:  'Current column sections as designed',
        proposedMethod:  '10% reduction in column cross-section after detailed structural review',
        originalCost:    colVol * 12000,
        proposedCost:    colVol * 0.9 * 12000,
        potentialSaving: Math.round(saving),
        savingPercent:   10,
        riskLevel:       'medium',
        implementationTime: '1-2 weeks (design review)',
      })
    }
  }

  // 2. Alternative brick type
  if (summary.totalBrickQty > 1000) {
    const brickCost    = summary.totalBrickQty * 14
    const blockCost    = (summary.totalBrickQty / 3) * 35  // blocks cover 3× area per unit
    const saving       = brickCost - blockCost
    if (saving > 0) {
      suggestions.push({
        category:        'material',
        status:          'proposed',
        title:           'Hollow Block Instead of Brick',
        titleBn:         'ইটের পরিবর্তে ফাঁপা ব্লক',
        description:     'Using hollow concrete blocks for non-structural partition walls reduces material cost and construction time.',
        originalMethod:  `${summary.totalBrickQty.toLocaleString()} 1st class bricks`,
        proposedMethod:  'Hollow concrete blocks for partitions (non-structural walls only)',
        originalCost:    brickCost,
        proposedCost:    blockCost,
        potentialSaving: Math.round(saving),
        savingPercent:   Math.round((saving / brickCost) * 100),
        riskLevel:       'low',
        implementationTime: '1 week (procurement change)',
      })
    }
  }

  // 3. Ready Mix Concrete
  if (summary.totalConcreteVol > 50) {
    const siteRCCRate  = 12000   // manual mixing
    const rmcRate      = 10500   // ready mix (bulk discount)
    const saving       = summary.totalConcreteVol * (siteRCCRate - rmcRate)
    suggestions.push({
      category:        'method',
      status:          'proposed',
      title:           'Ready Mix Concrete (RMC)',
      titleBn:         'রেডি মিক্স কংক্রিট ব্যবহার',
      description:     'Switching from site-mixed to Ready Mix Concrete improves quality control and reduces labor cost for large concrete volumes.',
      originalMethod:  `Site-mixed concrete: ${summary.totalConcreteVol.toFixed(1)} m³`,
      proposedMethod:  'Ready Mix Concrete supply from certified plant',
      originalCost:    summary.totalConcreteVol * siteRCCRate,
      proposedCost:    summary.totalConcreteVol * rmcRate,
      potentialSaving: Math.round(saving),
      savingPercent:   Math.round(((siteRCCRate - rmcRate) / siteRCCRate) * 100),
      riskLevel:       'low',
      implementationTime: '3-5 days (vendor sourcing)',
    })
  }

  // 4. Flat slab instead of beam-slab
  if (summary.totalConcreteVol > 100) {
    const beamVol = summary.elements
      .filter(e => e.elementType === 'beam')
      .reduce((s, e) => s + e.concreteVolume, 0)
    if (beamVol > 20) {
      const saving = beamVol * 0.15 * 12000
      suggestions.push({
        category:        'structural',
        status:          'proposed',
        title:           'Flat Slab System',
        titleBn:         'ফ্ল্যাট স্ল্যাব সিস্টেম',
        description:     'For regular bay layouts, flat slab eliminates beams reducing formwork complexity and story height.',
        originalMethod:  'Conventional beam-slab framing system',
        proposedMethod:  'Post-tensioned flat slab with column capitals',
        originalCost:    beamVol * 12000,
        proposedCost:    beamVol * 0.85 * 12000,
        potentialSaving: Math.round(saving),
        savingPercent:   15,
        riskLevel:       'high',
        implementationTime: '2-3 weeks (full redesign)',
      })
    }
  }

  // 5. Bulk procurement
  if (grandTotal > 500000) {
    const saving = grandTotal * 0.03
    suggestions.push({
      category:        'procurement',
      status:          'proposed',
      title:           'Bulk Material Procurement',
      titleBn:         'পাইকারি উপকরণ ক্রয়',
      description:     'Negotiating bulk purchase agreements for cement, steel and bricks can achieve 3-5% discount from suppliers.',
      originalMethod:  'Item-by-item purchase as needed',
      proposedMethod:  'Bulk purchase agreements with 2-3 key suppliers',
      originalCost:    grandTotal * 0.45,
      proposedCost:    grandTotal * 0.45 * 0.97,
      potentialSaving: Math.round(saving),
      savingPercent:   3,
      riskLevel:       'low',
      implementationTime: '1 week (negotiation)',
    })
  }

  // 6. Prefab staircase
  suggestions.push({
    category:        'method',
    status:          'proposed',
    title:           'Precast Staircase',
    titleBn:         'প্রিকাস্ট সিঁড়ি',
    description:     'Precast staircase elements reduce in-situ formwork and casting time significantly.',
    originalMethod:  'In-situ cast staircase with formwork',
    proposedMethod:  'Factory-made precast staircase units',
    originalCost:    150000,
    proposedCost:    110000,
    potentialSaving: 40000,
    savingPercent:   27,
    riskLevel:       'low',
    implementationTime: '3-5 days (crane required)',
  })

  return suggestions
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface VEStore {
  registers: Record<string, VERegister>

  getRegister:        (projectId: string) => VERegister | null
  generateSuggestions:(projectId: string, summary: TakeoffSummary, grandTotal: number, engineer: string) => void
  addItem:            (projectId: string, item: ValueEngineeringItem) => void
  updateItem:         (projectId: string, item: ValueEngineeringItem) => void
  updateStatus:       (projectId: string, itemId: string, status: VEStatus) => void
  deleteItem:         (projectId: string, itemId: string) => void
  clearRegister:      (projectId: string) => void
}

function recalc(reg: VERegister): VERegister {
  const total    = reg.items.reduce((s, i) => s + i.potentialSaving, 0)
  const accepted = reg.items
    .filter(i => i.status === 'accepted')
    .reduce((s, i) => s + i.potentialSaving, 0)
  return { ...reg, totalPotentialSaving: total, totalAcceptedSaving: accepted, updatedAt: new Date().toISOString() }
}

export const useVEStore = create<VEStore>()(
  persist(
    (set, get) => ({
      registers: {},

      getRegister: (projectId) => get().registers[projectId] ?? null,

      generateSuggestions: (projectId, summary, grandTotal, engineer) => {
        const suggestions = generateVESuggestions(summary, grandTotal)
        const now = new Date().toISOString()
        const items: ValueEngineeringItem[] = suggestions.map(s => ({
          ...s,
          id:           crypto.randomUUID(),
          proposedBy:   engineer,
          proposedDate: now,
        }))
        const reg: VERegister = {
          projectId,
          items,
          totalPotentialSaving: items.reduce((s, i) => s + i.potentialSaving, 0),
          totalAcceptedSaving:  0,
          updatedAt: now,
        }
        set(s => ({ registers: { ...s.registers, [projectId]: reg } }))
      },

      addItem: (projectId, item) =>
        set(s => {
          const reg = s.registers[projectId] ?? {
            projectId, items: [], totalPotentialSaving: 0, totalAcceptedSaving: 0,
            updatedAt: new Date().toISOString(),
          }
          return { registers: { ...s.registers, [projectId]: recalc({ ...reg, items: [...reg.items, item] }) } }
        }),

      updateItem: (projectId, item) =>
        set(s => {
          const reg = s.registers[projectId]
          if (!reg) return s
          return { registers: { ...s.registers, [projectId]: recalc({ ...reg, items: reg.items.map(i => i.id === item.id ? item : i) }) } }
        }),

      updateStatus: (projectId, itemId, status) =>
        set(s => {
          const reg = s.registers[projectId]
          if (!reg) return s
          return { registers: { ...s.registers, [projectId]: recalc({ ...reg, items: reg.items.map(i => i.id === itemId ? { ...i, status } : i) }) } }
        }),

      deleteItem: (projectId, itemId) =>
        set(s => {
          const reg = s.registers[projectId]
          if (!reg) return s
          return { registers: { ...s.registers, [projectId]: recalc({ ...reg, items: reg.items.filter(i => i.id !== itemId) }) } }
        }),

      clearRegister: (projectId) =>
        set(s => { const n = { ...s.registers }; delete n[projectId]; return { registers: n } }),
    }),
    { name: 'civilos-ve' }
  )
)
