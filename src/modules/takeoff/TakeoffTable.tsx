import React, { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useTakeoffStore } from '@/store/takeoffStore'
import { ElementForm } from './ElementForm'
import { round2 } from './QuantityEngine'
import { Badge } from '@/components/ui'
import type { StructuralElement, ElementQuantity, ElementType } from '@/types'

interface Props {
  projectId: string
  elements:  StructuralElement[]
  activeTab: ElementType | 'all'
}

type SortKey = 'tag' | 'floor' | 'concreteVolume' | 'steelWeight' | 'formworkArea' | 'count'

const TYPE_COLORS: Record<string, string> = {
  beam:     'info',
  column:   'warning',
  slab:     'success',
  footing:  'default',
  wall:     'danger',
  door:     'default',
  window:   'default',
}

const TYPE_LABELS: Record<string, string> = {
  beam: 'বিম', column: 'কলাম', slab: 'স্ল্যাব',
  footing: 'ফুটিং', wall: 'দেয়াল', door: 'দরজা', window: 'জানালা',
}

export function TakeoffTable({ projectId, elements, activeTab }: Props) {
  const { getSummary, deleteElement, updateElement } = useTakeoffStore()
  const summary = getSummary(projectId)

  const [editEl, setEditEl]       = useState<StructuralElement | null>(null)
  const [sortKey, setSortKey]     = useState<SortKey>('tag')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc')
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  // Build a map of id → computed quantity
  const qtyMap = new Map<string, ElementQuantity>()
  if (summary) {
    for (const q of summary.elements) qtyMap.set(q.elementId, q)
  }

  // Sort
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...elements].sort((a, b) => {
    const qa = qtyMap.get(a.id)
    const qb = qtyMap.get(b.id)
    let va: number | string = 0
    let vb: number | string = 0
    switch (sortKey) {
      case 'tag':           va = a.tag;   vb = b.tag;   break
      case 'floor':         va = ('floor' in a ? a.floor : 0); vb = ('floor' in b ? b.floor : 0); break
      case 'concreteVolume':va = qa?.concreteVolume ?? 0; vb = qb?.concreteVolume ?? 0; break
      case 'steelWeight':   va = qa?.steelWeight ?? 0;    vb = qb?.steelWeight ?? 0;    break
      case 'formworkArea':  va = qa?.formworkArea ?? 0;   vb = qb?.formworkArea ?? 0;   break
      case 'count':         va = a.count; vb = b.count;  break
    }
    const dir = sortDir === 'asc' ? 1 : -1
    return typeof va === 'string' ? va.localeCompare(String(vb)) * dir : ((va as number) - (vb as number)) * dir
  })

  // Column totals
  const totalConc  = sorted.reduce((s, e) => s + (qtyMap.get(e.id)?.concreteVolume ?? 0), 0)
  const totalSteel = sorted.reduce((s, e) => s + (qtyMap.get(e.id)?.steelWeight ?? 0), 0)
  const totalFw    = sorted.reduce((s, e) => s + (qtyMap.get(e.id)?.formworkArea ?? 0), 0)
  const totalBrick = sorted.reduce((s, e) => s + (qtyMap.get(e.id)?.brickQty ?? 0), 0)

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} className="opacity-30" />
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-brand-400" /> : <ChevronDown size={12} className="text-brand-400" />
  }

  function ColHeader({ label, k, className = '' }: { label: string; k: SortKey; className?: string }) {
    return (
      <th
        className={`px-3 py-2.5 text-left text-xs font-medium text-surface-400 uppercase tracking-wider cursor-pointer hover:text-surface-200 select-none whitespace-nowrap ${className}`}
        onClick={() => toggleSort(k)}
      >
        <span className="flex items-center gap-1">{label}<SortIcon k={k} /></span>
      </th>
    )
  }

  return (
    <>
      <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-900/80 border-b border-surface-700">
              <tr>
                <ColHeader label="Tag"        k="tag"           />
                <th className="px-3 py-2.5 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">Type</th>
                <ColHeader label="Floor"      k="floor"         />
                <ColHeader label="Count"      k="count"         className="text-right" />
                <ColHeader label="Concrete m³" k="concreteVolume" className="text-right" />
                <ColHeader label="Steel kg"   k="steelWeight"   className="text-right" />
                <ColHeader label="Formwork m²" k="formworkArea"  className="text-right" />
                <th className="px-3 py-2.5 text-right text-xs font-medium text-surface-400 uppercase tracking-wider">Brick</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-surface-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {sorted.map((el, idx) => {
                const q = qtyMap.get(el.id)
                return (
                  <tr
                    key={el.id}
                    className={`hover:bg-surface-750 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-800/30'}`}
                  >
                    <td className="px-3 py-2.5">
                      <span className="font-mono font-semibold text-white">{el.tag}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={TYPE_COLORS[el.type] as any}>{TYPE_LABELS[el.type] ?? el.type}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-surface-300">
                      {'floor' in el ? `F${el.floor}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-surface-200">{el.count}</td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {q?.concreteVolume ? (
                        <span className="text-brand-300">{round2(q.concreteVolume).toFixed(3)}</span>
                      ) : <span className="text-surface-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {q?.steelWeight ? (
                        <span className="text-purple-300">{round2(q.steelWeight).toFixed(1)}</span>
                      ) : <span className="text-surface-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {q?.formworkArea ? (
                        <span className="text-amber-300">{round2(q.formworkArea).toFixed(2)}</span>
                      ) : <span className="text-surface-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {q?.brickQty ? (
                        <span className="text-orange-300">{q.brickQty.toLocaleString()}</span>
                      ) : <span className="text-surface-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditEl(el)}
                          className="w-7 h-7 flex items-center justify-center rounded text-surface-500 hover:text-brand-400 hover:bg-surface-700 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDel(el.id)}
                          className="w-7 h-7 flex items-center justify-center rounded text-surface-500 hover:text-red-400 hover:bg-surface-700 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* Totals */}
            {sorted.length > 0 && (
              <tfoot className="bg-surface-900/60 border-t-2 border-surface-600">
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                    TOTAL ({sorted.length} elements)
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-brand-300">
                    {round2(totalConc).toFixed(3)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-purple-300">
                    {round2(totalSteel).toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-amber-300">
                    {round2(totalFw).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-orange-300">
                    {totalBrick > 0 ? totalBrick.toLocaleString() : '—'}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editEl && (
        <ElementForm
          projectId={projectId}
          defaultType={editEl.type}
          editElement={editEl}
          onClose={() => setEditEl(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDel(null)} />
          <div className="relative bg-surface-800 border border-surface-700 rounded-xl p-5 max-w-xs w-full">
            <p className="text-white font-semibold mb-2">Element মুছবেন?</p>
            <p className="text-surface-400 text-sm mb-4">এটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-2 rounded-lg bg-surface-700 text-surface-300 text-sm hover:bg-surface-600 transition-colors">বাতিল</button>
              <button onClick={() => { deleteElement(projectId, confirmDel); setConfirmDel(null) }} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-500 transition-colors">মুছুন</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
