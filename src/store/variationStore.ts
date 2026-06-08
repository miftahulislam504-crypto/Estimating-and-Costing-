import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { VariationRegister, VariationItem, VariationStatus } from '@/types'

interface VariationStore {
  registers: Record<string, VariationRegister>

  getRegister:   (projectId: string, originalCost?: number) => VariationRegister
  addItem:       (projectId: string, item: VariationItem) => void
  updateItem:    (projectId: string, item: VariationItem) => void
  updateStatus:  (projectId: string, itemId: string, status: VariationStatus, approvedBy?: string) => void
  deleteItem:    (projectId: string, itemId: string) => void
  setOriginalCost:(projectId: string, cost: number) => void
  clearRegister: (projectId: string) => void
}

function recalc(reg: VariationRegister): VariationRegister {
  const approvedItems = reg.items.filter(i => i.status === 'approved' || i.status === 'implemented')
  const netVariation  = approvedItems.reduce((s, i) => s + i.amount, 0)
  return {
    ...reg,
    netVariation,
    revisedCost: reg.originalCost + netVariation,
    updatedAt:   new Date().toISOString(),
  }
}

export const useVariationStore = create<VariationStore>()(
  persist(
    (set, get) => ({
      registers: {},

      getRegister: (projectId, originalCost = 0) => {
        const existing = get().registers[projectId]
        if (existing) return existing
        const reg: VariationRegister = {
          projectId,
          items:         [],
          originalCost,
          netVariation:  0,
          revisedCost:   originalCost,
          updatedAt:     new Date().toISOString(),
        }
        set(s => ({ registers: { ...s.registers, [projectId]: reg } }))
        return reg
      },

      addItem: (projectId, item) =>
        set(s => {
          const reg = s.registers[projectId] ?? {
            projectId, items: [], originalCost: 0, netVariation: 0, revisedCost: 0,
            updatedAt: new Date().toISOString(),
          }
          return {
            registers: {
              ...s.registers,
              [projectId]: recalc({ ...reg, items: [...reg.items, item] }),
            },
          }
        }),

      updateItem: (projectId, item) =>
        set(s => {
          const reg = s.registers[projectId]
          if (!reg) return s
          return {
            registers: {
              ...s.registers,
              [projectId]: recalc({ ...reg, items: reg.items.map(i => i.id === item.id ? item : i) }),
            },
          }
        }),

      updateStatus: (projectId, itemId, status, approvedBy) =>
        set(s => {
          const reg = s.registers[projectId]
          if (!reg) return s
          const items = reg.items.map(i =>
            i.id === itemId
              ? {
                  ...i, status,
                  approvedBy:   approvedBy ?? i.approvedBy,
                  approvedDate: status === 'approved' ? new Date().toISOString() : i.approvedDate,
                }
              : i
          )
          return { registers: { ...s.registers, [projectId]: recalc({ ...reg, items }) } }
        }),

      deleteItem: (projectId, itemId) =>
        set(s => {
          const reg = s.registers[projectId]
          if (!reg) return s
          return {
            registers: {
              ...s.registers,
              [projectId]: recalc({ ...reg, items: reg.items.filter(i => i.id !== itemId) }),
            },
          }
        }),

      setOriginalCost: (projectId, cost) =>
        set(s => {
          const reg = s.registers[projectId]
          if (!reg) return s
          return { registers: { ...s.registers, [projectId]: recalc({ ...reg, originalCost: cost }) } }
        }),

      clearRegister: (projectId) =>
        set(s => { const n = { ...s.registers }; delete n[projectId]; return { registers: n } }),
    }),
    { name: 'civilos-variation' }
  )
)
