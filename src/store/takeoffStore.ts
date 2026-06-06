import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StructuralElement, TakeoffSummary, ElementQuantity } from '@/types'
import { computeQuantities, buildSummary } from '@/modules/takeoff/QuantityEngine'

interface TakeoffStore {
  // State: projectId → elements
  elementsByProject: Record<string, StructuralElement[]>
  summaryByProject:  Record<string, TakeoffSummary>

  // Actions
  getElements:    (projectId: string) => StructuralElement[]
  getSummary:     (projectId: string) => TakeoffSummary | null
  addElement:     (projectId: string, el: StructuralElement) => void
  updateElement:  (projectId: string, el: StructuralElement) => void
  deleteElement:  (projectId: string, elementId: string) => void
  recompute:      (projectId: string) => void
  importElements: (projectId: string, elements: StructuralElement[]) => void
  clearProject:   (projectId: string) => void
}

export const useTakeoffStore = create<TakeoffStore>()(
  persist(
    (set, get) => ({
      elementsByProject: {},
      summaryByProject:  {},

      getElements: (projectId) =>
        get().elementsByProject[projectId] ?? [],

      getSummary: (projectId) =>
        get().summaryByProject[projectId] ?? null,

      addElement: (projectId, el) => {
        set(s => ({
          elementsByProject: {
            ...s.elementsByProject,
            [projectId]: [...(s.elementsByProject[projectId] ?? []), el],
          },
        }))
        get().recompute(projectId)
      },

      updateElement: (projectId, el) => {
        set(s => ({
          elementsByProject: {
            ...s.elementsByProject,
            [projectId]: (s.elementsByProject[projectId] ?? []).map(e =>
              e.id === el.id ? el : e
            ),
          },
        }))
        get().recompute(projectId)
      },

      deleteElement: (projectId, elementId) => {
        set(s => ({
          elementsByProject: {
            ...s.elementsByProject,
            [projectId]: (s.elementsByProject[projectId] ?? []).filter(e => e.id !== elementId),
          },
        }))
        get().recompute(projectId)
      },

      recompute: (projectId) => {
        const elements = get().elementsByProject[projectId] ?? []
        const quantities: ElementQuantity[] = elements.map(computeQuantities)
        const summary = buildSummary(projectId, elements, quantities)
        set(s => ({
          summaryByProject: { ...s.summaryByProject, [projectId]: summary },
        }))
      },

      importElements: (projectId, elements) => {
        set(s => ({
          elementsByProject: { ...s.elementsByProject, [projectId]: elements },
        }))
        get().recompute(projectId)
      },

      clearProject: (projectId) => {
        set(s => {
          const eb = { ...s.elementsByProject }
          const sb = { ...s.summaryByProject }
          delete eb[projectId]
          delete sb[projectId]
          return { elementsByProject: eb, summaryByProject: sb }
        })
      },
    }),
    { name: 'civilos-takeoff' }
  )
)
