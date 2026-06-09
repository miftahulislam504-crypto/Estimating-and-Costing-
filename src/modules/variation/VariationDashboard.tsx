import React, { useState } from 'react'
import {
  GitCompare, Plus, Zap, Pencil, Trash2,
  CheckCircle, XCircle, Clock, Wrench, ChevronDown, ChevronRight
} from 'lucide-react'
import { useProjectStore }    from '@/store/projectStore'
import { useEstimationStore } from '@/store/estimationStore'
import { useVariationStore }  from '@/store/variationStore'
import { Button, StatCard, SectionHeader, EmptyState, Badge } from '@/components/ui'
import { VariationForm }      from './VariationForm'
import type { VariationItem, VariationStatus, VariationType } from '@/types'

const STATUS_CONFIG: Record<VariationStatus, { label: string; labelBn: string; color: string; badge: string; icon: React.ReactNode }> = {
  pending:     { label: 'Pending',     labelBn: 'অপেক্ষমাণ',    color: 'text-amber-400',   badge: 'warning', icon: <Clock       size={12} /> },
  approved:    { label: 'Approved',    labelBn: 'অনুমোদিত',    color: 'text-emerald-400', badge: 'success', icon: <CheckCircle size={12} /> },
  rejected:    { label: 'Rejected',    labelBn: 'প্রত্যাখ্যাত', color: 'text-red-400',     badge: 'danger',  icon: <XCircle     size={12} /> },
  implemented: { label: 'Implemented', labelBn: 'বাস্তবায়িত',  color: 'text-brand-400',   badge: 'info',    icon: <Wrench      size={12} /> },
}

const TYPE_LABELS: Record<VariationType, { label: string; labelBn: string; color: string }> = {
  addition:     { label: 'Addition',     labelBn: 'সংযোজন',   color: 'text-emerald-400' },
  omission:     { label: 'Omission',     labelBn: 'বাদ দেওয়া', color: 'text-red-400' },
  substitution: { label: 'Substitution', labelBn: 'প্রতিস্থাপন', color: 'text-amber-400' },
}

const fmt = (n: number) => '৳ ' + Math.round(Math.abs(n)).toLocaleString('en-BD')

export function VariationDashboard() {
  const { activeProject }   = useProjectStore()
  const { getEstimation }   = useEstimationStore()
  const { getRegister, updateStatus, deleteItem, setOriginalCost, clearRegister } = useVariationStore()

  const project = activeProject()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<VariationItem | null>(null)
  const [filter, setFilter]     = useState<VariationStatus | 'all'>('all')

  if (!project) return (
    <EmptyState icon={<GitCompare size={28} />} title="কোনো প্রজেক্ট নেই" description="Dashboard থেকে প্রজেক্ট খুলুন।" />
  )

  const estimation = getEstimation(project.id)
  const origCost   = estimation?.grandTotal ?? 0
  const register   = getRegister(project.id, origCost)

  // Sync original cost if estimation exists
  if (estimation && register.originalCost !== estimation.grandTotal) {
    setOriginalCost(project.id, estimation.grandTotal)
  }

  const filtered = filter === 'all'
    ? register.items
    : register.items.filter(i => i.status === filter)

  const pendingCount  = register.items.filter(i => i.status === 'pending').length
  const approvedItems = register.items.filter(i => i.status === 'approved' || i.status === 'implemented')
  const extraCost     = approvedItems.filter(i => i.amount > 0).reduce((s, i) => s + i.amount, 0)
  const creditCost    = approvedItems.filter(i => i.amount < 0).reduce((s, i) => s + i.amount, 0)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Variation & Change Orders"
        subtitle={`${project.name} — Original BOQ vs Revised`}
        action={
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(true)}>
            নতুন VO
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Original Cost"  value={fmt(register.originalCost)} color="teal"   />
        <StatCard label="Extra Cost"     value={fmt(extraCost)}             color="amber"  />
        <StatCard label="Credit"         value={fmt(Math.abs(creditCost))}  color="green"  />
        <StatCard label="Revised Cost"   value={fmt(register.revisedCost)}  color={register.netVariation > 0 ? 'red' : 'purple'} />
      </div>

      {/* Net variation bar */}
      {register.originalCost > 0 && (
        <div className="mb-6 bg-surface-800 border border-surface-700 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-surface-400">Net Variation</span>
            <span className={`text-sm font-semibold font-mono ${
              register.netVariation > 0 ? 'text-red-400' : register.netVariation < 0 ? 'text-emerald-400' : 'text-surface-400'
            }`}>
              {register.netVariation > 0 ? '+' : ''}{fmt(register.netVariation)}
              {register.originalCost > 0 && (
                <span className="text-xs ml-1 opacity-70">
                  ({((register.netVariation / register.originalCost) * 100).toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
          <div className="flex gap-1">
            {/* Original */}
            <div className="flex-1 h-3 bg-brand-600/60 rounded-l-full" title="Original" />
            {/* Variation */}
            {register.netVariation !== 0 && (
              <div
                className={`h-3 rounded-r-full ${register.netVariation > 0 ? 'bg-red-500/70' : 'bg-emerald-500/70'}`}
                style={{ width: `${Math.min(Math.abs(register.netVariation / register.originalCost) * 100, 30)}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-surface-500 mt-1">
            <span>{fmt(register.originalCost)} original</span>
            <span className="font-semibold text-surface-300">{fmt(register.revisedCost)} revised</span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-surface-900 border border-surface-700 rounded-xl p-1 overflow-x-auto">
        {(['all', 'pending', 'approved', 'implemented', 'rejected'] as const).map(s => {
          const count = s === 'all' ? register.items.length : register.items.filter(i => i.status === s).length
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                filter === s ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              }`}
            >
              {s !== 'all' && STATUS_CONFIG[s].icon}
              {s === 'all' ? 'সব' : STATUS_CONFIG[s].labelBn}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === s ? 'bg-white/20' : 'bg-surface-700'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Empty */}
      {register.items.length === 0 ? (
        <EmptyState
          icon={<GitCompare size={28} />}
          title="কোনো Variation নেই"
          description="Construction চলাকালীন BOQ পরিবর্তন এখানে track করুন।"
          action={
            <Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
              প্রথম Variation যোগ করুন
            </Button>
          }
        />
      ) : (
        <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-900/80 border-b border-surface-700">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs text-surface-500 uppercase tracking-wider w-20">VO No</th>
                  <th className="px-3 py-2.5 text-left text-xs text-surface-500 uppercase tracking-wider">Description</th>
                  <th className="px-3 py-2.5 text-center text-xs text-surface-500 uppercase tracking-wider w-24">Type</th>
                  <th className="px-3 py-2.5 text-center text-xs text-surface-500 uppercase tracking-wider w-24">Status</th>
                  <th className="px-3 py-2.5 text-right text-xs text-surface-500 uppercase tracking-wider w-32">Amount ৳</th>
                  <th className="px-3 py-2.5 text-left text-xs text-surface-500 uppercase tracking-wider w-24">Date</th>
                  <th className="px-3 py-2.5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/40">
                {filtered.map(item => {
                  const sc  = STATUS_CONFIG[item.status]
                  const tc  = TYPE_LABELS[item.type]
                  const isExtra = item.amount > 0

                  return (
                    <tr key={item.id} className="hover:bg-surface-750/50 transition-colors group/row">
                      <td className="px-3 py-2.5 font-mono text-xs text-brand-400 font-semibold">
                        {item.voNo}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-surface-200 font-medium">{item.description}</p>
                        <p className="text-xs text-surface-500">{item.reason}</p>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs font-medium ${tc.color}`}>{tc.labelBn}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => {
                            const next: VariationStatus[] = ['pending','approved','implemented','rejected']
                            const idx  = next.indexOf(item.status)
                            const nxt  = next[(idx + 1) % next.length]
                            updateStatus(project!.id, item.id, nxt)
                          }}
                          className="flex items-center gap-1 mx-auto"
                        >
                          <Badge variant={sc.badge as any}>
                            <span className="flex items-center gap-1">{sc.icon}{sc.labelBn}</span>
                          </Badge>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`font-mono font-semibold ${isExtra ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isExtra ? '+' : '−'}{fmt(item.amount)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-surface-500">
                        {new Date(item.raisedDate).toLocaleDateString('en-BD')}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button onClick={() => { setEditItem(item); setShowForm(true) }}
                            className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-brand-400 hover:bg-surface-700 transition-colors">
                            <Pencil size={11} />
                          </button>
                          <button onClick={() => deleteItem(project!.id, item.id)}
                            className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-red-400 hover:bg-surface-700 transition-colors">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Summary footer */}
              <tfoot className="border-t-2 border-surface-600 bg-surface-900/60">
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-xs font-bold text-surface-400 uppercase tracking-wider">
                    Approved Net Variation
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-lg">
                    <span className={register.netVariation > 0 ? 'text-red-400' : register.netVariation < 0 ? 'text-emerald-400' : 'text-surface-400'}>
                      {register.netVariation > 0 ? '+' : ''}{fmt(register.netVariation)}
                    </span>
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      {register.items.length > 0 && (
        <div className="flex justify-end mt-3">
          <Button variant="ghost" size="sm"
            onClick={() => { if (confirm('সব Variation মুছবেন?')) clearRegister(project!.id) }}>
            Clear All
          </Button>
        </div>
      )}

      {showForm && (
        <VariationForm
          projectId={project!.id}
          editItem={editItem ?? undefined}
          nextVONo={`VO-${String(register.items.length + 1).padStart(3, '0')}`}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}
