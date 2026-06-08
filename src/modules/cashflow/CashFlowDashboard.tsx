import React, { useState } from 'react'
import {
  TrendingUp, Zap, RefreshCw, AlertTriangle,
  ArrowUpRight, ArrowDownRight, DollarSign
} from 'lucide-react'
import { useProjectStore }    from '@/store/projectStore'
import { useEstimationStore } from '@/store/estimationStore'
import { useCashFlowStore, buildCashFlow } from '@/store/cashFlowStore'
import { Button, StatCard, SectionHeader, EmptyState, Input, Select } from '@/components/ui'
import { CashFlowChart }      from './CashFlowChart'
import { CashFlowTable }      from './CashFlowTable'

const fmt = (n: number) => '৳ ' + Math.round(Math.abs(n)).toLocaleString('en-BD')

export function CashFlowDashboard() {
  const { activeProject }   = useProjectStore()
  const { getEstimation }   = useEstimationStore()
  const { getPlan, setPlan, clearPlan } = useCashFlowStore()

  const project  = activeProject()

  const [config, setConfig] = useState({
    durationMonths: 12,
    advancePct:     10,
    retentionPct:   5,
    billingCycle:   1,
  })
  const [view, setView] = useState<'chart' | 'table'>('chart')

  if (!project) return (
    <EmptyState
      icon={<TrendingUp size={28} />}
      title="কোনো প্রজেক্ট নেই"
      description="Dashboard থেকে প্রজেক্ট খুলুন।"
    />
  )

  const estimation = getEstimation(project.id)
  const plan       = getPlan(project.id)

  function handleGenerate() {
    if (!estimation) { alert('প্রথমে Cost Estimation তৈরি করুন।'); return }
    const cf = buildCashFlow(
      project.id, estimation, project.costSettings,
      config.durationMonths,
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      config.advancePct,
      config.retentionPct,
      config.billingCycle
    )
    setPlan(cf)
  }

  function setConf(k: string, v: number) {
    setConfig(c => ({ ...c, [k]: v }))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Cash Flow"
        subtitle={`${project.name} — Monthly Cash In / Out / Running Balance`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Zap size={14} />} onClick={handleGenerate}>
              Generate
            </Button>
            {plan && (
              <div className="flex bg-surface-800 border border-surface-700 rounded-lg p-0.5">
                {(['chart','table'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      view === v ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-surface-200'
                    }`}
                  >
                    {v === 'chart' ? 'Chart' : 'Table'}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />

      {/* Config panel */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4 mb-6">
        <p className="text-xs font-medium text-brand-400 uppercase tracking-wider mb-3">
          Cash Flow Parameters
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            label="মেয়াদ (মাস)"
            type="number" min={3} max={60}
            value={config.durationMonths}
            onChange={e => setConf('durationMonths', +e.target.value)}
            suffix="মাস"
          />
          <Input
            label="Advance %"
            type="number" min={0} max={30}
            value={config.advancePct}
            onChange={e => setConf('advancePct', +e.target.value)}
            suffix="%"
            hint="চুক্তি মূল্যের %"
          />
          <Input
            label="Retention %"
            type="number" min={0} max={10}
            value={config.retentionPct}
            onChange={e => setConf('retentionPct', +e.target.value)}
            suffix="%"
            hint="প্রতি বিলে কর্তন"
          />
          <Select
            label="Billing Cycle"
            value={String(config.billingCycle)}
            onChange={e => setConf('billingCycle', +e.target.value)}
            options={[1,2,3].map(v => ({ value: String(v), label: `${v} মাস` }))}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button size="sm" icon={<RefreshCw size={13} />} onClick={handleGenerate}>
            {plan ? 'Recalculate' : 'Generate Cash Flow'}
          </Button>
        </div>
      </div>

      {/* Empty */}
      {!plan ? (
        <EmptyState
          icon={<TrendingUp size={28} />}
          title="Cash Flow তৈরি হয়নি"
          description="Parameters সেট করে Generate করুন। S-Curve distribution অনুযায়ী monthly Cash In/Out তৈরি হবে।"
          action={
            <Button icon={<Zap size={16} />} onClick={handleGenerate}>
              Generate Cash Flow
            </Button>
          }
        />
      ) : (
        <>
          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-brand-900/40 to-surface-800 border border-brand-700/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight size={14} className="text-brand-400" />
                <span className="text-xs text-surface-400 uppercase tracking-wider">Total Cash In</span>
              </div>
              <p className="text-xl font-display font-bold text-brand-400">{fmt(plan.totalCashIn)}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-900/30 to-surface-800 border border-amber-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight size={14} className="text-amber-400" />
                <span className="text-xs text-surface-400 uppercase tracking-wider">Total Cash Out</span>
              </div>
              <p className="text-xl font-display font-bold text-amber-400">{fmt(plan.totalCashOut)}</p>
            </div>
            <div className={`bg-gradient-to-br ${
              plan.netProfit >= 0 ? 'from-emerald-900/30 border-emerald-800/40' : 'from-red-900/30 border-red-800/40'
            } to-surface-800 border rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className={plan.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                <span className="text-xs text-surface-400 uppercase tracking-wider">Net Profit</span>
              </div>
              <p className={`text-xl font-display font-bold ${
                plan.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {plan.netProfit < 0 ? '−' : '+'}{fmt(plan.netProfit)}
              </p>
            </div>
            <div className={`bg-gradient-to-br ${
              plan.peakNegative < 0 ? 'from-red-900/30 border-red-800/40' : 'from-surface-800 border-surface-700'
            } to-surface-800 border rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className={plan.peakNegative < 0 ? 'text-red-400' : 'text-surface-500'} />
                <span className="text-xs text-surface-400 uppercase tracking-wider">Peak Deficit</span>
              </div>
              <p className={`text-xl font-display font-bold ${
                plan.peakNegative < 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {plan.peakNegative < 0 ? '−' : ''}{fmt(plan.peakNegative)}
              </p>
              {plan.peakNegative < 0 && (
                <p className="text-xs text-red-400/70 mt-1">Finance প্রয়োজন হবে</p>
              )}
            </div>
          </div>

          {/* Chart or Table */}
          {view === 'chart'
            ? <CashFlowChart plan={plan} />
            : <CashFlowTable plan={plan} projectId={project.id} />
          }

          {/* Footer */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-surface-600">
              S-Curve distribution • {plan.durationMonths} মাস •
              Generated: {new Date(plan.generatedAt).toLocaleDateString('bn-BD')}
            </p>
            <Button variant="ghost" size="sm"
              onClick={() => { if (confirm('Cash Flow মুছবেন?')) clearPlan(project.id) }}>
              Clear
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
