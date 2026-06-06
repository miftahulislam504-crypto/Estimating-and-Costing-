import React from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import { ESTIMATION_CATEGORIES } from '@/store/estimationStore'
import type { ProjectEstimation } from '@/types'

const CAT_COLORS = ['#3b82f6','#10b981','#ec4899','#14b8a6','#f59e0b','#9333ea']

interface Props { estimation: ProjectEstimation }

const fmt = (n: number) => '৳ ' + Math.round(n / 1000).toLocaleString('en-BD') + 'K'

export function EstimationChart({ estimation }: Props) {
  // Category distribution pie
  const catData = ESTIMATION_CATEGORIES
    .map((cat, i) => ({
      name:  cat.label,
      nameBn: cat.labelBn,
      value: estimation.lineItems
        .filter(l => l.category === cat.id)
        .reduce((s, l) => s + l.amount, 0),
      color: CAT_COLORS[i],
    }))
    .filter(d => d.value > 0)

  // Cost component bar
  const costData = [
    { name: 'Direct Cost', value: Math.round(estimation.directCost),      fill: '#0694a2' },
    { name: 'Overhead',    value: Math.round(estimation.overheadCost),    fill: '#f59e0b' },
    { name: 'Profit',      value: Math.round(estimation.profitCost),      fill: '#10b981' },
    { name: 'Markup',      value: Math.round(estimation.markupCost),      fill: '#3b82f6' },
    { name: 'Contingency', value: Math.round(estimation.contingencyCost), fill: '#9333ea' },
    { name: 'VAT',         value: Math.round(estimation.vatAmount),       fill: '#f97316' },
  ].filter(d => d.value > 0)

  const tooltipStyle = {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    fontSize: 12,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* Category pie */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-surface-300 mb-3">Category বিভাজন</p>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={catData} cx="50%" cy="50%"
              innerRadius={48} outerRadius={78}
              dataKey="value" paddingAngle={2}
            >
              {catData.map((d, i) => (
                <Cell key={i} fill={d.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => [fmt(val), '']}
              contentStyle={tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-1 mt-1">
          {catData.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-surface-400 truncate">{d.nameBn}</span>
              <span className="text-xs font-mono text-surface-500 ml-auto">
                {((d.value / estimation.directCost) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cost components bar */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-surface-300 mb-3">খরচের উপাদান</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={costData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={v => Math.round(v / 1000) + 'K'}
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              width={72}
            />
            <Tooltip
              formatter={(val: number) => [fmt(val), 'Amount']}
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {costData.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
