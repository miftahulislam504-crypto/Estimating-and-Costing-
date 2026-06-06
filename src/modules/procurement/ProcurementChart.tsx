import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import type { ProcurementPlan } from '@/types'

const COLORS = ['#0694a2','#3b82f6','#10b981','#f59e0b','#9333ea','#ec4899','#f97316','#14b8a6']

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  fontSize: 12,
}

export function ProcurementChart({ plan }: { plan: ProcurementPlan }) {
  // Monthly cost bar
  const monthlyData = plan.schedule.map(m => ({
    name:  `M${plan.schedule.indexOf(m) + 1}`,
    label: m.label,
    cost:  Math.round(m.totalCost),
  }))

  // Material cost distribution pie
  const materialData = plan.items.map((item, i) => ({
    name:  item.materialBn,
    value: Math.round(item.totalCost),
    color: COLORS[i % COLORS.length],
  }))

  const totalCost = plan.totalCost

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Monthly cost bar */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-surface-300 mb-3">Monthly Procurement Cost</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} margin={{ left: 0, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis
              tickFormatter={v => Math.round(v / 1000) + 'K'}
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(val: number) => ['৳ ' + val.toLocaleString('en-BD'), 'Cost']}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.label ?? label}
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="cost" fill="#0694a2" radius={[4, 4, 0, 0]} name="Cost ৳" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Material distribution pie */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-surface-300 mb-3">Material Cost বিভাজন</p>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={materialData}
              cx="50%" cy="50%"
              innerRadius={40} outerRadius={65}
              dataKey="value" paddingAngle={2}
            >
              {materialData.map((d, i) => (
                <Cell key={i} fill={d.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => ['৳ ' + val.toLocaleString('en-BD'), '']}
              contentStyle={tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
          {materialData.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-surface-400 truncate">{d.name}</span>
              <span className="text-xs font-mono text-surface-600 ml-auto">
                {totalCost > 0 ? ((d.value / totalCost) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
