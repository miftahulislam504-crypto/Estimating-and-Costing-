import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, CostSettings, AppView } from '@/types'

const DEFAULT_COST_SETTINGS: CostSettings = {
  currency:        'BDT',
  unit:            'metric',
  markupPercent:   10,
  overheadPercent: 12,
  profitPercent:   8,
  vatPercent:      15,
  taxPercent:      0,
  contingencyPct:  5,
}

interface ProjectStore {
  // State
  projects:        Project[]
  activeProjectId: string | null
  currentView:     AppView
  sidebarOpen:     boolean

  // Computed
  activeProject: () => Project | null

  // Actions
  setView:          (view: AppView) => void
  toggleSidebar:    () => void
  createProject:    (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project
  updateProject:    (id: string, data: Partial<Project>) => void
  deleteProject:    (id: string) => void
  archiveProject:   (id: string) => void
  setActiveProject: (id: string) => void
  updateCostSettings: (id: string, settings: Partial<CostSettings>) => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects:        [],
      activeProjectId: null,
      currentView:     'dashboard',
      sidebarOpen:     true,

      activeProject: () => {
        const { projects, activeProjectId } = get()
        return projects.find(p => p.id === activeProjectId) ?? null
      },

      setView: (view) => set({ currentView: view }),

      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

      createProject: (data) => {
        const now = new Date().toISOString()
        const project: Project = {
          ...data,
          id:        crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          costSettings: data.costSettings ?? DEFAULT_COST_SETTINGS,
        }
        set(s => ({ projects: [project, ...s.projects], activeProjectId: project.id }))
        return project
      },

      updateProject: (id, data) =>
        set(s => ({
          projects: s.projects.map(p =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        })),

      deleteProject: (id) =>
        set(s => ({
          projects:        s.projects.filter(p => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
        })),

      archiveProject: (id) =>
        set(s => ({
          projects: s.projects.map(p =>
            p.id === id ? { ...p, status: 'archived', updatedAt: new Date().toISOString() } : p
          ),
        })),

      setActiveProject: (id) => set({ activeProjectId: id }),

      updateCostSettings: (id, settings) =>
        set(s => ({
          projects: s.projects.map(p =>
            p.id === id
              ? { ...p, costSettings: { ...p.costSettings, ...settings }, updatedAt: new Date().toISOString() }
              : p
          ),
        })),
    }),
    {
      name: 'civilos-projects',
    }
  )
)
