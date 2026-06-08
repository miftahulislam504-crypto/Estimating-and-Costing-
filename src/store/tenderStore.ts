import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TenderPackage, TenderItem, TenderType, BOQ } from '@/types'

// ─── Build tender from BOQ ────────────────────────────────────────────────────

export function buildTenderFromBOQ(
  projectId:   string,
  boq:         BOQ,
  projectName: string,
  location:    string,
  owner:       string,
  consultant:  string,
  tenderType:  TenderType,
  contingencyPct: number = 5,
  preparedBy:  string = 'Engineer'
): TenderPackage {

  // Apply rate factor based on tender type
  const rateFactor: Record<TenderType, number> = {
    engineer:   1.00,   // base estimate
    owner:      1.05,   // 5% higher for owner
    contractor: 1.12,   // 12% higher for contractor bid
  }
  const factor = rateFactor[tenderType]

  const items: TenderItem[] = boq.items.map(item => ({
    id:          item.id,
    itemNo:      item.itemNo,
    description: item.description,
    unit:        item.unit,
    quantity:    item.quantity,
    unitRate:    Math.round(item.rate * factor),
    amount:      Math.round(item.amount * factor),
    category:    item.category,
  }))

  const directCost  = items.reduce((s, i) => s + i.amount, 0)
  const contingency = directCost * contingencyPct / 100
  const grandTotal  = directCost + contingency

  const tenderNo = `TDR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

  return {
    projectId,
    tenderNo,
    tenderType,
    projectName,
    location,
    owner,
    consultant,
    items,
    directCost,
    contingency,
    grandTotal,
    preparedBy,
    preparedDate:  new Date().toISOString(),
    validityDays:  90,
    notes:         '',
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface TenderStore {
  // projectId → type → package
  packages: Record<string, Record<TenderType, TenderPackage>>

  getPackage:    (projectId: string, type: TenderType) => TenderPackage | null
  setPackage:    (pkg: TenderPackage) => void
  updateItem:    (projectId: string, type: TenderType, itemId: string, rate: number) => void
  updateMeta:    (projectId: string, type: TenderType, meta: Partial<TenderPackage>) => void
  clearPackages: (projectId: string) => void
}

function recalcPackage(pkg: TenderPackage): TenderPackage {
  const items      = pkg.items.map(i => ({ ...i, amount: i.quantity * i.unitRate }))
  const directCost = items.reduce((s, i) => s + i.amount, 0)
  const contingency = directCost * 0.05
  return { ...pkg, items, directCost, contingency, grandTotal: directCost + contingency }
}

export const useTenderStore = create<TenderStore>()(
  persist(
    (set, get) => ({
      packages: {},

      getPackage: (projectId, type) =>
        get().packages[projectId]?.[type] ?? null,

      setPackage: (pkg) =>
        set(s => ({
          packages: {
            ...s.packages,
            [pkg.projectId]: {
              ...(s.packages[pkg.projectId] ?? {}),
              [pkg.tenderType]: pkg,
            },
          },
        })),

      updateItem: (projectId, type, itemId, rate) =>
        set(s => {
          const pkg = s.packages[projectId]?.[type]
          if (!pkg) return s
          const items = pkg.items.map(i =>
            i.id === itemId ? { ...i, unitRate: rate, amount: i.quantity * rate } : i
          )
          const directCost  = items.reduce((sum, i) => sum + i.amount, 0)
          const contingency = directCost * 0.05
          return {
            packages: {
              ...s.packages,
              [projectId]: {
                ...s.packages[projectId],
                [type]: { ...pkg, items, directCost, contingency, grandTotal: directCost + contingency },
              },
            },
          }
        }),

      updateMeta: (projectId, type, meta) =>
        set(s => {
          const pkg = s.packages[projectId]?.[type]
          if (!pkg) return s
          return {
            packages: {
              ...s.packages,
              [projectId]: {
                ...s.packages[projectId],
                [type]: { ...pkg, ...meta },
              },
            },
          }
        }),

      clearPackages: (projectId) =>
        set(s => { const n = { ...s.packages }; delete n[projectId]; return { packages: n } }),
    }),
    { name: 'civilos-tender' }
  )
)
