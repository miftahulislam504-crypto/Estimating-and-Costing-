import React, { useState } from 'react'
import {
  ComposedChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import type { CashFlowPlan } from '@/types'

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  fontSize: 11,
}

const fmt = (n: number) => '৳ ' + Math.round(n / 1000).toLocaleString('en-BD') + 'K'

type ChartMode = 'overview' | 'breakdown' | 'scurve'

export function CashFlowChart({ plan }: { plan: CashFlowPlan }) {
  const [mode, setMode] = useState<ChartMode>('overview')

  // Overview: Cash In / Cash Out bars + Running Balance line
  const overviewData = plan.months.map(m => ({
    name:    m.label.split(' ')[0],   // "M1", "M2"...
    fullLabel: m.label,
    cashIn:  Math.round(m.cashIn / 1000),
    cashOut: Math.round(m.cashOut / 1000),
    balance: Math.round(m.runningBalance / 1000),
  }))

  // Breakdown: cost components stacked bar
  const breakdownData = plan.months.map(m => ({
    name:      m.label.split(' ')[0],
    Material:  Math.round(m.materialCost   / 1000),
    Labor:     Math.round(m.laborCost      / 1000),
    Equipment: Math.round(m.equipmentCost  / 1000),
    Overhead:  Math.round(m.overheadCost   / 1000),
    Sub:       Math.round(m.subcontractCost/ 1000),
  }))

  // S-Curve: cumulative cash in/out
  let cumIn = 0, cumOut = 0
  const sCurveData = plan.months.map(m => {
    cumIn  += m.cashIn
    cumOut += m.cashOut
    return {
      name:   m.label.split(' ')[0],
      'Cum. Cash In':  Math.round(cumIn  / 1000),
      'Cum. Cash Out': Math.round(cumOut / 1000),
    }
  })

  const tabs: { id: ChartMode; label: string }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'breakdown',  label: 'Cost Breakdown' },
    { id: 'scurve',     label: 'S-Curve' },
  ]

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
      {/* Tabs */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-surface-300">Cash Flow Chart</p>
        <div className="flex gap-1 bg-surface-900 border border-surface-700 rounded-lg p-0.5">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === t.id ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {mode === 'overview' && (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={overviewData} margin={{ left: 8, right: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis
              tickFormatter={v => v + 'K'}
              tick={{ fontSize: 10, fill: '#64748b' }}
              width={52}
            />
            <Tooltip
              formatter={(val: number, name: string) => [fmt(val * 1000), name]}
              labelFormatter={(l, p) => p?.[0]?.payload?.fullLabel ?? l}
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#e2e8f0', marginBottom: 4 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
            <Bar dataKey="cashIn"  fill="#0694a2" name="Cash In"  radius={[3,3,0,0]} barSize={14} opacity={0.85} />
            <Bar dataKey="cashOut" fill="#f59e0b" name="Cash Out" radius={[3,3,0,0]} barSize={14} opacity={0.85} />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#10b981' }}
              name="Running Balance"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Cost Breakdown stacked bar */}
      {mode === 'breakdown' && (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={breakdownData} margin={{ left: 8, right: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tickFormatter={v => v + 'K'} tick={{ fontSize: 10, fill: '#64748b' }} width={52} />
            <Tooltip
              formatter={(val: number, name: string) => ['৳ ' + (val * 1000).toLocaleString('en-BD'), name]}
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            <Bar dataKey="Material"  stackId="a" fill="#3b82f6" name="Material"    radius={[0,0,0,0]} />
            <Bar dataKey="Labor"     stackId="a" fill="#10b981" name="Labor"       radius={[0,0,0,0]} />
            <Bar dataKey="Equipment" stackId="a" fill="#f59e0b" name="Equipment"   radius={[0,0,0,0]} />
            <Bar dataKey="Overhead"  stackId="a" fill="#9333ea" name="Overhead"    radius={[0,0,0,0]} />
            <Bar dataKey="Sub"       stackId="a" fill="#ec4899" name="Subcontract" radius={[3,3,0,0]} />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* S-Curve: cumulative */}
      {mode === 'scurve' && (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={sCurveData} margin={{ left: 8, right: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tickFormatter={v => v + 'K'} tick={{ fontSize: 10, fill: '#64748b' }} width={60} />
            <Tooltip
              formatter={(val: number, name: string) => [fmt(val * 1000), name]}
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            <Area
              type="monotone"
              dataKey="Cum. Cash In"
              fill="#0694a2"
              stroke="#0694a2"
              fillOpacity={0.15}
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              dataKey="Cum. Cash Out"
              fill="#f59e0b"
              stroke="#f59e0b"
              fillOpacity={0.1}
              strokeWidth={2.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Legend note */}
      <p className="text-xs text-surface-600 text-center mt-2">
        S-Curve distribution • Values in ৳ thousands (K)
      </p>
    </div>
  )
}
