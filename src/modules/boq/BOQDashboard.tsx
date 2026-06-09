import React, { useState } from 'react'
import {
  Zap, Plus, Download, Trash2, FileSpreadsheet,
  RefreshCw, ChevronDown, ChevronRight, Pencil
} from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useTakeoffStore } from '@/store/takeoffStore'
import { useBOQStore, BOQ_CATEGORIES } from '@/store/boqStore'
import { Button, Badge, SectionHeader, EmptyState, StatCard } from '@/components/ui'
import { BOQItemForm } from './BOQItemForm'
import { BOQSummaryChart } from './BOQSummaryChart'
import type { BOQCategory, BOQItem } from '@/types'

const fmt = (n: number) =>
  '৳ ' + n.toLocaleString('en-BD', { maximumFractionDigits: 0 })

export function BOQDashboard() {
  const { activeProject } = useProjectStore()
  const { getSummary }    = useTakeoffStore()
  const { getBOQ, autoGenerate, deleteItem, clearBOQ } = useBOQStore()

  const project = activeProject()
  const [collapsed, setCollapsed]   = useState<Set<BOQCategory>>(new Set())
  const [editItem, setEditItem]     = useState<BOQItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addCategory, setAddCategory] = useState<BOQCategory>('concrete')
  const [showChart, setShowChart]   = useState(false)

  if (!project) return (
    <EmptyState icon={<FileSpreadsheet size={28} />} title="কোনো প্রজেক্ট নেই" description="Dashboard থেকে প্রজেক্ট খুলুন।" />
  )

  const boq     = getBOQ(project!.id)
  const summary = getSummary(project!.id)
  const settings = project!.costSettings

  // Cost with project settings applied
  const directCost    = boq?.grandTotal ?? 0
  const overhead      = directCost * settings.overheadPercent / 100
  const profit        = (directCost + overhead) * settings.profitPercent / 100
  const markup        = (directCost + overhead + profit) * settings.markupPercent / 100
  const contingency   = directCost * settings.contingencyPct / 100
  const subtotalBeforeVAT = directCost + overhead + profit + markup + contingency
  const vat           = subtotalBeforeVAT * settings.vatPercent / 100
  const grandTotalWithAll = subtotalBeforeVAT + vat

  function toggleCollapse(cat: BOQCategory) {
    setCollapsed(s => {
      const n = new Set(s)
      n.has(cat) ? n.delete(cat) : n.add(cat)
      return n
    })
  }

  function handleAutoGenerate() {
    if (!summary) {
      alert('প্রথমে Quantity Takeoff-এ Element যোগ করুন।')
      return
    }
    autoGenerate(project!.id, summary)
  }

  // Group items by category
  const grouped = BOQ_CATEGORIES.map(cat => ({
    ...cat,
    items: (boq?.items ?? []).filter(i => i.category === cat.id),
    subtotal: (boq?.items ?? [])
      .filter(i => i.category === cat.id)
      .reduce((s, i) => s + i.amount, 0),
  })).filter(g => g.items.length > 0)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Bill of Quantities (BOQ)"
        subtitle={`${project!.name} — সম্পূর্ণ BOQ`}
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={handleAutoGenerate}>
              Auto Generate
            </Button>
            <Button variant="ghost" size="sm" icon={<Plus size={14} />}
              onClick={() => setShowAddForm(true)}>
              Item যোগ
            </Button>
            <Button variant="outline" size="sm" icon={<Download size={14} />}>
              Export
            </Button>
          </div>
        }
      />

      {/* Summary stats */}
      {boq && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Direct Cost"   value={fmt(directCost)}          color="teal" />
          <StatCard label="মোট Items"     value={boq.items.length}         color="purple" />
          <StatCard label="Grand Total"   value={fmt(grandTotalWithAll)}   color="green" />
          <StatCard label="Cost/m²"       value={fmt(directCost / (project!.totalArea || 1))} unit="/m²" color="amber" />
        </div>
      )}

      {/* Cost summary panel */}
      {boq && boq.grandTotal > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Cost breakdown */}
          <div className="lg:col-span-2 bg-surface-800 border border-surface-700 rounded-xl p-5">
            <p className="text-sm font-semibold text-surface-300 mb-4">খরচের সারসংক্ষেপ</p>
            <div className="space-y-2">
              {[
                { label: 'Direct Cost (BOQ)',            value: directCost,          color: 'text-surface-200', bold: false },
                { label: `Overhead (${settings.overheadPercent}%)`,  value: overhead,   color: 'text-amber-400',  bold: false },
                { label: `Profit (${settings.profitPercent}%)`,       value: profit,    color: 'text-emerald-400',bold: false },
                { label: `Markup (${settings.markupPercent}%)`,        value: markup,   color: 'text-blue-400',   bold: false },
                { label: `Contingency (${settings.contingencyPct}%)`, value: contingency, color: 'text-purple-400', bold: false },
                { label: `VAT (${settings.vatPercent}%)`,              value: vat,      color: 'text-orange-400', bold: false },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-1.5 border-b border-surface-700/40">
                  <span className="text-sm text-surface-400">{row.label}</span>
                  <span className={`text-sm font-mono ${row.color}`}>{fmt(row.value)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3">
                <span className="font-semibold text-white">Grand Total (সর্বমোট)</span>
                <span className="text-lg font-display font-bold text-brand-400">{fmt(grandTotalWithAll)}</span>
              </div>
            </div>
          </div>

          {/* Category chart */}
          {showChart || grouped.length > 0 ? (
            <BOQSummaryChart items={boq.items} />
          ) : null}
        </div>
      )}

      {/* Empty state */}
      {!boq || boq.items.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet size={28} />}
          title="BOQ তৈরি হয়নি"
          description="Quantity Takeoff থেকে Auto Generate করুন অথবা manually item যোগ করুন।"
          action={
            <div className="flex gap-3">
              <Button icon={<Zap size={16} />} onClick={handleAutoGenerate}>
                Auto Generate BOQ
              </Button>
              <Button variant="outline" icon={<Plus size={16} />} onClick={() => setShowAddForm(true)}>
                Manual Item
              </Button>
            </div>
          }
        />
      ) : (
        /* BOQ Table by category */
        <div className="space-y-3">
          {grouped.map((group, gi) => (
            <div key={group.id} className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCollapse(group.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {collapsed.has(group.id)
                    ? <ChevronRight size={16} className="text-surface-500" />
                    : <ChevronDown  size={16} className="text-surface-500" />}
                  <span className={`text-sm font-semibold ${group.color}`}>
                    {String.fromCharCode(65 + gi)}. {group.label}
                  </span>
                  <span className="text-xs text-surface-500">— {group.labelBn}</span>
                  <Badge variant="default">{group.items.length} items</Badge>
                </div>
                <span className="font-mono font-semibold text-surface-200 text-sm">
                  {fmt(group.subtotal)}
                </span>
              </button>

              {/* Items table */}
              {!collapsed.has(group.id) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-900/60 border-t border-b border-surface-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-surface-500 w-16">Item No</th>
                        <th className="px-3 py-2 text-left text-xs text-surface-500">Description</th>
                        <th className="px-3 py-2 text-center text-xs text-surface-500 w-16">Unit</th>
                        <th className="px-3 py-2 text-right text-xs text-surface-500 w-24">Quantity</th>
                        <th className="px-3 py-2 text-right text-xs text-surface-500 w-28">Rate (৳)</th>
                        <th className="px-3 py-2 text-right text-xs text-surface-500 w-32">Amount (৳)</th>
                        <th className="px-3 py-2 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-700/30">
                      {group.items.map(item => (
                        <BOQRow
                          key={item.id}
                          item={item}
                          projectId={project!.id}
                          onEdit={() => setEditItem(item)}
                          onDelete={() => deleteItem(project!.id, item.id)}
                        />
                      ))}
                    </tbody>
                    <tfoot className="bg-surface-900/40 border-t border-surface-700">
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-xs font-medium text-surface-500 uppercase tracking-wider">
                          Subtotal — {group.label}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-surface-200">
                          {fmt(group.subtotal)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}

          {/* Grand total row */}
          <div className="bg-gradient-to-r from-brand-900/40 to-surface-800 border border-brand-700/40 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-surface-400">BOQ Grand Total (Direct Cost)</p>
              <p className="text-xs text-surface-500">VAT/Overhead/Profit আলাদা</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-brand-400">{fmt(directCost)}</p>
              <p className="text-sm text-surface-400">সর্বমোট সহ: {fmt(grandTotalWithAll)}</p>
            </div>
          </div>

          {/* Clear button */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
              onClick={() => { if (confirm('সম্পূর্ণ BOQ মুছে ফেলবেন?')) clearBOQ(project!.id) }}>
              BOQ Clear করুন
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {(showAddForm || editItem) && (
        <BOQItemForm
          projectId={project!.id}
          defaultCategory={addCategory}
          editItem={editItem ?? undefined}
          onClose={() => { setShowAddForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}

// ─── BOQ Row ─────────────────────────────────────────────────────────────────

function BOQRow({
  item, projectId, onEdit, onDelete
}: {
  item: BOQItem; projectId: string; onEdit: () => void; onDelete: () => void
}) {
  const { updateRate } = useBOQStore()
  const [editingRate, setEditingRate] = useState(false)
  const [rateVal, setRateVal]         = useState(item.rate)

  function commitRate() {
    updateRate(projectId, item.id, rateVal)
    setEditingRate(false)
  }

  return (
    <tr className="hover:bg-surface-750/50 transition-colors group">
      <td className="px-3 py-2 font-mono text-xs text-surface-500">{item.itemNo}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-surface-200">{item.description}</span>
          {item.source === 'auto' && (
            <span className="text-xs text-brand-500 font-mono">AUTO</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-center text-surface-400 text-xs">{item.unit}</td>
      <td className="px-3 py-2 text-right font-mono text-surface-200">
        {item.quantity.toLocaleString('en-BD', { maximumFractionDigits: 2 })}
      </td>
      <td className="px-3 py-2 text-right">
        {editingRate ? (
          <input
            type="number"
            value={rateVal}
            onChange={e => setRateVal(+e.target.value)}
            onBlur={commitRate}
            onKeyDown={e => e.key === 'Enter' && commitRate()}
            autoFocus
            className="w-24 bg-surface-900 border border-brand-500 rounded px-2 py-1 text-right font-mono text-sm text-white focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingRate(true)}
            className="font-mono text-surface-200 hover:text-brand-300 transition-colors"
          >
            {item.rate.toLocaleString('en-BD')}
          </button>
        )}
      </td>
      <td className="px-3 py-2 text-right font-mono font-semibold text-surface-100">
        {item.amount.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-brand-400 hover:bg-surface-700 transition-colors">
            <Pencil size={11} />
          </button>
          <button onClick={onDelete}
            className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-red-400 hover:bg-surface-700 transition-colors">
            <Trash2 size={11} />
          </button>
        </div>
      </td>
    </tr>
  )
}
