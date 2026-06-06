import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CostDBEntry, CostDBSnapshot, Region } from '@/types'
import {
  MATERIAL_RATES, LABOR_RATES, EQUIPMENT_RATES
} from '@/modules/rate-analysis/CostDatabase'

// ─── Convert static DB → CostDBEntry ─────────────────────────────────────────

function buildDefaultEntries(region: Region): CostDBEntry[] {
  const now = new Date().toISOString()

  const materials: CostDBEntry[] = MATERIAL_RATES
    .filter(m => m.region === region || m.region === 'dhaka')
    .filter((m, i, arr) =>
      arr.findIndex(x => x.category === m.category && x.region === m.region) === i ||
      m.region === region
    )
    .map(m => ({
      id:        m.id,
      type:      'material' as const,
      name:      m.name,
      nameBn:    m.nameBn,
      unit:      m.unit,
      baseRate:  m.rate,
      region:    m.region,
      category:  m.category,
      updatedAt: now,
    }))

  const labors: CostDBEntry[] = LABOR_RATES
    .filter(l => l.region === region || l.region === 'dhaka')
    .map(l => ({
      id:        l.id,
      type:      'labor' as const,
      name:      l.role,
      nameBn:    l.roleBn,
      unit:      l.unit,
      baseRate:  l.rate,
      region:    l.region,
      category:  'labor',
      updatedAt: now,
    }))

  const equipment: CostDBEntry[] = EQUIPMENT_RATES
    .filter(e => e.region === region || e.region === 'dhaka')
    .map(e => ({
      id:        e.id,
      type:      'equipment' as const,
      name:      e.name,
      nameBn:    e.nameBn,
      unit:      e.unit,
      baseRate:  e.rate,
      region:    e.region,
      category:  'equipment',
      updatedAt: now,
    }))

  return [...materials, ...labors, ...equipment]
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface CostDBStore {
  snapshots:       Record<string, CostDBSnapshot>  // projectId → snapshot

  getSnapshot:     (projectId: string, region: Region) => CostDBSnapshot
  getEffectiveRate:(projectId: string, entryId: string) => number
  updateRate:      (projectId: string, entryId: string, rate: number) => void
  resetEntry:      (projectId: string, entryId: string) => void
  resetAll:        (projectId: string) => void
  addCustomEntry:  (projectId: string, entry: Omit<CostDBEntry, 'id' | 'updatedAt'>) => void
  deleteEntry:     (projectId: string, entryId: string) => void
}

export const useCostDBStore = create<CostDBStore>()(
  persist(
    (set, get) => ({
      snapshots: {},

      getSnapshot: (projectId, region) => {
        const existing = get().snapshots[projectId]
        if (existing) return existing

        // Auto-initialize from static DB
        const entries = buildDefaultEntries(region)
        const snapshot: CostDBSnapshot = {
          projectId,
          region,
          entries,
          updatedAt: new Date().toISOString(),
        }
        set(s => ({ snapshots: { ...s.snapshots, [projectId]: snapshot } }))
        return snapshot
      },

      getEffectiveRate: (projectId, entryId) => {
        const snap = get().snapshots[projectId]
        if (!snap) return 0
        const entry = snap.entries.find(e => e.id === entryId)
        if (!entry) return 0
        return entry.userRate ?? entry.baseRate
      },

      updateRate: (projectId, entryId, rate) =>
        set(s => {
          const snap = s.snapshots[projectId]
          if (!snap) return s
          return {
            snapshots: {
              ...s.snapshots,
              [projectId]: {
                ...snap,
                updatedAt: new Date().toISOString(),
                entries: snap.entries.map(e =>
                  e.id === entryId
                    ? { ...e, userRate: rate, updatedAt: new Date().toISOString() }
                    : e
                ),
              },
            },
          }
        }),

      resetEntry: (projectId, entryId) =>
        set(s => {
          const snap = s.snapshots[projectId]
          if (!snap) return s
          return {
            snapshots: {
              ...s.snapshots,
              [projectId]: {
                ...snap,
                entries: snap.entries.map(e =>
                  e.id === entryId ? { ...e, userRate: undefined } : e
                ),
              },
            },
          }
        }),

      resetAll: (projectId) =>
        set(s => {
          const snap = s.snapshots[projectId]
          if (!snap) return s
          return {
            snapshots: {
              ...s.snapshots,
              [projectId]: {
                ...snap,
                entries: snap.entries.map(e => ({ ...e, userRate: undefined })),
              },
            },
          }
        }),

      addCustomEntry: (projectId, entry) =>
        set(s => {
          const snap = s.snapshots[projectId]
          if (!snap) return s
          const newEntry: CostDBEntry = {
            ...entry,
            id:        crypto.randomUUID(),
            updatedAt: new Date().toISOString(),
          }
          return {
            snapshots: {
              ...s.snapshots,
              [projectId]: {
                ...snap,
                entries: [...snap.entries, newEntry],
              },
            },
          }
        }),

      deleteEntry: (projectId, entryId) =>
        set(s => {
          const snap = s.snapshots[projectId]
          if (!snap) return s
          return {
            snapshots: {
              ...s.snapshots,
              [projectId]: {
                ...snap,
                entries: snap.entries.filter(e => e.id !== entryId),
              },
            },
          }
        }),
    }),
    { name: 'civilos-cost-db' }
  )
)
