import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RateAnalysisItem, RateComponent } from '@/types'
import { RATE_TEMPLATES } from '@/modules/rate-analysis/CostDatabase'

interface RateAnalysisStore {
  // projectId → items
  itemsByProject: Record<string, RateAnalysisItem[]>

  // Actions
  getItems:       (projectId: string) => RateAnalysisItem[]
  addItem:        (projectId: string, item: RateAnalysisItem) => void
  updateItem:     (projectId: string, item: RateAnalysisItem) => void
  deleteItem:     (projectId: string, itemId: string) => void
  loadTemplates:  (projectId: string) => void
  updateComponent:(projectId: string, itemId: string, comp: RateComponent) => void
  clearProject:   (projectId: string) => void
}

function calcTotal(components: RateComponent[]): number {
  return components.reduce((sum, c) => sum + c.quantity * c.unitRate, 0)
}

export const useRateAnalysisStore = create<RateAnalysisStore>()(
  persist(
    (set, get) => ({
      itemsByProject: {},

      getItems: (projectId) =>
        get().itemsByProject[projectId] ?? [],

      addItem: (projectId, item) =>
        set(s => ({
          itemsByProject: {
            ...s.itemsByProject,
            [projectId]: [...(s.itemsByProject[projectId] ?? []), item],
          },
        })),

      updateItem: (projectId, item) =>
        set(s => ({
          itemsByProject: {
            ...s.itemsByProject,
            [projectId]: (s.itemsByProject[projectId] ?? []).map(i =>
              i.id === item.id ? item : i
            ),
          },
        })),

      deleteItem: (projectId, itemId) =>
        set(s => ({
          itemsByProject: {
            ...s.itemsByProject,
            [projectId]: (s.itemsByProject[projectId] ?? []).filter(i => i.id !== itemId),
          },
        })),

      // Load all standard templates into a project
      loadTemplates: (projectId) => {
        const existing = get().itemsByProject[projectId] ?? []
        const existingCodes = new Set(existing.map(i => i.code))

        const newItems: RateAnalysisItem[] = RATE_TEMPLATES
          .filter(t => !existingCodes.has(t.code))
          .map(t => {
            const components: RateComponent[] = t.components.map(c => ({
              id:          crypto.randomUUID(),
              category:    c.category,
              description: c.description,
              unit:        c.unit,
              quantity:    c.quantity,
              unitRate:    c.baseRate,
              amount:      c.quantity * c.baseRate,
            }))
            const totalRate = calcTotal(components)
            return {
              id:         crypto.randomUUID(),
              code:       t.code,
              workItem:   t.workItem,
              unit:       t.unit,
              components,
              totalRate,
              isTemplate: true,
            }
          })

        set(s => ({
          itemsByProject: {
            ...s.itemsByProject,
            [projectId]: [...existing, ...newItems],
          },
        }))
      },

      updateComponent: (projectId, itemId, comp) =>
        set(s => ({
          itemsByProject: {
            ...s.itemsByProject,
            [projectId]: (s.itemsByProject[projectId] ?? []).map(item => {
              if (item.id !== itemId) return item
              const components = item.components.map(c =>
                c.id === comp.id
                  ? { ...comp, amount: comp.quantity * comp.unitRate }
                  : c
              )
              return { ...item, components, totalRate: calcTotal(components) }
            }),
          },
        })),

      clearProject: (projectId) =>
        set(s => {
          const n = { ...s.itemsByProject }
          delete n[projectId]
          return { itemsByProject: n }
        }),
    }),
    { name: 'civilos-rate-analysis' }
  )
)
