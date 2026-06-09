import React, { useState } from 'react'
import {
  Zap, Plus, Trash2, Pencil, BarChart3,
  TrendingUp, TrendingDown, Minus, RefreshCw
} from 'lucide-react'
import { useProjectStore }    from '@/store/projectStore'
import { useEstimationStore } from '@/store/estimationStore'
import { useBudgetStore, BUDGET_CATEGORIES, buildBudgetFromEstimation } from '@/store/budgetStore'
import { Button, StatCard, SectionHeader, EmptyState, Badge } from '@/components/ui'
import { BudgetChart }        from './BudgetChart'
import { BudgetLineForm }     from './BudgetLineForm'
import type { BudgetLine, BudgetCategory } from '@/types'

const fmt  = (n: number) => '৳ ' + Math.round(n).toLocaleString('en-BD')
const fmt2 = (n: number) => Math.round(n).toLocaleString('en-BD')

export function BudgetDashboard() {
  const { activeProject }   = useProjectStore()
  const { getEstimation }   = useEstimationStore()
  const { getBudget, setBudget, updateActual, deleteLine, clearBudget } = useBudgetStore()

  const project    = activeProject()
  const [showForm, setShowForm]   = useState(false)
  const [editLine, setEditLine]   = useState<BudgetLine | null>(null)
  const [editActualId, setEditActualId] = useState<string | null>(null)
  const [actualVal, setActualVal]       = useState(0)

  if (!project) return (
    <EmptyState icon={<BarChart3 size={28} />} title="কোনো প্রজেক্ট নেই" description="Dashboard থেকে প্রজেক্ট খুলুন।" />
  )

  const estimation = getEstimation(project!.id)
  const budget     = getBudget(project!.id)

  function handleAutoGenerate() {
    if (!estimation) { alert('প্রথমে Cost Estimation তৈরি করুন।'); return }
    const b = buildBudgetFromEstimation(project!.id, estimation, project!.costSettings.contingencyPct)
    setBudget(b)
  }

  function startEditActual(line: BudgetLine) {
    setEditActualId(line.id)
    setActualVal(line.actual)
  }

  function commitActual(lineId: string) {
    updateActual(project!.id, lineId, actualVal)
    setEditActualId(null)
  }

  const spentPct = budget && budget.totalAllocated > 0
    ? (budget.totalActual / budget.totalAllocated) * 100
    : 0

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Project Budget"
        subtitle={`${project!.name} — Budget Allocation & Tracking`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Zap size={14} />} onClick={handleAutoGenerate}>
              Estimation থেকে Generate
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(true)}>
              Line যোগ
            </Button>
          </div>
        }
      />

      {/* Empty */}
      {!budget ? (
        <EmptyState
          icon={<BarChart3 size={28} />}
          title="Budget তৈরি হয়নি"
          description="Cost Estimation থেকে Auto Generate করুন অথবা manually budget line যোগ করুন।"
          action={
            <div className="flex gap-3">
              <Button icon={<Zap size={16} />} onClick={handleAutoGenerate}>
                Auto Generate Budget
              </Button>
              <Button variant="outline" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
                Manual Entry
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="মোট Budget"
              value={fmt(budget.totalAllocated)}
              color="teal"
            />
            <StatCard
              label="Actual Spent"
              value={fmt(budget.totalActual)}
              color={budget.totalActual > budget.totalAllocated ? 'red' : 'amber'}
            />
            <StatCard
              label="Remaining"
              value={fmt(budget.totalVariance)}
              color={budget.totalVariance < 0 ? 'red' : 'green'}
            />
            <StatCard
              label="খরচ হয়েছে"
              value={`${spentPct.toFixed(1)}%`}
              color="purple"
            />
          </div>

          {/* Progress bar */}
          <div className="mb-6 bg-surface-800 border border-surface-700 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-surface-400">Budget Utilization</span>
              <span className={`text-sm font-semibold ${
                spentPct > 90 ? 'text-red-400' : spentPct > 70 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {spentPct.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-surface-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  spentPct > 100 ? 'bg-red-500' : spentPct > 80 ? 'bg-amber-500' : 'bg-brand-500'
                }`}
                style={{ width: `${Math.min(spentPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-surface-500">
              <span>{fmt(budget.totalActual)} spent</span>
              <span>{fmt(budget.totalAllocated)} allocated</span>
            </div>
          </div>

          {/* Chart + Table grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <BudgetTable
                budget={budget}
                projectId={project!.id}
                editActualId={editActualId}
                actualVal={actualVal}
                setActualVal={setActualVal}
                onStartEditActual={startEditActual}
                onCommitActual={commitActual}
                onEditLine={(line) => { setEditLine(line); setShowForm(true) }}
                onDeleteLine={(id) => deleteLine(project!.id, id)}
              />
            </div>
            <BudgetChart budget={budget} />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center">
            <p className="text-xs text-surface-600">
              Version {budget.version} • Updated {new Date(budget.updatedAt).toLocaleDateString('bn-BD')}
            </p>
            <Button variant="ghost" size="sm" icon={<Trash2 size={13} />}
              onClick={() => { if (confirm('Budget মুছবেন?')) clearBudget(project!.id) }}>
              Clear
            </Button>
          </div>
        </>
      )}

      {/* Form modal */}
      {showForm && (
        <BudgetLineForm
          projectId={project!.id}
          editLine={editLine ?? undefined}
          onClose={() => { setShowForm(false); setEditLine(null) }}
        />
      )}
    </div>
  )
}

// ─── Budget Table ─────────────────────────────────────────────────────────────

function BudgetTable({
  budget, projectId,
  editActualId, actualVal, setActualVal,
  onStartEditActual, onCommitActual, onEditLine, onDeleteLine
}: {
  budget: import('@/types').ProjectBudget
  projectId: string
  editActualId: string | null
  actualVal: number
  setActualVal: (v: number) => void
  onStartEditActual: (l: BudgetLine) => void
  onCommitActual: (id: string) => void
  onEditLine: (l: BudgetLine) => void
  onDeleteLine: (id: string) => void
}) {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-900/80 border-b border-surface-700">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs text-surface-500 uppercase tracking-wider">Category</th>
              <th className="px-3 py-2.5 text-right text-xs text-surface-500 uppercase tracking-wider">Allocated ৳</th>
              <th className="px-3 py-2.5 text-right text-xs text-surface-500 uppercase tracking-wider">Actual ৳</th>
              <th className="px-3 py-2.5 text-right text-xs text-surface-500 uppercase tracking-wider">Variance ৳</th>
              <th className="px-3 py-2.5 text-center text-xs text-surface-500 uppercase tracking-wider w-16">%</th>
              <th className="px-3 py-2.5 text-center text-xs text-surface-500 w-12">Progress</th>
              <th className="px-3 py-2.5 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700/40">
            {budget.lines.map(line => {
              const cat     = BUDGET_CATEGORIES.find(c => c.id === line.category)
              const usedPct = line.allocated > 0 ? (line.actual / line.allocated) * 100 : 0
              const isOver  = line.actual > line.allocated
              const isEdit  = editActualId === line.id

              return (
                <tr key={line.id} className="hover:bg-surface-750/50 transition-colors group/row">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span>{cat?.icon ?? '📦'}</span>
                      <div>
                        <p className={`text-sm font-medium ${cat?.color ?? 'text-surface-300'}`}>
                          {cat?.label ?? line.category}
                        </p>
                        <p className="text-xs text-surface-500">{cat?.labelBn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-surface-200">
                    {Math.round(line.allocated).toLocaleString('en-BD')}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {isEdit ? (
                      <input
                        type="number"
                        value={actualVal}
                        onChange={e => setActualVal(+e.target.value)}
                        onBlur={() => onCommitActual(line.id)}
                        onKeyDown={e => e.key === 'Enter' && onCommitActual(line.id)}
                        autoFocus
                        className="w-28 bg-surface-900 border border-brand-500 rounded px-2 py-1 text-right font-mono text-sm text-white focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => onStartEditActual(line)}
                        className={`font-mono hover:text-brand-300 transition-colors ${
                          isOver ? 'text-red-400 font-semibold' : 'text-surface-300'
                        }`}
                      >
                        {Math.round(line.actual).toLocaleString('en-BD')}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isOver
                        ? <TrendingUp   size={12} className="text-red-400" />
                        : line.variance > 0
                          ? <TrendingDown size={12} className="text-emerald-400" />
                          : <Minus size={12} className="text-surface-500" />
                      }
                      <span className={`font-mono text-sm ${
                        isOver ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {isOver ? '-' : '+'}{Math.abs(Math.round(line.variance)).toLocaleString('en-BD')}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-xs font-mono text-surface-400">
                      {line.percent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="w-full bg-surface-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          usedPct > 100 ? 'bg-red-500' : usedPct > 80 ? 'bg-amber-500' : 'bg-brand-500'
                        }`}
                        style={{ width: `${Math.min(usedPct, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button onClick={() => onEditLine(line)}
                        className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-brand-400 hover:bg-surface-700 transition-colors">
                        <Pencil size={11} />
                      </button>
                      <button onClick={() => onDeleteLine(line.id)}
                        className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-red-400 hover:bg-surface-700 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t-2 border-surface-600 bg-surface-900/50">
            <tr>
              <td className="px-3 py-3 text-sm font-bold text-white">মোট</td>
              <td className="px-3 py-3 text-right font-mono font-bold text-brand-400">
                {Math.round(budget.totalAllocated).toLocaleString('en-BD')}
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-amber-400">
                {Math.round(budget.totalActual).toLocaleString('en-BD')}
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400">
                {Math.round(budget.totalVariance).toLocaleString('en-BD')}
              </td>
              <td className="px-3 py-3 text-center text-xs font-mono text-surface-400">100%</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
