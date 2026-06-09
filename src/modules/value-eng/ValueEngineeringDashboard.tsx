import React, { useState } from 'react'
import { Lightbulb, Zap, Plus, Pencil, Trash2, TrendingDown, CheckCircle, XCircle, Clock, Search } from 'lucide-react'
import { useProjectStore }  from '@/store/projectStore'
import { useTakeoffStore }  from '@/store/takeoffStore'
import { useEstimationStore } from '@/store/estimationStore'
import { useVEStore }       from '@/store/veStore'
import { Button, StatCard, SectionHeader, EmptyState, Badge } from '@/components/ui'
import { VEForm }           from './VEForm'
import type { ValueEngineeringItem, VEStatus, VECategory } from '@/types'

const STATUS_CONFIG: Record<VEStatus, { labelBn: string; color: string; badge: string; icon: React.ReactNode }> = {
  proposed:     { labelBn: 'প্রস্তাবিত',    color: 'text-amber-400',   badge: 'warning', icon: <Clock       size={12} /> },
  under_review: { labelBn: 'পর্যালোচনা',   color: 'text-blue-400',    badge: 'info',    icon: <Search      size={12} /> },
  accepted:     { labelBn: 'গৃহীত',        color: 'text-emerald-400', badge: 'success', icon: <CheckCircle size={12} /> },
  rejected:     { labelBn: 'প্রত্যাখ্যাত', color: 'text-red-400',     badge: 'danger',  icon: <XCircle     size={12} /> },
}

const CAT_LABELS: Record<VECategory, string> = {
  structural:  '🏗️ কাঠামো',
  material:    '🧱 উপকরণ',
  method:      '⚙️ পদ্ধতি',
  design:      '📐 ডিজাইন',
  procurement: '📦 ক্রয়',
}

const RISK_CONFIG = {
  low:    { labelBn: 'কম',    color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-800/40' },
  medium: { labelBn: 'মাঝারি', color: 'text-amber-400',   bg: 'bg-amber-900/20   border-amber-800/40' },
  high:   { labelBn: 'বেশি',  color: 'text-red-400',     bg: 'bg-red-900/20     border-red-800/40' },
}

const fmt = (n: number) => '৳ ' + Math.round(n).toLocaleString('en-BD')

export function ValueEngineeringDashboard() {
  const { activeProject }   = useProjectStore()
  const { getSummary }      = useTakeoffStore()
  const { getEstimation }   = useEstimationStore()
  const { getRegister, generateSuggestions, updateStatus, deleteItem, clearRegister } = useVEStore()

  const project    = activeProject()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<ValueEngineeringItem | null>(null)
  const [filter, setFilter]     = useState<VEStatus | 'all'>('all')

  if (!project) return (
    <EmptyState icon={<Lightbulb size={28} />} title="কোনো প্রজেক্ট নেই" description="Dashboard থেকে প্রজেক্ট খুলুন।" />
  )

  const summary    = getSummary(project!.id)
  const estimation = getEstimation(project!.id)
  const register   = getRegister(project!.id)

  function handleGenerate() {
    if (!summary || summary.elements.length === 0) { alert('প্রথমে Quantity Takeoff সম্পন্ন করুন।'); return }
    generateSuggestions(project!.id, summary, estimation?.grandTotal ?? 0, 'System')
  }

  const items    = register?.items ?? []
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)

  const totalSaving    = register?.totalPotentialSaving ?? 0
  const acceptedSaving = register?.totalAcceptedSaving  ?? 0
  const accepted       = items.filter(i => i.status === 'accepted').length
  const pending        = items.filter(i => i.status === 'proposed' || i.status === 'under_review').length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Value Engineering"
        subtitle={`${project!.name} — Cost Optimization Suggestions`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Zap size={14} />} onClick={handleGenerate}>
              Auto Suggestions
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(true)}>
              নতুন Proposal
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="মোট Proposals"    value={items.length}     color="teal"   />
        <StatCard label="গৃহীত"            value={accepted}         color="green"  />
        <StatCard label="Pending Review"   value={pending}          color="amber"  />
        <StatCard label="Accepted Saving"  value={fmt(acceptedSaving)} color="purple" />
      </div>

      {/* Potential saving highlight */}
      {totalSaving > 0 && (
        <div className="mb-6 bg-gradient-to-r from-emerald-900/30 to-surface-800 border border-emerald-700/40 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={18} className="text-emerald-400" />
              <p className="font-semibold text-white">Total Potential Saving</p>
            </div>
            <p className="text-xs text-surface-400">
              {items.length} proposals — সব গৃহীত হলে সাশ্রয়
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display font-bold text-emerald-400">{fmt(totalSaving)}</p>
            {estimation && (
              <p className="text-xs text-surface-500 mt-0.5">
                Project cost-এর {((totalSaving / estimation.grandTotal) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={28} />}
          title="কোনো VE Proposal নেই"
          description="Auto Suggestions চালান অথবা manually proposal যোগ করুন।"
          action={
            <div className="flex gap-3">
              <Button icon={<Zap size={16} />} onClick={handleGenerate}>Auto Generate</Button>
              <Button variant="outline" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>Manual</Button>
            </div>
          }
        />
      ) : (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 mb-4 bg-surface-900 border border-surface-700 rounded-xl p-1 overflow-x-auto">
            {(['all','proposed','under_review','accepted','rejected'] as const).map(s => {
              const count = s === 'all' ? items.length : items.filter(i => i.status === s).length
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
                  {count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === s ? 'bg-white/20' : 'bg-surface-700'}`}>{count}</span>}
                </button>
              )
            })}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(item => (
              <VECard
                key={item.id}
                item={item}
                onAccept={() => updateStatus(project!.id, item.id, 'accepted')}
                onReject={() => updateStatus(project!.id, item.id, 'rejected')}
                onReview={() => updateStatus(project!.id, item.id, 'under_review')}
                onEdit={() => { setEditItem(item); setShowForm(true) }}
                onDelete={() => deleteItem(project!.id, item.id)}
              />
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="ghost" size="sm"
              onClick={() => { if (confirm('সব proposals মুছবেন?')) clearRegister(project!.id) }}>
              Clear All
            </Button>
          </div>
        </>
      )}

      {showForm && (
        <VEForm
          projectId={project!.id}
          editItem={editItem ?? undefined}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}

// ─── VE Card ─────────────────────────────────────────────────────────────────

function VECard({
  item, onAccept, onReject, onReview, onEdit, onDelete
}: {
  item:     ValueEngineeringItem
  onAccept: () => void
  onReject: () => void
  onReview: () => void
  onEdit:   () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const sc   = STATUS_CONFIG[item.status]
  const risk = RISK_CONFIG[item.riskLevel]

  return (
    <div className={`bg-surface-800 border rounded-xl overflow-hidden transition-all ${
      item.status === 'accepted' ? 'border-emerald-700/50' :
      item.status === 'rejected' ? 'border-surface-700 opacity-60' : 'border-surface-700'
    }`}>
      {/* Saving bar */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs text-surface-500">{CAT_LABELS[item.category]}</span>
              <Badge variant={sc.badge as any}>
                <span className="flex items-center gap-1">{sc.icon}{sc.labelBn}</span>
              </Badge>
            </div>
            <h3 className="font-semibold text-white">{item.titleBn}</h3>
            <p className="text-xs text-surface-400">{item.title}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-surface-500 mb-0.5">সম্ভাব্য সাশ্রয়</p>
            <p className="text-xl font-display font-bold text-emerald-400">
              {fmt(item.potentialSaving)}
            </p>
            <p className="text-xs text-emerald-400/70">({item.savingPercent}% কম)</p>
          </div>
        </div>

        {/* Cost comparison */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-surface-900/60 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-surface-500 mb-0.5">Original</p>
            <p className="text-sm font-mono text-surface-300">{fmt(item.originalCost)}</p>
          </div>
          <div className="bg-surface-900/60 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-surface-500 mb-0.5">Proposed</p>
            <p className="text-sm font-mono text-brand-300">{fmt(item.proposedCost)}</p>
          </div>
          <div className={`rounded-lg px-3 py-2 text-center border ${risk.bg}`}>
            <p className="text-xs text-surface-500 mb-0.5">Risk</p>
            <p className={`text-sm font-semibold ${risk.color}`}>{risk.labelBn}</p>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-surface-500 hover:text-surface-300 transition-colors mb-2"
        >
          {expanded ? '▲ কম দেখুন' : '▼ বিস্তারিত'}
        </button>

        {expanded && (
          <div className="space-y-2 mb-3 text-xs text-surface-400">
            <div className="bg-surface-900/50 rounded-lg p-3">
              <p className="text-surface-500 font-medium mb-1">বর্তমান পদ্ধতি:</p>
              <p>{item.originalMethod}</p>
            </div>
            <div className="bg-brand-900/20 rounded-lg p-3">
              <p className="text-brand-400 font-medium mb-1">প্রস্তাবিত পদ্ধতি:</p>
              <p>{item.proposedMethod}</p>
            </div>
            <div className="flex justify-between">
              <span>⏱️ {item.implementationTime}</span>
              <span>👷 {item.proposedBy}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-surface-700">
          {item.status !== 'accepted' && (
            <Button variant="outline" size="sm" className="flex-1 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/20"
              onClick={onAccept}>
              ✓ গ্রহণ
            </Button>
          )}
          {item.status === 'proposed' && (
            <Button variant="ghost" size="sm" className="flex-1" onClick={onReview}>
              🔍 Review
            </Button>
          )}
          {item.status !== 'rejected' && item.status !== 'accepted' && (
            <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-900/20"
              onClick={onReject}>
              ✗
            </Button>
          )}
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
  )
}
