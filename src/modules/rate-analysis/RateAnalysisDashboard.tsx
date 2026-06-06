import React, { useState } from 'react'
import {
  Database, Plus, Download, RefreshCw,
  ChevronDown, ChevronRight, Pencil, Trash2, Copy
} from 'lucide-react'
import { useProjectStore }      from '@/store/projectStore'
import { useRateAnalysisStore } from '@/store/rateAnalysisStore'
import { Button, Badge, SectionHeader, EmptyState, StatCard } from '@/components/ui'
import { RateAnalysisForm }     from './RateAnalysisForm'
import { RateBreakdownChart }   from './RateBreakdownChart'
import type { RateAnalysisItem } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  material:  'text-blue-400',
  labor:     'text-emerald-400',
  equipment: 'text-amber-400',
  overhead:  'text-purple-400',
  profit:    'text-pink-400',
}
const CATEGORY_BN: Record<string, string> = {
  material: 'উপকরণ', labor: 'শ্রম', equipment: 'যন্ত্রপাতি', overhead: 'ওভারহেড', profit: 'মুনাফা',
}

const fmt = (n: number) => n.toLocaleString('en-BD', { maximumFractionDigits: 0 })

export function RateAnalysisDashboard() {
  const { activeProject }                 = useProjectStore()
  const { getItems, loadTemplates, deleteItem } = useRateAnalysisStore()

  const project = activeProject()
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())
  const [editItem, setEditItem]   = useState<RateAnalysisItem | null>(null)
  const [showForm, setShowForm]   = useState(false)

  if (!project) return (
    <EmptyState icon={<Database size={28} />} title="কোনো প্রজেক্ট নেই" description="Dashboard থেকে প্রজেক্ট খুলুন।" />
  )

  const items = getItems(project.id)

  function toggleExpand(id: string) {
    setExpanded(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  // Summary stats
  const avgRate    = items.length > 0 ? items.reduce((s, i) => s + i.totalRate, 0) / items.length : 0
  const maxRate    = items.length > 0 ? Math.max(...items.map(i => i.totalRate)) : 0
  const templates  = items.filter(i => i.isTemplate).length
  const custom     = items.filter(i => !i.isTemplate).length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Rate Analysis"
        subtitle={`${project.name} — Unit Rate Breakdown`}
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />}
              onClick={() => loadTemplates(project.id)}>
              Templates Load করুন
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(true)}>
              নতুন Analysis
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="মোট Items"    value={items.length}       color="teal"   />
        <StatCard label="Templates"    value={templates}          color="purple" />
        <StatCard label="Custom"       value={custom}             color="amber"  />
        <StatCard label="সর্বোচ্চ Rate" value={'৳ ' + fmt(maxRate)} color="green" />
      </div>

      {/* Empty */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Database size={28} />}
          title="কোনো Rate Analysis নেই"
          description="Bangladesh-ভিত্তিক Standard Templates লোড করুন অথবা নিজে তৈরি করুন।"
          action={
            <div className="flex gap-3">
              <Button icon={<RefreshCw size={16} />} onClick={() => loadTemplates(project.id)}>
                Standard Templates Load
              </Button>
              <Button variant="outline" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
                নতুন তৈরি করুন
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <RateAnalysisCard
              key={item.id}
              item={item}
              expanded={expanded.has(item.id)}
              onToggle={() => toggleExpand(item.id)}
              onEdit={() => { setEditItem(item); setShowForm(true) }}
              onDelete={() => deleteItem(project.id, item.id)}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <RateAnalysisForm
          projectId={project.id}
          editItem={editItem ?? undefined}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}

// ─── Rate Analysis Card ───────────────────────────────────────────────────────

function RateAnalysisCard({
  item, expanded, onToggle, onEdit, onDelete
}: {
  item:     RateAnalysisItem
  expanded: boolean
  onToggle: () => void
  onEdit:   () => void
  onDelete: () => void
}) {
  const { updateComponent } = useRateAnalysisStore()
  const { activeProject }   = useProjectStore()
  const projectId = activeProject()?.id ?? ''

  // Breakdown totals
  const matTotal  = item.components.filter(c => c.category === 'material').reduce((s, c) => s + c.amount, 0)
  const labTotal  = item.components.filter(c => c.category === 'labor').reduce((s, c) => s + c.amount, 0)
  const eqTotal   = item.components.filter(c => c.category === 'equipment').reduce((s, c) => s + c.amount, 0)
  const fmt = (n: number) => n.toLocaleString('en-BD', { maximumFractionDigits: 0 })

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-750 transition-colors">
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 text-left">
          {expanded
            ? <ChevronDown  size={16} className="text-surface-500 flex-shrink-0" />
            : <ChevronRight size={16} className="text-surface-500 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-brand-400">{item.code}</span>
              <span className="font-medium text-surface-100 truncate">{item.workItem}</span>
              {item.isTemplate && <Badge variant="info">Template</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-surface-500">per {item.unit}</span>
              <span className="text-xs text-blue-400">Mat: ৳{fmt(matTotal)}</span>
              <span className="text-xs text-emerald-400">Labor: ৳{fmt(labTotal)}</span>
              <span className="text-xs text-amber-400">Equip: ৳{fmt(eqTotal)}</span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-surface-500">Unit Rate</p>
            <p className="font-display font-bold text-brand-400 text-lg">
              ৳ {fmt(item.totalRate)}
            </p>
            <p className="text-xs text-surface-500">/{item.unit}</p>
          </div>
          <div className="flex flex-col gap-1">
            <button onClick={onEdit}
              className="w-7 h-7 flex items-center justify-center rounded text-surface-500 hover:text-brand-400 hover:bg-surface-700 transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={onDelete}
              className="w-7 h-7 flex items-center justify-center rounded text-surface-500 hover:text-red-400 hover:bg-surface-700 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="border-t border-surface-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-4 p-4">
            {/* Component table */}
            <div className="lg:col-span-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-700">
                    <th className="pb-2 text-left text-surface-500 uppercase tracking-wider">Category</th>
                    <th className="pb-2 text-left text-surface-500 uppercase tracking-wider">Description</th>
                    <th className="pb-2 text-center text-surface-500 uppercase tracking-wider">Unit</th>
                    <th className="pb-2 text-right text-surface-500 uppercase tracking-wider">Qty</th>
                    <th className="pb-2 text-right text-surface-500 uppercase tracking-wider">Rate ৳</th>
                    <th className="pb-2 text-right text-surface-500 uppercase tracking-wider">Amount ৳</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700/30">
                  {item.components.map(comp => (
                    <tr key={comp.id} className="hover:bg-surface-750/50">
                      <td className="py-1.5">
                        <span className={`font-medium ${CATEGORY_COLORS[comp.category] ?? 'text-surface-300'}`}>
                          {CATEGORY_BN[comp.category] ?? comp.category}
                        </span>
                      </td>
                      <td className="py-1.5 text-surface-300">{comp.description}</td>
                      <td className="py-1.5 text-center text-surface-400">{comp.unit}</td>
                      <td className="py-1.5 text-right font-mono text-surface-200">
                        <InlineEdit
                          value={comp.quantity}
                          onCommit={v => updateComponent(projectId, item.id, { ...comp, quantity: v, amount: v * comp.unitRate })}
                        />
                      </td>
                      <td className="py-1.5 text-right font-mono text-surface-200">
                        <InlineEdit
                          value={comp.unitRate}
                          onCommit={v => updateComponent(projectId, item.id, { ...comp, unitRate: v, amount: comp.quantity * v })}
                        />
                      </td>
                      <td className="py-1.5 text-right font-mono font-semibold text-surface-100">
                        {comp.amount.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-surface-600">
                  <tr>
                    <td colSpan={5} className="pt-2 text-right font-semibold text-surface-300 text-xs uppercase tracking-wider">
                      Total Unit Rate per {item.unit}
                    </td>
                    <td className="pt-2 text-right font-display font-bold text-brand-400 text-sm">
                      ৳ {fmt(item.totalRate)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mini chart */}
            <div>
              <RateBreakdownChart item={item} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inline editable cell ─────────────────────────────────────────────────────

function InlineEdit({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value)

  if (!editing) return (
    <button
      onClick={() => { setVal(value); setEditing(true) }}
      className="hover:text-brand-300 transition-colors underline underline-offset-2 decoration-dotted"
    >
      {value.toLocaleString('en-BD', { maximumFractionDigits: 3 })}
    </button>
  )

  return (
    <input
      type="number"
      value={val}
      step="0.01"
      onChange={e => setVal(+e.target.value)}
      onBlur={() => { onCommit(val); setEditing(false) }}
      onKeyDown={e => { if (e.key === 'Enter') { onCommit(val); setEditing(false) } }}
      autoFocus
      className="w-20 bg-surface-900 border border-brand-500 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white focus:outline-none"
    />
  )
}
