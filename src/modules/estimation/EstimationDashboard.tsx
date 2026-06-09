import React, { useState } from 'react'
import {
  Calculator, Zap, Plus, RefreshCw, Download,
  ChevronDown, ChevronRight, Pencil, Trash2, TrendingUp, Building2
} from 'lucide-react'
import { useProjectStore }    from '@/store/projectStore'
import { useBOQStore }        from '@/store/boqStore'
import { useEstimationStore, buildEstimationFromBOQ, ESTIMATION_CATEGORIES } from '@/store/estimationStore'
import { Button, StatCard, SectionHeader, EmptyState, Badge } from '@/components/ui'
import { EstimationChart }    from './EstimationChart'
import { LineItemForm }       from './LineItemForm'
import type { EstimationLineItem, EstimationCategory } from '@/types'

const fmt  = (n: number) => '৳ ' + Math.round(n).toLocaleString('en-BD')
const fmt2 = (n: number) => Math.round(n).toLocaleString('en-BD')

export function EstimationDashboard() {
  const { activeProject }   = useProjectStore()
  const { getBOQ }          = useBOQStore()
  const {
    getEstimation, setEstimation, deleteLineItem,
    recalculate, clearEstimation
  } = useEstimationStore()

  const project    = activeProject()
  const [collapsed, setCollapsed]   = useState<Set<EstimationCategory>>(new Set())
  const [showForm, setShowForm]     = useState(false)
  const [editItem, setEditItem]     = useState<EstimationLineItem | null>(null)
  const [showChart, setShowChart]   = useState(true)

  if (!project) return (
    <EmptyState
      icon={<Calculator size={28} />}
      title="কোনো প্রজেক্ট নেই"
      description="Dashboard থেকে প্রজেক্ট খুলুন।"
    />
  )

  const estimation = getEstimation(project!.id)
  const boq        = getBOQ(project!.id)
  const settings   = project!.costSettings

  function handleAutoGenerate() {
    if (!boq || boq.items.length === 0) {
      alert('প্রথমে BOQ তৈরি করুন।')
      return
    }
    const est = buildEstimationFromBOQ(
      project!.id, boq, settings,
      project!.totalArea, project!.totalFloors
    )
    setEstimation(est)
  }

  function toggle(cat: EstimationCategory) {
    setCollapsed(s => {
      const n = new Set(s)
      n.has(cat) ? n.delete(cat) : n.add(cat)
      return n
    })
  }

  // Group line items
  const grouped = ESTIMATION_CATEGORIES.map(cat => ({
    ...cat,
    items:    (estimation?.lineItems ?? []).filter(i => i.category === cat.id),
    subtotal: (estimation?.lineItems ?? [])
      .filter(i => i.category === cat.id)
      .reduce((s, i) => s + i.amount, 0),
  })).filter(g => g.items.length > 0)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Cost Estimation"
        subtitle={`${project!.name} — সম্পূর্ণ Project Cost`}
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={<Zap size={14} />} onClick={handleAutoGenerate}>
              BOQ থেকে Generate
            </Button>
            <Button variant="ghost" size="sm" icon={<Plus size={14} />}
              onClick={() => setShowForm(true)}>
              Item যোগ
            </Button>
            {estimation && (
              <Button variant="outline" size="sm" icon={<RefreshCw size={14} />}
                onClick={() => recalculate(project!.id, settings, project!.totalArea, project!.totalFloors)}>
                Recalculate
              </Button>
            )}
          </div>
        }
      />

      {/* Empty state */}
      {!estimation ? (
        <EmptyState
          icon={<Calculator size={28} />}
          title="Estimation তৈরি হয়নি"
          description="BOQ থেকে Auto Generate করুন। সব overhead, profit, VAT স্বয়ংক্রিয়ভাবে যোগ হবে।"
          action={
            <div className="flex gap-3">
              <Button icon={<Zap size={16} />} onClick={handleAutoGenerate}>
                Auto Generate Estimation
              </Button>
              <Button variant="outline" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
                Manual Entry
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Grand Total"    value={fmt(estimation.grandTotal)}     color="teal"   />
            <StatCard label="Cost per m²"    value={fmt(estimation.costPerSqm)}     color="purple" />
            <StatCard label="Cost per sft"   value={fmt(estimation.costPerSqft)}    color="amber"  />
            <StatCard label="Cost per Floor" value={fmt(estimation.costPerFloor)}   color="green"  />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

            {/* Cost breakdown summary card */}
            <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
              <p className="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-400" />
                খরচের সারসংক্ষেপ
              </p>
              <div className="space-y-2.5">
                {[
                  { label: 'Direct Cost',                          value: estimation.directCost,      color: 'text-surface-200' },
                  { label: `Overhead (${settings.overheadPercent}%)`,   value: estimation.overheadCost,    color: 'text-amber-400' },
                  { label: `Profit (${settings.profitPercent}%)`,        value: estimation.profitCost,      color: 'text-emerald-400' },
                  { label: `Markup (${settings.markupPercent}%)`,         value: estimation.markupCost,      color: 'text-blue-400' },
                  { label: `Contingency (${settings.contingencyPct}%)`,  value: estimation.contingencyCost, color: 'text-purple-400' },
                  { label: `VAT (${settings.vatPercent}%)`,               value: estimation.vatAmount,       color: 'text-orange-400' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-1 border-b border-surface-700/40">
                    <span className="text-xs text-surface-400">{row.label}</span>
                    <span className={`text-xs font-mono ${row.color}`}>{fmt(row.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-white">Grand Total</span>
                  <span className="font-display font-bold text-brand-400 text-lg">{fmt(estimation.grandTotal)}</span>
                </div>
              </div>

              {/* Cost per area */}
              <div className="mt-4 pt-4 border-t border-surface-700 grid grid-cols-2 gap-3">
                {[
                  { label: 'প্রতি m²',   value: fmt2(estimation.costPerSqm) },
                  { label: 'প্রতি sft',  value: fmt2(estimation.costPerSqft) },
                  { label: 'প্রতি Floor', value: fmt2(estimation.costPerFloor) },
                  { label: 'মোট Area',   value: `${project!.totalArea.toLocaleString()} m²` },
                ].map(m => (
                  <div key={m.label} className="bg-surface-900/60 rounded-lg px-3 py-2">
                    <p className="text-xs text-surface-500">{m.label}</p>
                    <p className="text-sm font-mono text-surface-200 font-medium">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Project info */}
              <div className="mt-4 pt-4 border-t border-surface-700">
                <div className="flex items-center gap-2 text-xs text-surface-500">
                  <Building2 size={12} />
                  <span>{project!.totalFloors} তলা • {project!.buildingType} • {project!.region}</span>
                </div>
                <p className="text-xs text-surface-600 mt-1">
                  তৈরি: {new Date(estimation.preparedAt).toLocaleDateString('bn-BD')} •
                  Validity: {estimation.validityDays} দিন
                </p>
              </div>
            </div>

            {/* Chart */}
            {showChart && (
              <div className="lg:col-span-2">
                <EstimationChart estimation={estimation} />
              </div>
            )}
          </div>

          {/* Line items by category */}
          <div className="space-y-3">
            {grouped.map((group, gi) => (
              <div key={group.id} className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => toggle(group.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-750 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {collapsed.has(group.id)
                      ? <ChevronRight size={15} className="text-surface-500" />
                      : <ChevronDown  size={15} className="text-surface-500" />}
                    <span className={`text-sm font-semibold ${group.color}`}>
                      {group.label}
                    </span>
                    <span className="text-xs text-surface-500">— {group.labelBn}</span>
                    <Badge variant="default">{group.items.length}</Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-surface-200 text-sm">{fmt(group.subtotal)}</span>
                    <span className="text-xs text-surface-500 ml-2">
                      ({estimation.directCost > 0
                        ? ((group.subtotal / estimation.directCost) * 100).toFixed(1)
                        : '0'}%)
                    </span>
                  </div>
                </button>

                {/* Items */}
                {!collapsed.has(group.id) && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-900/60 border-t border-b border-surface-700">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-surface-500">Description</th>
                          <th className="px-3 py-2 text-center text-xs text-surface-500 w-16">Unit</th>
                          <th className="px-3 py-2 text-right text-xs text-surface-500 w-24">Quantity</th>
                          <th className="px-3 py-2 text-right text-xs text-surface-500 w-28">Unit Rate ৳</th>
                          <th className="px-3 py-2 text-right text-xs text-surface-500 w-32">Amount ৳</th>
                          <th className="px-3 py-2 text-center text-xs text-surface-500 w-16">Source</th>
                          <th className="px-3 py-2 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-700/30">
                        {group.items.map(item => (
                          <tr key={item.id} className="hover:bg-surface-750/50 transition-colors group/row">
                            <td className="px-3 py-2.5 text-surface-200">{item.description}</td>
                            <td className="px-3 py-2.5 text-center text-surface-400 text-xs">{item.unit}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-surface-300">
                              {item.quantity.toLocaleString('en-BD', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-surface-300">
                              {fmt2(item.unitRate)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-surface-100">
                              {fmt2(item.amount)}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <SourceBadge source={item.source} />
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <button onClick={() => { setEditItem(item); setShowForm(true) }}
                                  className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-brand-400 hover:bg-surface-700 transition-colors">
                                  <Pencil size={11} />
                                </button>
                                <button onClick={() => deleteLineItem(project!.id, item.id)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-red-400 hover:bg-surface-700 transition-colors">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-surface-900/40 border-t border-surface-700">
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-xs font-medium text-surface-500 uppercase">
                            Subtotal — {group.label}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-surface-200">
                            {fmt2(group.subtotal)}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            ))}

            {/* Grand total */}
            <div className="bg-gradient-to-r from-brand-900/40 to-surface-800 border border-brand-700/40 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-400">Project Grand Total</p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Overhead + Profit + Markup + Contingency + VAT সহ
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-display font-bold text-brand-400">
                    {fmt(estimation.grandTotal)}
                  </p>
                  <p className="text-sm text-surface-400 mt-0.5">
                    ≈ {fmt2(estimation.costPerSqft)} ৳/sft
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" icon={<Trash2 size={13} />}
                onClick={() => { if (confirm('Estimation মুছবেন?')) clearEstimation(project!.id) }}>
                Clear Estimation
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Form modal */}
      {showForm && (
        <LineItemForm
          projectId={project!.id}
          editItem={editItem ?? undefined}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: string }) {
  const styles: Record<string, string> = {
    boq:        'bg-brand-900/40 text-brand-400',
    manual:     'bg-surface-700 text-surface-400',
    calculated: 'bg-purple-900/40 text-purple-400',
  }
  const labels: Record<string, string> = {
    boq: 'BOQ', manual: 'Manual', calculated: 'Calc'
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${styles[source] ?? 'bg-surface-700 text-surface-400'}`}>
      {labels[source] ?? source}
    </span>
  )
}
