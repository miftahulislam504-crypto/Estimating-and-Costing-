import React, { useState } from 'react'
import {
  Package, Zap, RefreshCw, Truck, CheckCircle2,
  Clock, XCircle, ChevronDown, ChevronRight, Pencil
} from 'lucide-react'
import { useProjectStore }      from '@/store/projectStore'
import { useTakeoffStore }      from '@/store/takeoffStore'
import { useProcurementStore }  from '@/store/procurementStore'
import { Button, StatCard, SectionHeader, EmptyState, Badge, Select } from '@/components/ui'
import { ProcurementChart }     from './ProcurementChart'
import type { ProcurementItem, ProcurementStatus } from '@/types'

const STATUS_CONFIG: Record<ProcurementStatus, { label: string; labelBn: string; icon: React.ReactNode; color: string; badge: string }> = {
  planned:   { label: 'Planned',   labelBn: 'পরিকল্পিত',  icon: <Clock       size={12} />, color: 'text-surface-400',  badge: 'default' },
  ordered:   { label: 'Ordered',   labelBn: 'অর্ডার করা', icon: <Truck       size={12} />, color: 'text-amber-400',    badge: 'warning' },
  delivered: { label: 'Delivered', labelBn: 'ডেলিভারি',   icon: <CheckCircle2 size={12}/>, color: 'text-emerald-400',  badge: 'success' },
  cancelled: { label: 'Cancelled', labelBn: 'বাতিল',      icon: <XCircle     size={12} />, color: 'text-red-400',      badge: 'danger'  },
}

const fmt  = (n: number) => '৳ ' + Math.round(n).toLocaleString('en-BD')

export function ProcurementDashboard() {
  const { activeProject }  = useProjectStore()
  const { getSummary }     = useTakeoffStore()
  const { getPlan, autoGenerate, updateItem, clearPlan } = useProcurementStore()

  const project = activeProject()
  const [months, setMonths]           = useState(12)
  const [expandedMonth, setExpandedMonth] = useState<number | null>(0)
  const [editItem, setEditItem]       = useState<ProcurementItem | null>(null)

  if (!project) return (
    <EmptyState icon={<Package size={28} />} title="কোনো প্রজেক্ট নেই" description="Dashboard থেকে প্রজেক্ট খুলুন।" />
  )

  const summary = getSummary(project.id)
  const plan    = getPlan(project.id)

  function handleAutoGenerate() {
    if (!summary || summary.elements.length === 0) {
      alert('প্রথমে Quantity Takeoff-এ Elements যোগ করুন।')
      return
    }
    autoGenerate(project.id, summary, months)
  }

  // Stats
  const totalItems    = plan?.items.length ?? 0
  const orderedItems  = plan?.items.filter(i => i.status === 'ordered').length ?? 0
  const deliveredItems = plan?.items.filter(i => i.status === 'delivered').length ?? 0
  const totalCost     = plan?.totalCost ?? 0

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Procurement Plan"
        subtitle={`${project.name} — Material Procurement Schedule`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              label=""
              value={String(months)}
              onChange={e => setMonths(+e.target.value)}
              options={[3,6,9,12,18,24].map(m => ({ value: String(m), label: `${m} মাস` }))}
              className="w-28"
            />
            <Button size="sm" icon={<Zap size={14} />} onClick={handleAutoGenerate}>
              Auto Generate
            </Button>
          </div>
        }
      />

      {/* Empty */}
      {!plan ? (
        <EmptyState
          icon={<Package size={28} />}
          title="Procurement Plan নেই"
          description="Quantity Takeoff থেকে Auto Generate করুন। Material quantities ও monthly schedule তৈরি হবে।"
          action={
            <div className="flex items-center gap-3">
              <Select
                label=""
                value={String(months)}
                onChange={e => setMonths(+e.target.value)}
                options={[6,9,12,18,24].map(m => ({ value: String(m), label: `${m} মাস মেয়াদ` }))}
              />
              <Button icon={<Zap size={16} />} onClick={handleAutoGenerate}>
                Auto Generate Plan
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="মোট Materials" value={totalItems}          color="teal"   />
            <StatCard label="Ordered"        value={orderedItems}        color="amber"  />
            <StatCard label="Delivered"      value={deliveredItems}      color="green"  />
            <StatCard label="মোট Cost"        value={fmt(totalCost)}      color="purple" />
          </div>

          {/* Chart */}
          <div className="mb-6">
            <ProcurementChart plan={plan} />
          </div>

          {/* Material List */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
              <Package size={16} className="text-brand-400" />
              Material Requirements
            </h3>
            <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-900/80 border-b border-surface-700">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs text-surface-500 uppercase tracking-wider">Material</th>
                      <th className="px-3 py-2.5 text-center text-xs text-surface-500 uppercase tracking-wider">Unit</th>
                      <th className="px-3 py-2.5 text-right text-xs text-surface-500 uppercase tracking-wider">Total Qty</th>
                      <th className="px-3 py-2.5 text-right text-xs text-surface-500 uppercase tracking-wider">Rate ৳</th>
                      <th className="px-3 py-2.5 text-right text-xs text-surface-500 uppercase tracking-wider">Total Cost ৳</th>
                      <th className="px-3 py-2.5 text-center text-xs text-surface-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2.5 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-700/40">
                    {plan.items.map(item => {
                      const sc = STATUS_CONFIG[item.status]
                      const isEditing = editItem?.id === item.id

                      return (
                        <tr key={item.id} className="hover:bg-surface-750/50 transition-colors group/row">
                          <td className="px-3 py-2.5">
                            <div>
                              <p className="text-surface-100 font-medium">{item.material}</p>
                              <p className="text-xs text-surface-500">{item.materialBn}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center text-surface-400 text-xs font-mono">
                            {item.unit}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-surface-200">
                            {item.totalQty.toLocaleString('en-BD', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-surface-300">
                            {item.unitRate.toLocaleString('en-BD')}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold text-surface-100">
                            {Math.round(item.totalCost).toLocaleString('en-BD')}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {isEditing ? (
                              <select
                                value={editItem.status}
                                onChange={e => {
                                  const s = e.target.value as ProcurementStatus
                                  updateItem(project.id, item.id, { status: s })
                                  setEditItem(null)
                                }}
                                onBlur={() => setEditItem(null)}
                                autoFocus
                                className="bg-surface-900 border border-brand-500 rounded px-2 py-1 text-xs text-surface-200 focus:outline-none"
                              >
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                  <option key={k} value={k} className="bg-surface-900">{v.label}</option>
                                ))}
                              </select>
                            ) : (
                              <button
                                onClick={() => setEditItem(item)}
                                className="flex items-center gap-1 mx-auto"
                              >
                                <Badge variant={sc.badge as any}>
                                  <span className="flex items-center gap-1">
                                    {sc.icon}{sc.labelBn}
                                  </span>
                                </Badge>
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => setEditItem(item)}
                              className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-brand-400 hover:bg-surface-700 transition-colors opacity-0 group-hover/row:opacity-100"
                            >
                              <Pencil size={11} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-surface-600 bg-surface-900/50">
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-xs font-bold text-surface-400 uppercase tracking-wider">
                        মোট Procurement Cost
                      </td>
                      <td className="px-3 py-3 text-right font-display font-bold text-brand-400">
                        {Math.round(totalCost).toLocaleString('en-BD')}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Monthly Schedule */}
          <div>
            <h3 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
              <RefreshCw size={16} className="text-brand-400" />
              Monthly Schedule
            </h3>
            <div className="space-y-2">
              {plan.schedule.map((month, mi) => (
                <div key={mi} className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
                  {/* Month header */}
                  <button
                    onClick={() => setExpandedMonth(expandedMonth === mi ? null : mi)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-750 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedMonth === mi
                        ? <ChevronDown  size={15} className="text-surface-500" />
                        : <ChevronRight size={15} className="text-surface-500" />}
                      <span className="font-medium text-surface-200">{month.label}</span>
                      <Badge variant="default">{month.items.length} materials</Badge>
                    </div>
                    <span className="font-mono font-semibold text-brand-400">
                      {fmt(month.totalCost)}
                    </span>
                  </button>

                  {/* Month items */}
                  {expandedMonth === mi && (
                    <div className="border-t border-surface-700 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-surface-900/60">
                          <tr>
                            <th className="px-3 py-2 text-left text-surface-500">Material</th>
                            <th className="px-3 py-2 text-center text-surface-500">Unit</th>
                            <th className="px-3 py-2 text-right text-surface-500">Quantity</th>
                            <th className="px-3 py-2 text-right text-surface-500">Rate ৳</th>
                            <th className="px-3 py-2 text-right text-surface-500">Cost ৳</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-700/30">
                          {month.items.map((item, ii) => (
                            <tr key={ii} className="hover:bg-surface-750/30">
                              <td className="px-3 py-2 text-surface-300">{item.material}</td>
                              <td className="px-3 py-2 text-center text-surface-500 font-mono">{item.unit}</td>
                              <td className="px-3 py-2 text-right font-mono text-surface-200">
                                {item.quantity.toLocaleString('en-BD', { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-surface-400">
                                {item.unitRate.toLocaleString('en-BD')}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-semibold text-surface-100">
                                {Math.round(item.cost).toLocaleString('en-BD')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-surface-600">
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-right text-xs font-semibold text-surface-400">
                              Month Subtotal
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-brand-400">
                              {Math.round(month.totalCost).toLocaleString('en-BD')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-4">
            <Button variant="ghost" size="sm"
              onClick={() => { if (confirm('Plan মুছবেন?')) clearPlan(project.id) }}>
              Clear Plan
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
