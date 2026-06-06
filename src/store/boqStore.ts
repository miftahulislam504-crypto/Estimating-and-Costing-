import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BOQ, BOQItem, BOQCategory, TakeoffSummary } from '@/types'
import { useRateAnalysisStore } from './rateAnalysisStore'

// ─── BOQ Category definitions ─────────────────────────────────────────────────

export const BOQ_CATEGORIES: { id: BOQCategory; label: string; labelBn: string; color: string }[] = [
  { id: 'earthwork',     label: 'Earthwork',      labelBn: 'মাটির কাজ',     color: 'text-amber-400' },
  { id: 'concrete',      label: 'Concrete',        labelBn: 'কংক্রিট',       color: 'text-blue-400' },
  { id: 'reinforcement', label: 'Reinforcement',   labelBn: 'রড / ইস্পাত',   color: 'text-purple-400' },
  { id: 'masonry',       label: 'Masonry',         labelBn: 'ইটের কাজ',      color: 'text-orange-400' },
  { id: 'finishing',     label: 'Finishing',       labelBn: 'ফিনিশিং',       color: 'text-green-400' },
  { id: 'mep',           label: 'MEP',             labelBn: 'এমইপি',         color: 'text-pink-400' },
  { id: 'external',      label: 'External Works',  labelBn: 'বাহ্যিক কাজ',   color: 'text-teal-400' },
]

// ─── Store ────────────────────────────────────────────────────────────────────

interface BOQStore {
  boqByProject: Record<string, BOQ>

  getBOQ:        (projectId: string) => BOQ | null
  autoGenerate:  (projectId: string, summary: TakeoffSummary) => void
  addItem:       (projectId: string, item: BOQItem) => void
  updateItem:    (projectId: string, item: BOQItem) => void
  deleteItem:    (projectId: string, itemId: string) => void
  updateRate:    (projectId: string, itemId: string, rate: number) => void
  clearBOQ:      (projectId: string) => void
}

function makeItem(
  itemNo: string,
  description: string,
  unit: string,
  quantity: number,
  rate: number,
  category: BOQCategory,
  source: 'auto' | 'manual' = 'auto'
): BOQItem {
  return {
    id:          crypto.randomUUID(),
    itemNo,
    description,
    unit,
    quantity:    Math.round(quantity * 100) / 100,
    rate,
    amount:      Math.round(quantity * rate * 100) / 100,
    category,
    source,
  }
}

export const useBOQStore = create<BOQStore>()(
  persist(
    (set, get) => ({
      boqByProject: {},

      getBOQ: (projectId) =>
        get().boqByProject[projectId] ?? null,

      autoGenerate: (projectId, summary) => {
        // Get rate analysis items for this project to pull unit rates
        const raItems = useRateAnalysisStore.getState().getItems(projectId)

        function getRate(code: string): number {
          return raItems.find(r => r.code === code)?.totalRate ?? 0
        }

        const items: BOQItem[] = []
        let no = 1

        // ── A. Earthwork ────────────────────────────────────────────────────
        // Estimate excavation from footing volumes (2× for working space)
        const footingVol = summary.elements
          .filter(e => e.elementType === 'footing')
          .reduce((s, e) => s + e.concreteVolume, 0)

        if (footingVol > 0) {
          const excavation = footingVol * 3.5 // approx excavation volume
          items.push(makeItem(`A.${no++}`, 'Excavation in ordinary soil', 'm³', excavation, getRate('RA-E01') || 350, 'earthwork'))
          items.push(makeItem(`A.${no++}`, 'Earth filling & compaction', 'm³', excavation * 0.6, 250, 'earthwork'))
        }

        no = 1
        // ── B. Concrete ─────────────────────────────────────────────────────
        const concreteTypes = [
          { type: 'footing', label: 'RCC M20 — Footing' },
          { type: 'column',  label: 'RCC M20 — Column' },
          { type: 'beam',    label: 'RCC M20 — Beam' },
          { type: 'slab',    label: 'RCC M20 — Slab' },
        ] as const

        for (const ct of concreteTypes) {
          const vol = summary.elements
            .filter(e => e.elementType === ct.type)
            .reduce((s, e) => s + e.concreteVolume, 0)
          if (vol > 0) {
            items.push(makeItem(`B.${no++}`, ct.label, 'm³', vol, getRate('RA-C02') || 12000, 'concrete'))
          }
        }

        // PCC for levelling (10% of footing vol)
        if (footingVol > 0) {
          items.push(makeItem(`B.${no++}`, 'PCC 1:2:4 — Lean Concrete (levelling)', 'm³', footingVol * 0.1, getRate('RA-C01') || 9000, 'concrete'))
        }

        no = 1
        // ── C. Reinforcement ────────────────────────────────────────────────
        const totalSteel = summary.totalSteelWeight / 1000 // MT
        if (totalSteel > 0) {
          items.push(makeItem(`C.${no++}`, 'Reinforcement Bar Fe500 — All diameters', 'MT', totalSteel, getRate('RA-R01') || 115000, 'reinforcement'))
        }

        // Formwork
        no = 1
        // ── D. Formwork (under concrete section for BOQ) ─────────────────
        if (summary.totalFormworkArea > 0) {
          items.push(makeItem(`B.${no + 10}`, 'Formwork / Shuttering — Columns & Beams', 'm²', summary.totalFormworkArea, getRate('RA-F01') || 800, 'concrete'))
        }

        no = 1
        // ── E. Masonry ───────────────────────────────────────────────────────
        if (summary.totalBrickQty > 0) {
          // Convert bricks to m³ (450 bricks/m³)
          const masonryVol = summary.totalBrickQty / 450
          items.push(makeItem(`E.${no++}`, 'Brick Masonry (1:4) — Partition Wall', 'm³', masonryVol, getRate('RA-M01') || 12500, 'masonry'))
        }

        no = 1
        // ── F. Finishing ─────────────────────────────────────────────────────
        if (summary.totalPlasterArea > 0) {
          items.push(makeItem(`F.${no++}`, 'Plaster (1:4, 12mm thick) — both sides', 'm²', summary.totalPlasterArea, getRate('RA-P01') || 280, 'finishing'))
        }
        if (summary.totalPaintArea > 0) {
          items.push(makeItem(`F.${no++}`, 'Paint (2 coats) — Interior', 'm²', summary.totalPaintArea, getRate('RA-PT01') || 120, 'finishing'))
        }
        if (summary.totalPaintArea > 0) {
          // Estimate floor tile area = 70% of paint area
          const tileArea = summary.totalPaintArea * 0.7
          items.push(makeItem(`F.${no++}`, 'Floor Tiles (600×600mm) — Vitrified', 'm²', tileArea, getRate('RA-T01') || 1200, 'finishing'))
        }

        no = 1
        // ── G. Doors & Windows ───────────────────────────────────────────────
        if (summary.totalDoors > 0) {
          items.push(makeItem(`F.${no++}`, 'Wooden Door with Frame & Fittings', 'nos', summary.totalDoors, 18000, 'finishing'))
        }
        if (summary.totalWindows > 0) {
          items.push(makeItem(`F.${no++}`, 'Steel Window with Frame & Fittings', 'nos', summary.totalWindows, 8500, 'finishing'))
        }

        const grandTotal = items.reduce((s, i) => s + i.amount, 0)

        const boq: BOQ = {
          projectId,
          items,
          grandTotal,
          generatedAt: new Date().toISOString(),
          version: (get().boqByProject[projectId]?.version ?? 0) + 1,
        }

        set(s => ({ boqByProject: { ...s.boqByProject, [projectId]: boq } }))
      },

      addItem: (projectId, item) =>
        set(s => {
          const existing = s.boqByProject[projectId]
          const items = [...(existing?.items ?? []), item]
          const grandTotal = items.reduce((sum, i) => sum + i.amount, 0)
          return {
            boqByProject: {
              ...s.boqByProject,
              [projectId]: { ...existing, projectId, items, grandTotal, generatedAt: existing?.generatedAt ?? new Date().toISOString(), version: existing?.version ?? 1 },
            },
          }
        }),

      updateItem: (projectId, item) =>
        set(s => {
          const existing = s.boqByProject[projectId]
          if (!existing) return s
          const items = existing.items.map(i => i.id === item.id ? { ...item, amount: item.quantity * item.rate } : i)
          return { boqByProject: { ...s.boqByProject, [projectId]: { ...existing, items, grandTotal: items.reduce((sum, i) => sum + i.amount, 0) } } }
        }),

      deleteItem: (projectId, itemId) =>
        set(s => {
          const existing = s.boqByProject[projectId]
          if (!existing) return s
          const items = existing.items.filter(i => i.id !== itemId)
          return { boqByProject: { ...s.boqByProject, [projectId]: { ...existing, items, grandTotal: items.reduce((sum, i) => sum + i.amount, 0) } } }
        }),

      updateRate: (projectId, itemId, rate) =>
        set(s => {
          const existing = s.boqByProject[projectId]
          if (!existing) return s
          const items = existing.items.map(i =>
            i.id === itemId ? { ...i, rate, amount: i.quantity * rate } : i
          )
          return { boqByProject: { ...s.boqByProject, [projectId]: { ...existing, items, grandTotal: items.reduce((sum, i) => sum + i.amount, 0) } } }
        }),

      clearBOQ: (projectId) =>
        set(s => {
          const n = { ...s.boqByProject }
          delete n[projectId]
          return { boqByProject: n }
        }),
    }),
    { name: 'civilos-boq' }
  )
)
